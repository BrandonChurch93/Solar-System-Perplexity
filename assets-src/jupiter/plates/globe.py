import json
import os
import re
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))
import geom
from layback import ROOT

STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
FULL = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')
PATCHES = json.load(open(os.path.join(STOP, 'patches.json')))
JET = np.array(json.load(open(os.path.join(STOP, 'flow.json')))['jet'])
FIT = json.load(open(os.path.join(STOP, 'fit.json')))
LOOK = open(os.path.join(STOP, 'look.ts')).read()
CFG = json.load(open(os.path.join(STOP, 'deck.json')))


def look_number(name):
    return float(re.search(name + r':\s*(-?[0-9.]+)', LOOK).group(1))


SPOT = dict(lon=look_number('spot = { lon'), lat=look_number('lat'), axes=[float(v) for v in re.search(r'axesDeg: \[([0-9., ]+)\]', LOOK).group(1).split(',')], core=look_number('core'), reach=look_number('reach'))
FLOW = dict(band=look_number('bandDegPerSecond'), swirl=look_number('swirlDegPerSecond'), settle=look_number('settle'))


def direction(lon, lat):
    lon = np.radians(lon)
    lat = np.radians(lat)
    return np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)


def lonlat(d):
    return np.degrees(np.arctan2(d[..., 0], d[..., 2])), np.degrees(np.arcsin(np.clip(d[..., 1], -1, 1)))


def frame(n):
    n = n / np.linalg.norm(n)
    e = np.cross([0.0, 1.0, 0.0], n)
    e /= np.linalg.norm(e)
    return n, e, np.cross(n, e)


def spin_y(d, a):
    c, s = np.cos(a), np.sin(a)
    return np.stack([c * d[..., 0] - s * d[..., 2], d[..., 1], s * d[..., 0] + c * d[..., 2]], -1)


def quat_matrix(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


FITQ = quat_matrix(FIT['globe']['quaternion'])
SUN = np.array(FIT['sunDir']) / np.linalg.norm(FIT['sunDir'])


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def settle(x, limit):
    return x / np.sqrt(1 + (x / limit) ** 2)


def flowed(d, local):
    flow_t = np.radians(FLOW['band']) * local
    swirl_t = np.radians(FLOW['swirl']) * local
    n, e, u = frame(direction(SPOT['lon'], SPOT['lat']))
    ax = np.sin(np.radians(SPOT['axes']))
    p = np.stack([d @ e, d @ u], -1)
    front = (d @ n >= 0).astype(np.float64)
    r = np.linalg.norm(p / ax, axis=-1)
    inside = front * (1 - smoothstep(SPOT['reach'] * 0.75, SPOT['reach'] * 1.4, r))
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    jet = np.interp(np.clip(lat / np.pi + 0.5, 0, 1) * (len(JET) - 1), np.arange(len(JET)), JET) * (1 - inside)
    o = spin_y(d, jet * flow_t)
    q = np.stack([o @ e, o @ u], -1) / ax
    r = np.linalg.norm(q, axis=-1)
    turn = (1 - smoothstep(SPOT['core'], SPOT['reach'], r)) * (0.55 + 0.45 * smoothstep(0, SPOT['core'], r))
    a = turn * swirl_t
    c, s = np.cos(a), np.sin(a)
    q2 = np.stack([c * q[..., 0] - s * q[..., 1], s * q[..., 0] + c * q[..., 1]], -1) * ax
    o2 = n * np.sqrt(np.maximum(1 - np.sum(q2 * q2, -1), 0))[..., None] + e * q2[..., :1] + u * q2[..., 1:]
    o2 /= np.linalg.norm(o2, axis=-1, keepdims=True)
    return np.where((inside > 0)[..., None], o2, o)


_cache = {}


def image(name):
    if name not in _cache:
        _cache[name] = cv2.imread(os.path.join(FULL, name), cv2.IMREAD_COLOR)[:, :, ::-1].astype(np.float32) / 255
    return _cache[name]


def sample(img, x, y):
    return cv2.remap(img, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def albedo(d, local=0.0, levels=None):
    df = flowed(d, local) if local != 0.0 else d
    wrap = image('wrap-color.jpg')
    h, w = wrap.shape[:2]
    lon, lat = lonlat(df)
    out = sample(wrap, (lon / 360 + 0.5) * w - 0.5, (0.5 - lat / 180) * h - 0.5)
    n, e, u = frame(direction(PATCHES['centre']['lon'], PATCHES['centre']['lat']))
    dn = df @ n
    g = np.stack([df @ e, df @ u], -1) / np.maximum(dn, 0.05)[..., None]
    front = (dn >= 0.3).astype(np.float32)
    for level in PATCHES['levels'] if levels is None else [l for l in PATCHES['levels'] if l['id'] in levels]:
        img = image(level['file'])
        size = img.shape[0]
        q = g / (2 * np.tan(np.radians(level['widthDeg']) / 2))
        wgt = front * smoothstep(0.5, 0.5 - PATCHES['feather'], np.max(np.abs(q), -1)).astype(np.float32)
        col = sample(img, (q[..., 0] + 0.5) * size - 0.5, (0.5 - q[..., 1]) * size - 0.5)
        out = out * (1 - wgt[..., None]) + col * wgt[..., None]
    return out


if __name__ == '__main__':
    lon0, lat0 = float(sys.argv[1]), float(sys.argv[2])
    span, px = float(sys.argv[3]), int(sys.argv[4])
    local = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
    n, e, u = frame(direction(lon0, lat0))
    k = np.radians((np.arange(px) + 0.5) / px * span - span / 2)
    gx, gy = np.meshgrid(k, -k)
    d = n + gx[..., None] * e + gy[..., None] * u
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    out = albedo(d, local)
    cv2.imwrite(sys.argv[6] if len(sys.argv) > 6 else 'globe.png', (out[:, :, ::-1] * 255).round().astype(np.uint8))
