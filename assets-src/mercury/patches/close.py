import json
import math
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
sys.path.insert(0, 'assets-src/mercury/patches')
import geom
import resample

Image.MAX_IMAGE_PIXELS = None
SPOT = json.load(open('assets-src/mercury/patches/spot.json'))
N = np.array(SPOT['normal'])
HB = np.array(SPOT['heading'])
RB = np.array(SPOT['right'])
UP = geom.UP
FWD = np.array([0.0, 0.0, -1.0])
HC = FWD - (FWD @ UP) * UP
HC /= np.linalg.norm(HC)
RC = np.cross(HC, UP)
R = geom.R


def to_close(width_deg, size, shift=(0.0, 0.0)):
    n, east, north = resample.patch_basis(SPOT['lon'], SPOT['lat'])
    ht = math.tan(math.radians(width_deg) / 2)
    c = (np.arange(size) + 0.5) / size
    u, v = np.meshgrid(c, c)
    x = (u - 0.5) * 2 * ht
    y = (0.5 - v) * 2 * ht
    d = n[None, None, :] + x[..., None] * east + y[..., None] * north
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    dn = d @ N
    a = (d @ HB) / dn - shift[0]
    b = (d @ RB) / dn - shift[1]
    dc = UP[None, None, :] + a[..., None] * HC + b[..., None] * RC
    dc /= np.linalg.norm(dc, axis=-1, keepdims=True)
    p = -UP * (R + 1) + R * dc
    z = -p[..., 2]
    px = geom.W / 2 + geom.F * p[..., 0] / np.maximum(z, 1e-6)
    py = geom.H / 2 - geom.F * p[..., 1] / np.maximum(z, 1e-6)
    seen = (z > 0) & ((dc @ UP) > R / (R + 1) + 0.002)
    return px, py, seen, a, b


def rectify(width_deg, size, src, out, margin=True):
    px, py, seen, a, b = to_close(width_deg, size)
    img = np.asarray(Image.open(src).convert('RGB'))
    h, w = img.shape[:2]
    if margin:
        s = w / geom.CW
        mx, my = (px + geom.ML) * s, py * s
    else:
        s = w / geom.W
        mx, my = px * s, py * s
    ok = seen & (mx > 1) & (mx < w - 2) & (my > 1) & (my < h - 2)
    res = cv2.remap(img, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT)
    res[~ok] = 0
    Image.fromarray(res).save(out)
    Image.fromarray((ok * 255).astype(np.uint8)).save(out.replace('.png', '-mask.png'))
    gx = np.hypot(np.gradient(mx, axis=1), np.gradient(my, axis=1))
    gy = np.hypot(np.gradient(mx, axis=0), np.gradient(my, axis=0))
    print(out, 'covered %.3f' % ok.mean(), 'source px per patch px (median over covered): across %.2f along %.2f' % (np.median(gx[ok]), np.median(gy[ok])))


if __name__ == '__main__':
    rectify(float(sys.argv[1]), int(sys.argv[2]), sys.argv[3], sys.argv[4], margin='--nomargin' not in sys.argv)
