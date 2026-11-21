import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy import sparse
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates
from scipy.sparse.linalg import splu

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, POLAR, lum, spheroid_hit

from layoutgeo import GW, GH, VL, BACK, W, H, fa, fl, k, nc, C, height, hc, side, g2a, a2g, cam2g, plane_from_grid, model_lambda

REF_AZ = -14.0
rings = json.loads((ROOT / "src/stops/saturn/rings.json").read_text())
AH, AC = np.array(rings["warpHero"]), np.array(rings["warpClose"])
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255


def unwarp(r):
    lo = AC[0] + (r - AH[0]) * (AC[1] - AC[0]) / (AH[1] - AH[0])
    hi = AC[3] + (r - AH[3]) * (AC[3] - AC[2]) / (AH[3] - AH[2])
    return np.where(r < AH[0], lo, np.where(r > AH[3], hi, np.interp(r, AH, AC)))


gx, gy = np.meshgrid(np.arange(GW) + 0.5, np.arange(GH) + 0.5)
X, live = plane_from_grid(gx, gy)
P = X - C
P[~live] = 0
pu, pv = P @ hc, P @ side
r = np.hypot(pu, pv)
live &= np.linalg.norm(X, axis=-1) < 40
foot = np.maximum(np.hypot(np.gradient(pu, axis=1), np.gradient(pv, axis=1)), np.hypot(np.gradient(pu, axis=0), np.gradient(pv, axis=0)))
foot = np.clip(foot, 1e-4, 5)
MODEL_ON = len(sys.argv) > 7 and sys.argv[7] == "model"
prior = model_lambda(pu, pv) if MODEL_ON else unwarp(r)

ax, ay, seen = g2a(gx, gy)
inframe = seen & (ax > 4) & (ax < W - 4) & (ay > 4) & (ay < H - 4)
kk = 1.0 / POLAR - 1.0
o = -C + nc * ((-C) @ nc) * kk
dA = X / np.maximum(np.linalg.norm(X, axis=-1, keepdims=True), 1e-6)
ds = dA + nc * (dA @ nc)[..., None] * kk
ds /= np.maximum(np.linalg.norm(ds, axis=-1, keepdims=True), 1e-9)
tc = -(ds @ o)
miss = np.linalg.norm(o + ds * tc[..., None], axis=-1)
globe = (miss < 1.0) & (tc > 0) & ~(live & ((r < 1.0) | (pu > 0)))

