import argparse
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

LEVELS = 6
STRENGTH = 0.08
VIGNETTE = 0.45
W, H = 1920, 1080
CLOSE = 'references/approved/earth-close.jpg'


def from_srgb(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def filmic(x):
    x = np.maximum(x, 0)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def vignette(w, h, amount):
    y, x = np.mgrid[0:h, 0:w]
    qx = ((x + 0.5) / w - 0.5) * (w / h)
    qy = (y + 0.5) / h - 0.5
    return (1 - amount) + amount / (1 + (qx * qx + qy * qy) * 0.9) ** 2


def fetch(img, u, v):
    h, w = img.shape[:2]
    return cv2.remap(img, (u * w - 0.5).astype(np.float32), (v * h - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def grid(w, h):
    v, u = np.mgrid[0:h, 0:w]
    return (u + 0.5) / w, (v + 0.5) / h


def down(src, first):
    sh, sw = src.shape[:2]
    w, h = max(2, -(-sw // 2)), max(2, -(-sh // 2))
    if first:
        src = np.clip(src, 0, 64)
        src = src / (1 + src.max(axis=2, keepdims=True) * 0.02)
    u, v = grid(w, h)
    tx, ty = 1 / sw, 1 / sh
    out = np.zeros((h, w, 3), np.float32)
    for dx, dy, k in [(0, 0, 0.125)] + [(a, b, 0.03125) for a in (-2, 2) for b in (-2, 2)] + [(0, 2, 0.0625), (0, -2, 0.0625), (2, 0, 0.0625), (-2, 0, 0.0625)] + [(a, b, 0.125) for a in (-1, 1) for b in (-1, 1)]:
        out += k * fetch(src, u + dx * tx, v + dy * ty)
    return out


def up(acc, base, radius=1.0):
    h, w = base.shape[:2]
    ah, aw = acc.shape[:2]
    u, v = grid(w, h)
    tx, ty = radius / aw, radius / ah
    s = np.zeros((h, w, 3), np.float32)
    for dx, dy, k in [(a, b, 1) for a in (-1, 1) for b in (-1, 1)] + [(0, 1, 2), (0, -1, 2), (1, 0, 2), (-1, 0, 2)] + [(0, 0, 4)]:
        s += k * fetch(acc, u + dx * tx, v + dy * ty)
    return s / 16 + base


def bloom(scene):
    downs = []
    src = scene.astype(np.float32)
    for i in range(LEVELS):
        src = down(src, i == 0)
        downs.append(src)
    acc = downs[-1]
    for i in range(LEVELS - 2, -1, -1):
        acc = up(acc, downs[i])
    return acc / LEVELS


def scene_of(code, vig):
    return inverse_filmic(from_srgb(code)) / vig[..., None]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=None)
    ap.add_argument('--check', default=None)
    a = ap.parse_args()
    close = np.asarray(Image.open(CLOSE).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float64) / 255
    vig = vignette(W, H, VIGNETTE)
    scene = scene_of(close, vig)
    low = bloom(scene)
    u, v = grid(W, H)
    wide = fetch(low, u, v).astype(np.float64)
    seen = to_srgb(filmic(((1 - STRENGTH) * scene + STRENGTH * wide) * vig[..., None])) * 255
    target = close * 255
    luma = target.mean(axis=2)
    below = np.arange(H)[:, None] > 260
    stats = {}
    for name, m in (('dark', (luma < 70) & below), ('mid', (luma >= 70) & (luma < 130) & below), ('bright', (luma > 200) & below)):
        stats[name] = [round(float(x), 2) for x in (seen[m] - target[m]).mean(axis=0)]
    band = (seen[180:220, 600:1320] - target[180:220, 600:1320]).reshape(-1, 3).mean(axis=0)
    stats['band'] = [round(float(x), 2) for x in band]
    print('bloom alone, seen minus close image:', json.dumps(stats))
    pre = (scene - STRENGTH * wide) / (1 - STRENGTH)
    again = fetch(bloom(np.maximum(pre, 0)), u, v).astype(np.float64)
    back = to_srgb(filmic(((1 - STRENGTH) * np.maximum(pre, 0) + STRENGTH * again) * vig[..., None])) * 255
    err = back - target
    print('with the low map taken out first: mean abs %.3f, p99 abs %.2f, negative scene share %.5f' % (np.abs(err).mean(), np.percentile(np.abs(err), 99), float((pre < 0).any(axis=2).mean())))
    if a.check:
        still = np.asarray(Image.open(a.check).convert('RGB')).astype(np.float64)
        for name, m in (('dark', (luma < 70) & below), ('mid', (luma >= 70) & (luma < 130) & below), ('bright', (luma > 200) & below)):
            print('still', name, [round(float(x), 2) for x in (still[m] - target[m]).mean(axis=0)])
        print('still band', [round(float(x), 2) for x in (still[180:220, 600:1320] - target[180:220, 600:1320]).reshape(-1, 3).mean(axis=0)])
    code = np.clip(np.round(to_srgb(filmic(low * 1.0)) * 255), 0, 255).astype(np.uint8)
    for name in ('full', 'web'):
        folder = os.path.join(a.out, name) if a.out else os.path.join('public/assets/earth', name)
        if a.out is None and not os.path.isdir(folder):
            sys.exit('missing ' + folder)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, 'relief-low.webp')
        Image.fromarray(code).save(path, lossless=True, method=6)
        print(path, code.shape[1], 'x', code.shape[0], os.path.getsize(path), 'bytes')
    if a.out is None:
        path = 'src/stops/earth/relief.json'
        d = json.load(open(path))
        d['low'] = {'file': 'relief-low.webp'}
        json.dump(d, open(path, 'w'), indent=1)
        print(path, 'low', d['low'])


if __name__ == '__main__':
    main()
