import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'tools/assets')
import lightcurve as lc

Image.MAX_IMAGE_PIXELS = None
SRC, OUT = sys.argv[1], sys.argv[2]
WORK = 'out/work/match'
SIGMA, WIDE = float(sys.argv[3]) if len(sys.argv) > 3 else 12.0, 80.0
OUTLINE = [(118, 330), (125, 270), (160, 215), (215, 170), (290, 140), (360, 128), (430, 128), (480, 150), (520, 180), (560, 215), (600, 265), (620, 310), (618, 380), (600, 450), (570, 510), (520, 550), (450, 568), (380, 560), (300, 540), (230, 510), (170, 470), (135, 420), (118, 370)]
OFFSET = (1100, 900)


def linear_to_srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.maximum(c, 1e-9) ** (1 / 2.4) - 0.055)


def filmic(x):
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


fit = json.load(open('assets-src/mars/fit.json'))
haze = json.load(open('src/stops/mars/haze.json'))['ground']
hero = np.asarray(Image.open('references/approved/mars-hero.png').convert('RGB')).astype(np.float32) / 255
h, w, _ = hero.shape
g = lc.geometry(fit, w, h)
seen = lc.dehaze(lc.inverse_filmic(lc.srgb_to_linear(hero)), haze, g).astype(np.float32)
src = np.asarray(Image.open(SRC).convert('RGB'))
W8, H8 = src.shape[1], src.shape[0]
W4, H4 = W8 // 2, H8 // 2
a4 = lc.inverse_filmic(lc.srgb_to_linear(cv2.resize(src, (W4, H4), interpolation=cv2.INTER_AREA).astype(np.float32) / 255)).astype(np.float32)
mapx = ((g['lon'] / (2 * np.pi) + 0.5) * W4 - 0.5).astype(np.float32)
mapy = ((0.5 - g['lat'] / np.pi) * H4 - 0.5).astype(np.float32)
moon = np.zeros((h, w), np.uint8)
cv2.fillPoly(moon, [np.array([(x + OFFSET[0], y + OFFSET[1]) for x, y in OUTLINE], np.int32)], 255)
moon = cv2.dilate(moon, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
clear = 1 - blur(moon.astype(np.float32) / 255, 5)
clear = smooth(0.5, 1.0, clear)
edge = np.minimum(np.minimum(g['xs'], w - 1 - g['xs']), np.minimum(g['ys'], h - 1 - g['ys']))
frame = (g['hit'] * smooth(0.03, 0.2, g['mu']) * smooth(4, 90, edge)).astype(np.float32)
wgt = (g['hit'] * smooth(0.05, 0.3, g['mu']) * clear).astype(np.float32)
use = g['hit'] & (g['mu'] > 0.3) & (moon == 0)


def wrap_geometry(ww, wh, rows):
    lon = ((np.arange(ww) + 0.5) / ww - 0.5) * 2 * np.pi
    lat = (0.5 - (rows + 0.5) / wh) * np.pi
    lo, la = np.meshgrid(lon, lat)
    b = np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], -1)
    p = b @ lc.rotation(fit).T
    v = p - g['cam']
    dist = np.linalg.norm(v, axis=-1)
    mu = -(p * v).sum(-1) / dist
    px = ((v[..., 0] / -v[..., 2] / (g['th'] * w / h) + 1) / 2 * w - 0.5).astype(np.float32)
    py = ((1 - v[..., 1] / -v[..., 2] / g['th']) / 2 * h - 0.5).astype(np.float32)
    return px, py, mu.astype(np.float32), (p @ g['sun']).astype(np.float32)


