import json

import cv2
import numpy as np
from PIL import Image
from scipy.optimize import least_squares

W, H = 2816, 1584
VFOV = 60.0
f = (H / 2) / np.tan(np.radians(VFOV / 2))
im = np.asarray(Image.open('references/approved/mercury-close.jpg').convert('L')).astype(np.float32)
gy = np.gradient(cv2.GaussianBlur(im, (0, 0), 3), axis=0)
pts = np.array([(x, int(np.argmax(gy[:1100, x - 6:x + 6].mean(1)))) for x in range(40, W, 60)], float)


def rays(x, y):
    d = np.stack([x - W / 2, -(y - H / 2), -np.full_like(x, f)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def up_vec(p, r):
    u = np.array([0.0, np.cos(p), -np.sin(p)])
    c, s = np.cos(r), np.sin(r)
    return np.array([c * u[0] - s * u[1], s * u[0] + c * u[1], u[2]])


def resid(q):
    p, r, dip = q
    return np.degrees(np.arcsin(np.clip(rays(pts[:, 0], pts[:, 1]) @ up_vec(p, r), -1, 1)) + dip)


fitline = np.polyfit(pts[:, 0], pts[:, 1], 2)
pts = pts[np.abs(np.polyval(fitline, pts[:, 0]) - pts[:, 1]) < 12]
sol = least_squares(resid, [0.4, -0.2, 0.1], loss='soft_l1', f_scale=0.05)
p, r, dip = sol.x
R = np.cos(dip) / (1 - np.cos(dip))


def horizon_y(x):
    ys = np.linspace(0, 900, 90001)
    return float(ys[np.argmin(np.abs(rays(np.full_like(ys, x), ys) @ up_vec(p, r) + np.sin(dip)))])


res = resid(sol.x)
out = dict(vfovDeg=VFOV, focalPx=f, pitchDownDeg=float(np.degrees(p)), rollDeg=float(np.degrees(r)), dipDeg=float(np.degrees(dip)), up=up_vec(p, r).tolist(),
           planetRadius=float(R), horizonDistance=float(np.sqrt(2 * R + 1)), residualDegMax=float(np.abs(res).max()), residualDegRms=float(np.sqrt((res ** 2).mean())),
           horizonPx=[[x, horizon_y(x)] for x in range(0, W + 1, 176)])
print(json.dumps(out, indent=1))
json.dump(out, open('assets-src/mercury/relief/camera-fit.json', 'w'), indent=1)
