import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, lum, srgb_to_linear

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

AZ = float(sys.argv[1]) if len(sys.argv) > 1 else -2.0
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
img = cv2.imread(str(ROOT / (sys.argv[2] if len(sys.argv) > 2 else "references/approved/saturn-close.jpg")))[..., ::-1].astype(np.float32) / 255
img = cv2.resize(img, (704, 396), interpolation=cv2.INTER_AREA)
H, W = img.shape[:2]
t = np.tan(np.radians(close["vfov"]) / 2)
xs, ys = np.meshgrid((np.arange(W) + 0.5) / W * 2 - 1, 1 - (np.arange(H) + 0.5) / H * 2)
d = np.stack([xs * t * W / H, ys * t, -np.ones_like(xs)], -1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
c = np.array(close["centre"])
tilt, roll = np.radians(close["tiltDeg"]), np.radians(close["rollDeg"])
nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
height = -c @ nc
hc = -c - nc * height
hc /= np.linalg.norm(hc)
side = np.cross(nc, hc)
a = np.radians(AZ)
flat = -np.sin(a) * hc - np.cos(a) * side
ew = np.cross(nc, flat)
tp = (c @ nc) / (d @ nc)
P = d * tp[..., None] - c
r = np.linalg.norm(P, axis=-1)
along = P @ flat
w = P @ ew
near = (tp > 0) & (P @ hc > 0)
L = lum(inverse_filmic(srgb_to_linear(img)))
prof = np.load(WORK / "profile-close-a.npy")
pr = 0.02 + (np.arange(prof.shape[0]) + 0.5) / prof.shape[0] * 2.58
pl = np.nan_to_num(lum(prof))
k = np.ones(801) / 801
ref = np.interp(r, pr, np.convolve(pl, k, mode="same"))
ratio = L / np.maximum(ref, 1e-3)
ok = near & (r < 1.7) & (ref > 0.03)
print("rows: along from 0.4 down to -2.6, columns: w from -0.1 to 1.5 step 0.1")
for a0 in np.arange(0.4, -2.61, -0.2):
    row = []
    for w0 in np.arange(-0.1, 1.5, 0.1):
        m = ok & (along >= a0 - 0.2) & (along < a0) & (w >= w0) & (w < w0 + 0.1)
        row.append(f"{np.median(ratio[m]):.2f}" if m.sum() > 8 else " -- ")
    print(f"{a0:5.1f}", " ".join(row))
