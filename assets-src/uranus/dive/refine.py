import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

TAKE = 'out/work/u/gen/dive-take1.png'
TILES = 'out/work/u/gen2/r1-%d%d.png'
OUT = 'out/work/u/gen/dive-take1-r.png'
WINDOW = 1024
STRIDE = 512
SCALE = 2
KEEP = 20.0
DOT = 9
DOT_FLOOR = 0.05


def coded(a):
    return np.log(geo.to_linear(a).astype(np.float32) + 0.02)


def shift(a, b):
    ga = cv2.GaussianBlur(a.mean(-1), (0, 0), 4)
    gb = cv2.GaussianBlur(b.mean(-1), (0, 0), 4)
    ga = ga - cv2.GaussianBlur(ga, (0, 0), 40)
    gb = gb - cv2.GaussianBlur(gb, (0, 0), 40)
    (dx, dy), peak = cv2.phaseCorrelate(ga.astype(np.float32), gb.astype(np.float32), cv2.createHanningWindow(ga.shape[::-1], cv2.CV_32F))
    return dx, dy, peak


def dots(l):
    luma = l.mean(-1)
    kept = np.full(luma.shape, -1e9, np.float32)
    for k in range(8):
        t = np.pi * k / 8
        line = np.zeros((DOT, DOT), np.uint8)
        c = DOT // 2
        cv2.line(line, (int(round(c - c * np.cos(t))), int(round(c - c * np.sin(t)))), (int(round(c + c * np.cos(t))), int(round(c + c * np.sin(t)))), 1, 1)
        kept = np.maximum(kept, cv2.morphologyEx(luma, cv2.MORPH_OPEN, line))
    spare = np.maximum(luma - kept - DOT_FLOOR, 0)
    low = np.full(luma.shape, 1e9, np.float32)
    for k in range(8):
        t = np.pi * k / 8
        line = np.zeros((DOT, DOT), np.uint8)
        c = DOT // 2
        cv2.line(line, (int(round(c - c * np.cos(t))), int(round(c - c * np.sin(t)))), (int(round(c + c * np.cos(t))), int(round(c + c * np.sin(t)))), 1, 1)
        low = np.minimum(low, cv2.morphologyEx(luma, cv2.MORPH_CLOSE, line))
    spare = spare - np.maximum(low - luma - DOT_FLOOR, 0)
    return l - cv2.GaussianBlur(spare, (0, 0), 0.7)[..., None], float((np.abs(spare) > 0.02).mean())


def window(n, first, last):
    x = (np.arange(n) + 0.5) / n
    w = 0.5 - 0.5 * np.cos(2 * np.pi * x)
    if first:
        w[: n // 2] = 1
    if last:
        w[n // 2 :] = 1
    return w.astype(np.float32)


def main():
    take = np.asarray(Image.open(TAKE).convert('RGB'), np.float32) / 255
    size = take.shape[0]
    count = (size - WINDOW) // STRIDE + 1
    n = WINDOW * SCALE
    acc = np.zeros((size * SCALE, size * SCALE, 3), np.float32)
    weight = np.zeros((size * SCALE, size * SCALE, 1), np.float32)
    for j in range(count):
        for i in range(count):
            x, y = i * STRIDE, j * STRIDE
            src = cv2.resize(take[y : y + WINDOW, x : x + WINDOW], (n, n), interpolation=cv2.INTER_LANCZOS4)
            out = np.asarray(Image.open(TILES % (i, j)).convert('RGB').resize((n, n), Image.LANCZOS), np.float32) / 255
            a, b = coded(np.clip(src, 0, 1)), coded(out)
            dx, dy, peak = shift(a, b)
            if abs(dx) > 0.3 or abs(dy) > 0.3:
                b = cv2.warpAffine(b, np.float32([[1, 0, -dx], [0, 1, -dy]]), (n, n), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
            b = b - cv2.GaussianBlur(b, (0, 0), KEEP) + cv2.GaussianBlur(a, (0, 0), KEEP)
            b, share = dots(b)
            w = (window(n, j == 0, j == count - 1)[:, None] * window(n, i == 0, i == count - 1)[None, :])[..., None]
            acc[y * SCALE : y * SCALE + n, x * SCALE : x * SCALE + n] += b * w
            weight[y * SCALE : y * SCALE + n, x * SCALE : x * SCALE + n] += w
            print('tile', i, j, 'shift', round(dx, 2), round(dy, 2), 'peak', round(peak, 3), 'dot share', round(share, 5))
    l = acc / np.maximum(weight, 1e-6)
    lin = np.clip(np.exp(l) - 0.02, 0, 1)
    Image.fromarray((geo.to_srgb(lin) * 255 + 0.5).astype(np.uint8)).save(OUT)
    print('wrote', OUT, lin.shape)


main()
