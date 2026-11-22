import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
WRAP = 'public/assets/neptune/full/wrap.webp'
LAYERS = 'out/work/nep/wrap/hero-layers.npz'
W, H = 8192, 4096
SIZE = {'full': (2048, 1024), 'web': (1024, 512)}
SEED = 5006
HERO_SOFT = 24.0
OPEN = 4
THICK = 0.25
NEAR = (60.0, 160.0)
CLUMP = (8, 26.0, 9.0, -1.1, 0.1)
STREAK = (16.0, 6.0, 2.0)
PATCHY = (4, 9.0, 3.0, 0.55, 0.6)
CODE = 4.0


def wrap_x(f, a, pad=320):
    return f(np.concatenate([a[:, -pad:], a, a[:, :pad]], 1))[:, pad:-pad]


def step(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def noise(rng, scale, sx, sy):
    n = rng.standard_normal((H // scale, W // scale)).astype(np.float32)
    n = wrap_x(lambda a: cv2.GaussianBlur(a, (0, 0), sigmaX=sx, sigmaY=sy), n, 4 * int(sx) + 1)
    n = (n - n.mean()) / n.std()
    return cv2.resize(n, (W, H), interpolation=cv2.INTER_CUBIC)


def build():
    alpha = np.asarray(Image.open(WRAP).convert('RGBA'))[..., 3].astype(np.float32) / 255
    assert alpha.shape == (H, W), alpha.shape
    box = json.load(open('src/stops/neptune/hold.json'))['box']
    x0, x1 = int(round(box[0] * W)), int(round(box[2] * W))
    y0, y1 = int(round((1 - box[3]) * H)), int(round((1 - box[1]) * H))
    hero = np.load(LAYERS)['gweight'].astype(np.float32)
    assert hero.shape == (y1 - y0, x1 - x0), (hero.shape, x0, x1, y0, y1)
    full = np.zeros((H, W), np.float32)
    full[y0:y1, x0:x1] = hero
    far = 1 - cv2.GaussianBlur(full, (0, 0), HERO_SOFT)
    rng = np.random.default_rng(SEED)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * OPEN + 1, 2 * OPEN + 1))
    core = wrap_x(lambda a: cv2.morphologyEx(a, cv2.MORPH_OPEN, k), alpha)
    thick = (core > THICK).astype(np.uint8)
    dist = wrap_x(lambda a: cv2.distanceTransform(1 - a, cv2.DIST_L2, 3), thick)
    near = 1 - step(dist, NEAR[0], NEAR[1])
    clump = step(noise(rng, CLUMP[0], CLUMP[1], CLUMP[2]), CLUMP[3], CLUMP[4])
    keep = near * clump
    thin = alpha * (1 - near)
    streak = wrap_x(lambda a: cv2.GaussianBlur(a, (0, 0), sigmaX=STREAK[0], sigmaY=STREAK[1]), thin) * STREAK[2]
    streak *= np.clip(PATCHY[3] + PATCHY[4] * noise(rng, PATCHY[0], PATCHY[1], PATCHY[2]), 0, 1.3)
    red = 1 - far * (1 - keep)
    green = np.clip(far * streak * CODE, 0, 1)
    print('generated share %.3f, thick share %.4f, alpha mean %.5f, kept %.5f, streak %.5f, after %.5f, streak p99.9 %.3f, coded over 1: %.5f' % (
        float((far > 0.5).mean()), float(thick.mean()), float(alpha.mean()), float((alpha * red).mean()), float((far * streak).mean()),
        float((alpha * red + far * streak).mean()), float(np.percentile(streak, 99.9)), float((far * streak * CODE > 1).mean())))
    return alpha, red, green, far


def main():
    alpha, red, green, far = build()
    for name, size in SIZE.items():
        r = cv2.resize(red, size, interpolation=cv2.INTER_AREA)
        g = cv2.resize(green, size, interpolation=cv2.INTER_AREA)
        img = np.stack([r, g, cv2.resize(far, size, interpolation=cv2.INTER_AREA)], -1)
        path = os.path.join(OUT, name, 'far.png')
        Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(path, optimize=True)
        print(path, size, os.path.getsize(path))
    if len(sys.argv) > 2:
        np.savez(sys.argv[2], alpha=(alpha * 255 + 0.5).astype(np.uint8), red=(red * 255 + 0.5).astype(np.uint8), green=(green * 255 + 0.5).astype(np.uint8))


main()
