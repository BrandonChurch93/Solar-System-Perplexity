import json
import os
import sys
import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d
from geo import W, H, CX, CY, RPX, ROOT, WORK, film, to_srgb, scene, load, luma
from infinity import card_scene, split

MARGIN = 0.3
VEIL = ROOT + '/assets-src/sun/orbit/veil.json'
KEEP = 0.3
CROSS = 0.25
SOFT = 40
EDGE = WORK + '/edge-%s.png'
REACH = 160
BAND = 32
WIDE = 300
ALONG = 80
NEAR = 30
FLOOR = (0.4, 1.8)
GAIN = (0.4, 2.5)
LIFT = (0.4, 2.5)
SMOOTH = 1.5
MOTTLE = 6
SEAM = 48
RIM = (6, 8, 40, 1.3)


def rowgain(inner, outer, along, limits):
    return np.clip(gaussian_filter1d(inner, along, axis=0) / np.maximum(gaussian_filter1d(outer, along, axis=0), 1e-6), limits[0], limits[1])


def lifted(lin):
    out = lin.copy()
    top = np.quantile(luma(lin), 0.995)
    level = lambda cols: float(np.minimum(luma(lin[:, cols]), top).mean())
    gains = {}
    for side in ('left', 'right'):
        at = (lambda i: i) if side == 'left' else (lambda i: W - 1 - i)
        ref = level(slice(RIM[1], RIM[2]) if side == 'left' else slice(W - RIM[2], W - RIM[1]))
        gains[side] = [float(np.clip(ref / level(slice(at(i), at(i) + 1)), 1, RIM[3])) for i in range(RIM[0])]
        for i, g in enumerate(gains[side]):
            out[:, at(i)] *= g
    print('rim gain of the outermost columns', {k: np.round(v, 3).tolist() for k, v in gains.items()})
    return out


def sides(lin):
    px = round(W * MARGIN)
    fall = np.exp(-np.arange(px) / REACH)
    hero_low, hero_stars = split(lin)
    haze = lambda v: cv2.GaussianBlur(luma(v), (0, 0), SOFT)
    hero_haze = haze(hero_low)
    fine = hero_stars + hero_low - cv2.GaussianBlur(hero_low, (0, 0), MOTTLE)
    parts = {}
    for side in ('left', 'right'):
        e = scene(load(EDGE % side)).astype(np.float32)
        assert e.shape[:2] == (H, px), e.shape
        low = cv2.GaussianBlur(split(e)[0], (0, 0), SMOOTH)
        if side == 'right':
            a, b, na, nb, d, far = slice(W - WIDE, W), slice(0, WIDE), slice(W - BAND, W), slice(0, BAND), fall, slice(0, px)
        else:
            a, b, na, nb, d, far = slice(0, WIDE), slice(px - WIDE, px), slice(0, BAND), slice(px - BAND, px), fall[::-1], slice(W - px, W)
        floor = rowgain(hero_low[:, a].mean(1), low[:, b].mean(1), ALONG, FLOOR)
        low = low * floor[:, None, :]
        join = rowgain(hero_low[:, na].mean(1), low[:, nb].mean(1), NEAR, GAIN)
        low = low * join[:, None, :] ** d[None, :, None]
        lift = np.clip(haze(low) / np.maximum(hero_haze[:, far], 1e-5), LIFT[0], LIFT[1])
        print(side, 'floor gain', np.quantile(floor, [0.05, 0.5, 0.95], axis=0).round(2).tolist(), 'join gain', np.quantile(join, [0.05, 0.5, 0.95], axis=0).round(2).tolist(), 'star lift', np.quantile(lift, [0.05, 0.5, 0.95]).round(2).tolist())
        part = np.maximum(low + fine[:, far] * lift[..., None], 0)
        wa, wb = (slice(W - SEAM, W), slice(0, SEAM)) if side == 'right' else (slice(0, SEAM), slice(px - SEAM, px))
        top = np.quantile(luma(lin[:, wa]), 0.995)
        calm = lambda v: np.minimum(v, top).mean(1)
        seam = rowgain(calm(lin[:, wa]), calm(part[:, wb]), NEAR, (0.6, 1.6))
        print(side, 'seam gain', np.quantile(seam, [0.05, 0.5, 0.95], axis=0).round(2).tolist())
        parts[side] = part * seam[:, None, :] ** d[None, :, None]
    return np.concatenate([parts['left'], lin, parts['right']], 1).astype(np.float32)


def save(lin, name, out):
    px, py = round(W * MARGIN), round(H * MARGIN)
    lin = lifted(lin)
    across = sides(lin)
    low = cv2.GaussianBlur(across, (0, 0), SOFT)
    fine = across - low
    fine = np.concatenate([fine[:py], fine, fine[H - py:]], 0)
    base = np.pad(low, ((py, py), (0, 0), (0, 0)), mode='edge')
    calm = cv2.GaussianBlur(base, (0, 0), SOFT * 2.5)
    yy = np.arange(base.shape[0])[:, None]
    t = np.clip(np.maximum(py - yy, yy - (py + H - 1)) / (py * CROSS), 0, 1)
    t = (t * t * (3 - 2 * t))[..., None]
    wide = np.maximum(base * (1 - t) + calm * t + fine, 0)
    wide[py:py + H] = across
    wide[py:py + H, px:px + W] = lin
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/{name}', lossless=True, quality=90, method=6)


if __name__ == '__main__':
    lin = card_scene()
    if os.path.exists(VEIL):
        veil = json.load(open(VEIL))
        yy, xx = np.mgrid[0:H, 0:W]
        d = np.hypot(xx + 0.5 - CX, yy + 0.5 - CY) / RPX
        take = np.stack([np.interp(d, veil['radius'], np.array(veil['veil'])[:, c]) for c in range(3)], -1)
        lin = np.maximum(lin - take, lin * KEEP).astype(np.float32)
    save(lin, 'sky-hold.webp', sys.argv[1])
    Image.fromarray((to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8)).save(WORK + '/sky-preview.jpg', quality=90)
