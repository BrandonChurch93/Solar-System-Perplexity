import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d, map_coordinates
from scipy.spatial import cKDTree

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "rings"))
from lib import ROOT, WORK, lum, srgb_to_linear
sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract import align
from layoutgeo import a2g, g2a, k, C, hc, side, plane_from_grid, model_lambda

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

L0, L1, NL = -1.05, 2.60, 20000
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
lay = json.loads((ROOT / "src/stops/saturn/layout.json").read_text())
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
field = np.load(WORK / "layout.npy")
GH, GW = field.shape
xs, ys = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
limb = np.load(WORK / "close-limb.npy")
junction = np.array([[1500, 768], [1700, 815], [1900, 858], [2100, 895], [2300, 945], [2500, 985], [2700, 1020], [2816, 1046]], np.float64)
poly = np.concatenate([limb, junction, [[W, 0], [limb[0, 0], 0]]]).astype(np.int32)
gmask = np.zeros((H, W), np.uint8)
cv2.fillPoly(gmask, [poly], 1)
gmask = cv2.dilate(gmask, np.ones((25, 25), np.uint8)) > 0
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
w = np.clip((axis - 0.42) / 0.14, 0, 1)[:, None]
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
SIG = 24.0
m = ring.astype(np.float32)
num = cv2.GaussianBlur(lum(scene) * m, (0, 0), SIG)
den = cv2.GaussianBlur(lum(rec) * m, (0, 0), SIG)
cov = cv2.GaussianBlur(m, (0, 0), SIG)
shade = np.clip(num / np.maximum(den, 1e-5), 0.02, 1.2)
known = (cov > 0.25) & (den > 2e-4)
sm = cv2.remap(cv2.GaussianBlur(np.where(known, shade, 0).astype(np.float32), (0, 0), 0.5 / k), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
km = cv2.remap(cv2.GaussianBlur(known.astype(np.float32), (0, 0), 0.5 / k), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
good = km > 0.6
val = np.where(good, sm / np.maximum(km, 1e-4), 0)
LS = 800.0
tree = cKDTree(np.stack([gx[good], gy[good], np.clip(field[good], -3, 4) * LS], -1))
_, near = tree.query(np.stack([gx[~good], gy[~good], np.clip(field[~good], -3, 4) * LS], -1))
filled = val.copy()
filled[~good] = val[good][near]
filled = np.where(good, val, cv2.GaussianBlur(filled, (0, 0), 2.0))
dist = cv2.distanceTransform((~good).astype(np.uint8), cv2.DIST_L2, 5)
reach_cells = 0.22 * W * k
wgt = np.clip(1 - dist / reach_cells, 0, 1)
wgt = wgt * wgt * (3 - 2 * wgt)
frame = live & (ax > 0) & (ax < W - 1) & (ay > 0) & (ay < H - 1)
near_frame = np.clip(1 - cv2.distanceTransform((~frame).astype(np.uint8), cv2.DIST_L2, 5) / reach_cells, 0, 1)
wgt = np.maximum(wgt, near_frame * near_frame * (3 - 2 * near_frame))
out = np.zeros((GH, GW, 4), np.float32)
out[..., 0] = diff_out
out[..., 1] = filled
out[..., 2] = wgt
for name in ("full", "web"):
    out.astype("<f4").tofile(ROOT / "public/assets/saturn" / name / "layout.bin")
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
