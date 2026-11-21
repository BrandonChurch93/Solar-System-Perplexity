import json
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import geo

KNOTS = 33
A0 = np.array([0.058, 0.215, 0.80])


def measure():
    im = np.asarray(Image.open(os.path.join(geo.ROOT, 'references/approved/neptune-hero.png')).convert('RGB'))
    sc = geo.decode(im)
    h, w, _ = im.shape
    d = geo.hero_rays(w, h)
    p, hit = geo.hit_sphere(d)
    ndl = p @ geo.SUN
    mu = -(p * d).sum(-1)
    srgb = im.astype(np.float32) / 255
    sat = (srgb.max(-1) - srgb.min(-1)) / np.maximum(srgb.max(-1), 1e-3)
    lum = sc @ np.array([0.2126, 0.7152, 0.0722])
    use = hit & (mu > 0.45)
    knots = np.linspace(-1, 1, KNOTS)
    half = 1.2 / (KNOTS - 1)
    deck = np.full((KNOTS, 3), np.nan)
    cloud = np.full(KNOTS, np.nan)
    for i, k in enumerate(knots):
        s = use & (np.abs(ndl - k) < half)
        dk = s & (sat > 0.6)
        if dk.sum() >= 3000:
            deck[i] = np.median(sc[dk], 0) / A0
        if s.sum() >= 3000:
            cloud[i] = np.percentile(lum[s], 99.7)
    good = np.where(~np.isnan(deck[:, 0]))[0]
    for c in range(3):
        deck[:, c] = np.interp(np.arange(KNOTS), good, deck[good, c])
    lo, hi = good[0], good[-1]
    slope = (deck[hi] - deck[hi - 2]) / 2
    for i in range(hi + 1, KNOTS):
        deck[i] = deck[hi] + slope * (i - hi) * np.exp(-(i - hi) / 3.0)
    deck = np.maximum.accumulate(deck, 0)
    deck = gaussian_filter1d(deck, 0.7, axis=0, mode='nearest')
    g2 = np.where(~np.isnan(cloud))[0]
    cloud = np.interp(np.arange(KNOTS), g2, cloud[g2])
    cloud = np.maximum.accumulate(cloud)
    cloud = gaussian_filter1d(cloud, 1.0, mode='nearest')
    return knots, deck, cloud


if __name__ == '__main__':
    knots, deck, cloud = measure()
    for k, dck, c in zip(knots, deck, cloud):
        print('%6.3f deck %.4f %.4f %.4f cloud %.4f' % (k, dck[0], dck[1], dck[2], c))
    out = os.path.join(geo.ROOT, 'out/work/nep/wrap/curves-measured.json')
    json.dump({'a0': A0.tolist(), 'deck': np.round(deck, 5).tolist(), 'cloud': np.round(cloud, 5).tolist()}, open(out, 'w'))
