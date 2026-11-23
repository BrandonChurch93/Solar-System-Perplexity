import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g  # noqa: E402

WORK = g.ROOT / 'out/work/earth/place'
WORK.mkdir(parents=True, exist_ok=True)


def centre():
    p, _ = g.sea(g.ray(np.array([g.W / 2]), np.array([g.H / 2])))
    return g.unit(g.local_to_body(p[0]))


def layback(src, scale, width_deg, size, c=None, over=2):
    c = centre() if c is None else c
    n = size * over
    d = g.plate_dirs(c, width_deg, n)
    x, y, seen = g.image_of(d)
    cx = ((x - g.BOX[0]) * scale).astype(np.float32)
    cy = ((y - g.BOX[1]) * scale).astype(np.float32)
    h, w = src.shape[:2]
    hx = (x - g.RELIEF['ground']['horizonSpan'][0]) / g.RELIEF['ground']['horizonSpan'][1]
    hy = np.polyval(g.RELIEF['ground']['horizon'][8::-1], hx)
    inside = seen & (cx >= 0) & (cx <= w - 1) & (cy <= h - 1) & (y > hy + 4)
    out = cv2.remap(src, cx, cy, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    out[~inside] = 0
    gx = np.gradient(x, axis=1), np.gradient(y, axis=1)
    gy = np.gradient(x, axis=0), np.gradient(y, axis=0)
    a, b, cc, dd = gx[0] * scale, gy[0] * scale, gx[1] * scale, gy[1] * scale
    s1 = a * a + b * b + cc * cc + dd * dd
    s2 = np.sqrt(np.maximum(s1 * s1 - 4 * (a * dd - b * cc) ** 2, 0))
    smin = np.sqrt(np.maximum((s1 - s2) / 2, 0)) * over
    smin[~inside] = 0
    if over > 1:
        out = cv2.resize(out, (size, size), interpolation=cv2.INTER_AREA)
        smin = cv2.resize(smin.astype(np.float32), (size, size), interpolation=cv2.INTER_AREA)
        inside = cv2.resize(inside.astype(np.float32), (size, size), interpolation=cv2.INTER_AREA)
    return out, smin, inside


if __name__ == '__main__':
    width = float(sys.argv[1])
    size = int(sys.argv[2])
    name = sys.argv[3]
    src = cv2.imread(str(g.ROOT / 'out/work/earth/relief/canvas-full-1x.png'))
    out, smin, inside = layback(src, 1, width, size)
    cv2.imwrite(str(WORK / (name + '.png')), out)
    np.save(WORK / (name + '-sharp.npy'), smin.astype(np.float32))
    cv2.imwrite(str(WORK / (name + '-sharp.png')), np.clip(smin * 255, 0, 255).astype(np.uint8))
    print(name, 'covered', float((inside > 0.5).mean()), 'sharp (image px per plate px at least 1)', float((smin >= 1).mean()), 'at least 0.5', float((smin >= 0.5).mean()))
