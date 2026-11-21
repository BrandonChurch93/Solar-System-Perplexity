import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy import sparse
from scipy.ndimage import gaussian_filter
from scipy.sparse.linalg import splu

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, POLAR, lum, spheroid_hit

GW, GH, VL = 576, 432, 100.0
REF_AZ = -14.0
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
rings = json.loads((ROOT / "src/stops/saturn/rings.json").read_text())
AH, AC = np.array(rings["warpHero"]), np.array(rings["warpClose"])
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
fa = (H / 2) / np.tan(np.radians(close["vfov"]) / 2)
fl = (GH / 2) / np.tan(np.radians(VL) / 2)
k = fl / fa
tilt, roll = np.radians(close["tiltDeg"]), np.radians(close["rollDeg"])
nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
C = np.array(close["centre"])
height = -C @ nc
hc = -C - height * nc
reach = np.linalg.norm(hc)
hc /= reach
side = np.cross(nc, hc)


def unwarp(r):
    lo = AC[0] + (r - AH[0]) * (AC[1] - AC[0]) / (AH[1] - AH[0])
    hi = AC[3] + (r - AH[3]) * (AC[3] - AC[2]) / (AH[3] - AH[2])
    return np.where(r < AH[0], lo, np.where(r > AH[3], hi, np.interp(r, AH, AC)))


