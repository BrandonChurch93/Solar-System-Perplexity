import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'terrain'))
import cgeo
from deblock import deblock
from patch import film, unfilm, to_linear, to_srgb, step

FULL = (2816, 1584)
MARGIN = 0.125
GLOW_TOP = 0.012
AZIMUTH = np.radians(80)
MAP = (512, 64)
CUT = 0.06
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'


def low(v, s=5):
    return ndi.gaussian_filter(np.minimum(v, ndi.gaussian_filter(v, s)), s)


img = np.asarray(Image.open(cgeo.CLOSE).convert('RGB')).astype(np.float32) / 255
a = unfilm(to_linear(np.clip(deblock(img), 0, 1)))
w, h = FULL
ys, xs = np.mgrid[0:h, 0:w]
d = np.stack([(2 * (xs + 0.5) / w - 1) * cgeo.TX, (1 - 2 * (ys + 0.5) / h) * cgeo.TY, -np.ones(xs.shape)], -1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
rt = cgeo.tangent(d)
up = -cgeo.NADIR
north = np.array([0, 0, -1.0]) + up * up[2]
north /= np.linalg.norm(north)
east = np.cross(north, up)
az = np.arctan2(d @ east, d @ north)
v = (rt - 1) / GLOW_TOP
above = (rt > 1) | (d @ cgeo.NADIR <= 0)

smooth = np.stack([low(a[..., c], 4) for c in range(3)], -1)
far = above & (v > 1.2) & (v < 3.0)
base = np.array([np.median(smooth[..., c][far]) for c in range(3)])
u = az / AZIMUTH + 0.5
print('azimuth range of the image', np.degrees(az[above].min()), np.degrees(az[above].max()), 'sky base', base)
gmap = np.zeros((MAP[1], MAP[0], 3), np.float32)
cnt = np.zeros((MAP[1], MAP[0]), np.float32)
sel = above & (v >= 0) & (v < 1) & (u >= 0) & (u < 1)
iu = np.clip((u[sel] * MAP[0]).astype(int), 0, MAP[0] - 1)
iv = np.clip((v[sel] * MAP[1]).astype(int), 0, MAP[1] - 1)
taper = 1 - step(v[sel], 0.6, 1.0)
val = np.maximum(smooth[sel] - base, 0) * taper[:, None]
for c in range(3):
    np.add.at(gmap[..., c], (iv, iu), val[:, c])
np.add.at(cnt, (iv, iu), 1)
have = cnt > 0
gmap[have] /= cnt[have][:, None]
cols = have.any(axis=0)
first, last = np.argmax(cols), len(cols) - 1 - np.argmax(cols[::-1])
for c in range(3):
    g = gmap[..., c]
    wgt = have.astype(np.float32)
    g = ndi.gaussian_filter(g * wgt, (0.7, 3)) / np.maximum(ndi.gaussian_filter(wgt, (0.7, 3)), 1e-4)
    g[:, :first + 4] = g[:, first + 4:first + 5]
    g[:, last - 3:] = g[:, last - 4:last - 3]
    g = ndi.gaussian_filter(ndi.percentile_filter(g, 30, size=(1, 141), mode='nearest'), (0.5, 14), mode='nearest')
    gmap[..., c] = g
png = (to_srgb(film(gmap)) * 255 + 0.5).astype(np.uint8)
for key in ('full', 'web'):
    Image.fromarray(png[::-1]).save(f'{OUT}/{key}/close-glow.png')

back = unfilm(to_linear(png.astype(np.float32) / 255))
mu = np.clip(u * MAP[0] - 0.5, 0, MAP[0] - 1).astype(np.float32)
mv = np.clip(v * MAP[1] - 0.5, 0, MAP[1] - 1).astype(np.float32)
glow = cv2.remap(back.astype(np.float32), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
glow *= ((v >= 0) & (v < 1))[..., None] * (1 - step(v, 0.8, 1.0))[..., None]
sky = np.maximum(a - glow, 0)
flat = np.stack([low(sky[..., c], 3) for c in range(3)], -1)
stars = np.maximum(sky - flat, 0) * step(v, 0.0, 0.05)[..., None]
clear = (above & (v > 0.3)).astype(np.float32)
far_flat = np.stack([ndi.gaussian_filter(flat[..., c] * clear, 30) for c in range(3)], -1) / np.maximum(ndi.gaussian_filter(clear, 30), 1e-4)[..., None]
k = step(v, 0.12, 0.34)[..., None]
sky = far_flat * (1 - k) + flat * k + stars

alpha = np.radians(cgeo.FIT['alphaDeg']) + np.radians(CUT)
theta = np.arccos(np.clip(d @ cgeo.NADIR, -1, 1))
above = theta > alpha
mirror = 2 * alpha - theta
horiz = d - (d @ cgeo.NADIR)[..., None] * cgeo.NADIR
horiz /= np.maximum(np.linalg.norm(horiz, axis=-1, keepdims=True), 1e-6)
md = np.cos(mirror)[..., None] * cgeo.NADIR + np.sin(mirror)[..., None] * horiz
px = ((md[..., 0] / -md[..., 2]) / cgeo.TX + 1) / 2 * w - 0.5
py = (1 - (md[..., 1] / -md[..., 2]) / cgeo.TY) / 2 * h - 0.5
src = np.where(above[..., None], sky, 0).astype(np.float32)
bad = (md[..., 2] > -0.2) | (px < -w) | (px > 2 * w) | (py < -h) | (py > 2 * h)
px = np.where(bad, xs, px)
py = np.where(bad, np.abs(((ys + 0.37 * h) % (0.74 * h)) - 0.37 * h) * 0.5, py)
fill = cv2.remap(src, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)
fill = np.where((fill.sum(-1) <= 0)[..., None], np.asarray(base, np.float32), fill)
lin = np.where(above[..., None], sky, fill)

px_m, py_m = round(w * MARGIN), round(h * MARGIN)
wide = np.pad(lin, ((py_m, py_m), (px_m, px_m), (0, 0)), mode='symmetric')
out = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
for key, k in (('full', 1), ('web', 2)):
    im = out if k == 1 else out.resize((out.size[0] // k, out.size[1] // k), Image.LANCZOS)
    im.save(f'{OUT}/{key}/sky-terrain.webp', lossless=True, quality=90, method=6)
    print(key, im.size, round(os.path.getsize(f'{OUT}/{key}/sky-terrain.webp') / 1e6, 2), 'MB')
Image.fromarray((to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8)).resize((1408, 792)).save('out/work/nep/terrain/sky-terrain-preview.jpg', quality=88)
Image.fromarray(np.kron(png[::-1], np.ones((4, 2, 1), np.uint8))).save('out/work/nep/terrain/glow-preview.png')
