"""ONE BODY (MAIL 1056): the approved picture seen from straight above is the ground of the land plates over the picture's own field.

The close set (the approved picture on its own meshes) comes over the plates' ground as the eye falls. Where the plates held
a take's picture of that ground the frame showed another picture replaced: a stretched smear of the coarse level turned into
fine canyon relief. Here every plate takes the picture's own ground wherever the picture shows ground from above (the stems
of --top, made by heights.py --picture-only: the picture alone, without its margins and without its aprons, since those are
drawn out of the picture's border and are streaks from above), not only where a picture pixel is as fine as the finest texel
and the air is thin (countrytake.body_share, which stays the lead's rule):

  near   = near the picture's eye, where its air is thin (airKm: whole within the first distance, none from the second on, the
           limit measured for takes.body), the plate is the picture's ground itself, with no limit by the size of a texel.
  beyond = the picture's far ground is mostly its air, and the dark envelope by distance (air.*: the darkest `percentile` of
           the linear light in bins of the distance) does not take it out where the far ground holds no black: the picture's
           colour laid there is a pale wedge on the plate (trial 1, thrown away). So beyond the thin air the plate keeps the
           take's broad tone (over forms.broadKm of ground) and its hue, and takes the picture's forms: the log of the
           picture's light less its own broad mean, raised by 1 / pass (pass = 1 - air / broad light, never under
           air.leastPass), held within forms.most.
  grain  = where a picture pixel covers more than one texel of the plate (reach) the picture has no finer form than that
           pixel: the take's grain under that size is kept (log take - blur(log take, sigma = reach * split.sigmaPerReach),
           within split.clip), near and beyond alike. Where a picture pixel is finer than a texel there is no grain of the take.
  border = soft over `softTexels` texels inward from the border of what the picture shows; outside it the plate is the take.

Not done by this tool: the set's margins and aprons still show drawn out ground where the plate holds the take (MAIL 1071
point 4), and the plate's far ground keeps the take's tone where the picture holds its painted air (point 3).

No take is made. Values: plates.json takes.bodyFull. The pyramid (pyramid.py) and landunder.py run after it as before.

  python3 assets-src/mars/place/bodyfull.py --dir STAGE_A --out OUT --top out/work/place/topp [--levels 0.3,0.7] [--look DIR]
"""
import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

import geom
import countrytake as ct

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = 3389.5
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def eye_distance(width, c, hgt):
    """Distance of every plate texel's ground from the picture's eye, km."""
    o = np.array(geom.load()['dive']['terrain']['origin'])
    r = float(np.linalg.norm(o))
    e0, n0, _ = geom.to_patch((o / r)[None, :])
    at = ((np.arange(c) + 0.5) / c * 2 - 1) * geom.half_tan(width)
    return (np.sqrt((at[None, :] - e0[0]) ** 2 + (-at[:, None] - n0[0]) ** 2 + (np.where(np.isfinite(hgt), hgt, 0) - (r - 1)) ** 2) * R).astype(np.float32)


