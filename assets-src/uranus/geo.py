import json
import numpy as np

W, H = 2816, 1584
VFOV = 30.0
CAM = np.array([-0.097815, 0.125613, 5.680177])
TH = np.tan(np.radians(VFOV) / 2)


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


def display(x):
    return to_srgb(film(x))


def rays(w=W, h=H, scale=1.0):
    ys, xs = np.mgrid[0:h, 0:w]
    d = np.stack([(2 * (xs + 0.5) / w - 1) * TH * W / H, (1 - 2 * (ys + 0.5) / h) * TH, -np.ones(xs.shape)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def sphere(d, cam=CAM, radius=1.0):
    b = -(d @ cam)
    disc = b * b - (cam @ cam - radius * radius)
    hit = disc > 0
    p = cam + d * (b - np.sqrt(np.maximum(disc, 0)))[..., None]
    return p, hit, np.sqrt(np.maximum(cam @ cam - b * b, 0))


def project(p, w=W, h=H, cam=CAM):
    v = p - cam
    x = (v[..., 0] / -v[..., 2] / (TH * W / H) + 1) * 0.5 * w - 0.5
    y = (1 - v[..., 1] / -v[..., 2] / TH) * 0.5 * h - 0.5
    return x, y


def quat_matrix(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def matrix_quat(m):
    t = np.trace(m)
    if t > 0:
        s = np.sqrt(t + 1) * 2
        return [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, 0.25 * s]
    i = int(np.argmax(np.diag(m)))
    j, k = (i + 1) % 3, (i + 2) % 3
    s = np.sqrt(1 + m[i, i] - m[j, j] - m[k, k]) * 2
    q = [0.0, 0.0, 0.0, 0.0]
    q[i] = 0.25 * s
    q[j] = (m[j, i] + m[i, j]) / s
    q[k] = (m[k, i] + m[i, k]) / s
    q[3] = (m[k, j] - m[j, k]) / s
    return q


def lonlat(p, rot):
    pb = p @ rot
    return np.arctan2(pb[..., 0], pb[..., 2]), np.arcsin(np.clip(pb[..., 1], -1, 1))


def direction(lon, lat):
    return np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)


def load_fit():
    return json.load(open('assets-src/uranus/fit.json'))
