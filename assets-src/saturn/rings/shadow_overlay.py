import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, load_json, normalize, spheroid_hit, spheroid_miss, pixel_grid, plane_hit

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png")).astype(np.float32) / 255
H, W = img.shape[:2]
n = normalize(fit["rings"]["normal"] if len(sys.argv) < 3 else [float(x) for x in sys.argv[2].split(",")])
sun = normalize(fit["sunDir"] if len(sys.argv) < 2 else [float(x) for x in sys.argv[1].split(",")])
px, py = pixel_grid(W, H, 2)
rays = cam.rays_world(px, py)
t, q = plane_hit(cam.pos, rays, n)
r = np.linalg.norm(q, axis=-1)
ghit, gt = spheroid_hit(cam.pos, rays, n)
ring = (t > 0) & ~(ghit & (gt < t)) & (r > 1.24) & (r < 2.31)
sh = ring & (spheroid_miss(q, sun, n) < 1.0)
edge = cv2.morphologyEx(sh.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
small = cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
small[edge] = [0, 1, 0]
gp = np.where(ghit, 1, 0).astype(np.uint8)
hitp = cam.pos + rays * np.where(ghit, gt, 0)[..., None]
k = 1 / 0.902 - 1
gn = normalize(hitp + n * (hitp @ n)[..., None] * (1 / 0.902 ** 2 - 1))
term = ghit & (np.abs(gn @ sun) < 0.012)
small[term] = [0, 0, 1]
tr, tq = plane_hit(hitp, np.broadcast_to(sun, hitp.shape), n)
trr = np.linalg.norm(tq, axis=-1)
rs = ghit & (tr > 0) & (trr > 1.24) & (trr < 2.31) & ((gn @ sun) > 0)
e2 = cv2.morphologyEx(rs.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
small[e2] = [1, 0.4, 0]
cv2.imwrite(str(WORK / "hero-shadow-overlay.jpg"), np.clip(small * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
