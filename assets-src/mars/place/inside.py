"""The canyon's inside on the made ground of the place: the cast shade of the heights, crisp (MAIL 1484 point 2).

The plates hold the cast shade of the canyon as a soft dark mass: bodylead.py --shadow and walls.py blur the heights'
cast shadow on a grid of 1024 (sigma 3.0: 0.12 km at 0.7 degrees, 0.28 at 1.6, 0.66 at 3.8), countrytake.py fits a take
to its lead over 12 px of 1254, and walls.py keeps the take's tone coarser than broadKm. Measured on the plates
(median luma by the distance to the shadow line of the heights, inside the canyon, 0.7 degrees): 13 from 3 km to 0.8 km
inside the shade, 19 at 0.4 km, 27 at 0.075 km, 39 just outside, 51 from 0.25 km on: a ramp about 1 km wide where the
Sun (0.35 degrees wide) draws a line.

This tool reads the baked plates and the heights as the cap draws them (walls.as_drawn) and puts the line back:

  shade   the cast shadow of the heights at the plate's own texels, marched to shadowKm with the Sun's own size.
  tones   about every texel the plate's own lit tone and its own shade tone: the mean of the plate (scene values) over
          the texels that the heights call lit, and over those they call shaded, each at least litKm or shadeKm from the
          line (where the plate stands on its plateau), within toneKm. No tone is brought from outside: the shade keeps
          the level the plate holds there.
  line    within the band about the line the plate's tone between those two is read as the soft shade and replaced by
          the crisp one: colour = plate * (shade tone + c * (lit tone - shade tone)) / (shade tone + s * (lit - shade)),
          c the crisp shade (1 lit), s the share the plate itself shows (its tone at grainTexels between the two tones).
          On the lit side over the whole of the plate's soft border, up to the ground the plate itself holds lit (gap), and
          that border takes the ground of the lit plate beside it; where no lit ground of the plate is near, the dark
          is the plate's own. A shade of the heights that is nowhere shadeKm deep has no tone of its own: it stays the plate's.
          Texture finer than grainTexels and every tone outside the two stays the plate's. Where the light of a texel
          turns, the grain is the plate's light alone (within `grain`) in the colour of the new tone.
  form    in the shade the light is the open sky's (the fill): what a texel sees of the sky by the heights
          (walls.skylight, the same law as the wall law), over skyRef, the mean of it over the shade of the made canyon
          (measured, one number for all levels, so that no level steps to the next and the mean level of the shade does
          not move). A floor open to the sky is lighter than the wall over it and than the foot of a wall; a shallow
          pit is lighter than the deep floor.
  where   below the rim (country.light.rock fromKm to toKm of the heights) and the lip about it (lipKm), not where the
          plate is the picture's ground itself (bodyfull.py: the field that the approved picture shows from straight
          above, heights.py --picture-only, with its share, within airKm of the picture's eye). There the shade is the
          picture's and is not the heights' everywhere: a line drawn there by the heights cut black gashes into the
          picture's lit ground (trial of 26 November). Beyond airKm the plate's tone in that field is the take's
          (bodyfull.py lays only the picture's forms there) and the law holds as on the made ground.

Run on the full plates after walls.py and before pyramid.py (each level is then made from the level under it):

  python3 assets-src/mars/place/inside.py --dir public/assets/mars/full --out out/work/place/inside/full [--levels 0.3,0.7,1.6,3.8] [--sheet DIR]
  python3 assets-src/mars/place/pyramid.py --dir out/work/place/inside/full --over public/assets/mars/full --out out/work/place/inside/pyr
  python3 assets-src/mars/place/webplates.py --dir (the full plates with the written ones) --out out/work/place/inside/web

Values: plates.json takes.castShade. The heights' fields are kept in out/work/place/inside/F<width>.npz, the picture's
field in seen-<width>.png there (read from --top TOPP, the stems t<width> of RECIPE.md "The picture's own ground on the
plates", when they stand).
"""
import argparse
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
import geom  # noqa: E402
import walls  # noqa: E402
import countrytake as ct  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
R = 3389.5
LUMA = np.float32([0.2126, 0.7152, 0.0722])


