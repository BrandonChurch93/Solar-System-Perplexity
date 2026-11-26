"""The corona's map as a ring: its mean light round the centre, by distance (src/stops/sun/corona-ring.json).

The map is the gas as it stands from far. Gas that lies near the eye has no threads of its own from there and no turn
round a centre that the eye can tell (corona.ts, CoronaNear): it is read as the mean of its whole ring. The mean is
taken here in the light the shader adds in: the map's value as the sampler hands it (its sRGB code undone), through the
film curve's inverse (src/post/chain.ts inverseFilmic), then the mean over all columns and over the rows of each knot.
Knot k stands at v = (k + 0.5) / knots of the map's height, v = 0 at the inner edge (the image's bottom row).

python3 assets-src/sun/place/ring.py            writes the file
python3 assets-src/sun/place/ring.py --check    compares the file with the map, exit 1 if they differ
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
MAP = ROOT / 'public/assets/sun/full/corona.webp'
OUT = ROOT / 'src/stops/sun/corona-ring.json'
KNOTS = 64


def inverse_filmic(y):
    y = np.clip(y, 0.0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4.0 * (c * y - a) * e * y, 0.0))) / (2.0 * (c * y - a))


def ring():
    code = np.asarray(Image.open(MAP).convert('RGB')).astype(np.float64) / 255.0
    linear = np.where(code <= 0.04045, code / 12.92, ((code + 0.055) / 1.055) ** 2.4)
    rows = inverse_filmic(linear).mean(axis=1)[::-1]
    per = rows.shape[0] // KNOTS
    return [[round(float(x), 6) for x in rows[k * per:(k + 1) * per].mean(axis=0)] for k in range(KNOTS)]


def main():
    light = ring()
    if '--check' in sys.argv:
        have = json.loads(OUT.read_text())['light']
        worst = max(abs(a - b) for r, s in zip(have, light) for a, b in zip(r, s))
        print('largest difference', worst)
        sys.exit(1 if worst > 1e-6 or len(have) != len(light) else 0)
    note = ('the corona map (public/assets/sun/full/corona.webp) as a ring: its mean light round the centre at '
            f'{KNOTS} even steps of its height, v = (k + 0.5) / {KNOTS}, inner edge first, in the light the corona adds in '
            '(the film curve undone). Read by corona.ts for gas near the eye. Made by assets-src/sun/place/ring.py; '
            'run it with --check after the map changes.')
    OUT.write_text(json.dumps({'note': note, 'knots': KNOTS, 'light': light}, indent=1) + '\n')
    print('wrote', OUT, 'first', light[0], 'last', light[-1])


main()
