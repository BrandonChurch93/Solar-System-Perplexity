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
TILE_LON = (-60.0, -3.0)
TILE_LAT = (-41.0, -5.0)
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
    c0, c1 = [int((v + 180) / 360 * W) for v in TILE_LON]
    r1, r0 = [int((90 - v) / 180 * H) for v in TILE_LAT]
    src = alb[r0:r1, c0:c1] / zonal[r0:r1, None, :]
    ok = full[r0:r1, c0:c1] & (ndl[r0:r1, c0:c1] > 0.22)
    print('tile', src.shape, 'usable', float(ok.mean()))
    low = cv2.GaussianBlur(np.where(ok[..., None], src, 0), (0, 0), 90) / np.maximum(cv2.GaussianBlur(ok.astype(np.float32), (0, 0), 90), 1e-3)[..., None]
    tile = np.where(ok[..., None], src / np.maximum(low, 1e-3), 1).astype(np.float32)
    th, tw = tile.shape[:2]
    np.save(OUT + 'tile.npy', tile)
    Image.fromarray((np.clip(tile * 0.5, 0, 1) * 255).astype(np.uint8)).resize((tw // 2, th // 2), Image.LANCZOS).save(OUT + 'tile.jpg', quality=90)
    lo, la = np.meshgrid(lon, lat)
    sx = tri((lo + 180 + 37.0) / 360 * W, tw - 1).astype(np.float32)
    sy = tri((90 - la) / 180 * H + 311.0, th - 1).astype(np.float32)
    zon = cv2.remap(tile, sx, sy, cv2.INTER_LINEAR)
    cl = np.radians(90 - np.abs(la))
    k = W / (2 * np.pi)
    px = (cl * np.sin(np.radians(lo)) * k).astype(np.float32)
    py = (cl * np.cos(np.radians(lo)) * k * np.sign(la)).astype(np.float32)
    pol = cv2.remap(tile, tri(px + 4000.0, tw - 1).astype(np.float32), tri(py + 3000.0, th - 1).astype(np.float32), cv2.INTER_LINEAR)
    wp = smooth(68, 80, np.abs(la)).astype(np.float32)[..., None]
    mean = np.float32(1.0)
    fill = mean + ((zon - mean) * np.sqrt(1 - wp) + (pol - mean) * np.sqrt(wp)) / np.sqrt(1 - wp + wp + 2 * np.sqrt(wp * (1 - wp)) * 0.0)
    del zon, pol, px, py, sx, sy
    fill *= zonal[:, None, :]
    out = fill + (alb - fill) * seen[..., None]
    del fill, alb
    np.save(OUT + 'wrap-albedo.npy', out.astype(np.float32))
    coded = geo.display(np.clip(out, 0, 4.5))
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
    print('zonal rows', top, edge, 'albedo range', float(out.min()), float(out.max()), 'cloud max', float(a.max()), float(s.max()))


main()
