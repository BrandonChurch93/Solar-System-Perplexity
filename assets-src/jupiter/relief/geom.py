import json

import numpy as np

FIT = json.load(open('assets-src/jupiter/relief/camera-fit.json'))
W, H = FIT['size']
F = FIT['focalPx']
N = np.array(FIT['nadir'])
R = FIT['radiusUnits']
CENTRE = N * (R + 1)
CANVAS = {'size': [5632, 3168], 'origin': [1408, 792]}


def rays(x, y):
    d = np.stack([x - W / 2, -(y - H / 2), -F * np.ones_like(x, dtype=np.float64)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def ground(origin, d, radius=R):
    oc = origin - CENTRE
    b = d @ oc
    c = oc @ oc - radius * radius
    disc = b * b - c
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.where((disc > 0) & (t > 0), t, np.inf)


def project(p):
    x = W / 2 + F * p[..., 0] / -p[..., 2]
    y = H / 2 - F * p[..., 1] / -p[..., 2]
    return x, y


def frame():
    fwd = np.array([0.0, 0.0, -1.0])
    e1 = fwd - (fwd @ N) * N
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(N, e1)
    return e1, e2


def polar(d):
    e1, e2 = frame()
    theta = np.degrees(np.arccos(np.clip(d @ N, -1, 1)))
    phi = np.degrees(np.arctan2(d @ e2, d @ e1))
    return phi, theta - FIT['horizonAngleDeg']


def unpolar(phi, elev):
    e1, e2 = frame()
    th = np.radians(elev + FIT['horizonAngleDeg'])
    ph = np.radians(phi)
    return np.cos(th)[..., None] * N + np.sin(th)[..., None] * (np.cos(ph)[..., None] * e1 + np.sin(ph)[..., None] * e2)


if __name__ == '__main__':
    for name, (x, y) in {'bottom centre': (1408, 1583), 'bottom left': (0, 1583), 'bottom right': (2815, 1583), 'centre': (1408, 792), 'spot': (980, 620), 'left mid': (0, 792), 'right 1200': (2815, 1200)}.items():
        d = rays(np.array(float(x)), np.array(float(y)))
        t = ground(np.zeros(3), d)
        print(name, 'distance', round(float(t), 2), 'point', np.round(d * t, 2))
