import sys

import cv2
import numpy as np

from common import FIT, WORK, blur, decode, encode, lc, limb_at, load, moon_mask, save, smooth, wrap_to_hero

SRC = sys.argv[1]
WW = int(sys.argv[2])
OUT = sys.argv[3]
WH = WW // 2
C = np.load(f'{WORK}/curve.npy')
L = np.load(f'{WORK}/limb.npy')
hero = load(SRC)
h, w, _ = hero.shape
g = lc.geometry(FIT, w, h)
lit = (lc.curve_at(C, g['ndl']) * limb_at(L, g['mu'])).astype(np.float32)
alb = decode(hero) / np.maximum(lit, 1e-4)
coded = encode(alb).astype(np.float32) / 255
del alb
k = w / 2816
moon = blur((moon_mask(w, h, 8) > 0).astype(np.float32), 3 * k)
light = lc.curve_at(C, g['ndl'])[..., 1]
weight = (g['hit'] * smooth(0.2, 0.42, g['mu']) * smooth(0.035, 0.11, light)).astype(np.float32)
hole = (weight * moon).astype(np.float32)
del g, lit, hero
out = np.zeros((WH, WW, 3), np.uint8)
wout = np.zeros((WH, WW), np.uint8)
mout = np.zeros((WH, WW), np.uint8)
STRIP = 256
for y0 in range(0, WH, STRIP):
    rows = np.arange(y0, min(y0 + STRIP, WH))
    px, py, mu, ndl = wrap_to_hero(WW, WH, rows, w, h)
    inside = (mu > 0) & (px > 1) & (px < w - 2) & (py > 1) & (py < h - 2)
    c = cv2.remap(coded, px, py, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    a = cv2.remap(weight, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * inside
    m = cv2.remap(hole, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * inside
    out[rows] = np.round(np.clip(c, 0, 1) * 255).astype(np.uint8)
    wout[rows] = np.round(a * 255).astype(np.uint8)
    mout[rows] = np.round(m * 255).astype(np.uint8)
save(f'{OUT}-color.png', out)
save(f'{OUT}-weight.png', wout)
save(f'{OUT}-moon.png', mout)
print('written', OUT)
