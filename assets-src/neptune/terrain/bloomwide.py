import os
import sys

import cv2
import numpy as np
from PIL import Image

WORK = 'out/work/nep/terrain/'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
FRAME = 1920
WIDE = 1.75
LEVELS = 6
FROM = 3
STORE = 4


def lin(img):
    x = img.astype(np.float32) / 255
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4).astype(np.float32)


def enc(x):
    x = np.clip(x, 0, 1)
    return np.clip(np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055) * 255 + 0.5, 0, 255).astype(np.uint8)


def filmic(x):
    return np.clip((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    k = 0.59 * y - 0.03
    return (-k - np.sqrt(np.maximum(k * k - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


def tap(img, w, h, ox, oy):
    sh, sw = img.shape[:2]
    x = ((np.arange(w, dtype=np.float32) + 0.5) / w * sw - 0.5 + ox)[None, :].repeat(h, 0)
    y = ((np.arange(h, dtype=np.float32) + 0.5) / h * sh - 0.5 + oy)[:, None].repeat(w, 1)
    return cv2.remap(img, x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def down(img, first):
    sh, sw = img.shape[:2]
    w, h = max(2, -(-sw // 2)), max(2, -(-sh // 2))
    if first:
        c = np.clip(img, 0, 64)
        img = c / (1 + c.max(2, keepdims=True) * 0.02)
    out = tap(img, w, h, 0, 0) * 0.125
    for ox, oy in ((-2, 2), (2, 2), (-2, -2), (2, -2)):
        out += tap(img, w, h, ox, oy) * 0.03125
    for ox, oy in ((0, 2), (-2, 0), (2, 0), (0, -2)):
        out += tap(img, w, h, ox, oy) * 0.0625
    for ox, oy in ((-1, 1), (1, 1), (-1, -1), (1, -1)):
        out += tap(img, w, h, ox, oy) * 0.125
    return out


def up(acc, base, radius=1.0):
    h, w = base.shape[:2]
    s = np.zeros_like(base)
    for ox, oy, k in ((-1, 1, 1), (1, 1, 1), (-1, -1, 1), (1, -1, 1), (0, 1, 2), (0, -1, 2), (1, 0, 2), (-1, 0, 2), (0, 0, 4)):
        s += tap(acc, w, h, ox * radius, oy * radius) * k
    return s / 16 + base


def bloom(x):
    downs = []
    src = x
    for i in range(LEVELS):
        src = down(src, i == 0)
        downs.append(src if i >= FROM else np.zeros_like(src))
    acc = downs[-1]
    for i in range(LEVELS - 2, -1, -1):
        acc = up(acc, downs[i])
    return acc / LEVELS


def main():
    wide = cv2.imread(WORK + 'wide.png', cv2.IMREAD_COLOR)[..., ::-1]
    wh, ww = wide.shape[:2]
    cw = int(round(FRAME * WIDE))
    ch = int(round(cw * wh / ww))
    canvas = cv2.resize(wide, (cw, ch), interpolation=cv2.INTER_AREA)
    x = inverse_filmic(lin(canvas)).astype(np.float32)
    b = bloom(x)
    print('canvas', cw, ch, 'levels', FROM, 'to', LEVELS - 1, 'at half size', b.shape[1], b.shape[0], 'scene mean %.4f bloom mean %.4f max %.3f' % (x.mean(), b.mean(), b.max()))
    size = (cw // STORE, ch // STORE)
    small = cv2.resize(b, size, interpolation=cv2.INTER_AREA)
    im = Image.fromarray(enc(filmic(small)), 'RGB')
    for name in ('full', 'web'):
        path = os.path.join(OUT, name, 'close-bloom.webp')
        im.save(path, lossless=True, quality=100, method=6)
        back = inverse_filmic(lin(np.asarray(Image.open(path).convert('RGB'))))
        err = np.abs(back - small) / np.maximum(small, 0.01)
        print(path, im.size, os.path.getsize(path), 'bytes; share of the levels %.4f; relative error of the decoded file mean %.4f p99 %.4f' % ((LEVELS - FROM) / LEVELS, err.mean(), np.percentile(err, 99)))


main()
