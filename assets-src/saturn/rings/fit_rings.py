import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import minimize

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, hero_camera, load_json, lum, normalize, pixel_grid, plane_hit, spheroid_hit, spheroid_miss

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
sun = normalize(fit["sunDir"])
n0 = normalize(fit["rings"]["normal"])
STEP = 3
px, py = pixel_grid(W, H, STEP)
rays = cam.rays_world(px, py)
L = cv2.GaussianBlur(lum(img), (0, 0), 1.2)[(py - 0.5).astype(int), (px - 0.5).astype(int)]
titan = np.hypot(px - 2470, py - 252) < 80


def polar(n, centre=np.zeros(3)):
    t, q = plane_hit(cam.pos - centre, rays, n)
    r = np.linalg.norm(q, axis=-1)
    ghit, gt = spheroid_hit(cam.pos, rays, n)
    front = ghit & (gt < t)
    shadow = spheroid_miss(q, sun, n) < 1.06
    ok = (t > 0) & ~front & ~shadow & ~titan & (r > 1.15) & (r < 2.6)
    return r, q, ok


def cost(p):
    n = normalize(n0 + np.array([p[0], 0, p[1]]))
    r, q, ok = polar(n)
    bins = np.clip(((r - 1.15) / 1.45 * 1450).astype(int), 0, 1449)
    b = bins[ok]
    v = L[ok]
    cnt = np.bincount(b, minlength=1450)
    s1 = np.bincount(b, weights=v, minlength=1450)
    s2 = np.bincount(b, weights=v * v, minlength=1450)
    good = cnt > 20
    var = s2[good] / cnt[good] - (s1[good] / cnt[good]) ** 2
    return float(np.sum(var * cnt[good]) / np.sum(cnt[good]))


print("start", cost([0, 0]))
res = minimize(cost, [0, 0], method="Nelder-Mead", options={"xatol": 1e-5, "fatol": 1e-9, "maxiter": 400})
n = normalize(n0 + np.array([res.x[0], 0, res.x[1]]))
print("end", res.fun, "normal", n.round(6).tolist(), "tilt deg", np.degrees(np.arccos(np.clip(n @ n0, -1, 1))))
out = {"normal": n.round(6).tolist(), "cost0": cost([0, 0]), "cost": float(res.fun)}
(WORK / "ring-normal.json").write_text(json.dumps(out, indent=1))
