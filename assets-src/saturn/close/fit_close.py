import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, POLAR, lum

img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
L = cv2.GaussianBlur(lum(img), (0, 0), 2.0)

c0 = np.array([2220.0, 940.0])
limb = []
for a in np.arange(77, 163.5, 0.5):
    d = np.array([np.cos(np.radians(a)), -np.sin(np.radians(a))])
    rs = np.arange(1050, 600, -1.0)
    xs = c0[0] + d[0] * rs
    ys = c0[1] + d[1] * rs
    ok = (xs >= 2) & (xs < W - 2) & (ys >= 2) & (ys < H - 2)
    if not ok.all():
        rs, xs, ys = rs[ok], xs[ok], ys[ok]
    v = L[ys.astype(int), xs.astype(int)]
    g = np.convolve(v, np.r_[np.ones(6), -np.ones(6)] / 6, mode="same")
    k = int(np.argmax(np.abs(g[8:-8]))) + 8
    if abs(g[k]) > 0.2:
        limb.append((xs[k], ys[k]))
limb = np.array(limb)

edges = {"bout": [], "gapout": []}
for y in range(640, 1580, 8):
    row = L[y]
    dark = row < 0.09
    xs = np.where(dark[:1900])[0]
    if len(xs) < 30:
        continue
    runs = np.split(xs, np.where(np.diff(xs) > 6)[0] + 1)
    run = max(runs, key=len)
    if len(run) < 30 or run[0] < 5:
        continue
    edges["gapout"].append((run[0], y))
    edges["bout"].append((run[-1], y))
edges["outer"] = []
for x in range(8, 1250, 12):
    col = L[:, x]
    k = int(np.argmax(col > 0.2))
    if 300 < k < 800:
        edges["outer"].append((x, k))
edges = {k: np.array(v, dtype=np.float64) for k, v in edges.items()}
print("limb", len(limb), {k: len(v) for k, v in edges.items()})


def cam_basis(yaw, pitch, roll):
    cy, sy = np.cos(yaw), np.sin(yaw)
    cp, sp = np.cos(pitch), np.sin(pitch)
    cr, sr = np.cos(roll), np.sin(roll)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz


def rays(p, pts):
    D, h, yaw, pitch, roll, f = p[:6]
    t = np.tan(np.radians(f) / 2)
    x = (pts[:, 0] + 0.5) / W * 2 - 1
    y = 1 - (pts[:, 1] + 0.5) / H * 2
    d = np.stack([x * t * W / H, y * t, -np.ones_like(x)], axis=-1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    return d @ cam_basis(yaw, pitch, roll).T


def resid(p):
    D, h = p[0], p[1]
    o = np.array([0.0, h, D])
    out = []
    d = rays(p, limb)
    s = np.array([1.0, 1.0 / POLAR, 1.0])
    os_, ds = o * s, d * s
    ds /= np.linalg.norm(ds, axis=-1, keepdims=True)
    tc = -(ds @ os_)
    miss = np.linalg.norm(os_ + ds * tc[:, None], axis=-1)
    out.append((miss - 1) * 3)
    for i, k in enumerate(("bout", "gapout", "outer")):
        d = rays(p, edges[k])
        t = -h / d[:, 1]
        q = o + d * t[:, None]
        r = np.linalg.norm(q, axis=-1)
        out.append(np.where(t > 0, r - p[6 + i], 3.0))
    return np.concatenate(out)


if __name__ == "__main__":
    FOV = float(sys.argv[1]) if len(sys.argv) > 1 else 56.0
    ROLL = float(sys.argv[2]) if len(sys.argv) > 2 else 0.3
    best = None
    for D0 in (1.7, 2.0, 2.4):
        for h0 in (0.1, 0.3, 0.5):
            for yaw0 in (0.3, 0.55, 0.8):
                p0 = [D0, h0, yaw0, -0.15, 0.0, FOV, 1.95, 2.03, 2.3]
                lo = [1.05, 0.005, -0.2, -0.8, -ROLL, FOV - 0.01, 1.3, 1.3, 1.5]
                hi = [4.0, 1.5, 1.5, 0.3, ROLL, FOV + 0.01, 2.6, 2.6, 3.2]
                try:
                    r = least_squares(resid, p0, bounds=(lo, hi))
                except Exception:
                    continue
                c = np.sqrt((r.fun ** 2).mean())
                if best is None or c < best[0]:
                    best = (c, r.x)
    print("rms", best[0])
    names = ["D", "h", "yaw", "pitch", "roll", "vfov", "rBout", "rGapOut", "rOuter"]
    p = best[1]
    for n_, v in zip(names, p):
        print(n_, round(float(v), 5), "(deg %.2f)" % np.degrees(v) if n_ in ("yaw", "pitch", "roll") else "")
    (WORK / "close-fit-free.json").write_text(json.dumps({k: float(v) for k, v in zip(names, p)}, indent=1))
    np.save(WORK / "close-limb.npy", limb)
    np.save(WORK / "close-bout.npy", edges["bout"])
    np.save(WORK / "close-gapout.npy", edges["gapout"])
    np.save(WORK / "close-outer.npy", edges["outer"])
