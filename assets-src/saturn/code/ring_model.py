"""Build the ring model of the code built Saturn: src/stops/saturn/ringfield.json.

The model is what the ring plane is, not a picture of it: for each of N radii across the span it holds the
normal optical depth of the sheet, the brightness the sheet returns to the hero's camera, the colour of its
ice and how strongly the finer structure may modulate it there. The film's shader draws every pixel of the
plane from these numbers and from functions that carry the structure on to finer scales
(src/stops/saturn/field.ts).

The numbers are the radial profile of the kept ring picture itself (public/assets/saturn/full/rings.bin, the
rows of the hero, the profile the kept set draws in the hold and in the first part of the dive): its scene
linear colour and its opacity by radius. So the model has every ringlet of the kept picture where the kept
picture has it, down to the scale that picture resolves, and the functions of field.ts add only what is finer
(ringfine.json). Nothing is added by hand: no gap, no dust, no strand.

  python3 ring_model.py            writes the JSON and out/ring_model.png
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

OUT = os.path.join(geom.HERE, 'out')
RINGS = json.load(open(os.path.join(geom.STOP, 'rings.json')))
SPAN = tuple(RINGS['span'])
SET = RINGS['sets']['full']
KNOTS = 8192
VIEW = 0.43         # the cosine of the view to the normal at which the kept profile's opacity is the sheet's own (kept/rings.ts)
OPAQUE = 0.999      # the kept set's cap on the opacity
FINE = [(1.2, 0.8), (1.26, 1.0), (2.34, 1.0), (2.5, 0.8)]
THIN = [(1.2, 0), (1.93, 0), (1.95, 1), (2.5, 1)]   # where the sheet returns light like a thin one (hero_light.py): the division and the A ring
MID = 0.5           # the display luma at which the hue of the kept picture is taken
SMOOTH = 0.001      # radii over which that hue is averaged
MU_REF = 0.40       # cosine of the view to the normal where the light law of the sheet was measured (the hero's left sector)
LUMA = np.array([0.2126, 0.7152, 0.0722])
INNER = geom.FIT['rings']['inner']
OUTER = geom.FIT['rings']['outer']


def inverse_filmic(y):
    """The inverse of the film's tone curve, as src/post/chain.ts has it."""
    y = np.clip(y, 0.0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


n = SET['n']
rows = n // SET['width']
raw = np.fromfile(os.path.join(geom.ROOT, 'public', 'assets', 'saturn', 'full', 'rings.bin'), dtype=np.float32)
hero = raw.reshape(SET['height'], SET['width'], 4)[SET['hero'][0]:SET['hero'][0] + rows].reshape(n, 4).astype(np.float64)
per = n // KNOTS
col = inverse_filmic(hero[:, :3]).reshape(KNOTS, per, 3).mean(1)
depth = (-np.log(1 - np.minimum(hero[:, 3], OPAQUE)) * VIEW).reshape(KNOTS, per).mean(1)
r = SPAN[0] + (np.arange(KNOTS) + 0.5) / KNOTS * (SPAN[1] - SPAN[0])
lum = col @ LUMA
tau = depth
# the colour of the ice: the hue the kept picture shows, taken at a middle brightness (the tone curve undone
# on the picture's colour scaled to the display luma MID, so that the highlights, where the curve is flat, do
# not turn into strong hues), averaged over SMOOTH radii with the picture's brightness as the weight
shown = hero[:, :3].reshape(KNOTS, per, 3).mean(1)
shown_luma = shown @ LUMA
middle = inverse_filmic(shown * (MID / np.maximum(shown_luma, 1e-3))[:, None])
weight = np.maximum(shown_luma, 0.02)
half = int(np.ceil(3 * SMOOTH / ((SPAN[1] - SPAN[0]) / KNOTS)))
kernel = np.exp(-0.5 * (np.arange(-half, half + 1) * ((SPAN[1] - SPAN[0]) / KNOTS) / SMOOTH) ** 2)
chroma = np.stack([np.convolve(middle[:, c] * weight, kernel, 'same') for c in range(3)], 1) / np.convolve(weight, kernel, 'same')[:, None]
chroma = np.where((chroma @ LUMA)[:, None] > 1e-6, chroma / np.maximum(chroma @ LUMA, 1e-6)[:, None], 1.0)
mu0 = abs(geom.SUN_L[1])
muh = MU_REF
fine = np.interp(r, [f[0] for f in FINE], [f[1] for f in FINE])
thin_w = np.interp(r, [f[0] for f in THIN], [f[1] for f in THIN])

model = {
    'source': 'assets-src/saturn/code/ring_model.py, the ring sheet by radius as the kept ring picture has it (the hero rows of rings.bin): normal optical depth from its opacity, the brightness returned to the hero camera, the colour of the ice as red and blue over luma, the strength of the finer structure, and how far the sheet returns light like a thin one',
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
    print('  %.2f to %.2f: tau p10 %.3f p50 %.3f p90 %.3f, luma p50 %.3f p99 %.3f' % (a, b, *np.percentile(tau[k], [10, 50, 90]), np.median(lum[k]), np.percentile(lum[k], 99)))

if '--plot' in sys.argv:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(3, 1, figsize=(20, 11))
    ax[0].plot(r, lum, 'r', lw=0.5)
    ax[0].set_title('brightness at the hero camera')
    ax[0].set_ylim(0, 2)
    ax[1].plot(r, tau, 'b', lw=0.5)
    ax[1].set_title('normal optical depth')
    for c, name in enumerate('rgb'):
        ax[2].plot(r, chroma[:, c], name, lw=0.6)
    ax[2].set_title('ice colour over luma')
    for a in ax:
        a.set_xlim(*SPAN)
        a.grid(True, alpha=0.3)
    plt.tight_layout()
    os.makedirs(OUT, exist_ok=True)
    plt.savefig(os.path.join(OUT, 'ring_model.png'), dpi=60)
