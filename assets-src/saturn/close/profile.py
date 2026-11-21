import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d, map_coordinates
from scipy.spatial import cKDTree
from scipy.interpolate import PchipInterpolator

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "rings"))
from lib import ROOT, WORK, lum, srgb_to_linear
sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract import align
from layoutgeo import a2g, g2a, k, C, hc, side, plane_from_grid, model_lambda

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

L0, L1, NL = -1.05, 2.60, 20000
DETAIL = float(sys.argv[6]) if len(sys.argv) > 6 else 8.0
GM = int(sys.argv[7]) if len(sys.argv) > 7 else 9
CHROMA = float(sys.argv[10]) if len(sys.argv) > 10 else 0.25
SOFT = float(sys.argv[11]) if len(sys.argv) > 11 else -0.3
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
lay = json.loads((ROOT / "src/stops/saturn/layout.json").read_text())
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
field = np.load(WORK / "layout.npy")
GH, GW = field.shape
xs, ys = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
limb = np.load(WORK / "close-limb.npy")
JPTS = np.array([[1383, 718], [1400, 724.5], [1425, 735], [1450, 745.5], [1475, 757], [1500, 768], [1550, 782], [1600, 795], [1650, 806], [1700, 815.5], [1800, 838], [1900, 858], [2000, 877.5], [2100, 895.5], [2200, 912.5], [2300, 928], [2400, 942.5], [2500, 955.5], [2600, 967.5], [2700, 978], [2816, 989]], np.float64)
jx = np.arange(JPTS[0, 0], JPTS[-1, 0] + 1, 4.0)
junction = np.stack([jx, PchipInterpolator(JPTS[:, 0], JPTS[:, 1])(jx)], -1)
junction = np.concatenate([[[1392, 687], [1389, 700], [1385, 711]], junction])
poly = np.concatenate([limb, junction, [[W, 0], [limb[0, 0], 0]]]).astype(np.int32)
gmask = np.zeros((H, W), np.uint8)
cv2.fillPoly(gmask, [poly], 1)
gmask = cv2.dilate(gmask, np.ones((GM, GM), np.uint8)) > 0
gx, gy = np.meshgrid(np.arange(GW) + 0.5, np.arange(GH) + 0.5)
ax, ay, _ = g2a(gx, gy)
ax, ay = (ax - 0.5).astype(np.float32), (ay - 0.5).astype(np.float32)
hid = cv2.remap(gmask.astype(np.float32), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) > 0.5
X, live = plane_from_grid(gx, gy)
P = X - C
pu, pv = P @ hc, P @ side
base = model_lambda(pu, pv)
edge = np.clip(np.minimum(np.minimum(gx, GW - gx), np.minimum(gy, GH - gy)) / (0.06 * GH), 0, 1)
REACH, S0, SK, SF = (float(v) for v in (sys.argv[2:6] if len(sys.argv) > 5 else (0.8, 0.004, 0.5, 2.5)))
EDGE = json.loads((ROOT / "src/stops/saturn/rings.json").read_text())["warpClose"]
sure = live & ~hid & (ax > 12) & (ax < W - 13) & (ay > 12) & (ay < H - 13) & (field > EDGE[0] + 0.01) & (field < EDGE[3] + 0.05)
sure = cv2.erode(sure.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
foot = np.maximum(np.hypot(np.gradient(pu, axis=1), np.gradient(pv, axis=1)), np.hypot(np.gradient(pu, axis=0), np.gradient(pv, axis=0)))
cell = np.abs(np.gradient(pu, axis=1) * np.gradient(pv, axis=0) - np.gradient(pu, axis=0) * np.gradient(pv, axis=1))
tu, tv, td, ta = (a[sure].astype(np.float32) for a in (pu, pv, field - base, np.clip(cell, 1e-7, 0.02)))
need = live & (np.hypot(pu, pv) < 12)
qu, qv, qf = pu[need].astype(np.float32), pv[need].astype(np.float32), foot[need]
gap, _ = cKDTree(np.stack([tu, tv], -1)).query(np.stack([qu, qv], -1))
ext = np.zeros(len(qu), np.float32)
ids = np.nonzero(gap < REACH)[0]
for a in range(0, len(ids), 600):
    j = ids[a:a + 600]
    sg = (S0 + SK * gap[j] + SF * qf[j]).astype(np.float32)[:, None]
    wk = ta[None] * np.exp(-((qu[j, None] - tu[None]) ** 2 + (qv[j, None] - tv[None]) ** 2) / (2 * sg * sg))
    fade = np.clip(1 - gap[j] / REACH, 0, 1)
    ext[j] = (wk @ td) / np.maximum(wk.sum(1), 1e-30) * fade * fade * (3 - 2 * fade)
diff_out = np.zeros((GH, GW), np.float32)
diff_out[need] = ext
diff_out *= edge * edge * (3 - 2 * edge)
solved = field
field = np.where(live, base + diff_out, solved)
JL = -0.09
jc = junction[3:]
slope = (jc[-1] - jc[-2]) / np.linalg.norm(jc[-1] - jc[-2])
jc = np.concatenate([jc, jc[-1] + slope[None] * np.arange(4.0, 2 * W, 4.0)[:, None]])
jt = np.gradient(jc, axis=0)
jt /= np.linalg.norm(jt, axis=1)[:, None]
jn = np.stack([-jt[:, 1], jt[:, 0]], -1)
js = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(jc, axis=0), axis=1))])
axf, ayf = ax.astype(np.float64) + 0.5, ay.astype(np.float64) + 0.5
_, ji = cKDTree(jc).query(np.stack([axf, ayf], -1).reshape(-1, 2))
ji = ji.reshape(GH, GW)
rel = np.stack([axf, ayf], -1) - jc[ji]
jd = (rel * jn[ji]).sum(-1)
along = js[ji] + (rel * jt[ji]).sum(-1)
solved_total = field.copy()


