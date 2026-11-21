import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
sys.path.insert(0, 'assets-src/mercury/sky')
import geo
from deblock import deblock

HERO = 'references/approved/mercury-hero.png'
FILL = sys.argv[1]
WIDE = sys.argv[2]
OUT = sys.argv[3]
W, H = 2816, 1584
MX, MY = W // 8, H // 8
GHOST = (455.0, 1257.0, 70.0)
fit = json.load(open('assets-src/mercury/fit.json'))
c = fit['circle']


def codes(path, size=None, blocks=False):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if size and (a.shape[1], a.shape[0]) != size:
        a = np.clip(cv2.resize(a, size, interpolation=cv2.INTER_LANCZOS4), 0, 1)
    return a


def lin(a):
    return geo.unfilm(geo.to_linear(a)).astype(np.float32)


hero = lin(codes(HERO, blocks=True))
fill = lin(codes(FILL, (W, H), True))
wide_raw = codes(WIDE)
wh, ww = wide_raw.shape[:2]
k = (W + 2 * MX) / ww
tall = int(round(wh * k))
wide = cv2.resize(wide_raw, (W + 2 * MX, tall), interpolation=cv2.INTER_LANCZOS4)
pad = (H + 2 * MY - tall) / 2
top = int(round(pad))
wide = np.pad(wide, ((top, H + 2 * MY - tall - top), (0, 0), (0, 0)), mode='edge')
wide = lin(np.clip(wide, 0, 1))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.hypot(xx + 0.5 - c['cx'], yy + 0.5 - c['cy']) / c['r']
RING = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (1.012, 1.03)
own = geo.smooth(RING[0], RING[1], d)
own *= geo.smooth(GHOST[2] * 0.75, GHOST[2], np.hypot(xx - GHOST[0], yy - GHOST[1]))
ring = (d > RING[1] + 0.03) & (d < RING[1] + 0.32)
soft = lambda v, s: cv2.GaussianBlur(v, (0, 0), s)
cap = 0.25
near = (own > 0.98).astype(np.float32)
num = np.stack([soft(np.minimum(hero[..., i], cap) * near, 40) for i in range(3)], -1)
den = np.stack([soft(np.minimum(fill[..., i], cap) * near, 40) for i in range(3)], -1)
wgt = soft(near, 40)[..., None]
gain = np.array([np.median(hero[..., i][ring]) / max(np.median(fill[..., i][ring]), 1e-6) for i in range(3)])
local = np.where(wgt > 0.05, num / np.maximum(den, 1e-6), gain)
reach = np.clip(wgt / 0.5, 0, 1)
scale = gain * (1 - reach) + np.clip(local, gain * 0.4, gain * 2.5) * reach
print('fill gain', gain.round(3))
inner = hero * own[..., None] + fill * scale * (1 - own[..., None])
core = wide[MY:MY + H, MX:MX + W]
ratio = np.stack([soft(np.minimum(inner[..., i], 2.0), 30) / np.maximum(soft(np.minimum(core[..., i], 2.0), 30), 1e-5) for i in range(3)], -1)
ratio = np.clip(ratio, 0.5, 2.0)
ratio = np.pad(ratio, ((MY, MY), (MX, MX), (0, 0)), mode='edge')
ratio = np.stack([soft(ratio[..., i], 12) for i in range(3)], -1)
full = wide * ratio
full[MY:MY + H, MX:MX + W] = inner
np.save(OUT + '.npy', full.astype(np.float32))
Image.fromarray(geo.coded(full)).save(OUT + '.png')
Image.fromarray(geo.coded(full)).resize((1760, 990), Image.LANCZOS).save(OUT + '-small.jpg', quality=90)
print('written', OUT, full.shape)
