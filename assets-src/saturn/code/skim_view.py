"""Overlay of the rigid world on the approved close image, to choose the skim camera by eye and by number.

The camera is given in ring terms: foot radius, height above the plane, yaw of the globe to the right of the
view axis, tilt down, roll, and field of view. The overlay draws the globe's outline and the ring edges of the
rigid world (the radii of the hero fit) over the approved close image. Nothing here is shipped.

  python3 skim_view.py OUT.jpg foot height yawDeg tiltDeg rollDeg vfovDeg [scale]
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

RADII = {'c': 1.2458, 'b': 1.5, 'bout': 1.94, 'aout_gap': 2.063, 'outer': 2.3394, 'f': 2.42}


def camera(foot, height, yaw_deg, tilt_deg, roll_deg):
    tilt = np.radians(tilt_deg)
    roll = np.radians(roll_deg)
    yaw = np.radians(yaw_deg)
    nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
    fwd = np.array([0.0, 0.0, -1.0])
    fp = fwd - fwd.dot(nc) * nc
    fp /= np.linalg.norm(fp)
    left = np.cross(nc, fp)
    centre = -height * nc + foot * (np.cos(yaw) * fp - np.sin(yaw) * left)
    return nc, fp, left, centre


def describe(centre, tilt_deg, roll_deg):
    tilt = np.radians(tilt_deg)
    roll = np.radians(roll_deg)
    nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
    c = np.array(centre)
    h = -c.dot(nc)
    flat = c + h * nc
    fwd = np.array([0.0, 0.0, -1.0])
    fp = fwd - fwd.dot(nc) * nc
    fp /= np.linalg.norm(fp)
    left = np.cross(nc, fp)
    return np.linalg.norm(flat), h, np.degrees(np.arctan2(-flat.dot(left), flat.dot(fp)))


def overlay(out, foot, height, yaw, tilt, roll, vfov, scale=1.0, width=1408, image=geom.CLOSE):
    nc, fp, left, centre = camera(foot, height, yaw, tilt, roll)
    base = Image.open(image).convert('RGB')
    height_px = round(width * base.size[1] / base.size[0])
    base = base.resize((width, height_px), Image.LANCZOS)
    d = geom.rays(width, height_px, vfov)
    # plane
    k = (centre.dot(nc)) / np.where(np.abs(d @ nc) > 1e-9, d @ nc, 1e-9)
    p = d * k[..., None] - centre
    r = np.sqrt((p @ fp) ** 2 + (p @ left) ** 2) / scale
    on = k > 0
    # globe (oblate about nc)
    def to_local(v):
        return np.stack([v @ fp, v @ nc, v @ left], -1)
    o = to_local(-centre[None, None, :])[0, 0]
    dl = to_local(d)
    s = np.array([1.0, 1.0 / geom.POLAR, 1.0])
    oc = o * s
    dc = dl * s
    a = (dc * dc).sum(-1)
    b = (dc * oc).sum(-1)
    q = b * b - a * ((oc * oc).sum() - 1)
    tg = np.where(q > 0, (-b - np.sqrt(np.maximum(q, 0))) / a, np.inf)
    globe = np.isfinite(tg) & (tg > 0)
    img = np.asarray(base).astype(np.float64)
    tint = img.copy()
    front = on & (k < tg)
    gap = front & (r > RADII['bout']) & (r < RADII['aout_gap'])
    tint[gap] = tint[gap] * 0.5 + np.array([255, 0, 0]) * 0.5
    cring = front & (r > RADII['c']) & (r < RADII['b'])
    tint[cring] = tint[cring] * 0.7 + np.array([0, 120, 255]) * 0.3
    beyond = front & (r > RADII['outer'])
    tint[beyond] = tint[beyond] * 0.6 + np.array([255, 0, 255]) * 0.4
    inside = front & (r < RADII['c'])
    tint[inside] = tint[inside] * 0.75 + np.array([255, 255, 0]) * 0.25
    edge = np.zeros_like(globe)
    edge[1:, :] |= globe[1:, :] != globe[:-1, :]
    edge[:, 1:] |= globe[:, 1:] != globe[:, :-1]
    tint[edge] = [0, 255, 0]
    for name, rad in RADII.items():
        ring = front & (np.abs(r - rad) < 0.004 * np.maximum(k, 0.3))
        tint[ring] = [0, 255, 255]
    Image.fromarray(np.clip(tint, 0, 255).astype(np.uint8)).save(out, quality=88)


if __name__ == '__main__':
    import json
    close = json.load(open(os.path.join(geom.STOP, 'close.json')))
    if len(sys.argv) < 3:
        print('frozen close fit: foot %.4f height %.4f yaw %.2f' % describe(close['centre'], close['tiltDeg'], close['rollDeg']))
        sys.exit(0)
    args = [float(v) for v in sys.argv[2:]]
    overlay(sys.argv[1], *args)
