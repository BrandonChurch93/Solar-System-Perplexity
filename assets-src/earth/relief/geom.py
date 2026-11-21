import json, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = 'out/work/earth/relief'
FIT = json.load(open(os.path.join(HERE, 'camera-fit.json')))
VFOV = FIT['vfovDeg']
NADIR = np.array(FIT['nadir'])
R = FIT['radius']
CENTRE = NADIR * (R + 1)
HORIZON = FIT['horizonDistance']


def rays(X, Y, W, H):
    f = (H / 2) / np.tan(np.radians(VFOV) / 2)
    d = np.stack([X - W / 2, H / 2 - Y, -np.full(np.shape(X), f)], -1).astype(np.float64)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def ground(d):
    b = d @ CENTRE
    disc = b * b - (CENTRE @ CENTRE - R * R)
    hit = disc > 0
    t = b - np.sqrt(np.maximum(disc, 0))
    return t, hit, disc


def grid(x0, y0, w, h, W, H, step=1):
    xs = x0 + (np.arange(0, w, step) + step / 2)
    ys = y0 + (np.arange(0, h, step) + step / 2)
    X, Y = np.meshgrid(xs, ys)
    return X, Y


def horizon_row(x, W, H):
    f = (H / 2) / np.tan(np.radians(VFOV) / 2)
    lo, hi = np.full(np.shape(x), -H * 0.5), np.full(np.shape(x), H * 1.0)
    for _ in range(40):
        mid = (lo + hi) / 2
        _, hit, _ = ground(rays(x, mid, W, H))
        hi = np.where(hit, mid, hi)
        lo = np.where(hit, lo, mid)
    return (lo + hi) / 2
