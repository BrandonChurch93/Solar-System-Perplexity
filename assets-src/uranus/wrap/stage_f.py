import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

Image.MAX_IMAGE_PIXELS = None
SRC = 'out/work/u/wrap/'
OUT = 'out/work/u/wrap/'
DST = 'public/assets/uranus/'
W, H = 8192, 4096
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
WINDOW = 31
SEED = (1.3, 1.5)
AREA = 400
GROW = 3
SOFT = 1.2
CLEAR = 8
SIGMA = 1.8
GAIN = (1.0, 0.68, 0.68)
TOP = 3.2


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def median(a, lo, hi):
    q = np.clip(np.log(np.maximum(a, lo) / lo) / np.log(hi / lo) * 255 + 0.5, 0, 255).astype(np.uint8)
    return (lo * np.exp(cv2.medianBlur(q, WINDOW).astype(np.float32) / 255 * np.log(hi / lo))).astype(np.float32)


def main():
    seen = np.load(SRC + 'map-seen.npy', mmap_mode='r')
    ys, xs = np.nonzero(np.asarray(seen[::8, ::8]) > 0.999)
    y0, y1, x0, x1 = ys.min() * 8, (ys.max() + 1) * 8, xs.min() * 8, (xs.max() + 1) * 8
    box = (slice(y0, y1), slice(x0, x1))
    out = np.load(SRC + 'wrap-albedo.npy', mmap_mode='r')[box].astype(np.float32)
    sn = np.asarray(seen[box])
    ndl = np.asarray(np.load(SRC + 'map-ndl.npy', mmap_mode='r')[box])
    pack = np.asarray(Image.open(SRC + 'wrap-cloud.png'))[box][..., 0]
    near = ndi.binary_dilation(pack > 2, iterations=CLEAR)
    base = np.stack([median(out[..., c], 0.1, 1.8) for c in range(3)], -1)
    ratio = out[..., 0] / base[..., 0]
    low = (ratio > SEED[0]) & (sn > 0.999) & ~near
    lab, n = ndi.label(low, structure=np.ones((3, 3)))
    idx = np.arange(1, n + 1)
    keep = (ndi.maximum(ratio, lab, idx) > SEED[1]) & (ndi.sum(low, lab, idx) <= AREA)
    dots = np.isin(lab, idx[keep])
    region = ndi.binary_dilation(dots, iterations=GROW)
    m = np.clip(cv2.GaussianBlur(region.astype(np.float32), (0, 0), SOFT) * 1.6, 0, 1)[..., None]
    shade = cv2.resize(np.load(SRC + 'shade.npy'), (W, H), interpolation=cv2.INTER_LINEAR)[box]
    alb = np.load(SRC + 'map-albedo.npy', mmap_mode='r')[box].astype(np.float32) / shade
    del shade
    grey = (alb @ LUMA)[..., None]
    alb = grey + (alb - grey) * (0.15 + 0.85 * smooth(0.08, 0.3, ndl)[..., None])
    hold = (sn * (0.3 + 0.7 * smooth(-0.02, 0.15, ndl)))[..., None]
    wide = np.stack([median(alb[..., c], 0.05, 20.0) for c in range(3)], -1)
    true = hold * (alb - wide)
    kept = out - base
    free = (out.max(-1) < 1.7) & dots
    print('dots', int(keep.sum()), 'texels', int(dots.sum()), 'unclipped texels', int(free.sum()), 'excess stored against rebuilt, median abs difference per channel', np.median(np.abs(true - kept)[free], 0).round(3).tolist(), 'median excess', np.median(kept[free], 0).round(3).tolist())
    clipped = (out.max(-1) >= 1.79) & dots
    print('clipped texels', int(clipped.sum()), 'rebuilt median', np.median((base + true)[clipped], 0).round(2).tolist(), 'p90', np.percentile((base + true)[clipped], 90, axis=0).round(2).tolist())
    soft = np.stack([cv2.GaussianBlur(true[..., c] * m[..., 0], (0, 0), SIGMA) * GAIN[c] for c in range(3)], -1)
    new = np.clip(out - kept * m + soft, 0.1, TOP)
    full = np.load(SRC + 'wrap-albedo.npy')
    full[box] = new
    np.save(OUT + 'wrap-albedo-f.npy', full)
    del full
    np.save(OUT + 'dots-box.npy', np.array([y0, y1, x0, x1]))
    np.save(OUT + 'dots.npy', dots)
    img = np.asarray(Image.open(SRC + 'wrap-color.png')).copy()
    old = img[box].copy()
    coded = (np.clip(geo.display(new), 0, 1) * 255 + 0.5).astype(np.uint8)
    touched = m[..., 0] > 0.002
    touched = ndi.binary_dilation(touched, iterations=int(np.ceil(3 * SIGMA)))
    img[box] = np.where(touched[..., None], coded, old)
    color = Image.fromarray(img)
    color.save(OUT + 'wrap-color-f.png')
    print('pixels changed', int((img[box] != old).any(-1).sum()), 'of', old.shape[0] * old.shape[1], 'new max', new[touched].max(0).round(2).tolist())
    for name, width in (('full', 8192), ('web', 4096)):
        c = color if width == color.width else color.resize((width, width // 2), Image.LANCZOS)
        c.save(DST + name + '/wrap-color.jpg', quality=95, subsampling=0)
        print(name, 'wrap-color.jpg', round(os.path.getsize(DST + name + '/wrap-color.jpg') / 1e6, 2), 'MB')


main()
