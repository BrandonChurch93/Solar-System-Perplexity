import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.ndimage import map_coordinates

Image.MAX_IMAGE_PIXELS = None
DECK = json.load(open('src/stops/uranus/deck.json'))
PLATES = json.load(open('src/stops/uranus/plates.json'))
LAW = json.load(open('assets-src/uranus/place/plates.json'))['law']
C = np.array(DECK['centre'])
R = DECK['radius']
F0 = np.array(DECK['f0'])
R0 = np.array(DECK['r0'])
WIN = DECK['window']
LIMB = (0.02, 0.06)
EDGE = 0.05
INSET = (0.1, 0.2)
N0, E0, U0 = (np.array(PLATES[k]) for k in ('n', 'e', 'u'))


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def table(path):
    nx, ny = DECK['lightSize']
    return np.fromfile(path, np.float32).reshape(ny, nx, 4)


def smooth_law(old):
    log = np.log(np.maximum(old[..., :3], 1e-5)).astype(np.float64)
    log = ndi.gaussian_filter1d(log, LAW['rows'], axis=0, mode='nearest')
    log = ndi.gaussian_filter1d(log, LAW['columns'], axis=1, mode='wrap')
    new = old.copy()
    new[..., :3] = np.exp(log)
    return new.astype(np.float32)


def lookup(light, mu, psi):
    ny, nx, _ = light.shape
    m = np.clip(mu, 0, 1)
    y = np.sqrt(np.maximum(1 - np.sqrt(np.maximum(1 - m * m, 0)), 0)) * (ny - 1)
    x = np.clip(psi / DECK['psiMax'] * 0.5 + 0.5, 0, 1) * (nx - 1)
    return np.stack([map_coordinates(light[..., c], [y, x], order=1, mode='nearest', prefilter=False) for c in range(3)], -1)


def gain(old, new, half, size, r0, r1):
    xs = ((np.arange(size) + 0.5) / size - 0.5) * 2 * half
    ys = (0.5 - (np.arange(r0, r1) + 0.5) / size) * 2 * half
    gx, gy = np.meshgrid(xs, ys)
    n = N0 + gx[..., None] * E0 + gy[..., None] * U0
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    p = C + R * n
    di = p / np.linalg.norm(p, axis=-1, keepdims=True)
    mu = -np.sum(n * di, -1)
    psi = np.arctan2(di @ R0, di @ F0)
    z = np.maximum(-p[..., 2], 1e-4)
    u = (p[..., 0] / z - WIN[0]) / (WIN[2] - WIN[0])
    v = (p[..., 1] / z - WIN[1]) / (WIN[3] - WIN[1])
    w = (p[..., 2] < 0) * smoothstep(0, EDGE, np.minimum(v, 1 - v)) * smoothstep(INSET[0], INSET[1], np.minimum(np.minimum(u, 1 - u), v)) * smoothstep(LIMB[0], LIMB[1], mu)
    ratio = (lookup(old, mu, psi) + DECK['eps']) / (lookup(new, mu, psi) + DECK['eps'])
    return 1 + (ratio - 1) * w[..., None]


def main():
    src, out = sys.argv[1], sys.argv[2]
    old = table(src + '/full/deck-light.bin')
    new = smooth_law(old)
    for key, quality in (('full', 93), ('web', 92)):
        os.makedirs(out + '/' + key, exist_ok=True)
        new.tofile(out + '/' + key + '/deck-light.bin')
        for level in PLATES['levels']:
            img = np.asarray(Image.open(src + '/' + key + '/' + level['file']))
            size = img.shape[0]
            res = img.copy()
            low, high = 9.0, 0.0
            for r in range(0, size, 512):
                g = gain(old[..., :3], new[..., :3], level['halfTan'], size, r, min(r + 512, size))
                a = (img[r:r + 512, :, :3].astype(np.float32) / 255) ** 2 * g
                res[r:r + 512, :, :3] = (np.sqrt(np.clip(a, 0, 1)) * 255 + 0.5).astype(np.uint8)
                low, high = min(low, float(g.min())), max(high, float(g.max()))
            path = out + '/' + key + '/' + level['file']
            if level['file'].endswith('.png'):
                Image.fromarray(res).save(path, optimize=True)
            else:
                Image.fromarray(res).save(path, quality=quality, subsampling=0)
            print(key, level['file'], size, 'gain %.3f to %.3f' % (low, high), 'mean change of the code %.3f' % float(np.abs(res[..., :3].astype(np.float32) - img[..., :3]).mean()), os.path.getsize(path))


if __name__ == '__main__':
    main()
