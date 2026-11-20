import json, sys, numpy as np, cv2
from scipy import ndimage as ndi
from skimage.graph import route_through_array
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H, F, U, DH, ground_dist
from fill import pushpull
OX, MB = 338, 190
EW, EH = W + 2 * OX, H + MB
cfg = json.load(open('assets-src/mars/relief/cuts.json'))
mcfg = json.load(open('assets-src/mars/relief/margin-cuts.json'))
paths = json.load(open('out/work/cutpaths.json'))
ext = cv2.imread('out/work/ext-2816.png').astype(np.float32) / 255
Lc = cv2.cvtColor(ext, cv2.COLOR_BGR2Lab)[..., 0] / 100
g = cv2.GaussianBlur(Lc, (0, 0), 1.0)
gc = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
gc /= np.percentile(gc, 99)
cost = 1.0 / (0.05 + np.clip(gc, 0, 2))
P = {}
for k in ('L1', 'L2'):
    p = [[x + OX, y] for x, y in paths[k]]
    wp = mcfg['cutExtension'].get(k, [])
    for (x0, y0), (x1, y1) in zip(wp[:-1], wp[1:]):
        r, _ = route_through_array(cost, (int(y0), int(x0) + OX), (min(EH - 1, int(y1)), int(x1) + OX), fully_connected=True, geometric=True)
        p += [[int(x), int(y)] for y, x in r[1:]]
    P[k] = p
json.dump(dict(paths={k: [[x - OX, y] for x, y in v] for k, v in P.items()}), open('out/work/cutpaths-ext.json', 'w'))
for k in ('L1', 'L2'):
    j = mcfg['joined'][k]
    poly = np.array(P[k] + [[x + OX, y] for x, y in j[1:-1]], np.int32)
    reg = np.zeros((EH, EW), np.uint8); cv2.fillPoly(reg, [poly], 1)
    cut = np.zeros((EH, EW), np.uint8); cv2.polylines(cut, [np.array(P[k], np.int32)], False, 1, 1)
    np.save(f'out/work/{k}-region-ext.npy', reg)
    np.save(f'out/work/{k}-dcut-ext.npy', ndi.distance_transform_edt(1 - cut).astype(np.float32))
pw = np.load('out/work/paint-w.npy') * np.load('out/work/paint-mask.npy')
pwe = np.zeros((EH, EW), np.float32); pwe[:H, OX:OX + W] = pw
np.save('out/work/paint-wm-ext.npy', pwe)
x = np.arange(EW) + 0.5 - OX; y = np.arange(EH) + 0.5
X, Y = np.meshgrid(x, y)
d = np.stack([X - W / 2, -(Y - H / 2), -np.full_like(X, F)], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
lg = np.log(ground_dist(d)).astype(np.float32)
dist0 = np.load('out/work/dist0.npy')
inside = np.zeros((EH, EW), bool); inside[:H, OX:OX + W] = True
r = np.zeros((EH, EW), np.float32); r[:H, OX:OX + W] = np.log(dist0) - lg[:H, OX:OX + W]
r1 = np.load('out/work/L1-region-ext.npy') > 0
out = r.copy()
for m in (r1, ~r1):
    src = inside & m
    _, (iy, ix) = ndi.distance_transform_edt(~src, return_indices=True)
    rep = r[iy, ix]
    e = cv2.GaussianBlur(rep, (0, 0), 6)
    t = np.clip(ndi.distance_transform_edt(~inside) / 24, 0, 1)
    t = t * t * (3 - 2 * t)
    v = rep * (1 - t) + e * t
    sel = (~inside) & m
    out[sel] = v[sel]
logd = np.minimum(lg + out, np.log(DH))
np.save('out/work/logd-ext.npy', logd.astype(np.float32))
print('logd ext range', float(np.exp(logd[~inside]).min()), float(np.exp(logd[~inside]).max()))
