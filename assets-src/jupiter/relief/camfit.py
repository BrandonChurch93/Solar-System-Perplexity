import json

import cv2
import numpy as np
from scipy.optimize import least_squares

SRC = 'references/approved/jupiter-close.jpg'
VFOV = 64.0
W, H = 2816, 1584

img = cv2.imread(SRC).astype(np.float32) / 255
lum = cv2.GaussianBlur(img.max(2), (0, 0), 3)
gy = np.diff(cv2.GaussianBlur(lum, (0, 0), 2), axis=0)
xs = np.arange(40, W - 20, 16)
pts = []
guess = lambda x: 10 + (840 - 10) * x / W
for x in xs:
    y0 = int(guess(x))
    a, b = max(y0 - 150, 2), min(y0 + 150, H - 2)
    col = gy[a:b, x]
    y = a + int(np.argmax(col))
    if col.max() > 0.004:
        pts.append((x, y + 0.5))
pts = np.array(pts)
f = (H / 2) / np.tan(np.radians(VFOV) / 2)
rays = np.stack([pts[:, 0] - W / 2, -(pts[:, 1] - H / 2), -f * np.ones(len(pts))], 1)
rays /= np.linalg.norm(rays, axis=1, keepdims=True)


def nadir(p):
    pitch, roll = p[0], p[1]
    n = np.array([0, -np.cos(pitch), -np.sin(pitch)])
    c, s = np.cos(roll), np.sin(roll)
    return np.array([c * n[0] - s * n[1], s * n[0] + c * n[1], n[2]])


def res(p):
    return np.degrees(np.arccos(np.clip(rays @ nadir(p), -1, 1))) - p[2]


best = None
for roll0 in (-0.3, 0.3):
    r = least_squares(res, [0.2, roll0, 80.0], loss='soft_l1', f_scale=0.3)
    if best is None or r.cost < best.cost:
        best = r
p = best.x
n = nadir(p)
theta = p[2]
dip = 90 - theta
height = 1 / np.sin(np.radians(theta)) - 1
out = {
    'vfovDeg': VFOV, 'size': [W, H], 'focalPx': f,
    'nadir': n.tolist(), 'horizonAngleDeg': theta, 'dipDeg': dip,
    'rollDeg': float(np.degrees(p[1])), 'pitchDeg': float(np.degrees(p[0])),
    'heightRadii': height, 'radiusUnits': 1 / height, 'rms': float(np.sqrt(np.mean(res(p) ** 2))), 'points': len(pts),
}
json.dump(out, open('assets-src/jupiter/relief/camera-fit.json', 'w'), indent=1)
print(json.dumps(out, indent=1))
vis = cv2.imread(SRC)
for x, y in pts:
    cv2.circle(vis, (int(x), int(y)), 4, (0, 255, 0), -1)
yy, xx = np.mgrid[0:H:4, 0:W:4]
d = np.stack([xx - W / 2, -(yy - H / 2), -f * np.ones_like(xx)], -1).astype(np.float64)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
ang = np.degrees(np.arccos(np.clip(d @ n, -1, 1)))
edge = (np.abs(ang - theta) < 0.06).astype(np.uint8)
ys, xs2 = np.nonzero(edge)
for x, y in zip(xs2 * 4, ys * 4):
    cv2.circle(vis, (int(x), int(y)), 1, (0, 0, 255), -1)
cv2.imwrite('out/work/view/close_fit.jpg', cv2.resize(vis, (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
