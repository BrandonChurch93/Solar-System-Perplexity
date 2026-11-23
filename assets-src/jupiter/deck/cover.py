import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

CFG = geom.DECK
FL = CFG['flight']
FPS = 30
SHUTTER = 0.5


def run(u):
    gain = FL['endUnitsPerSecond'] - FL['startUnitsPerSecond']
    return FL['seconds'] * (FL['startUnitsPerSecond'] * u + gain * max(u, 0) ** (FL['power'] + 1) / (FL['power'] + 1))


def pose(seconds):
    up0 = -geom.NADIR
    ahead = geom.EY - up0 * (geom.EY @ up0)
    ahead /= np.linalg.norm(ahead)
    right = np.cross(ahead, up0)
    along = run(seconds / FL['seconds'] + 0.5) - run(0.5)
    behind = max(-along, 0) / run(0.5)
    back = behind ** FL['sinkPower']
    up = up0 * (geom.R + 1) + ahead * along + right * FL.get('startRight', 0) * back
    up /= np.linalg.norm(up)
    pos = geom.CENTRE + up * (geom.R + 1 + FL['startAbove'] * back)
    v = np.cross(up0, up)
    s, c = np.linalg.norm(v), up0 @ up
    k = v / max(s, 1e-12)
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    rot = np.eye(3) + s * K + (1 - c) * K @ K
    return pos, rot, along, back


def share(seconds, n=240):
    pos, rot, along, back = pose(seconds)
    w, h = 1920, 1080
    f = geom.F * w / geom.W0
    xs = (np.arange(n) + 0.5) / n * w
    ys = (np.arange(n * h // w) + 0.5) / (n * h // w) * h
    X, Y = np.meshgrid(xs, ys)
    d = np.stack([X - w / 2, -(Y - h / 2), -f * np.ones_like(X)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    d = d @ rot.T
    oc = pos - geom.CENTRE
    b = d @ oc
    disc = b * b - (oc @ oc - geom.R ** 2)
    t = -b - np.sqrt(np.maximum(disc, 0))
    ground = (disc > 0) & (t > 0)
    p = pos + d * t[..., None]
    px, py = geom.project(p)
    edge = np.minimum(np.minimum(px, geom.W - 1 - px), np.minimum(py, geom.H - 1 - py))
    f0, f1 = CFG['view']['fade']
    wgt = np.clip((edge - f0) / (f1 - f0), 0, 1)
    wgt = np.where((p[..., 2] < 0) & ground, wgt, 0)
    out = ground & (wgt < 0.999)
    rows = np.nonzero(out.any(1))[0]
    cols = np.nonzero(out.any(0))[0]
    return along, back, float(out.sum() / max(ground.sum(), 1)), (float(ys[rows[0]]) if len(rows) else None), (float(xs[cols[0]]), float(xs[cols[-1]])) if len(cols) else None


if __name__ == '__main__':
    for a in sys.argv[1:]:
        if a.startswith('--') and '=' in a:
            key, val = a[2:].split('=')
            FL[key] = float(val)
    frames = [int(a) for a in sys.argv[1:] if not a.startswith('--')] or [3060, 3075, 3090, 3105, 3120, 3135, 3150, 3195, 3239]
    for fr in frames:
        seconds = (fr - 3060) / FPS + SHUTTER / (2 * FPS) - FL['seconds'] / 2 - SHUTTER / (2 * FPS)
        along, back, part, top, span = share(seconds)
        print('frame', fr, 'ahead', round(along, 3), 'above', round(FL['startAbove'] * back, 3), 'right', round(FL.get('startRight', 0) * back, 3), 'share of the ground outside the image field', round(part, 4), 'from row', top, 'columns', span)
