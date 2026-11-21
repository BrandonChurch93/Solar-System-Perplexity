import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from geo import *

LINE = 13
ANGLES = 8
PEAK = 0.045
RISE = 0.022
REL = 0.35
GROW = 1
INNER = 1.02
SPAN = 11
NEAR = 1.7


def line(length, k, n):
    a = np.pi * k / n
    se = np.zeros((length, length), np.uint8)
    c = length // 2
    for t in np.linspace(-c, c, 4 * length):
        se[int(round(c - t * np.sin(a))), int(round(c + t * np.cos(a)))] = 1
    return se


def line_open(a, length=LINE):
    out = np.zeros_like(a)
    for k in range(ANGLES):
        se = line(length, k, ANGLES)
        out = np.maximum(out, cv2.morphologyEx(a, cv2.MORPH_OPEN, se))
    return out


def split(img, length=LINE, scale=1.0):
    base = np.stack([line_open(np.ascontiguousarray(img[..., c]), length) for c in range(3)], -1)
    res = luma(img - base)
    level = cv2.GaussianBlur(luma(base), (0, 0), 6 * scale)
    need = RISE + REL * level * 0.2
    seed = res > np.maximum(PEAK, 2 * need)
    grown = ndi.binary_propagation(seed, mask=res > need, structure=np.ones((3, 3)))
    lab, n = ndi.label(grown, structure=np.ones((3, 3)))
    spans = np.array([max(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start) for sl in ndi.find_objects(lab)] + [0])
    near = ndi.minimum(outside(img.shape), lab, np.arange(1, n + 1)) < NEAR
    drop = np.zeros(n + 1, bool)
    drop[1:] = (spans[:n] > SPAN * scale) & near
    grown &= ~drop[lab]
    print('star components', n, 'dropped as strands', int(drop.sum()))
    grown = ndi.binary_dilation(grown, iterations=max(1, round(GROW * scale)))
    soft = np.clip(cv2.GaussianBlur(grown.astype(np.float32), (0, 0), 0.6 * scale) * 1.6, 0, 1)
    fill = cv2.GaussianBlur(base, (0, 0), 0.8 * scale)
    free = img * (1 - soft[..., None]) + np.minimum(img, fill) * soft[..., None]
    return free, soft


def outside(shape):
    h, w = shape[:2]
    s = w / W
    yy, xx = np.mgrid[0:h, 0:w]
    return np.hypot((xx + 0.5) / s - CX, (yy + 0.5) / s - CY) / RPX


if __name__ == '__main__':
    hero = load(HERO)
    free, soft = split(hero)
    d = outside(hero.shape)
    keep = step(d, INNER, INNER + 0.03)
    soft = soft * keep
    free = hero * (1 - keep[..., None]) + free * keep[..., None]
    stars = np.maximum(scene(hero) - scene(free), 0).astype(np.float32)
    np.save(WORK + '/hero-free.npy', free.astype(np.float32))
    np.save(WORK + '/hero-stars.npy', stars.astype(np.float16))
    np.save(WORK + '/hero-starmask.npy', soft.astype(np.float16))
    print('star share outside', float((soft > 0.5)[d > 1.05].mean().round(4)), 'star light', float(luma(stars)[d > 1.9].mean().round(5)))
    for name, box in (('a', (60, 560, 460, 860)), ('b', (2100, 620, 2500, 920)), ('c', (2020, 160, 2420, 460)), ('d', (500, 1100, 900, 1400))):
        x0, y0, x1, y1 = box
        row = np.concatenate([hero[y0:y1, x0:x1], free[y0:y1, x0:x1], code(stars[y0:y1, x0:x1].astype(np.float32))], 1)
        save(cv2.resize(row, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST), WORK + f'/stars-{name}.jpg', 92)
