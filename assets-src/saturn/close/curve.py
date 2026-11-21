import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import POLAR, ROOT, WORK, lum, spheroid_hit, srgb_to_linear

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

film_path = sys.argv[1]
dest = ROOT / "src/stops/saturn/closeCurve.json"
cur = json.loads(dest.read_text())
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
film = cv2.imread(film_path)[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
t = np.tan(np.radians(close["vfov"]) / 2)
step = 4
xs, ys = np.meshgrid(np.arange(step / 2, W, step), np.arange(step / 2, H, step))
d = np.stack([(xs / W * 2 - 1) * t * W / H, (1 - ys / H * 2) * t, -np.ones_like(xs)], axis=-1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
c = np.array(close["centre"])
tilt, roll = np.radians(close["tiltDeg"]), np.radians(close["rollDeg"])
nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
o = -c
hit, th = spheroid_hit(o, d, nc)
p = o + d * th[..., None]
h = p @ nc
N = p + nc * (h * (1 / POLAR**2 - 1))[..., None]
N /= np.linalg.norm(N, axis=-1, keepdims=True)
mu = -(N * d).sum(-1)
height = -c @ nc
hc = -c - nc * height
hc /= np.linalg.norm(hc)
side = np.cross(nc, hc)
plan_az = float(sys.argv[2]) if len(sys.argv) > 2 else -2.0
a, e = np.radians(plan_az + cur["turnDeg"]), np.radians(cur["elevationDeg"])
light = np.cos(e) * (-np.sin(a) * hc - np.cos(a) * side) + np.sin(e) * nc
ndl = N @ light
size = (xs.shape[1], xs.shape[0])
A = inverse_filmic(srgb_to_linear(cv2.resize(img, size, interpolation=cv2.INTER_AREA)))
F = inverse_filmic(srgb_to_linear(cv2.resize(film, size, interpolation=cv2.INTER_AREA)))
m = hit & (h > 0.2) & (mu > 0.25)
m = cv2.erode(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
knots = cur["knots"]
x = (ndl[m] + 1) / 2 * (knots - 1)
curve = np.array(cur["curve"], np.float64)
out = curve.copy()
seen = np.zeros(knots, bool)
for i in range(knots):
    w = np.clip(1 - np.abs(x - i), 0, 1)
    if w.sum() < 40:
        continue
    seen[i] = True
    out[i] = curve[i] * np.clip((A[m] * w[:, None]).sum(0) / np.maximum((F[m] * w[:, None]).sum(0), 1e-6), 0.2, 5)
idx = np.arange(knots)
for k in range(3):
    out[:, k] = np.interp(idx, idx[seen], out[seen, k])
blend = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
out = curve * (out / np.maximum(curve, 1e-6)) ** blend
cur["curve"] = [[round(float(v), 5) for v in row] for row in out]
dest.write_text(json.dumps(cur, indent=1) + "\n")
la, lf = lum(A[m]), lum(F[m])
for lo, hi in ((-1, -0.2), (-0.2, -0.05), (-0.05, 0.05), (0.05, 0.15), (0.15, 0.3), (0.3, 0.5), (0.5, 0.75), (0.75, 1)):
    s = (ndl[m] >= lo) & (ndl[m] < hi)
    if s.sum() > 20:
        print(f"ndl {lo:5.2f} to {hi:5.2f}: approved {np.median(la[s]):.4f} film {np.median(lf[s]):.4f} ratio rgb", (np.median(A[m][s], 0) / np.maximum(np.median(F[m][s], 0), 1e-6)).round(3))
