import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import geo
from deblock import deblock

Image.MAX_IMAGE_PIXELS = None
FULL = (2816, 1584)
MARGIN = 0.125
EDGE = (1.004, 1.014)
LINE = 23
SUN = (2514, 227, 330)
SUN_FROM = (-150, 900)
SUN_OUT = 520
SUN_STARS = 0.45
SEAM = 110
MOON = (337, 407, 95)
RING = dict(normal=[0.1681, 0.9779, 0.1244], centre=[0.0533, 0.0532, -0.4902], inner=1.36, outer=1.86)


def sunless(lin):
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    r = np.hypot(xx - SUN[0], yy - SUN[1])
    edges = np.linspace(0, SUN_OUT, 91)
    mid = 0.5 * (edges[:-1] + edges[1:])
    prof = np.stack([[np.percentile(lin[..., c][(r >= a) & (r < b)], 30) for a, b in zip(edges[:-1], edges[1:])] for c in range(3)], -1)
    prof = np.maximum.accumulate((prof - prof[-1])[::-1], axis=0)[::-1]
    glow = np.stack([np.interp(r, mid, prof[:, c], right=0) for c in range(3)], -1)
    flat = lin - glow
    hole = r < SUN[2]
    keep = (~hole).astype(np.float32)
    low = lambda v: ndi.gaussian_filter(np.minimum(v, ndi.gaussian_filter(v, 5)), 5)
    back = np.stack([ndi.gaussian_filter(low(flat[..., c]) * keep, 90) / np.maximum(ndi.gaussian_filter(keep, 90), 1e-4) for c in range(3)], -1)
    src = np.roll(lin, (-SUN_FROM[1], -SUN_FROM[0]), axis=(0, 1))
    stars = np.maximum(src - np.stack([low(src[..., c]) for c in range(3)], -1), 0)
    m = (1 - step(r, SUN[2] * 0.85, SUN[2] * 1.1))[..., None]
    return flat * (1 - m) + (back + stars * SUN_STARS) * m, mid, prof


def save(lin, name, out):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    bare, mid, prof = sunless(lin)
    wide = np.pad(bare, ((py, py), (px, px), (0, 0)), mode='symmetric')
    yy, xx = np.mgrid[0:wide.shape[0], 0:wide.shape[1]]
    r = np.hypot(xx - px - SUN[0], yy - py - SUN[1])
    for c in range(3):
        wide[..., c] += np.interp(r, mid, prof[:, c], right=0)
    away = np.maximum.reduce([py - yy, yy - (py + FULL[1] - 1), px - xx, xx - (px + FULL[0] - 1), np.zeros_like(yy)])
    w = (1 - step(away, 0, SEAM))[..., None]
    wide = wide * (1 - w) + np.pad(lin, ((py, py), (px, px), (0, 0)), mode='symmetric') * w
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/{name}', lossless=True, quality=90, method=6)
        print(key, name, im.size, round(os.path.getsize(f'{out}/{key}/{name}') / 1e6, 2), 'MB')


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    ca, cb, cc, cd, ce = 2.51, 0.03, 2.43, 0.59, 0.14
    kk = cd * y - cb
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (cc * y - ca) * ce * y, 0))) / (2 * (cc * y - ca))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(path, resample, blocks=False):
    img = Image.open(path).convert('RGB')
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], 'F').resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return unfilm(to_linear(a))


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def luma(a):
    return a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def compact(a):
    a = a.astype(np.float32)
    best = np.zeros_like(a)
    for ang in range(0, 180, 15):
        t = np.radians(ang)
        k = np.zeros((LINE, LINE), np.uint8)
        c = LINE // 2
        cv2.line(k, (int(round(c - c * np.cos(t))), int(round(c - c * np.sin(t)))), (int(round(c + c * np.cos(t))), int(round(c + c * np.sin(t)))), 1, 1)
        best = np.maximum(best, cv2.morphologyEx(a, cv2.MORPH_OPEN, k))
    return np.maximum(a - best, 0)


def ring_mask():
    n = np.array(RING['normal'], float)
    n /= np.linalg.norm(n)
    c = np.array(RING['centre'], float)
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    f = (FULL[1] / 2) / np.tan(np.radians(15))
    d = np.stack([(xx - FULL[0] / 2) / f, -(yy - FULL[1] / 2) / f, -np.ones(xx.shape)], -1)
    t = ((c - geo.CAM) @ n) / (d @ n)
    p = geo.CAM + d * t[..., None] - c
    r = np.linalg.norm(p, axis=-1)
    m = step(r, RING['inner'] - 0.06, RING['inner']) * (1 - step(r, RING['outer'], RING['outer'] + 0.06)) * (t > 0)
    return m.astype(np.float32)


def hold(hero, fill, glow, out):
    fit = json.load(open(os.path.join(geo.ROOT, 'assets-src/neptune/fit.json')))
    c = fit['circle']
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    d = np.hypot(xx - c['cx'], yy - c['cy']) / c['r']
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    f = scene(fill, Image.LANCZOS, False)
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    sun = 1 - step(np.hypot(xx - SUN[0], yy - SUN[1]), SUN[2] * 0.7, SUN[2])
    moon = step(np.hypot(xx - MOON[0], yy - MOON[1]), MOON[2] * 1.12, MOON[2] * 1.3)
    covered = step(lg / np.maximum(la, 1e-5), 0.6, 0.85) * (1 - sun)
    own = step(d, 1.03, 1.07) * (1 - covered) * moon * (1 - ring_mask())
    own = ndi.gaussian_filter(own, 3)
    zone = (d > 1.1) & (d < 1.45) & (own > 0.98)
    gain = np.array([np.median(sky[..., i][zone]) / max(np.median(f[..., i][zone]), 1e-6) for i in range(3)])
    near = (own > 0.98).astype(np.float32)
    soft = lambda v: ndi.gaussian_filter(v, 48)
    local = np.stack([soft(np.minimum(sky[..., i], 0.2) * near) / np.maximum(soft(np.minimum(f[..., i], 0.2) * near), 1e-6) for i in range(3)], -1)
    reach = (soft(near) > 0.02)[..., None] * step(d, 0.72, 1.04)[..., None]
    scale = gain * (1 - reach) + np.clip(local, gain * 0.35, gain * 2.5) * reach
    print('fill gain', gain.round(3), 'own share', float(own.mean().round(3)))
    f = f * scale
    hs, fs = compact(a), compact(f)
    k = float(luma(hs)[zone].mean() / max(luma(fs)[zone].mean(), 1e-6))
    print('fill star gain', round(k, 3))
    outside = (step(d, EDGE[0], EDGE[1]) * moon)[..., None]
    f = f - fs + fs * k * (1 - outside) + hs * outside
    lin = sky * own[..., None] + f * (1 - own[..., None])
    save(lin, 'sky-hold.webp', out)
    Image.fromarray((np.clip(own, 0, 1) * 255).astype(np.uint8)).resize((1408, 792)).save(os.path.join(geo.ROOT, 'out/work/nep/sky/own.png'))


if __name__ == '__main__':
    hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
