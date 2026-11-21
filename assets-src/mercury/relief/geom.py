import json

import numpy as np

FIT = json.load(open('assets-src/mercury/relief/camera-fit.json'))
W, H = 2816, 1584
ML, MB = 640, 348
CW, CH = W + 2 * ML, H + MB
F = FIT['focalPx']
UP = np.array(FIT['up'], np.float64)
R = FIT['planetRadius']
FAR = FIT['horizonDistance']


def rays(scale=1.0, x0=-ML, y0=0, w=CW, h=CH):
    n, m = int(round(w * scale)), int(round(h * scale))
    px = (np.arange(n) + 0.5) / scale + x0
    py = (np.arange(m) + 0.5) / scale + y0
    xx, yy = np.meshgrid(px, py)
    d = np.stack([(xx - W / 2) / F, (H / 2 - yy) / F, -np.ones_like(xx)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def ground(d):
    c = -UP * (R + 1)
    b = d @ c
    disc = b * b - (c @ c - R * R)
    hit = (disc > 0) & (b > 0)
    t = np.where(hit, b - np.sqrt(np.maximum(disc, 0)), FAR)
    edge = (b - np.sqrt(c @ c - R * R)) / np.sqrt(c @ c - R * R)
    return t, hit, edge


def horizon_y(scale=1.0, x0=-ML, w=CW, h=CH):
    d = rays(scale, x0, 0, w, h)
    _, hit, _ = ground(d)
    first = np.argmax(hit, axis=0).astype(np.float64)
    return first / scale
