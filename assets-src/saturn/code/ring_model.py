"""Build the ring model of the code built Saturn: src/stops/saturn/ringfield.json.

The model is what the ring plane is, not a picture of it: for each of N radii across the span it holds the
normal optical depth of the sheet, the brightness the sheet returns to the hero's camera, the colour of its
ice and how strongly the finer structure may modulate it there. The film's shader draws every pixel of the
plane from these numbers and from functions that carry the structure on to finer scales
(src/stops/saturn/field.ts).

The numbers are measured on the approved hero (hero_profile.py): the median scene linear colour of the lit
sheet by radius. From the brightness the depth follows by one rule (thin where dark, dense where bright).
Outside the hero's outer edge the model adds what the hero is too far away to show: a thin sheet of dust that
dies away outward and one narrow strand, so the plane has no hard end.

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
DUST = {'tau': 0.004, 'length': 0.045, 'ice': 0.26}                 # the sheet of dust outside the outer edge
STRANDS = [(2.418, 0.0026, 0.012)]   # radius, half width, depth
FINE = [(1.2, 0.8), (1.26, 1.0), (2.34, 1.0), (2.5, 0.8)]
GAP = {'from': 1.969, 'to': 2.047, 'edge': [0.003, 0.008], 'tau': 0.006, 'ice': 0.11, 'ink': [0.96, 1.0, 1.08]}   # the Cassini division between the hero's two edges is all but empty: a thin sheet of grey dust
RINGLETS = [(1.984, 0.0016, 0.07), (2.001, 0.0012, 0.05), (2.019, 0.0022, 0.09), (2.036, 0.0014, 0.06)]   # in the division: radius, half width, depth
C_RING = {'to': 1.5, 'edge': 0.03, 'tau': 0.32, 'lum': 0.1, 'power': 0.6}   # the inner ring is dark ice, deeper than its brightness says
THIN = [(1.2, 0), (1.93, 0), (1.95, 1), (2.5, 1)]   # where the sheet returns light like a thin one (hero_light.py): the division and the A ring
MU_REF = 0.40       # cosine of the view to the normal where the profile was measured (the hero's left sector)
CHROMA_SIGMA = 0.006
CHROMA_TOP = 0.6    # the hero clips above this, where the colour of a bin can not be trusted
LUMA = np.array([0.2126, 0.7152, 0.0722])
INNER = geom.FIT['rings']['inner']
OUTER = geom.FIT['rings']['outer']
EDGE = 0.004        # how fast the sheet ends at its inner and outer rim, in radii
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
muh = MU_REF
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
# the division: the hero's profile there is the blur of its neighbours, so the model sets its own sheet
gap = np.clip((r - GAP['from']) / GAP['edge'][0], 0, 1) * np.clip((GAP['to'] - r) / GAP['edge'][1], 0, 1)
gap = gap * gap * (3 - 2 * gap)
lets = GAP['tau'] + sum(depth * np.exp(-0.5 * ((r - at) / wide) ** 2) for at, wide, depth in RINGLETS)
tau = tau * (1 - gap) + lets * gap
lum = lum * (1 - gap) + GAP['ice'] * (1 - np.exp(-lets * kh)) * gap
inner = np.clip((C_RING['to'] - r) / C_RING['edge'], 0, 1) * rim
tau = np.maximum(tau, inner * C_RING['tau'] * (np.maximum(lum, 1e-4) / C_RING['lum']) ** C_RING['power'])
# outside the outer edge: dust and strands, with the brightness they return to the hero's camera
out = np.maximum(r - OUTER, 0)
dust = np.where(r > OUTER, DUST['tau'] * np.exp(-out / DUST['length']) * np.clip((SPAN[1] - r) / 0.03, 0, 1), 0)
for at, wide, depth in STRANDS:
    dust += depth * np.exp(-0.5 * ((r - at) / wide) ** 2)
dust *= np.clip((r - OUTER) / EDGE, 0, 1)
tau = tau + dust
lum = lum + DUST['ice'] * (1 - np.exp(-dust * kh))

# colour of the ice by radius: the hero's colour over its luma, smoothed over CHROMA_SIGMA
ratio = col / np.maximum(lum_src[:, None], 1e-4)
weight = np.clip(lum_src / 0.05, 0, 1) * (lum_src < CHROMA_TOP)
chroma = np.zeros((KNOTS, 3))
step = rc[1] - rc[0]
reach = int(np.ceil(3 * CHROMA_SIGMA / step))
kernel = np.exp(-0.5 * (np.arange(-reach, reach + 1) * step / CHROMA_SIGMA) ** 2)
num = np.stack([np.convolve(ratio[:, c] * weight, kernel, mode='same') for c in range(3)], -1)
den = np.convolve(weight, kernel, mode='same')
good = den > 0.5
smooth = np.where(good[:, None], num / np.maximum(den[:, None], 1e-6), np.nan)
for c in range(3):
    chroma[:, c] = np.interp(r, rc[good], smooth[good, c])
chroma = chroma * (1 - gap[:, None]) + np.array(GAP['ink'])[None, :] * gap[:, None]
chroma /= (chroma @ LUMA)[:, None]

fine = np.interp(r, [f[0] for f in FINE], [f[1] for f in FINE])
thin_w = np.interp(r, [f[0] for f in THIN], [f[1] for f in THIN])

model = {
    'source': 'assets-src/saturn/code/ring_model.py, the ring sheet by radius measured on the approved hero: normal optical depth, the brightness returned to the hero camera, the colour of the ice as red and blue over luma, the strength of the finer structure, and how far the sheet returns light like a thin one',
    'span': list(SPAN),
    'knots': KNOTS,
    'inner': INNER,
    'outer': OUTER,
    'muSun': round(float(mu0), 6),
    'muHero': round(float(muh), 6),
    'tau': [round(float(v), 4) for v in tau],
    'lum': [round(float(v), 4) for v in lum],
    'red': [round(float(v), 3) for v in chroma[:, 0]],
    'blue': [round(float(v), 3) for v in chroma[:, 2]],
    'fine': [round(float(v), 3) for v in fine],
    'thin': [round(float(v), 3) for v in thin_w],
}
path = os.path.join(geom.STOP, 'ringfield.json')
with open(path, 'w') as f:
    json.dump(model, f, separators=(',', ':'))
    f.write('\n')
print('wrote', path, os.path.getsize(path), 'bytes; muSun %.4f muHero %.4f' % (mu0, muh))
for a, b in [(1.25, 1.5), (1.5, 1.94), (1.955, 2.05), (2.07, 2.33)]:
    k = (r >= a) & (r < b)
    print('  %.2f to %.2f: tau p10 %.3f p50 %.3f p90 %.3f, luma p50 %.3f' % (a, b, *np.percentile(tau[k], [10, 50, 90]), np.median(lum[k])))

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig, ax = plt.subplots(4, 1, figsize=(20, 14))
ax[0].plot(rc, lum_src, 'k', lw=0.5, label='hero luma, left sector')
ax[0].plot(r, lum, 'r', lw=0.5, label='model luma at the hero camera')
ax[0].legend()
ax[1].plot(r, tau, 'b', lw=0.5)
ax[1].set_title('normal optical depth')
ax[2].plot(r, fine, 'g', lw=0.8)
ax[2].set_title('strength of the finer structure')
for c, name in enumerate('rgb'):
    ax[3].plot(r, chroma[:, c], name, lw=0.6)
ax[3].set_title('ice colour over luma')
for a in ax:
    a.set_xlim(*SPAN)
    a.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(OUT, 'ring_model.png'), dpi=60)
