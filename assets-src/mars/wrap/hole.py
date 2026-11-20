import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'tools/assets')
import lightcurve as lc

Image.MAX_IMAGE_PIXELS = None
OUTLINE = [(118, 330), (125, 270), (160, 215), (215, 170), (290, 140), (360, 128), (430, 128), (480, 150), (520, 180), (560, 215), (600, 265), (620, 310), (618, 380), (600, 450), (570, 510), (520, 550), (450, 568), (380, 560), (300, 540), (230, 510), (170, 470), (135, 420), (118, 370)]
OFFSET = (1100, 900)
BOX = (1900, 2150, 2900, 2900)
GROW = 61
SOFT = 14
SIGMA = 36


def mask(w8, h8):
    fit = json.load(open('assets-src/mars/fit.json'))
    w, h = fit['imageSize']
    g = lc.geometry(fit, w, h)
    moon = np.zeros((h, w), np.uint8)
    cv2.fillPoly(moon, [np.array([(x + OFFSET[0], y + OFFSET[1]) for x, y in OUTLINE], np.int32)], 255)
    moon = cv2.dilate(moon, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (GROW, GROW)))
    soft = ndi.gaussian_filter(moon.astype(np.float32) / 255, SOFT)
    x0, y0, x1, y1 = BOX
    lon = ((np.arange(x0, x1) + 0.5) / w8 - 0.5) * 2 * np.pi
    lat = (0.5 - (np.arange(y0, y1) + 0.5) / h8) * np.pi
    lo, la = np.meshgrid(lon, lat)
    b = np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], -1)
    p = b @ lc.rotation(fit).T
    v = p - g['cam']
    mu = -(p * v).sum(-1) / np.linalg.norm(v, axis=-1)
    px = ((v[..., 0] / -v[..., 2] / (g['th'] * w / h) + 1) / 2 * w - 0.5).astype(np.float32)
    py = ((1 - v[..., 1] / -v[..., 2] / g['th']) / 2 * h - 0.5).astype(np.float32)
    m = cv2.remap(soft, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * (mu > 0)
    t = np.clip((m - 0.15) / 0.7, 0, 1)
    yy, xx = np.mgrid[0:y1 - y0, 0:x1 - x0]
    rim = np.clip(np.minimum(np.minimum(xx, x1 - x0 - 1 - xx), np.minimum(yy, y1 - y0 - 1 - yy)) / 50, 0, 1)
    return t * t * (3 - 2 * t) * rim * rim * (3 - 2 * rim)


def main(wrap, take, out_full, out_web, show=None):
    full = Image.open(wrap).convert('RGB')
    m = mask(*full.size)
    if show:
        Image.fromarray((m * 255).astype(np.uint8)).save(show)
        full.crop(BOX).save(show.replace('.png', '-in.png'))
        print('mask share', float(m.mean()), 'edge max', float(max(m[0].max(), m[-1].max(), m[:, 0].max(), m[:, -1].max())))
        return
    old = np.asarray(full.crop(BOX)).astype(np.float32) / 255
    new = np.asarray(Image.open(take).convert('RGB').resize(old.shape[1::-1], Image.LANCZOS)).astype(np.float32) / 255
    blur = lambda a: np.stack([ndi.gaussian_filter(a[..., i], SIGMA) for i in range(3)], -1)
    new = np.clip(new * np.clip((blur(old) + 0.02) / (blur(new) + 0.02), 0.6, 1.6), 0, 1)
    mix = old * (1 - m[..., None]) + new * m[..., None]
    full.paste(Image.fromarray((mix * 255 + 0.5).astype(np.uint8)), BOX[:2])
    full.save(out_full, quality=93, subsampling=0)
    full.resize((full.size[0] // 2, full.size[1] // 2), Image.LANCZOS).save(out_web, quality=93, subsampling=0)


if __name__ == '__main__':
    main(*sys.argv[1:6])
