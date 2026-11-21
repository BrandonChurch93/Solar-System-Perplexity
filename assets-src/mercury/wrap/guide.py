import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
from geo import lc

CACHE = 'references/cache/mercury'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/work/mercury/guide-8192.png'
SHIFT_DEG = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0

seen = geo.scene('references/approved/mercury-hero.png')
h, w, _ = seen.shape
g = lc.geometry(geo.FIT, w, h)
lit = g['hit'] & (g['ndl'] > 0.3) & (g['mu'] > 0.3)
alb = (seen / np.maximum(geo.shade(g['ndl'], g['mu']), 1e-4))[lit]
ll = np.log(np.maximum(alb @ geo.LUMA, 1e-3))
rg = np.log(np.maximum(alb[:, 0], 1e-3) / np.maximum(alb[:, 1], 1e-3))
bg = np.log(np.maximum(alb[:, 2], 1e-3) / np.maximum(alb[:, 1], 1e-3))
print('hero log lum', ll.mean(), ll.std(), 'rg', rg.mean(), rg.std(), 'bg', bg.mean(), bg.std())

mono = np.asarray(Image.open(f'{CACHE}/messenger-mono-8192.png').convert('L')).astype(np.float32) / 255
color = np.asarray(Image.open(f'{CACHE}/messenger-color-4096.png').convert('RGB')).astype(np.float32) / 255
H, W = mono.shape
hole = (color.min(axis=-1) > 0.97) | (color.max(axis=-1) < 0.02)
hole = cv2.dilate(hole.astype(np.uint8), np.ones((9, 9), np.uint8))
c8 = cv2.inpaint((color * 255).astype(np.uint8), hole, 9, cv2.INPAINT_TELEA).astype(np.float32) / 255
cl = geo.to_linear(c8)
lum = np.maximum(cl @ geo.LUMA, 1e-3)
crg = geo.blur(np.log(np.maximum(cl[..., 0], 1e-3) / np.maximum(cl[..., 1], 1e-3)), 3)
cbg = geo.blur(np.log(np.maximum(cl[..., 2], 1e-3) / np.maximum(cl[..., 1], 1e-3)), 3)
lat = (0.5 - (np.arange(H // 2) + 0.5) / (H // 2)) * 180
band = (np.abs(lat) < 60)
crg = (crg - crg[band].mean()) / crg[band].std() * rg.std() + rg.mean()
cbg = (cbg - cbg[band].mean()) / cbg[band].std() * bg.std() + bg.mean()
polar = geo.smooth(62, 78, np.abs(lat))[:, None]
crg = crg * (1 - polar) + rg.mean() * polar
cbg = cbg * (1 - polar) + bg.mean() * polar
crg = cv2.resize(crg, (W, H), interpolation=cv2.INTER_CUBIC)
cbg = cv2.resize(cbg, (W, H), interpolation=cv2.INTER_CUBIC)
ml = np.log(np.maximum(geo.to_linear(mono), 1e-3))
lowm = cv2.resize(np.log(lum), (W, H), interpolation=cv2.INTER_CUBIC)
detail = ml - geo.blur(ml, 24)
base = geo.blur(lowm, 6)
lat8 = (0.5 - (np.arange(H) + 0.5) / H) * 180
b8 = (np.abs(lat8) < 60)
base = (base - base[b8].mean()) / base[b8].std()
detail = detail / detail[b8].std()
mix = 0.75 * base + 0.65 * detail
mix = (mix - mix[b8].mean()) / mix[b8].std() * ll.std() + ll.mean()
pol8 = geo.smooth(80, 87, np.abs(lat8))[:, None]
mix = mix * (1 - pol8) + ll.mean() * pol8
y = np.exp(mix)
gch = y / (0.2126 * np.exp(crg) + 0.7152 + 0.0722 * np.exp(cbg))
out = np.stack([gch * np.exp(crg), gch, gch * np.exp(cbg)], -1).astype(np.float32)
if SHIFT_DEG:
    out = np.roll(out, int(round(SHIFT_DEG / 360 * W)), axis=1)
Image.fromarray(geo.coded(out)).save(OUT)
Image.fromarray(geo.coded(out)).resize((2048, 1024), Image.LANCZOS).save(OUT.replace('.png', '-small.jpg'), quality=90)
print('written', OUT)
