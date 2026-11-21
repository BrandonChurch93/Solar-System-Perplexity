import os
import shutil
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

OUT = sys.argv[1]
WORK = sys.argv[2]
DRY = len(sys.argv) > 3 and sys.argv[3] == '--dry'
S = 2480
X0, Y0 = 1450, -1064
SUN = (2690.65, 175.88, 564.41)
SEAM = (1366, 1064)
REACH = 140
ARC = ((538, 1066), (668, 1004), 26)
SIZE = {'full': 2048, 'web': 1024}

base = f'{WORK}/sun-plate-base.npy'
if not os.path.exists(base):
    shutil.copy(f'{WORK}/sun-plate.npy', base)
plate = np.load(base)
sx, sy = SEAM


def level(a, b):
    r = (np.median(a, axis=0) + 1e-4) / (np.median(b, axis=0) + 1e-4)
    return np.clip(np.stack([ndi.gaussian_filter1d(ndi.median_filter(r[:, i], 31, mode='nearest'), 30, mode='nearest') for i in range(3)], -1), 0.5, 2.0)


top = level(plate[sy + 2:sy + 10, :sx], plate[sy - 10:sy - 2, :sx])
w = geo.smooth(sy - REACH, sy, np.arange(sy - REACH, sy, dtype=np.float32))[:, None, None]
plate[sy - REACH:sy, :sx] *= 1 + (top[None] - 1) * w
side = level(plate[sy:, sx - 10:sx - 2].transpose(1, 0, 2), plate[sy:, sx + 2:sx + 10].transpose(1, 0, 2))
w = (1 - geo.smooth(sx, sx + REACH, np.arange(sx, sx + REACH, dtype=np.float32)))[None, :, None]
plate[sy:, sx:sx + REACH] *= 1 + (side[:, None] - 1) * w
for a in (plate[sy - 3:sy + 3, :sx], plate[sy:, sx - 3:sx + 3]):
    a[:] = np.stack([cv2.GaussianBlur(a[..., i], (0, 0), 1.2) for i in range(3)], -1)

center = (SUN[0] - X0, SUN[1] - Y0)
T, R = 360, 640
reach = 2.2 * SUN[2]
polar = cv2.warpPolar(plate, (R, T), center, reach, cv2.WARP_POLAR_LINEAR | cv2.INTER_AREA)
low = np.stack([ndi.percentile_filter(polar[..., i], 30, size=(41, 5), mode='wrap') for i in range(3)], -1)
low = np.stack([ndi.gaussian_filter(low[..., i], (8, 2), mode=('wrap', 'nearest')) for i in range(3)], -1)
calm = cv2.warpPolar(low.astype(np.float32), (S, S), center, reach, cv2.WARP_POLAR_LINEAR | cv2.WARP_INVERSE_MAP | cv2.INTER_LINEAR)
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
a = np.array(ARC[0], np.float32)
b = np.array(ARC[1], np.float32)
ab = b - a
t = np.clip(((xx - a[0]) * ab[0] + (yy - a[1]) * ab[1]) / (ab @ ab), 0, 1)
d = np.hypot(xx - a[0] - t * ab[0], yy - a[1] - t * ab[1]) / ARC[2]
m = ((1 - geo.smooth(0.6, 1.0, d)) * (yy < sy))[..., None]
plate = plate * (1 - m) + np.minimum(plate, calm) * m

if not DRY:
    np.save(f'{WORK}/sun-plate.npy', plate.astype(np.float32))
    img = Image.fromarray(geo.coded(plate))
    for key, n in SIZE.items():
        img.resize((n, n), Image.LANCZOS).save(f'{OUT}/{key}/sun-plate.webp', lossless=True, quality=90, method=6)
old = np.load(base, mmap_mode='r')
box = (slice(760, 1300), slice(300, 1500))
Image.fromarray(np.concatenate([geo.coded(np.asarray(old[box])), geo.coded(plate[box])], 0)).save(f'{WORK}/sunfix-check.jpg', quality=92)
print('top', top.mean(0).round(3), 'side', side.mean(0).round(3))