L = np.log(lum(img) + 0.03)
g = gaussian_filter(L, 1.5)
sx, sy = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
S = 14.0
jxx, jxy, jyy = gaussian_filter(sx * sx, S), gaussian_filter(sx * sy, S), gaussian_filter(sy * sy, S)
mapx, mapy = (ax - 0.5).astype(np.float32), (ay - 0.5).astype(np.float32)
small = lambda a: cv2.remap(cv2.GaussianBlur(a, (0, 0), 0.5 / k), mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
jxx, jxy, jyy = small(jxx), small(jxy), small(jyy)
tr = jxx + jyy
disc = np.sqrt(np.maximum((jxx - jyy) ** 2 + 4 * jxy * jxy, 0))
coh = np.where(tr > 1e-9, disc / np.maximum(tr, 1e-9), 0) ** 2
ang = 0.5 * np.arctan2(2 * jxy, jxx - jyy)
OUT_W = float(sys.argv[6]) if len(sys.argv) > 6 else 0.1
ta_x, ta_y = -np.sin(ang), np.cos(ang)
a11, a12 = np.gradient(ax, axis=1), np.gradient(ax, axis=0)
a21, a22 = np.gradient(ay, axis=1), np.gradient(ay, axis=0)
tx, ty = a22 * ta_x - a12 * ta_y, -a21 * ta_x + a11 * ta_y
tn = np.maximum(np.hypot(tx, ty), 1e-9)
tx, ty = tx / tn, ty / tn
core = inframe & live & ~globe
energy = np.clip(tr / np.percentile(tr[core], 60), 0, 1)
wt = coh * energy ** 0.3 * core
gm = cv2.erode(core.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
wt = wt * gm
np.save(WORK / "layout-wt.npy", wt.astype(np.float32))
rx, ry = np.gradient(prior, axis=1), np.gradient(prior, axis=0)
rn = np.maximum(np.hypot(rx, ry), 1e-9)
px2, py2 = -ry / rn, rx / rn
src = wt > 0.2
dist, (iy, ix) = distance_transform_edt(~src, return_indices=True)
c2, s2 = (tx * tx - ty * ty)[iy, ix], (2 * tx * ty)[iy, ix]
far = np.clip(dist / 50.0, 0, 1)
far = far * far * (3 - 2 * far)
c2 = c2 * (1 - far) + (px2 * px2 - py2 * py2) * far
s2 = s2 * (1 - far) + (2 * px2 * py2) * far
outside = live & ~core & ~globe
c2, s2 = gaussian_filter(c2, 4.0), gaussian_filter(s2, 4.0)
a2 = 0.5 * np.arctan2(s2, c2)
tx = np.where(outside, np.cos(a2), tx)
ty = np.where(outside, np.sin(a2), ty)
if MODEL_ON:
    tx, ty = np.where(outside, px2, tx), np.where(outside, py2, ty)
wt = np.where(outside, 0.0 if MODEL_ON else OUT_W, wt)

idx = -np.ones((GH, GW), int)
idx[live] = np.arange(live.sum())
n = int(live.sum())
rows, cols, vals, rhs = [], [], [], []
eq = 0


def add(entries, b, w):
    global eq
    m = np.ones(len(b), bool)
    for i, _ in entries:
        m &= i >= 0
    m &= w > 0
    k_ = int(m.sum())
    ids = eq + np.arange(k_)
    for i, c in entries:
        rows.append(ids)
        cols.append(i[m])
        vals.append((c * w)[m] if np.ndim(c) else np.full(k_, c) * w[m])
    rhs.append((b * w)[m])
    eq += k_


def sh(a, dy, dx):
    out = -np.ones_like(a)
    ys, xs = slice(max(dy, 0), GH + min(dy, 0)), slice(max(dx, 0), GW + min(dx, 0))
    yd, xd = slice(max(-dy, 0), GH + min(-dy, 0)), slice(max(-dx, 0), GW + min(-dx, 0))
    out[yd, xd] = a[ys, xs]
    return out


TW = float(sys.argv[1]) if len(sys.argv) > 1 else 3.0
f = lambda a: a.ravel()
c0, xp, xm, yp, ym = f(idx), f(sh(idx, 0, 1)), f(sh(idx, 0, -1)), f(sh(idx, 1, 0)), f(sh(idx, -1, 0))
zero = np.zeros(GH * GW)
ft = f(foot)
add([(xp, 0.5 * f(tx)), (xm, -0.5 * f(tx)), (yp, 0.5 * f(ty)), (ym, -0.5 * f(ty))], zero, TW * np.sqrt(f(wt)) / ft)
SM = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
loose = (outside | globe) if MODEL_ON else np.zeros_like(outside)
bend = lambda axis: f(np.where(loose, np.roll(prior, 1, axis) + np.roll(prior, -1, axis) - 2 * prior, 0.0))
add([(xp, 1.0), (xm, 1.0), (c0, -2.0)], bend(1), SM / ft)
add([(yp, 1.0), (ym, 1.0), (c0, -2.0)], bend(0), SM / ft)
hidden = live & (pu < 0) & (r > 1.0) & (miss < 1.0)
PW = float(sys.argv[3]) if len(sys.argv) > 3 else 0.001
away = np.clip((dist - 8.0) / 60.0, 0, 1)
pw = PW + 0.3 * away * away * (3 - 2 * away) if MODEL_ON else np.where(hidden, 1.0, PW)
add([(c0, 1.0)], f(prior), f(pw) / ft)
a = np.radians(REF_AZ)
line = np.cos(a) * hc + np.sin(a) * side
s = np.arange(-1.0, 2.2, 0.002)
Q = C + line[None] * s[:, None]
lx, ly, z = cam2g(Q)
ok = z > 0.05
ok &= (lx > 1) & (lx < GW - 2) & (ly > 1) & (ly < GH - 2)
lx, ly, s = lx[ok], ly[ok], s[ok]
x0, y0 = np.floor(lx - 0.5).astype(int), np.floor(ly - 0.5).astype(int)
fx, fy = lx - 0.5 - x0, ly - 0.5 - y0
ent = [(idx[y0, x0], (1 - fx) * (1 - fy)), (idx[y0, x0 + 1], fx * (1 - fy)), (idx[y0 + 1, x0], (1 - fx) * fy), (idx[y0 + 1, x0 + 1], fx * fy)]
add(ent, s, 6.0 / foot[y0, x0])

oc = np.load(WORK / "close-outer.npy")
ox, oy, _ = a2g(oc[:, 0], oc[:, 1])
x0, y0 = np.floor(ox - 0.5).astype(int), np.floor(oy - 0.5).astype(int)
fx, fy = ox - 0.5 - x0, oy - 0.5 - y0
ent = [(idx[y0, x0], (1 - fx) * (1 - fy)), (idx[y0, x0 + 1], fx * (1 - fy)), (idx[y0 + 1, x0], (1 - fx) * fy), (idx[y0 + 1, x0 + 1], fx * fy)]
add(ent, np.full(len(ox), AC[3]), 3.0 / foot[y0, x0])


def solve():
    A = sparse.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(eq, n))
    b = np.concatenate(rhs)
    lam = splu((A.T @ A).tocsc()).solve(A.T @ b)
    out = prior.copy()
    out[live] = lam
    out[~live] = unwarp(np.full((~live).sum(), 40.0))
    return out, float(np.sqrt(((A @ lam - b) ** 2).mean()))


first, res = solve()
NW = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
NG = float(sys.argv[5]) if len(sys.argv) > 5 else 0.15
px_, py_ = np.gradient(prior, axis=1), np.gradient(prior, axis=0)
gp = np.maximum(np.hypot(px_, py_), 1e-6)
ok1 = (live & (np.abs(first) < 4)).astype(np.float32)
sm = lambda a: gaussian_filter(np.where(ok1 > 0, a, 0), 5.0) / np.maximum(gaussian_filter(ok1, 5.0), 1e-4)
fx_, fy_ = sm(np.gradient(first, axis=1)), sm(np.gradient(first, axis=0))
nx, ny = -ty, tx
pn = nx * px_ + ny * py_
sg = np.where(pn < 0, -1.0, 1.0)
agree = np.clip((np.abs(pn) / gp - 0.3) / 0.3, 0, 1)
goal = sg * np.maximum((nx * fx_ + ny * fy_) * sg, np.where(outside, 2.0, 1.0) * NG * np.abs(pn))
add([(xp, 0.5 * f(nx)), (xm, -0.5 * f(nx)), (yp, 0.5 * f(ny)), (ym, -0.5 * f(ny))], f(goal), NW * np.sqrt(f(np.where(outside, 1.0, wt) * agree)) / ft)
field, res = solve()
calm = (live & (np.abs(field) < 4)).astype(np.float32)
soft = lambda a, sg: np.where(calm > 0, gaussian_filter(np.where(calm > 0, a, 0), sg) / np.maximum(gaussian_filter(calm, sg), 1e-4), a)
field = soft(field, 0.9)
base = np.clip(field, -4, 4).astype(np.float32)
bx, by = gaussian_filter(np.gradient(base, axis=1), 2.5), gaussian_filter(np.gradient(base, axis=0), 2.5)
bn = np.maximum(np.hypot(bx, by), 1e-9)
ux, uy = (-by / bn).astype(np.float32), (bx / bn).astype(np.float32)
acc, cnt = base.copy(), np.ones_like(base)
for way in (1.0, -1.0):
    qx, qy = (gx - 0.5).astype(np.float32), (gy - 0.5).astype(np.float32)
    for j in range(8):
        sx_, sy_ = cv2.remap(ux, qx, qy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), cv2.remap(uy, qx, qy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        qx, qy = qx + way * sx_, qy + way * sy_
        wj = np.exp(-0.5 * ((j + 1) / 4.0) ** 2) * (cv2.remap(calm, qx, qy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) > 0.99)
        acc += cv2.remap(base, qx, qy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) * wj
        cnt += wj
field = np.where(calm > 0, acc / cnt, field)
np.save(WORK / "layout.npy", field.astype(np.float32))
(ROOT / "src/stops/saturn/layout.json").write_text(json.dumps({"source": "assets-src/saturn/close/layout.py and profile.py, band layout and soft shade of the approved close image on the ring plane, seen from a camera behind the fitted close camera", "file": "layout.bin", "width": GW, "height": GH, "vfovDeg": VL, "back": BACK, "refAzDeg": REF_AZ}, indent=1) + "\n")

xs, ys = np.meshgrid(np.arange(0, W, 2) + 1.0, np.arange(0, H, 2) + 1.0)
qx, qy, okp = a2g(xs, ys)
lamA = map_coordinates(field.astype(np.float32), [qy - 0.5, qx - 0.5], order=1, mode="nearest")
lamA = np.where(okp, lamA, 9.0)
vis = cv2.resize((img[..., ::-1] * 255).astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_AREA)
levels = np.arange(-1.0, 2.4, 0.1)


def draw(canvas, lam2):
    for i, lv in enumerate(levels):
        cs = cv2.findContours((lam2 > lv).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]
        col = (0, 255, 255) if abs(lv - round(lv)) < 1e-6 else ((0, 255, 0) if i % 2 == 0 else (255, 160, 0))
        cv2.drawContours(canvas, cs, -1, col, 1)


draw(vis, lamA)
cv2.imwrite(str(WORK / "layout-contours.jpg"), vis, [cv2.IMWRITE_JPEG_QUALITY, 88])
Z = 2
big = cv2.resize(np.clip(field, -3, 4).astype(np.float32), None, fx=Z, fy=Z, interpolation=cv2.INTER_LINEAR)
gv = np.full((GH * Z, GW * Z, 3), 30, np.uint8)
gv[cv2.resize(inframe.astype(np.uint8), None, fx=Z, fy=Z, interpolation=cv2.INTER_NEAREST) > 0] = 70
gv[cv2.resize(globe.astype(np.uint8), None, fx=Z, fy=Z, interpolation=cv2.INTER_NEAREST) > 0] = (60, 40, 40)
draw(gv, big)
cv2.imwrite(str(WORK / "layout-grid.jpg"), gv, [cv2.IMWRITE_JPEG_QUALITY, 88])
print("unknowns", n, "equations", eq, "residual rms", res)
