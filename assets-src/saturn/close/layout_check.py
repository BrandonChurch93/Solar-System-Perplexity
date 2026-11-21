import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import map_coordinates

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK
from layoutgeo import GW, GH, W, H, C, hc, side, a2g, plane_from_approved, model_lambda

STEP = 4
field = np.load(WORK / "layout.npy")
grid = np.fromfile(ROOT / "public/assets/saturn/full/layout.bin", "<f4").reshape(GH, GW, 4)
xs, ys = np.meshgrid(np.arange(0, W, STEP) + 0.5, np.arange(0, H, STEP) + 0.5)
qx, qy, ok = a2g(xs, ys)
read = lambda a: map_coordinates(a, [np.clip(qy - 0.5, 0, GH - 1), np.clip(qx - 0.5, 0, GW - 1)], order=1, mode="nearest")
X, live = plane_from_approved(xs, ys)
P = X - C
u, v = P @ hc, P @ side
total = model_lambda(u, v) + read(grid[..., 0])
solved = read(field)
r = np.hypot(u, v)
ring = ok & (solved > -1.2) & (solved < 2.3)
d = np.where(ring, total - solved, 0)
print("shader field minus solved field in the approved frame: rms", float(np.sqrt((d[ring] ** 2).mean())), "p99", float(np.percentile(np.abs(d[ring]), 99)), "largest", float(np.abs(d).max()))
bad = ring & (np.abs(d) > 0.02)
print("cells off by more than 0.02:", int(bad.sum()), "of", int(ring.sum()))
if bad.any():
    yy, xx = np.nonzero(bad)
    print(" bounding box in approved pixels", xx.min() * STEP, yy.min() * STEP, xx.max() * STEP, yy.max() * STEP, "radius range", float(r[bad].min()), float(r[bad].max()))
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))
vis = cv2.resize(img, (W // STEP, H // STEP), interpolation=cv2.INTER_AREA)
for i, lv in enumerate(np.arange(-1.0, 2.2, 0.1)):
    cs = cv2.findContours((np.where(ok, total, 9) > lv).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]
    cv2.drawContours(vis, cs, -1, (0, 255, 255) if i % 10 == 0 else ((0, 255, 0) if i % 2 == 0 else (255, 160, 0)), 1)
vis[bad] = (0, 0, 255)
cv2.imwrite(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else "layout-check.jpg")), vis, [cv2.IMWRITE_JPEG_QUALITY, 88])
