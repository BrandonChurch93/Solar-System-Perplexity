import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, load_json, lum, normalize, plane_hit, spheroid_hit

fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
img = cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
n0 = normalize(fit["rings"]["normal"])
e1, e2, _ = basis(n0)
TW, TH = 720, 2900
th = (np.arange(TW) + 0.5) / TW * 2 * np.pi
rr = 1.15 + (np.arange(TH) + 0.5) / TH * 1.45
T, R = np.meshgrid(th, rr)
P = (np.cos(T)[..., None] * e1 + np.sin(T)[..., None] * e2) * R[..., None]
x, y, z = cam.project(P)
Lh = cv2.GaussianBlur(lum(img), (0, 0), 1.5)
out = cv2.remap(Lh, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
d = P - cam.pos
dist = np.linalg.norm(d, axis=-1)
gh, gt = spheroid_hit(cam.pos, d / dist[..., None], n0)
bad = (gh & (gt < dist)) | (out < 0)
pts = [[], [], []]
for i in range(0, TW, 4):
    col = out[:, i]
    if bad[(rr > 1.7) & (rr < 2.4), i].any() or col[(rr > 1.5) & (rr < 1.8)].mean() < 0.3:
        continue
    j0 = np.searchsorted(rr, 1.75)
    seg = col[j0:]
    k = int(np.argmax(seg < 0.25))
    k2 = k + int(np.argmax(seg[k:] > 0.3))
    k3 = len(seg) - 1 - int(np.argmax(seg[::-1] > 0.25))
    for e, kk in enumerate((k, k2, k3)):
        pts[e].append((x[j0 + kk, i], y[j0 + kk, i]))
pts = [np.array(p) for p in pts]
rays = [cam.rays_world(p[:, 0], p[:, 1]) for p in pts]
print([len(p) for p in pts])


def radii(p):
    n = normalize(n0 + e1 * p[0] + e2 * p[1])
    c = e1 * p[2] + e2 * p[3] + n0 * p[4]
    out = []
    for r in rays:
        t, q = plane_hit(cam.pos - c, r, n)
        out.append(np.linalg.norm(q, axis=-1))
    return out


def resid(p, free):
    full = np.zeros(5)
    full[free] = p
    out = []
    for r in radii(full):
        out.append((r - r.mean()))
    return np.concatenate(out)


for name, free in (("none", []), ("normal", [0, 1]), ("normal+centre", [0, 1, 2, 3]), ("all", [0, 1, 2, 3, 4])):
    if not free:
        r = resid(np.zeros(0), free)
        print(name, "rms", np.sqrt((r ** 2).mean()))
        continue
    res = least_squares(resid, np.zeros(len(free)), args=(free,))
    full = np.zeros(5)
    full[free] = res.x
    n = normalize(n0 + e1 * full[0] + e2 * full[1])
    print(name, "rms", np.sqrt((res.fun ** 2).mean()), "normal", n.round(5).tolist(), "tilt", np.degrees(np.arccos(n @ n0)).round(2), "centre", full[2:].round(4).tolist(), "radii", [round(float(r.mean()), 4) for r in radii(full)])
