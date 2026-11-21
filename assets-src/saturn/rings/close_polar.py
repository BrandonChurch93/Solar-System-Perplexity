import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, linear_to_srgb, srgb_to_linear

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
f = (H / 2) / np.tan(np.radians(close["vfov"]) / 2)
tilt, roll = np.radians(close["tiltDeg"]), np.radians(close["rollDeg"])
nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
C = np.array(close["centre"])
height = -C @ nc
hc = -C - height * nc
reach = np.linalg.norm(hc)
hc /= reach
side = np.cross(nc, hc)
R0, R1, NR = -1.05, 2.60, 20000
A0, A1, NA = -75.0, 75.0, 1500
az = np.radians(A0 + (np.arange(NA) + 0.5) / NA * (A1 - A0))
rr = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
AZ, RR = np.meshgrid(az, rr)
P = C + (np.cos(AZ)[..., None] * hc + np.sin(AZ)[..., None] * side) * RR[..., None]
z = -P[..., 2]
x = P[..., 0] / z * f + W / 2
y = H / 2 - P[..., 1] / z * f
ok = (z > 0.01) & (x > 1) & (x < W - 2) & (y > 1) & (y < H - 2)
pol = cv2.remap(img, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
pol = inverse_filmic(srgb_to_linear(np.clip(pol, 0, 1))).astype(np.float32)
pol[~ok] = 0
dens = np.hypot(np.gradient(x, axis=0), np.gradient(y, axis=0)) / ((R1 - R0) / NR)
dens[~ok] = 0
np.save(WORK / "close-polar-lin.npy", pol)
np.save(WORK / "close-polar-dens.npy", dens.astype(np.float32))
np.save(WORK / "close-polar-ok.npy", ok)
print("height", height, "reach", reach, "max density px per radius", dens.max())
for a in range(0, NA, 125):
    col = dens[:, a]
    print("az", round(float(np.degrees(az[a])), 1), "ok rows", int(ok[:, a].sum()), "dens max", round(float(col.max()), 0), "at r", round(float(rr[col.argmax()]), 3), "r range", round(float(rr[ok[:, a]].min()), 3) if ok[:, a].any() else None, round(float(rr[ok[:, a]].max()), 3) if ok[:, a].any() else None)
out = np.clip(linear_to_srgb(pol / (1 + pol) * 1.6), 0, 1)
out = cv2.resize((out[..., ::-1] * 255).astype(np.uint8), (1200, 1500), interpolation=cv2.INTER_AREA)
cv2.imwrite(str(WORK / "close-polar.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 90])
