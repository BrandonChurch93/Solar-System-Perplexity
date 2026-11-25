"""The land levels take the globe's own relief from the level above them (MAIL 596: a level is made from the level under it).

patch-19.jpg is the globe's own map of the country round the place; land-8p5.jpg was a made plain where the map has scarps and
ridges, so the two were exchanged in place when the globe went from one to the other (dive 2437 to 2441, rise 2707 to 2711).
Here the forms of the map stay through every land level: outside the place each land plate keeps its own broad tone and its own
fine grain, and the forms between (from one texel of patch-19 up to `broadTexels` of them) are the map's.

  field = weight * (log(P / broad(P)) - log(fine(O) / broad(O)))     P the map under land-8p5, O land-8p5, luminance
  plate = plate * exp(field at its place)                             the same field for all five plates

At the place it runs the other way: the lit levels above (patch-19, patch-42, patch-wide) take the forms of the place from
land-8p5 with the rest of the weight, out to aboveDeg from the spot and no farther (MEASURED: the hold 2325 and the end of the
rise 2760 do not draw these levels within 1.5 degrees of the spot), so the place is on the globe from the first level that can
show it and no level shows another ground than the one under it.

  above = (1 - weight) * near * (log(fine(O) / broad(O)) - log(P / broad(P)))
  patch = patch * exp(above at its place, reduced to its scale)

The weight is 0 at the place (within keepDeg of the spot, the close view's own ground and its aprons as laid) and on the made
canyon and the main trough (ground lower than depthKm under the plateau round it, from country-8p5.bin), 1 beyond fullDeg: a
border on the ground. Values: plates.json block under.

  python3 assets-src/mars/place/landunder.py --dir DIR --out OUT [--set full]
"""
import argparse
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
RADIUS_KM = 3389.5


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom  # noqa: E402


