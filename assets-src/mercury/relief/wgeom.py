import json
import sys

import numpy as np

sys.path.insert(0, 'assets-src/mercury/relief')
import geom

CAM = json.load(open('assets-src/mercury/relief/wide-camera.json'))
W, H = CAM['size']
F = CAM['focalPx']
U = geom.UP / np.linalg.norm(geom.UP)
A = np.array([0.0, 0.0, -1.0]) + U * U[2]
A /= np.linalg.norm(A)
S = np.cross(A, U)
P = A * CAM['back'] * -1 + U * (CAM['height'] - 1)
CX, CY = CAM['centre']
pitch = np.radians(CAM['pitchDeg'])
ROT = np.array([[1, 0, 0], [0, np.cos(pitch), np.sin(pitch)], [0, -np.sin(pitch), np.cos(pitch)]])
CENTRE = -U * (geom.R + 1)


def rays(scale=1.0, y0=0, y1=None):
    n, m = int(round(W * scale)), int(round(H * scale))
    px = (np.arange(n) + 0.5) / scale
    py = (np.arange(y0, m if y1 is None else y1) + 0.5) / scale
    xx, yy = np.meshgrid(px, py)
    d = np.stack([(xx - CX) / F, (CY - yy) / F, -np.ones_like(xx)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    return d @ ROT.T


def sphere(o, d, radius=geom.R):
    c = CENTRE - o
    b = d @ c
    disc = b * b - (c @ c - radius * radius)
    hit = (disc > 0) & (b > 0)
    return np.where(hit, b - np.sqrt(np.maximum(disc, 0)), np.inf), hit


def project(x):
    v = (x - P) @ ROT
    z = -v[..., 2]
    return CX + F * v[..., 0] / z, CY - F * v[..., 1] / z, z


