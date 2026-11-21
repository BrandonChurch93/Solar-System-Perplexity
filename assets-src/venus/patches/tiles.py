import sys
from pathlib import Path

import cv2
import numpy as np

SIZE = 4096
TILE = 2240
LUMA = np.array([0.0722, 0.7152, 0.2126], np.float32)
CHROMA = 3.0
TAGS = {'tl': (0, 0), 'tr': (SIZE - TILE, 0), 'bl': (0, SIZE - TILE), 'br': (SIZE - TILE, SIZE - TILE)}


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def split(canvas, out_dir, input_size):
    img = cv2.imread(canvas, cv2.IMREAD_COLOR)
    if img.shape[0] != SIZE:
        img = cv2.resize(img, (SIZE, SIZE), interpolation=cv2.INTER_LANCZOS4)
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for tag, (x, y) in TAGS.items():
        crop = img[y:y + TILE, x:x + TILE]
        cv2.imwrite(f'{out_dir}/in-{tag}.png', cv2.resize(crop, (input_size, input_size), interpolation=cv2.INTER_AREA if input_size < TILE else cv2.INTER_LANCZOS4))


def lock(tile, ref, sigma):
    a = cv2.GaussianBlur(ref, (0, 0), sigma)
    b = cv2.GaussianBlur(tile, (0, 0), sigma)
    out = tile * np.clip((a + 0.004) / (b + 0.004), 0.5, 2.0)
    c = cv2.GaussianBlur(ref, (0, 0), CHROMA)
    y = out @ LUMA
    return c * (y / (c @ LUMA + 1e-4))[..., None]


def assemble(canvas, tile_dir, out, sigma, takes):
    ref = cv2.imread(canvas, cv2.IMREAD_COLOR).astype(np.float32) / 255
    if ref.shape[0] != SIZE:
        ref = cv2.resize(ref, (SIZE, SIZE), interpolation=cv2.INTER_LANCZOS4)
    acc = np.zeros_like(ref)
    wsum = np.zeros(ref.shape[:2], np.float32)
    over = 2 * TILE - SIZE
    ramp = np.ones(TILE, np.float32)
    ramp[TILE - over:] = 1 - smooth(0, over, np.arange(over, dtype=np.float32))
    for tag, (x, y) in TAGS.items():
        t = cv2.imread(f'{tile_dir}/tile-{tag}-take-{takes[tag]}.png', cv2.IMREAD_COLOR).astype(np.float32) / 255
        t = cv2.resize(t, (TILE, TILE), interpolation=cv2.INTER_LANCZOS4)
        t = lock(t, ref[y:y + TILE, x:x + TILE], sigma)
        wx = ramp if x == 0 else ramp[::-1]
        wy = ramp if y == 0 else ramp[::-1]
        w = wy[:, None] * wx[None, :]
        acc[y:y + TILE, x:x + TILE] += t * w[..., None]
        wsum[y:y + TILE, x:x + TILE] += w
    res = acc / wsum[..., None]
    cv2.imwrite(out, np.clip(res * 255 + 0.5, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    if sys.argv[1] == 'split':
        split(sys.argv[2], sys.argv[3], int(sys.argv[4]))
    else:
        tk = dict(zip(['tl', 'tr', 'bl', 'br'], sys.argv[6].split(',')))
        assemble(sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]), tk)
