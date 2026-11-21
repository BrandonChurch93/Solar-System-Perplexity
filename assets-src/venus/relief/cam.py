import json
import numpy as np

W = 'out/work/venus/relief/'
MX, MB = 352, 792
AW, AH = 2816, 1584
CW, CH = AW + 2 * MX, AH + MB
VFOV = 60.0
PITCH = -21.48
ROLL = -1.03
ALT = 0.0184
R = 1 / ALT
F = (AH / 2) / np.tan(np.radians(VFOV / 2))
HORIZON = float(np.sqrt((R + 1) ** 2 - R ** 2))
DIP = float(np.degrees(np.arccos(R / (R + 1))))


def rays(xs, ys):
    x = (xs - (MX + AW / 2)) / F
    y = ((AH / 2) - ys) / F
    d = np.stack([x, y, -np.ones_like(x)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def up():
    p, r = np.radians(PITCH), np.radians(ROLL)
    u = np.array([0.0, np.cos(p), -np.sin(p)])
    c, s = np.cos(r), np.sin(r)
    return np.array([c * u[0] - s * u[1], s * u[0] + c * u[1], u[2]])


def sphere(d):
    u = up()
    centre = -u * (R + 1)
    b = d @ centre
    disc = b * b - (centre @ centre - R * R)
    hit = (disc > 0) & (b > 0)
    t = np.where(hit, b - np.sqrt(np.maximum(disc, 0)), np.inf)
    return t, hit


def elevation(d):
    return np.degrees(np.arcsin(np.clip(d @ up(), -1, 1))) + DIP


if __name__ == '__main__':
    print(json.dumps({'focal': F, 'radius': R, 'horizon': HORIZON, 'dip': DIP, 'up': up().round(5).tolist()}))
