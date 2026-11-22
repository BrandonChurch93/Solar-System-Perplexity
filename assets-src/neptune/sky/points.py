import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
import patch as P
import geo

RISE = 35
DARK = 30
NEAR = 1.08
ROUND = 0.45
OVER = 2.0
RING = (5, 8)
SHARE = 97
BLOB = 2.0
REACH = 5


def main(hero, glow, src, out):
    w, h = P.FULL
    px, py = round(w * P.MARGIN), round(h * P.MARGIN)
    fit = json.load(open(os.path.join(geo.ROOT, 'assets-src/neptune/fit.json')))
    c = fit['circle']
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - c['cx'], yy - c['cy']) / c['r']
    a = P.scene(hero, Image.LANCZOS, True)
    g = P.scene(glow, Image.BICUBIC)
    la = ndi.gaussian_filter(P.luma(a), 10)
    lg = ndi.gaussian_filter(P.luma(g), 10)
    sun = 1 - P.step(np.hypot(xx - P.SUN[0], yy - P.SUN[1]), P.SUN[2] * 0.7, P.SUN[2])
    moon = P.step(np.hypot(xx - P.MOON[0], yy - P.MOON[1]), P.MOON[2] * 1.12, P.MOON[2] * 1.3)
    covered = P.step(lg / np.maximum(la, 1e-5), 0.6, 0.85) * (1 - sun)
    own = ndi.gaussian_filter(P.step(d, 1.03, 1.07) * (1 - covered) * moon * (1 - P.ring_mask()), 3)
    stars = P.compact(a)
    left = P.specks(stars, P.step(d, P.LIMB[0], P.LIMB[1]) * (1 - P.step(d, P.LIMB[2], P.LIMB[3])), P.SPECK)
    left = P.specks(left, P.ring_mask(*P.STRANDS), P.STRAND)
    outside = P.step(d, P.EDGE[0], P.EDGE[1]) * moon
    gone = (stars - left) * (outside * (1 - own))[..., None]
    full = np.asarray(Image.open(src).convert('RGB')).copy()
    inside = full[py:py + h, px:px + w]
    lin = P.unfilm(P.to_linear(inside.astype(np.float32) / 255))
    with_all = P.to_srgb(P.film(lin + gone)) * 255
    rise = (with_all - inside).max(-1)
    level = P.luma(stars)
    peak = (rise == ndi.maximum_filter(rise, 7)) & (rise >= RISE)
    oy, ox = np.mgrid[-RING[1]:RING[1] + 1, -RING[1]:RING[1] + 1]
    ann = (np.hypot(ox, oy) >= RING[0]) & (np.hypot(ox, oy) <= RING[1])
    shown = (P.to_srgb(P.film(P.luma(a))) * 255).astype(np.uint8)
    back = cv2.medianBlur(shown, 25)
    weight = np.zeros((h, w), np.float32)
    dropped = [0, 0, 0]
    kept = []
    for y, x in zip(*np.where(peak)):
        if y < RING[1] + 1 or x < RING[1] + 1 or y >= h - RING[1] - 1 or x >= w - RING[1] - 1:
            continue
        top = level[y - 1:y + 2, x - 1:x + 2].max()
        around = np.percentile(level[y - RING[1]:y + RING[1] + 1, x - RING[1]:x + RING[1] + 1][ann], SHARE)
        if top < OVER * around:
            dropped[0] += 1
            continue
        if back[y, x] > DARK and d[y, x] < NEAR:
            dropped[1] += 1
            continue
        win = level[y - 4:y + 5, x - 4:x + 5]
        m = np.where(win >= 0.5 * top, win, 0)
        gy, gx = np.mgrid[-4:5, -4:5]
        mx, my = (m * gx).sum() / m.sum(), (m * gy).sum() / m.sum()
        cov = np.array([[(m * (gx - mx) ** 2).sum(), (m * (gx - mx) * (gy - my)).sum()], [(m * (gx - mx) * (gy - my)).sum(), (m * (gy - my) ** 2).sum()]]) / m.sum() + np.eye(2) / 12
        ev = np.linalg.eigvalsh(cov)
        if np.sqrt(ev[0] / ev[1]) < ROUND:
            dropped[2] += 1
            continue
        kept.append((x, y, float(rise[y, x]), float(d[y, x]), int(back[y, x]), float(np.sqrt(ev[0] / ev[1]))))
        y0, y1, x0, x1 = y - REACH, y + REACH + 1, x - REACH, x + REACH + 1
        by, bx = np.mgrid[y0:y1, x0:x1]
        weight[y0:y1, x0:x1] = np.maximum(weight[y0:y1, x0:x1], np.exp(-((bx - x) ** 2 + (by - y) ** 2) / (2 * BLOB ** 2)))
    new = (P.to_srgb(P.film(lin + gone * weight[..., None])) * 255 + 0.5).astype(np.uint8)
    touch = (weight > 0.02) & (new != inside).any(-1)
    inside[touch] = np.maximum(new, inside)[touch]
    print('peaks of the cut layer over', RISE, 'levels:', int(peak.sum()), 'kept as single points:', len(kept), 'dropped as part of a line, on a bright ground, as long:', dropped, 'pixels changed:', int(touch.sum()))
    for x, y, r, dd, b, e in sorted(kept, key=lambda k: -k[2]):
        print('  frame x %4d y %4d  rise %3.0f  at %.2f radii  ground %3d  round %.2f' % (x * 1920 / w, y * 1920 / w, r, dd, b, e))
    img = Image.fromarray(full)
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        os.makedirs(f'{out}/{key}', exist_ok=True)
        im.save(f'{out}/{key}/sky-hold.webp', lossless=True, quality=90, method=6)
        print(key, im.size, round(os.path.getsize(f'{out}/{key}/sky-hold.webp') / 1e6, 2), 'MB')


if __name__ == '__main__':
    main(*sys.argv[1:5])
