import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "close"))
from layoutgeo import GH, GW, g2a  # noqa: E402

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic, srgb_to_linear  # noqa: E402


def scene(img):
    return inverse_filmic(np.clip(srgb_to_linear(img[..., ::-1].astype(np.float64) / 255), 0, 0.985))


def main():
    film = sys.argv[1]
    args = dict(a.split("=", 1) for a in sys.argv[2:])
    sigma = float(args.get("sigma", 8))
    lo, hi = float(args.get("lo", 0.5)), float(args.get("hi", 2.0))
    ls = float(args.get("ls", 150))
    ref = cv2.imread(str(ROOT / "references" / "approved" / "saturn-close.jpg"))
    h, w = ref.shape[:2]
    img = cv2.resize(cv2.imread(film), (w, h), interpolation=cv2.INTER_CUBIC)
    alpha = cv2.imread(str(ROOT / "public" / "assets" / "saturn" / "web" / "skim-rings-mask.png"))[..., 2].astype(np.float32) / 255
    g = lambda a: cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32)
    box = (slice(h // 2, h), slice(0, w))
    (dx, dy), resp = cv2.phaseCorrelate(g(ref)[box], g(img)[box], cv2.createHanningWindow((w, h - h // 2), cv2.CV_32F))
    print("film offset in approved px", round(dx, 2), round(dy, 2), "response", round(resp, 2))
    if abs(dx) < 8 and abs(dy) < 8:
        img = cv2.warpAffine(img, np.float32([[1, 0, -dx], [0, 1, -dy]]), (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    A, F = scene(ref), scene(img)
    core = cv2.erode((alpha > 0.9).astype(np.uint8), np.ones((int(args.get("erode", 9)),) * 2, np.uint8)).astype(np.float64)
    blur = lambda x, s: cv2.GaussianBlur(x, (0, 0), s)
    floor = float(args.get("floor", 0.004))
    wt = blur(core, sigma)
    ratio = np.clip((blur(A * core[..., None], sigma) + floor * wt[..., None]) / (blur(F * core[..., None], sigma) + floor * wt[..., None] + 1e-9), lo, hi)
    known = (wt > 0.5)
    gx, gy = np.meshgrid(np.arange(GW) + 0.5, np.arange(GH) + 0.5)
    ax, ay, _ = g2a(gx, gy)
    ax, ay = (ax - 0.5).astype(np.float32), (ay - 0.5).astype(np.float32)
    val = cv2.remap(np.where(known[..., None], ratio, 0).astype(np.float32), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    km = cv2.remap(known.astype(np.float32), ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    good = km > 0.8
    val = np.where(good[..., None], val / np.maximum(km, 1e-4)[..., None], 1)
    field = np.clip(np.load(WORK / "layout-total.npy"), -3, 4)
    nb = int(args.get("bins", 500))
    f0, f1 = field[good].min(), field[good].max()
    idx = np.clip(((field - f0) / (f1 - f0) * nb).astype(int), 0, nb - 1)
    line = np.full((nb, 3), np.nan)
    for i in range(nb):
        m = good & (idx == i)
        if m.sum() >= 6:
            line[i] = np.median(val[m], 0)
    have = ~np.isnan(line[:, 0])
    for c in range(3):
        line[:, c] = np.interp(np.arange(nb), np.nonzero(have)[0], line[have, c])
    line = cv2.GaussianBlur(line.astype(np.float32).reshape(nb, 1, 3), (0, 0), float(args.get("across", 1.0))).reshape(nb, 3)
    by_band = line[idx]
    rest = np.where(good[..., None], val / by_band, 0).astype(np.float32)
    acc = good.astype(np.float32)
    wide = float(args.get("wide", 10))
    rest = cv2.GaussianBlur(rest, (0, 0), wide) / np.maximum(cv2.GaussianBlur(acc, (0, 0), wide), 1e-4)[..., None]
    known = cv2.GaussianBlur(acc, (0, 0), wide) > 0.05
    rest = np.where(known[..., None], rest, 1)
    for sgm in (20, 50, 120):
        nbv = cv2.GaussianBlur(rest * known[..., None], (0, 0), sgm)
        wb = cv2.GaussianBlur(known.astype(np.float32), (0, 0), sgm)
        fill = ~known & (wb > 0.01)
        rest[fill] = nbv[fill] / wb[fill][:, None]
        known = known | fill
    away = cv2.distanceTransform((~good).astype(np.uint8), cv2.DIST_L2, 5)
    fade = np.clip(1 - away / float(args.get("fade", 80)), 0, 1)[..., None]
    rest = 1 + (np.clip(rest, 0.8, 1.25) - 1) * fade
    filled = (by_band * rest).astype(np.float32)
    shade = np.load(WORK / "layout-shade.npy").astype(np.float32)
    sline = np.full(nb, np.nan)
    for i in range(nb):
        m = good & (idx == i)
        if m.sum() >= 6:
            sline[i] = np.median(shade[m])
    sh = ~np.isnan(sline)
    sline = np.interp(np.arange(nb), np.nonzero(sh)[0], sline[sh])
    t = np.clip(away / float(args.get("reach", 8)), 0, 1)
    t = t * t * (3 - 2 * t)
    even_out = shade + t * (cv2.GaussianBlur(sline.astype(np.float32).reshape(nb, 1), (0, 0), 1.0).ravel()[idx] - shade)
    for key in ("full", "web"):
        f = ROOT / "public" / "assets" / "saturn" / key / "layout.bin"
        lay = np.fromfile(f, "<f4").reshape(GH, GW, 4)
        lay[..., 1] = even_out
        lay.tofile(f)
    out = np.concatenate([filled, np.ones((GH, GW, 1))], -1).astype("<f4")
    for key in ("full", "web"):
        out.tofile(ROOT / "public" / "assets" / "saturn" / key / "layout-tone.bin")
    print("tone inside: median", np.round(np.median(val[good], 0), 3), "p5", np.round(np.percentile(val[good], 5, 0), 3), "p95", np.round(np.percentile(val[good], 95, 0), 3), "cells", int(good.sum()))
    vis = np.clip(np.log2(filled) / 2 + 0.5, 0, 1)
    cv2.imwrite(str(WORK / "layout-tone.jpg"), (vis[..., ::-1] * 255).astype(np.uint8))


if __name__ == "__main__":
    main()
