import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "wrap"))
from geo import FIT, POLAR, ROOT, WORK, hero_camera, hero_image, ring_frame, scene, sun_local  # noqa: E402

film_path = sys.argv[1]
cam = hero_camera(FIT)
M = ring_frame()
sl = sun_local()
cam_l = cam.pos @ M
hero = scene(hero_image())
film = cv2.imread(film_path)[..., ::-1].astype(np.float32) / 255
film = scene(cv2.resize(film, (cam.w, cam.h), interpolation=cv2.INTER_CUBIC))

cs = cam_l * np.array([1, 1 / POLAR, 1])
dist = np.linalg.norm(cs)
axis = cs / dist
ref = np.array([0.0, 1.0, 0.0])
e1 = np.cross(ref, axis)
e1 /= np.linalg.norm(e1)
e2 = np.cross(axis, e1)
sin_a = 1 / dist
cos_a = np.sqrt(1 - sin_a * sin_a)
offs = np.array([-40, -24, -14, -8, -4, -2, 0, 2, 4, 8, 14, 24, 40, 70])
print("angle  ndl   side | offset px (inside negative): hero RGB then film RGB, scene linear x100")
for ang in range(0, 360, 20):
    a = np.radians(ang)
    p = axis * sin_a + (np.cos(a) * e1 + np.sin(a) * e2) * cos_a
    P = p * np.array([1, POLAR, 1])
    nl = p * np.array([1, 1 / POLAR, 1])
    nl /= np.linalg.norm(nl)
    ndl = nl @ sl
    x, y, _ = cam.project(P @ M.T)
    cx, cy, _ = cam.project(np.zeros(3))
    d = np.array([x - cx, y - cy])
    d /= np.linalg.norm(d)
    tr = -P[1] / (cam_l[1] - P[1]) if abs(cam_l[1] - P[1]) > 1e-9 else -1
    rr = np.linalg.norm((P + (cam_l - P) * tr)[[0, 2]]) if 0 < tr < 1 else 0
    behind = P[1] * cam_l[1] < 0 and FIT["rings"]["inner"] < rr < FIT["rings"]["outer"]
    row_h, row_f = [], []
    for o in offs:
        xi, yi = int(round(x + d[0] * o)), int(round(y + d[1] * o))
        if 1 <= xi < cam.w - 1 and 1 <= yi < cam.h - 1:
            row_h.append(hero[yi - 1:yi + 2, xi - 1:xi + 2].reshape(-1, 3).mean(0))
            row_f.append(film[yi - 1:yi + 2, xi - 1:xi + 2].reshape(-1, 3).mean(0))
        else:
            row_h.append(np.full(3, np.nan))
            row_f.append(np.full(3, np.nan))
    tag = "rings" if behind else ("lit" if ndl > 0.1 else ("night" if ndl < -0.1 else "term"))
    print(f"{ang:3d} {ndl:+.2f} {tag:5s} px ({x:.0f},{y:.0f})")
    for name, rows in (("hero", row_h), ("film", row_f)):
        print("   " + name + " " + " ".join(f"{o:+d}:" + "/".join(f"{v * 100:.1f}" for v in r) for o, r in zip(offs, rows)))
