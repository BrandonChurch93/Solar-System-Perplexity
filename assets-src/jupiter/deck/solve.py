import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geom
from layback import inverse_filmic, srgb_to_linear

ROOT = os.path.join(HERE, '..', '..', '..')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')


def scene(path, size=None):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3]
    if size is not None and (im.shape[1], im.shape[0]) != size:
        im = cv2.resize(im, size, interpolation=cv2.INTER_AREA)
    return inverse_filmic(srgb_to_linear(im[..., ::-1].astype(np.float64) / 255)).astype(np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def stored(name):
    path = os.path.join(HERE, 'solve-' + name + '.png')
    if not os.path.exists(path):
        return None
    return cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., ::-1].astype(np.float32) / 65535


def far(path, size):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    n = im[..., 2].astype(np.float64) * 65536 + im[..., 1].astype(np.float64) * 256 + im[..., 0].astype(np.float64)
    if (im.shape[1], im.shape[0]) != size:
        raise SystemExit('the range picture has another size than the frame')
    return n > 0, np.exp2((n - 1) / 16777214 * 32 - 20) * geom.R


def filled(num, den, least, sigmas):
    out = np.full(num.shape, np.nan, np.float32)
    for sigma in sigmas:
        d = cv2.GaussianBlur(den, (0, 0), sigma)
        n = cv2.GaussianBlur(num, (0, 0), sigma)
        ok = np.isnan(out[..., 0]) & (d > least)
        out[ok] = n[ok] / d[ok][..., None]
    return out


def main():
    frame, bare, approved, reach = sys.argv[1:5]
    deck = json.load(open(os.path.join(STOP, 'deck.json')))
    cfg = deck['guide']['solve']
    f = scene(frame)
    h, w = f.shape[:2]
    f0 = scene(bare)
    a = scene(approved, (w, h))
    seen, t = far(reach, (w, h))
    sigma = cfg['lowPx'] * h / 1080
    m = seen.astype(np.float32)[..., None]
    num = cv2.GaussianBlur((a - f0) * m, (0, 0), sigma)
    den = cv2.GaussianBlur((f - f0) * m, (0, 0), sigma)
    ratio = np.clip(np.maximum(num, 0) / np.maximum(den, 1e-6), cfg['step'][0], cfg['step'][1])
    logr = np.log2(ratio)
    even = logr.mean(-1, keepdims=True)
    logr = cfg['share'] * even + cfg['hueShare'] * np.clip(logr - even, -cfg['hueLog2'], cfg['hueLog2'])
    print('ratio of the round on the ground: mean', [round(float(v), 3) for v in np.exp(np.log(ratio[seen]).mean(0))], 'tenth', [round(float(v), 3) for v in np.percentile(ratio[seen], 10, axis=0)], 'ninetieth', [round(float(v), 3) for v in np.percentile(ratio[seen], 90, axis=0)], 'at the limits', round(float(((ratio[seen] <= cfg['step'][0]) | (ratio[seen] >= cfg['step'][1])).mean()), 4))
    yy, xx = np.mgrid[0:h, 0:w]
    rays = geom.rays(geom.OX + (xx + 0.5) * geom.W0 / w - 0.5, geom.OY + (yy + 0.5) * geom.H0 / h - 0.5)
    gx, gy = geom.to_chart(rays * t[..., None])
    weight = seen.astype(np.float32)
    for name, level in deck['guide']['levels'].items():
        n = cfg['pixels']
        step = level['size'] / n
        ix = np.floor((gx - (level['centre'][0] - level['size'] / 2)) / step).astype(np.int64)
        iy = np.floor((gy - (level['centre'][1] - level['size'] / 2)) / step).astype(np.int64)
        ok = seen & (ix >= 0) & (ix < n) & (iy >= 0) & (iy < n)
        flat = iy[ok] * n + ix[ok]
        den2 = np.bincount(flat, weights=weight[ok], minlength=n * n).reshape(n, n).astype(np.float32)
        num2 = np.stack([np.bincount(flat, weights=(logr[..., c] * weight)[ok], minlength=n * n).reshape(n, n) for c in range(3)], -1).astype(np.float32)
        out = filled(num2, den2, cfg['leastWeight'], cfg['fillPx'])
        hole = np.isnan(out[..., 0])
        out[hole] = 0
        out = cv2.GaussianBlur(out, (0, 0), deck['guide']['cutUnits'] / step, borderType=cv2.BORDER_REPLICATE)
        before = stored(name)
        total = out if before is None else out + (before * 2 - 1) * cfg['rangeLog2']
        total = np.clip(total - np.maximum(total.mean(-1, keepdims=True) - cfg['upLog2'], 0), -cfg['rangeLog2'], cfg['rangeLog2'])
        cv2.imwrite(os.path.join(HERE, 'solve-' + name + '.png'), np.round((total / cfg['rangeLog2'] * 0.5 + 0.5) * 65535).astype(np.uint16)[..., ::-1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
        print('solve', name, 'cells seen', round(float((den2 > 0).mean()), 4), 'left at zero', round(float(hole.mean()), 4), 'log2 total: least', round(float(total.min()), 3), 'most', round(float(total.max()), 3))


main()
