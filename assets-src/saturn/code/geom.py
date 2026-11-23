"""Shared geometry for the code built Saturn: the fitted hero camera, the ring frame and the film's tone curve.

All lengths are in planet radii. The ring frame has y along the ring normal; the body frame is the frame of
src/stops/saturn/fit.json, where the hero camera sits at camera.position and looks down minus z.
"""
import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
STOP = os.path.join(ROOT, 'src', 'stops', 'saturn')
FIT = json.load(open(os.path.join(STOP, 'fit.json')))
HERO = os.path.join(ROOT, 'references', 'approved', 'saturn-hero.png')
CLOSE = os.path.join(ROOT, 'references', 'approved', 'saturn-close.jpg')


def quat_matrix(q):
    x, y, z, w = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


TILT = quat_matrix(FIT['globe']['quaternion'])  # ring frame to body frame
POLAR = FIT['globe']['scale'][1]
CAM = np.array(FIT['camera']['position'])
SUN = np.array(FIT['sunDir']) / np.linalg.norm(FIT['sunDir'])
NORMAL = TILT[:, 1]
CAM_L = TILT.T @ CAM
SUN_L = TILT.T @ SUN


def srgb_decode(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def srgb_encode(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def filmic(x):
    x = np.maximum(x, 0)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def scene_of(pixels8):
    """Approved pixels (0 to 255, sRGB) to scene linear values, as the film's chain develops them."""
    return inverse_filmic(srgb_decode(np.asarray(pixels8, dtype=np.float64) / 255))


def display_of(scene):
    return srgb_encode(filmic(scene))


def rays(width, height, vfov_deg, quat=None):
    """Unit ray directions of a camera in its parent frame, one per pixel centre."""
    t = np.tan(np.radians(vfov_deg) / 2)
    x = (np.arange(width) + 0.5) / width
    y = (np.arange(height) + 0.5) / height
    gx, gy = np.meshgrid(x, y)
    d = np.stack([(2 * gx - 1) * t * width / height, (1 - 2 * gy) * t, -np.ones_like(gx)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    if quat is not None:
        d = d @ quat_matrix(quat).T
    return d


def ring_hits(cam_l, dir_l):
    """Where rays meet the ring plane (y = 0 in the ring frame). Returns the point, the range and a mask."""
    k = -cam_l[1] / np.where(np.abs(dir_l[..., 1]) > 1e-9, dir_l[..., 1], 1e-9)
    p = cam_l + dir_l * k[..., None]
    return p, k, k > 0


def globe_hits(cam_l, dir_l, grow=1.0):
    """Range to the oblate globe along each ray, inf where it is missed."""
    s = np.array([1 / grow, 1 / (POLAR * grow), 1 / grow])
    c = cam_l * s
    d = dir_l * s
    a = (d * d).sum(-1)
    b = (d * c).sum(-1)
    q = b * b - a * ((c * c).sum() - 1)
    t = (-b - np.sqrt(np.maximum(q, 0))) / a
    return np.where((q > 0) & (t > 0), t, np.inf)


def in_globe_shadow(p_l, sun_l, grow=1.0):
    s = np.array([1 / grow, 1 / (POLAR * grow), 1 / grow])
    c = p_l * s
    d = sun_l * s
    a = (d * d).sum()
    b = (c * d).sum(-1)
    q = b * b - a * ((c * c).sum(-1) - 1)
    return (q > 0) & (-b > 0)