def at0(x, y):
    qx, qy, ok = a2g(np.asarray(x, np.float64), np.asarray(y, np.float64))
    return np.where(ok, map_coordinates(solved_total, [qy - 0.5, qx - 0.5], order=1, mode="nearest"), 9.0)


if "--trace" in sys.argv:
    for x in (1500, 2000, 2300, 2500, 2700):
        yy = np.arange(900, 1300, 20.0)
        print("solved field at x", x, " ".join(f"{int(y)}:{v:.2f}" for y, v in zip(yy, at0(np.full_like(yy, x), yy))))
JE = 0.62
dd = np.arange(0.0, 420.0, 2.0)
ray = at0(jc[:, None, 0] + jn[:, None, 0] * dd[None], jc[:, None, 1] + jn[:, None, 1] * dd[None])
low = (ray < JE) & (dd[None] > 30)
start = np.argmax(low, axis=1)
after = (ray >= JE) & (ray < 5) & (np.arange(len(dd))[None] > start[:, None])
found = low.any(1) & after.any(1)
width = np.where(found, dd[np.argmax(after, axis=1)], np.nan)
idx = np.arange(len(jc))
width = np.interp(idx, idx[found], width[found])
width = gaussian_filter1d(width, 12.0, mode="nearest")
print("junction to the inner edge of the B ring, px, at x 1500, 2000, 2300, 2500, 2700:", [round(float(width[np.argmin(np.abs(jc[:, 0] - x))]), 1) for x in (1500, 2000, 2300, 2500, 2700)])
JDc = width[ji]
jw = np.clip(along / 40.0, 0, 1) * np.clip((jd + 40.0) / 10.0, 0, 1) * np.clip((1 - jd / JDc) / 0.25, 0, 1) * (np.abs((rel * jt[ji]).sum(-1)) < 12) * live * (np.abs(field) < 2.2) * need
jw = jw * jw * (3 - 2 * jw) * edge * edge * (3 - 2 * edge)
delta = np.where(live & (jw > 0), jw * (JL + (JE - JL) * jd / JDc - field), 0).astype(np.float32)
field = field + delta
diff_out = diff_out + delta
print("junction zone cells", int((jw > 0.5).sum()))
np.save(WORK / "layout-total.npy", np.where(live, field, 9.0).astype(np.float32))
bx, by = np.gradient(base, axis=1), np.gradient(base, axis=0)
grow = (np.gradient(field, axis=1) * bx + np.gradient(field, axis=0) * by) / np.maximum(bx * bx + by * by, 1e-12)
chk = live & (base > EDGE[0]) & (base < EDGE[3] + 0.2) & (edge >= 1)
print("layout minus model: in frame rms", float(np.sqrt((td ** 2).mean())), "largest", float(np.abs(td).max()), "smoothed and extended largest", float(np.abs(diff_out).max()), "change in the sure cells rms", float(np.sqrt(((field - solved)[sure] ** 2).mean())))
print("growth of the band coordinate along the model's normal, 1 = model: percentiles 0.1, 1, 50, 99", np.percentile(grow[chk], [0.1, 1, 50, 99]).round(3), "cells not growing", int((grow[chk] <= 0.05).sum()), "of", int(chk.sum()))


