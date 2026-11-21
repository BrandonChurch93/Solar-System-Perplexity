import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import WORK, POLAR

W, H = 2816, 1584
FOV = float(sys.argv[1]) if len(sys.argv) > 1 else 48.0
FREE = len(sys.argv) > 2
limb = np.load(WORK / "close-limb.npy")
edges = {k: np.load(WORK / f"close-{k}.npy") for k in ("bout", "gapout", "outer")}
HERO = {"bout": 1.94, "gapout": 2.063, "outer": 2.3394}
FOCAL = (H / 2) / np.tan(np.radians(FOV) / 2)


def rays(pts):
    d = np.stack([(pts[:, 0] + 0.5 - W / 2) / FOCAL, (H / 2 - pts[:, 1] - 0.5) / FOCAL, -np.ones(len(pts))], axis=-1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def normal(tilt, roll):
    return np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])


def frame(n):
    e1 = np.cross(n, np.array([0.0, 0.0, -1.0]))
    e1 /= np.linalg.norm(e1)
    return e1, np.cross(e1, n)


def plane_xy(pts, n, h):
    d = rays(pts)
    t = -h / (d @ n)
    P = d * t[:, None]
    e1, e2 = frame(n)
    return np.stack([P @ e1, P @ e2], -1), t


def resid(p):
    n = normal(p[0], p[1])
    out = []
    for i, (k, v) in enumerate(edges.items()):
        R = HERO[k] * (p[5 + i] if FREE else 1.0)
        q, t = plane_xy(v, n, p[2])
        qx, _ = plane_xy(v + np.array([1.0, 0.0]), n, p[2])
        qy, _ = plane_xy(v + np.array([0.0, 1.0]), n, p[2])
        r = np.linalg.norm(q - p[3:5], axis=-1)
        g = np.hypot(np.linalg.norm(qx - p[3:5], axis=-1) - r, np.linalg.norm(qy - p[3:5], axis=-1) - r)
        res = (r - R) / np.maximum(g, 1e-9)
        out.append(np.where(t > 0, res, 2000.0))
    return np.concatenate(out)


best = None
for t0 in (2, 6, 10, 16, 24):
    for r0 in (-14, -8, -2, 4):
        for h0 in (0.1, 0.3, 0.6):
            for b0 in (1.5, 2.5, 3.5):
                p0 = np.r_[np.radians(t0), np.radians(r0), h0, 0.8, b0] if not FREE else np.r_[np.radians(t0), np.radians(r0), h0, 0.8, b0, 1.0, 1.0, 1.0]
                try:
                    r = least_squares(resid, p0, loss="soft_l1", f_scale=5.0)
                except Exception:
                    continue
                if best is None or r.cost < best.cost:
                    best = r
p = best.x
n = normal(p[0], p[1])
res = resid(p)
sizes = np.cumsum([0] + [len(v) for v in edges.values()])
print("fov", FOV, "tilt", round(np.degrees(p[0]), 3), "roll", round(np.degrees(p[1]), 3), "height", round(p[2], 4), "ring centre in plane", p[3:5].round(4).tolist(), "scales", p[5:].round(4).tolist())
print("rms px all", round(float(np.sqrt((res ** 2).mean())), 2), {k: (round(float(np.sqrt((res[sizes[i]:sizes[i + 1]] ** 2).mean())), 2), round(float(np.abs(res[sizes[i]:sizes[i + 1]]).max()), 1)) for i, k in enumerate(edges)})
e1, e2 = frame(n)
ring_centre = -p[2] * n + p[3] * e1 + p[4] * e2
print("ring centre cam", ring_centre.round(4).tolist())

LR = rays(limb)


def limb_resid(q):
    c, R = q[:3], q[3]
    k = 1.0 / POLAR - 1.0
    o = -c
    os_ = o + n * (o @ n) * k
    ds = LR + n * (LR @ n)[:, None] * k
    ds = ds / np.linalg.norm(ds, axis=-1, keepdims=True)
    tc = -(ds @ os_)
    return (np.linalg.norm(os_ + ds * tc[:, None], axis=-1) - R) / R * np.linalg.norm(c) * 0 + (np.linalg.norm(os_ + ds * tc[:, None], axis=-1) - R) * FOCAL / np.linalg.norm(c)


for R in (0.6, 0.8, 1.0, 1.3, 1.7, 2.2, 3.0):
    r = least_squares(lambda c: limb_resid(np.r_[c, R]), np.array([0.9, -0.2, -2.0]) * R)
    c = r.x
    hh = c @ n + p[2]
    foot = np.array([(c - ring_centre) @ e1, (c - ring_centre) @ e2])
    print("globe R", R, "centre cam", c.round(3).tolist(), "limb rms px", round(float(np.sqrt((r.fun ** 2).mean())), 2), "centre height above ring plane", round(float(hh), 3), "offset from ring centre in plane (right, away)", foot.round(3).tolist())
(WORK / f"close-free-{int(FOV)}.json").write_text(json.dumps({"vfov": FOV, "tilt": float(np.degrees(p[0])), "roll": float(np.degrees(p[1])), "height": float(p[2]), "ringCentre": ring_centre.tolist(), "normal": n.tolist(), "scales": p[5:].tolist()}, indent=1))
