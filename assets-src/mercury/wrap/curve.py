import json
import sys

import numpy as np

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
from geo import lc

HERO = sys.argv[1] if len(sys.argv) > 1 else 'out/work/mercury/hero-2x.png'
ALBEDO = 0.26
LIMB_KNOTS = 17
LIMB_TO = 0.64
EDGE = 0.1

seen = geo.scene(HERO)
h, w, _ = seen.shape
g = lc.geometry(geo.FIT, w, h)
mu, ndl, hit = g['mu'], g['ndl'], g['hit']
flat = np.full(3, ALBEDO, np.float32)
knots = np.linspace(0, LIMB_TO, LIMB_KNOTS)
limb = np.ones((LIMB_KNOTS, 3))


def limb_at(table, m):
    x = np.clip(m / LIMB_TO, 0, 1) * (LIMB_KNOTS - 1)
    i = np.minimum(np.floor(x).astype(np.int32), LIMB_KNOTS - 2)
    f = (x - i)[..., None]
    return table[i] * (1 - f) + table[i + 1] * f


def night_of(c):
    n = c[:14].mean(axis=0)
    c = c.copy()
    c[:16] = n
    c[16:] = np.maximum(c[16:], n)
    return c, n


for step in range(3):
    lit = ndl > 0.06
    use = hit & (mu > np.where(lit, EDGE, 0.3))
    gain = limb_at(limb, mu)
    flatseen = np.where(lit[..., None], seen / gain, seen)
    curve, night = night_of(lc.curve_from(ndl, flatseen / flat, use))
    base = lc.curve_at(curve, ndl) * flat
    ratio = (seen - night * flat) / np.maximum(base - night * flat, 1e-5)
    half = 0.75 * LIMB_TO / (LIMB_KNOTS - 1)
    for i, k in enumerate(knots):
        vals = []
        for lo, hi in ((0.12, 0.3), (0.3, 0.5), (0.5, 0.7), (0.7, 0.85)):
            s = hit & (ndl >= lo) & (ndl < hi) & (np.abs(mu - k) < half)
            if s.sum() >= 2000:
                vals.append(np.median(ratio[s], axis=0))
        if vals:
            limb[i] = np.median(np.array(vals), axis=0)
    inner = limb[knots >= 0.5].mean(axis=0)
    limb = limb / inner
    limb[knots < EDGE] = limb[np.argmax(knots >= EDGE)]
    for c in range(3):
        limb[:, c] = np.maximum.accumulate(limb[::-1, c])[::-1]
        sm = limb[:, c].copy()
        sm[1:-1] = 0.25 * limb[:-2, c] + 0.5 * limb[1:-1, c] + 0.25 * limb[2:, c]
        limb[:, c] = sm
    limb[-1] = 1
    print('pass', step, 'limb gain', np.round(limb @ geo.LUMA, 2).tolist())

lc.save(curve, use.sum(), 'src/stops/mercury/curve.json')
d = json.load(open('src/stops/mercury/curve.json'))
d['limb'] = [[round(float(x), 4) for x in row] for row in limb]
d['limbTo'] = LIMB_TO
json.dump(d, open('src/stops/mercury/curve.json', 'w'))
shade = np.where((ndl > 0.0)[..., None], (lc.curve_at(curve, ndl) - night) * limb_at(limb, mu) + night, lc.curve_at(curve, ndl))
alb = seen / np.maximum(shade, 1e-4)
lit = hit & (ndl > 0.3) & (mu > 0.2)
la = np.log(np.maximum(alb[lit], 1e-3))
stats = {'logMean': la.mean(axis=0).tolist(), 'logStd': la.std(axis=0).tolist(), 'lumP': np.percentile(alb[lit] @ geo.LUMA, [1, 10, 50, 90, 99]).tolist(), 'albedo': ALBEDO}
json.dump(stats, open('assets-src/mercury/wrap/hero-stats.json', 'w'), indent=1)
print(json.dumps(stats))
for k, row in zip(np.linspace(-1, 1, 33), curve):
    print(f'{k:+.3f}  {row[0]:.4f} {row[1]:.4f} {row[2]:.4f}')
