import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'tools/assets')
import lightcurve as lc

Image.MAX_IMAGE_PIXELS = None
WORK = 'out/work/jupiter'
FIT = json.load(open('assets-src/jupiter/fit.json'))
HERO = 'references/approved/jupiter-hero.png'
LIMB_KNOTS = 17


def linear_to_srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.maximum(c, 1e-9) ** (1 / 2.4) - 0.055)


def filmic(x):
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def decode(img8):
    return lc.inverse_filmic(lc.srgb_to_linear(img8.astype(np.float32) / 255)).astype(np.float32)


def encode(lin):
    return np.round(np.clip(linear_to_srgb(filmic(np.maximum(lin, 0))), 0, 1) * 255).astype(np.uint8)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def load(path):
    return np.asarray(Image.open(path).convert('RGB'))


def save(path, arr, q=94):
    im = Image.fromarray(arr)
    if path.endswith('.jpg'):
        im.save(path, quality=q, subsampling=0)
    else:
        im.save(path)


def limb_at(table, mu):
    x = np.clip(mu, 0, 1) * (LIMB_KNOTS - 1)
    return np.stack([np.interp(x, np.arange(LIMB_KNOTS), table[:, c]) for c in range(3)], -1)


def moon_mask(w, h, grow=0):
    k = w / 2816
    m = np.zeros((h, w), np.uint8)
    cv2.circle(m, (int(1524 * k), int(1000 * k)), int((52 + grow) * k), 255, -1)
    cv2.ellipse(m, (int(1656 * k), int(1030 * k)), (int((118 + grow) * k), int((84 + grow) * k)), 14, 0, 360, 255, -1)
    return m


def wrap_dirs(ww, wh, rows):
    lon = ((np.arange(ww) + 0.5) / ww - 0.5) * 2 * np.pi
    lat = (0.5 - (rows + 0.5) / wh) * np.pi
    lo, la = np.meshgrid(lon, lat)
    return np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], -1)


def wrap_to_hero(ww, wh, rows, w, h):
    th = np.tan(np.radians(FIT['vfovDeg']) / 2)
    cam = np.array(FIT['camera']['position'])
    sun = np.array(FIT['sunDir'])
    sun = sun / np.linalg.norm(sun)
    p = wrap_dirs(ww, wh, rows) @ lc.rotation(FIT).T
    v = p - cam
    dist = np.linalg.norm(v, axis=-1)
    mu = -(p * v).sum(-1) / dist
    px = ((v[..., 0] / -v[..., 2] / (th * w / h) + 1) / 2 * w - 0.5).astype(np.float32)
    py = ((1 - v[..., 1] / -v[..., 2] / th) / 2 * h - 0.5).astype(np.float32)
    return px, py, mu.astype(np.float32), (p @ sun).astype(np.float32)
