import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image

SEED = json.load(open('config/showcase.json'))['seed']
FULL_W, FULL_H = 8192, 2048
WEB_W, WEB_H = 4096, 1024
SCALE = 4 / 3
SEAM = 36.0
EDGE = 260
CORE = 372


def load(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255.0
    h, w = a.shape[:2]
    return a if SCALE == 1.0 else cv2.resize(a, (int(round(w * SCALE)), int(round(h * SCALE))), interpolation=cv2.INTER_LANCZOS4)


def level(a, target):
    luma = a.mean(2)
    h = a.shape[0]
    base = cv2.GaussianBlur(luma, (0, 0), 40)
    rows = base.mean(1)
    floor = float(np.percentile(rows, 8))
    weight = np.clip(rows - floor, 0, None)
    center = float((weight * np.arange(h)).sum() / weight.sum())
    y0 = int(round(center - FULL_H / 2))
    y0 = max(0, min(h - FULL_H, y0))
    a = a[y0:y0 + FULL_H]
    core = slice(FULL_H // 2 - CORE, FULL_H // 2 + CORE)
    cols = a[core].mean(axis=(0, 2))
    k = cv2.GaussianBlur(cols[None, :].astype(np.float32), (0, 0), 425, borderType=cv2.BORDER_REFLECT)[0]
    gain = np.clip(target / k, 0.62, 1.6)
    band = np.exp(-(((np.arange(FULL_H) - FULL_H / 2) / (CORE * 1.36)) ** 2))[:, None, None]
    return a * (1 + (gain[None, :, None] - 1) * band), center


def seam(a, b, margin):
    d = cv2.GaussianBlur(np.abs(a - b).sum(2), (0, 0), 4)
    d = d + 0.5 * cv2.GaussianBlur(np.abs(a.mean(2) - b.mean(2)), (0, 0), 24)
    h, w = d.shape
    d[:, :margin] = 1e3
    d[:, w - margin:] = 1e3
    cost = np.zeros_like(d)
    back = np.zeros((h, w), np.int8)
    cost[0] = d[0]
    steps = (-2, -1, 0, 1, 2)
    for y in range(1, h):
        stack = np.stack([np.roll(cost[y - 1], -k) + 0.002 * abs(k) for k in steps])
        best = stack.argmin(0)
        cost[y] = d[y] + stack.min(0)
        back[y] = best
    path = np.zeros(h, np.int32)
    path[-1] = int(cost[-1].argmin())
    for y in range(h - 1, 0, -1):
        path[y - 1] = np.clip(path[y] + steps[back[y, path[y]]], margin, w - margin - 1)
    return path


def join(takes):
    widths = [t.shape[1] for t in takes]
    overlap = (sum(widths) - FULL_W) / len(takes)
    starts = []
    x = 0.0
    for w in widths:
        starts.append(int(round(x)))
        x += w - overlap
    out = np.zeros((FULL_H, FULL_W, 3), np.float32)
    for t, w, s in zip(takes, widths, starts):
        xs = (s + np.arange(w)) % FULL_W
        out[:, xs] = t
    span = int(overlap)
    for i, (t, s) in enumerate(zip(takes, starts)):
        prev = takes[i - 1]
        a, b = prev[:, prev.shape[1] - span:], t[:, :span]
        path = seam(a, b, EDGE)
        pos = np.arange(span, dtype=np.float32)
        k = np.clip((pos[None, :] - path[:, None]) / SEAM + 0.5, 0, 1)
        k = (k * k * (3 - 2 * k))[:, :, None]
        xs = (s + np.arange(span)) % FULL_W
        out[:, xs] = a * (1 - k) + b * k
        print('joint', i, 'at', s, 'seam range', int(path.min()), int(path.max()), 'of', span)
    return out, starts, overlap


def save(a, path, seed):
    rng = np.random.default_rng(seed)
    d = (rng.random(a.shape, dtype=np.float32) - rng.random(a.shape, dtype=np.float32)) / 255.0
    img = Image.fromarray(np.clip((a + d) * 255.0 + 0.5, 0, 255).astype(np.uint8))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, quality=93, subsampling=0, optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--takes', nargs='+', required=True)
    ap.add_argument('--full', default='public/assets/shared/full/skyband.jpg')
    ap.add_argument('--web', default='public/assets/shared/web/skyband.jpg')
    ap.add_argument('--checks', default='out/work/skyband/checks')
    a = ap.parse_args()
    raw = [load(p) for p in a.takes]
    target = float(np.mean([t[t.shape[0] // 2 - CORE:t.shape[0] // 2 + CORE].mean() for t in raw]))
    takes = []
    for p, t in zip(a.takes, raw):
        lv, center = level(t, target)
        takes.append(lv)
        print(p, 'band center row', round(center, 1), 'mean', round(float(lv.mean()), 4))
    strip, starts, overlap = join(takes)
    save(strip, a.full, SEED)
    web = cv2.resize(np.concatenate([strip[:, -8:], strip, strip[:, :8]], axis=1), (WEB_W + 8, WEB_H), interpolation=cv2.INTER_AREA)[:, 4:-4]
    save(web, a.web, SEED + 1)
    os.makedirs(a.checks, exist_ok=True)
    roll = np.roll(strip, FULL_W // 2, axis=1)
    Image.fromarray((np.clip(cv2.resize(strip, (2048, 512), interpolation=cv2.INTER_AREA), 0, 1) * 255).astype(np.uint8)).save(f'{a.checks}/overview.jpg', quality=90)
    Image.fromarray((np.clip(roll[:, FULL_W // 2 - 700:FULL_W // 2 + 700], 0, 1) * 255).astype(np.uint8)).save(f'{a.checks}/wrap-seam.jpg', quality=92)
    for i, st in enumerate(starts[1:]):
        c = int(round(st + overlap / 2))
        Image.fromarray((np.clip(strip[:, c - 700:c + 700], 0, 1) * 255).astype(np.uint8)).save(f'{a.checks}/joint-{i + 1}.jpg', quality=92)
    cols = strip[FULL_H // 2 - CORE:FULL_H // 2 + CORE].mean(axis=(0, 2))
    print('strip', strip.shape, 'band column means x16', [round(float(v), 3) for v in cols.reshape(16, -1).mean(1)])
    print('rows x16', [round(float(v), 3) for v in strip.mean(axis=(1, 2)).reshape(16, -1).mean(1)])


if __name__ == '__main__':
    main()
