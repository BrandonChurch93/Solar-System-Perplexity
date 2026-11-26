"""The outer margin of the B ring in the hero's ring pixel map, made whole along the bands.

polar_rings.py lays the hero's ring pixels on the ring plane (azimuth by radius) and fills what the hero did not
show. Next to the globe's shadow at the right ansa the fill of the B ring's outer margin (radius 1.90 to 1.956)
is poor: a wedge of streaks that run along the radius, and beside it a fill far lighter than the margin the
hero shows. While the rings were bent to the hero's outline that part lay under the hero's own shadow. On a
rigid body the true shadow leaves a strip of it in the light, and it reads as a mottled patch.

Here the margin in that sector is laid again along the bands, from the sector next to it that the hero shows
clean: each row takes its level from the clean sector's near end and its fine structure from the clean sector,
mirrored back and forth. Nothing else of the map is touched. The numbers stand in src/stops/saturn/polar.json
under "margin".

usage: polar_margin.py IN_DIR OUT_DIR [ROOT]
  IN_DIR   holds full/polar-rings.jpg and web/polar-rings.jpg as polar_rings.py wrote them
  OUT_DIR  takes full/polar-rings.jpg and web/polar-rings.jpg, and a preview margin-KEY.png for each
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

IN, OUT = Path(sys.argv[1]), Path(sys.argv[2])
ROOT = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(__file__).resolve().parents[3]
POLAR = json.loads((ROOT / 'src' / 'stops' / 'saturn' / 'polar.json').read_text())
M = POLAR['margin']
SPAN = POLAR['span']


def ramp(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def pingpong(d, n):
    m = d % (2 * n)
    return np.where(m < n, m, 2 * n - 1 - m)


def build(key):
    img = cv2.imread(str(IN / key / POLAR['file']), cv2.IMREAD_COLOR).astype(np.float32)
    h, w = img.shape[:2]
    r = SPAN[1] - (np.arange(h) + 0.5) / h * (SPAN[1] - SPAN[0])
    az = ((np.arange(w) + 0.5) / w - 0.5) * 360.0
    per_deg = w / 360.0
    r0, r1, r2, r3 = M['radius']
    a0, a1, a2, a3 = M['azimuth']
    f0, f1 = M['from']
    wr = ramp(r0, r1, r) * (1.0 - ramp(r2, r3, r))
    wa = ramp(a0, a1, az) * (1.0 - ramp(a2, a3, az))
    rows = np.flatnonzero(wr > 0.0)
    cols = np.flatnonzero(wa > 0.0)
    c0 = int(round((f0 / 360.0 + 0.5) * w))
    n = int(round((f1 - f0) * per_deg))
    clean = img[rows][:, c0:c0 + n]
    low = gaussian_filter1d(clean, M['low'] * per_deg, axis=1, mode='reflect')
    high = clean - low
    level = low[:, :max(int(round(M['level'] * per_deg)), 1)].mean(axis=1)
    src = pingpong(c0 - 1 - cols, n)
    made = level[:, None, :] + high[:, src]
    weight = (wr[rows][:, None] * wa[cols][None, :])[..., None]
    out = img.copy()
    block = out[np.ix_(rows, cols)]
    out[np.ix_(rows, cols)] = block * (1.0 - weight) + made * weight
    out = np.clip(out, 0, 255).astype(np.uint8)
    (OUT / key).mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT / key / POLAR['file']), out, [cv2.IMWRITE_JPEG_QUALITY, M['quality']])
    x0, x1 = max(cols[0] - int(20 * per_deg), 0), min(cols[-1] + int(30 * per_deg), w)
    y0, y1 = max(rows[0] - int(0.06 / (SPAN[1] - SPAN[0]) * h), 0), min(rows[-1] + int(0.06 / (SPAN[1] - SPAN[0]) * h), h)
    view = np.concatenate([img[y0:y1, x0:x1].astype(np.uint8), out[y0:y1, x0:x1]], axis=0)
    cv2.imwrite(str(OUT / f'margin-{key}.png'), cv2.resize(view, (1400, int(view.shape[0] * 1400 / view.shape[1] * 3)), interpolation=cv2.INTER_AREA))
    back = cv2.imread(str(OUT / key / POLAR['file']), cv2.IMREAD_COLOR).astype(np.float32)
    outside = np.ones((h, w), bool)
    outside[np.ix_(rows, cols)] = False
    print(key, w, h, 'rows', int(rows[0]), int(rows[-1]), 'columns', int(cols[0]), int(cols[-1]), 'clean from column', c0, 'width', n,
          'largest change outside the sector after the file is read back', round(float(np.abs(back - img)[outside].max()), 1),
          'mean', round(float(np.abs(back - img)[outside].mean()), 3))


if __name__ == '__main__':
    for key in ('full', 'web'):
        build(key)
