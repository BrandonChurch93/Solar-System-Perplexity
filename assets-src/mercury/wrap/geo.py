import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'tools/assets')
import lightcurve as lc

Image.MAX_IMAGE_PIXELS = None
FIT = json.load(open('assets-src/mercury/fit.json'))
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


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
