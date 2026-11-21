import json
import os
import shutil
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

HERO = 'references/approved/mercury-hero.png'
OUT = sys.argv[1]
WORK = sys.argv[2]
W, H = 2816, 1584
MX, MY = W // 8, H // 8
BOX = (1560, 150, 2060, 280)
ROWS = (188, 236)
SUN = (2690.65, 175.88, 564.41)
BOOST = 4.0
SOFT = 4.5
TAPER = (1640, 1880)
KEEP = 0.85
SIZE = {'full': 1.0, 'web': 0.5}
DRY = len(sys.argv) > 3 and sys.argv[3] == '--dry'

hero = geo.scene(HERO)
x0, y0, x1, y1 = BOX
crop = hero[y0:y1, x0:x1]
yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
top = np.median(crop[:ROWS[0] - y0 - 4], axis=0)
low = np.median(crop[ROWS[1] - y0 + 4:], axis=0)
ya = (y0 + ROWS[0] - 4) / 2
yb = (ROWS[1] + 4 + y1) / 2
t = np.clip((yy - ya) / (yb - ya), 0, 1)[..., None]
back = top[None] * (1 - t) + low[None] * t
back = np.stack([cv2.GaussianBlur(back[..., i], (0, 0), 6) for i in range(3)], -1)
raw = crop - back
calm = np.stack([ndi.median_filter(raw[..., i], size=(1, 41)) for i in range(3)], -1)
calm = np.stack([cv2.GaussianBlur(calm[..., i], (0, 0), 1.2) for i in range(3)], -1)
band = geo.smooth(ROWS[0] - 6, ROWS[0], yy) * (1 - geo.smooth(ROWS[1], ROWS[1] + 6, yy))
r = np.hypot(xx - SUN[0], yy - SUN[1]) / SUN[2]
far = geo.smooth(1.2, 1.34, r)
c = geo.FIT['circle']
open_sky = geo.smooth(1.015, 1.05, np.hypot(xx + 0.5 - c['cx'], yy + 0.5 - c['cy']) / c['r'])
streak = np.maximum(calm, 0) * (band * far * open_sky)[..., None]
np.save(f'{WORK}/streak-raw.npy', streak.astype(np.float32))

base = f'{WORK}/sky-hold-base.npy'
if not os.path.exists(base):
    shutil.copy(f'{WORK}/sky-hold.npy', base)
sky = np.load(base)
sky[MY + y0:MY + y1, MX + x0:MX + x1] = np.maximum(sky[MY + y0:MY + y1, MX + x0:MX + x1] - streak, 0)

CH, CW = sky.shape[:2]
gy, gx = np.mgrid[0:CH, 0:CW].astype(np.float32)
hx, hy = gx - MX, gy - MY
rs = np.hypot(hx - SUN[0], hy - SUN[1]) / SUN[2]
inside = (hx >= 0) & (hx < W) & (hy >= 0) & (hy < H)
globe = np.hypot(hx + 0.5 - c['cx'], hy + 0.5 - c['cy']) / c['r']
bins = np.linspace(0, 2.2, 221)
which = np.clip(np.digitize(rs, bins) - 1, 0, 219)
use = inside & (globe > 1.08) & (rs < 2.2)
prof = np.zeros((220, 3), np.float32)
for k in range(220):
    m = use & (which == k)
    if m.sum() > 40:
        prof[k] = np.percentile(sky[m], 30, axis=0)
