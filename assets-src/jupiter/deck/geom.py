import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FIT = json.load(open(os.path.join(HERE, '..', 'relief', 'camera-fit.json')))
W, H = FIT['size']
F = FIT['focalPx']
NADIR = np.array(FIT['nadir'])
R = FIT['radiusUnits']
CENTRE = NADIR * (R + 1)
STORM_PX = (1132.0, 552.0)


def rays(x, y):
    x = np.asarray(x, dtype=np.float64)
    y = np.asarray(y, dtype=np.float64)
    d = np.stack([x - W / 2, -(y - H / 2), -F * np.ones_like(x)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def hit(d, origin=np.zeros(3), radius=R):
    oc = origin - CENTRE
    b = d @ oc
    c = oc @ oc - radius * radius
    disc = b * b - c
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.where((disc > 0) & (t > 0), t, np.inf)


def chart():
    d = rays(*STORM_PX)
    s = d * hit(d)
    en = (s - CENTRE) / np.linalg.norm(s - CENTRE)
    ey = d - en * (d @ en)
    ey /= np.linalg.norm(ey)
    ex = np.cross(ey, en)
    return s, ex, ey, en


S, EX, EY, EN = chart()


def to_chart(p):
    q = p - S
    return q @ EX, q @ EY


def from_chart(gx, gy, h=0.0):
    gx = np.asarray(gx, dtype=np.float64)
    gy = np.asarray(gy, dtype=np.float64)
    c = S - CENTRE
    flat = c + gx[..., None] * EX + gy[..., None] * EY
    lift = np.sqrt(np.maximum((R + h) ** 2 - (flat @ EX) ** 2 - (flat @ EY) ** 2, 0)) - flat @ EN
    return CENTRE + flat + lift[..., None] * EN


def project(p):
    x = W / 2 + F * p[..., 0] / -p[..., 2]
    y = H / 2 - F * p[..., 1] / -p[..., 2]
    return x, y


if __name__ == '__main__':
    cam = np.zeros(3)
    print('storm point', np.round(S, 4), 'distance', round(float(np.linalg.norm(S)), 4))
    print('ex', np.round(EX, 5), 'ey', np.round(EY, 5), 'en', np.round(EN, 5))
    print('camera in chart', [round(float(v), 4) for v in to_chart(cam)], 'height', round(float(np.linalg.norm(cam - CENTRE) - R), 5))
    print('up at camera', np.round(-NADIR, 5))
    for name, (x, y) in {'bottom centre': (1408, 1583), 'bottom left': (0, 1583), 'bottom right': (2815, 1583), 'centre': (1408, 792), 'left mid': (0, 792), 'right 1200': (2815, 1200)}.items():
        d = rays(x, y)
        t = hit(d)
        print(name, 'distance', round(float(t), 2), 'chart', [round(float(v), 2) for v in to_chart(d * t)])
