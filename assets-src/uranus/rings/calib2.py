import json
import os
import struct
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/sky')
import geo
import patch

HERO = 'references/approved/uranus-hero.png'
WORK = 'out/work/u/sky/'
DST = 'assets-src/uranus/rings/gain.json'
NT, NR, R0, R1 = 72, 38, 1.08, 1.84
BIAS = 0.0004
N0 = patch.N0 / np.linalg.norm(patch.N0)


def basis(n):
    n = n / np.linalg.norm(n)
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return n, e1, np.cross(n, e1)


def rings(path):
    raw = open(path, 'rb').read()
    f = np.frombuffer(raw, '<f4')
    out, i = [], 1
    for _ in range(int(f[0])):
        n, closed, th0, dth, m = f[i:i + 3], f[i + 3], f[i + 4], f[i + 5], int(f[i + 6])
        i += 7
        r, a = f[i:i + m], f[i + m:i + 2 * m]
        i += 2 * m
        out.append((n.astype(float), closed, th0, dth, r.astype(float), a.astype(float)))
    return out


def main(with_rings, without):
    dx, dy, _ = patch.drift(HERO, without)
    g = patch.scene(without, Image.BICUBIC, False, (-dx, -dy))
    z = np.load(WORK + 'along.npz')
    hero = ndi.maximum_filter(z['line'], 5)
    film = patch.scene(with_rings, Image.BICUBIC, False, (-dx, -dy)) - g
    _, lf, _ = patch.along(film.astype(np.float32))
    film = ndi.maximum_filter(lf, 5)
    _, e1, e2 = basis(N0)
    sh = np.zeros((NT, NR))
    sf = np.zeros((NT, NR))
    cx, cy, cr = patch.CIRCLE
    for n, closed, th0, dth, r, a in rings('public/assets/uranus/full/rings.bin'):
        _, u1, u2 = basis(n)
        th = th0 + np.arange(len(r)) * dth
        p = r[:, None] * (np.cos(th)[:, None] * u1 + np.sin(th)[:, None] * u2)
        x, y = geo.project(p)
        v = p - geo.CAM
        dist = np.linalg.norm(v, axis=1)
        dd = v / dist[:, None]
        b = -(dd @ geo.CAM)
        near = np.hypot(x - cx, y - cy) / cr
        ok = (near > 1.04) & (x > 4) & (x < geo.W - 5) & (y > 4) & (y < geo.H - 5) & (a > 0)
        for mx, my, mr in patch.MOONS:
            ok &= np.hypot(x - mx, y - my) > mr + 8
        q = geo.CAM + dd * (-(geo.CAM @ N0) / (dd @ N0))[:, None]
        ti = (np.mod(np.arctan2(q @ e2, q @ e1), 2 * np.pi) / (2 * np.pi) * NT).astype(int) % NT
        ri = ((np.linalg.norm(q, axis=1) - R0) / (R1 - R0) * NR).astype(int)
        ok &= (ri >= 0) & (ri < NR)
        xi, yi = np.rint(x[ok]).astype(int), np.rint(y[ok]).astype(int)
        np.add.at(sh, (ti[ok], ri[ok]), np.maximum(hero[yi, xi] - BIAS, 0))
        np.add.at(sf, (ti[ok], ri[ok]), film[yi, xi])
    have = sf > 1e-4
    ratio = np.where(have, (sh + 0.002) / (sf + 0.002), np.nan)
    print('cells', int(have.sum()), 'ratio percentiles 10/50/90', np.nanpercentile(ratio, [10, 50, 90]).round(2), 'total hero/film', round(float(sh[have].sum() / sf[have].sum()), 3))
    sect = [(round(float(sh[i * 6:(i + 1) * 6][have[i * 6:(i + 1) * 6]].sum() / max(sf[i * 6:(i + 1) * 6][have[i * 6:(i + 1) * 6]].sum(), 1e-9)), 2)) for i in range(NT // 6)]
    print('by 30 degree sector', sect)
    fill = np.where(have, np.log(np.clip(ratio, 0.2, 5)), 0)
    wsum = ndi.gaussian_filter(have.astype(float), (0.8, 0.8), mode=('wrap', 'nearest'))
    sm = ndi.gaussian_filter(fill, (0.8, 0.8), mode=('wrap', 'nearest')) / np.maximum(wsum, 1e-6)
    wide = ndi.gaussian_filter(fill, (3, 3), mode=('wrap', 'nearest')) / np.maximum(ndi.gaussian_filter(have.astype(float), (3, 3), mode=('wrap', 'nearest')), 1e-6)
    step = np.where(wsum > 0.05, sm, wide)
    prev = np.array(json.load(open(DST))['gain']) if os.path.exists(DST) else np.ones((NT, NR))
    gain = np.clip(prev * np.exp(step), 0.15, 6)
    json.dump({'nt': NT, 'nr': NR, 'r0': R0, 'r1': R1, 'gain': [[round(float(v), 3) for v in row] for row in gain]}, open(DST, 'w'))
    print('gain percentiles 10/50/90', np.percentile(gain, [10, 50, 90]).round(2))


main(sys.argv[1], sys.argv[2])
