import json, sys, numpy as np, cv2
sys.path.insert(0, 'assets-src/mars/relief')
from geom import *
d = np.fromfile('out/work/mars-depth.raw', np.float32).reshape(H, W)
regions = {
 'nearPlateau': [(0,580),(450,560),(1000,625),(1060,690),(820,780),(600,900),(0,960)],
 'rightMesaTop': [(1900,410),(2816,400),(2816,630),(2400,560),(2000,470),(1900,440)],
 'farPlainLeft': [(0,372),(800,368),(800,392),(0,410)],
 'farPlainMid': [(1000,352),(1750,348),(1750,372),(1000,376)],
}
g = ground_dist(rays())
rows = []
for k, poly in regions.items():
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(poly, np.int32)], 1)
    ys, xs = np.nonzero(m)
    sel = np.arange(len(ys))[::37]
    rows.append((k, d[ys[sel], xs[sel]], g[ys[sel], xs[sel]]))
D = np.concatenate([r[1] for r in rows]); G = np.concatenate([r[2] for r in rows])
w = np.concatenate([np.full(len(r[1]), 1.0 / len(r[1])) for r in rows])
A = np.stack([D, np.ones_like(D)], 1) * np.sqrt(w)[:, None]
a, b = np.linalg.lstsq(A, (1 / G) * np.sqrt(w), rcond=None)[0]
print('a b', a, b)
for k, dd, gg in rows:
    pred = 1 / np.maximum(a * dd + b, 1e-6)
    r = pred / gg
    print(k, 'n', len(dd), 'median ratio', np.median(r).round(3), 'p10', np.percentile(r, 10).round(3), 'p90', np.percentile(r, 90).round(3), 'gmed', np.median(gg).round(2))
json.dump(dict(a=float(a), b=float(b), regions=regions), open('out/work/fit-ab.json', 'w'))

from scipy.optimize import least_squares
b0 = 1 / DH
def model(q, x):
    a, gam = q
    return 1 / (a * np.power(np.maximum(x, 0), gam) + b0)
sw = np.sqrt(w)
sol = least_squares(lambda q: (np.log(model(q, D)) - np.log(G)) * sw, [0.5, 1.0])
A1, GAM = sol.x
print('power fit a', A1, 'gamma', GAM, 'b', b0)
for k, dd, gg in rows:
    r = model(sol.x, dd) / gg
    print('power', k, 'median ratio', np.median(r).round(3), 'p10', np.percentile(r, 10).round(3), 'p90', np.percentile(r, 90).round(3))
print('dist at d=1', model(sol.x, np.array([1.0, 0.5, 0.2, 0.05, 0.01, 0.0])))
json.dump(dict(form='dist = 1 / (a * depth^gamma + b)', a=float(A1), gamma=float(GAM), b=float(b0), regions=regions), open('assets-src/mars/relief/depth-curve.json', 'w'), indent=1)
