import json
import sys

import cv2
import numpy as np

sys.path.insert(0, 'assets-src/jupiter/wrap')
from common import FIT, HERO, LIMB_KNOTS, lc, load, moon_mask, decode

film_path = sys.argv[1]
write = len(sys.argv) > 2 and sys.argv[2] == 'write'
hero8 = load(HERO)
h, w, _ = hero8.shape
g = lc.geometry(FIT, w, h)
hero = decode(hero8)
f8 = load(film_path)
if f8.shape[1] != w:
    f8 = cv2.resize(f8, (w, h), interpolation=cv2.INTER_CUBIC)
film = decode(f8)
moon = moon_mask(w, h, 30) > 0
mu, ndl = g['mu'], g['ndl']
ok = g['hit'] & ~moon & (film.min(-1) > 1e-4)
ratio = hero / np.maximum(film, 1e-5)

cpath, lpath = 'src/stops/jupiter/curve.json', 'src/stops/jupiter/limb.json'
cj, lj = json.load(open(cpath)), json.load(open(lpath))
C = np.array(cj['curve'])
L = np.array(lj['limb'])

knots = np.linspace(0, 1, LIMB_KNOTS)
half = 1.0 / (LIMB_KNOTS - 1)
gl = np.ones((LIMB_KNOTS, 3))
for i, k in enumerate(knots):
    if k > 0.5:
        continue
    s = ok & (ndl > 0.3) & (np.abs(mu - k) < half * 0.6) & (mu > 0.03)
    if s.sum() >= 200:
        gl[i] = np.median(ratio[s], axis=0)
gl[0] = gl[1]
print('limb gain by knot', np.round(gl[:10], 3).tolist())

deep = ok & (ndl < -0.27) & (mu > 0.22)
nh, nf = hero[deep].mean(0), film[deep].mean(0)
print('night hero', np.round(nh, 5).tolist(), 'film', np.round(nf, 5).tolist(), 'ratio', np.round(nh / nf, 3).tolist(), 'pixels', int(deep.sum()))

ct = np.linspace(-1, 1, len(C))
ck = np.sign(ct) * ct * ct
gc = np.ones((len(C), 3))
for i, k in enumerate(ck):
    if k < -0.3 or k > 0.62:
        continue
    lo, hi = (ck[i - 1] + k) / 2, (k + ck[i + 1]) / 2
    s = ok & (mu > 0.35) & (ndl > lo) & (ndl < hi)
    if s.sum() >= 200:
        if k < 0.12:
            gc[i] = np.clip((hero[s].mean(0) - nh) / np.maximum(film[s].mean(0) - nf, 1e-5), 0.5, 2) ** 0.8
        else:
            gc[i] = np.median(ratio[s], axis=0)
print('curve gain by knot')
for i, k in enumerate(ck):
    if -0.35 < k < 0.45:
        print(f'  ndl {k:6.3f}', np.round(gc[i], 3).tolist(), 'C', np.round(C[i], 4).tolist())

if write:
    L2 = L * gl
    C2 = C * gc
    if not (np.isfinite(C2).all() and np.isfinite(L2).all() and np.isfinite(nh / nf).all()):
        raise SystemExit('not finite, nothing written')
    for c in range(3):
        C2[:, c] = np.minimum.accumulate(C2[::-1, c])[::-1]
    j = int(np.argmin(np.abs(ck - 0.035)))
    for i in range(len(ck)):
        if ck[i] <= 0:
            C2[i] = 0
        elif i < j:
            C2[i] = np.minimum(C2[i], C2[j] * ck[i] / ck[j])
    lj['limb'] = np.round(L2, 4).tolist()
    cj['curve'] = np.round(C2, 5).tolist()
    cj['night'] = np.round(np.array(cj['night']) * nh / nf, 5).tolist()
    json.dump(lj, open(lpath, 'w'))
    json.dump(cj, open(cpath, 'w'))
    print('written')
