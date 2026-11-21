import json
import re
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'tools/assets')
import lightcurve as lc

Image.MAX_IMAGE_PIXELS = None
FIT = json.load(open('assets-src/mercury/fit.json'))
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
NIGHT = (-0.14, -0.03)
DAY = (0.0, 0.07)
DUSK = (-0.12, -0.06)
SIGNAL = (1.3, 2.0, 4.0)


def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.maximum(c, 1e-9) ** (1 / 2.4) - 0.055).astype(np.float32)


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1).astype(np.float32)


def unfilm(y):
    return lc.inverse_filmic(y).astype(np.float32)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255


def scene(path):
    return unfilm(to_linear(load(path)))


def coded(lin):
    return np.round(to_srgb(film(lin)) * 255).astype(np.uint8)


def decoded(img8):
    return unfilm(to_linear(img8.astype(np.float32) / 255))


def directions(width, height, rows=None):
    rows = np.arange(height) if rows is None else rows
    lon = ((np.arange(width) + 0.5) / width - 0.5) * 2 * np.pi
    lat = (0.5 - (rows + 0.5) / height) * np.pi
    lo, la = np.meshgrid(lon, lat)
    return np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], -1).astype(np.float32)


def hero_view(body, w, h):
    g_cam = np.array(FIT['camera']['position'])
    th = np.tan(np.radians(FIT['vfovDeg']) / 2)
    p = body @ lc.rotation(FIT).T
    v = p - g_cam
    dist = np.linalg.norm(v, axis=-1)
    mu = -(p * v).sum(-1) / dist
    px = ((v[..., 0] / -v[..., 2] / (th * w / h) + 1) / 2 * w - 0.5).astype(np.float32)
    py = ((1 - v[..., 1] / -v[..., 2] / th) / 2 * h - 0.5).astype(np.float32)
    sun = np.array(FIT['sunDir'])
    sun /= np.linalg.norm(sun)
    return px, py, mu.astype(np.float32), (p @ sun).astype(np.float32)


def sample_map(img, d, mode=cv2.INTER_LINEAR):
    h, w = img.shape[:2]
    u = (np.arctan2(d[..., 0], d[..., 2]) / (2 * np.pi) + 0.5) * w - 0.5
    v = (0.5 - np.arcsin(np.clip(d[..., 1], -1, 1)) / np.pi) * h - 0.5
    return cv2.remap(img, u.astype(np.float32), v.astype(np.float32), mode, borderMode=cv2.BORDER_WRAP)


def shade(ndl, mu):
    d = json.load(open('src/stops/mercury/curve.json'))
    curve = np.array(d['curve'])
    table = np.array(d['limb'])
    night = curve[0]
    n = len(table)
    x = np.clip(mu / d['limbTo'], 0, 1) * (n - 1)
    i = np.minimum(np.floor(x).astype(np.int32), n - 2)
    f = (x - i)[..., None]
    gain = table[i] * (1 - f) + table[i + 1] * f
    return (np.maximum(lc.curve_at(curve, ndl) - night, 0) * gain + night).astype(np.float32)


def look(name, count=1):
    text = open('src/stops/mercury/look.ts').read()
    found = re.search(name + r': \[?([-0-9., ]+)', text).group(1)
    v = [float(x) for x in found.split(',') if x.strip()][:count]
    return v[0] if count == 1 else v


def ground(seen, ndl, mu):
    d = json.load(open('src/stops/mercury/curve.json'))
    curve = np.array(d['curve'])
    table = np.array(d['limb'])
    n = len(table)
    x = np.clip(mu / d['limbTo'], 0, 1) * (n - 1)
    i = np.minimum(np.floor(x).astype(np.int32), n - 2)
    f = (x - i)[..., None]
    lit = np.maximum(lc.curve_at(curve, ndl) - curve[0], 0) * (table[i] * (1 - f) + table[i + 1] * f)
    flat, detail, veil, veil_from, start = look('nightFlat'), look('nightDetail'), look('nightVeil'), look('nightVeilFrom'), look('from')
    r = look('range', 4)
    dark = curve[0] * (1 + veil * smooth(veil_from, 1, mu))[..., None]
    band = (smooth(r[0], r[1], ndl) * (1 - smooth(r[2], r[3], ndl)) * (1 - detail))[..., None]
    rest = seen - flat * (1 - detail) * dark
    low = rest / np.maximum(lit + detail * dark, 1e-5)
    high = (rest + band * start * dark) / np.maximum(lit + (detail + band) * dark, 1e-5)
    return np.where(low > start, high, low).astype(np.float32)


def day(seen, g):
    lum = seen @ LUMA
    floor = float(np.median(lum[g['hit'] & (g['ndl'] > DUSK[0]) & (g['ndl'] < DUSK[1]) & (g['mu'] > 0.3)]))
    lit = smooth(SIGNAL[0], SIGNAL[1], blur(lum, SIGNAL[2] * seen.shape[1] / 5632) / floor)
    return np.maximum(smooth(DAY[0], DAY[1], g['ndl']), lit * smooth(NIGHT[0], NIGHT[1], g['ndl'])).astype(np.float32)
