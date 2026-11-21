import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "wrap"))
from geo import FIT, ring_frame
from lib import ROOT, WORK, hero_camera, lum, plane_hit, spheroid_hit, spheroid_miss

cam = hero_camera(FIT)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
step = 3
xs, ys = np.meshgrid(np.arange(step / 2, cam.w, step), np.arange(step / 2, cam.h, step))
d = cam.rays_world(xs, ys)
M = ring_frame()
n = M[:, 1]
hit, _ = spheroid_hit(cam.pos, d, n)
t, P = plane_hit(cam.pos, d, n)
r = np.linalg.norm(P, axis=-1)
L = lum(cv2.GaussianBlur(img, (0, 0), 2.0))[(ys - 0.5).astype(int), (xs - 0.5).astype(int)]
band = (~hit) & (t > 0) & (((r > 1.58) & (r < 1.90)) | ((r > 2.10) & (r < 2.28)))
lit = band & (L > 0.22)
dark = band & (L < 0.09)
use = lit | dark
Pu = P[use]
target = dark[use]
print("pixels", int(use.sum()), "dark share", float(target.mean()))
sun = np.array(FIT["sunDir"], dtype=np.float64)
sun /= np.linalg.norm(sun)
sl = sun @ M
az0 = np.degrees(np.arctan2(sl[2], sl[0]))
el0 = np.degrees(np.arcsin(sl[1]))
print("sun in ring frame: azimuth", az0, "elevation", el0)


def score(az, el, widen=0.0):
    a, e = np.radians(az), np.radians(el)
    s = M @ np.array([np.cos(e) * np.cos(a), np.sin(e), np.cos(e) * np.sin(a)])
    along = Pu @ s
    shadow = (spheroid_miss(Pu, s, n) < 1.0 + widen * np.maximum(-along, 0)) & (along < 0)
    return float((shadow == target).mean())


print("score with the Sun", score(az0, el0))
best = (0, 0, 0, 0)
for widen in np.arange(0, 0.201, 0.025):
    for el in np.arange(6, 22.5, 1.0):
        for da in np.arange(-6, 10.5, 1.0):
            sc = score(az0 + da, el, widen)
            if sc > best[0]:
                best = (sc, el, da, widen)
    print("widen", round(widen, 3), "best so far", best)
sc, el, da, widen = best
fine = max(((score(az0 + da + b, el + a, widen + c), el + a, da + b, widen + c) for a in np.arange(-1, 1.01, 0.25) for b in np.arange(-1, 1.01, 0.25) for c in (-0.0125, 0, 0.0125)))
print("fine", fine)
sc, el, da, widen = fine
a, e = np.radians(az0 + da), np.radians(el)
local = [float(np.cos(e) * np.cos(a)), float(np.sin(e)), float(np.cos(e) * np.sin(a))]
(ROOT / "src/stops/saturn/shadow.json").write_text(json.dumps({"source": "assets-src/saturn/rings/shadow_fit.py, direction of the globe's shadow on the rings in the ring frame, fitted to the hero", "local": [round(v, 6) for v in local], "azimuthOffsetDeg": round(float(da), 2), "elevationDeg": round(float(el), 2), "widen": round(float(widen), 4), "score": round(sc, 4)}, indent=1) + "\n")
print(local)
