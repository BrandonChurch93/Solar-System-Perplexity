import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

CX, CY, R = 1460.3, 858.74, 528.64


def load(path, shift):
    im = Image.open(path).convert('RGB')
    if im.size != (2816, 1584):
        im = im.resize((2816, 1584), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    if shift:
        a = geo.undrift(a)
    return a


def band(a, lo, hi):
    return cv2.GaussianBlur(a, (0, 0), lo) - cv2.GaussianBlur(a, (0, 0), hi)


def main():
    hero = load('references/approved/uranus-hero.png', False)
    film = load(sys.argv[1], True)
    yy, xx = np.mgrid[0:1584, 0:2816]
    rr = np.hypot(xx - CX, yy - CY) / R
    np.set_printoptions(precision=3, suppress=True, linewidth=200)
    print('display medians hero | film | scene ratio film/hero, by cell (3 x 3 over the disc)')
    for j in range(3):
        for i in range(3):
            x0 = CX + (i - 1.5) * 0.62 * R
            y0 = CY + (j - 1.5) * 0.62 * R
            sel = (xx >= x0) & (xx < x0 + 0.62 * R) & (yy >= y0) & (yy < y0 + 0.62 * R) & (rr < 0.93)
            if sel.sum() < 1000:
                continue
            h = np.median(hero[sel], 0)
            f = np.median(film[sel], 0)
            print(j, i, h, '|', f, '|', np.median(geo.scene(film[sel]), 0) / np.median(geo.scene(hero[sel]), 0))
    lh = hero @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    lf = film @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    sel = rr < 0.9
    for lo, hi in ((1, 2), (2, 4), (4, 8), (8, 16), (16, 32), (32, 64)):
        bh = band(lh, lo, hi)[sel]
        bf = band(lf, lo, hi)[sel]
        print('band %d..%d px rms hero %.4f film %.4f ratio %.2f corr %.2f' % (lo, hi, bh.std(), bf.std(), bf.std() / bh.std(), np.corrcoef(bh, bf)[0, 1]))
    sat = lambda a: (a.max(-1) - a.min(-1)) / np.maximum(a.max(-1), 1e-3)
    print('saturation median hero %.3f film %.3f' % (np.median(sat(hero)[sel]), np.median(sat(film)[sel])))


main()
