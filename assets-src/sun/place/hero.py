"""Cut the globe map round the sunspot as a top down gnomonic plate, as a patch level is laid.

usage: python3 assets-src/sun/place/hero.py WIDTH_DEG SIZE OUT.png
"""
import json
import sys
import numpy as np
import cv2

place = json.load(open('src/stops/sun/place.json'))


def frame():
    n = np.array(place['globe']['mapSpot'], dtype=np.float64)
    n /= np.linalg.norm(n)
    e = np.cross([0.0, 1.0, 0.0], n)
    e /= np.linalg.norm(e)
    return n, e, np.cross(n, e)


def cut(width_deg, size, wrap=None):
    if wrap is None:
        wrap = cv2.imread('public/assets/sun/full/wrap-color.jpg')
    h, w = wrap.shape[:2]
    n, e, no = frame()
    half = np.tan(np.radians(width_deg) / 2)
    q = (np.arange(size) + 0.5) / size - 0.5
    gx, gy = np.meshgrid(q * 2 * half, -q * 2 * half)
    d = n + gx[..., None] * e + gy[..., None] * no
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    u = np.arctan2(d[..., 0], d[..., 2]) / (2 * np.pi) + 0.5
    v = np.arcsin(np.clip(d[..., 1], -1, 1)) / np.pi + 0.5
    return cv2.remap(wrap, (u * w - 0.5).astype(np.float32), ((1 - v) * h - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)


if __name__ == '__main__':
    cv2.imwrite(sys.argv[3], cut(float(sys.argv[1]), int(sys.argv[2])))
