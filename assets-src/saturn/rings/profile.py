import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d, median_filter

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, load_json, lum, normalize, spheroid_hit, spheroid_miss, srgb_to_linear

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic

R0, R1, NR = 1.10, 2.60, 3000
NT = 4096

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
n = normalize(fit["rings"]["normal"])
sun = normalize(fit["sunDir"])
e1, e2, _ = basis(n)
th = (np.arange(NT) + 0.5) / NT * 2 * np.pi
rr = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
T, R = np.meshgrid(th, rr)
P = (np.cos(T)[..., None] * e1 + np.sin(T)[..., None] * e2) * R[..., None]
x, y, z = cam.project(P)
pol = cv2.remap(img, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
pol = inverse_filmic(srgb_to_linear(np.clip(pol, 0, 1)))
d = P - cam.pos
dist = np.linalg.norm(d, axis=-1)
miss_cam = spheroid_miss(np.broadcast_to(cam.pos, P.shape).copy(), d / dist[..., None], n)
ghit, gt = spheroid_hit(cam.pos, d / dist[..., None], n)
covered = (miss_cam < 1.06) & (gt < dist)
shadow = spheroid_miss(P, np.broadcast_to(sun, P.shape).copy(), n) < 1.12
inside = (x > 2) & (x < cam.w - 2) & (y > 2) & (y < cam.h - 2)
ok = inside & ~covered & ~shadow
dens = np.hypot(np.gradient(x, axis=0), np.gradient(y, axis=0)) / ((R1 - R0) / NR)
np.save(WORK / "polar-lin.npy", pol.astype(np.float32))
np.save(WORK / "polar-ok.npy", ok)
np.save(WORK / "polar-dens.npy", dens.astype(np.float32))
colok = ok.mean(0)
cd = np.where(colok > 0.97, np.median(dens, axis=0), 0)
print("columns fully usable", int((colok > 0.97).sum()), "of", NT, "density px per radius: max", round(float(cd.max()), 1), "median usable", round(float(np.median(cd[cd > 0])), 1))
best = np.argsort(-cd)[:200]
print("best columns theta deg", np.degrees(th[best[:5]]).round(1), "range", round(float(np.degrees(th[best].min())), 1), round(float(np.degrees(th[best].max())), 1))
L = lum(pol)
ref_cols = np.where(cd > 0.85 * cd.max())[0]
ref = np.median(L[:, ref_cols], axis=1)
g_ref = gaussian_filter1d(ref, 2, order=1)
shifts = np.zeros(NT)
scales = np.ones(NT)
valid = colok > 0.6
rc = rr - 1.8
for j in range(0, NT):
    if not valid[j]:
        continue
    col = L[:, j]
    m = ok[:, j]
    best_s = (-1e9, 0.0, 1.0)
    for sc in np.linspace(0.96, 1.04, 17):
        for sh in np.linspace(-0.06, 0.06, 49):
            src = 1.8 + (rc - sh) / sc
            w = np.interp(src, rr, col, left=0, right=0)
            mm = np.interp(src, rr, m.astype(float), left=0, right=0) > 0.99
            if mm.sum() < NR * 0.4:
                continue
            g = gaussian_filter1d(w, 2, order=1)
            a, b = g[mm], g_ref[mm]
            c = float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-12))
            if c > best_s[0]:
                best_s = (c, sh, sc)
    shifts[j], scales[j] = best_s[1], best_s[2]
np.save(WORK / "polar-warp.npy", np.stack([shifts, scales, valid.astype(float)]))
print("shift range", shifts[valid].min(), shifts[valid].max(), "scale range", scales[valid].min(), scales[valid].max())
