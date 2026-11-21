import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, load_json, normalize, spheroid_hit

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png")).astype(np.float32) / 255
n = normalize(fit["rings"]["normal"] if len(sys.argv) < 2 else [float(x) for x in sys.argv[1].split(",")])
sun = normalize(fit["sunDir"])
e1, e2, _ = basis(n)
S = 1200
E_ = 2.6
u = (np.arange(S) + 0.5) / S * 2 * E_ - E_
U, V = np.meshgrid(u, -u)
P = U[..., None] * e1 + V[..., None] * e2
x, y, z = cam.project(P)
out = cv2.remap(img, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
d = P - cam.pos
dist = np.linalg.norm(d, axis=-1)
ghit, gt = spheroid_hit(cam.pos, d / dist[..., None], n)
out[ghit & (gt < dist)] *= 0.3
sp = np.array([sun @ e1, sun @ e2])
sp /= np.linalg.norm(sp)
c = np.array([S / 2, S / 2])
k = S / (2 * E_)
for s in (-1, 1):
    a = c + s * np.array([-sp[1], -sp[0]]) * k
    b = a - np.array([sp[0], -sp[1]]) * 3 * k
    cv2.line(out, tuple(int(v) for v in a), tuple(int(v) for v in b), (0, 1, 0), 2)
cv2.line(out, (S // 2, S // 2), tuple(int(v) for v in (c + np.array([sp[0], -sp[1]]) * k * 1.0)), (0, 1, 1), 2)
cv2.circle(out, (S // 2, S // 2), int(k), (0, 0, 1), 1)
camp = np.array([cam.pos @ e1, cam.pos @ e2])
camp /= np.linalg.norm(camp)
cv2.line(out, (S // 2, S // 2), tuple(int(v) for v in (c + np.array([camp[0], -camp[1]]) * k * 0.6)), (1, 0, 1), 2)
cv2.imwrite(str(WORK / "hero-topdown.jpg"), np.clip(out * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
