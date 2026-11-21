import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/terrain')
import geo
import tgeo as T


def unwrap(path, fit, nt=4096, nr=700, r0=0.78, r1=1.04):
    im = np.asarray(Image.open(path).convert('RGB').resize((T.W, T.H), Image.LANCZOS)).astype(np.float32) / 255
    lin = geo.scene(im).astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    c = np.array(fit['centre'])
    n = np.array(fit['normal'])
    e1 = np.cross(n, [0.0, 0.0, 1.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(n, e1)
    th = (np.arange(nt) + 0.5) / nt * 2 * np.pi
    rr = r0 + (np.arange(nr) + 0.5) / nr * (r1 - r0)
    p = c + fit['radius'] * rr[:, None, None] * (np.cos(th)[None, :, None] * e1 + np.sin(th)[None, :, None] * e2)
    ux, uy, ok = T.project(p)
    un = cv2.remap(lin, (ux - 0.5).astype(np.float32), (uy - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return un - ndi.median_filter(un, size=(41, 1))


def main():
    fit = json.load(open('assets-src/uranus/terrain/ringfit.json'))
    d = np.load('out/work/u/t/ring-unwrap.npz')
    valid = ndi.binary_erosion(d['valid'], iterations=12)
    a = unwrap('references/approved/uranus-close.jpg', fit)
    b = unwrap(sys.argv[1], fit)
    cols = np.flatnonzero(valid.mean(0) > 0.6)
    ea = np.where(valid, np.maximum(a, 0), 0)[:, cols]
    eb = np.where(valid, np.maximum(b, 0), 0)[:, cols]
    print('line energy film / image, all columns', eb.sum() / ea.sum())
    for k in range(6):
        sl = slice(k * len(cols) // 6, (k + 1) * len(cols) // 6)
        print('  sixth', k, 'ratio', round(float(eb[:, sl].sum() / ea[:, sl].sum()), 3), 'peak image', round(float(np.percentile(ea[:, sl].max(0), 50)), 4), 'film', round(float(np.percentile(eb[:, sl].max(0), 50)), 4))
    def width(e):
        w = []
        for j in range(0, e.shape[1], 16):
            c = e[:, j]
            k = int(np.argmax(c))
            if c[k] < 0.02:
                continue
            w.append(np.sum(c[max(k - 20, 0):k + 21] > c[k] / 2))
        return float(np.median(w)) if w else 0
    print('fwhm rows of the brightest line: image', width(ea), 'film', width(eb), '(one row is 0.42 px at 2816)')


main()
