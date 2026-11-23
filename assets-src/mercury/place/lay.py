import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[3]
PLACE = json.loads((ROOT / 'src/stops/mercury/place.json').read_text())
PATCHES = json.loads((ROOT / 'assets-src/mercury/patches/patches.json').read_text())
SPOT = (PATCHES['spot']['lonDeg'], PATCHES['spot']['latDeg'])


def quat_matrix(q):
    x, y, z, w = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


P = np.array(PLACE['body']['position'])
M = quat_matrix(PLACE['body']['quaternion'])
VFOV = PLACE['vfovDeg']


def basis(lon, lat):
    lo, la = math.radians(lon), math.radians(lat)
    n = np.array([math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)])
    east = np.cross(np.array([0.0, 1.0, 0.0]), n)
    east /= np.linalg.norm(east)
    return n, east, np.cross(n, east)


def plate_dirs(width_deg, size, centre=SPOT):
    n, east, north = basis(*centre)
    ht = math.tan(math.radians(width_deg) / 2)
    c = (np.arange(size) + 0.5) / size
    u, v = np.meshgrid(c, c)
    d = n + ((u - 0.5) * 2 * ht)[..., None] * east + ((0.5 - v) * 2 * ht)[..., None] * north
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def to_image(d, width, height, position=P, matrix=M, vfov=VFOV):
    f = height / 2 / math.tan(math.radians(vfov) / 2)
    c = (d - position) @ matrix
    z = -c[..., 2]
    zs = np.maximum(z, 1e-9)
    px = width / 2 + f * c[..., 0] / zs - 0.5
    py = height / 2 - f * c[..., 1] / zs - 0.5
    seen = (z > 0) & ((d @ position) > 1.0)
    return px, py, seen


def stretch(px, py):
    ax, ay = np.gradient(px, axis=1), np.gradient(px, axis=0)
    bx, by = np.gradient(py, axis=1), np.gradient(py, axis=0)
    s = ax * ax + ay * ay + bx * bx + by * by
    det = np.abs(ax * by - ay * bx)
    small = np.sqrt(np.maximum((s - np.sqrt(np.maximum(s * s - 4 * det * det, 0))) / 2, 1e-12))
    return 1 / small


def lay(src, width_deg, size, out, centre=SPOT):
    img = np.asarray(Image.open(src).convert('RGB'))
    h, w = img.shape[:2]
    px, py, seen = to_image(plate_dirs(width_deg, size, centre), w, h)
    ok = seen & (px > 0) & (px < w - 1) & (py > 0) & (py < h - 1)
    res = cv2.remap(img, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    k = np.where(ok, stretch(px, py), np.inf)
    res[~ok] = 0
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(res).save(out + '.png')
    np.save(out + '-stretch.npy', k.astype(np.float32))
    alpha = (ok * 255).astype(np.uint8)
    Image.fromarray(alpha).save(out + '-seen.png')
    return res, ok, k


if __name__ == '__main__':
    src, width_deg, size, out = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    res, ok, k = lay(src, width_deg, size, out)
    print('seen share', round(float(ok.mean()), 4), 'stretch under 1:', round(float((k < 1).mean()), 4), 'under 2:', round(float((k < 2).mean()), 4), 'under 4:', round(float((k < 4).mean()), 4), 'under 8:', round(float((k < 8).mean()), 4))
