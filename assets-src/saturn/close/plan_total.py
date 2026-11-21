import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import map_coordinates

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK
from layoutgeo import GW, GH, C, hc, side, reach, cam2g, model_lambda

S, N = 150, 1200
grid = np.fromfile(ROOT / "public/assets/saturn/full/layout.bin", "<f4").reshape(GH, GW, 4)
jj, ii = np.meshgrid(np.arange(N), np.arange(N))
u, v = (N / 2 - ii) / S, (jj - N / 2) / S
Q = C + u[..., None] * hc + v[..., None] * side
qx, qy, z = cam2g(Q)
ok = (z > 0.02) & (qx > 0) & (qx < GW) & (qy > 0) & (qy < GH)
inside = np.clip(np.minimum(np.minimum(qx, GW - qx) / GW, np.minimum(qy, GH - qy) / GH) / 0.04, 0, 1)
d = np.where(ok, map_coordinates(grid[..., 0], [np.clip(qy - 0.5, 0, GH - 1), np.clip(qx - 0.5, 0, GW - 1)], order=1, mode="nearest") * inside * inside * (3 - 2 * inside), 0.0)
total = model_lambda(u, v) + d
img = np.full((N, N, 3), 22, np.uint8)
img[ok] = 40
for i, lv in enumerate(np.arange(-1.0, 2.13, 0.04)):
    cs = cv2.findContours((total > lv).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]
    cv2.drawContours(img, cs, -1, (0, 255, 255) if i % 25 == 0 else ((0, 200, 0) if i % 2 == 0 else (200, 120, 0)), 1)
cv2.circle(img, (N // 2, N // 2), S, (90, 90, 255), 1)
cv2.circle(img, (N // 2, int(N / 2 - reach * S)), 4, (255, 255, 255), -1)
cv2.imwrite(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else "plan-total.jpg")), img, [cv2.IMWRITE_JPEG_QUALITY, 88])
