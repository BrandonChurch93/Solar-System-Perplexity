import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
FIT = json.loads((ROOT / 'src/stops/earth/fit.json').read_text())
RELIEF = json.loads((ROOT / 'src/stops/earth/relief.json').read_text())
PLACE = json.loads((ROOT / 'src/stops/earth/place.json').read_text())
W, H = RELIEF['imageSize']
TH = np.tan(np.radians(RELIEF['vfovDeg']) / 2)
ASPECT = W / H
R = RELIEF['radius']
BOX = RELIEF['ground']['box']


def unit(v):
    v = np.asarray(v, dtype=np.float64)
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def quat_to_mat(q):
    x, y, z, w = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


def rot(axis, ang):
    a = unit(axis)
    K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K


def direction(lon, lat):
    lon, lat = np.radians(lon), np.radians(lat)
    return np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])


def lonlat(d):
    return float(np.degrees(np.arctan2(d[0], d[2]))), float(np.degrees(np.arcsin(d[1])))


G = quat_to_mat(FIT['globe']['quaternion'])
Y = np.array([0.0, 1.0, 0.0])


def stop_spot(x, y):
    pos = np.array(FIT['camera']['position'], dtype=np.float64)
    t = np.tan(np.radians(FIT['vfovDeg']) / 2)
    ray = unit([(2 * x - 1) * t * FIT['aspect'], (1 - 2 * y) * t, -1.0])
    b = pos @ ray
    k = -b - np.sqrt(b * b - (pos @ pos - 1))
    return unit(pos + ray * k)


SPOT = stop_spot(*PLACE['spotScreen'])
REF = unit(Y - (Y @ SPOT) * SPOT)
HEADING = rot(SPOT, np.radians(PLACE['headingDeg'])) @ REF
RIGHT = unit(np.cross(HEADING, SPOT))
TERRAIN_FRAME = np.stack([RIGHT, SPOT, -HEADING], 1)
NADIR = unit(RELIEF['nadir'])
UP = -NADIR
AHEAD = unit(np.array([0.0, 0.0, -1.0]) + UP[2] * UP)
BL = np.stack([np.cross(AHEAD, UP), UP, -AHEAD], 1)
TO_STOP = TERRAIN_FRAME @ BL.T
TO_BODY = G.T @ TO_STOP
CENTRE = NADIR * (R + 1)


def local_to_body(p):
    return (np.asarray(p) - CENTRE) @ TO_BODY.T / R


def body_to_local(d):
    return CENTRE + R * (np.asarray(d) @ TO_BODY)


def project(p):
    z = -p[..., 2]
    ok = z > 1e-6
    zz = np.where(ok, z, 1.0)
    x = (p[..., 0] / zz / (TH * ASPECT) + 1) * W / 2
    y = (1 - p[..., 1] / zz / TH) * H / 2
    return x, y, ok


def ray(x, y):
    return unit(np.stack([(2 * np.asarray(x, dtype=np.float64) / W - 1) * TH * ASPECT, (1 - 2 * np.asarray(y, dtype=np.float64) / H) * TH, -np.ones_like(np.asarray(x, dtype=np.float64))], -1))


def sea(d):
    b = d @ CENTRE
    tangent2 = CENTRE @ CENTRE - R * R
    disc = b * b - tangent2
    hit = (disc > 0) & (b > 0)
    t = b - np.sqrt(np.where(hit, disc, 0))
    return d * t[..., None], hit


def frame_at(c):
    c = unit(c)
    e = unit(np.cross(Y, c))
    return c, e, np.cross(c, e)


def plate_dirs(c, width_deg, size):
    n, e, u = frame_at(c)
    half = np.tan(np.radians(width_deg) / 2)
    g = ((np.arange(size) + 0.5) / size - 0.5) * 2 * half
    gx, gy = np.meshgrid(g, -g)
    return unit(n + gx[..., None] * e + gy[..., None] * u)


def plate_xy(c, width_deg, d):
    n, e, u = frame_at(c)
    half = np.tan(np.radians(width_deg) / 2)
    k = d @ n
    return (d @ e) / k / (2 * half) + 0.5, 0.5 - (d @ u) / k / (2 * half)


def image_of(d):
    p = body_to_local(d)
    seen = ((p - CENTRE) * (-p)).sum(-1) > 0
    x, y, ok = project(p)
    return x, y, seen & ok
