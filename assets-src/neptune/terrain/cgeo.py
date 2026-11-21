import json
import numpy as np

CLOSE = 'references/approved/neptune-close.jpg'
FIT = json.load(open('src/stops/neptune/close.json'))
W, H = 2816, 1584
TY = float(np.tan(np.radians(FIT['vfovDeg']) / 2))
TX = TY * W / H
WIDE = 1.75
LEFT, RIGHT = -WIDE * TX, WIDE * TX
TOP, BOTTOM = TY, TY - 2 * WIDE * TY
RADIUS = FIT['radius']
NADIR = np.array(FIT['nadir'])
CENTRE = NADIR * (RADIUS + 1)


def canvas_rays(w, h):
    x = LEFT + (np.arange(w) + 0.5) / w * (RIGHT - LEFT)
    y = TOP + (np.arange(h) + 0.5) / h * (BOTTOM - TOP)
    xx, yy = np.meshgrid(x, y)
    d = np.stack([xx, yy, -np.ones_like(xx)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def approved_box(w, h):
    x0 = (-TX - LEFT) / (RIGHT - LEFT) * w
    x1 = (TX - LEFT) / (RIGHT - LEFT) * w
    y1 = (TOP + TY) / (TOP - BOTTOM) * h
    return x0, 0.0, x1, y1


def hit(d, radius=None):
    r = RADIUS if radius is None else radius
    b = d @ CENTRE
    disc = b * b - (CENTRE @ CENTRE - r * r)
    ok = (disc > 0) & (b > 0)
    t = b - np.sqrt(np.maximum(disc, 0))
    return ok, t


def tangent(d):
    b = d @ CENTRE
    return np.sqrt(np.maximum(CENTRE @ CENTRE - b * b, 0)) / RADIUS


def project(p, w, h):
    x = p[..., 0] / -p[..., 2]
    y = p[..., 1] / -p[..., 2]
    return (x - LEFT) / (RIGHT - LEFT) * w, (TOP - y) / (TOP - BOTTOM) * h
