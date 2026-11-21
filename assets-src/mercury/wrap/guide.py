import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
from geo import lc

Image.MAX_IMAGE_PIXELS = None
CACHE = 'references/cache/mercury'
DEM = f'{CACHE}/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/work/mercury/guide-8192.png'
W, H = 8192, 4096
LOW = 0.6
MARK = 0.22
UNIT = 0.5
RADIUS = 2439400.0
STEEP = 2.5
SOFT = 0.05
WIDE = 60
KEEP = 0.35
TINT = 0.6
RING = 0.14


def wrapblur(a, s):
    p = int(s * 4) + 2
    return geo.blur(np.concatenate([a[:, -p:], a, a[:, :p]], 1), s)[:, p:-p]


seen = geo.scene('references/approved/mercury-hero.png')
h, w, _ = seen.shape
g = lc.geometry(geo.FIT, w, h)
lit = g['hit'] & (g['ndl'] > 0.3) & (g['mu'] > 0.3)
alb = (seen / np.maximum(geo.shade(g['ndl'], g['mu']), 1e-4))[lit]
ll = np.log(np.maximum(alb @ geo.LUMA, 1e-3))
rg = np.log(np.maximum(alb[:, 0], 1e-3) / np.maximum(alb[:, 1], 1e-3))
bg = np.log(np.maximum(alb[:, 2], 1e-3) / np.maximum(alb[:, 1], 1e-3))
print('hero log lum', ll.mean(), ll.std(), 'rg', rg.mean(), rg.std(), 'bg', bg.mean(), bg.std())

color = np.asarray(Image.open(f'{CACHE}/messenger-color-4096.png').convert('RGB')).astype(np.float32) / 255
hole = (color.min(axis=-1) > 0.97) | (color.max(axis=-1) < 0.02)
hole = cv2.dilate(hole.astype(np.uint8), np.ones((9, 9), np.uint8))
c8 = cv2.inpaint((color * 255).astype(np.uint8), hole, 9, cv2.INPAINT_TELEA).astype(np.float32) / 255
cl = geo.to_linear(c8)
lum = np.log(np.maximum(cl @ geo.LUMA, 1e-3))
crg = wrapblur(np.log(np.maximum(cl[..., 0], 1e-3) / np.maximum(cl[..., 1], 1e-3)), 7)
cbg = wrapblur(np.log(np.maximum(cl[..., 2], 1e-3) / np.maximum(cl[..., 1], 1e-3)), 7)
low = wrapblur(lum, 7)
low -= (1 - KEEP) * wrapblur(low, WIDE)
crg -= (1 - KEEP) * wrapblur(crg, WIDE)
cbg -= (1 - KEEP) * wrapblur(cbg, WIDE)
lat4 = (0.5 - (np.arange(2048) + 0.5) / 2048) * 180
band = np.abs(lat4) < 60
polar = geo.smooth(58, 74, np.abs(lat4))[:, None]


def graded(a, mean, std):
    a = (a - a[band].mean()) / a[band].std() * std + mean
    return cv2.resize(a * (1 - polar) + mean * polar, (W, H), interpolation=cv2.INTER_CUBIC)


crg = graded(crg, rg.mean(), rg.std() * TINT)
cbg = graded(cbg, bg.mean(), bg.std() * TINT)
low = graded(low, 0.0, ll.std() * LOW)

dem_cache = 'out/work/mercury/dem-8192.npy'
if os.path.exists(dem_cache):
    dem = np.load(dem_cache)
else:
    src = np.memmap(DEM, dtype='<i2', mode='r', offset=92981, shape=(11520, 23040))
    parts = []
    for y0 in range(0, 11520, 1440):
        part = np.asarray(src[y0:y0 + 1440]).astype(np.float32)
        part[part < -30000] = 0
        parts.append(cv2.resize(part, (W, 1440 * H // 11520), interpolation=cv2.INTER_AREA))
    dem = np.concatenate(parts, 0)
    np.save(dem_cache, dem)
lat = ((0.5 - (np.arange(H) + 0.5) / H) * np.pi).astype(np.float32)
coslat = np.maximum(np.cos(lat), 0.05)[:, None]
dem = dem * UNIT
hp = dem - wrapblur(dem, 10)
scale = float(np.percentile(np.abs(hp[H // 6: -H // 6]), 90))
mark = np.clip(hp / scale, -2.5, 2.5) / 2.5
cell = 2 * np.pi * RADIUS / W
pad = np.concatenate([dem[:, -2:], dem, dem[:, :2]], 1)
ge = (pad[:, 3:-1] - pad[:, 1:-3]) / 2 / coslat / cell * STEEP
gn = -np.gradient(dem, axis=0) / cell * STEEP
d = geo.directions(W, H)
sun = np.array(geo.FIT['sunDir'], np.float32)
sun /= np.linalg.norm(sun)
east = np.stack([d[..., 2], np.zeros_like(d[..., 0]), -d[..., 0]], -1)
east /= np.maximum(np.linalg.norm(east, axis=-1, keepdims=True), 1e-6)
north = np.cross(d, east)
se, sn, up = east @ sun, north @ sun, d @ sun
flat = np.maximum(np.sqrt(se * se + sn * sn), 1e-4)
night = 1 - geo.smooth(-0.25, -0.05, up)
elev = np.maximum(up, 0.12) * (1 - night) + 0.3 * night
ce = np.sqrt(1 - elev * elev)
lit = (elev - (ge * se + gn * sn) / flat * ce) / np.sqrt(1 + ge * ge + gn * gn)
ratio = np.clip((np.maximum(lit, 0) + SOFT) / (elev + SOFT), 0.12, 2.6)
slope = np.log(ratio) * geo.smooth(0.0, 0.3, flat)
print('slope 90th percentile', float(np.percentile(np.hypot(ge, gn)[H // 6: -H // 6], 90)) / STEEP)
gmag = np.hypot(ge, gn)
ring = np.clip(gmag / float(np.percentile(gmag[H // 6: -H // 6], 90)), 0, 3)
ring -= wrapblur(ring, 8)
high = geo.smooth(0.45, 0.85, up)
del d, east, north, pad, ge, gn, lit, ratio, gmag
mix = ll.mean() + low + MARK * mark * (1 - 0.6 * high) + slope + RING * ring * high
mix += ll.mean() - mix[H // 6: -H // 6].mean()
y = np.exp(mix)
gch = y / (0.2126 * np.exp(crg) + 0.7152 + 0.0722 * np.exp(cbg))
out = np.stack([gch * np.exp(crg), gch, gch * np.exp(cbg)], -1).astype(np.float32)
Image.fromarray(geo.coded(out)).save(OUT)
Image.fromarray(geo.coded(out)).resize((2048, 1024), Image.LANCZOS).save(OUT.replace('.png', '-small.jpg'), quality=90)
print('written', OUT, 'mark scale', scale)
