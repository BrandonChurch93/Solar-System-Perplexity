import json
import sys

import cv2
import numpy as np

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

seen = geo.scene('references/approved/mercury-hero.png')
h, w, _ = seen.shape
fit = geo.FIT
cx, cy, r = 1221.59, 824.2, 718.91
t = np.tan(np.radians(15))
ys, xs = np.mgrid[0:h, 0:w]
d = np.stack([(xs + 0.5 - w / 2) / (h / 2) * t, -(ys + 0.5 - h / 2) / (h / 2) * t, -np.ones((h, w))], -1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
sun = np.array(fit['sunInFrame']['directionFromCamera'])
sun /= np.linalg.norm(sun)
ang = np.degrees(np.arccos(np.clip(d @ sun, -1, 1)))
rr = np.hypot(xs + 0.5 - cx, ys + 0.5 - cy) / r
far = rr > 1.3
edges = np.arange(9.5, 50, 0.5)
prof = []
for a0 in edges:
    m = far & (ang >= a0) & (ang < a0 + 0.5)
    prof.append(np.percentile(seen[m], 40, axis=0) if m.sum() > 200 else [np.nan] * 3)
prof = np.array(prof)
ok = ~np.isnan(prof[:, 0])
sky = np.stack([np.interp(ang, edges[ok] + 0.25, prof[ok, c]) for c in range(3)], -1).astype(np.float32)
L = np.array(fit['sunDir'])
rows = []
for pa in np.arange(-70, 150, 2.0):
    a = np.radians(pa)
    n = np.array([np.cos(a), np.sin(a), 0.0])
    ndl = float(n @ L)
    for x in [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 176]:
        vals = []
        for da in np.linspace(-1, 1, 9):
            aa = a + np.radians(da)
            px, py = cx + (r + x + 2) * np.cos(aa), cy - (r + x + 2) * np.sin(aa)
            if 2 <= px < w - 3 and 2 <= py < h - 3:
                vals.append(cv2.getRectSubPix(seen, (1, 1), (float(px), float(py)))[0, 0] - cv2.getRectSubPix(sky, (1, 1), (float(px), float(py)))[0, 0])
        if len(vals) >= 5:
            rows.append([pa, ndl, x / r, *np.median(np.array(vals), axis=0)])
rows = np.array(rows)
np.save('out/work/mercury/rim-rows.npy', rows)
curve = np.array(json.load(open('src/stops/mercury/curve.json'))['curve'])
lum = np.array([np.interp(rows[:, 1], np.linspace(-1, 1, 33), curve[:, c]) for c in range(3)]).T @ geo.LUMA
best = None
for w1 in [0.006, 0.01, 0.014, 0.02, 0.028]:
    for w2 in [0.04, 0.056, 0.08, 0.11, 0.16]:
        A = np.stack([lum * np.exp(-rows[:, 2] / w1), lum * np.exp(-rows[:, 2] / w2)], 1)
        y = rows[:, 3:6] @ geo.LUMA
        k, res, *_ = np.linalg.lstsq(A, y, rcond=None)
        err = float(np.sqrt(np.mean((A @ k - y) ** 2)))
        if best is None or err < best[0]:
            best = (err, w1, w2, k)
err, w1, w2, k = best
A = np.stack([lum * np.exp(-rows[:, 2] / w1), lum * np.exp(-rows[:, 2] / w2)], 1)
shape = A @ k / max(k[0], 1e-6)
color = [float(np.sum(shape * rows[:, 3 + c]) / np.sum(shape * shape)) for c in range(3)]
print('rms', err, 'w1', w1, 'w2', w2, 'gains', k, 'color at w1 unit', color, 'wideGain', k[1] / k[0])
for pa in [-40, -20, 0, 20, 34, 60, 80, 100, 120]:
    m = rows[:, 0] == pa
    print(pa, 'ndl', round(float(rows[m][0, 1]), 2), 'seen', np.round(rows[m][:, 3:6] @ geo.LUMA, 3)[:12], 'fit', np.round((A @ k)[m], 3)[:12])
json.dump({'width': w1, 'wide': w2, 'wideGain': float(k[1] / k[0]), 'color': color, 'rms': err}, open('assets-src/mercury/wrap/rim.json', 'w'), indent=1)
