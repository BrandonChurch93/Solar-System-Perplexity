import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK  # noqa: E402

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic, srgb_to_linear  # noqa: E402

GW, GH = 64, 36
SW, SH = 704, 396
Y = np.array([0.2126, 0.7152, 0.0722])


def filmic(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip(x * (a * x + b) / (x * (c * x + d) + e), 0, 1)


def encode(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.maximum(c, 1e-9) ** (1 / 2.4) - 0.055)


def luma(rgb):
    return rgb @ Y


def main():
    film = sys.argv[1]
    args = dict(a.split("=", 1) for a in sys.argv[2:])
    sigma = float(args.get("sigma", 7))
    lo, hi = float(args.get("lo", 0.86)), float(args.get("hi", 1.0))
    d0, d1 = (float(v) for v in args.get("dead", "1.0,2.5").split(","))
    wsig = float(args.get("wsig", 14))
    step = float(args.get("step", 0.97))
    prior = args.get("prior")
    ref = cv2.imread(str(ROOT / "references" / "approved" / "saturn-close.jpg"))[..., ::-1].astype(np.float64) / 255
    img = cv2.imread(film)[..., ::-1].astype(np.float64) / 255
    alpha = cv2.imread(str(ROOT / "public" / "assets" / "saturn" / "web" / "skim-rings-mask.png"))[..., 2].astype(np.float32) / 255
    small = lambda a: cv2.resize(a, (SW, SH), interpolation=cv2.INTER_AREA)
    moved = encode(filmic(step * inverse_filmic(np.clip(srgb_to_linear(img), 0, 0.985))))
    A, F, G = small(luma(ref)) * 255, small(luma(img)) * 255, small(luma(moved)) * 255
    core = (small(alpha) > 0.9).astype(np.float64)
    core = cv2.erode(core, np.ones((3, 3), np.uint8))
    sens = (G - F) / np.log(step)
    blur = lambda x, s: cv2.GaussianBlur(x, (0, 0), s)
    wt = blur(core, sigma)
    lng = blur((A - F) * core, sigma) / np.maximum(blur(sens * core, sigma), 1e-6)
    known = wt > float(args.get("known", 0.35))
    field = np.where(known, lng, 0)
    acc = known.astype(np.float64)
    for sgm in (10, 30, 90):
        nb = blur(field * acc, sgm)
        wb = blur(acc, sgm)
        fill = (acc < 0.5) & (wb > 0.01)
        field[fill] = nb[fill] / wb[fill]
        acc[fill] = 1
    over = np.clip((blur(F - A, wsig) - d0) / (d1 - d0), 0, 1)
    over = over * over * (3 - 2 * over)
    shrink = int(args.get("shrink", 13))
    over = blur(cv2.erode(over, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * shrink + 1, 2 * shrink + 1))), shrink / 3)
    field = np.clip(np.exp(np.where(acc > 0.5, field, 0) * over), lo, hi)
    grid = cv2.resize(field.astype(np.float32), (GW, GH), interpolation=cv2.INTER_AREA)
    if prior:
        grid = np.clip(grid * np.fromfile(prior, "<f4").reshape(GH, GW, 4)[..., 0], lo, hi)
    out = np.repeat(grid[..., None], 4, -1).astype("<f4")
    out[..., 3] = 1
    for key in ("full", "web"):
        out.tofile(ROOT / "public" / "assets" / "saturn" / key / "skim-tone.bin")
    ring = cv2.resize(core.astype(np.float32), (GW, GH), interpolation=cv2.INTER_AREA) > 0.5
    print("skim tone on the rings: median", round(float(np.median(grid[ring])), 4), "p5", round(float(np.percentile(grid[ring], 5)), 4), "p95", round(float(np.percentile(grid[ring], 95)), 4), "min", round(float(grid.min()), 4), "max", round(float(grid.max()), 4), "ring cells", int(ring.sum()))
    vis = np.clip((grid - 0.85) / 0.3, 0, 1)
    cv2.imwrite(str(WORK / "skim-tone.png"), cv2.resize((vis * 255).astype(np.uint8), (GW * 10, GH * 10), interpolation=cv2.INTER_NEAREST))


if __name__ == "__main__":
    main()
