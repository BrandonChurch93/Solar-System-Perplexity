#!/usr/bin/env python3
"""The range picture of a capture frame (diag=range of the capture page) and its pose record (tools/smooth/pose.ts) as points of its bodies,
and the place of those points in another frame. Pure functions of arrays and records; nothing is read from a file but in read()."""
import numpy as np

TOP = 16777214
HOLD = 1e-3


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


def form(body):
    """The drawn shape of a body at its frame as a matrix of the pose frame, None where the record names none: a point g of the turned body
    stands at place + shape g."""
    return np.array(body['shape'], dtype=np.float64).reshape(3, 3) if body.get('shape') else None


def plain(body, x):
    """A point of the pose frame about the body's place with its drawn shape taken out."""
    s = form(body)
    v = x - np.array(body['place'], dtype=np.float64)
    return v if s is None else v @ np.linalg.inv(s).T


def shaped(record, x):
    """A point of the pose frame in the body's own frame with its scale taken out: there the body is the unit sphere."""
    b = record['bodies'][0]
    return turned(back(b['axes']), plain(b, x)) / np.array(b['scale'], dtype=np.float64)


def beyond(body, x):
    """How far the points x stand outside what a further body of the record holds: its ball, the reach about its place, or, where it
    names a sheet, the ring of that thickness about the plane through its place, from the inner radius to the reach. 0 inside."""
    v = x - np.array(body['place'], dtype=np.float64)
    sheet = body.get('sheet')
    with np.errstate(invalid='ignore'):
        if not sheet:
            return np.maximum(np.linalg.norm(v, axis=-1) - body['reach'], 0)
        n = np.array(sheet['normal'], dtype=np.float64)
        n = n / np.linalg.norm(n)
        up = v @ n
        out = np.linalg.norm(v - up[..., None] * n, axis=-1)
        return np.hypot(np.maximum(np.abs(up) - sheet['thick'], 0), np.maximum(np.maximum(sheet['inner'] - out, out - body['reach']), 0))


def owner(x, record):
    """The body of the record each point belongs to, an index into bodies: the first of the further bodies that holds the point
    (beyond, to HOLD of its reach, so that a surface drawn at the reach itself is held), the first body where none does."""
    which = np.zeros(x.shape[:-1], dtype=np.int64)
    for i in range(len(record['bodies']) - 1, 0, -1):
        b = record['bodies'][i]
        which = np.where(beyond(b, x) <= HOLD * b['reach'], i, which)
    return which


def off(record, x):
    """How far a point stands from the nearest surface the record names: the first body's, or what a further body holds."""
    miss = np.abs(np.linalg.norm(shaped(record, x), axis=-1) - 1)
    for b in record['bodies'][1:]:
        miss = np.minimum(miss, np.maximum(beyond(b, x) - HOLD * b['reach'], 0))
    return miss


def points(d, record):
    """The point each pixel shows, in the pose frame, and the unit its range was taken in (an index into range.units).
    A layer hands its range in its own units; of the units the record names, the one is taken that puts the point nearest a surface
    of the record (off), the earlier unit where two stand alike."""
    ray = rays(record, d.shape)
    p = np.array(record['camera']['p'], dtype=np.float64)
    best, which, least = None, None, None
    for i, unit in enumerate(record['range']['units']):
        x = p + ray * (d * unit)[..., None]
        miss = off(record, x)
        if best is None:
            best, which, least = x, np.zeros(d.shape, dtype=np.int64), miss
        else:
            nearer = miss < least
            best = np.where(nearer[..., None], x, best)
            which = np.where(nearer, i, which)
            least = np.where(nearer, miss, least)
    which = np.where(np.isfinite(d), which, -1)
    return best, which


def moved(x, a, b):
    """The points x of one body from its place, turn and drawn shape of the frame a to those of the frame b; by its place alone where
    one of the two names no turn."""
    still = 'turn' not in a or 'turn' not in b
    g = plain(a, x) if still else turned(b['turn'], turned(back(a['turn']), plain(a, x)))
    s = form(b)
    return (g if s is None else g @ s.T) + np.array(b['place'], dtype=np.float64)


def carried(x, here, there, shape=None):
    """Where the points x of the frame of the record here stand in the picture of the record there (pixel places x, y, the pixel's
    middle at whole numbers) and their range there in pose units. Each point goes with the body it belongs to (owner): by that body's
    place and turn at the two times, and by its drawn shape at each of the two where the record names one."""
    y = moved(x, here['bodies'][0], there['bodies'][0])
    if len(here['bodies']) > 1:
        which = owner(x, here)
        for i in range(1, min(len(here['bodies']), len(there['bodies']))):
            if here['bodies'][i]['id'] == there['bodies'][i]['id']:
                y = np.where((which == i)[..., None], moved(x, here['bodies'][i], there['bodies'][i]), y)
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
