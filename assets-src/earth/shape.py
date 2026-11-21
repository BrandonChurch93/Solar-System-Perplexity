import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import least_squares

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import camera_from_fit, load_fit  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = ROOT / "src" / "stops" / "earth" / "shape.json"
FIT = load_fit("earth")
CAM = camera_from_fit(FIT)
HERO = ROOT / "references" / "approved" / "earth-hero.png"


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def limb_points():
    im = cv2.imread(str(HERO))[..., ::-1].astype(np.float32) / 255
    lin = srgb_to_linear(im)
    c = FIT["circle"]
    R = c["r"]
    rr = np.arange(-18, 14.01, 0.5)
    pts = []
    for a in np.arange(0, 360, 2.0):
        acc = np.zeros((len(rr), 3))
        for da in np.linspace(-0.9, 0.9, 7):
            t = np.radians(a + da)
            x = (c["cx"] + (R + rr) * np.sin(t) - 0.5).astype(np.float32)
            y = (c["cy"] - (R + rr) * np.cos(t) - 0.5).astype(np.float32)
            acc += cv2.remap(lin, x[None], y[None], cv2.INTER_LINEAR)[0]
        acc /= 7
        i = int(np.argmax(acc[:, 2] + acc[:, 1]))
        lit = acc[i, 2] > 0.55 and (a >= 202 or a <= 14) and 2 < i < len(rr) - 3
        if lit:
            pts.append((a, rr[i] + 0.75, 1.0))
            continue
        if 126 <= a <= 190:
            lum = acc @ [0.2, 0.7, 0.1]
            g = np.gradient(np.log(lum + 0.002))
            j = int(np.argmin(g))
            if g[j] < -0.07 and abs(rr[j]) < 9:
                pts.append((a, rr[j], 0.35))
    return np.array(pts)


def shape_matrix(p):
    s1, s2, ang = p[0], p[1], p[2]
    right, up, back = CAM.R[:, 0], CAM.R[:, 1], CAM.R[:, 2]
    e1 = right * np.sin(ang) + up * np.cos(ang)
    e2 = right * np.cos(ang) - up * np.sin(ang)
    s3 = np.sqrt(s1 * s2)
    return s1 * np.outer(e1, e1) + s2 * np.outer(e2, e2) + s3 * np.outer(back, back)


def silhouette(S, pas):
    c = FIT["circle"]
    Sinv = np.linalg.inv(S)
    o = Sinv @ CAM.pos
    lo = np.full(len(pas), c["r"] - 40.0)
    hi = np.full(len(pas), c["r"] + 40.0)
    t = np.radians(pas)
    for _ in range(30):
        mid = 0.5 * (lo + hi)
        d = CAM.rays_world(c["cx"] + mid * np.sin(t), c["cy"] - mid * np.cos(t)) @ Sinv.T
        a = (d * d).sum(-1)
        bb = d @ o
        inside = bb * bb - a * (o @ o - 1) >= 0
        lo = np.where(inside, mid, lo)
        hi = np.where(inside, hi, mid)
    return 0.5 * (lo + hi) - c["r"]


def main():
    pts = limb_points()
    pa, dev, w = pts[:, 0], pts[:, 1], pts[:, 2]
    print("limb points", len(pts), "lit", int((w == 1).sum()))

    def res(p):
        return (silhouette(shape_matrix(p), pa) - dev) * w

    fit = least_squares(res, [1.0, 0.99, np.radians(108)], loss="soft_l1", f_scale=2.0, diff_step=1e-4)
    p = fit.x
    S = shape_matrix(p)
    r = silhouette(S, pa) - dev
    print("s1 s2 angle", p[0], p[1], np.degrees(p[2]) % 180, "rms px lit", float(np.sqrt((r[w == 1] ** 2).mean())), "max", float(np.abs(r[w == 1]).max()), "rms night", float(np.sqrt((r[w < 1] ** 2).mean())))
    for a, d0, r0 in list(zip(pa, dev, r))[::6]:
        print(f"  pa {a:5.0f} seen {d0:6.1f} fit {d0 + r0:6.1f}")
    OUT.write_text(json.dumps({"matrix": [[round(float(v), 7) for v in row] for row in S]}, indent=1) + "\n")


if __name__ == "__main__":
    main()
