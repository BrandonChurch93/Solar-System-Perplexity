import json
import sys

import cv2
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/neptune')
import geo

HERO = 'references/approved/neptune-hero.png'
OUT = 'src/stops/neptune/field.json'
EPS = 0.002
STEP = 2.0
LIMIT = 2.9
EDGE = 3
RIM = 8
CAP = 0.6
DEEP = 1.4
SOFT = 2.0


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def smooth(logg, wgt, si, sj):
    num = ndi.gaussian_filter(logg * wgt[..., None], (sj, si, 0), mode='nearest')
    den = ndi.gaussian_filter(wgt, (sj, si), mode='nearest')
    return np.where(den[..., None] > 1e-3, num / np.maximum(den[..., None], 1e-6), 0), den


def main():
    old = json.load(open(OUT))
    w_, h_ = old['size']
    mu0, mu1 = old['mu']
    n0, n1 = old['ndl']
    film8 = cv2.imread(sys.argv[1])[:, :, ::-1]
    h, w = film8.shape[:2]
    hero8 = cv2.resize(cv2.imread(HERO)[:, :, ::-1], (w, h), interpolation=cv2.INTER_AREA)
    a, b = geo.decode(hero8), geo.decode(film8)
    d = geo.hero_rays(w, h)
    bb = -(d @ geo.CAM)
    disc = 1 - (geo.CAM @ geo.CAM - bb * bb)
    hit = disc > 0
    p = geo.CAM + d * (bb - np.sqrt(np.maximum(disc, 0)))[..., None]
    mu = -(p * d).sum(-1)
    ndl = p @ geo.SUN
    c = geo.CAM / np.linalg.norm(geo.CAM)
    sd = np.cross(geo.SUN, c)
    sd /= np.linalg.norm(sd)
    s = ((p @ sd) > 0).astype(int)
    i = np.floor((mu - mu0) / (mu1 - mu0) * w_).astype(int)
    j = np.floor((ndl - n0) / (n1 - n0) * h_).astype(int)
    ok = hit & (i >= 0) & (i < w_) & (j >= 0) & (j < h_)
    key = (s * h_ + j) * w_ + i
    key = key[ok]
    order = np.argsort(key, kind='stable')
    key = key[order]
    av, bv = a[ok][order], b[ok][order]
    starts = np.searchsorted(key, np.arange(2 * h_ * w_))
    ends = np.searchsorted(key, np.arange(2 * h_ * w_), side='right')
    logg = np.zeros((2 * h_ * w_, 3))
    cnt = (ends - starts).astype(float)
    for k in np.nonzero(cnt >= 6)[0]:
        ma = np.median(av[starts[k]:ends[k]], axis=0)
        mb = np.median(bv[starts[k]:ends[k]], axis=0)
        logg[k] = np.log2((ma + EPS) / (mb + EPS))
    logg = np.clip(logg.reshape(2, h_, w_, 3), -STEP, STEP)
    wgt = np.where(cnt >= 6, np.sqrt(np.minimum(cnt, 400)), 0).reshape(2, h_, w_)
    muc = (np.arange(w_) + 0.5) / w_ * (mu1 - mu0) + mu0
    wide = step(muc, 0.1, 0.35)[None, :, None]
    res = np.zeros_like(logg)
    for k in range(2):
        fine, den = smooth(logg[k], wgt[k], 0.5, 1.0)
        broad, _ = smooth(logg[k], wgt[k], 2.5, 2.5)
        far, _ = smooth(logg[k], wgt[k], 3.0, 4.0)
        near = np.clip(den / 2.0, 0, 1)[..., None]
        mixed = fine * (1 - wide) + broad * wide
        res[k] = mixed * near + far * (1 - near)
    seen = wgt > 0
    print('cells seen', int(seen.sum()), 'of', seen.size, 'residual rms log2', float(np.sqrt((logg[seen] ** 2).mean()).round(3)), 'p95', float(np.percentile(np.abs(logg[seen]), 95).round(3)))
    total = np.clip(np.log2(np.array(old['gain'])) + res, -LIMIT, LIMIT)
    ext = ndi.gaussian_filter(total[:, :, RIM:RIM + 3].mean(2), (0, 1.0, 0), mode='nearest')[:, :, None, :]
    rim = ndi.gaussian_filter(total[:, :, :RIM + 3], (0, 1.0, SOFT, 0), mode='nearest')
    rim = ext + np.clip(rim - ext, -DEEP, CAP)
    keep = np.clip((np.arange(RIM + 3) - RIM + 1) / 3.0, 0, 1)[None, None, :, None]
    total[:, :, :RIM + 3] = total[:, :, :RIM + 3] * keep + rim * (1 - keep)
    ndc = (np.arange(h_) + 0.5) / h_ * (n1 - n0) + n0
    dim = (1 - step(ndc, 0.2, 0.35))[None, :, None, None]
    total[:, :, :EDGE] = total[:, :, :EDGE] * (1 - dim) + np.clip(total[:, :, EDGE:EDGE + 1], -0.3, 0.3) * dim
    old['gain'] = np.round(2.0 ** total, 3).tolist()
    json.dump(old, open(OUT, 'w'))
    vis = np.concatenate([total[0], total[1]], 1)
    img = np.clip(128 + vis * 60, 0, 255).astype(np.uint8)
    cv2.imwrite('out/work/nep/field.png', cv2.resize(img[::-1, :, ::-1], None, fx=12, fy=12, interpolation=cv2.INTER_NEAREST))


main()
