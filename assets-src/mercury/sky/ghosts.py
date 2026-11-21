import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

HERO = 'references/approved/mercury-hero.png'
OUT = sys.argv[1]
WORK = sys.argv[2]
W, H = 2816, 1584
BOX = (340, 820, 1240, 1360)
SUN = (2690.65, 175.88)
BOOST = 4.0
SIZE = {'full': 1.0, 'web': 0.5}
SPOTS = [
    ('streak', 'capsule', (796, 1006), (1026, 898), 20),
    ('green', 'disc', (865, 1035), 62),
    ('pale', 'disc', (945, 1003), 52),
    ('hex', 'disc', (650, 1150), 74),
    ('dot', 'disc', (1125, 905), 30),
    ('band', 'disc', (760, 1068), 56),
    ('red', 'capsule', (630, 1160), (780, 1225), 26),
    ('comet', 'disc', (462, 1252), 120),
]

hero = geo.load(HERO)
x0, y0, x1, y1 = BOX
pad = 160
crop = hero[y0 - pad:y1 + pad, x0 - pad:x1 + pad]
yy, xx = np.mgrid[y0 - pad:y1 + pad, x0 - pad:x1 + pad].astype(np.float32)
fit = geo.FIT
cx, cy, rad = fit['circle']['cx'], fit['circle']['cy'], fit['circle']['r']
inside = np.hypot(xx - cx, yy - cy) < rad - 14
outside = np.hypot(xx - cx, yy - cy) > rad + 6

def spot(s):
    if s[1] == 'disc':
        return np.hypot(xx - s[2][0], yy - s[2][1]) / s[3]
    a = np.array(s[2], np.float32); b = np.array(s[3], np.float32)
    ab = b - a
    t = np.clip(((xx - a[0]) * ab[0] + (yy - a[1]) * ab[1]) / (ab @ ab), 0, 1)
    return np.hypot(xx - a[0] - t * ab[0], yy - a[1] - t * ab[1]) / s[4]

near = np.min(np.stack([spot(s) for s in SPOTS]), 0)
keep = (near > 1.25).astype(np.float32)
code = crop.copy()
opened = cv2.morphologyEx(code, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
calm = np.where(outside[..., None], np.minimum(cv2.GaussianBlur(opened, (0, 0), 1.5), code), code)
lin = geo.unfilm(geo.to_linear(calm))
back = np.zeros_like(lin)
for region in (inside, outside):
    m = keep * region
    num = np.stack([cv2.GaussianBlur(lin[..., i] * m, (0, 0), 45) for i in range(3)], -1)
    den = cv2.GaussianBlur(m, (0, 0), 45)[..., None]
    back = np.where(region[..., None], num / np.maximum(den, 1e-4), back)
diff = lin - back
soft = np.stack([cv2.GaussianBlur(diff[..., i], (0, 0), 1.6) for i in range(3)], -1)
grain = float(np.percentile(np.abs(soft[(near > 1.4) & inside & (near < 3)]), 80))
print('grain of the night side outside the ghosts', round(grain, 5))
ghost = np.maximum(soft - grain, 0)
mask = (1 - geo.smooth(0.85, 1.25, near))[..., None] * (inside | outside)[..., None]
rim = geo.smooth(10, 22, np.abs(np.hypot(xx - cx, yy - cy) - rad + 6))[..., None]
plate = (ghost * mask * rim)[pad:-pad, pad:-pad]
np.save(f'{WORK}/ghost-plate.npy', plate.astype(np.float32))
img = Image.fromarray(geo.coded(plate * BOOST))
for key, k in SIZE.items():
    img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS).save(f'{OUT}/{key}/lens-ghosts.webp', lossless=True, quality=90, method=6)
half = H / 2
rect = [(x0 - W / 2) / half, (half - y1) / half, (x1 - W / 2) / half, (half - y0) / half]
json.dump({'file': 'lens-ghosts.webp', 'rect': [round(v, 6) for v in rect], 'sun': [round((SUN[0] - W / 2) / half, 6), round((half - SUN[1]) / half, 6)], 'boost': BOOST}, open('src/stops/mercury/lens.json', 'w'), indent=1)
show = np.clip(geo.to_srgb(geo.film(plate * 6)) * 255, 0, 255).astype(np.uint8)
base = (np.clip(crop[pad:-pad, pad:-pad] * 6, 0, 1) * 255).astype(np.uint8)
gone = np.clip(geo.to_srgb(geo.film(np.maximum(lin[pad:-pad, pad:-pad] - plate, 0))) * 6, 0, 1)
Image.fromarray(np.concatenate([base, show, (gone * 255).astype(np.uint8)], 0)).save(f'{WORK}/ghost-check.jpg', quality=92)
print('rect', rect, 'max', plate.max())
