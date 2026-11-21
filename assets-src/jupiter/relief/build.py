import json
import sys

import cv2
import numpy as np
from scipy import ndimage

import geom

sys.path.insert(0, 'assets-src/jupiter/sky')
import patch as skypatch

WORK = 'out/work/jupiter/relief'
OUT = 'public/assets/jupiter'
CW, CH = geom.CANVAS['size']
OX, OY = geom.CANVAS['origin']
W, H = geom.W, geom.H
CELL = 8
RELIEF = 0.55
RELIEF_FAR = (5.0, 14.0)


def jpeg(path, rgb, quality=90):
    cv2.imwrite(path, np.clip(np.round(rgb[..., ::-1]), 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_OPTIMIZE, 1])


def textures():
    canvas = np.load(f'{WORK}/canvas-final.npy')
    core = np.load(f'{WORK}/core-final.npy')
    jpeg(f'{OUT}/full/deck-wide.jpg', canvas, 95)
    jpeg(f'{OUT}/full/deck-core.jpg', core, 96)
    jpeg(f'{OUT}/web/deck-wide.jpg', cv2.resize(canvas, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), 88)
    jpeg(f'{OUT}/web/deck-core.jpg', cv2.resize(core, (W, H), interpolation=cv2.INTER_AREA), 88)


def sky():
    out = np.load(f'{WORK}/sky-lin.npy')
    skypatch.save(out, 'sky-terrain.webp', OUT)
    cv2.imwrite('out/work/view/deck_sky.jpg', np.clip(skypatch.to_srgb(skypatch.film(out * 3))[::2, ::2, ::-1] * 255, 0, 255).astype(np.uint8))


def grid():
    depth = np.fromfile(f'{WORK}/canvas-depth.raw', np.float32).reshape(CH // 2, CW // 2)
    gw, gh = CW // CELL + 1, CH // CELL + 1
    xs, ys = np.meshgrid(np.arange(gw) * CELL, np.arange(gh) * CELL)
    d = geom.rays(xs - OX + 0.0, ys - OY + 0.0)
    t = geom.ground(np.zeros(3), d)
    hit = np.isfinite(t)
    tan = float(np.sqrt(geom.CENTRE @ geom.CENTRE - geom.R * geom.R))
    inv = cv2.remap(depth, (xs / 2).astype(np.float32), (ys / 2).astype(np.float32), cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)
    inv = ndimage.gaussian_filter(inv, 1.0)
    near = hit & (t < 12)
    a = np.stack([1 / t[near], np.ones(near.sum())], 1)
    sol = np.linalg.lstsq(a, inv[near], rcond=None)[0]
    print('depth fit inverse distance gain and offset', sol.round(4))
    ratio = np.where(hit, (inv - sol[1]) / sol[0] * np.where(hit, t, 1), 1.0)
    ratio = np.clip(ratio, 0.5, 2.0)
    m = hit.astype(np.float32)
    smooth = ndimage.gaussian_filter(np.log(ratio) * m, 40) / np.maximum(ndimage.gaussian_filter(m, 40), 1e-3)
    rel = (np.log(ratio) - smooth) * m
    rel = ndimage.gaussian_filter(rel, 0.8)
    far = np.clip((RELIEF_FAR[1] - t) / (RELIEF_FAR[1] - RELIEF_FAR[0]), 0, 1)
    far = np.where(hit, far * far * (3 - 2 * far), 0)
    rel = np.clip(rel * RELIEF, -0.2, 0.25) * far
    print('relief percentiles', np.percentile(rel[near], [1, 10, 50, 90, 99]).round(4))
    dist = np.where(hit, t * np.exp(-rel), tan).astype(np.float32)
    dist.tofile(f'{OUT}/full/deck-dist.bin')
    dist.tofile(f'{OUT}/web/deck-dist.bin')
    view = np.clip(0.5 + rel * 3, 0, 1)
    cv2.imwrite('out/work/view/deck_relief.jpg', (cv2.resize(view, (1408, 792)) * 255).astype(np.uint8))
    meta = {
        'canvas': [CW, CH], 'origin': [OX, OY], 'image': [W, H], 'focalPx': geom.F, 'cell': CELL, 'grid': [int(gw), int(gh)],
        'nadir': [float(v) for v in geom.N], 'radius': float(geom.R), 'tangent': tan,
        'sets': {'full': {'wide': [CW, CH], 'core': [2 * W, 2 * H]}, 'web': {'wide': [CW // 2, CH // 2], 'core': [W, H]}},
    }
    json.dump(meta, open('src/stops/jupiter/relief.json', 'w'), indent=1)


if __name__ == '__main__':
    for step in sys.argv[1:]:
        {'textures': textures, 'sky': sky, 'grid': grid}[step]()
