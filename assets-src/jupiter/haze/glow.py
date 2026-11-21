import json
import sys

import numpy as np

sys.path.insert(0, 'assets-src/jupiter/haze')
from profiles import HERO, RADII, profile, scene

film = scene(sys.argv[1])
hero = scene(HERO)
radii = [1.006, 1.01, 1.015, 1.022, 1.03, 1.04, 1.055, 1.075, 1.1, 1.14, 1.2, 1.3]
sky = np.array([0.0045, 0.0073, 0.0092])
fsky = np.array([0.0012, 0.0037, 0.0044])
out = {}
print('angle  ' + ' '.join(f'{r:7.3f}' for r in radii))
for ang in range(60, 301, 15):
    h = profile(hero, ang, radii, half=6) - sky
    f = profile(film, ang, radii, half=6) - fsky
    res = h - f
    out[ang] = {'hero': h.tolist(), 'film': f.tolist()}
    for name, v in (('hero', h), ('film', f), ('res ', res)):
        print(f'{ang:4d} {name} ' + ' '.join(f'{x:7.4f}' for x in v[:, 0]) + '   G/R ' + ' '.join(f'{x:5.2f}' for x in (v[:, 1] / np.maximum(v[:, 0], 1e-5))[[2, 5, 8]]) + '   B/R ' + ' '.join(f'{x:5.2f}' for x in (v[:, 2] / np.maximum(v[:, 0], 1e-5))[[2, 5, 8]]))
json.dump({'radii': radii, 'angles': out}, open('out/work/jupiter/glow-profiles.json', 'w'))
