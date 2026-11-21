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

Image.MAX_IMAGE_PIXELS = None

FULL = (2816, 1584)
MARGIN = 0.125
GLOW_TOP = 0.012
AZIMUTH = np.radians(80)
MAP = (512, 64)
CUT = 0.06
GLOW_SMOOTH = (45, 41, 5)
LIVE = 'out/work/nep/r3/live-u.png'
REACH = 30
EDGE = (20, 12)
NARROW = 1.5
ZONE_OUT = (90, 352)
RAGGED = (70, 90, 1.2)
SEED = 7
ZONE_UNDER = (2.5, 8.0)
GEN_IN = 'out/work/nep/r3/sky-ext-in.jpg'
GEN = 'out/work/nep/r3/sky-ext.png'
ASK = (3072, 1728)
SPARSE = 0.004
LOCK_MAX = 4.0
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
    g = ndi.gaussian_filter(ndi.percentile_filter(g, GLOW_SMOOTH[0], size=(1, GLOW_SMOOTH[1]), mode='nearest'), (0.5, GLOW_SMOOTH[2]), mode='nearest')
    gmap[..., c] = g
png = (to_srgb(film(gmap)) * 255 + 0.5).astype(np.uint8)
for key in ('full', 'web'):
    Image.fromarray(png[::-1]).save(f'{OUT}/{key}/close-glow.png')

