import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

OWN, FILLED, BASE, PLATE, OUT = sys.argv[1:6]
FIX = sys.argv[6:8] if len(sys.argv) > 7 else None
W, H = 2816, 1584
MX, MY = W // 8, H // 8
X0, Y0 = 1450, -1064
c = geo.FIT['circle']


def frame(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    return geo.unfilm(geo.to_linear(np.clip(cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC), 0, 1))).astype(np.float32)


def soft(v, s):
    return cv2.GaussianBlur(v, (0, 0), s)


def calm(v, size=9):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))
    return cv2.morphologyEx(v, cv2.MORPH_OPEN, k)


own = np.load(OWN)
filled = np.load(FILLED)
CH, CW = own.shape[:2]
plate = np.zeros_like(own)
sun = np.load(PLATE)
px0, py0 = X0 + MX, Y0 + MY
ys, xs = max(0, -py0), max(0, -px0)
ye, xe = min(sun.shape[0], CH - py0), min(sun.shape[1], CW - px0)
plate[py0 + ys:py0 + ye, px0 + xs:px0 + xe] = sun[ys:ye, xs:xe]
yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
d = np.hypot(xx - MX + 0.5 - c['cx'], yy - MY + 0.5 - c['cy']) / c['r']
inner = (slice(MY, MY + H), slice(MX, MX + W))
extra = frame(BASE) - plate[inner]
seen = (d[inner] > 1.02).astype(np.float32)
num = np.stack([soft(extra[..., i] * seen, 24) for i in range(3)], -1)
den = soft(seen, 24)[..., None]
spread = num / np.maximum(den, 1e-3)
valid = (den[..., 0] > 0.05).astype(np.uint8)
_, labels = cv2.distanceTransformWithLabels(1 - valid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
idx = np.zeros(labels.max() + 1, np.int64)
flat = np.flatnonzero(valid)
idx[labels.ravel()[flat]] = flat
spread = spread.reshape(-1, 3)[idx[labels].ravel()].reshape(H, W, 3)
behind = (1 - geo.smooth(1.0, 1.05, d[inner]))[..., None]
glow = extra * (1 - behind) + np.stack([soft(spread[..., i], 16) for i in range(3)], -1) * behind
edge = np.minimum(np.minimum(xx[inner] - MX, MX + W - 1 - xx[inner]), np.minimum(yy[inner] - MY, MY + H - 1 - yy[inner]))
rim = (1 - geo.smooth(0, 32, edge))[..., None]
glow = glow * (1 - rim) + np.stack([soft(glow[..., i], 12) for i in range(3)], -1) * rim
glow = np.pad(glow, ((MY, MY), (MX, MX), (0, 0)), mode='edge')
near = (geo.smooth(1.012, 1.03, d) * (1 - geo.smooth(1.2, 1.32, d)))[..., None]
stars = np.maximum(own - calm(own), 0)
sky = filled * (1 - near) + (calm(filled) + stars) * near
lin = np.maximum(sky - plate - glow, 0)
if FIX:
    hero = geo.scene(FIX[0])
    film = frame(FIX[1])
    off = (d[inner] > 1.06).astype(np.float32)
    diff = np.clip(hero - film, -0.05, 0.05) * off[..., None]
    low = np.stack([soft(diff[..., i], 20) for i in range(3)], -1) / np.maximum(soft(off, 20), 0.2)[..., None]
    low = np.pad(low * off[..., None], ((MY, MY), (MX, MX), (0, 0)), mode='edge')
    lin = np.maximum(lin + low, 0)
    print('second pass', np.abs(low).mean(axis=(0, 1)).round(5))
img = Image.fromarray(geo.coded(lin))
img.save(f'{OUT}/full/sky-hold.webp', lossless=True, quality=90, method=6)
img.resize((CW // 2, CH // 2), Image.LANCZOS).save(f'{OUT}/web/sky-hold.webp', lossless=True, quality=90, method=6)
img.resize((1760, 990), Image.LANCZOS).save('out/work/mercury/sky-hold-small.jpg', quality=90)
np.save('out/work/mercury/sky-hold.npy', lin.astype(np.float32))
print('patch median', np.median(lin, axis=(0, 1)).round(4), 'share at the floor', float((lin.max(axis=-1) <= 0).mean().round(4)))
