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


def seam(a, b, feather):
    e = cv2.GaussianBlur(((a - b) ** 2).sum(axis=2), (0, 0), 2.0)
    h, w = e.shape
    cost = e.copy()
    for y in range(1, h):
        prev = cost[y - 1]
        left = np.concatenate(([np.inf], prev[:-1]))
        right = np.concatenate((prev[1:], [np.inf]))
        cost[y] += np.minimum(prev, np.minimum(left, right))
    path = np.zeros(h, np.int32)
    path[-1] = int(np.argmin(cost[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]
        lo = max(x - 1, 0)
        path[y] = lo + int(np.argmin(cost[y, lo:min(x + 2, w)]))
    xs = np.arange(w, dtype=np.float32)[None, :]
    mask = (xs < path[:, None]).astype(np.float32)
    mask = cv2.GaussianBlur(mask, (0, 0), feather)
    edge = smooth(0, 3 * feather, xs) * smooth(0, 3 * feather, w - 1 - xs)
    hard = (xs < w / 2).astype(np.float32)
    return hard + (mask - hard) * edge


def join(a, b, over, feather):
    wa = a.shape[1]
    m = seam(a[:, wa - over:], b[:, :over], feather)[..., None]
    mid = a[:, wa - over:] * m + b[:, :over] * (1 - m)
    return np.concatenate([a[:, :wa - over], mid, b[:, over:]], axis=1)


def assemble(canvas, tile_dir, out, sigma, takes, cut=False):
    ref = cv2.imread(canvas, cv2.IMREAD_COLOR).astype(np.float32) / 255
    if ref.shape[0] != SIZE:
        ref = cv2.resize(ref, (SIZE, SIZE), interpolation=cv2.INTER_LANCZOS4)
    over = 2 * TILE - SIZE
    tiles = {}
    for tag, (x, y) in TAGS.items():
        t = cv2.imread(f'{tile_dir}/tile-{tag}-take-{takes[tag]}.png', cv2.IMREAD_COLOR).astype(np.float32) / 255
        t = cv2.resize(t, (TILE, TILE), interpolation=cv2.INTER_LANCZOS4 if t.shape[0] < TILE else cv2.INTER_AREA)
        tiles[tag] = lock(t, ref[y:y + TILE, x:x + TILE], sigma)
    if cut:
        top = join(tiles['tl'], tiles['tr'], over, 6.0)
        bottom = join(tiles['bl'], tiles['br'], over, 6.0)
        res = join(top.transpose(1, 0, 2), bottom.transpose(1, 0, 2), over, 6.0).transpose(1, 0, 2)
    else:
        acc = np.zeros_like(ref)
        wsum = np.zeros(ref.shape[:2], np.float32)
        ramp = np.ones(TILE, np.float32)
        ramp[TILE - over:] = 1 - smooth(0, over, np.arange(over, dtype=np.float32))
        for tag, (x, y) in TAGS.items():
            wx = ramp if x == 0 else ramp[::-1]
            wy = ramp if y == 0 else ramp[::-1]
            w = wy[:, None] * wx[None, :]
            acc[y:y + TILE, x:x + TILE] += tiles[tag] * w[..., None]
            wsum[y:y + TILE, x:x + TILE] += w
        res = acc / wsum[..., None]
    cv2.imwrite(out, np.clip(res * 255 + 0.5, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    if sys.argv[1] == 'split':
        split(sys.argv[2], sys.argv[3], int(sys.argv[4]))
    else:
        tk = dict(zip(['tl', 'tr', 'bl', 'br'], sys.argv[6].split(',')))
        assemble(sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]), tk, len(sys.argv) > 7 and sys.argv[7] == 'cut')
