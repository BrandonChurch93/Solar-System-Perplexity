import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

NN, NB = 64, 64
B0, B1 = 1.0, 1.3
OUT = 'out/work/u/halo/'
DST = 'public/assets/uranus/'
FROM = (1.004, 1.012)
LIMIT = (-0.3, 0.15)
FLOOR = 0.004


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def load(path, shift):
    im = Image.open(path).convert('RGB')
    if im.size != (2816, 1584):
        im = im.resize((2816, 1584), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    if shift:
        a = geo.undrift(a)
    return geo.scene(a)


def table(lin, b, ni):
    out = np.full((NN, NB, 3), np.nan, np.float32)
    jf = np.sqrt(np.clip((b - B0) / (B1 - B0), 0, 1)) * (NB - 1)
    ji = np.rint(jf).astype(int)
    ok = (b > B0 + 0.0012) & (b < B1)
    key = ni * NB + ji
    order = np.argsort(key[ok])
    ks = key[ok][order]
    vals = lin[ok][order]
    edges = np.searchsorted(ks, np.arange(NN * NB + 1))
    for k in range(NN * NB):
        a, z = edges[k], edges[k + 1]
        if z - a > 12:
            out[k // NB, k % NB] = np.median(vals[a:z], 0)
    return out


def step(lut, th, tf):
    r = (th - tf) / np.maximum(lut, FLOOR)
    ok = ~np.isnan(r).any(-1)
    r = np.where(ok[..., None], np.clip(r, -0.6, 0.6), 0)
    for c in range(3):
        r[..., c] = ndi.median_filter(r[..., c], size=(5, 3), mode='nearest')
    w = ndi.gaussian_filter(ok.astype(np.float32), (3.0, 1.5), mode='nearest')
    r = ndi.gaussian_filter(r * ok[..., None], (3.0, 1.5, 0), mode='nearest') / np.maximum(w, 1e-3)[..., None]
    r[w < 0.3] = 0
    r = r.mean(-1, keepdims=True)
    edge = B0 + (B1 - B0) * (np.arange(NB) / (NB - 1)) ** 2
    on = smooth(FROM[0], FROM[1], edge)[None, :, None] * smooth(FLOOR, 3 * FLOOR, lut.max(-1, keepdims=True))
    k = np.clip(r, LIMIT[0], LIMIT[1]) * on
    new = (lut * (1 + k)).astype(np.float32)
    new[:, 1:] = np.minimum.accumulate(new, axis=1)[:, 1:]
    return new, k


def main():
    meta = json.load(open('out/work/u/wrap/curve.json'))
    sun = np.array(meta['sun'])
    hero = load('references/approved/uranus-hero.png', False)
    d = geo.rays()
    b, n = geo.graze(d)
    ndl = n @ sun
    ni = np.clip(((ndl + 1) * 0.5 * (NN - 1) + 0.5).astype(int), 0, NN - 1)
    th = table(hero, b, ni)
    lut = np.load(OUT + 'halo-lut.npy')
    np.set_printoptions(precision=2, suppress=True, linewidth=250)
    js = (6, 8, 10, 12, 16, 22, 30, 40, 51)
    print('px 1080', ' '.join('%5.1f' % ((B1 - B0) * (j / (NB - 1)) ** 2 * 358) for j in js))
    for path in sys.argv[1:]:
        lut, k = step(lut, th, table(load(path, True), b, ni))
        print(path)
        for i in (8, 20, 28, 32, 34, 38, 44, 52, 60):
            print('ndl %+.2f change' % (i / (NN - 1) * 2 - 1), k[i, js, 0])
    np.save(OUT + 'halo-lut-h.npy', lut)
    rgba = np.concatenate([lut, np.ones((NN, NB, 1), np.float32)], -1).transpose(1, 0, 2)
    for name in ('full', 'web'):
        np.ascontiguousarray(rgba.astype('<f4')).tofile(DST + name + '/halo.bin')


main()
