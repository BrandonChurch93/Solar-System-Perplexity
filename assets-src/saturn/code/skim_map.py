"""Where each pixel of the skim looks: radius on the ring plane, cosine of the view to the ring normal, phase
angle and the size of a pixel in radii, for the camera of src/stops/saturn/skim.json (the same construction
as plan.ts). With pictures it prints the light of film and approved close by ring and by slice of the frame,
the measurement behind the last knots of sheet.json. Nothing here is shipped.

  python3 skim_map.py                      the table of the patches
  python3 skim_map.py FILM [APPROVED]      scene linear luma by ring and view angle, film beside approved
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

SKIM = json.load(open(os.path.join(geom.STOP, 'skim.json')))


def turn(v, axis, angle):
    return v * np.cos(angle) + np.cross(axis, v) * np.sin(angle) + axis * axis.dot(v) * (1 - np.cos(angle))


def pose(u=0.0, over=None):
    p = dict(SKIM['pose'])
    p.update(over or {})
    path = SKIM['path']
    n = np.array([0.0, 1.0, 0.0])
    sun = geom.SUN_L
    flat = sun - sun.dot(n) * n
    flat /= np.linalg.norm(flat)
    out = np.cross(n, flat)
    out = turn(out / np.linalg.norm(out), n, np.radians(p['azimuthDeg']))
    tilt, roll, yaw = np.radians(p['tiltDeg']), np.radians(p['rollDeg']), np.radians(p['yawDeg'])
    nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
    fp = np.array([0.0, 0.0, -1.0]) + nc * nc[2]
    fp /= np.linalg.norm(fp)
    left = np.cross(nc, fp)
    to_globe = fp * np.cos(yaw) - left * np.sin(yaw)
    inward = -out
    cam = np.stack([nc, to_globe, np.cross(nc, to_globe)], 1)
    world = np.stack([n, inward, np.cross(n, inward)], 1)
    rot = world @ cam.T
    position = out * p['foot'] + n * p['height']
    fwd = rot @ np.array([0.0, 0.0, -1.0])
    fwd = fwd - fwd.dot(n) * n
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, n)
    k = np.log(path['descent'])
    fall = np.exp(-k * u)
    along = u if k == 0 else (1 - fall) / (2 * np.sinh(k / 2))
    position = position + fwd * path['forward'] * along + right * path['side'] * along + n * p['height'] * (fall - 1)
    return position, rot, p['vfov']


def maps(width=1920, height=1080, u=0.0, over=None):
    position, rot, vfov = pose(u, over)
    d = geom.rays(width, height, vfov) @ rot.T
    p, k, ok = geom.ring_hits(position, d)
    r = np.hypot(p[..., 0], p[..., 2])
    tg = geom.globe_hits(position, d)
    gy, gx = np.gradient(r)
    return {
        'r': r, 'on': ok, 'front': ok & (k < tg), 'globe': np.isfinite(tg), 'mu': np.abs(d[..., 1]),
        'phase': np.degrees(np.arccos(np.clip(-(d @ geom.SUN_L), -1, 1))), 'fp': np.hypot(gx, gy), 'range': k,
        'lit': ~geom.in_globe_shadow(p, geom.SUN_L, 1.05), 'point': p, 'camera': position,
    }


RINGS = {'C': (1.30, 1.48), 'B in': (1.56, 1.72), 'B out': (1.76, 1.92), 'gap': (1.96, 2.05), 'A in': (2.08, 2.2), 'A out': (2.2, 2.32)}
MU = [0.03, 0.06, 0.1, 0.16, 0.24, 0.34, 0.46, 0.6, 0.8]


def light(paths):
    m = maps()
    pics = [geom.scene_of(np.asarray(Image.open(f).convert('RGB').resize((1920, 1080), Image.LANCZOS))) for f in paths]
    luma = [s @ np.array([0.2126, 0.7152, 0.0722]) for s in pics]
    good = m['front'] & m['lit'] & ~m['globe']
    for name, (r0, r1) in RINGS.items():
        print('%s, radius %.2f to %.2f: mu, pixels, phase, then per picture luma and red and blue over luma (scene linear, medians)' % (name, r0, r1))
        for a, b in zip(MU[:-1], MU[1:]):
            sel = good & (m['r'] >= r0) & (m['r'] < r1) & (m['mu'] >= a) & (m['mu'] < b)
            if sel.sum() < 300:
                continue
            line = '  mu %.2f to %.2f %7d  phase %5.1f ' % (a, b, int(sel.sum()), np.median(m['phase'][sel]))
            for s, y in zip(pics, luma):
                v = np.median(y[sel])
                line += '   %.3f %.2f %.2f' % (v, np.median(s[..., 0][sel]) / v, np.median(s[..., 2][sel]) / v)
            if len(pics) == 2:
                line += '   film over approved %.2f' % (np.median(luma[0][sel]) / np.median(luma[1][sel]))
            print(line)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        light(sys.argv[1:])
    else:
        m = maps()
        for name, (x, y) in {'A near left': (260, 930), 'A left': (120, 700), 'A far left': (190, 500), 'B near': (1100, 900), 'B mid': (900, 650), 'B far': (640, 470), 'B right': (1620, 900)}.items():
            print('%-12s (%4d, %4d): r %.3f  mu %.3f  phase %5.1f  radii per pixel %.5f  range %.2f  lit %d' % (name, x, y, m['r'][y, x], m['mu'][y, x], m['phase'][y, x], m['fp'][y, x], m['range'][y, x], m['lit'][y, x]))
