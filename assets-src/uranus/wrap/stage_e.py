import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

Image.MAX_IMAGE_PIXELS = None
OUT = 'out/work/u/wrap/'
DST = 'public/assets/uranus/'
Q0, Q1, QN = 0.94, 1.0, 60
NB = 129
MU_A, MU_B = 0.24, 0.34
Q_HOLD = 0.9993


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    meta = json.load(open(OUT + 'curve.json'))
    rot = np.load(OUT + 'rot.npy')
    sun = np.array(meta['sun'])
    model = np.load(OUT + 'light-lut.npy')
    hero = geo.scene(np.asarray(Image.open('references/approved/uranus-hero.png').convert('RGB')).astype(np.float32) / 255)
    wrap = np.asarray(Image.open(DST + 'full/wrap-color.jpg').convert('RGB'))
    d = geo.rays()
    p, hit, q = geo.sphere(d)
    ndl = p @ sun
    sel = hit & (q >= Q0)
    lon, lat = geo.lonlat(p[sel], rot)
    mx = (lon / (2 * np.pi) + 0.5) * wrap.shape[1] - 0.5
    my = np.clip((0.5 - lat / np.pi) * wrap.shape[0] - 0.5, 0, wrap.shape[0] - 1)
    alb = geo.scene(np.stack([ndi.map_coordinates(wrap[..., c], [my, mx], order=1, mode='grid-wrap') for c in range(3)], -1).astype(np.float32) / 255)
    ratio = hero[sel] / np.maximum(alb, 0.02)
    qi = np.clip(((q[sel] - Q0) / (Q1 - Q0) * QN).astype(int), 0, QN - 1)
    ni = np.clip(((ndl[sel] + 1) * 0.5 * (NB - 1) + 0.5).astype(int), 0, NB - 1)
    cell = qi * NB + ni
    order = np.argsort(cell, kind='stable')
    cell_s, ratio_s = cell[order], ratio[order]
    starts = np.searchsorted(cell_s, np.arange(QN * NB))
    ends = np.searchsorted(cell_s, np.arange(QN * NB), side='right')
    table = np.full((QN, NB, 3), np.nan, np.float32)
    for k in range(QN * NB):
        if ends[k] - starts[k] >= 5:
            table[k // NB, k % NB] = np.median(ratio_s[starts[k]:ends[k]], 0)
    for c in range(3):
        a = table[..., c]
        bad = np.isnan(a)
        idx = ndi.distance_transform_edt(bad, return_distances=False, return_indices=True, sampling=(8, 1))
        table[..., c] = a[tuple(idx)]
    table = np.exp(ndi.gaussian_filter1d(np.log(np.maximum(table, 1e-4)), 2.0, axis=1, mode='nearest'))
    n_l, n_m = model.shape[:2]
    mu = np.linspace(0, 1, n_m)
    qrow = np.minimum(np.sqrt(np.maximum(1 - mu * mu, 0)), Q_HOLD)
    fq = np.clip((qrow - Q0) / (Q1 - Q0) * QN - 0.5, 0, QN - 1)
    fn = np.linspace(0, NB - 1, n_l)
    gq, gn = np.meshgrid(fq.astype(np.float32), fn.astype(np.float32), indexing='ij')
    direct = cv2.remap(table, gn, gq, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).transpose(1, 0, 2)
    w = smooth(MU_A, MU_B, mu)[None, :, None]
    lut = direct * (1 - w) + model * w
    np.save(OUT + 'light-lut-limb.npy', lut)
    rgba = np.concatenate([lut, np.ones(lut.shape[:2] + (1,), np.float32)], -1).transpose(1, 0, 2)
    for name in ('full', 'web'):
        np.ascontiguousarray(rgba.astype('<f4')).tofile(DST + name + '/light.bin')
    np.set_printoptions(precision=3, suppress=True, linewidth=200)
    for nd in (-0.6, -0.2, 0.1, 0.5, 0.9):
        i = int(round((nd * 0.5 + 0.5) * (n_l - 1)))
        print('ndl', nd, ' '.join(str(lut[i, j].round(3)) for j in (0, 6, 12, 16, 18, 20, 24, 32, 44)))
    show = geo.display(np.clip(lut * meta['norm'], 0, 5))
    Image.fromarray((show * 255).astype(np.uint8).transpose(1, 0, 2)[::-1]).resize((1026, 256), Image.BILINEAR).save(OUT + 'light-lut-limb.jpg', quality=92)


main()