back = unfilm(to_linear(png.astype(np.float32) / 255))
mu = np.clip(u * MAP[0] - 0.5, 0, MAP[0] - 1).astype(np.float32)
mv = np.clip(v * MAP[1] - 0.5, 0, MAP[1] - 1).astype(np.float32)
glow = cv2.remap(back.astype(np.float32), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
glow *= ((v >= 0) & (v < 1))[..., None] * (1 - step(v, 0.8, 1.0))[..., None]
for lo_u, hi_u in ((0.0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)):
    m = above & (v > 0.03) & (v < 0.25) & (xs >= lo_u * w) & (xs < hi_u * w)
    if m.any():
        print('glow against the image, columns', lo_u, hi_u, 'ratio', float((glow[m][:, 2] + base[2]).mean() / smooth[m][:, 2].mean()))
sky = np.maximum(a - glow, 0)
flat = np.stack([low(sky[..., c], 3) for c in range(3)], -1)
stars = np.maximum(sky - flat, 0) * step(v, 0.0, 0.05)[..., None]
clear = (above & (v > 0.3)).astype(np.float32)
far_flat = np.stack([ndi.gaussian_filter(flat[..., c] * clear, 30) for c in range(3)], -1) / np.maximum(ndi.gaussian_filter(clear, 30), 1e-4)[..., None]
k = step(v, 0.12, 0.34)[..., None]
sky = (far_flat + stars) * (1 - k) + sky * k

alpha = np.radians(cgeo.FIT['alphaDeg']) + np.radians(CUT)
theta = np.arccos(np.clip(d @ cgeo.NADIR, -1, 1))
above = theta > alpha

px_m, py_m = round(w * MARGIN), round(h * MARGIN)
cw, ch = w + 2 * px_m, h + 2 * py_m
live = np.asarray(Image.open(LIVE).convert('RGB').resize((cw, ch), Image.LANCZOS)).astype(np.float32) / 255
live = to_linear(live).astype(np.float32)
live_bg = np.stack([low(live[..., c], 5) for c in range(3)], -1)
live_stars = np.maximum(live - live_bg, 0)

cy, cx = np.mgrid[0:ch, 0:cw]
dc = np.stack([(2 * (cx + 0.5) / cw - 1) * cgeo.TX * (1 + 2 * MARGIN), (1 - 2 * (cy + 0.5) / ch) * cgeo.TY * (1 + 2 * MARGIN), -np.ones(cx.shape)], -1)
dc /= np.linalg.norm(dc, axis=-1, keepdims=True)
under = np.degrees(alpha - np.arccos(np.clip(dc @ cgeo.NADIR, -1, 1))).astype(np.float32)
away = np.maximum.reduce([py_m - cy, cy - (py_m + h - 1), px_m - cx, cx - (px_m + w - 1), np.zeros_like(cy)]).astype(np.float32)
del dc
own = np.zeros((ch, cw), bool)
own[py_m:py_m + h, px_m:px_m + w] = above
mine = np.zeros((ch, cw, 3), np.float32)
mine[py_m:py_m + h, px_m:px_m + w] = np.where(above[..., None], sky, far_flat)
calm = np.stack([low(mine[..., c], 6) for c in range(3)], -1) * own[..., None]
inner = ndi.binary_erosion(own, iterations=8)
nearest = ndi.distance_transform_edt(~inner, return_distances=False, return_indices=True)
inside = np.maximum(ndi.gaussian_filter(inner.astype(np.float32), EDGE[0]), 1e-4)


def outward(x):
    near = ndi.gaussian_filter(x * inner, EDGE[0]) / inside
    return ndi.gaussian_filter(near[nearest[0], nearest[1]], EDGE[1])


ext = np.stack([outward(calm[..., c]) for c in range(3)], -1)
level = np.stack([np.median(far_flat[..., c][above]) for c in range(3)]).astype(np.float32)
ragged = ndi.gaussian_filter(np.random.default_rng(SEED).standard_normal((ch // 8, cw // 8)).astype(np.float32), RAGGED[1] / 8)
ragged = cv2.resize(ragged / np.abs(ragged).max(), (cw, ch), interpolation=cv2.INTER_CUBIC)
to_live = np.maximum(step(away + ragged * RAGGED[0], ZONE_OUT[0], ZONE_OUT[1]), step(under + ragged * RAGGED[2], ZONE_UNDER[0], ZONE_UNDER[1]))
to_live[own] = 0
if not os.path.exists(GEN):
    ask = to_srgb(film(np.where(own[..., None], mine, live)))
    ask[~own & (to_live < 1)] = (1, 0, 1)
    Image.fromarray((ask * 255 + 0.5).astype(np.uint8)).resize(ASK, Image.LANCZOS).save(GEN_IN, quality=96)
    print('wrote', GEN_IN, 'generate', GEN, 'from it, then run again')
    sys.exit(0)
gen = np.asarray(Image.open(GEN).convert('RGB').resize((cw, ch), Image.LANCZOS)).astype(np.float32) / 255
ref = to_srgb(film(mine)).astype(np.float32)
grey = lambda x: cv2.GaussianBlur(x.mean(-1), (0, 0), 2)
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(grey(ref), grey(gen), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), own.astype(np.uint8), 5)
gen = cv2.warpAffine(gen, warp, (cw, ch), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
gen = unfilm(to_linear(np.clip(gen, 0, 1))).astype(np.float32)
gen_calm = np.stack([low(gen[..., c], 6) for c in range(3)], -1)
gen_low = np.stack([ndi.gaussian_filter(gen_calm[..., c], REACH) for c in range(3)], -1)
LUM = np.array([0.3, 0.5, 0.2], np.float32)
gen_mid = (gen_calm - gen_low) * np.clip((ext @ LUM) / np.maximum(gen_low @ LUM, 1e-6), 0, 2)[..., None]
gen_fine = np.maximum(gen - gen_calm, 0)
lum_g = gen_fine @ LUM
gen_fine *= (np.power(lum_g / np.maximum(ndi.maximum_filter(lum_g, 9), 1e-6), NARROW) * lum_g / (lum_g + SPARSE))[..., None]
energy = outward((np.maximum(mine - calm, 0) @ LUM) * own)
lock = np.clip(energy / np.maximum(ndi.gaussian_filter(gen_fine @ LUM, REACH), 1e-6), 0, LOCK_MAX)
print('generated sky registered', round(float(cc), 4), 'star light of the approved image over the generated, median in the zone', round(float(np.median(lock[~own & (to_live < 1)])), 3))
keep = (1 - to_live)[..., None]
zone = np.maximum(ext * keep + live_bg * (1 - keep) + (gen_mid + gen_fine * lock[..., None]) * keep, 0) + live_stars * (1 - keep)
wide = np.where(own[..., None], mine, zone)
print('sky level of the approved image', (to_srgb(film(level)) * 255).round(1), 'of the live plate', (to_srgb(film(np.median(live_bg[~own], 0))) * 255).round(1))
lin = wide[py_m:py_m + h, px_m:px_m + w]
out = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
for key, k in (('full', 1), ('web', 2)):
    im = out if k == 1 else out.resize((out.size[0] // k, out.size[1] // k), Image.LANCZOS)
    im.save(f'{OUT}/{key}/sky-terrain.webp', lossless=True, quality=90, method=6)
    print(key, im.size, round(os.path.getsize(f'{OUT}/{key}/sky-terrain.webp') / 1e6, 2), 'MB')
Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8)).resize((1760, 990)).save('out/work/nep/terrain/sky-terrain-preview.jpg', quality=88)
Image.fromarray(np.kron(png[::-1], np.ones((4, 2, 1), np.uint8))).save('out/work/nep/terrain/glow-preview.png')
