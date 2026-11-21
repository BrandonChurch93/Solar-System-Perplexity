import json

import numpy as np

from common import FIT, HERO, LIMB_KNOTS, WORK, lc, limb_at, load, moon_mask, decode, encode, save

hero = load(HERO)
h, w, _ = hero.shape
g = lc.geometry(FIT, w, h)
seen = decode(hero)
moon = moon_mask(w, h, 6) > 0
use = g['hit'] & (g['mu'] > 0.12) & ~moon
lat = g['lat']
ndl = g['ndl']
mu = g['mu']
LAT_BINS = 720
lat_i = np.clip(((lat / np.pi + 0.5) * LAT_BINS).astype(int), 0, LAT_BINS - 1)
A = np.ones((LAT_BINS, 3))
C = np.ones((lc.KNOTS, 3))
L = np.ones((LIMB_KNOTS, 3))
fitmask = use & (mu > 0.2)
sub = np.flatnonzero(((g['xs'] % 2 == 0) & (g['ys'] % 2 == 0)).ravel())
core = fitmask & (np.abs(lat) < np.radians(62))
for it in range(12):
    lit = lc.curve_at(C, ndl) * limb_at(L, mu)
    r = seen / np.maximum(lit, 1e-4)
    ok = fitmask & (lc.curve_at(C, ndl)[..., 1] > 0.08 if it > 0 else fitmask)
    A[:] = np.nan
    idx = np.flatnonzero(ok.ravel()[sub])
    bins = lat_i.ravel()[sub][idx]
    order = np.argsort(bins, kind='stable')
    vals = r.reshape(-1, 3)[sub][idx][order]
    cuts = np.searchsorted(bins[order], np.arange(LAT_BINS + 1))
    for b in range(LAT_BINS):
        if cuts[b + 1] - cuts[b] >= 30:
            A[b] = np.median(vals[cuts[b]:cuts[b + 1]], axis=0)
    good = np.where(~np.isnan(A[:, 0]))[0]
    for c in range(3):
        A[:, c] = np.interp(np.arange(LAT_BINS), good, A[good, c])
    alb = A[lat_i]
    C = lc.curve_from(ndl, seen / np.maximum(alb * limb_at(L, mu), 1e-4), core)
    r = seen / np.maximum(alb * lc.curve_at(C, ndl), 1e-4)
    knots = np.linspace(0, 1, LIMB_KNOTS)
    half = 1.0 / (LIMB_KNOTS - 1)
    lit_ok = core & (ndl > 0.25)
    for i, k in enumerate(knots):
        s = lit_ok & (np.abs(mu - k) < half)
        L[i] = np.median(r[s], axis=0) if s.sum() >= 300 else np.nan
    good = np.where(~np.isnan(L[:, 0]))[0]
    for c in range(3):
        L[:, c] = np.interp(np.arange(LIMB_KNOTS), good, L[good, c])
        sm = L[:, c].copy()
        sm[1:-1] = 0.25 * L[:-2, c] + 0.5 * L[1:-1, c] + 0.25 * L[2:, c]
        L[:, c] = sm
    L /= L[-1]
    top = C.max(axis=0)
    scale = top.max()
    C /= scale
    A *= scale
    print(it, 'C top', np.round(C[-1], 3), 'L0', np.round(L[0], 3), 'A mean', np.round(A.mean(axis=0), 3))

lc.save(C, int(core.sum()), 'src/stops/jupiter/curve.json')
json.dump({'knots': LIMB_KNOTS, 'limb': [[round(float(x), 4) for x in row] for row in L]}, open('src/stops/jupiter/limb.json', 'w'))
np.save(f'{WORK}/profile.npy', A)
np.save(f'{WORK}/curve.npy', C)
np.save(f'{WORK}/limb.npy', L)
lit = lc.curve_at(C, ndl) * limb_at(L, mu)
alb = seen / np.maximum(lit, 1e-4)
save(f'{WORK}/hero_albedo.png', encode(alb * g['hit'][..., None]))
pred = A[lat_i] * lit * g['hit'][..., None]
save(f'{WORK}/hero_pred.png', encode(pred))
for k, row in zip(np.linspace(-1, 1, lc.KNOTS), C):
    print(f'{k:+.3f}  {row[0]:.4f} {row[1]:.4f} {row[2]:.4f}')
print('limb', np.round(L, 3).tolist())
night = g['hit'] & (ndl < -0.3) & (mu > 0.3)
print('night seen median', np.median(seen[night], axis=0), 'hero 8-bit', np.median(hero[night], axis=0))