def half(width):
    return math.tan(math.radians(width) / 2)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def lum(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True, help='the five land plates')
    ap.add_argument('--out', required=True)
    ap.add_argument('--set', default='full')
    ap.add_argument('--plates', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json'))
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json'))
    ap.add_argument('--look', default='')
    ap.add_argument('--base', default='', help='folder of the levels above the land and of country-8p5.bin as they stand before this step (default: the set in public)')
    args = ap.parse_args()
    K = json.load(open(args.plates))['under']
    T = json.load(open(args.plates))['takes']
    LIGHT = json.load(open(args.plates))['country']['light']
    levels = json.load(open(args.json))['levels']
    own = [l for l in levels if l.get('own')]
    above = levels[levels.index(own[0]) - 1]
    base = args.base or os.path.join(ROOT, 'public', 'assets', 'mars', args.set)
    os.makedirs(args.out, exist_ok=True)
    top = Image.open(os.path.join(args.dir, own[0]['file']))
    O = np.asarray(top.convert('RGB')).astype(np.float32)
    n = O.shape[0]
    P0 = np.asarray(Image.open(os.path.join(base, above['file'])).convert('RGB')).astype(np.float32)
    pn = P0.shape[0]
    m = pn * half(own[0]['widthDeg']) / half(above['widthDeg'])
    texel = n / m  # px of land-8p5 a texel of the map
    M = np.float32([[texel, 0, -texel * (pn - m) / 2 + (texel - 1) / 2], [0, texel, -texel * (pn - m) / 2 + (texel - 1) / 2]])
    P = cv2.warpAffine(P0, M, (n, n), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    lp, lo = np.maximum(lum(P), 1.0), np.maximum(lum(O), 1.0)
    sb, sf = K['broadTexels'] * texel, K['fineTexels'] * texel
    form = np.log(lp / cv2.GaussianBlur(lp, (0, 0), sb))
    # the weight on the ground: distance from the spot, and the made canyon and the trough from the heights
    per = n / (2 * half(own[0]['widthDeg']))
    at = (np.arange(n, dtype=np.float32) + 0.5 - n / 2) / per
    deg = np.degrees(np.arctan(np.hypot(at[None, :], at[:, None])))
    w = smooth((deg - K['keepDeg']) / (K['fullDeg'] - K['keepDeg']))
    C = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json')))['levels'][0]
    size = C['size'][args.set]
    hgt = np.fromfile(os.path.join(base, C['height']), np.uint16).reshape(size, size).astype(np.float32)
    hgt = (C['low'] + hgt / 65535 * (C['high'] - C['low'])) * RADIUS_KM
    cell = size / (2 * half(C['widthDeg']))  # texels a unit of the plane
    k = max(3, int(round(math.tan(math.radians(K['plateauDeg'])) * cell)) | 1)
    plateau = cv2.GaussianBlur(cv2.dilate(hgt, np.ones((k, k), np.uint8)), (0, 0), k / 2)
    deep = smooth((plateau - hgt - K['depthKm'][0]) / (K['depthKm'][1] - K['depthKm'][0]))
    r = max(1, int(round(math.tan(math.radians(K['besideDeg'])) * cell)))
    deep = cv2.GaussianBlur(cv2.dilate(deep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))), (0, 0), r)
    w = w * (1 - cv2.resize(deep, (n, n), interpolation=cv2.INTER_LINEAR))
    # the broad tone of the land is that of its plateau: the made canyon and the trough are left out of the mean, so that
    # no pale rim stands beside them in the forms
    flat = cv2.resize(1 - deep, (n, n), interpolation=cv2.INTER_LINEAR) + 0.02
    broad = cv2.GaussianBlur(lo * flat, (0, 0), sb) / cv2.GaussianBlur(flat, (0, 0), sb)
    was = np.log(np.maximum(cv2.GaussianBlur(lo, (0, 0), sf), 1.0) / broad)
    near = 1 - smooth((deg - K['aboveDeg'][0]) / (K['aboveDeg'][1] - K['aboveDeg'][0]))
    above = np.clip((1 - w) * near * (was - form), math.log(K['gain'][0]), math.log(K['gain'][1])).astype(np.float32)
    field = np.clip(w * (form * K['share'] - was), math.log(K['gain'][0]), math.log(K['gain'][1])).astype(np.float32)
    print('field on %s: weight over 0.5 on %.3f of it, mean abs %.3f, 99th percentile %.3f (log gain)' % (own[0]['file'], float((w > 0.5).mean()), float(np.abs(field).mean()), float(np.percentile(np.abs(field), 99))))
    if args.look:
        cv2.imwrite(args.look, np.clip(128 + field * 128, 0, 255).astype(np.uint8))
    for l in levels[:levels.index(own[0])]:
        f = Image.open(os.path.join(base, l['file']))
        q, s = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        pic = np.asarray(f.convert('RGB')).astype(np.float32)
        c = pic.shape[0]
        mm = int(round(c * half(own[0]['widthDeg']) / half(l['widthDeg']) / 2)) * 2
        x0 = (c - mm) // 2
        g = np.exp(cv2.resize(above, (mm, mm), interpolation=cv2.INTER_AREA))
        before = pic.copy()
        pic[x0:x0 + mm, x0:x0 + mm] *= g[..., None]
        out = np.clip(pic + 0.5, 0, 255).astype(np.uint8)
        same = np.abs(out.astype(np.int16) - np.clip(before + 0.5, 0, 255).astype(np.int16)).max(2) == 0
        out[same] = np.asarray(f.convert('RGB'))[same]
        Image.fromarray(out).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
        ys, xs = np.nonzero(~same)
        reach = math.degrees(math.atan(max(abs(xs - c / 2).max(), abs(ys - c / 2).max()) / (c / (2 * half(l['widthDeg'])))))
        print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])), 'changed on %d texels, out to %.2f degrees from the spot, gain %.2f to %.2f' % (len(xs), reach, float(g.min()), float(g.max())))
    for l in own:
        f = Image.open(os.path.join(args.dir, l['file']))
        q, s = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        pic = np.asarray(f.convert('RGB')).astype(np.float32)
        c = pic.shape[0]
        mm = n * half(l['widthDeg']) / half(own[0]['widthDeg'])
        z = c / mm
        A = np.float32([[z, 0, -z * (n - mm) / 2 + (z - 1) / 2], [0, z, -z * (n - mm) / 2 + (z - 1) / 2]])
        g = np.exp(cv2.warpAffine(field, A, (c, c), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT))
        if T.get('regionMost'):
            # the forms may not lift a plate over what a take itself may stand over the plateau's own colour (takes.regionMost and
            # takes.brightest, countrytake.py take_light): the cap lights the plate again, and ground lifted by the forms stood as
            # glowing red on the far plateau (MAIL 849, b). Soft, and never under what the plate held before the forms.
            wl = np.array([0.2126, 0.7152, 0.0722], np.float32)
            floor = float(np.dot(LIGHT['plateau'], wl))
            top = T['regionMost'] + T.get('brightest', LIGHT['brightest'])
            had = np.log(np.maximum(geom.scene_of(pic / 255.0).astype(np.float32) @ wl, 1e-5) / floor)
            S = geom.scene_of(np.clip(pic * g[..., None], 0, 255) / 255.0).astype(np.float32)
            over = np.log(np.maximum(S @ wl, 1e-5) / floor)
            held = np.where(over > 0, np.maximum(top * np.tanh(over / top), np.minimum(over, had)), over)
            pic = geom.texel_of(S * np.exp(held - over)[..., None]) * 255
            g = np.ones_like(g)
        out = np.clip(pic * g[..., None] + 0.5, 0, 255).astype(np.uint8)
        Image.fromarray(out).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
        print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])), 'gain %.2f to %.2f' % (float(g.min()), float(g.max())))


if __name__ == '__main__':
    main()
