import json
import os

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FIT = json.load(open(os.path.join(ROOT, 'src/stops/neptune/fit.json')))
HERO_W, HERO_H = 2816, 1584
CAM = np.array(FIT['camera']['position'], float)
SUN = np.array(FIT['sunDir'], float)
SUN /= np.linalg.norm(SUN)
TH = np.tan(np.radians(FIT['vfovDeg']) / 2)
AXIS = np.array([0.29036982, 0.66913061, -0.68406842])
AXIS /= np.linalg.norm(AXIS)


def body_basis():
    y = AXIS
    c = CAM / np.linalg.norm(CAM)
    z = c - (c @ y) * y
    z /= np.linalg.norm(z)
    x = np.cross(y, z)
    return np.stack([x, y, z], 1)


def quat_from_matrix(m):
    t = np.trace(m)
    if t > 0:
        s = np.sqrt(t + 1) * 2
        return [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, 0.25 * s]
    i = int(np.argmax(np.diag(m)))
    j, k = (i + 1) % 3, (i + 2) % 3
    s = np.sqrt(1 + m[i, i] - m[j, j] - m[k, k]) * 2
    q = [0, 0, 0, 0]
    q[i] = 0.25 * s
    q[j] = (m[j, i] + m[i, j]) / s
    q[k] = (m[k, i] + m[i, k]) / s
    q[3] = (m[k, j] - m[j, k]) / s
    return q


def rotation():
    x, y, z, w = FIT['globe']['quaternion']
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((np.maximum(c, 0) + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def filmic(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def decode(img8):
    return inverse_filmic(srgb_to_linear(np.asarray(img8, np.float32) / 255))


def encode(scene):
    return (linear_to_srgb(filmic(scene)) * 255 + 0.5).astype(np.uint8)


def hero_rays(w, h, xs=None, ys=None):
    if xs is None:
        ys, xs = np.mgrid[0:h, 0:w]
    d = np.stack([(2 * (xs + 0.5) / w - 1) * TH * HERO_W / HERO_H, (1 - 2 * (ys + 0.5) / h) * TH, -np.ones(np.shape(xs))], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def hit_sphere(d, radius=1.0):
    b = -(d @ CAM)
    disc = b * b - (CAM @ CAM - radius * radius)
    p = CAM + d * (b - np.sqrt(np.maximum(disc, 0)))[..., None]
    return p, disc > 0


def world_to_lonlat(p):
    pb = p @ rotation()
    n = np.linalg.norm(pb, axis=-1)
    return np.arctan2(pb[..., 0], pb[..., 2]), np.arcsin(np.clip(pb[..., 1] / n, -1, 1))


def lonlat_to_world(lon, lat):
    pb = np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)
    return pb @ rotation().T


def world_to_hero(p, w=HERO_W, h=HERO_H):
    v = p - CAM
    x = v[..., 0] / -v[..., 2] / (TH * HERO_W / HERO_H)
    y = v[..., 1] / -v[..., 2] / TH
    return (x + 1) / 2 * w - 0.5, (1 - y) / 2 * h - 0.5


if __name__ == '__main__':
    q = quat_from_matrix(body_basis())
    print(json.dumps([round(float(v), 7) for v in q]))
