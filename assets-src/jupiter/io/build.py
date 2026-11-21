import json
import sys

import cv2
import numpy as np
from scipy import ndimage as ndi

fit = json.load(open('assets-src/jupiter/fit.json'))
HOME = np.array([0.136771, -0.233998, 1.028363])
RADIUS = 0.057637
SUN = np.array([-0.713344, 0.254075, 0.653136])
GAIN, AMBIENT, WRAP, POWER = 2.0, 0.01, 0.15, 1.0
W, H = 2816, 1584
MW, MH = 2048, 1024


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    kk = 0.59 * y - 0.03
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def wrapblur(a, s):
    return ndi.gaussian_filter(a, (s, s) + (0,) * (a.ndim - 2), mode=('nearest', 'wrap') + ('nearest',) * (a.ndim - 2))


cam = np.array(fit['camera']['position'])
f = H / 2 / np.tan(np.radians(fit['vfovDeg'] / 2))
hero = cv2.imread('out/work/jupiter/hero2x.png')[..., ::-1].astype(np.float32) / 255
gen = cv2.imread(sys.argv[1])[..., ::-1].astype(np.float32) / 255
gen = cv2.resize(gen, (MW, MH), interpolation=cv2.INTER_AREA)

v, u = np.mgrid[0:MH, 0:MW]
lon = ((u + 0.5) / MW - 0.5) * 2 * np.pi
lat = (0.5 - (v + 0.5) / MH) * np.pi
d = np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)
p = HOME + RADIUS * d
to = cam - p
to /= np.linalg.norm(to, axis=-1, keepdims=True)
mu = (d * to).sum(-1)
px = (W / 2 + f * (p[..., 0] - cam[0]) / (cam[2] - p[..., 2])) * 2
py = (H / 2 - f * (p[..., 1] - cam[1]) / (cam[2] - p[..., 2])) * 2
seen = unfilm(to_linear(cv2.remap(hero, px.astype(np.float32), py.astype(np.float32), cv2.INTER_CUBIC)))
sun = SUN / np.linalg.norm(SUN)
lit = np.clip((d @ sun + WRAP) / (1 + WRAP), 0, 1) ** POWER
albedo = to_srgb(film(seen / (GAIN * lit + AMBIENT)[..., None]))
w = step(mu, 0.2, 0.32) * step(lit, 0.25, 0.5)
w = np.minimum(w, wrapblur(w, 6))[..., None]

mean_a = (albedo * w).sum((0, 1)) / w.sum()
std_a = np.sqrt((((albedo - mean_a) ** 2) * w).sum((0, 1)) / w.sum())
area = np.cos(lat)[..., None]
mean_g = (gen * area).sum((0, 1)) / area.sum()
std_g = np.sqrt((((gen - mean_g) ** 2) * area).sum((0, 1)) / area.sum())
print('hero albedo mean', mean_a.round(3), 'std', std_a.round(3), 'generated mean', mean_g.round(3), 'std', std_g.round(3))
graded = np.clip((gen - mean_g) * (std_a / std_g) + mean_a, 0, 1)
seam = np.minimum(np.arange(MW) + 0.5, MW - 0.5 - np.arange(MW))
over = step(1 - seam / 140, 0, 1)[None, :, None]
graded = graded * (1 - over) + np.roll(graded, MW // 2, axis=1) * over
S = 40
low = wrapblur((albedo - graded) * w, S) / np.maximum(wrapblur(w, S), 1e-3)
reach = step(wrapblur(w, S), 0.0, 0.25)
out = np.clip(albedo * w + (graded + low * reach) * (1 - w), 0, 1)
for key, size in (('full', (MW, MH)), ('web', (MW // 2, MH // 2))):
    img = out if size == (MW, MH) else cv2.resize(out, size, interpolation=cv2.INTER_AREA)
    cv2.imwrite(f'public/assets/jupiter/{key}/io-color.jpg', (img[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 93])
cv2.imwrite('out/work/view/iomap_built.jpg', (out[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
