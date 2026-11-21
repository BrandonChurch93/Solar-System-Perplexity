import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

Image.MAX_IMAGE_PIXELS = None
OUT = 'out/work/u/wrap/'
W, H = 8192, 4096
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
MU0, MU1 = 0.14, 0.34


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    meta = json.load(open(OUT + 'curve.json'))
    rot = np.load(OUT + 'rot.npy')
    sun = np.array(meta['sun'])
    curve = np.array(meta['curve'])
    knots = np.linspace(-1, 1, meta['knots'])
    base = np.load(OUT + 'base.npy')
    h2, w2 = base.shape[:2]
    lon = ((np.arange(W) + 0.5) / W - 0.5) * 2 * np.pi
    lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    lo, la = np.meshgrid(lon, lat)
    p = geo.direction(lo, la) @ rot.T
    to = geo.CAM - p
    dist = np.linalg.norm(to, axis=-1)
    mu = ((to * p).sum(-1) / dist).astype(np.float32)
    ndl = (p @ sun).astype(np.float32)
    x, y = geo.project(p, w2, h2)
    del p, to
    mx, my = x.astype(np.float32), y.astype(np.float32)
    seen = smooth(MU0, MU1, mu).astype(np.float32)
    col = cv2.remap(base, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    del base
    lut = np.load(OUT + 'light-lut.npy')
    li = ((ndl + 1) * 0.5 * (lut.shape[0] - 1)).astype(np.float32)
    lj = (np.clip(mu, 0, 1) * (lut.shape[1] - 1)).astype(np.float32)
    light = cv2.remap(lut, lj, li, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    del li, lj
    eps = 0.004
    alb = (np.maximum(col, 0) + eps * meta['norm']) / (light + eps)
    del col
    day = smooth(0.08, 0.3, ndl)[..., None]
    grey = (alb @ LUMA)[..., None]
    alb = grey + (alb - grey) * (0.15 + 0.85 * day)
    alpha = cv2.remap(np.load(OUT + 'alpha.npy'), mx, my, cv2.INTER_LINEAR) * (seen > 0.999)
    shadow = cv2.remap(np.load(OUT + 'shadow.npy'), mx, my, cv2.INTER_LINEAR) * (seen > 0.999)
    np.save(OUT + 'map-albedo.npy', alb.astype(np.float32))
    np.save(OUT + 'map-seen.npy', seen)
    np.save(OUT + 'map-cloud.npy', np.stack([alpha, shadow], -1).astype(np.float32))
    np.save(OUT + 'map-ndl.npy', ndl)
    show = (geo.display(np.clip(alb, 0, 4) * seen[..., None]) * 255).astype(np.uint8)
    Image.fromarray(show).resize((2048, 1024), Image.LANCZOS).save(OUT + 'map-seen.jpg', quality=90)
    w = seen > 0.999
    print('seen fraction', float(w.mean()), 'albedo median', np.median(alb[w], 0), 'p1', np.percentile(alb[w], 1, 0), 'p99', np.percentile(alb[w], 99, 0))


main()
