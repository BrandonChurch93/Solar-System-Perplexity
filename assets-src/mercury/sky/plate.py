import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

CANVAS = sys.argv[1]
FULL = sys.argv[2]
OUT = sys.argv[3]
KEEP = float(sys.argv[4]) if len(sys.argv) > 4 else 0.94
W, H = 2816, 1584
MX, MY = W // 8, H // 8
S = 2480
X0, Y0 = 1450, -1064
SUN = (2690.65, 175.88, 564.41)
SIZE = {'full': 2048, 'web': 1024}

a = np.load(CANVAS)
gen = np.asarray(Image.open(FULL).convert('RGB')).astype(np.float32) / 255
gen = geo.unfilm(geo.to_linear(np.clip(cv2.resize(gen, (S, S), interpolation=cv2.INTER_LANCZOS4), 0, 1))).astype(np.float32)
cx0, cy0 = X0 + MX, Y0 + MY
have = np.zeros((S, S), np.float32)
own = np.zeros((S, S, 3), np.float32)
ys, xs = max(0, -cy0), max(0, -cx0)
ye, xe = min(S, a.shape[0] - cy0), min(S, a.shape[1] - cx0)
own[ys:ye, xs:xe] = a[cy0 + ys:cy0 + ye, cx0 + xs:cx0 + xe]
have[ys:ye, xs:xe] = 1
soft = lambda v, s: cv2.GaussianBlur(v, (0, 0), s)
sh = cv2.phaseCorrelate((own @ geo.LUMA * have).astype(np.float32)[ys:ye, xs:xe].clip(0, 1), (gen @ geo.LUMA).astype(np.float32)[ys:ye, xs:xe].clip(0, 1))
print('shift of the generated part against the canvas', np.round(sh[0], 2), round(sh[1], 3))
gen = cv2.warpAffine(gen, np.float32([[1, 0, -sh[0][0]], [0, 1, -sh[0][1]]]), (S, S), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
cap = 2.5
num = np.stack([soft(np.minimum(own[..., i], cap) * have, 40) for i in range(3)], -1)
den = np.stack([soft(np.minimum(gen[..., i], cap) * have, 40) for i in range(3)], -1)
wgt = soft(have, 40)[..., None]
ratio = np.where(wgt > 0.2, num / np.maximum(den, 1e-6), 0)
valid = (wgt[..., 0] > 0.2).astype(np.uint8)
dist, labels = cv2.distanceTransformWithLabels(1 - valid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
idx = np.zeros(labels.max() + 1, np.int64)
flat = np.flatnonzero(valid)
idx[labels.ravel()[flat]] = flat
near = idx[labels]
ratio = ratio.reshape(-1, 3)[near.ravel()].reshape(S, S, 3)
ratio = np.clip(np.stack([soft(ratio[..., i], 30) for i in range(3)], -1), 0.5, 2.0)
edge = cv2.GaussianBlur(cv2.erode(have, np.ones((49, 49), np.uint8)), (0, 0), 12)[..., None]
whole = own * edge + gen * ratio * (1 - edge)
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
r = np.hypot(xx + X0 - SUN[0], yy + Y0 - SUN[1]) / SUN[2]
T, R = 360, 640
reach = 2.2 * SUN[2]
center = (SUN[0] - X0, SUN[1] - Y0)
polar = cv2.warpPolar(np.minimum(whole, 3.2), (R, T), center, reach, cv2.WARP_POLAR_LINEAR | cv2.INTER_AREA)
low = np.stack([ndi.percentile_filter(polar[..., i], 25, size=(41, 5), mode='wrap') for i in range(3)], -1)
low = np.stack([ndi.gaussian_filter(low[..., i], (10, 3), mode=('wrap', 'nearest')) for i in range(3)], -1)
calm = cv2.warpPolar(low.astype(np.float32), (S, S), center, reach, cv2.WARP_POLAR_LINEAR | cv2.WARP_INVERSE_MAP | cv2.INTER_LINEAR)
code = geo.to_srgb(geo.film(whole)).astype(np.float32)
opened = cv2.morphologyEx(code, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
opened = np.minimum(cv2.GaussianBlur(opened, (0, 0), 2.0), code + 0.004)
stars = geo.smooth(1.1, 1.2, r)[..., None]
clean = geo.unfilm(geo.to_linear(code * (1 - stars) + opened * stars))
far = geo.smooth(1.2, 1.34, r)[..., None]
clean = clean * (1 - far) + np.minimum(calm, clean + 0.02) * far
floor = np.median(calm[(r > 1.95) & (r < 2.1)], axis=0)
print('floor at the border', floor.round(4))
fade = (1 - geo.smooth(1.6, 2.05, r))[..., None]
plate = np.maximum(clean - floor * geo.smooth(1.2, 1.8, r)[..., None], 0) * fade * KEEP
np.save('out/work/mercury/sun-plate.npy', plate.astype(np.float32))
img = Image.fromarray(geo.coded(plate))
for key, n in SIZE.items():
    img.resize((n, n), Image.LANCZOS).save(f'{OUT}/{key}/sun-plate.webp', lossless=True, quality=90, method=6)
img.resize((1024, 1024), Image.LANCZOS).save('out/work/mercury/sun-plate-small.jpg', quality=90)
f = (H / 2) / np.tan(np.radians(15))
rect = [(X0 - W / 2) / f, -(Y0 + S - H / 2) / f, (X0 + S - W / 2) / f, -(Y0 - H / 2) / f]
json.dump({'file': 'sun-plate.webp', 'rect': [round(v, 6) for v in rect], 'keep': KEEP, 'sunPixel': SUN[:2], 'sunRadiusPx': SUN[2], 'disc': round(SUN[2] / S, 6)}, open('src/stops/mercury/sunplate.json', 'w'), indent=1)
print('rect', rect)
