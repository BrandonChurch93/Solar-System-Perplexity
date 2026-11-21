import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import WORK, POLAR

W, H = 2816, 1584
FOV = float(sys.argv[1]) if len(sys.argv) > 1 else 56.0
limb = np.load(WORK / "close-limb.npy")
edges = {k: np.load(WORK / f"close-{k}.npy") for k in ("bout", "gapout", "outer")}


def rays(pts):
    t = np.tan(np.radians(FOV) / 2)
    x = (pts[:, 0] + 0.5) / W * 2 - 1
    y = 1 - (pts[:, 1] + 0.5) / H * 2
    d = np.stack([x * t * W / H, y * t, -np.ones_like(x)], axis=-1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


LR = rays(limb)
ER = {k: (rays(v), rays(v + np.array([1.0, 0.0])), rays(v + np.array([0.0, 1.0]))) for k, v in edges.items()}
FOCAL = (H / 2) / np.tan(np.radians(FOV) / 2)


def normal(tilt, roll):
    n = np.array([0.0, np.cos(tilt), np.sin(tilt)])
    c, s = np.cos(roll), np.sin(roll)
    return np.array([c * n[0] - s * n[1], s * n[0] + c * n[1], n[2]])


def limb_resid(c, n):
    k = 1.0 / POLAR - 1.0
    o = -c
    os_ = o + n * (o @ n) * k
    ds = LR + n * (LR @ n)[:, None] * k
    ds = ds / np.linalg.norm(ds, axis=-1, keepdims=True)
    tc = -(ds @ os_)
    return np.linalg.norm(os_ + ds * tc[:, None], axis=-1) - 1


def ring_r(c, n, d):
    t = (c @ n) / (d @ n)
    q = d * t[:, None] - c
    return np.linalg.norm(q, axis=-1), t


def edge_resid(c, n, radii=None):
    out = []
    means = {}
    for k, (d, dx, dy) in ER.items():
        rr, t = ring_r(c, n, d)
        rx, _ = ring_r(c, n, dx)
        ry, _ = ring_r(c, n, dy)
        g = np.hypot(rx - rr, ry - rr)
        R = np.median(rr) if radii is None else radii[k]
        means[k] = float(np.median(rr))
        res = (rr - R) / np.maximum(g, 1e-9)
        res = np.where(t > 0, res, 500.0)
        out.append(np.clip(res, -500, 500))
    return np.concatenate(out), means


def solve(tilt, roll, c0):
    n = normal(tilt, roll)
    r = least_squares(limb_resid, c0, args=(n,))
    c = r.x
    res, radii = edge_resid(c, n)
    return float(np.sqrt((res ** 2).mean())), c, n, radii, float(np.sqrt((r.fun ** 2).mean()))


c0 = np.array([1.1, -0.2, -1.9])
best = None
grid = []
for tilt in np.radians(np.arange(0, 41, 1.0)):
    for roll in np.radians(np.arange(-25, 26, 1.0)):
        s = solve(tilt, roll, c0)
        if s is None:
            continue
        grid.append((np.degrees(tilt), np.degrees(roll), s[0]))
        if best is None or s[0] < best[0][0]:
            best = (s, tilt, roll)
s, tilt, roll = best
cost, c, n, radii, lrms = s
print("fov", FOV, "tilt", np.degrees(tilt), "roll", np.degrees(roll), "cost", cost, "limb rms", lrms)
print("centre cam", c.round(4).tolist(), "dist", np.linalg.norm(c).round(4), "height", float(-c @ n), "radii", radii)
horiz = c + n * (-c @ n)
print("horizontal distance", np.linalg.norm(horiz))
g = np.array(grid)
for r0 in (-15, -10, -5, 0, 5, 10):
    m = g[:, 1] == r0
    print("roll", r0, " ".join("%d:%.1f" % (a, b) for a, b in zip(g[m, 0][::3], g[m, 2][::3])))


def joint(p):
    n = normal(p[3], p[4])
    c = p[:3]
    res, _ = edge_resid(c, n, {"bout": p[5], "gapout": p[6], "outer": p[7]})
    return np.concatenate([limb_resid(c, n) * FOCAL / np.linalg.norm(c) * 2, res])


p0 = np.r_[c, tilt, roll, radii["bout"], radii["gapout"], radii["outer"]]
r = least_squares(joint, p0, loss="soft_l1", f_scale=3.0)
c, tilt, roll = r.x[:3], r.x[3], r.x[4]
n = normal(tilt, roll)
radii = {"bout": r.x[5], "gapout": r.x[6], "outer": r.x[7]}
cost = float(np.sqrt((r.fun ** 2).mean()))
print("joint: tilt", np.degrees(tilt), "roll", np.degrees(roll), "rms px", cost, "centre", c.round(4).tolist(), "height", float(-c @ n), "horizontal", float(np.linalg.norm(c + n * (-c @ n))), "radii", {k: round(float(v), 4) for k, v in radii.items()})
radii = {k: float(v) for k, v in radii.items()}
(WORK / f"close-fit-{int(FOV)}.json").write_text(json.dumps({"vfov": FOV, "centre": c.tolist(), "normal": n.tolist(), "radii": radii, "cost": cost, "limbRms": lrms}, indent=1))

FIX = {"bout": 1.955, "gapout": 2.03, "outer": 2.32}
USE = sys.argv[2].split(",") if len(sys.argv) > 2 else ["bout", "gapout", "outer"]


def fixed(p):
    global FOCAL, LR, ER
    n = normal(p[3], p[4])
    c = p[:3]
    res, _ = edge_resid(c, n, FIX)
    sizes = np.cumsum([0] + [len(ER[k][0]) for k in ER])
    keep = np.concatenate([res[sizes[i]:sizes[i + 1]] for i, k in enumerate(ER) if k in USE])
    return np.concatenate([limb_resid(c, n) * FOCAL / np.linalg.norm(c) * 2, keep])


bestf = None
for t0 in (3, 8, 14, 20):
    for r0 in (-12, -5, 0, 5):
        for d0 in (1.6, 2.0, 2.5):
            p0 = np.r_[np.array([0.9, -0.2, -1.75]) * d0 / 2.0, np.radians(t0), np.radians(r0)]
            try:
                r = least_squares(fixed, p0, loss="soft_l1", f_scale=4.0)
            except Exception:
                continue
            if bestf is None or r.cost < bestf.cost:
                bestf = r
c, tilt, roll = bestf.x[:3], bestf.x[3], bestf.x[4]
n = normal(tilt, roll)
res = bestf.fun
print("FIXED radii, fov", FOV, "use", USE, ": tilt", round(np.degrees(tilt), 2), "roll", round(np.degrees(roll), 2), "rms px", round(float(np.sqrt((res ** 2).mean())), 2), "centre", c.round(4).tolist(), "height", round(float(-c @ n), 4), "horizontal", round(float(np.linalg.norm(c + n * (-c @ n))), 4))
_, means = edge_resid(c, n)
print(" edge median radii under this fit", {k: round(v, 3) for k, v in means.items()})
(WORK / f"close-fixed-{int(FOV)}.json").write_text(json.dumps({"vfov": FOV, "centre": c.tolist(), "normal": n.tolist(), "tilt": float(tilt), "roll": float(roll), "use": USE}, indent=1))
