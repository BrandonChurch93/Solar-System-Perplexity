import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import geo  # noqa: E402
from geo import local_to_lonlat  # noqa: E402

FIT = geo.FIT
T = (2010 + 0.25) / 30
HOLD_MID = 58.5
SPIN = 1.1
WANT_X = (1290 - 1408) / 1408
TAN = np.tan(np.radians(22.5))


def rot(axis, ang):
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K


def spot(x, y):
    pos = np.array(FIT["camera"]["position"], dtype=np.float64)
    t = np.tan(np.radians(FIT["vfovDeg"]) / 2)
    ray = np.array([(2 * x - 1) * t * FIT["aspect"], (1 - 2 * y) * t, -1.0])
    ray /= np.linalg.norm(ray)
    b = pos @ ray
    disc = b * b - (pos @ pos - 1)
    if disc <= 0:
        return None
    s = pos + ray * (-b - np.sqrt(disc))
    return s / np.linalg.norm(s)


def screen(n, heading_deg, time):
    Y = np.array([0.0, 1.0, 0.0])
    ref = Y - (Y @ n) * n
    ref /= np.linalg.norm(ref)
    h = rot(n, np.radians(heading_deg)) @ ref
    r = np.cross(h, n)
    r /= np.linalg.norm(r)
    axis = geo.G @ Y
    turn = rot(axis, np.radians(SPIN) * (time - HOLD_MID))
    s = turn.T @ geo.SUN
    c = np.array([s @ r, s @ n, -(s @ h)])
    return c, (c[0] / -c[2] / (TAN * 16 / 9) if c[2] < 0 else np.nan), (c[1] / -c[2] / TAN if c[2] < 0 else np.nan)


def solve(n, time=T):
    best = None
    for hd in np.arange(0, 360, 0.25):
        c, xs, ys = screen(n, hd, time)
        if np.isnan(xs):
            continue
        e = abs(xs - WANT_X)
        if best is None or e < best[0]:
            best = (e, hd, xs, ys, c)
    return best


if __name__ == "__main__":
    if len(sys.argv) >= 4:
        x, y, hd = map(float, sys.argv[1:4])
        n = spot(x, y)
        lon, lat = local_to_lonlat((n @ geo.G)[None])
        for f in (1920, 2010, 2099):
            c, xs, ys = screen(n, hd, (f + 0.25) / 30)
            print(f, "lon %.1f lat %.1f" % (lon[0], lat[0]), "sun screen %.3f %.3f" % (xs, ys), "elevation %.1f" % np.degrees(np.arcsin(c[1])))
        sys.exit()
    for y in np.arange(0.30, 0.50, 0.02):
        row = []
        for x in np.arange(0.40, 0.60, 0.02):
            n = spot(x, y)
            lon, lat = local_to_lonlat((n @ geo.G)[None])
            e, hd, xs, ys, c = solve(n)
            row.append("%5.0f %4.0f e%4.1f h%5.1f y%4.2f" % (lon[0], lat[0], np.degrees(np.arcsin(c[1])), hd, ys))
        print("y %.2f | " % y + " | ".join(row))


def lifted(x, y, want_y):
    n = spot(x, y)
    e, hd, xs, ys, c = solve(n)
    Y = np.array([0.0, 1.0, 0.0])
    ref = Y - (Y @ n) * n
    ref /= np.linalg.norm(ref)
    h = rot(n, np.radians(hd)) @ ref
    r = np.cross(h, n)
    r /= np.linalg.norm(r)
    cam = np.array([WANT_X * TAN * 16 / 9, want_y * TAN, -1.0])
    cam /= np.linalg.norm(cam)
    local = cam[0] * r + cam[1] * n - cam[2] * h
    turn = rot(geo.G @ Y, np.radians(SPIN) * (T - HOLD_MID))
    out = turn @ local
    return hd, out, np.degrees(np.arccos(np.clip(out @ geo.SUN, -1, 1))), np.degrees(np.arcsin(c[1]))
