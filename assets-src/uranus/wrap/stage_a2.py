import json
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/wrap/'
NDL_KNOTS = np.array([-1.0, -0.6, -0.3, -0.1, 0.0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 1.0])
POWERS = [3, 6, 12, 24, 60]
MU_N = 128
EPS = 0.004


def hats(x, knots):
    out = np.zeros((len(x), len(knots)), np.float32)
    idx = np.clip(np.searchsorted(knots, x) - 1, 0, len(knots) - 2)
    f = np.clip((x - knots[idx]) / (knots[idx + 1] - knots[idx]), 0, 1)
    rows = np.arange(len(x))
    out[rows, idx] = 1 - f
    out[rows, idx + 1] = f
    return out


def design(ndl, mu):
    b = hats(ndl, NDL_KNOTS)
    t = 1 - np.clip(mu, 0, 1)
    return np.concatenate([b * (t ** p)[:, None] for p in POWERS], 1)


def main():
    meta = json.load(open(OUT + 'curve.json'))
    base = np.load(OUT + 'base.npy')
    h, w = base.shape[:2]
    d = geo.rays(w, h)
    p, hit, _ = geo.sphere(d)
    mu = -(p * d).sum(-1)
    ndl = p @ np.array(meta['sun'])
    knots = np.linspace(-1, 1, meta['knots'])
    curve = np.array(meta['curve'])
    alpha = np.load(OUT + 'alpha.npy')
    shadow = np.load(OUT + 'shadow.npy')
    ok = hit & (mu > 0.05) & (alpha < 0.02) & (shadow < 0.02)
    ys, xs = np.nonzero(ok)
    pick = np.random.default_rng(3).choice(len(ys), 600000, replace=False)
    ys, xs = ys[pick], xs[pick]
    n, m = ndl[ys, xs], mu[ys, xs]
    a = design(n, m)
    coef = []
    for c in range(3):
        light = np.interp(n, knots, curve[:, c])
        y = np.log((np.maximum(base[ys, xs, c], 0) + EPS * meta['norm']) / (light + EPS) / meta['norm'])
        wgt = np.ones(len(y), np.float32)
        for _ in range(4):
            aw = a * wgt[:, None]
            x = np.linalg.solve(aw.T @ a + 1e-3 * np.eye(a.shape[1]), aw.T @ y)
            r = np.abs(y - a @ x)
            wgt = 1 / np.maximum(r / 0.08, 1)
        coef.append(x)
        print('channel', c, 'residual', float(np.median(r)))
    coef = np.array(coef)
    gn, gm = np.meshgrid(knots, np.linspace(0, 1, MU_N), indexing='ij')
    a = design(gn.ravel(), gm.ravel())
    lut = np.zeros((len(knots), MU_N, 3), np.float32)
    for c in range(3):
        lut[..., c] = curve[:, c][:, None] * np.exp(np.clip(a @ coef[c], -2.0, 2.5)).reshape(len(knots), MU_N)
    np.save(OUT + 'light-lut.npy', lut)
    for i in [100, 200, 256, 288, 320, 384, 448, 500]:
        print(round(knots[i], 3), 'mu 1', lut[i, -1].round(3), 'mu .5', lut[i, MU_N // 2].round(3), 'mu .2', lut[i, MU_N // 5].round(3), 'mu .05', lut[i, 6].round(3))
    show = geo.display(np.clip(lut * meta['norm'], 0, 5))
    Image.fromarray((show * 255).astype(np.uint8).transpose(1, 0, 2)[::-1]).resize((1026, 256), Image.BILINEAR).save(OUT + 'light-lut.jpg', quality=92)
    full = design(ndl[hit], mu[hit].clip(0, 1))
    rec = np.zeros(base.shape, np.float32)
    for c in range(3):
        rec[..., c][hit] = np.interp(ndl[hit], knots, curve[:, c]) * np.exp(np.clip(full @ coef[c], -2.0, 2.5)) * meta['norm']
    img = np.concatenate([geo.display(base), geo.display(rec)], 1)
    Image.fromarray((img * 255).astype(np.uint8)).resize((img.shape[1] // 4, img.shape[0] // 4), Image.LANCZOS).save(OUT + 'light-model.jpg', quality=90)


main()