gx, gy = np.meshgrid(np.arange(GW) + 0.5, np.arange(GH) + 0.5)
d = np.stack([(gx - GW / 2) / fl, (GH / 2 - gy) / fl, -np.ones_like(gx)], -1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
den = d @ nc
t = np.where(den < -1e-4, -height / np.minimum(den, -1e-4), np.inf)
P = d * t[..., None] - C
P[~np.isfinite(t)] = 0
pu, pv = P @ hc, P @ side
r = np.hypot(pu, pv)
live = np.isfinite(t) & (t < 40)
foot = np.maximum(np.hypot(np.gradient(pu, axis=1), np.gradient(pv, axis=1)), np.hypot(np.gradient(pu, axis=0), np.gradient(pv, axis=0)))
foot = np.clip(foot, 1e-4, 5)
prior = unwarp(r)

ax, ay = (gx - GW / 2) / k + W / 2, (gy - GH / 2) / k + H / 2
inframe = (ax > 4) & (ax < W - 4) & (ay > 4) & (ay < H - 4)
th, _ = spheroid_hit(np.zeros(3), d, nc) if False else (None, None)
kk = 1.0 / POLAR - 1.0
o = -C + nc * ((-C) @ nc) * kk
ds = d + nc * (d @ nc)[..., None] * kk
ds /= np.linalg.norm(ds, axis=-1, keepdims=True)
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
tx, ty = -np.sin(ang), np.cos(ang)
energy = np.clip(tr / np.percentile(tr[inframe & live & ~globe], 60), 0, 1)
wt = coh * energy ** 0.3 * (inframe & live & ~globe)
gm = cv2.erode((inframe & live & ~globe).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
wt = wt * gm

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


f = lambda a: a.ravel()
c0, xp, xm, yp, ym = f(idx), f(sh(idx, 0, 1)), f(sh(idx, 0, -1)), f(sh(idx, 1, 0)), f(sh(idx, -1, 0))
zero = np.zeros(GH * GW)
ft = f(foot)
TW = float(sys.argv[1]) if len(sys.argv) > 1 else 3.0
add([(xp, 0.5 * f(tx)), (xm, -0.5 * f(tx)), (yp, 0.5 * f(ty)), (ym, -0.5 * f(ty))], zero, TW * np.sqrt(f(wt)) / ft)
SM = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
add([(xp, 1.0), (xm, 1.0), (c0, -2.0)], zero, SM / ft)
add([(yp, 1.0), (ym, 1.0), (c0, -2.0)], zero, SM / ft)
edge = np.minimum(np.minimum(ax, W - ax) / W, np.minimum(ay, H - ay) / H)
out_frac = np.clip((-edge - 0.07) / 0.3, 0, 1)
hidden = live & (pu < 0) & (r > 1.0) & (miss < 1.0)
PW = float(sys.argv[3]) if len(sys.argv) > 3 else 0.001
pw = np.where(hidden, 1.0, PW)
gw = np.where(inframe | hidden, 0.0, out_frac ** 2)
add([(xp, 0.5), (xm, -0.5)], f(np.gradient(prior, axis=1)), f(gw) / ft)
add([(yp, 0.5), (ym, -0.5)], f(np.gradient(prior, axis=0)), f(gw) / ft)
add([(c0, 1.0)], f(prior), f(pw) / ft)
a = np.radians(REF_AZ)
line = np.cos(a) * hc + np.sin(a) * side
s = np.arange(-1.0, 2.2, 0.002)
Q = C + line[None] * s[:, None]
z = -Q[:, 2]
ok = z > 0.05
lx, ly = Q[:, 0] / z * fl + GW / 2, GH / 2 - Q[:, 1] / z * fl
ok &= (lx > 1) & (lx < GW - 2) & (ly > 1) & (ly < GH - 2)
lx, ly, s = lx[ok], ly[ok], s[ok]
x0, y0 = np.floor(lx - 0.5).astype(int), np.floor(ly - 0.5).astype(int)
fx, fy = lx - 0.5 - x0, ly - 0.5 - y0
ent = [(idx[y0, x0], (1 - fx) * (1 - fy)), (idx[y0, x0 + 1], fx * (1 - fy)), (idx[y0 + 1, x0], (1 - fx) * fy), (idx[y0 + 1, x0 + 1], fx * fy)]
add(ent, s, 6.0 / foot[y0, x0])

oc = np.load(WORK / "close-outer.npy")
ox, oy = (oc[:, 0] - W / 2) * k + GW / 2, (oc[:, 1] - H / 2) * k + GH / 2
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
goal = sg * np.maximum((nx * fx_ + ny * fy_) * sg, NG * np.abs(pn))
add([(xp, 0.5 * f(nx)), (xm, -0.5 * f(nx)), (yp, 0.5 * f(ny)), (ym, -0.5 * f(ny))], f(goal), NW * np.sqrt(f(wt * agree)) / ft)
field, res = solve()
col = int(GW / 2 + (40 - W / 2) * k)
ol = cv2.remap(field.astype(np.float32), ox.astype(np.float32)[None] - 0.5, oy.astype(np.float32)[None] - 0.5, cv2.INTER_LINEAR)[0]
print("lambda along the traced outer edge, by x:", np.round(ol[::8], 3), "median", float(np.median(ol)))
print("left edge, y lambda first second prior:")
for yy in range(500, 1500, 100):
    row = int(GH / 2 + (yy - H / 2) * k)
    print(yy, round(float(first[row, col]), 4), round(float(field[row, col]), 4), round(float(prior[row, col]), 4))
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
(ROOT / "src/stops/saturn/layout.json").write_text(json.dumps({"source": "assets-src/saturn/close/layout.py and profile.py, band layout and soft shade of the approved close image on the ring plane, seen from the fitted close camera", "file": "layout.bin", "width": GW, "height": GH, "vfovDeg": VL, "refAzDeg": REF_AZ}, indent=1) + "\n")

big = cv2.resize(field.astype(np.float32), None, fx=1 / k, fy=1 / k, interpolation=cv2.INTER_CUBIC)
cx, cy = big.shape[1] // 2, big.shape[0] // 2
crop = big[cy - H // 2:cy + H // 2, cx - W // 2:cx + W // 2]
vis = (img[..., ::-1] * 255).astype(np.uint8).copy()
levels = np.arange(-1.0, 2.4, 0.1)
for i, lv in enumerate(levels):
    cs = cv2.findContours((crop > lv).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]
    col = (0, 255, 255) if abs(lv - round(lv)) < 1e-6 else ((0, 255, 0) if i % 2 == 0 else (255, 160, 0))
    cv2.drawContours(vis, cs, -1, col, 2)
for q in range(0, len(lx), 12):
    cv2.circle(vis, (int((lx[q] - GW / 2) / k + W / 2), int((ly[q] - GH / 2) / k + H / 2)), 3, (255, 0, 255), -1)
gl = cv2.resize(globe.astype(np.uint8), None, fx=1 / k, fy=1 / k, interpolation=cv2.INTER_NEAREST)[cy - H // 2:cy + H // 2, cx - W // 2:cx + W // 2]
vis[gl > 0] = (vis[gl > 0] * 0.6).astype(np.uint8)
cv2.imwrite(str(WORK / "layout-contours.jpg"), cv2.resize(vis, (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
wv = cv2.applyColorMap((np.clip(wt / max(wt.max(), 1e-9), 0, 1) * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
cv2.imwrite(str(WORK / "layout-weight.jpg"), cv2.resize(wv, (1152, 648), interpolation=cv2.INTER_NEAREST))
print("unknowns", n, "equations", eq, "residual rms", res)
