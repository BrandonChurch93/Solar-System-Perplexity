"""Finds the factor that turns the place picture's values into albedo for the globe's own light.

The globe shows a patch texel as inverseFilmic(texel) * shade * tint, then haze and gain: in scene values
G = A * r + h for a plate whose scene values are the picture's times r, with A the light on the picture's
value and h the haze the globe adds. This tool reads ungraded stills of the handover frame: the close side (the
target C) and one or two stills of the globe side with the place picture off, each rendered with plates built with
a known factor map.
  one globe still (factor 1):  r = C / G, the first guess (haze taken as none)
  two globe stills:            A and h by least squares over a small window, r = (C - h) / A
The factor is written in frame space (<out>-frame.npy) and laid back onto every plate (<out>-<width>.npy).
  python3 assets-src/mars/place/calibrate.py --close c.png --globe g0.png --out out/work/place/cal/ratio1
  python3 assets-src/mars/place/calibrate.py --close c.png --globe g0.png --globe2 g1.png --factor2 out/work/place/cal/ratio1 --out out/work/place/cal/ratio2
--factor names the factor the first globe still was rendered with (none: 1).
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--globe', required=True)
ap.add_argument('--factor', default='')
ap.add_argument('--globe2', default='')
ap.add_argument('--factor2', default='')
ap.add_argument('--close', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--kind', default='dive')
ap.add_argument('--spec', default='assets-src/mars/place/plates.json')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--sigma', type=float, default=5)
ap.add_argument('--size', type=int, default=1024)
ap.add_argument('--limit', default='0.05,30')
ap.add_argument('--widths', default='')
a = ap.parse_args()
lo, hi = [float(x) for x in a.limit.split(',')]
g = geom.load(a.geometry)
W, H = g['format']['width'], g['format']['height']
cam = geom.Camera(g[a.kind]['twin'], W, H)


def scene(path):
    return geom.to_linear(cv2.imread(path, cv2.IMREAD_COLOR).astype(np.float32) / 255)


def factor(prefix):
    return np.load(prefix + '-frame.npy') if prefix else np.ones((H, W, 3), np.float32)


G, C = scene(a.globe), scene(a.close)
py, px = np.mgrid[0:H, 0:W]
pts, hit = cam.hit(cam.rays(px + 0.5, py + 0.5))
ground = hit & (G.max(axis=2) < 0.98) & (C.max(axis=2) < 0.98)
m = ground.astype(np.float32)
blur = lambda x, s=a.sigma: cv2.GaussianBlur(x, (0, 0), s)
den = np.maximum(blur(m), 1e-4)[..., None]
mean = lambda x, s=a.sigma: blur(x * m[..., None], s) / np.maximum(blur(m, s), 1e-4)[..., None]
good = blur(m) > 0.5
Gs, Cs = mean(G), mean(C)
r0 = factor(a.factor)
if not a.globe2:
    ratio = r0 * (Cs + 1e-4) / (Gs + 1e-4)
else:
    G2 = scene(a.globe2)
    r2 = factor(a.factor2)
    dr, dg = r2 - r0, G2 - G
    wide = 3 * a.sigma
    A = mean(dg * dr, wide) / (mean(dr * dr, wide) + 1e-5)
    A = np.maximum(A, 1e-4)
    h = np.maximum(mean(G2) - A * mean(r2), 0)
    ratio = (Cs - h) / A
    under = (Cs < h)[good]
    print('light A on the picture value, median b g r: %s; haze h, median: %s' % (np.round(np.median(A[good], axis=0), 4), np.round(np.median(h[good], axis=0), 4)))
    print('share of the ground where the globe haze alone is brighter than the close side, b g r: %s' % np.round(under.mean(axis=0), 3))
    np.save(a.out + '-haze.npy', h.astype(np.float32))
    np.save(a.out + '-light.npy', A.astype(np.float32))
ratio = np.clip(ratio, lo, hi)
med = np.median(ratio[good], axis=0)
print('factor, median b g r: %s; 5th and 95th percentile of its mean: %s' % (np.round(med, 3), np.round(np.percentile(ratio[good].mean(axis=1), [5, 95]), 3)))
last = scene(a.globe2) if a.globe2 else G
err = np.abs(geom.to_srgb(C) - geom.to_srgb(last))[ground]
print('difference of the newest globe still to the close side on the ground, of 255: mean %.2f, 95th percentile %.2f' % (err.mean() * 255, np.percentile(err, 95) * 255))
ratio = np.where(good[..., None], ratio, med[None, None, :]).astype(np.float32)
np.save(a.out + '-frame.npy', ratio)
spec = json.load(open(a.spec))
widths = [float(x) for x in a.widths.split(',')] if a.widths else [p['widthDeg'] for p in spec['plates']]
for w in widths:
    d = geom.patch_dirs(w, a.size)
    fx, fy, front = cam.project(d)
    cosv, _ = cam.seen(d)
    ok = front & (cosv > 0) & (fx > 0) & (fx < W) & (fy > 0) & (fy < H)
    lay = cv2.remap(ratio, (fx - 0.5).astype(np.float32), (fy - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    lay = np.where(ok[..., None], lay, med[None, None, :]).astype(np.float32)
    np.save('%s-%g.npy' % (a.out, w), lay)
print('wrote', a.out, 'for', widths)
