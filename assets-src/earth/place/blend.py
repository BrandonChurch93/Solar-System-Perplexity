import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, centre

NADIR = g.direction(g.GLOBE['lon'], g.GLOBE['lat'])


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def reach(c, plate_deg, size):
    d = g.plate_dirs(c, plate_deg, size)
    return np.degrees(np.arccos(np.clip(d @ NADIR, -1, 1))).astype(np.float32)


def blend(take, lay, sharp, inside, plate_deg, lock_deg=(3.5, 5.0), sharp_at=(0.5, 1.0), sigma_deg=0.45, edge_deg=0.12, spread=3.0):
    size = take.shape[0]
    per = size / plate_deg
    dist = reach(centre(), plate_deg, size)
    cover = cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), edge_deg * per)
    cover = step(0.5, 1.0, cover)
    m = cover * (1 - step(lock_deg[0], lock_deg[1], dist))
    s = sigma_deg * per
    diff = cv2.GaussianBlur(lay - take, (0, 0), 0.07 * per)
    num = cv2.GaussianBlur(diff * m[..., None], (0, 0), s)
    den = cv2.GaussianBlur(m, (0, 0), s)
    near = num / np.maximum(den, 1e-3)[..., None]
    num = cv2.GaussianBlur(diff * m[..., None], (0, 0), s * spread)
    wide = cv2.GaussianBlur(m, (0, 0), s * spread)
    far = num / np.maximum(wide, 1e-3)[..., None]
    t = step(0.02, 0.5, den)[..., None]
    offset = (near * t + far * (1 - t)) * step(0.01, 0.2, wide)[..., None]
    w = (step(sharp_at[0], sharp_at[1], cv2.GaussianBlur(sharp, (0, 0), 0.05 * per)) * cover)[..., None]
    return np.clip((take + offset) * (1 - w) + lay * w, 0, 255), w[..., 0], offset


if __name__ == '__main__':
    name, take_path, plate_deg = sys.argv[1], sys.argv[2], float(sys.argv[3])
    lay = cv2.imread(str(WORK / (name + '-lay.png'))).astype(np.float32)
    size = lay.shape[0]
    take = cv2.imread(take_path).astype(np.float32)
    if take.shape[0] != size:
        take = cv2.resize(take, (size, size), interpolation=cv2.INTER_LANCZOS4)
    sharp = np.load(WORK / (name + '-sharp.npy'))
    inside = np.load(WORK / (name + '-inside.npy'))
    out, w, offset = blend(take, lay, sharp, inside, plate_deg)
    cv2.imwrite(str(WORK / (name + '-g.png')), out.astype(np.uint8))
    cv2.imwrite(str(WORK / (name + '-g-look.jpg')), cv2.resize(out.astype(np.uint8), (1024, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(name, 'lay share', round(float(w.mean()), 4), 'offset mean abs', round(float(np.abs(offset).mean()), 2), 'largest', round(float(np.abs(offset).max()), 1))