prof = ndi.gaussian_filter1d(prof, 3, axis=0, mode='nearest')
ring = np.stack([np.interp(rs, (bins[:-1] + bins[1:]) / 2, prof[:, i]) for i in range(3)], -1).astype(np.float32)
band = cv2.morphologyEx(sky[MY + 6:MY + 46, MX:MX + W], cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
row = ndi.gaussian_filter1d(np.median(band, axis=0), 16, axis=0, mode='nearest')
lift = np.exp(np.minimum(hy[:MY], 0) / 110)[..., None]
ring[:MY, MX:MX + W] = ring[:MY, MX:MX + W] * (1 - lift[:, MX:MX + W]) + row[None] * lift[:, MX:MX + W]
edge = np.minimum(np.minimum(hx, W - 1 - hx), np.minimum(hy, H - 1 - hy))
deep = 1 - geo.smooth(1.0, 1.15, rs)
out = (1 - np.clip((edge + 28 - 34 * deep) / (24 + 6 * deep), 0, 1)) * (1 - geo.smooth(1.9, 2.15, rs)) * (1 - geo.smooth(1.3, 1.6, rs) * (hy > 0))
sky = sky * (1 - out[..., None]) + ring * out[..., None]

ARC = ((2050, -32), (1992, -12), (1964, 0), (1942, 70), (1947, 118))
RED = (15, 0.4)
ax0, ay0, ax1, ay1 = 1880, -60, 2090, 150
part = sky[MY + ay0:MY + ay1, MX + ax0:MX + ax1]
ayy, axx = np.mgrid[ay0:ay1, ax0:ax1].astype(np.float32)
near = np.full(part.shape[:2], 1e3, np.float32)
for a, b in zip(ARC[:-1], ARC[1:]):
    a = np.array(a, np.float32)
    b = np.array(b, np.float32)
    ab = b - a
    t = np.clip(((axx - a[0]) * ab[0] + (ayy - a[1]) * ab[1]) / (ab @ ab), 0, 1)
    near = np.minimum(near, np.hypot(axx - a[0] - t * ab[0], ayy - a[1] - t * ab[1]))
flat = cv2.GaussianBlur(cv2.morphologyEx(part, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))), (0, 0), 4)
m = ((1 - geo.smooth(RED[0] * 0.5, RED[0], near)) * (1 - RED[1] * geo.smooth(-6, 6, ayy)))[..., None]
sky[MY + ay0:MY + ay1, MX + ax0:MX + ax1] = part - np.maximum(part - flat, 0) * m
if not DRY:
    np.save(f'{WORK}/sky-hold.npy', sky)
    img = Image.fromarray(geo.coded(sky))
    img.save(f'{OUT}/full/sky-hold.webp', lossless=True, quality=90, method=6)
    img.resize((sky.shape[1] // 2, sky.shape[0] // 2), Image.LANCZOS).save(f'{OUT}/web/sky-hold.webp', lossless=True, quality=90, method=6)

wide = np.stack([cv2.GaussianBlur(streak[..., i], (0, 0), sigmaX=10, sigmaY=SOFT) for i in range(3)], -1)
swell = 1 + 0.18 * np.sin((xx - 1700) / 47.0) * np.sin((xx - 1600) / 131.0)
lens = wide * (geo.smooth(TAPER[0], TAPER[1], xx) * swell * KEEP)[..., None]
np.save(f'{WORK}/streak-lens.npy', lens.astype(np.float32))
img = Image.fromarray(geo.coded(lens * BOOST))
for key, k in ({} if DRY else SIZE).items():
    img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS).save(f'{OUT}/{key}/lens-streak.webp', lossless=True, quality=90, method=6)
half = H / 2
rect = [(x0 - W / 2) / half, (half - y1) / half, (x1 - W / 2) / half, (half - y0) / half]
if not DRY:
    json.dump({'file': 'lens-streak.webp', 'rect': [round(v, 6) for v in rect], 'sun': [round((SUN[0] - W / 2) / half, 6), round((half - SUN[1]) / half, 6)], 'boost': BOOST}, open('src/stops/mercury/streak.json', 'w'), indent=1)
show = lambda v: (geo.coded(v)).astype(np.uint8)
Image.fromarray(np.concatenate([show(crop), show(crop - streak), show(crop - streak + lens), show(streak * 4), show(lens * 4)], 0)).resize(((x1 - x0) * 2, (y1 - y0) * 10), Image.LANCZOS).save(f'{WORK}/streak-check.png')
print('rect', rect, 'raw max', streak.max(axis=(0, 1)).round(4), 'lens max', lens.max(axis=(0, 1)).round(4), 'sum ratio', float(lens.sum() / max(streak.sum(), 1e-6)))
