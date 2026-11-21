import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import geo

Image.MAX_IMAGE_PIXELS = None
W = 8192
H = 4096
PX = W / 360.0
LON0, LON1, LAT0, LAT1 = -100.0, 100.0, -90.0, 70.0


def window():
    x0 = int(round((LON0 / 360 + 0.5) * W))
    x1 = int(round((LON1 / 360 + 0.5) * W))
    y0 = int(round((0.5 - LAT1 / 180) * H))
    y1 = int(round((0.5 - LAT0 / 180) * H))
    return x0, y0, x1, y1


def grid(x0, y0, x1, y1, ss=1):
    xs = (np.arange(x0 * ss, x1 * ss) + 0.5) / (W * ss)
    ys = (np.arange(y0 * ss, y1 * ss) + 0.5) / (H * ss)
    lon = (xs - 0.5) * 2 * np.pi
    lat = (0.5 - ys) * np.pi
    return np.meshgrid(lon, lat)


def main():
    src = os.path.join(geo.ROOT, 'out/work/nep/wrap/hero2x.png')
    hero = cv2.imread(src, cv2.IMREAD_COLOR)
    hh, hw = hero.shape[:2]
    x0, y0, x1, y1 = window()
    ss = 2
    out = np.zeros((y1 - y0, x1 - x0, 3), np.uint8)
    geo_mu = np.zeros((y1 - y0, x1 - x0), np.float32)
    geo_ndl = np.zeros_like(geo_mu)
    step = 256
    for ya in range(y0, y1, step):
        yb = min(ya + step, y1)
        lon, lat = grid(x0, ya, x1, yb, ss)
        p = geo.lonlat_to_world(lon, lat)
        px, py = geo.world_to_hero(p, hw, hh)
        v = geo.CAM - p
        dist = np.linalg.norm(v, axis=-1)
        mu = (p * v).sum(-1) / dist
        ndl = p @ geo.SUN
        tile = cv2.remap(hero, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        tile = cv2.resize(tile, (x1 - x0, yb - ya), interpolation=cv2.INTER_AREA)
        inside = (px >= 0) & (px <= hw - 1) & (py >= 0) & (py <= hh - 1)
        mu = np.where(inside, mu, -1)
        out[ya - y0:yb - y0] = tile
        geo_mu[ya - y0:yb - y0] = cv2.resize(mu.astype(np.float32), (x1 - x0, yb - ya), interpolation=cv2.INTER_AREA)
        geo_ndl[ya - y0:yb - y0] = cv2.resize(ndl.astype(np.float32), (x1 - x0, yb - ya), interpolation=cv2.INTER_AREA)
    dst = os.path.join(geo.ROOT, 'out/work/nep/wrap')
    cv2.imwrite(os.path.join(dst, 'hero-map.png'), out)
    np.savez(os.path.join(dst, 'hero-map-geo.npz'), mu=geo_mu, ndl=geo_ndl, window=np.array([x0, y0, x1, y1]))
    small = cv2.resize(out, ((x1 - x0) // 4, (y1 - y0) // 4), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(dst, 'hero-map-small.jpg'), small, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(out.shape)


if __name__ == '__main__':
    main()