def at(x, y):
    qx, qy, ok = a2g(np.asarray(x, np.float64), np.asarray(y, np.float64))
    return np.where(ok, map_coordinates(field, [qy - 0.5, qx - 0.5], order=1, mode="nearest"), 9.0)


lam = at(xs, ys).astype(np.float32)
np.save(WORK / "lam-approved.npy", lam)
axis = L0 + (np.arange(NL) + 0.5) / NL * (L1 - L0)


def family(A, B, offs, reach, name):
    d = (B - A) / np.linalg.norm(B - A)
    nrm = np.array([-d[1], d[0]])
    t = np.arange(0, np.linalg.norm(B - A), 0.25)
    cols, oks = [], []
    for off in offs:
        p = A[None] + d[None] * t[:, None] + nrm[None] * off
        inside = (p[:, 0] > 2) & (p[:, 0] < W - 3) & (p[:, 1] > 2) & (p[:, 1] < H - 3)
        mx, my = (p[:, 0] - 0.5).astype(np.float32)[None], (p[:, 1] - 0.5).astype(np.float32)[None]
        c = cv2.remap(img, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)[0]
        l = at(p[:, 0], p[:, 1])
        c = inverse_filmic(srgb_to_linear(np.clip(c, 0, 1)))
        keep = inside & (np.gradient(l) > 1e-5)
        l, c = l[keep], c[keep]
        order = np.argsort(l)
        l, c = l[order], c[order]
        cols.append(np.stack([np.interp(axis, l, c[:, k], left=0, right=0) for k in range(3)], -1))
        gap = np.interp(axis, l[:-1], np.diff(l), left=1, right=1)
        oks.append((axis > l[0]) & (axis < l[-1]) & (gap < 0.01))
    pol = np.stack(cols, 1).astype(np.float32)
    ok = np.stack(oks, 1)
    prof, count, shifts = align(pol, ok, list(range(len(offs))), len(offs) // 2, reach, sigma=4.0)
    good = np.isfinite(prof[:, 0])
    print(name, "lambda", round(float(axis[good].min()), 3), round(float(axis[good].max()), 3), "shifts", [round(float(shifts[k]), 1) for k in sorted(shifts)])
    if DETAIL > 0:
        p = A[None] + d[None] * t[:, None]
        lc = at(p[:, 0], p[:, 1])
        mono = np.maximum.accumulate(lc)
        ok_t = (p[:, 0] > 8) & (p[:, 0] < W - 9) & (p[:, 1] > 8) & (p[:, 1] < H - 9) & (np.gradient(lc) > 1e-5) & (lc >= mono - 1e-6)
        cuts = []
        for off in (-2.0, 0.0, 2.0):
            q = p + nrm[None] * off
            c = cv2.remap(img, (q[:, 0] - 0.5).astype(np.float32)[None], (q[:, 1] - 0.5).astype(np.float32)[None], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)[0]
            c = inverse_filmic(srgb_to_linear(np.clip(c, 0, 1)))
            lo = at(q[:, 0], q[:, 1])
            o = np.argsort(lo)
            cuts.append(np.stack([np.interp(lc, lo[o], c[o, k]) for k in range(3)], -1))
        med = np.median(np.stack(cuts), 0)
        sg = DETAIL / 0.25
        base_t = np.stack([np.interp(lc, axis[good], prof[good, k]) for k in range(3)], -1)
        lo_b = gaussian_filter1d(base_t, sg, axis=0, mode="nearest")
        lo_m = gaussian_filter1d(med, sg, axis=0, mode="nearest")
        per = np.clip(med / np.maximum(lo_m, 1e-5), 0.2, 4.0)
        grey = np.clip(lum(med) / np.maximum(lum(lo_m), 1e-5), 0.2, 4.0)[:, None]
        new_t = lo_b * (grey + CHROMA * (per - grey))
        sel = ok_t & (lc > axis[good].min()) & (lc < axis[good].max())
        fresh = np.stack([np.interp(axis, lc[sel], new_t[sel, k]) for k in range(3)], -1)
        span = good & (axis > lc[sel].min()) & (axis < lc[sel].max())
        ratio = lum(med) / np.maximum(lum(lo_m), 1e-5)
        print(name, "detail of the centre cuts, rms of ratio minus 1:", round(float(np.sqrt(((ratio[sel] - 1) ** 2).mean())), 4), "of the average:", round(float(np.sqrt(((lum(base_t)[sel] / np.maximum(lum(lo_b)[sel], 1e-5) - 1) ** 2).mean())), 4))
        prof = np.where(span[:, None], fresh, prof)
    return prof, good


far, far_ok = family(np.array([0.90 * W, 0.615 * H]), np.array([0.012 * W, 0.985 * H]), [-120, -90, -60, -30, 0, 30, 60, 90, 120], 40.0, "shadow side line")
lit, lit_ok = family(np.array([0.56 * W, 0.47 * H]), np.array([0.50 * W, 0.995 * H]), [-90, -60, -30, 0, 30, 60, 90], 40.0, "lit side line")
left, left_ok = family(np.array([620.0, 970.0]), np.array([60.0, 610.0]), [-60, -30, 0, 30, 60], 30.0, "left line")
lit_ok &= axis > -0.60
far_ok &= axis > -0.60
over = (axis > 0.70) & (axis < 1.3) & far_ok & lit_ok
gain = np.median(far[over], 0) / np.maximum(np.median(lit[over], 0), 1e-4)
print("gain shadow side over lit side in the B ring", gain.round(3))
far, lit, left = np.nan_to_num(far), np.nan_to_num(lit) * gain, np.nan_to_num(left)
w = np.clip((axis - 0.64) / 0.08, 0, 1)[:, None]
w = w * w * (3 - 2 * w)
prof = np.where(lit_ok[:, None], lit * (1 - w) + far * w, far)
over = (axis > 1.84) & (axis < 1.98) & far_ok & left_ok
gain_l = np.median(far[over], 0) / np.maximum(np.median(left[over], 0), 1e-4)
print("gain shadow side line over left line in the A ring", gain_l.round(3))
w = np.clip((axis - 1.985) / 0.023, 0, 1)[:, None]
w = w * w * (3 - 2 * w)
prof = np.where(left_ok[:, None] & far_ok[:, None], prof * (1 - w) + left * gain_l * w, np.where(left_ok[:, None], left * gain_l, prof))
have = far_ok | lit_ok | left_ok
first = int(np.argmax(have))
prof[:first] = prof[first:first + 60].mean(0)
have[:first] = True
BASE = -0.12
prof[axis < BASE] = prof[(axis >= BASE) & (axis < BASE + 0.06)].mean(0)
soft = gaussian_filter1d(np.nan_to_num(prof), 0.03 / (L1 - L0) * NL, axis=0, mode="nearest")
w = np.clip((axis - SOFT) / 0.14, 0, 1)[:, None]
w = w * w * (3 - 2 * w)
prof = np.where(np.isfinite(prof), soft * (1 - w) + prof * w, prof)
prof[~have] = np.nan
np.save(WORK / "profile-close-lam.npy", prof.astype(np.float32))

pp = np.nan_to_num(prof)
scene = inverse_filmic(srgb_to_linear(np.clip(img, 0, 1)))
ix = np.clip(((lam - L0) / (L1 - L0) * NL).astype(int), 0, NL - 1)
rec = pp[ix]
ring = (lam > L0) & (lam < json.loads((ROOT / "src/stops/saturn/rings.json").read_text())["warpClose"][3]) & have[ix]
ring &= ~gmask
SIG = float(sys.argv[8]) if len(sys.argv) > 8 else 12.0
m = ring.astype(np.float32)
num = cv2.GaussianBlur(lum(scene) * m, (0, 0), SIG)
den = cv2.GaussianBlur(lum(rec) * m, (0, 0), SIG)
cov = cv2.GaussianBlur(m, (0, 0), SIG)
shade = np.clip(num / np.maximum(den, 1e-5), 0.02, 1.2)
peak = cv2.dilate(lum(rec) * m, np.ones((15, 15), np.uint8))
deep = np.clip(cv2.GaussianBlur(lum(scene) * m, (0, 0), 5.0) / np.maximum(cv2.GaussianBlur(peak, (0, 0), 5.0), 1e-5), 0.02, 1.2)
dark = np.clip((0.04 - cv2.GaussianBlur(lum(scene), (0, 0), 8.0)) / 0.03, 0, 1)
shade = shade + dark * dark * (3 - 2 * dark) * (np.minimum(shade, deep) - shade)
known = (cov > 0.25) & (den > 2e-4)
sm = cv2.remap(cv2.GaussianBlur(np.where(known, shade, 0).astype(np.float32), (0, 0), 0.5 / k), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
km = cv2.remap(cv2.GaussianBlur(known.astype(np.float32), (0, 0), 0.5 / k), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
good = km > 0.6
val = np.where(good, sm / np.maximum(km, 1e-4), 0)
LS = float(sys.argv[9]) if len(sys.argv) > 9 else 150.0
tree = cKDTree(np.stack([gx[good], gy[good], np.clip(field[good], -3, 4) * LS], -1))
_, near = tree.query(np.stack([gx[~good], gy[~good], np.clip(field[~good], -3, 4) * LS], -1))
filled = val.copy()
filled[~good] = val[good][near]
band = ~good & live & (along > 0) & (jd > -45) & (jd < 60) & (np.abs((rel * jt[ji]).sum(-1)) < 12)
src = good & (jd > 0) & (jd < 90) & (along > 0)
_, near_j = cKDTree(np.stack([along[src], jd[src] * 0.15], -1)).query(np.stack([along[band], jd[band] * 0.15], -1))
filled[band] = val[src][near_j]
filled = np.where(good, val, cv2.GaussianBlur(filled, (0, 0), 2.0))
dist = cv2.distanceTransform((~good).astype(np.uint8), cv2.DIST_L2, 5)
EVEN = float(sys.argv[12]) if len(sys.argv) > 12 else 22.0
calm = cv2.GaussianBlur(filled, (0, 0), 6.0)
lit_part = np.clip((calm - 0.3) / 0.2, 0, 1)
lit_part = lit_part * lit_part * (3 - 2 * lit_part)
even = cv2.GaussianBlur(filled * lit_part, (0, 0), EVEN) / np.maximum(cv2.GaussianBlur(lit_part, (0, 0), EVEN), 1e-3)
even = (calm + lit_part * (even - calm)).astype(np.float32)
reach_cells = 0.22 * W * k
wgt = np.clip(1 - dist / reach_cells, 0, 1)
wgt = wgt * wgt * (3 - 2 * wgt)
frame = live & (ax > 0) & (ax < W - 1) & (ay > 0) & (ay < H - 1)
near_frame = np.clip(1 - cv2.distanceTransform((~frame).astype(np.uint8), cv2.DIST_L2, 5) / reach_cells, 0, 1)
wgt = np.maximum(wgt, near_frame * near_frame * (3 - 2 * near_frame))
under = np.clip((cv2.GaussianBlur(np.maximum.accumulate(good, axis=0).astype(np.float32), (0, 0), 10.0) - 0.5) / 0.45, 0, 1)
wgt = np.maximum(wgt, under * under * (3 - 2 * under))
out = np.zeros((GH, GW, 4), np.float32)
out[..., 0] = diff_out
out[..., 1] = filled
out[..., 2] = wgt
Q = 4
last = junction[-1] + (junction[-1] - junction[-2]) / (junction[-1, 0] - junction[-2, 0]) * 2 * W
wide = np.concatenate([limb, junction, [last, [3 * W, -2 * H], [limb[0, 0], -2 * H]]])
canvas = np.zeros((5 * H // Q, 5 * W // Q), np.uint8)
cv2.fillPoly(canvas, [np.round((wide + [2 * W, 2 * H]) / Q).astype(np.int32)], 1)
sdf = (cv2.distanceTransform(1 - canvas, cv2.DIST_L2, 5) - cv2.distanceTransform(canvas, cv2.DIST_L2, 5)) * Q
sdf = cv2.GaussianBlur(sdf, (0, 0), 1.5)
out[..., 3] = np.clip(cv2.remap(sdf.astype(np.float32), (ax + 2 * W) / Q, (ay + 2 * H) / Q, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), -400, 4000)
out[..., 3] = np.where(live, out[..., 3], 4000)
if "--trace" in sys.argv:
    rr = np.hypot(pu, pv)
    for lo, hi in ((0, 0.5), (0.5, 0.9), (0.9, 1.0), (1.0, 1.1), (1.1, 1.25), (1.25, 1.4)):
        m = live & (rr >= lo) & (rr < hi)
        print("sdf r", lo, hi, int(m.sum()), np.round(np.percentile(out[..., 3][m], [0, 5, 25, 50, 75, 95, 100]), 0) if m.any() else "")
for name in ("full", "web"):
    out.astype("<f4").tofile(ROOT / "public/assets/saturn" / name / "layout.bin")
    even.astype("<f4").tofile(ROOT / "public/assets/saturn" / name / "layout-even.bin")
np.save(WORK / "layout-shade.npy", filled)
print("shade in frame: percentiles", np.percentile(shade[known], [1, 10, 50, 90, 99]).round(3))
check = np.clip(rec * shade[..., None], 0, None)
check = np.where(ring[..., None], check, scene)
disp = lambda x: np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1) ** (1 / 2.2)
both = np.vstack([cv2.resize(img[..., ::-1], (1100, 619), interpolation=cv2.INTER_AREA), cv2.resize(disp(check)[..., ::-1].astype(np.float32), (1100, 619), interpolation=cv2.INTER_AREA)])
cv2.imwrite(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else "profile-check.jpg")), (both * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
cv2.imwrite(str(WORK / "profile-rebuild.png"), (disp(check)[..., ::-1] * 255).astype(np.uint8))
cv2.imwrite(str(WORK / "layout-shade.jpg"), np.hstack([cv2.resize((np.clip(a, 0, 1) * 255).astype(np.uint8), (720, 540), interpolation=cv2.INTER_NEAREST) for a in (filled / 1.2, wgt)]))
lp = lum(np.nan_to_num(prof))
print(" ".join(f"{axis[i]:.2f}:{lp[i]:.3f}" for i in range(0, NL, 110)))
vis = np.clip(np.nan_to_num(prof) / (1 + np.nan_to_num(prof)) * 1.6, 0, 1) ** (1 / 2.2)
bar = np.repeat(vis[None, :, ::-1], 120, axis=0)
rows = [cv2.resize((bar[:, i:i + NL // 3] * 255).astype(np.uint8), (2000, 120), interpolation=cv2.INTER_AREA) for i in range(0, NL - 2, NL // 3)]
cv2.imwrite(str(WORK / "profile-close-lam.jpg"), np.vstack(rows[:3]), [cv2.IMWRITE_JPEG_QUALITY, 90])
