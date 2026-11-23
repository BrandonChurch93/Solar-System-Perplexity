import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'terrain'))
import cgeo  # noqa: E402

W, H = cgeo.W, cgeo.H
R = cgeo.RADIUS
C = cgeo.CENTRE
UP = -cgeo.NADIR
FWD = np.array([0.0, 0.0, -1.0])
AHEAD = FWD - (FWD @ UP) * UP
AHEAD /= np.linalg.norm(AHEAD)
RIGHT = np.cross(AHEAD, UP)


def image_rays(xs, ys):
    d = np.stack([(2 * (xs + 0.5) / W - 1) * cgeo.TX, (1 - 2 * (ys + 0.5) / H) * cgeo.TY, -np.ones(np.shape(xs))], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def ground(xs, ys):
    d = image_rays(np.asarray(xs, float), np.asarray(ys, float))
    ok, t = cgeo.hit(d)
    p = d * t[..., None]
    n = (p - C) / R
    return n, ok


def to_image(n):
    p = C + R * n
    seen = (p * (p - C)).sum(-1) < 0
    x = p[..., 0] / -p[..., 2] / cgeo.TX
    y = p[..., 1] / -p[..., 2] / cgeo.TY
    return (x + 1) / 2 * W - 0.5, (1 - y) / 2 * H - 0.5, seen & (p[..., 2] < 0)


def local(n):
    return n @ RIGHT, n @ AHEAD, n @ UP


def plate_dirs(centre, east, north, width_deg, size):
    half = np.tan(np.radians(width_deg) / 2)
    u = (2 * (np.arange(size) + 0.5) / size - 1) * half
    uu, vv = np.meshgrid(u, -u)
    d = centre[None, None, :] + uu[..., None] * east[None, None, :] + vv[..., None] * north[None, None, :]
    return d / np.linalg.norm(d, axis=-1, keepdims=True)
