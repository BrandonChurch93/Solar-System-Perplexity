import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK
from layoutgeo import GW, GH, C, hc, side, reach, plane_from_grid, plane_from_approved, model_lambda, MODEL

field = np.load(WORK / "layout.npy")
wt = np.load(WORK / "layout-wt.npy")
gx, gy = np.meshgrid(np.arange(GW) + 0.5, np.arange(GH) + 0.5)
X, live = plane_from_grid(gx, gy)
P = X - C
u, v = P @ hc, P @ side
m = live & (wt > 0.2) & (field > -0.98) & (field < 2.12) & (np.hypot(u, v) < 6)
uu, vv, ll = u[m], v[m], field[m]
oc = np.load(WORK / "close-outer.npy")[::4]
Xo, _ = plane_from_approved(oc[:, 0].astype(np.float64), oc[:, 1].astype(np.float64))
Po = Xo - C
EDGE = json.loads((ROOT / "src/stops/saturn/rings.json").read_text())["warpClose"][3]
uu, vv, ll = np.concatenate([uu, Po @ hc]), np.concatenate([vv, Po @ side]), np.concatenate([ll, np.full(len(Po), EDGE)])
wgt = np.concatenate([np.ones(int(m.sum())), np.full(len(Po), 6.0)])
pack = lambda p: {"c0": [p[0], p[1]], "c1": [p[2], p[3]], "R": [p[4], p[5]]}
geo = lambda p: (np.hypot(uu - p[0] - p[2] * ll, vv - p[1] - p[3] * ll) - (p[4] + p[5] * ll)) * wgt
first = least_squares(geo, [0, 0, 0, 0, 1.5, 0.4]).x
sol = least_squares(lambda p: (model_lambda(uu, vv, pack(p)) - ll) * wgt, first)
p = sol.x
e = model_lambda(uu, vv, pack(p)) - ll
print("cells", int(m.sum()), "model", p.round(4), "nested", bool(abs(p[5]) > np.hypot(p[2], p[3])))
print("outer edge error", float(np.abs(e[-len(Po):]).mean()), "error in band coordinate: rms", float(np.sqrt((e ** 2).mean())), "p95", float(np.percentile(np.abs(e), 95)), "max", float(np.abs(e).max()))
for lv in (-1.0, 0.0, 1.0, 1.746, 2.12):
    print(" level", lv, "centre", (p[0] + p[2] * lv).round(3), (p[1] + p[3] * lv).round(3), "radius", round(float(p[4] + p[5] * lv), 3))
out = pack([float(x) for x in p])
out["source"] = "assets-src/saturn/close/model.py, nested circles fitted to the band layout of the approved close image; plane coordinates along the camera foot direction and across it"
MODEL.write_text(json.dumps(out, indent=1) + "\n")
S, cx, cy = 170, 560, 430
img = np.zeros((900, 1100, 3), np.uint8)
for rr in (1.0, 1.2458, 2.3394):
    cv2.circle(img, (cx, cy), int(rr * S), (70, 70, 70), 1)
levels = np.arange(-1.0, 2.2, 0.2)
cols = cv2.applyColorMap(np.linspace(0, 255, len(levels)).astype(np.uint8).reshape(-1, 1), cv2.COLORMAP_TURBO).reshape(-1, 3)
for lv, col in zip(levels, cols):
    col = tuple(int(c) for c in col)
    for y, x in zip(*np.nonzero(m & (np.abs(field - lv) < 0.012) & (np.hypot(u, v) < 6))):
        cv2.circle(img, (int(cx + v[y, x] * S), int(cy - u[y, x] * S)), 2, col, -1)
    cv2.circle(img, (int(cx + (p[1] + p[3] * lv) * S), int(cy - (p[0] + p[2] * lv) * S)), max(int((p[4] + p[5] * lv) * S), 1), col, 1)
cv2.circle(img, (cx, int(cy - reach * S)), 4, (255, 255, 255), -1)
cv2.imwrite(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else "model-plan.jpg")), img, [cv2.IMWRITE_JPEG_QUALITY, 88])
