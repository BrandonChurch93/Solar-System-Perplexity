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

ck = np.linspace(-1, 1, len(C))
ch = 2.0 / (len(C) - 1)
gc = np.ones((len(C), 3))
for i, k in enumerate(ck):
    if k < -0.3 or k > 0.62:
        continue
    s = ok & (mu > 0.35) & (np.abs(ndl - k) < ch * 0.6)
    if s.sum() >= 200:
        gc[i] = np.median(ratio[s], axis=0)
print('curve gain by knot')
for i, k in enumerate(ck):
    if -0.5 < k < 0.45:
        print(f'  ndl {k:6.3f}', np.round(gc[i], 3).tolist(), 'C', np.round(C[i], 4).tolist())

deep = ok & (ndl < -0.5) & (mu > 0.3)
print('night ratio', np.round(np.median(ratio[deep], axis=0), 3).tolist(), 'hero', np.round(np.median(hero[deep], axis=0), 4).tolist(), 'film', np.round(np.median(film[deep], axis=0), 4).tolist())

if write:
    L2 = L * gl
    C2 = C * gc
    for c in range(3):
        C2[:, c] = np.maximum.accumulate(C2[:, c])
    lj['limb'] = np.round(L2, 4).tolist()
    cj['curve'] = np.round(C2, 5).tolist()
    json.dump(lj, open(lpath, 'w'))
    json.dump(cj, open(cpath, 'w'))
    print('written')
