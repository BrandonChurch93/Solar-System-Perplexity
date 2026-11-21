import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.interpolate import LinearNDInterpolator
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, lum, srgb_to_linear, linear_to_srgb

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

PX = 24
FLAT = 0.6
RESET = "--reset" in sys.argv
META = ROOT / "src/stops/saturn/closeGlobe.json"
NAME = "close-globe.jpg"
LIGHT = "close-light.bin"


def filmic(x):
    x = np.clip(x, 0, None)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def probe(k):
    p = cv2.imread(str(WORK / f"probe-{k}.png"), cv2.IMREAD_UNCHANGED)
    return (p[..., 2].astype(np.float64) + p[..., 1] / 255.0) / 255.0, p[..., 0] == 255


def scene(path):
    im = cv2.imread(str(path))[..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(im)).astype(np.float32)


A = scene(ROOT / "references/approved/saturn-close.jpg")
H, W = A.shape[:2]
up = lambda im, mode=cv2.INTER_CUBIC: cv2.resize(im.astype(np.float32), (W, H), interpolation=mode)
F, F0, F1 = (up(scene(WORK / f"probe-{k}.png")) for k in (0, 5, 6))
u, m = probe(1)
v, _ = probe(2)
ndl, _ = probe(3)
mu, _ = probe(4)
small = cv2.erode(m.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
med = float(np.median(u[small]))
us = (u - med + 0.5) % 1.0
mask = up(small, cv2.INTER_LINEAR) > 0.999
mask[:10] = mask[-10:] = False
mask[:, :10] = mask[:, -10:] = False
us, v, ndl, mu = (up(a, cv2.INTER_LINEAR) for a in (us, v, ndl, mu))
L = np.maximum((F1 - F0) / FLAT, 1e-5)
x = np.clip(ndl, 0, 1) * 32

old = json.loads(META.read_text()) if META.exists() and not RESET else None
gain = np.array(old["curveGain"]) if old else np.ones((33, 3))
step = np.full((33, 3), np.nan)
for i in range(33):
    sel = mask & (mu > 0.3) & (np.abs(x - i) < 0.75)
    if sel.sum() < 3000:
        continue
    den = np.median((F - F0)[sel], 0)
    num = np.median((A - F0)[sel], 0)
    if den.min() > 2e-3:
        step[i] = np.clip(num / den, 0.2, 3.0)
have = np.isfinite(step[:, 0])
idx = np.arange(33)
for c in range(3):
    step[:, c] = np.interp(idx, idx[have], step[have, c])
step = gaussian_filter1d(step, 0.6, axis=0, mode="nearest")
if old:
    step = np.ones((33, 3))
gain = gain * step
print("knots with data", int(have.sum()), "from", int(idx[have].min()), "to", int(idx[have].max()))
print("curve gain step, every second knot with data:", " ".join(f"{i}:{step[i].round(2).tolist()}" for i in idx[have][::2]))

cg = np.stack([np.interp(x, idx, step[:, c]) for c in range(3)], -1).astype(np.float32)
lat = (v - 0.5) * 180.0
TW, TH = 33, 91
tables = [ROOT / "public/assets/saturn" / name / LIGHT for name in ("full", "web")]
table = np.fromfile(tables[0], "<f4").reshape(TH, TW, 4)[..., :3].astype(np.float64) if old and tables[0].exists() else np.ones((TH, TW, 3))
ratio = (A - F0) / (L * cg)
use = mask & (mu > 0.3) & (lum(L) > 0.004)
bx = np.clip(np.round(x), 0, 32).astype(np.int64)
by = np.clip(np.round((lat + 90.0) / 2.0), 0, TH - 1).astype(np.int64)
key = (by * TW + bx)[use]
vals = ratio[use]
order = np.argsort(key, kind="stable")
key, vals = key[order], vals[order]
cuts = np.nonzero(np.diff(key))[0] + 1
M = np.full((TH * TW, 3), np.nan)
for seg_key, seg in zip(key[np.concatenate([[0], cuts])], np.split(vals, cuts)):
    if len(seg) >= 300:
        M[seg_key] = np.median(seg, 0)
M = M.reshape(TH, TW, 3)
ref = np.full((TH, 3), np.nan)
for j in range(TH):
    okc = np.nonzero(np.isfinite(M[j, :, 0]) & (idx >= 20))[0]
    if len(okc) >= 3:
        ref[j] = np.median(M[j, okc[-5:]], 0)
rows_ok = np.isfinite(ref[:, 0])
tstep = M / ref[:, None]
row_idx = np.arange(TH)
for j in row_idx[rows_ok]:
    okc = np.isfinite(tstep[j, :, 0])
    for c in range(3):
        tstep[j, :, c] = np.interp(idx, idx[okc], tstep[j, okc, c])
near_row = row_idx[rows_ok][np.abs(row_idx[rows_ok][None] - row_idx[:, None]).argmin(1)]
tstep = tstep[near_row]
from scipy.ndimage import gaussian_filter
tstep = np.clip(np.stack([gaussian_filter(tstep[..., c], (1.0, 0.7), mode="nearest") for c in range(3)], -1), 0.2, 3.0)
fade = np.clip((row_idx - 43) / 3.0, 0, 1)[:, None, None]
tstep = 1 + (tstep - 1) * fade
table = np.clip(table * tstep, 0.05, 6.0)
print("light table rows with data", int(rows_ok.sum()), "lat", (row_idx[rows_ok].min() * 2 - 90), "to", (row_idx[rows_ok].max() * 2 - 90), "step percentiles", np.percentile(tstep[rows_ok], [1, 25, 50, 75, 99]).round(3))
fy = np.clip((lat + 90.0) / 2.0, 0, TH - 1.001)
fx = np.clip(x, 0, 31.999)
tl = cv2.remap(tstep.astype(np.float32), fx.astype(np.float32), fy.astype(np.float32), cv2.INTER_LINEAR)
light = L * cg * tl
for t in tables:
    np.concatenate([table, np.ones((TH, TW, 1))], -1).astype("<f4").tofile(t)
P = np.clip((A - F0) / light, 0, 4)
wrap = np.clip((F - F0) / L, 0, 4)
rel = mask & (mu > 0.32) & (lum(light) > 0.05)
rel = cv2.erode(rel.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
print("pixels used", int(rel.sum()), "of the globe", int(mask.sum()), "albedo median approved", np.median(P[rel], 0).round(3), "wrap as rendered", np.median(wrap[rel], 0).round(3))

lon = us * 360.0
lo0, lo1 = np.percentile(lon[rel], [0.05, 99.95])
la0, la1 = np.percentile(lat[rel], [0.05, 99.95])
box = [lo0 - 30, lo1 + 30, max(la0 - 6, -89), min(la1 + 14, 89)]
PW, PH = int(round((box[1] - box[0]) * PX / 64)) * 64, int(round((box[3] - box[2]) * PX / 64)) * 64
print("reliable lon", round(lo0, 2), round(lo1, 2), "lat", round(la0, 2), round(la1, 2), "patch", PW, PH)
ys, xs = np.nonzero(rel)
pick = (ys % 3 == 0) & (xs % 3 == 0)
tri = LinearNDInterpolator(np.stack([lon[ys[pick], xs[pick]], lat[ys[pick], xs[pick]]], -1), np.stack([xs[pick], ys[pick]], -1).astype(np.float64))
glon = box[0] + (np.arange(PW) + 0.5) / PW * (box[1] - box[0])
glat = box[3] - (np.arange(PH) + 0.5) / PH * (box[3] - box[2])
GX, GY = np.meshgrid(glon, glat)
xy = tri(np.stack([GX.ravel(), GY.ravel()], -1)).reshape(PH, PW, 2)
ok = np.isfinite(xy[..., 0])
mx, my = np.nan_to_num(xy[..., 0]).astype(np.float32), np.nan_to_num(xy[..., 1]).astype(np.float32)
patch = cv2.remap(P, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
dist = cv2.distanceTransform(rel.astype(np.uint8), cv2.DIST_L2, 5)
sure = (cv2.remap(dist, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) > 22) & ok
density = np.hypot(np.gradient(mx, axis=1), np.gradient(my, axis=1))
print("approved pixels per patch texel along longitude, median in the sure region", round(float(np.median(density[sure])), 3))

w = sure.astype(np.float32)
SIG = 0.8 * PX
low = cv2.GaussianBlur(patch * w[..., None], (0, 0), SIG) / np.maximum(cv2.GaussianBlur(w, (0, 0), SIG), 1e-4)[..., None]
detail = np.clip(patch / np.maximum(low, 1e-4), 0.5, 2.0)
low_full = np.zeros_like(patch)
det_full = np.ones_like(patch)
rows = np.zeros(PH, bool)
MIN_RUN = 10 * PX
for j in range(PH):
    cols = np.nonzero(sure[j])[0]
    if len(cols) < MIN_RUN:
        continue
    runs = np.split(cols, np.nonzero(np.diff(cols) > 1)[0] + 1)
    run = max(runs, key=len)
    a, b = int(run[0]), int(run[-1])
    if b - a < MIN_RUN:
        continue
    t = (np.arange(PW) - a) % (2 * (b - a))
    det_full[j] = detail[j, a + np.where(t <= b - a, t, 2 * (b - a) - t)]
    low_full[j] = low[j, np.clip(np.arange(PW), a + PX // 2, b - PX // 2)]
    rows[j] = True
good = np.nonzero(rows)[0]
ja, jb = int(good[0]), int(good[-1])
t = (np.arange(PH) - ja) % (2 * (jb - ja))
src = ja + np.where(t <= jb - ja, t, 2 * (jb - ja) - t)
det_full = det_full[good[np.abs(good[None] - src[:, None]).argmin(1)]]
low_full = low_full[good[np.abs(good[None] - np.arange(PH)[:, None]).argmin(1)]]
soft = cv2.GaussianBlur(low_full, (0, 0), 0.5 * PX)
inside = cv2.GaussianBlur(cv2.erode(sure.astype(np.uint8), np.ones((PX, PX), np.uint8)).astype(np.float32), (0, 0), 0.5 * PX)[..., None]
full = (low * inside + soft * (1 - inside)) * (detail * inside + det_full * (1 - inside))
out = np.clip(linear_to_srgb(filmic(full)) * 255 + 0.5, 0, 255).astype(np.uint8)[..., ::-1]
for name, scale in (("full", 1), ("web", 2)):
    im = out if scale == 1 else cv2.resize(out, (PW // scale, PH // scale), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(ROOT / "public/assets/saturn" / name / NAME), im, [cv2.IMWRITE_JPEG_QUALITY, 93])
centre = (0.5 * (box[0] + box[1]) / 360.0 + med - 1.0) * 360.0
meta = {"file": NAME, "lonCentreDeg": round(float(centre), 5), "lonHalfDeg": round(float(0.5 * (box[1] - box[0])), 5), "latDeg": [round(float(box[2]), 5), round(float(box[3]), 5)], "sets": {"full": [PW, PH], "web": [PW // 2, PH // 2]}, "light": {"file": LIGHT, "width": TW, "height": TH}, "curveGain": gain.round(5).tolist()}
META.write_text(json.dumps(meta, indent=1) + "\n")
view = np.zeros_like(out)
view[sure] = out[sure]
cv2.imwrite(str(WORK / "close-globe-check.jpg"), np.vstack([cv2.resize(a, (PW // 3, PH // 3), interpolation=cv2.INTER_AREA) for a in (view, out)]), [cv2.IMWRITE_JPEG_QUALITY, 88])
print("wrote", NAME, PW, PH, "rows with data", int(rows.sum()), "of", PH)
