import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, hero_camera, load_json, lum, normalize, pixel_grid, plane_hit, spheroid_hit, spheroid_miss

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
n = normalize(fit["rings"]["normal"])
s0 = normalize(fit["sunDir"])
px, py = pixel_grid(W, H, 4)
rays = cam.rays_world(px, py)
L = cv2.GaussianBlur(lum(img), (0, 0), 3)[(py - 0.5).astype(int), (px - 0.5).astype(int)]
t, q = plane_hit(cam.pos, rays, n)
r = np.linalg.norm(q, axis=-1)
ghit, gt = spheroid_hit(cam.pos, rays, n)
ring = (t > 0) & ~(ghit & (gt < t)) & (((r > 1.6) & (r < 1.9)) | ((r > 2.06) & (r < 2.25)))
dark = L < 0.2
hitp = cam.pos + rays * np.where(ghit, gt, 0)[..., None]
gn = normalize(hitp + n * (hitp @ n)[..., None] * (1 / 0.902 ** 2 - 1))
mu = -(gn * rays).sum(-1)
globe = ghit & (mu > 0.35)


def rot(v, ax, a):
    a = np.radians(a)
    return v * np.cos(a) + np.cross(ax, v) * np.sin(a) + ax * (ax @ v) * (1 - np.cos(a))


side = normalize(np.cross(n, s0))
best = None
rows = []
for az in np.arange(-32, 6, 2.0):
    for el in np.arange(-10, 12, 2.0):
        s = rot(rot(s0, n, az), rot(side, n, az), el)
        sh = spheroid_miss(q, s, n) < 1.0
        iou = (sh & dark & ring).sum() / max(((sh | dark) & ring).sum(), 1)
        ndl = gn @ s
        lit = (ndl > 0.08) & globe
        nite = (ndl < -0.08) & globe
        sep = L[lit].mean() - L[nite].mean()
        rows.append((az, el, iou, sep))
        score = iou + 0.6 * sep
        if best is None or score > best[0]:
            best = (score, az, el, iou, sep, s)
rows = np.array(rows)
for el in np.arange(-10, 12, 2.0):
    m = rows[:, 1] == el
    print("el %+3d iou " % el + " ".join("%.2f" % v for v in rows[m, 2]) + " | sep " + " ".join("%.2f" % v for v in rows[m, 3]))
print("best", best[:5], best[5].round(5).tolist(), "elev above plane", np.degrees(np.arcsin(best[5] @ n)))
