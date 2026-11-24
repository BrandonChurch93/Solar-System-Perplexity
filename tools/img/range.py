#!/usr/bin/env python3
"""The range picture of a capture frame (diag=range of the capture page) and its pose record (tools/smooth/pose.ts) as points of the body,
and the place of those points in another frame. Pure functions of arrays and records; nothing is read from a file but in read()."""
import numpy as np

TOP = 16777214


def ranges(rgb, record):
    """The range of every pixel along its ray from the lens, in the units of the layer that drew it; nan where no surface was drawn."""
    c = rgb.astype(np.int64)
    n = c[..., 0] * 65536 + c[..., 1] * 256 + c[..., 2]
    r = record['range']
    return np.where(n > 0, 2.0 ** (r['low'] + (n - 1) / TOP * r['octaves']), np.nan)


def turned(q, v):
    u = np.array(q[:3], dtype=np.float64)
    t = 2 * np.cross(u, v)
    return v + q[3] * t + np.cross(u, t)


def back(q):
    return [-q[0], -q[1], -q[2], q[3]]


def rays(record, shape):
    """The ray of every pixel's middle in the frame of the record's camera pose, of length 1. shape may be smaller than the picture."""
    h, w = shape
    c = record['camera']
    k = h / 2 / np.tan(np.radians(c['vfov']) / 2)
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float64), np.arange(h, dtype=np.float64))
    v = np.stack([(xs + 0.5 - w / 2) / k, (h / 2 - ys - 0.5) / k, -np.ones((h, w))], axis=-1)
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    return turned(c['q'], v)


def shaped(record, x):
    """A point of the pose frame in the body's own frame with its scale taken out: there the body is the unit sphere."""
    b = record['bodies'][0]
    return turned(back(b['axes']), x - np.array(b['place'], dtype=np.float64)) / np.array(b['scale'], dtype=np.float64)


def points(d, record):
    """The point of the body each pixel shows, in the pose frame, and the unit its range was taken in (an index into range.units).
    A layer hands its range in its own units; of the units the record names, the one is taken that puts the point nearest the body's
    surface."""
    ray = rays(record, d.shape)
    p = np.array(record['camera']['p'], dtype=np.float64)
    best, which, off = None, None, None
    for i, unit in enumerate(record['range']['units']):
        x = p + ray * (d * unit)[..., None]
        miss = np.abs(np.linalg.norm(shaped(record, x), axis=-1) - 1)
        if best is None:
            best, which, off = x, np.zeros(d.shape, dtype=np.int64), miss
        else:
            nearer = miss < off
            best = np.where(nearer[..., None], x, best)
            which = np.where(nearer, i, which)
            off = np.where(nearer, miss, off)
    which = np.where(np.isfinite(d), which, -1)
    return best, which


def carried(x, here, there, shape=None):
    """Where the points x of the body in the frame of the record here stand in the picture of the record there (pixel places x, y, the
    pixel's middle at whole numbers) and their range there in pose units; the body's turn between the two times is taken with them."""
    a, b = here['bodies'][0], there['bodies'][0]
    g = turned(back(a['turn']), x - np.array(a['place'], dtype=np.float64))
    y = turned(b['turn'], g) + np.array(b['place'], dtype=np.float64)
    c = there['camera']
    h, w = shape if shape else (c['height'], c['width'])
    k = h / 2 / np.tan(np.radians(c['vfov']) / 2)
    r = turned(back(c['q']), y - np.array(c['p'], dtype=np.float64))
    with np.errstate(all='ignore'):
        px = r[..., 0] / -r[..., 2] * k + w / 2 - 0.5
        py = h / 2 - 0.5 - r[..., 1] / -r[..., 2] * k
    front = r[..., 2] < 0
    return np.where(front, px, np.nan), np.where(front, py, np.nan), np.linalg.norm(r, axis=-1)


def sky(here, there, shape):
    """Where the sky of each pixel of the record here stands in the picture of the record there: the camera's rotation alone."""
    h, w = shape
    k = h / 2 / np.tan(np.radians(here['camera']['vfov']) / 2)
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float64), np.arange(h, dtype=np.float64))
    v = np.stack([(xs + 0.5 - w / 2) / k, (h / 2 - ys - 0.5) / k, -np.ones((h, w))], axis=-1)
    r = turned(back(there['sky']['q']), turned(here['sky']['q'], v))
    k2 = h / 2 / np.tan(np.radians(there['camera']['vfov']) / 2)
    with np.errstate(all='ignore'):
        px = r[..., 0] / -r[..., 2] * k2 + w / 2 - 0.5
        py = h / 2 - 0.5 - r[..., 1] / -r[..., 2] * k2
    front = r[..., 2] < 0
    return np.where(front, px, np.nan), np.where(front, py, np.nan)


def read(path):
    import cv2
    return cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1]
