import json
import sys

import cv2
import numpy as np

sys.path.insert(0, "assets-src/saturn")
sys.path.insert(0, "assets-src/saturn/wrap")
from geo import FIT, ring_frame
from lib import hero_camera, lum, plane_hit, spheroid_hit

cam = hero_camera(FIT)
h = cv2.imread("references/approved/saturn-hero.png")[..., ::-1].astype(np.float32) / 255
f = cv2.imread(sys.argv[1])[..., ::-1].astype(np.float32) / 255
f = cv2.resize(f, (cam.w, cam.h), interpolation=cv2.INTER_CUBIC)
xs, ys = np.meshgrid(np.arange(cam.w) + 0.5, np.arange(cam.h) + 0.5)
d = cam.rays_world(xs, ys)
M = ring_frame()
n = M[:, 1]
hit, _ = spheroid_hit(cam.pos, d, n)
t, P = plane_hit(cam.pos, d, n)
L = P @ M
r = np.hypot(L[..., 0], L[..., 2])
sl = np.array(json.load(open("src/stops/saturn/shadow.json"))["local"])
polar = 0.902
ss = np.array([sl[0], sl[1] / polar, sl[2]])
ss /= np.linalg.norm(ss)
along = L @ ss
perp = L - along[..., None] * ss
miss = np.linalg.norm(perp, axis=-1)
side = np.sign(perp[..., 0] * ss[2] - perp[..., 2] * ss[0])
ok = (~hit) & (t > 0) & (along < 0)
Lh, Lf = lum(h), lum(f)
bins = np.arange(0.90, 1.2001, 0.02)
for name, sgn in (("side+", 1), ("side-", -1)):
    for r0, r1 in ((1.35, 1.5), (1.58, 1.72), (1.76, 1.9), (2.1, 2.26)):
        m = ok & (side == sgn) & (r > r0) & (r < r1)
        row_h, row_f = [], []
        for a, b in zip(bins[:-1], bins[1:]):
            k = m & (miss >= a) & (miss < b)
            row_h.append(np.median(Lh[k]) if k.sum() > 20 else np.nan)
            row_f.append(np.median(Lf[k]) if k.sum() > 20 else np.nan)
        print(name, r0, r1, "hero", " ".join(f"{v:.2f}" for v in row_h))
        print(name, r0, r1, "film", " ".join(f"{v:.2f}" for v in row_f))
print("miss bins from", bins[0], "step 0.02")