px4, py4, mu4, ndl4 = wrap_geometry(W4, H4, np.arange(H4))
total = np.ones((H4, W4, 3), np.float32)
curve = None
for it in range(3):
    alb = cv2.remap(a4 * total, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    curve = lc.curve_from(g['ndl'], seen / np.maximum(alb, 1e-3), use)
    if it == 2:
        break
    pred = (lc.curve_at(curve, g['ndl']) * alb).astype(np.float32)
    w3 = wgt[..., None]
    n1, d1, b1 = blur(seen * w3, SIGMA), blur(pred * w3, SIGMA), blur(wgt, SIGMA)
    n2, d2, b2 = blur(seen * w3, WIDE), blur(pred * w3, WIDE), blur(wgt, WIDE)
    r1 = n1 / np.maximum(d1, 1e-5)
    r2 = n2 / np.maximum(d2, 1e-5)
    k = smooth(0.1, 0.5, b1)[..., None]
    r = np.clip(r2 * (1 - k) + r1 * k, 0.3, 2.5)
    r = 1 + (r - 1) * smooth(0.02, 0.1, b2)[..., None]
    rw = cv2.remap(r.astype(np.float32), px4, py4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    vis = (cv2.remap(frame, px4, py4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * (mu4 > 0))[..., None]
    total *= 1 + (rw - 1) * vis
    print('pass', it, 'ratio range', float(r.min()), float(r.max()))

lc.save(curve, use.sum(), 'src/stops/mars/curve.json')
lit = lc.curve_at(curve, g['ndl'])
night = (seen / np.maximum(lit, 1e-3)).astype(np.float32)
dim = np.clip((0.12 - lit.max(axis=-1)) / 0.08, 0, 1)[..., None].astype(np.float32)
night = night * (1 - dim) + blur(night, 0.6) * dim
nw = (wgt * frame).astype(np.float32)
flat = np.round(np.clip(linear_to_srgb(filmic(night)), 0, 1) * 255).astype(np.uint8)
small = cv2.resize(flat, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
hole = cv2.resize(cv2.dilate(moon, np.ones((9, 9), np.uint8)), (w // 4, h // 4), interpolation=cv2.INTER_NEAREST)
filled = cv2.resize(cv2.inpaint(small, hole, 12, cv2.INPAINT_TELEA), (w, h), interpolation=cv2.INTER_CUBIC)
filled = lc.inverse_filmic(lc.srgb_to_linear(filled.astype(np.float32) / 255)).astype(np.float32)
base = cv2.remap(a4, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
rh = np.clip(blur(filled, 10) / np.maximum(blur(base, 10), 1e-4), 0.25, 3).astype(np.float32)
rw = cv2.remap(rh, px4, py4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
vis = (cv2.remap(frame, px4, py4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * (mu4 > 0))[..., None]
total = total * (1 - vis) + rw * vis
np.save(f'{WORK}/total.npy', total.astype(np.float16))
out = np.zeros((H8, W8, 3), np.uint8)
STRIP = 256
for y0 in range(0, H8, STRIP):
    rows = np.arange(y0, min(y0 + STRIP, H8))
    px, py, mu, ndl = wrap_geometry(W8, H8, rows)
    a = lc.inverse_filmic(lc.srgb_to_linear(src[rows].astype(np.float32) / 255))
    ux = np.tile(((np.arange(W8) + 0.5) / 2 - 0.5).astype(np.float32), (len(rows), 1))
    uy = np.repeat(((rows + 0.5) / 2 - 0.5).astype(np.float32)[:, None], W8, 1)
    a = a * cv2.remap(total, ux, uy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    inside = (mu > 0) & (px > 0) & (px < w - 1) & (py > 0) & (py < h - 1)
    n = cv2.remap(night, px, py, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    k = (cv2.remap(nw, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * inside)[..., None]
    a = a * (1 - k) + np.maximum(n, 0) * k
    out[rows] = np.round(np.clip(linear_to_srgb(filmic(a)), 0, 1) * 255).astype(np.uint8)
os.makedirs(f'{OUT}/full', exist_ok=True)
Image.fromarray(out).save(f'{OUT}/full/wrap-color.jpg', quality=93, subsampling=0)
Image.fromarray(cv2.resize(out, (W4, H4), interpolation=cv2.INTER_AREA)).save(f'{OUT}/web/wrap-color.jpg', quality=93, subsampling=0)
print('written')
