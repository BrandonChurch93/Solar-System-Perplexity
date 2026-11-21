import os
import sys

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter, percentile_filter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

LUM = np.array([0.3, 0.4, 0.3], np.float32)
CLOUD = np.array([0.30, 0.39, 1.0], np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def local_floor(x, scale, window, pct, sigma):
    h, w = x.shape
    small = cv2.resize(x, (max(w // scale, 8), max(h // scale, 8)), interpolation=cv2.INTER_AREA)
    f = percentile_filter(small, pct, size=window, mode='nearest')
    f = gaussian_filter(f, sigma, mode='nearest')
    return cv2.resize(f, (w, h), interpolation=cv2.INTER_CUBIC)


def unmix(a, hue, cloud=CLOUD):
    d = hue
    k = cloud
    dd = (d * d).sum(-1)
    dk = d @ k
    kk = float(k @ k)
    ad = (a * d).sum(-1)
    ak = a @ k
    det = np.maximum(dd * kk - dk * dk, 1e-9)
    p = (ad * kk - ak * dk) / det
    q = (ak * dd - ad * dk) / det
    return np.maximum(p, 0), np.maximum(q, 0)


def inpaint(deck, mask, radius=5, down=4):
    h, w, _ = deck.shape
    top = max(float(np.percentile(deck, 99.9)), 1e-3)
    hs, ws = h // down, w // down
    ms = cv2.resize(mask, (ws, hs), interpolation=cv2.INTER_AREA)
    ms = (ms > 0).astype(np.uint8)
    fill = np.zeros_like(deck)
    for c in range(3):
        ch = np.clip(deck[..., c] / top, 0, 1).astype(np.float32)
        wgt = (mask == 0).astype(np.float32)
        num = cv2.resize(ch * wgt, (ws, hs), interpolation=cv2.INTER_AREA)
        den = cv2.resize(wgt, (ws, hs), interpolation=cv2.INTER_AREA)
        chs = np.where(den > 0.3, num / np.maximum(den, 1e-3), 0)
        hole = (den <= 0.3).astype(np.uint8)
        f = cv2.inpaint((chs * 65535).astype(np.uint16), hole, radius, cv2.INPAINT_TELEA).astype(np.float32) / 65535
        f = np.where(hole > 0, gaussian_filter(f, 1.0), f)
        fill[..., c] = cv2.resize(f, (w, h), interpolation=cv2.INTER_CUBIC) * top
    return fill


def grain_of(a, clean, size=384):
    h, w, _ = a.shape
    lum = a @ LUM
    lo = gaussian_filter(lum, 3.0)
    rel = lum / np.maximum(lo, 1e-4) - 1
    score = cv2.boxFilter(clean.astype(np.float32), -1, (size, size))
    y, x = np.unravel_index(np.argmax(score), score.shape)
    y0, x0 = int(np.clip(y - size // 2, 0, h - size)), int(np.clip(x - size // 2, 0, w - size))
    t = rel[y0:y0 + size, x0:x0 + size]
    t = np.clip(t, -3 * t.std(), 3 * t.std())
    tile = np.block([[t, t[:, ::-1]], [t[::-1], t[::-1, ::-1]]])
    reps = (h // tile.shape[0] + 1, w // tile.shape[1] + 1)
    return np.tile(tile, reps)[:h, :w]


def separate(albedo, white, valid=None, scale=8, window=25, zone=(0.02, 0.12), cloud=CLOUD, grain=True):
    a = albedo.astype(np.float32)
    h, w, _ = a.shape
    white = np.broadcast_to(np.asarray(white, np.float32), (h, w))
    base = a if valid is None else np.where(valid[..., None], a, np.median(a[valid], 0))
    floor = np.stack([local_floor(np.ascontiguousarray(base[..., c]), scale, window, 25, window / 5) for c in range(3)], -1)
    hue = floor / np.maximum(floor[..., 2:3], 1e-4)
    p, q = unmix(a, hue, cloud)
    a0 = np.clip(q / np.maximum(white, 1e-4), 0, 1)
    z = np.maximum(a0, gaussian_filter(a0, 2.0) * 1.6)
    m = smoothstep(zone[0], zone[1], z)
    mask = (m > 0.3).astype(np.uint8)
    fill = inpaint(a, mask)
    if grain:
        fill *= (1 + grain_of(a, m < 0.01))[..., None]
    deck = a * (1 - m[..., None]) + fill * m[..., None]
    wc = white[..., None] * cloud
    ld = deck @ LUM
    alpha = np.clip(((a @ LUM) - ld) / np.maximum(wc @ LUM - ld, 1e-4), 0, 1)
    alpha *= smoothstep(0.0, 0.5, m)
    return deck, alpha, q
