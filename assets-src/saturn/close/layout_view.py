import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import WORK
from layoutgeo import GW, GH, W, H, fa, fl, nc, fh, height, OL, close

field = np.load(WORK / (sys.argv[6] if len(sys.argv) > 6 else "layout-total.npy"))
Z = 4
x0, x1, y0, y1 = (int(v) for v in (sys.argv[2:6] if len(sys.argv) > 5 else (0, GW, 0, GH)))
big = cv2.resize(np.clip(field, -3, 4)[y0:y1, x0:x1].astype(np.float32), None, fx=Z, fy=Z, interpolation=cv2.INTER_LINEAR)
gv = np.full(big.shape + (3,), 25, np.uint8)
for i, lv in enumerate(np.arange(-1.0, 2.6, 0.05)):
    cs = cv2.findContours((big > lv).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]
    col = (0, 255, 255) if i % 20 == 0 else ((0, 200, 0) if i % 2 == 0 else (200, 120, 0))
    cv2.drawContours(gv, cs, -1, col, 1)
right = np.cross(fh, nc)
t = np.tan(np.radians(close["vfov"]) / 2)


def outline(u, col, forward=0.5, side=-0.06, rise=-0.03, yaw=-4.0):
    pos = fh * forward * u + right * side * u + nc * rise * u
    a = np.radians(yaw) * u
    pts = []
    edge = [(-1, s) for s in np.linspace(-1, 1, 40)] + [(s, 1) for s in np.linspace(-1, 1, 40)] + [(1, s) for s in np.linspace(1, -1, 40)] + [(s, -1) for s in np.linspace(1, -1, 40)]
    for ex, ey in edge:
        d = np.array([ex * t * W / H, ey * t, -1.0])
        d = d * np.cos(a) + np.cross(nc, d) * np.sin(a) + nc * (nc @ d) * (1 - np.cos(a))
        den = d @ nc
        if den > -1e-3:
            pts.append(None)
            continue
        X = pos + d * (-(height + pos @ nc) / den) - OL
        z = -X[2]
        if z < 0.02:
            pts.append(None)
            continue
        pts.append(((X[0] / z * fl + GW / 2 - x0) * Z, (GH / 2 - X[1] / z * fl - y0) * Z))
    for p, q in zip(pts, pts[1:] + pts[:1]):
        if p is not None and q is not None:
            cv2.line(gv, (int(p[0]), int(p[1])), (int(q[0]), int(q[1])), col, 2)


outline(0.0, (255, 255, 255))
outline(-0.5, (0, 0, 255))
outline(0.5, (255, 0, 255))
cv2.imwrite(str(WORK / sys.argv[1]), gv, [cv2.IMWRITE_JPEG_QUALITY, 88])
