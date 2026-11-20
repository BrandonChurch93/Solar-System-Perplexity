import argparse

import cv2
import numpy as np
from PIL import Image

from delight import MU, CV, REF, lookup
from faces import sample_map
from geo import FIT, WORK, hero, hero_geometry

Image.MAX_IMAGE_PIXELS = None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map", required=True)
    ap.add_argument("--out", default=str(WORK / "check-hero"))
    a = ap.parse_args()
    m = np.asarray(Image.open(a.map).convert("RGB")).astype(np.float32) / 255
    g = hero_geometry()
    img = hero()
    T = np.load(WORK / "shade-table.npy")
    i0 = np.argmin(np.abs(MU - REF[0]))
    j0 = np.argmin(np.abs(CV - REF[1]))
    S = np.exp(lookup(T, g["mu"], g["cosv"]) - T[i0, j0])
    alb = sample_map(m, g["lon"], g["lat"])
    alb = np.where(g["hit"][..., None], alb, 0)
    lit = np.clip(alb * S, 0, 1)
    out = a.out
    cv2.imwrite(out + "-render.jpg", cv2.cvtColor((lit * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
    delit = np.clip(img / S, 0, 1)
    mo = FIT["moons"][0]
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w] + 0.5
    valid = g["hit"] & (g["mu"] > 0.2) & (g["cosv"] > 0.3) & (np.hypot(xx - mo["cx"], yy - mo["cy"]) > mo["r"] + 30)
    A = cv2.cvtColor((np.clip(delit, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    B = cv2.cvtColor((np.clip(alb, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    flow = cv2.calcOpticalFlowFarneback(A, B, None, 0.5, 5, 21, 5, 7, 1.5, 0)
    mag = np.hypot(flow[..., 0], flow[..., 1])
    gx = cv2.Sobel(A.astype(np.float32), cv2.CV_32F, 1, 0, ksize=5)
    gy = cv2.Sobel(A.astype(np.float32), cv2.CV_32F, 0, 1, ksize=5)
    tex = np.hypot(gx, gy)
    feat = valid & (tex > np.percentile(tex[valid], 70))
    d = (alb - delit)[valid]
    print(f"valid px {valid.sum()} feature px {feat.sum()}")
    print(f"flow median {np.median(mag[feat]):.3f} p90 {np.percentile(mag[feat], 90):.3f} p99 {np.percentile(mag[feat], 99):.3f} px (hero size)")
    print(f"albedo vs delit mean abs {np.abs(d).mean():.4f} per channel bias {d.mean(0).round(4)}")
    vis = np.clip(mag / 6, 0, 1) * valid
    cv2.imwrite(out + "-flow.jpg", (vis * 255).astype(np.uint8))
    side = np.concatenate([img, lit], 1)
    cv2.imwrite(out + "-side.jpg", cv2.cvtColor((cv2.resize(side, (2816, 792), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))


if __name__ == "__main__":
    main()
