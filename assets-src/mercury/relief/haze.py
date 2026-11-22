import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'src/stops/mercury'
SUN = (745 / 2816, -40 / 1584)
FROM, TO, STEPS = 6.0, 38.0, 17
FAR = (38.0, 62.0)


def scene(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def main():
    relief = json.loads((SRC / 'relief.json').read_text())
    web = ROOT / 'public/assets/mercury/web'
    im = np.asarray(Image.open(web / relief['files']['color']).convert('RGB')).astype(np.float32) / 255
    h, w, _ = im.shape
    alpha = np.asarray(Image.open(web / relief['files']['alpha']).convert('L').resize((w, h)))
    x0, y0, bw, bh = relief['box']['web']
    iw, ih = relief['imageSize']['web']
    th = np.tan(np.radians(relief['vfovDeg'] / 2))
    asp = iw / ih
    ys, xs = np.mgrid[0:h, 0:w]
    dx = (2 * (x0 + (xs + 0.5) * bw / w) / iw - 1) * th * asp
    dy = (1 - 2 * (y0 + (ys + 0.5) * bh / h) / ih) * th
    sx = (2 * SUN[0] - 1) * th * asp
    sy = (1 - 2 * SUN[1]) * th
    cos = (dx * sx + dy * sy + 1) / (np.sqrt(dx * dx + dy * dy + 1) * np.sqrt(sx * sx + sy * sy + 1))
    ang = np.degrees(np.arccos(np.clip(cos, -1, 1)))
    lin = scene(np.where(im <= 0.04045, im / 12.92, ((im + 0.055) / 1.055) ** 2.4))
    ok = alpha > 250
    far = ok & (ang >= FAR[0]) & (ang < FAR[1])
    base = np.percentile(lin[far], 2, axis=0)
    level = np.percentile(lin[far] - base, 85, axis=0)
    at = np.linspace(FROM, TO, STEPS)
    half = (TO - FROM) / (STEPS - 1) * 0.75
    gain = np.ones((STEPS, 3))
    for k, a in enumerate(at):
        m = ok & (ang >= a - half) & (ang < a + half)
        if m.sum() < 400:
            gain[k] = 0
            continue
        lit = np.percentile(np.maximum(lin[m] - base, 0), 85, axis=0)
        gain[k] = np.minimum(level / np.maximum(lit, 1e-4), 1)
    for k in range(STEPS - 2, -1, -1):
        gain[k] = np.minimum(gain[k], gain[k + 1])
    pad = np.concatenate([gain[:1], gain, gain[-1:]])
    gain = 0.25 * pad[:-2] + 0.5 * pad[1:-1] + 0.25 * pad[2:]
    fade = np.clip((TO - at) / 6.0, 0, 1)
    gain = 1 + (gain - 1) * fade[:, None]
    sun = np.array([sx, sy, -1.0])
    sun /= np.linalg.norm(sun)
    out = {'sun': [round(float(v), 6) for v in sun], 'fromDeg': FROM, 'toDeg': TO, 'gain': [[round(float(v), 4) for v in row] for row in gain]}
    (SRC / 'haze.json').write_text(json.dumps(out) + '\n')
    for a, g in zip(at, gain):
        print('%5.1f gain %.3f %.3f %.3f' % (a, g[0], g[1], g[2]))
    print('far lit level', np.round(level, 4), 'base', np.round(base, 4), 'sun', np.round(sun, 4))


if __name__ == '__main__':
    sys.exit(main())
