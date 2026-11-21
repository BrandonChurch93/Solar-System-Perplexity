import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

Image.MAX_IMAGE_PIXELS = None
OUT = 'out/work/u/wrap/'
W, H = 8192, 4096
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
NORTH = 44.0


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def tri(x, period):
    t = np.mod(x, 2 * period)
    return np.where(t > period, 2 * period - t, t)


def main():
    alb = np.load(OUT + 'map-albedo.npy')
    seen = np.load(OUT + 'map-seen.npy')
    ndl = np.load(OUT + 'map-ndl.npy')
    lat = 90 - (np.arange(H) + 0.5) / H * 180
    lon = (np.arange(W) + 0.5) / W * 360 - 180
    full = seen > 0.999
    zonal = np.zeros((H, 3), np.float32)
    count = full.sum(1)
    for r in np.flatnonzero(count > 200):
        zonal[r] = np.median(alb[r][full[r]], 0)
    rows = np.flatnonzero(count > 200)
    top = rows[0]
    edge = int(np.argmin(np.abs(lat - NORTH)))
    edge = max(edge, top + 8)
    for r in range(0, edge):
        zonal[r] = zonal[min(2 * edge - r, H - 1)]
    for r in range(rows[-1] + 1, H):
        zonal[r] = zonal[rows[-1]]
    zonal = ndi.gaussian_filter1d(zonal, 1.5, axis=0, mode='nearest')
    lo, la = np.meshgrid(np.radians(lon).astype(np.float32), np.radians(lat).astype(np.float32))
    p = np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], 0)
    del lo
    rng = np.random.default_rng(7)
    N = 160
    lattice = ndi.gaussian_filter(rng.standard_normal((N, N, N)).astype(np.float32), 1.2, mode='wrap')
    lattice /= lattice.std()
    unit = H / np.pi

    def octave(q, size, stretch, seed):
        o = np.random.default_rng(seed).uniform(0, N, 3)
        c = np.stack([q[0] * (unit * 3 / (size * stretch)) + o[0], q[1] * (unit * 3 / size) + o[1], q[2] * (unit * 3 / (size * stretch)) + o[2]], 0)
        return ndi.map_coordinates(lattice, c.reshape(3, -1), order=1, mode='grid-wrap').reshape(H, W)

    warp = np.stack([octave(p, 420, 3, 100 + i) for i in range(3)], 0) * 0.011
    q = p + warp
    q /= np.linalg.norm(q, axis=0, keepdims=True)
    del warp
    luma = np.zeros((H, W), np.float32)
    for i, (size, stretch, amp) in enumerate([(2.2, 1.3, 0.017), (4.5, 1.5, 0.018), (9, 2.0, 0.02), (18, 3.0, 0.018), (36, 6.0, 0.02), (72, 9.0, 0.024), (150, 10.0, 0.024), (300, 10.0, 0.02)]):
        luma += amp * octave(q, size, stretch, 200 + i)
    tint = np.zeros((2, H, W), np.float32)
    for j in range(2):
        for i, (size, stretch, amp) in enumerate([(9, 1.5, 0.012), (36, 4.0, 0.012), (150, 8.0, 0.01)]):
            tint[j] += amp * octave(q, size, stretch, 300 + 10 * j + i)
    row = (0.5 - np.arcsin(np.clip(q[1], -1, 1)) / np.pi) * H - 0.5
    del p, q
    r0 = np.clip(np.floor(row).astype(np.int32), 0, H - 2)
    f = np.clip(row - r0, 0, 1)[..., None]
    fill = zonal[r0] * (1 - f) + zonal[r0 + 1] * f
    del row, r0, f
    fill *= (1 + luma)[..., None]
    fill[..., 0] *= 1 + tint[0]
    fill[..., 2] *= 1 + tint[1]
    del luma, tint
    keep = seen * (0.2 + 0.8 * smooth(-0.02, 0.15, ndl))
    out = np.clip(fill + (alb - fill) * keep[..., None], 0.1, 1.8)
    del fill, alb
    np.save(OUT + 'wrap-albedo.npy', out.astype(np.float32))
    coded = geo.display(out)
    img = (np.clip(coded, 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(img).save(OUT + 'wrap-color.png')
    Image.fromarray(img).resize((2048, 1024), Image.LANCZOS).save(OUT + 'wrap-color-small.jpg', quality=90)
    cloud = np.load(OUT + 'map-cloud.npy')
    a = cloud[..., 0]
    s = cloud[..., 1]
    far = np.roll(cloud, W // 2 + 300, axis=1)[:, ::-1]
    keep = (1 - smooth(0.0, 0.2, cv2.GaussianBlur(seen, (0, 0), 40)))
    a = np.maximum(a, far[..., 0] * keep)
    s = np.maximum(s, far[..., 1] * keep)
    pack = np.zeros((H, W, 3), np.uint8)
    pack[..., 0] = (np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)
    pack[..., 1] = (np.clip(s, 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(pack).save(OUT + 'wrap-cloud.png')
    Image.fromarray(img[1400:2600, 2600:5000]).save(OUT + 'wrap-crop.jpg', quality=92)
    print('zonal rows', top, edge, 'albedo range', float(out.min()), float(out.max()), 'cloud max', float(a.max()), float(s.max()))


main()
