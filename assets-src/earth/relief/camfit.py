import json
import numpy as np, cv2
from scipy.optimize import least_squares

VFOV = 45.0
im = cv2.imread('references/approved/earth-close.jpg').astype(np.float32)
H, W = im.shape[:2]
red = cv2.GaussianBlur(im[:, :, 2], (0, 0), 3)
xs = np.arange(40, W - 40, 16)
pts = []
for x in xs:
    col = red[:, x - 8:x + 8].mean(1)
    lo = np.median(col[:120])
    hit = np.nonzero(col[150:700] > lo + 45)[0]
    if len(hit) == 0:
        continue
    r = 150 + hit[0]
    a, b = col[r - 1], col[r]
    pts.append((x, r - 1 + (lo + 45 - a) / max(b - a, 1e-3)))
pts = np.array(pts)
f = (H / 2) / np.tan(np.radians(VFOV) / 2)
d = np.stack([pts[:, 0] - W / 2, H / 2 - pts[:, 1], -np.full(len(pts), f)], 1)
d /= np.linalg.norm(d, axis=1, keepdims=True)

def nadir(p):
    pitch, roll = np.radians(p[0]), np.radians(p[1])
    n = np.array([0.0, -np.cos(pitch), -np.sin(pitch)])
    c, s = np.cos(roll), np.sin(roll)
    return np.array([c * n[0] - s * n[1], s * n[0] + c * n[1], n[2]])

def res(p):
    return np.degrees(np.arccos(np.clip(d @ nadir(p), -1, 1))) - p[2]

fit = least_squares(res, [40.0, 0.0, 70.0], loss='soft_l1', f_scale=0.05)
pitch, roll, theta = fit.x
r = res(fit.x)
dip = 90 - theta
ratio = 1 / np.cos(np.radians(dip)) - 1
R = 1 / ratio
out = {
    'vfovDeg': VFOV, 'imageSize': [W, H], 'pitchDeg': round(float(pitch), 4), 'rollDeg': round(float(roll), 4), 'dipDeg': round(float(dip), 4),
    'horizonDeg': round(float(pitch - dip), 4), 'altitude': round(float(ratio), 6), 'radius': round(float(R), 4),
    'horizonDistance': round(float(np.sqrt((R + 1) ** 2 - R ** 2)), 4), 'nadir': [round(float(v), 6) for v in nadir(fit.x)],
    'residualDeg': {'rms': round(float(np.sqrt((r ** 2).mean())), 4), 'max': round(float(np.abs(r).max()), 4)}, 'points': len(pts),
}
json.dump(out, open('assets-src/earth/relief/camera-fit.json', 'w'), indent=1)
print(json.dumps(out))
print('rows at x=100, 1408, 2700:', [round(float(np.interp(x, pts[:, 0], pts[:, 1])), 1) for x in (100, 1408, 2700)])