def sm(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def to_scene(v):
    v = v / 255.0
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4).astype(np.float32)


def to_code(v):
    v = np.clip(v, 0, 1)
    return (np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055) * 255.0).astype(np.float32)


def fields(width, n, P, doc, folder, keep):
    """Heights as drawn (km) and the crisp cast shade (1 lit) at the n * n texels of a plate `width` degrees wide."""
    path = os.path.join(keep, 'F%g.npz' % width)
    if os.path.exists(path):
        z = np.load(path)
        if z['h'].shape[0] == n:
            return z['h'].astype(np.float32), z['op'].astype(np.float32) / 255
    Lg = P['country']['light']
    V = P['takes']['castShade']
    H = ct.Heights(folder, doc)
    feather = doc['edgeShare']
    sun = geom.scene_sun(Lg['sunMoment'])
    flat = float(np.hypot(sun[0], sun[1]))
    t = ct.half(width)
    at = ((np.arange(n) + 0.5) / n * 2 - 1) * t
    x = np.broadcast_to(at[None, :], (n, n)).astype(np.float32)
    y = np.broadcast_to(-at[:, None], (n, n)).astype(np.float32)
    h0 = walls.as_drawn(H, x, y, width, feather)
    op = np.ones((n, n), np.float32)
    size = np.radians(Lg['sunSizeDeg'])
    tex = 2 * t / n
    for u in np.geomspace(tex, Lg['shadowKm'] / R, V['steps']):
        occ = walls.as_drawn(H, x + np.float32(sun[0] / flat * u), y + np.float32(sun[1] / flat * u), width, feather)
        op = np.minimum(op, np.clip(0.5 + (h0 + u * sun[2] / flat - occ) / max(u * size, 0.5 * tex), 0, 1))
    os.makedirs(keep, exist_ok=True)
    np.savez_compressed(path, h=(h0 * R).astype(np.float16), op=(op * 255).astype(np.uint8))
    return (h0 * R).astype(np.float32), op


