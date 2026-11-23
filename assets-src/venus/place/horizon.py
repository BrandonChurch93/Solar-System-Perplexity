"""Solve the camera of the approved close image from its traced horizon.

A ray to the horizon of a sphere makes the angle 90 deg + dip with the local up.
Unknowns: the local up in camera space (pitch, roll) and the dip. The field of view
is the one the terrain view uses (60 deg vertical); the horizon alone cannot fix it.
Height above the sphere in radii = 1 / cos(dip) - 1.

python3 assets-src/venus/place/horizon.py [vfov_deg]
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

HERE = Path(__file__).resolve().parent
data = json.loads((HERE / 'horizon-points.json').read_text())
w, h = data['size']
pts = np.array(data['points'], dtype=float)
vfov = float(sys.argv[1]) if len(sys.argv) > 1 else 60.0
f = h / 2 / np.tan(np.radians(vfov) / 2)
rays = np.stack([(pts[:, 0] - w / 2) / f, (h / 2 - pts[:, 1]) / f, -np.ones(len(pts))], axis=1)
scale = (rays ** 2).sum(axis=1)
rays /= np.linalg.norm(rays, axis=1, keepdims=True)


def up_of(pitch, roll):
    cp, sp, cr, sr = np.cos(pitch), np.sin(pitch), np.cos(roll), np.sin(roll)
    return np.array([sr * cp, cr * cp, -sp])


def residual(x):
    pitch, roll, dip = x
    ang = np.arccos(np.clip(rays @ up_of(pitch, roll), -1, 1))
    return (ang - (np.pi / 2 + dip)) * f * scale


fit = least_squares(residual, [np.radians(-20), 0.0, np.radians(10)])
pitch, roll, dip = fit.x
r = residual(fit.x)
out = {
    'vfovDeg': vfov,
    'pitchDeg': float(np.degrees(pitch)),
    'rollDeg': float(np.degrees(roll)),
    'dipDeg': float(np.degrees(dip)),
    'height': float(1 / np.cos(dip) - 1),
    'up': up_of(pitch, roll).tolist(),
    'rmsPx': float(np.sqrt((r ** 2).mean())),
    'maxPx': float(np.abs(r).max()),
    'points': len(pts),
    'of': [w, h],
}
print(json.dumps(out, indent=1))
