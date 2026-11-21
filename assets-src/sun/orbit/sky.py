import json
import os
import sys
import cv2
import numpy as np
from PIL import Image
from geo import W, H, CX, CY, RPX, ROOT, WORK, film, to_srgb
from infinity import card_scene

MARGIN = 0.125
VEIL = ROOT + '/assets-src/sun/orbit/veil.json'
KEEP = 0.3
CROSS = 0.5
SOFT = 40


def save(lin, name, out):
    px, py = round(W * MARGIN), round(H * MARGIN)
    low = cv2.GaussianBlur(lin, (0, 0), SOFT)
    fine = np.pad(lin - low, ((py, py), (px, px), (0, 0)), mode='wrap')
    base = np.pad(low, ((py, py), (px, px), (0, 0)), mode='edge')
    calm = cv2.GaussianBlur(base, (0, 0), SOFT * 2.5)
    yy, xx = np.mgrid[0:base.shape[0], 0:base.shape[1]]
    past = np.maximum(np.maximum(px - xx, xx - (px + W - 1)) / (px * CROSS), np.maximum(py - yy, yy - (py + H - 1)) / (py * CROSS))
    t = np.clip(past, 0, 1)
    t = (t * t * (3 - 2 * t))[..., None]
    wide = np.maximum(base * (1 - t) + calm * t + fine, 0)
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
