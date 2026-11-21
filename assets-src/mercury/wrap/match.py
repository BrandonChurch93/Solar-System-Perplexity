import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
from geo import lc

SRC, OUT = sys.argv[1], sys.argv[2]
HERO = sys.argv[3] if len(sys.argv) > 3 else 'out/work/mercury/hero-2x.png'
LIMB = (0.2, 0.42)
TONE = 40.0

seen = geo.scene(HERO)
h, w, _ = seen.shape
g = lc.geometry(geo.FIT, w, h)
lit = geo.shade(g['ndl'], g['mu'])
alb = np.clip(seen / np.maximum(lit, 1e-4), 0, 3.0).astype(np.float32)
src = np.asarray(Image.open(SRC).convert('RGB'))
H8, W8 = src.shape[:2]
body = np.stack([np.cos(g['lat']) * np.sin(g['lon']), np.sin(g['lat']), np.cos(g['lat']) * np.cos(g['lon'])], -1).astype(np.float32)
base = geo.decoded(geo.sample_map(src, body))
hit = g['hit'].astype(np.float32)
limb = geo.smooth(LIMB[0], LIMB[1], g['mu']).astype(np.float32) * hit
day = geo.day(seen, g)
m3 = hit[..., None]
ratio_wide = geo.blur(alb * m3, TONE) / np.maximum(geo.blur(base * m3, TONE), 1e-4)
dark = g['hit'] & (g['ndl'] < -0.25) & (g['mu'] > 0.3)
level = float(np.median(alb[dark] @ geo.LUMA) / np.median(base[dark] @ geo.LUMA))
print('night level of the hero against the guide', round(level, 3))
night = base * level
mixed = alb * day[..., None] + night * (1 - day[..., None])
wide = geo.blur(day, 24)[..., None]
tone = (np.clip(ratio_wide, 0.4, 2.5) * wide + level * (1 - wide)).astype(np.float32)
code = geo.to_srgb(geo.film(mixed))
del seen, lit, alb, base, night, mixed, ratio_wide
out = np.zeros((H8, W8, 3), np.uint8)
wsum = 0.0
for y0 in range(0, H8, 256):
    rows = np.arange(y0, min(y0 + 256, H8))
    d = geo.directions(W8, H8, rows)
    px, py, mu, ndl = geo.hero_view(d, w, h)
    inside = (mu > 0.05) & (px > 1) & (px < w - 2) & (py > 1) & (py < h - 2)
    k = (cv2.remap(limb, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * inside)[..., None]
    n = geo.unfilm(geo.to_linear(np.clip(cv2.remap(code, px, py, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE), 0, 1)))
    a = geo.decoded(src[rows])
    reach = geo.smooth(0.03, 0.15, mu)[..., None] * inside[..., None]
    t = cv2.remap(tone, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    a = a * (1 + (t - 1) * reach)
    a = a * (1 - k) + np.maximum(n, 0) * k
    out[rows] = geo.coded(a)
    wsum += float(k.sum())
os.makedirs(f'{OUT}/full', exist_ok=True)
os.makedirs(f'{OUT}/web', exist_ok=True)
Image.fromarray(out).save(f'{OUT}/full/wrap-color.jpg', quality=93, subsampling=0)
Image.fromarray(cv2.resize(out, (W8 // 2, H8 // 2), interpolation=cv2.INTER_AREA)).save(f'{OUT}/web/wrap-color.jpg', quality=93, subsampling=0)
Image.fromarray(cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA)).save('out/work/mercury/wrap-small.jpg', quality=90)
print('written, hero share of map', wsum / (H8 * W8))
