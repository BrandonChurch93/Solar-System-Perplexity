import json
import os

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WORK = os.path.join(ROOT, 'out', 'work', 'venus')
FIT = json.load(open(os.path.join(ROOT, 'src', 'stops', 'venus', 'fit.json')))
CAM = np.array(FIT['camera']['position'], dtype=np.float64)
SUN = np.array(FIT['sunDir'], dtype=np.float64)
SUN /= np.linalg.norm(SUN)
TH = np.tan(np.radians(FIT['vfovDeg']) / 2)
HERO_W, HERO_H = 2816, 1584
DISC = (1482.82, 788.05, 669.75)


def rotation():
    x, y, z, q = FIT['globe']['quaternion']
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * q), 2 * (x * z + y * q)], [2 * (x * y + z * q), 1 - 2 * (x * x + z * z), 2 * (y * z - x * q)], [2 * (x * z - y * q), 2 * (y * z + x * q), 1 - 2 * (x * x + y * y)]])


R = rotation()


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


def scene(a):
    return unfilm(to_linear(a))


def encode(lin):
    return to_srgb(film(lin))


def lonlat_dir(lon_deg, lat_deg):
    lon = np.radians(lon_deg)
    lat = np.radians(lat_deg)
    return np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)


def dir_lonlat(d):
    return np.degrees(np.arctan2(d[..., 0], d[..., 2])), np.degrees(np.arcsin(np.clip(d[..., 1], -1, 1)))


def rays(w, h, xs=None, ys=None):
    if xs is None:
        ys, xs = np.mgrid[0:h, 0:w]
        xs = xs + 0.5
        ys = ys + 0.5
    d = np.stack([(2 * xs / w - 1) * TH * w / h, (1 - 2 * ys / h) * TH, -np.ones(np.shape(xs))], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def hit(d, cam=CAM):
    b = -(d @ cam)
    disc = b * b - (cam @ cam - 1)
    ok = disc > 0
    p = cam + d * (b - np.sqrt(np.maximum(disc, 0)))[..., None]
    return ok, p


def project(p_world, w=HERO_W, h=HERO_H, cam=CAM):
    v = p_world - cam
    x = v[..., 0] / -v[..., 2] / (TH * w / h)
    y = v[..., 1] / -v[..., 2] / TH
    return (x + 1) / 2 * w, (1 - y) / 2 * h


def body(p_world):
    return p_world @ R


def world(p_body):
    return p_body @ R.T


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255


def save(a, path, q=95):
    im = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
    if path.endswith('.jpg'):
        im.save(path, quality=q, subsampling=0)
    else:
        im.save(path)


def axis_angle(axis, ang):
    a = np.asarray(axis, dtype=np.float64)
    a = a / np.linalg.norm(a)
    k = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + np.sin(ang) * k + (1 - np.cos(ang)) * (k @ k)


AXIS = R @ np.array([0.0, 1.0, 0.0])


def spot_of(fx, fy):
    ray = np.array([(2 * fx - 1) * TH * FIT['aspect'], (1 - 2 * fy) * TH, -1.0])
    ray /= np.linalg.norm(ray)
    ok, p = hit(ray)
    return p / np.linalg.norm(p)


def terrain_basis(fx, fy, heading_deg, spin_deg_s=0.0, time=39.5):
    n = spot_of(fx, fy)
    y = np.array([0.0, 1.0, 0.0])
    ref = y - n * (y @ n)
    ref /= np.linalg.norm(ref)
    h = axis_angle(n, np.radians(heading_deg)) @ ref
    r = np.cross(h, n)
    t = axis_angle(AXIS, np.radians(spin_deg_s) * (time - 39.5))
    return t @ r, t @ n, t @ h