def blur(a, sigma):
    """Gaussian mean; a wide one on a reduced grid."""
    if sigma <= 12:
        return cv2.GaussianBlur(a, (0, 0), sigma)
    f = int(sigma // 6)
    n = a.shape[0]
    m = max(n // f, 8)
    small = cv2.resize(a, (m, m), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma * m / n)
    return cv2.resize(small, (n, n), interpolation=cv2.INTER_LINEAR)


def nearest(mask):
    """Texels to the nearest texel of mask, and that texel's flat index."""
    src = (~mask).astype(np.uint8)
    dist, lab = cv2.distanceTransformWithLabels(src, cv2.DIST_L2, cv2.DIST_MASK_5, labelType=cv2.DIST_LABEL_PIXEL)
    idx = np.flatnonzero(src.ravel() == 0)
    return dist, idx[lab.ravel() - 1].reshape(mask.shape)


def tone_of(lin, mask, sigma):
    """The mean of lin over mask about every texel within sigma; where the mask is far, within 4 sigma; then the mask's mean."""
    m = mask.astype(np.float32)
    whole = (lin * m[:, :, None]).sum(axis=(0, 1)) / max(float(m.sum()), 1.0)
    out = np.empty_like(lin)
    d1, d2 = blur(m, sigma), blur(m, sigma * 4)
    a1, a2 = sm(d1 / 0.1), sm(d2 / 0.05)
    for c in range(3):
        t1 = blur(lin[:, :, c] * m, sigma) / np.maximum(d1, 1e-4)
        t2 = blur(lin[:, :, c] * m, sigma * 4) / np.maximum(d2, 1e-4)
        t2 = whole[c] + (t2 - whole[c]) * a2
        out[:, :, c] = t2 + (t1 - t2) * a1
    return out


def level(width, name, args, P, doc):
    V = P['takes']['castShade']
    Lg = P['country']['light']
    key = '%g' % width
    f = Image.open(os.path.join(args.dir, name))
    keep = (dict(f.quantization), JpegImagePlugin.get_sampling(f))
    code = np.asarray(f.convert('RGB')).astype(np.float32)
    n = code.shape[0]
    km = 2 * ct.half(width) * R / n
    h, c = fields(width, n, P, doc, args.heights, args.keep)
    lin = to_scene(code)
    shade = (c < 0.5).astype(np.uint8)
    to_shade, at_shade = nearest(shade > 0)
    d = (to_shade - cv2.distanceTransform(shade, cv2.DIST_L2, 5)) * km
    m_s, m_l, tone_km = V['shadeKm'][key], V['litKm'][key], V['toneKm'][key]
    t_lit = tone_of(lin, d > m_l, tone_km / km)
    t_sh = tone_of(lin, d < -m_s, tone_km / km)
    y_lit, y_sh = t_lit @ LUMA, t_sh @ LUMA
    apart = sm((y_lit / np.maximum(y_sh, 1e-6) - V['apart'][0]) / (V['apart'][1] - V['apart'][0]))
    # a shade of its own: a shade of the heights that is nowhere shadeKm deep (a small pit, a notch) holds no texel on
    # which the plate could stand on a shade tone of its own; drawn with the canyon's tone it is a black oval without a
    # foot (lead of 26 November, east of the canyon's tip at 2448). It and the line about it stay the plate's.
    count, labels = cv2.connectedComponents(shade, connectivity=8)
    deepest = np.zeros(count, np.float32)
    np.maximum.at(deepest, labels.ravel(), (-d).ravel())
    has = deepest >= m_s
    has[0] = False
    own_shade = has[labels.ravel()[at_shade.ravel()]].reshape(n, n).astype(np.float32)   # of a texel in the shade: its own; of a lit texel: the nearest shade's
    own_shade = cv2.GaussianBlur(own_shade, (0, 0), 2 * V['grainTexels'])   # a share, not a picture: no cut where the nearest shade changes
    del labels
    g = cv2.GaussianBlur(lin @ LUMA, (0, 0), V['grainTexels'])
    s = np.clip((g - y_sh) / np.maximum(y_lit - y_sh, 1e-6), 0, 1)
    # where: below the rim and the lip about it, not the picture's own ground
    rock = Lg['rock']
    below = sm((rock['fromKm'] - h) / (rock['fromKm'] - rock['toKm']))
    r = int(round(V['lipKm'][key] / km))
    grown = cv2.dilate((below > 0.5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    where = np.maximum(below, sm(blur(grown.astype(np.float32), max(r / 3, 1)) * 2 - 0.5))
    own = os.path.join(args.keep, 'seen-%s.png' % key)
    if args.top and os.path.exists(os.path.join(args.top, 't%s-height.npy' % key)):
        Image.fromarray((np.isfinite(np.load(os.path.join(args.top, 't%s-height.npy' % key))) * 255).astype(np.uint8)).save(own)
    seen = (np.asarray(Image.open(own)) > 127).astype(np.float32)
    assert seen.shape[0] == n, 'heights.py --picture-only --size %d wanted for %s degrees' % (n, key)
    seen = sm((cv2.GaussianBlur(seen, (0, 0), P['takes']['bodyFull']['softTexels']) - 0.5) * 2) * seen   # the share of bodyfull.py
    B = P['takes']['bodyFull']
    o = np.array(geom.load()['dive']['terrain']['origin'])
    ro = float(np.linalg.norm(o))
    e0, n0, _ = geom.to_patch((o / ro)[None, :])
    at = ((np.arange(n) + 0.5) / n * 2 - 1) * geom.half_tan(width)
    far = np.sqrt((at[None, :] - e0[0]) ** 2 + (-at[:, None] - n0[0]) ** 2 + (h / R - (ro - 1)) ** 2) * R
    near = 1 - sm((far - B['airKm'][0]) / (B['airKm'][1] - B['airKm'][0]))   # bodyfull.py: there the plate is the picture's ground itself
    if not args.own:
        where = where * (1 - seen * near)
    where = where.astype(np.float32)
    # line
    # the shade side: whole to bandFrom of shadeKm from the line, none from shadeKm on.
    # the lit side: between the heights' line and the ground the plate itself holds lit lies the plate's soft border, as
    # wide as the take drew it (0.7 degrees: 0.57 km at the mound north of the spot, x 1850 to 2490, y 560 to 860). The
    # law is whole over all of it: where the way from the line over a texel to the plate's nearest lit ground (the share
    # of lit tone at least agree[1]) is at most gap[0] of litKm, none from gap[1]. A fixed band of litKm ended inside
    # that border and left its far half dim (the brown band of the lead of 26 November). Where no lit ground of the
    # plate is near, the dark is the plate's own (a slope the take painted in shade) and stays.
    plate_lit = (cv2.GaussianBlur(s, (0, 0), V['grainTexels']) >= V['agree'][1]) & (d > 0)
    to_lit, at_lit = nearest(plate_lit)
    way = (d + to_lit * km) / m_l
    band = np.where(d < 0, 1 - sm((-d / m_s - V['bandFrom']) / (1 - V['bandFrom'])), 1 - sm((way - V['gap'][0]) / (V['gap'][1] - V['gap'][0]))).astype(np.float32)
    on_line = (d > 0) & (d < 1.5 * km) & (where > 0.5) & (own_shade > 0.5)
    gaps = np.percentile(to_lit[on_line] * km, [50, 75, 90, 95]) if on_line.any() else np.zeros(4)
    del way, plate_lit
    # the ground of that border: the plate holds shade paint there, with no ground in it. It takes the ground of the lit
    # plate beside it, moved and not bent: the plate's colour over its own tone at the texel one width of the border
    # farther toward the plate's lit ground (the width: from the line over the texel to the nearest lit ground, at most
    # gap[1] of litKm; the direction: down the slope of the distance to that ground), width and distance both smoothed
    # over gapSmooth of that most width so that the ground is carried whole, within gapGrain. Tried on 26 November and
    # thrown away: over the nearest lit texel itself (rays and teeth, the nearest texel jumps along a ragged border),
    # along the normal of the heights' line (rays wherever the plate's lit ground does not lie along that normal) and
    # mirrored over the plate's lit border with the distance smoothed over 8 texels (ground bent to marble).
    span = V['gap'][1] * m_l / km
    reach = cv2.GaussianBlur(to_lit, (0, 0), V['gapSmooth'] * span)
    gx, gy = cv2.Sobel(reach, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(reach, cv2.CV_32F, 0, 1, ksize=3)
    norm = np.maximum(np.sqrt(gx * gx + gy * gy), 1e-6)
    wide = cv2.GaussianBlur(np.minimum(np.maximum(d, 0) / km + to_lit, span).astype(np.float32), (0, 0), V['gapSmooth'] * span)
    jj, ii = np.meshgrid(np.arange(n, dtype=np.float32), np.arange(n, dtype=np.float32))
    mx, my = (jj - gx / norm * wide).astype(np.float32), (ii - gy / norm * wide).astype(np.float32)
    del wide
    del jj, ii, at_lit, to_lit, reach, gx, gy, norm
    k = (where * band * apart * own_shade)[:, :, None]
    old = t_sh + s[:, :, None] * (t_lit - t_sh)
    new = t_sh + c[:, :, None] * (t_lit - t_sh)
    # the plate's grain over its old tone; where the light of a texel turns (the plate held shade and the heights hold light,
    # or the other way) the grain is the plate's light alone, held within `grain`, and the colour is the new tone's: shade
    # paint times the lit tone is grey ground with the noise of the dark raised (trial of 26 November, 0.7 degrees)
    grain_all = lin / np.maximum(old, 1e-6)
    grain_y = np.clip((lin @ LUMA) / np.maximum(old @ LUMA, 1e-6), V['grain'][0], V['grain'][1])[:, :, None]
    grain_lit = np.clip(cv2.remap(grain_all, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), V['gapGrain'][0], V['gapGrain'][1])
    del mx, my
    turn = np.abs(c - s)[:, :, None]
    out = lin + k * (new * (grain_all * (1 - turn) + np.where((d > 0)[:, :, None], grain_lit, grain_y) * turn) - lin)
    del grain_lit, grain_all
    # form: the open sky in the shade
    W = P['takes']['walls']
    og = min(n, V['openGrid'])
    sky = walls.skylight(cv2.resize(h, (og, og), interpolation=cv2.INTER_AREA), km * n / og, W['openKm'], W['openSteps'])
    sky = np.maximum(cv2.resize(sky, (n, n), interpolation=cv2.INTER_LINEAR), W['skyLeast'])
    inshade = (1 - c) * where * own_shade
    form = np.clip(sky / V['skyRef'], V['form'][0], V['form'][1])
    form = 1 + (form - 1) * V['formShare']
    out = out * (1 + inshade[:, :, None] * (form[:, :, None] - 1))
    sky_mean = float((sky * inshade).sum() / max(float(inshade.sum()), 1.0))
    # take: the forms of a take of the inside (walls, spurs, gullies, talus, the floor), as light about the take's own mean on
    # each side of the heights' line. The line, the tone and the level of the shade stay the law's: no tone comes from the take.
    if key in args.takes:
        T = V['take']
        tk = to_scene(cv2.resize(np.asarray(Image.open(args.takes[key]).convert('RGB')).astype(np.float32), (n, n), interpolation=cv2.INTER_CUBIC))
        sig = T['meanKm'] / km
        lit_side = (c >= 0.5).astype(np.float32)
        den_l, den_s = np.maximum(blur(lit_side, sig), 1e-3), np.maximum(blur(1 - lit_side, sig), 1e-3)
        ty = tk @ LUMA
        my_l, my_s = blur(ty * lit_side, sig) / den_l, blur(ty * (1 - lit_side), sig) / den_s
        # the take's own light must agree with the heights' line: where the take drew light in the heights' shade or shade in
        # the heights' light, its form is not laid
        st = np.clip((cv2.GaussianBlur(ty, (0, 0), V['grainTexels']) - my_s) / np.maximum(my_l - my_s, 1e-6), 0, 1)
        same = 1 - sm((np.abs(st - c) - T['same'][0]) / (T['same'][1] - T['same'][0]))
        lay = where * same * sm((below - 0.5) * 2 + 0.5) * T['share']
        lay = lay * own_shade
        ratio = np.empty_like(out)
        for ch in range(3):
            mean = np.where(lit_side > 0.5, blur(tk[:, :, ch] * lit_side, sig) / den_l, blur(tk[:, :, ch] * (1 - lit_side), sig) / den_s)
            ratio[:, :, ch] = np.clip(tk[:, :, ch] / np.maximum(mean, 1e-5), T['clip'][0], T['clip'][1])
        # even about 1: the take's light over its mean is divided by its own mean over what is laid, on its side of the line
        # within meanKm, so that the mean light of the shade and of the lit ground stays the law's (the clip is not even
        # and the take lifts its shade: laid as it came the shade fell by 1.1 levels and the lit ground rose by 1.2).
        # Nothing changes where nothing is laid.
        ry = ratio @ LUMA
        wl, ws = lay * lit_side, lay * (1 - lit_side)
        even = np.where(lit_side > 0.5, blur(ry * wl, sig) / np.maximum(blur(wl, sig), 1e-3), blur(ry * ws, sig) / np.maximum(blur(ws, sig), 1e-3))
        even = np.where(lay > 1e-3, np.maximum(even, 1e-3), 1)
        out = out * (1 + lay[:, :, None] * (ratio / even[:, :, None] - 1))
        del ratio, ry, even, wl, ws
        print('%g deg: take %s laid on %.3f of the plate' % (width, args.takes[key], float((lay > 0.5).mean())), flush=True)
    res = np.clip(to_code(out) + 0.5, 0, 255).astype(np.uint8)
    os.makedirs(args.out, exist_ok=True)
    Image.fromarray(res).save(os.path.join(args.out, name[:-4] + '.png'))   # without loss: pyramid.py --over lays the change on the baked plate
    inside = where > 0.5
    ys = (code @ LUMA)
    yn = (res.astype(np.float32) @ LUMA)
    print('%g deg, %d texels, %.4f km a texel: where on %.3f of the plate, in shade %.3f of it; luma there in shade %.2f before, %.2f after; lit %.2f before, %.2f after; texels changed by over 2 levels: %.3f of the plate; open sky in the shade: mean %.3f, over skyRef 5th to 95th %.2f to %.2f; shades of the heights %d, with a shade of their own %d; lit ground of the plate from the line, km: median %.2f, 75th %.2f, 90th %.2f, 95th %.2f' % (
        width, n, km, inside.mean(), (inside & (c < 0.5)).mean() / max(inside.mean(), 1e-6), ys[inside & (c < 0.5)].mean(), yn[inside & (c < 0.5)].mean(), ys[inside & (c >= 0.5)].mean(), yn[inside & (c >= 0.5)].mean(),
        (np.abs(yn - ys) > 2).mean(), sky_mean, *np.percentile(form[inside & (c < 0.5)], [5, 95]), count - 1, int(has.sum()), *gaps), flush=True)
    if args.sheet:
        os.makedirs(args.sheet, exist_ok=True)
        q = 1024
        def red(a):
            return cv2.resize(a, (q, q), interpolation=cv2.INTER_AREA)
        hs = np.clip((h - h.min()) / max(float(h.max() - h.min()), 1e-6) * 255, 0, 255)
        row = np.concatenate([red(code), red(res.astype(np.float32)), np.repeat(red(c * 255)[:, :, None], 3, 2), np.repeat(red(where * 255)[:, :, None], 3, 2), np.repeat(red(hs)[:, :, None], 3, 2)], axis=1)
        Image.fromarray(np.clip(row, 0, 255).astype(np.uint8)).save(os.path.join(args.sheet, 'above-%s.jpg' % key), quality=92)
        np.savez_compressed(os.path.join(args.sheet, 'k-%s.npz' % key), k=(k[:, :, 0] * 255).astype(np.uint8), d=np.clip(d * 20 + 128, 0, 255).astype(np.uint8))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--levels', default='0.3,0.7,1.6,3.8')
    ap.add_argument('--heights', default=os.path.join(ROOT, 'public', 'assets', 'mars', 'full'))
    ap.add_argument('--keep', default=os.path.join(ROOT, 'out', 'work', 'place', 'inside'))
    ap.add_argument('--sheet')
    ap.add_argument('--top', help='the stems of heights.py --picture-only (t<width>-height.npy), as bodyfull.py reads them')
    ap.add_argument('--own', action='store_true', help='test: also where the plate holds the picture\'s own ground')
    ap.add_argument('--take', action='append', default=[], help='WIDTH=FILE: a take of the inside for that level (led by the result of this tool without it)')
    args = ap.parse_args()
    args.takes = dict(('%g' % float(t.split('=')[0]), t.split('=')[1]) for t in args.take)
    P = json.load(open(os.path.join(HERE, 'plates.json')))
    doc = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json')))
    names = {l['widthDeg']: l['file'] for l in json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json')))['levels'] if l.get('own')}
    for w in [float(v) for v in args.levels.split(',')]:
        level(w, names[w], args, P, doc)


if __name__ == '__main__':
    main()
