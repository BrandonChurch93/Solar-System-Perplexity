import json, numpy as np
from scipy.optimize import least_squares
W, H = 2816, 1584
VFOV = 60.0
f = (H / 2) / np.tan(np.radians(VFOV / 2))
pts = np.array([(100,360),(400,348),(700,344),(1000,340),(1300,336),(1600,336),(2000,336),(2400,348),(2800,364)], float)

def rays(x, y):
    d = np.stack([x - W / 2, -(y - H / 2), -np.full_like(x, f)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)

def up_vec(p, r):
    u = np.array([0.0, np.cos(p), -np.sin(p)])
    c, s = np.cos(r), np.sin(r)
    return np.array([c * u[0] - s * u[1], s * u[0] + c * u[1], u[2]])

def resid(q):
    p, r, dip = q
    d = rays(pts[:, 0], pts[:, 1])
    return np.degrees(np.arcsin(np.clip(d @ up_vec(p, r), -1, 1)) + dip)

sol = least_squares(resid, [0.3, 0.0, 0.05])
p, r, dip = sol.x
R = np.cos(dip) / (1 - np.cos(dip))
def horizon_y(x):
    U = up_vec(p, r)
    ys = np.linspace(200, 500, 30001)
    d = rays(np.full_like(ys, x), ys)
    return ys[np.argmin(np.abs(d @ U + np.sin(dip)))]
out = dict(vfovDeg=VFOV, focalPx=f, pitchDownDeg=np.degrees(p), rollDeg=np.degrees(r), dipDeg=np.degrees(dip),
           planetRadius=R, horizonDistance=float(np.sqrt(2 * R + 1)), residualDeg=resid(sol.x).tolist(),
           horizonLinePx=[[0, horizon_y(0)], [W, horizon_y(W)]], horizonApexPx=None)
xs = np.linspace(0, W, 201); hy = [horizon_y(x) for x in xs]
out['horizonApexPx'] = [float(xs[int(np.argmin(hy))]), float(min(hy))]
print(json.dumps(out, indent=1))
json.dump(out, open('assets-src/mars/relief/camera-fit.json', 'w'), indent=1)
