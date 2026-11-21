import sys

import numpy as np
from scipy.spatial.transform import Rotation as Rot

from geom import F, H, N, W, ground, project

VFOV = 64.0
HORIZON, DIP, ROLL = 17.72, 4.44, 17.09


def terrain(u, t):
    tilt = np.radians(HORIZON + DIP)
    axis = np.array([0, np.cos(tilt), np.sin(tilt)])
    axis = Rot.from_rotvec([0, 0, -np.radians(ROLL)]).apply(axis)
    q = Rot.from_rotvec(axis * np.radians(t['yawDeg']) * u) * Rot.from_rotvec([np.radians(t['pitchDeg']) * u, 0, 0])
    return np.array([t['side'] * u, t['rise'] * u, -t['forward'] * u]), q


def entry(u, g, t):
    p, q = terrain(u, t)
    yaw = np.radians(t.get('entryYawDeg', 0))
    turn = Rot.from_euler('YXZ', [yaw * g, -np.radians(t['entryPitchDeg']) * g, np.radians(t.get('entryRollDeg', 0)) * g])
    return p + np.array([0.5 * t['entryBack'] * yaw * g * g, t['entryHeight'] * g, t['entryBack'] * g]), q * turn


def leave(u, g, t):
    p, q = terrain(u, t)
    return p + np.array([0, t['exitHeight'] * g, -t['exitForward'] * g]), q * Rot.from_rotvec([np.radians(t['exitPitchDeg']) * g, 0, 0])


def footprint(p, q):
    th = np.tan(np.radians(VFOV) / 2)
    a = np.linspace(-1, 1, 65)
    gx, gy = np.meshgrid(a * th * 16 / 9, a * th)
    d = np.stack([gx, gy, -np.ones_like(gx)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    d = q.apply(d.reshape(-1, 3))
    t = ground(p, d)
    ok = np.isfinite(t)
    hit = p + d[ok] * t[ok, None]
    front = hit[:, 2] < -0.05
    x, y = project(hit[front])
    return x.min(), x.max(), y.min(), y.max(), 1 - front.mean()


def report(t):
    rows = []
    for u in np.linspace(-0.5, 0.5, 11):
        rows.append(('terrain u %+.2f' % u,) + footprint(*terrain(u, t)))
    for g in (0.1, 0.2, 0.3, 0.4, 0.5, 0.66):
        rows.append(('entry g %.2f' % g,) + footprint(*entry(-0.5, g, t)))
    for g in (0.1, 0.2, 0.33, 0.45, 0.61):
        rows.append(('exit g %.2f' % g,) + footprint(*leave(0.5, g, t)))
    for r in rows:
        print('%-16s x %7.0f .. %7.0f  y %7.0f .. %7.0f  behind %.2f' % r)
    return rows


if __name__ == '__main__':
    L = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
    t = {'forward': 0.926 * L, 'rise': 0.3 * L, 'side': 0.111 * L, 'yawDeg': 2, 'pitchDeg': 1, 'entryHeight': 0.8, 'entryBack': 0.6, 'entryPitchDeg': 6, 'exitHeight': 1.6, 'exitForward': 0.8, 'exitPitchDeg': 9}
    report(t)