def air_law(top, B):
    """The picture's air by distance, measured on the widest top view that holds the set: (km, light per colour), far light."""
    w, c = B['air']['measureDeg'], B['air']['measureSize']
    stem = os.path.join(top, 't%g' % w)
    hgt = np.load(stem + '-height.npy')
    assert hgt.shape[0] == c
    seen = np.isfinite(hgt)
    lin = geom.to_linear(np.asarray(Image.open(stem + '-colour.png').convert('RGB')).astype(np.float32) / 255)
    far = eye_distance(w, c, hgt)
    edges = B['air']['binsKm']
    at, light = [], []
    for a, b in zip(edges[:-1], edges[1:]):
        m = seen & (far >= a) & (far < b)
        if m.sum() < 2000:
            continue
        at.append(np.sqrt(a * b))
        light.append(np.percentile(lin[m], B['air']['percentile'], axis=0))
    light = np.maximum.accumulate(np.array(light), axis=0)
    last = seen & (far >= np.percentile(far[seen], 100 * (1 - B['air']['farShare'])))
    end = np.median(lin[last], axis=0)
    return np.array(at), light, end


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--top', required=True)
    ap.add_argument('--levels', default='')
    ap.add_argument('--look', default='')
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json'))
    a = ap.parse_args()
    B = json.load(open(os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json')))['takes']['bodyFull']
    country = json.load(open(a.json))
    only = [s for s in a.levels.split(',') if s]
    os.makedirs(a.out, exist_ok=True)
    km, light, end = air_law(a.top, B)
    print('air by distance from the picture\'s eye (km: linear light R G B): ' + '; '.join('%.1f: %.4f %.4f %.4f' % (k, *l) for k, l in zip(km, light)))
    print('far air %.4f %.4f %.4f' % tuple(end))
    for L in country['levels']:
        w = L['widthDeg']
        name = 'land-%s.jpg' % str(w).replace('.', 'p')
        stem = os.path.join(a.top, 't%g' % w)
        if (only and str(w) not in only) or not os.path.exists(stem + '-height.npy'):
            continue
        f = Image.open(os.path.join(a.dir, name))
        keep = (dict(f.quantization), JpegImagePlugin.get_sampling(f))
        take = np.asarray(f.convert('RGB')).astype(np.float32)
        c = take.shape[0]
        hgt = np.load(stem + '-height.npy')
        assert hgt.shape[0] == c
        seen = np.isfinite(hgt)
        col = np.asarray(Image.open(stem + '-colour.png').convert('RGB')).astype(np.float32)
        reach = np.where(seen, np.load(stem + '-reach.npy') / (w / c), 1.0).astype(np.float32)
        far = eye_distance(w, c, hgt)
        del hgt
        tex_km = 2 * geom.half_tan(w) / c * R
        luma_t = np.maximum(take @ LUMA, 1.0).astype(np.float32)
        luma_c = np.maximum(col @ LUMA, 1.0).astype(np.float32)
        lt, lc = np.log(luma_t), np.log(luma_c)
        # the take's grain under the size of a picture pixel
        sig = np.maximum(reach * B['split']['sigmaPerReach'], 1e-3)
        steps = [B['split']['leastSigma'] * 2 ** k for k in range(B['split']['octaves'])]
        pos = np.clip(np.log2(sig / steps[0]), 0, len(steps) - 1).astype(np.float32)
        low = np.zeros_like(lt)
        for k, s in enumerate(steps):
            wgt = np.clip(1 - np.abs(pos - k), 0, 1)
            if wgt.max() > 0:
                low += wgt * cv2.GaussianBlur(lt, (0, 0), s)
        fine = ct.smooth((sig - B['split']['from']) / (B['split']['to'] - B['split']['from']))
        grain = np.clip(lt - low, np.log(B['split']['clip'][0]), np.log(B['split']['clip'][1])) * fine
        del low, pos, steps
        # near the picture's eye, in thin air: the set's ground itself
        near_body = col * np.exp(grain)[..., None]
        near = (1 - ct.smooth((far - B['airKm'][0]) / (B['airKm'][1] - B['airKm'][0]))).astype(np.float32)
        # beyond: the take's broad tone, the set's forms between a picture pixel and broadKm, the take's grain
        sb = B['forms']['broadKm'] / tex_km
        k = max(1, int(sb / 4))
        g = max(8, c // k)
        def broad(f, m=None):
            small = cv2.resize(f if m is None else f * m, (g, g), interpolation=cv2.INTER_AREA)
            small = cv2.GaussianBlur(small, (0, 0), sb * g / c)
            if m is not None:
                small = small / np.maximum(cv2.GaussianBlur(cv2.resize(m, (g, g), interpolation=cv2.INTER_AREA), (0, 0), sb * g / c), 1e-3)
            return cv2.resize(small, (c, c), interpolation=cv2.INTER_LINEAR)
        m = seen.astype(np.float32)
        lf = np.log(np.maximum(far, 1e-3))
        air = np.interp(lf, np.log(km), light @ LUMA).astype(np.float32) * np.minimum(far / km[0], 1)
        lin = geom.to_linear(luma_c / 255)
        passed = np.clip(1 - air / np.maximum(broad(lin, m), 1e-4), B['air']['leastPass'], 1).astype(np.float32)
        forms = np.clip((lc - broad(lc, m)) / passed, -np.log(B['forms']['most']), np.log(B['forms']['most']))
        far_body = take * np.exp(broad(lt) + forms + grain - lt)[..., None]
        del air, lf, lin, lt, lc
        body = np.clip(near_body * near[..., None] + far_body * (1 - near[..., None]), 0, 255)
        share = ct.smooth((cv2.GaussianBlur(m, (0, 0), B['softTexels']) - 0.5) * 2) * m
        out = body * share[..., None] + take * (1 - share[..., None])
        was = np.abs(out - take).mean(axis=2)
        Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(a.out, name), qtables=keep[0], subsampling=keep[1])
        print('%s %d: the set\'s ground on %.3f of it; a picture pixel in texels there: median %.2f, 90th %.2f; the set\'s ground itself on %.3f of it, its forms alone on %.3f; least pass %.2f on %.3f of the set\'s ground; against the plate read: mean %.2f on the set\'s ground' % (
            name, os.path.getsize(os.path.join(a.out, name)), float((share > 0.5).mean()), float(np.median(reach[seen])), float(np.percentile(reach[seen], 90)),
            float((share * near > 0.5).mean()), float((share * (1 - near) > 0.5).mean()), B['air']['leastPass'], float((passed[seen] <= B['air']['leastPass'] + 1e-6).mean()), float(was[share > 0.5].mean())))
        if a.look:
            os.makedirs(a.look, exist_ok=True)
            k = 1100 / c
            small = lambda im: cv2.resize(im, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
            pair = np.hstack([small(take), small(out)])
            Image.fromarray(np.clip(pair, 0, 255).astype(np.uint8)).save(os.path.join(a.look, 'body-%s.jpg' % str(w).replace('.', 'p')), quality=90)


if __name__ == '__main__':
    main()
