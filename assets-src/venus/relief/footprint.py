import json
import sys
import numpy as np

sys.path.insert(0, 'assets-src/venus/relief')
from cam import *


def rot(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def main():
    poses = json.load(open(W + 'poses.json'))
    u = up()
    centre = -u * (R + 1)
    n = 61
    gx, gy = np.meshgrid(np.linspace(-1, 1, n), np.linspace(-1, 1, n))
    for f, p in poses.items():
        th = np.tan(np.radians(p['vfov'] / 2))
        d = np.stack([gx * th * 16 / 9, -gy * th, -np.ones_like(gx)], -1)
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        d = d @ rot(p['quaternion']).T
        o = np.array(p['position'])
        oc = o - centre
        b = -(d @ oc)
        disc = b * b - (oc @ oc - R * R)
        hit = (disc > 0) & (b > 0)
        t = b - np.sqrt(np.maximum(disc, 0))
        pts = o + d * t[..., None]
        ok = hit & (pts[..., 2] < -0.05)
        x = pts[..., 0] / -pts[..., 2] * F + AW / 2
        y = AH / 2 - pts[..., 1] / -pts[..., 2] * F
        behind = hit & ~ok
        beyond = hit & ((pts - centre) @ u / R < R / (R + 1) - 1e-4)
        xs, ys = x[ok], y[ok]
        h = float(oc @ u) - (R)
        outside = ok & ((x < -MX) | (x > AW + MX) | (y > AH + MB))
        print(f, p['kind'], 'height', round(1 + float(o @ u), 3), 'x', int(xs.min()), int(xs.max()), 'y', int(ys.min()), int(ys.max()), 'outside canvas share', round(float(outside.mean()), 3), 'beyond old horizon share', round(float(beyond.mean()), 3), 'behind camera share', round(float(behind.mean()), 3))


if __name__ == "__main__":
    main()
