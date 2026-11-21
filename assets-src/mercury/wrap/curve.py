import json
import sys

import numpy as np

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
from geo import lc

HERO = sys.argv[1] if len(sys.argv) > 1 else 'out/work/mercury/hero-2x.png'
ALBEDO = 0.26

seen = geo.scene(HERO)
h, w, _ = seen.shape
g = lc.geometry(geo.FIT, w, h)
use = g['hit'] & (g['mu'] > 0.3)
flat = np.full(3, ALBEDO, np.float32)
curve = lc.curve_from(g['ndl'], seen / flat, use)
lum = curve @ geo.LUMA
night = curve[:14].mean(axis=0)
for i in range(16):
    curve[i] = night
for i in range(16, 33):
    curve[i] = np.maximum(curve[i], night)
lc.save(curve, use.sum(), 'src/stops/mercury/curve.json')
alb = seen / np.maximum(lc.curve_at(curve, g['ndl']), 1e-4)
lit = use & (g['ndl'] > 0.3) & (g['mu'] > 0.45)
la = np.log(np.maximum(alb[lit], 1e-3))
stats = {'logMean': la.mean(axis=0).tolist(), 'logStd': la.std(axis=0).tolist(), 'lumP': np.percentile(alb[lit] @ geo.LUMA, [1, 10, 50, 90, 99]).tolist(), 'albedo': ALBEDO}
json.dump(stats, open('assets-src/mercury/wrap/hero-stats.json', 'w'), indent=1)
print(json.dumps(stats))
for k, row in zip(np.linspace(-1, 1, 33), curve):
    print(f'{k:+.3f}  {row[0]:.4f} {row[1]:.4f} {row[2]:.4f}')
