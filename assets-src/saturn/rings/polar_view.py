import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, load_json, normalize, spheroid_hit, spheroid_miss

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png")).astype(np.float32) / 255
n = normalize(load_json(WORK / "ring-normal.json")["normal"] if len(sys.argv) < 2 else [float(x) for x in sys.argv[1].split(",")])
sun = normalize(fit["sunDir"])
e1, e2, _ = basis(n)
TW, TH = 2880, 1160
th = (np.arange(TW) + 0.5) / TW * 2 * np.pi
rr = 1.15 + (np.arange(TH) + 0.5) / TH * 1.45
T, R = np.meshgrid(th, rr)
P = (np.cos(T)[..., None] * e1 + np.sin(T)[..., None] * e2) * R[..., None]
x, y, z = cam.project(P)
out = cv2.remap(img, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
d = P - cam.pos
dist = np.linalg.norm(d, axis=-1)
ghit, gt = spheroid_hit(cam.pos, d / dist[..., None], n)
front = ghit & (gt < dist)
shadow = spheroid_miss(P, sun, n) < 1.0
out[front] *= 0.25
out[shadow] = out[shadow] * 0.6 + np.array([0.3, 0, 0])
cv2.imwrite(str(WORK / "hero-polar.jpg"), np.clip(out * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
cv2.imwrite(str(WORK / "hero-polar-small.jpg"), cv2.resize(np.clip(out * 255, 0, 255).astype(np.uint8), (1440, 580), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
