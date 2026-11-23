import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import band as BD
import mosaic as M
import plates as P
import repaint as RP

C = RP.SPEC['craters']
WORK = RP.WORK
DEG = BD.DEG
N = BD.N


def sun(box):
    s = np.array(json.loads((M.WORK / 'tiles/cameras.json').read_text())['dive']['sun'])
    gx, gy = M.grid((0, 0), BD.B['canvasDeg'], 1024)
    ndl = cv2.GaussianBlur((M.dirs(gx, gy) @ s).astype(np.float32), (0, 0), 4)
    gy_, gx_ = np.gradient(ndl)
    a = np.array([gx_[512, 512], gy_[512, 512]])
    a /= np.linalg.norm(a)
    k = N / 1024
    x = (np.arange(box[0], box[2], dtype=np.float32) + 0.5) / k - 0.5
    y = (np.arange(box[1], box[3], dtype=np.float32) + 0.5) / k - 0.5
    sin = cv2.remap(ndl, np.tile(x, (len(y), 1)), np.tile(y[:, None], (1, len(x))), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return np.clip(sin, C['minSun'], 0.99, out=sin), a


def slope(sin):
    return sin / np.sqrt(1 - sin * sin)


def kept(x, y, box):
    return BD.inside((x + box[0] + 0.5 - N / 2) / DEG, (y + box[1] + 0.5 - N / 2) / DEG)


def rolling(shape, rng, waves):
    out = np.zeros(shape, np.float32)
    for wave, slope in waves:
        n = (max(int(shape[1] / wave * 2) + 2, 2), max(int(shape[0] / wave * 2) + 2, 2))
        g = rng.standard_normal((n[1], n[0])).astype(np.float32)
        out += cv2.resize(g, (shape[1], shape[0]), interpolation=cv2.INTER_CUBIC) * (slope * wave / 4)
    return out


def population(shape, rng):
    lo, hi = C['minPx'], C['radiusDeg'] * DEG
    area = shape[0] * shape[1]
    n = int(C['cover'] * area / (2 * np.pi * lo * lo))
    u = rng.random(n)
    r = lo * (1 - u * (1 - (lo / hi) ** 2)) ** -0.5
    return rng.random(n) * shape[1], rng.random(n) * shape[0], r


def stamp(h, sin, x, y, r, rng):
    reach = C['reach']
    big = r > C['complexDeg'] * DEG
    m = int(np.ceil(r * (reach if not big else reach + 0.5))) + 1
    cx, cy = int(x), int(y)
    x0, x1, y0, y1 = max(cx - m, 0), min(cx + m + 1, h.shape[1]), max(cy - m, 0), min(cy + m + 1, h.shape[0])
    if x1 - x0 < 2 or y1 - y0 < 2:
        return
    dx = np.arange(x0, x1, dtype=np.float32) - x
    dy = np.arange(y0, y1, dtype=np.float32) - y
    rr = np.sqrt(dx[None, :] ** 2 + dy[:, None] ** 2)
    if r > C['roundPx']:
        th = np.arctan2(dy[:, None], dx[None, :])
        wob = sum(C['wobble'] / k * rng.random() * np.cos(k * th + rng.random() * 6.2832) for k in (2, 3, 4, 5, 7))
        rr = rr / (1 + wob)
    t = rr / r
    t0 = float(slope(sin[min(max(cy, 0), sin.shape[0] - 1), min(max(cx, 0), sin.shape[1] - 1)]))
    age = rng.random()
    depth = min(r * t0 * (C['shadow'][0] + (C['shadow'][1] - C['shadow'][0]) * rng.random()), C['deepest'] * r) * (1 - C['worn'] * age * age)
    rim = C['rim'] * depth
    if big:
        steps = rng.integers(2, 5)
        t = t + C['terrace'] * np.sin(2 * np.pi * steps * np.clip(t, 0.45, 1.0)) / (2 * np.pi * steps)
        inside = -depth + (depth + rim) * np.clip((t - C['floor']) / (1 - C['floor']), 0, 1) ** 1.6
        inside = inside + C['peak'] * depth * rng.random() * np.exp(-(rr / (0.11 * r)) ** 2)
    else:
        inside = -depth + (depth + rim) * t * t
    prof = np.where(t <= 1, inside, rim * np.maximum(t, 1e-3) ** -3.0 * (1 - P.step(reach - 1, reach, t)))
    w = (1 - P.step(0.8, 1.1, t)) * C['wipe']
    win = h[y0:y1, x0:x1]
    h[y0:y1, x0:x1] = win * (1 - w) + float(win.mean()) * w + prof


def shadows(h, sin, a):
    flip = abs(a[0]) < abs(a[1])
    if flip:
        h, sin, a = h.T, sin.T, a[::-1]
    rows, cols = h.shape
    lean = a[1] / a[0]
    step = float(np.sqrt(1 + lean * lean))
    order = range(cols - 1, -1, -1) if a[0] > 0 else range(cols)
    yy = np.arange(rows, dtype=np.float32) + (lean if a[0] > 0 else -lean)
    i = np.clip(np.floor(yy).astype(np.int32), 0, rows - 2)
    f = np.clip(yy - i, 0, 1).astype(np.float32)
    acc = np.full(rows, -1e9, np.float32)
    lit = np.empty(h.shape, np.float32)
    for c in order:
        up = acc[i] * (1 - f) + acc[i + 1] * f - slope(sin[:, c]) * step
        lit[:, c] = 1 - P.step(0, C['penumbra'], np.maximum(up - h[:, c], 0))
        acc = np.maximum(up, h[:, c])
    return lit.T if flip else lit


def shade(h, sin, a):
    out = shadows(h, sin, a)
    rows = h.shape[0]
    for y0 in range(0, rows, 1024):
        y1 = min(y0 + 1024, rows)
        p0, p1 = max(y0 - 1, 0), min(y1 + 1, rows)
        hy, hx = np.gradient(h[p0:p1])
        hy, hx = hy[y0 - p0:y1 - p0], hx[y0 - p0:y1 - p0]
        s = sin[y0:y1]
        ns = (s - (hx * a[0] + hy * a[1]) * np.sqrt(1 - s * s)) / np.sqrt(1 + hx * hx + hy * hy)
        out[y0:y1] = np.clip(out[y0:y1] * np.maximum(ns, 0) / s, C['range'][0], C['range'][1])
    return out


def to_level(field, box, level):
    s = BD.scale(level)
    k = 1
    while s / k >= 2:
        k *= 2
    f = cv2.resize(field, (field.shape[1] // k, field.shape[0] // k), interpolation=cv2.INTER_AREA) if k > 1 else field
    c = ((np.arange(BD.SIZE, dtype=np.float32) + 0.5 - BD.SIZE / 2) * s + N / 2 - 0.5)
    xx, yy = np.meshgrid((c - box[0] + 0.5) / k - 0.5, (c - box[1] + 0.5) / k - 0.5)
    return cv2.remap(f, xx.astype(np.float32), yy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def field(box=None):
    rng = np.random.default_rng(C['seed'])
    whole = box is None
    box = np.array([0, 0, N, N] if whole else box)
    shape = (int(box[3] - box[1]), int(box[2] - box[0]))
    sin, a = sun(box)
    h = rolling(shape, rng, C['rolling'])
    h *= slope(sin)
    x, y, r = population(shape, rng)
    keep = rng.random(len(r)) < kept(x, y, box) if whole else np.ones(len(r), bool)
    print('canvas', N, 'box', box.tolist(), 'craters', len(r), 'kept', int(keep.sum()), 'radius px', round(float(r.min()), 1), round(float(r.max()), 1), 'sun toward', np.round(a, 3), 'sun height deg at the middle', round(float(np.degrees(np.arcsin(sin[shape[0] // 2, shape[1] // 2]))), 2), flush=True)
    for k in rng.permutation(len(r)):
        if keep[k]:
            stamp(h, sin, x[k], y[k], r[k], rng)
    rough = rolling(shape, rng, C['rough'])
    rough *= slope(sin)
    h += rough
    del rough
    out = shade(h, sin, a)
    del h, sin
    print('shade 1 50 99 percentile', np.round(np.percentile(out[::8, ::8], [1, 50, 99]), 3), 'share in shadow', round(float((out[::8, ::8] < 0.1).mean()), 3), flush=True)
    v = np.clip(out[::4, ::4] * 0.35, 0, 1) ** (1 / 2.2)
    Image.fromarray((v * 255).astype(np.uint8)).save(WORK / 'crater-shade-view.jpg', quality=90)
    if not whole:
        return out
    out -= 1
    for n in sorted(RP.WIDTH):
        np.save(WORK / ('crater-%d.npy' % n), np.log(np.maximum(to_level(out, box, n) + 1, C['range'][0])).astype(np.float16))
        print('level', n, flush=True)


if __name__ == '__main__':
    field([int(v) for v in sys.argv[1:5]] if len(sys.argv) > 4 else None)
