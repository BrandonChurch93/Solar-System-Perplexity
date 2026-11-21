import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import geo

Image.MAX_IMAGE_PIXELS = None
OUT = 'public/assets/neptune'
WORK = 'out/work/nep/patches'
SPOT = (0.55, 0.52)
PAD = 8


def spot():
    d = geo.hero_rays(geo.HERO_W, geo.HERO_H, np.array([SPOT[0] * geo.HERO_W - 0.5]), np.array([SPOT[1] * geo.HERO_H - 0.5]))
    p, ok = geo.hit_sphere(d.reshape(-1, 3))
    lon, lat = geo.world_to_lonlat(p)
    return float(lon[0]), float(lat[0])


def basis(lon, lat):
    n = np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])
    e = np.cross([0, 1, 0], n)
    e /= np.linalg.norm(e)
    return n, e, np.cross(n, e)


def load_wrap():
    wrap = cv2.cvtColor(cv2.imread(os.path.join(OUT, 'full/wrap.webp'), cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA)
    return np.concatenate([wrap[:, -PAD:], wrap, wrap[:, :PAD]], 1)


def half(width):
    return np.tan(np.radians(width) / 2)


def resample(wrap, width, size):
    lon0, lat0 = spot()
    n, e, u = basis(lon0, lat0)
    H = wrap.shape[0]
    W = wrap.shape[1] - 2 * PAD
    g = ((np.arange(size) + 0.5) / size - 0.5) * 2 * half(width)
    gx, gy = np.meshgrid(g, -g)
    d = n[None, None, :] + gx[..., None] * e + gy[..., None] * u
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    mx = ((lon / (2 * np.pi) + 0.5) * W - 0.5 + PAD).astype(np.float32)
    my = ((0.5 - lat / np.pi) * H - 0.5).astype(np.float32)
    return cv2.remap(wrap, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32) / 255


def composite(rgba):
    a = rgba[..., 3:4]
    return rgba[..., :3] * (1 - a) + a
