"""Build the ring model of the code built Saturn: src/stops/saturn/ringfield.json.

The model is what the ring plane is, not a picture of it: for each of N radii across the span it holds the
normal optical depth of the sheet and the brightness of its ice at full depth, and for a few radii the colour
of the ice. The film's shader draws every pixel of the plane from these numbers and from functions that carry
the structure on to finer scales (src/stops/saturn/field.ts).

The numbers are measured on the approved hero (hero_profile.py): the median scene linear colour of the lit
sheet by radius. From the brightness the depth follows by one rule (thin where dark, dense where bright), and
the ice brightness is what, with that depth, returns the hero's brightness from the hero's camera.

  python3 ring_model.py            writes the JSON and out/ring_model.png
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

OUT = os.path.join(geom.HERE, 'out')
SPAN = (1.2, 2.5)
KNOTS = 2048
SKY = np.array([0.0095, 0.0145, 0.0185])   # the hero's sky beside the rings, scene linear
TAU_REF = 1.6       # depth of a sheet as bright as L_REF
L_REF = 0.45
TAU_POWER = 1.6
TAU_MAX = 3.5
LUMA = np.array([0.2126, 0.7152, 0.0722])
INNER = geom.FIT['rings']['inner']
OUTER = geom.FIT['rings']['outer']
EDGE = 0.004        # how fast the sheet ends at its inner and outer rim, in radii
CHROMA_KNOTS = 33
SHOCK_STEPS = 14
SHOCK_RATE = 0.22

d = np.load(os.path.join(OUT, 'hero_profile.npz'))
lo, hi, n = float(d['lo']), float(d['hi']), int(d['n'])
rc = lo + (np.arange(n) + 0.5) / n * (hi - lo)
col = d['left_median'].copy()
for c in range(3):
    bad = ~np.isfinite(col[:, c])
    col[bad, c] = np.interp(rc[bad], rc[~bad], col[~bad, c])
col = np.maximum(col - SKY, 0)

mu0 = abs(geom.SUN_L[1])
muh = abs(geom.CAM_L[1]) / np.linalg.norm(geom.CAM_L)
kh = 1 / mu0 + 1 / muh

r = SPAN[0] + (np.arange(KNOTS) + 0.5) / KNOTS * (SPAN[1] - SPAN[0])
lum_src = col @ LUMA
lum = np.interp(r, rc, lum_src)


def shock(u, steps, rate):
    """A one dimensional shock filter: blurred edges of the measured profile become steps again."""
    u = u.copy()
    for _ in range(steps):
        up = np.roll(u, -1)
        um = np.roll(u, 1)
        up[-1] = u[-1]
        um[0] = u[0]
        lap = up - 2 * u + um
        fwd = up - u
        bwd = u - um
        grad = np.where(lap > 0, np.minimum(np.abs(fwd), np.abs(bwd)) * (np.sign(fwd) == np.sign(bwd)), np.minimum(np.abs(fwd), np.abs(bwd)) * (np.sign(fwd) == np.sign(bwd)))
        u = u - rate * np.sign(lap) * grad
    return u


lum = np.maximum(shock(lum, SHOCK_STEPS, SHOCK_RATE), 0)
rim = np.clip((r - INNER) / EDGE, 0, 1) * np.clip((OUTER - r) / EDGE, 0, 1)
lum *= rim

tau = np.minimum(TAU_REF * (lum / L_REF) ** TAU_POWER, TAU_MAX)
seen = 1 - np.exp(-tau * kh)
ice = np.where(seen > 1e-6, lum / np.maximum(seen, 1e-6), 0)
ice = np.minimum(ice, 2.6)

# colour of the ice by radius: the hero's colour over its luma, smoothed, at a few knots
ratio = col / np.maximum(lum_src[:, None], 1e-4)
weight = np.clip(lum_src / 0.05, 0, 1)
kr = np.linspace(SPAN[0], SPAN[1], CHROMA_KNOTS)
chroma = np.zeros((CHROMA_KNOTS, 3))
for i, x in enumerate(kr):
    w = weight * np.exp(-0.5 * ((rc - x) / 0.03) ** 2)
    if w.sum() < 1e-3:
        chroma[i] = np.nan
    else:
        chroma[i] = (ratio * w[:, None]).sum(0) / w.sum()
for c in range(3):
    bad = ~np.isfinite(chroma[:, c])
    chroma[bad, c] = np.interp(kr[bad], kr[~bad], chroma[~bad, c])
chroma /= (chroma @ LUMA)[:, None]

model = {
    'source': 'assets-src/saturn/code/ring_model.py, the ring sheet by radius measured on the approved hero: normal optical depth, brightness of the ice at full depth, colour of the ice',
    'span': list(SPAN),
    'knots': KNOTS,
    'inner': INNER,
    'outer': OUTER,
    'muSun': round(float(mu0), 6),
    'muHero': round(float(muh), 6),
    'tau': [round(float(v), 4) for v in tau],
    'ice': [round(float(v), 4) for v in ice],
    'chromaKnots': CHROMA_KNOTS,
    'chroma': [[round(float(v), 4) for v in c] for c in chroma],
}
path = os.path.join(geom.STOP, 'ringfield.json')
with open(path, 'w') as f:
    json.dump(model, f, separators=(',', ':'))
    f.write('\n')
print('wrote', path, os.path.getsize(path), 'bytes; muSun %.4f muHero %.4f' % (mu0, muh))
for a, b in [(1.25, 1.5), (1.5, 1.94), (1.955, 2.05), (2.07, 2.33)]:
    k = (r >= a) & (r < b)
    print('  %.2f to %.2f: tau p10 %.3f p50 %.3f p90 %.3f, ice p50 %.3f, luma p50 %.3f' % (a, b, *np.percentile(tau[k], [10, 50, 90]), np.median(ice[k]), np.median(lum[k])))

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig, ax = plt.subplots(4, 1, figsize=(20, 14))
ax[0].plot(rc, lum_src, 'k', lw=0.5, label='hero luma, left sector')
ax[0].plot(r, lum, 'r', lw=0.5, label='model luma at the hero camera')
ax[0].legend()
ax[1].plot(r, tau, 'b', lw=0.5)
ax[1].set_title('normal optical depth')
ax[2].plot(r, ice, 'g', lw=0.5)
ax[2].set_title('ice brightness at full depth')
for c, name in enumerate('rgb'):
    ax[3].plot(kr, chroma[:, c], name)
ax[3].set_title('ice colour over luma')
for a in ax:
    a.set_xlim(*SPAN)
    a.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(OUT, 'ring_model.png'), dpi=60)
