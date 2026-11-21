import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/halo/'
DST = 'public/assets/uranus/'
NN, NB = 64, 64
B0, B1 = 1.0, 1.3


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = json.load(open('out/work/u/wrap/curve.json'))
    sun = np.array(meta['sun'])
    im = np.asarray(Image.open('references/approved/uranus-hero.png').convert('RGB')).astype(np.float32) / 255
    lin = geo.scene(im)
    d = geo.rays()
    b, n = geo.graze(d)
    ndl = n @ sun
    ni = np.clip(((ndl + 1) * 0.5 * (NN - 1) + 0.5).astype(int), 0, NN - 1)
    lut = np.zeros((NN, NB, 3), np.float32)
    back = np.zeros((NN, 3), np.float32)
    for i in range(NN):
        row = ni == i
        far = row & (b > 1.3) & (b < 1.4)
        back[i] = np.percentile(lin[far], 30, 0) if far.sum() > 50 else 0
    back = ndi.gaussian_filter1d(back, 2, axis=0, mode='nearest')
    for j in range(NB):
        lo = B0 + (B1 - B0) * (max(j - 0.5, 0) / (NB - 1)) ** 2
        hi = B0 + (B1 - B0) * ((j + 0.5) / (NB - 1)) ** 2
        mid = 0.5 * (lo + hi)
        lo, hi = max(min(lo, mid - 0.0006), B0 + 0.0008), max(hi, mid + 0.0006, B0 + 0.002)
        ring = (b >= lo) & (b < hi)
        for i in range(NN):
            cell = ring & (ni == i)
            if cell.sum() > 12:
                lut[i, j] = np.percentile(lin[cell], 50 if mid < 1.04 and i > 0.6 * NN else 35, 0) - back[i]
            else:
                lut[i, j] = np.nan
    for c in range(3):
        a = lut[..., c]
        bad = np.isnan(a)
        idx = ndi.distance_transform_edt(bad, return_distances=False, return_indices=True)
        lut[..., c] = a[tuple(idx)]
    lut = np.maximum(lut, 0)
    hold = int(np.ceil(np.sqrt(0.0055 / (B1 - B0)) * (NB - 1)))
    night = np.clip((0.2 - (np.arange(NN) / (NN - 1) * 2 - 1)) / 0.2, 0, 1)[:, None, None]
    lut[:, :hold] = lut[:, :hold] * (1 - night) + lut[:, hold:hold + 1] * night
    lut[:, 1:] = np.minimum.accumulate(lut, axis=1)[:, 1:]
    lut = ndi.gaussian_filter(lut, (1.5, 0.6, 0), mode='nearest')
    np.save(OUT + 'halo-lut.npy', lut)
    rgba = np.concatenate([lut, np.ones((NN, NB, 1), np.float32)], -1).transpose(1, 0, 2)
    for name in ('full', 'web'):
        np.ascontiguousarray(rgba.astype('<f4')).tofile(DST + name + '/halo.bin')
    for i in [4, 16, 24, 32, 40, 48, 60]:
        print('ndl', round(i / (NN - 1) * 2 - 1, 2), ' '.join('%.4f %s' % (B0 + (B1 - B0) * (j / (NB - 1)) ** 2, lut[i, j].round(3)) for j in (0, 4, 8, 12, 16, 26, 36, 51)))
    show = geo.display(lut * 3)
    Image.fromarray((show * 255).astype(np.uint8)).resize((512, 512), Image.NEAREST).save(OUT + 'halo-lut.png')


main()
