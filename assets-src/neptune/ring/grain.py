import os
import sys

import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
SIZE = 1024
SEED = 5006
SHEET = 0.3
KINDS = ((0.22, 0.55, 4.0, 0.5), (0.02, 0.9, 3.0, 0.35), (0.0015, 1.5, 2.5, 0.15))
TOP = 8.0


def splat(rng, share, sigma, power, weight):
    n = int(SIZE * SIZE * share)
    x, y = rng.random(n) * SIZE, rng.random(n) * SIZE
    amp = rng.pareto(power, n) + 0.3
    r = int(np.ceil(3 * sigma))
    acc = np.zeros((SIZE, SIZE), np.float64)
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            xi, yi = np.floor(x).astype(int) + dx, np.floor(y).astype(int) + dy
            w = np.exp(-((xi + 0.5 - x) ** 2 + (yi + 0.5 - y) ** 2) / (2 * sigma * sigma))
            np.add.at(acc, (yi % SIZE, xi % SIZE), amp * w)
    return weight * acc / acc.mean()


def main():
    rng = np.random.default_rng(SEED)
    g = np.full((SIZE, SIZE), SHEET)
    for kind in KINDS:
        g += (1 - SHEET) * splat(rng, *kind)
    g /= g.mean()
    stored = np.clip(g / TOP, 0, 1)
    print('mean %.3f median %.3f p90 %.2f p99 %.2f p99.9 %.2f clipped %.5f; stored mean times top %.3f' % (g.mean(), np.median(g), np.percentile(g, 90), np.percentile(g, 99), np.percentile(g, 99.9), (g > TOP).mean(), stored.mean() * TOP))
    for name, size in (('full', SIZE), ('web', SIZE // 2)):
        a = stored
        if size != SIZE:
            a = stored.reshape(size, 2, size, 2).mean((1, 3))
        os.makedirs(os.path.join(OUT, name), exist_ok=True)
        path = os.path.join(OUT, name, 'ring-grain.png')
        Image.fromarray((a * 255 + 0.5).astype(np.uint8), 'L').save(path, optimize=True)
        print(path, size, os.path.getsize(path))


main()
