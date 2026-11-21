import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK

src = sys.argv[1] if len(sys.argv) > 1 else "references/approved/saturn-close.jpg"
out = sys.argv[2] if len(sys.argv) > 2 else "close-plan.jpg"
rings = len(sys.argv) > 3
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
img = cv2.imread(str(ROOT / src))
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
S, E = 1200, 2.7
gx, gy = np.meshgrid((np.arange(S) + 0.5) / S * 2 * E - E, (np.arange(S) + 0.5) / S * 2 * E - E)
P = C + gx[..., None] * side + gy[..., None] * hc
z = -P[..., 2]
x = P[..., 0] / np.maximum(z, 1e-6) * f + W / 2
y = H / 2 - P[..., 1] / np.maximum(z, 1e-6) * f
ok = (z > 0.01) & (x > 1) & (x < W - 2) & (y > 1) & (y < H - 2)
plan = cv2.remap(img, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT)
plan[~ok] = (40, 0, 40)
px = lambda u, v: (int((u + E) / (2 * E) * S), int((v + E) / (2 * E) * S))
if rings:
    for r, col in ((1.0, (0, 0, 255)), (1.2458, (0, 255, 0)), (1.94, (255, 255, 0)), (2.063, (255, 255, 0)), (2.3394, (0, 255, 0))):
        cv2.circle(plan, px(0, 0), int(r / (2 * E) * S), col, 1, cv2.LINE_AA)
cv2.circle(plan, px(0, reach), 5, (255, 0, 255), -1)
cv2.imwrite(str(WORK / out), plan, [cv2.IMWRITE_JPEG_QUALITY, 90])
print("camera at", 0, round(reach, 3), "height", round(height, 3))
