import json
import sys

import numpy as np
from scipy.optimize import nnls

d = json.load(open('out/work/jupiter/glow-profiles.json'))
radii = np.array(d['radii'])
angles = sorted(int(a) for a in d['angles'])
res = np.array([np.array(d['angles'][str(a)]['hero']) - np.array(d['angles'][str(a)]['film']) for a in angles])
DIST = 4.30454
lim = np.arcsin(1 / DIST)
rt = DIST * np.sin(np.arctan(radii * np.tan(lim)))
x = rt - 1
HS = [float(v) for v in sys.argv[1].split(',')] if len(sys.argv) > 1 else [0.006, 0.025, 0.1]
TAU = 0.15
LOBES = {'narrow': (0.78, 0.94), 'broad': (0.2, 0.93)}


def smooth(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


best = None
for theta0 in (154, 158, 162, 166, 170):
    c = np.cos(lim) * np.cos(np.radians(np.array(angles) - theta0))
    cols, names = [], []
    for H in HS:
        radial = 1 - np.exp(-TAU * np.exp(-x / H))
        for name, (a, b) in LOBES.items():
            cols.append((smooth(a, b, c)[:, None] ** 2 * radial[None, :]).ravel())
            names.append((H, name))
    M = np.stack(cols, 1)
    w = 1 / (np.abs(res[..., 0]).ravel() + 0.02)
    total, sol = 0, []
    for ch in range(3):
        s, err = nnls(M * w[:, None], res[..., ch].ravel() * w)
        sol.append(s)
        total += err
    if best is None or total < best[0]:
        best = (total, theta0, np.array(sol), names, M)
total, theta0, sol, names, M = best
print('theta0', theta0, 'err', round(total, 4))
for i, (H, name) in enumerate(names):
    print(f'  H {H} {name:6s} day', np.round(sol[:, i], 4).tolist(), 'depth', round(TAU / 2 / np.sqrt(1.5707963 / H), 6))
fit = (M @ sol[0]).reshape(len(angles), len(radii))
print('R residual after fit (hero - film - shells), by angle:')
for a, row, tgt in zip(angles, fit, res[..., 0]):
    print(f'{a:4d} ' + ' '.join(f'{t - f:7.4f}' for t, f in zip(tgt, row)))
out = {'theta0': theta0, 'tau': TAU, 'lobes': LOBES, 'layers': [{'H': H, 'lobe': name, 'day': np.round(sol[:, i], 5).tolist()} for i, (H, name) in enumerate(names)]}
json.dump(out, open('out/work/jupiter/glow-fit.json', 'w'), indent=1)
