import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, centre, layback

FULL = g.ROOT / 'public/assets/earth/full'


def ground(plate_deg, size, c=None):
    src = cv2.cvtColor(np.asarray(Image.open(FULL / g.RELIEF['ground']['file']).convert('RGB')), cv2.COLOR_RGB2BGR)
    return layback(src, src.shape[1] / g.BOX[2], plate_deg, size, c=c)


def towers(plate_deg, size, c=None):
    c = centre() if c is None else c
    t = g.RELIEF['towers']
    box = t['box']
    rgba = np.asarray(Image.open(FULL / t['file']).convert('RGBA').resize((box[2], box[3]), Image.LANCZOS)).astype(np.float64)
    dw, dh = t['distSize']
    lift = np.fromfile(FULL / t['dist'], dtype=np.float32).reshape(dh, dw)
    lift = cv2.resize(lift, (box[2], box[3]), interpolation=cv2.INTER_LINEAR)
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    d = g.ray(box[0] + xs + 0.5, box[1] + ys + 0.5)
    p, hit = g.sea(d)
    p = p * (1 - lift[ys, xs])[:, None]
    height = np.linalg.norm(p - g.CENTRE, axis=1) - g.R
    b = g.unit(g.local_to_body(p))
    u, v = g.plate_xy(c, plate_deg, b)
    ok = hit & (u > 0) & (u < 1) & (v > 0) & (v < 1) & ((b @ c) > 0)
    ix = (u[ok] * size).astype(np.int64)
    iy = (v[ok] * size).astype(np.int64)
    idx = iy * size + ix
    a = rgba[ys[ok], xs[ok], 3] / 255
    acc = np.zeros((size * size, 5))
    for k in range(3):
        acc[:, k] = np.bincount(idx, weights=rgba[ys[ok], xs[ok], 2 - k] * a, minlength=size * size)
    acc[:, 3] = np.bincount(idx, weights=a, minlength=size * size)
    acc[:, 4] = np.bincount(idx, weights=height[ok] * a, minlength=size * size)
    acc = acc.reshape(size, size, 5)
    s = max(size / 1024, 0.6)
    acc = cv2.GaussianBlur(acc, (0, 0), s)
    w = acc[..., 3:4]
    colour = acc[..., :3] / np.maximum(w, 1e-6)
    alpha = np.clip(w[..., 0] / 0.35, 0, 1)
    tall = acc[..., 4] / np.maximum(w[..., 0], 1e-6)
    return colour, alpha, tall, float(height[ok].max())


if __name__ == '__main__':
    plate_deg = float(sys.argv[1])
    size = int(sys.argv[2])
    name = sys.argv[3]
    lay, sharp, inside = ground(plate_deg, size)
    colour, alpha, tall, top = towers(plate_deg, size)
    cv2.imwrite(str(WORK / (name + '-ground.png')), lay)
    np.save(WORK / (name + '-ground-inside.npy'), inside.astype(np.float32))
    np.save(WORK / (name + '-ground-sharp.npy'), sharp.astype(np.float32))
    cv2.imwrite(str(WORK / (name + '-towers.png')), np.dstack([np.clip(colour, 0, 255), alpha * 255]).astype(np.uint8))
    np.save(WORK / (name + '-tall.npy'), tall.astype(np.float32))
    over = lay * (1 - alpha[..., None]) + colour * alpha[..., None]
    look = np.hstack([cv2.resize(np.clip(x, 0, 255).astype(np.uint8), (900, 900), interpolation=cv2.INTER_AREA) for x in (lay, over)])
    cv2.imwrite(str(WORK / (name + '-towers-look.jpg')), look, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(name, 'tower cover', float((alpha > 0.5).mean()), 'tallest (camera heights)', round(top, 4), 'ground covered', float((inside > 0.5).mean()))
