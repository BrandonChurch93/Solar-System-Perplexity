import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.special import ndtr

Image.MAX_IMAGE_PIXELS = None
cv2.setNumThreads(1)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
WRAP = 'public/assets/neptune/full/wrap.webp'
LAYERS = 'out/work/nep/wrap/hero-layers.npz'
W, H = 8192, 4096
SIZE = {'full': (2048, 1024), 'web': (1024, 512)}
SEED = 5006
HERO_SOFT = 24.0
LONE = (3.0, 12.0, 1.9, 2.8, 0.02, 0.06, 9, 3.0, 1.3)
CLUMP = (8, 26.0, 9.0)
BEND = (8, 9.0, 3.5, 3.0)
TOP = 0.9


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
    fine = wrap_x(lambda a: cv2.GaussianBlur(a, (0, 0), LONE[0]), alpha)
    wide = wrap_x(lambda a: cv2.GaussianBlur(a, (0, 0), LONE[1]), alpha)
    lone = step(fine / (wide + 0.02), LONE[2], LONE[3]) * step(fine, LONE[4], LONE[5])
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (LONE[6], LONE[6]))
    lone = wrap_x(lambda a: cv2.GaussianBlur(cv2.dilate(a, k), (0, 0), LONE[7]), lone)
    red = 1 - far * np.clip(lone * LONE[8], 0, 1)
    bend = np.clip(noise(rng, BEND[0], BEND[1], BEND[2]) / BEND[3], -1, 1)
    green = (127 + 127 * far * bend) / 255
    clump = ndtr(noise(rng, CLUMP[0], CLUMP[1], CLUMP[2])).astype(np.float32)
    blue = far * TOP * clump + (1 - far)
    print('generated share %.3f, alpha mean %.5f, without the lone strokes %.5f (%.3f of it), bend clipped %.4f, clump mean %.3f' % (
        float((far > 0.5).mean()), float(alpha.mean()), float((alpha * red).mean()), float((alpha * red).mean() / alpha.mean()),
        float((np.abs(bend) >= 1).mean()), float(clump.mean())))
    return alpha, red, green, blue


def main():
    alpha, red, green, blue = build()
    for name, size in SIZE.items():
        img = np.stack([cv2.resize(c, size, interpolation=cv2.INTER_AREA) for c in (red, green, blue)], -1)
        path = os.path.join(OUT, name, 'far.png')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(path, optimize=True)
        print(path, size, os.path.getsize(path))
    if len(sys.argv) > 2:
        np.savez(sys.argv[2], alpha=(alpha * 255 + 0.5).astype(np.uint8))


main()
