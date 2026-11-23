import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, centre, layback
from overlay import land_mask

SPOT = g.G.T @ g.SPOT
NADIR = g.direction(g.GLOBE['lon'], g.GLOBE['lat'])


def level(width_deg, c, plate_deg, size, name=None):
    src = cv2.imread(str(g.ROOT / (name or 'public/assets/earth/full/patch-%d.jpg' % width_deg)))
    d = g.plate_dirs(c, plate_deg, size)
    u, v = g.plate_xy(SPOT, width_deg, d)
    n = src.shape[0]
    return cv2.remap(src, (u * n - 0.5).astype(np.float32), (v * n - 0.5).astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def reach(c, plate_deg, size):
    d = g.plate_dirs(c, plate_deg, size)
    return np.degrees(np.arccos(np.clip(d @ NADIR, -1, 1)))


def sea_tone(img, mask):
    px = img[mask].astype(np.float64)
    return np.median(px, axis=0)


def guide(plate_deg, size, far=5.5):
    c = centre()
    src = cv2.imread(str(g.ROOT / 'out/work/earth/relief/canvas-full-1x.png'))
    lay, sharp, inside = layback(src, 1, plate_deg, size, c=c)
    base = level(24, c, plate_deg, size)
    dist = reach(c, plate_deg, size)
    land = land_mask(base)
    lf = lay.astype(np.float64)
    white = lf.min(axis=2)
    sea_lay = (inside > 0.99) & (dist < 4) & (white < 60) & (lf[..., 0] > lf[..., 2] + 10)
    bf = base.astype(np.float64)
    sea_base = ~land & (bf.min(axis=2) < 120) & (bf[..., 0] > bf[..., 2] + 20)
    gain = sea_tone(lay, sea_lay) / sea_tone(base, sea_base)
    graded = np.clip(bf * gain, 0, 255)
    lum = bf.mean(axis=2, keepdims=True)
    cloud = np.clip((bf.min(axis=2, keepdims=True) - 150) / 60, 0, 1)
    graded = graded * (1 - cloud) + np.clip(lum * 1.02, 0, 255) * cloud
    cover = cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), size / 50)
    cover = np.clip((cover - 0.5) * 2, 0, 1)
    cover = (cover * cover * (3 - 2 * cover))[..., None]
    beyond = np.clip((dist - far) / 0.8, 0, 1)
    shore = cv2.GaussianBlur(land.astype(np.float32), (0, 0), size / 500)
    veil = np.clip((white - 110) / 100, 0, 1) * 0.55
    show = (shore * beyond * (1 - veil))[..., None]
    out = graded * (1 - cover) + (lf * (1 - show) + graded * show) * cover
    return np.clip(out, 0, 255).astype(np.uint8), lay, sharp, inside, base, gain


if __name__ == '__main__':
    plate_deg = float(sys.argv[1])
    size = int(sys.argv[2])
    name = sys.argv[3]
    out, lay, sharp, inside, base, gain = guide(plate_deg, size)
    cv2.imwrite(str(WORK / (name + '-guide.png')), out)
    cv2.imwrite(str(WORK / (name + '-lay.png')), lay)
    cv2.imwrite(str(WORK / (name + '-base.png')), base)
    np.save(WORK / (name + '-sharp.npy'), sharp.astype(np.float32))
    np.save(WORK / (name + '-inside.npy'), inside.astype(np.float32))
    print(name, 'sea gain b g r', np.round(gain, 3), 'covered', float((inside > 0.5).mean()))
    look = np.hstack([cv2.resize(x, (700, 700), interpolation=cv2.INTER_AREA) for x in (base, lay, out)])
    cv2.imwrite(str(WORK / (name + '-guide-look.jpg')), look, [cv2.IMWRITE_JPEG_QUALITY, 88])
