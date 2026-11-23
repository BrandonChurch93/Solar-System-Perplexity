"""S2, first rough nest: the laid back close side composited over the old levels of the patch pyramid.

For each plate width: the old level (or its crop, enlarged) is the base, the layback of the close side is laid over it
where the close camera saw the ground well. RGB = deck colour, A = cirrus opacity, like the levels above.
Usage: python3 assets-src/neptune/place/plates.py [size]
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import layback  # noqa: E402
import gnomon  # noqa: E402

SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 4096
OUT = 'public/assets/neptune'
WORK = 'out/work/nep/place'
PLATES = [(16, 'patch-16.webp', 16), (10, 'patch-10.webp', 10), (6, 'patch-10.webp', 10), (3.5, 'patch-10.webp', 10)]
FAR = (6.0, 8.5)
EDGE = (8.0, 120.0)
WHITE = 0.9
BAND = 1 / 24


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lin(v):
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4).astype(np.float32)


def enc(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055).astype(np.float32)


def blur(x, s):
    return cv2.GaussianBlur(x, (0, 0), s)


def base_level(name, wide, width, size):
    img = cv2.cvtColor(cv2.imread(os.path.join(OUT, 'full', name), cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255
    n = img.shape[0]
    k = gnomon.half(width) / gnomon.half(wide)
    lo = int(round(n * (1 - k) / 2))
    crop = img[lo:n - lo, lo:n - lo]
    return cv2.resize(crop, (size, size), interpolation=cv2.INTER_CUBIC if crop.shape[0] < size else cv2.INTER_AREA)


def plate(width, name, wide):
    base = base_level(name, wide, width, SIZE)
    r = layback.lay(width, SIZE)
    w = r['seen'] * smoothstep(EDGE[0], EDGE[1], r['edge']) * smoothstep(FAR[1], FAR[0], r['under'])
    w = w.astype(np.float32)
    deck = lin(r['deck']) * r['shadow'][..., None]
    cw = (r['cloudSeen'] * 1.0).astype(np.float32)
    cloud = r['cloud']
    alpha = cloud[..., 3] * np.clip(lin(cloud[..., :3]).mean(-1) / lin(np.float32(WHITE)), 0, 1) * cw
    clear = w * (1 - smoothstep(0.02, 0.2, cloud[..., 3])) * (1 - smoothstep(0.02, 0.2, base[..., 3]))
    sig = SIZE * BAND
    den = np.maximum(blur(clear, sig), 1e-4)[..., None]
    gain = (blur(lin(base[..., :3]) * clear[..., None], sig) / den + 0.004) / (blur(deck * clear[..., None], sig) / den + 0.004)
    total = (lin(base[..., :3]) * clear[..., None]).sum((0, 1)) / np.maximum((deck * clear[..., None]).sum((0, 1)), 1e-6)
    out = np.dstack([enc(deck * total), alpha])
    res = base * (1 - w[..., None]) + out * w[..., None]
    print('plate', width, 'layback share %.3f' % w.mean(), 'gain to the old level (linear, r g b) %.3f %.3f %.3f' % tuple(total), 'local gain p5 p95 %.2f %.2f' % (np.percentile(gain[w > 0.5], 5), np.percentile(gain[w > 0.5], 95)), flush=True)
    return res, w


def save(rgba, name):
    out = (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    im.save(os.path.join(OUT, 'full', name), quality=92, method=4, exact=True)
    im.resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(os.path.join(OUT, 'web', name), quality=88, method=4, exact=True)
    comp = (gnomon.composite(np.clip(rgba, 0, 1)) * 255).astype(np.uint8)
    return cv2.resize(comp, (700, 700), interpolation=cv2.INTER_AREA)


if __name__ == '__main__':
    os.makedirs(WORK, exist_ok=True)
    tiles = []
    for width, name, wide in PLATES:
        res, w = plate(width, name, wide)
        tiles.append(save(res, 'plate-%g.webp' % width))
    Image.fromarray(np.concatenate(tiles, 1)).save(os.path.join(WORK, 'plates-rough.jpg'), quality=88)
