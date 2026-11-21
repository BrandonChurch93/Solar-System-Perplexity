import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
from geo import lc

Image.MAX_IMAGE_PIXELS = None
DEM = 'references/cache/mercury/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif'
OUT = sys.argv[1]
W, H = 4096, 2048
CACHE = 'out/work/mercury/dem-4096.npy'
LIMB = (0.2, 0.42)
NIGHT = (-0.14, -0.03)

if os.path.exists(CACHE):
    dem = np.load(CACHE)
else:
    src = np.memmap(DEM, dtype='<i2', mode='r', offset=92981, shape=(11520, 23040))
    parts = []
    step = 1440
    for y0 in range(0, 11520, step):
        band = np.asarray(src[y0:y0 + step]).astype(np.float32)
        band[band < -30000] = 0
        parts.append(cv2.resize(band, (W, step * H // 11520), interpolation=cv2.INTER_AREA))
    dem = np.concatenate(parts, 0)
    np.save(CACHE, dem)
print('dem metres', float(dem.min()), float(dem.max()), dem.shape)
pad = np.concatenate([dem[:, -64:], dem, dem[:, :64]], 1)
low = geo.blur(pad, 40)[:, 64:-64]
fine = geo.blur(pad, 0.7)[:, 64:-64]
hw, hh = 1408, 792
g = lc.geometry(geo.FIT, hw, hh)
keep = (geo.smooth(LIMB[0], LIMB[1], g['mu']) * geo.smooth(NIGHT[0], NIGHT[1], g['ndl']) * g['hit']).astype(np.float32)
d = geo.directions(W, H)
px, py, mu, ndl = geo.hero_view(d, hw, hh)
inside = (mu > 0.05) & (px > 1) & (px < hw - 2) & (py > 1) & (py < hh - 2)
k = cv2.remap(keep, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * inside
out = low + (fine - low) * (1 - k)
lo, hi = float(out.min()), float(out.max())
code = np.round((out - lo) / (hi - lo) * 65535).astype('<u2')
os.makedirs(f'{OUT}/full', exist_ok=True)
os.makedirs(f'{OUT}/web', exist_ok=True)
code.tofile(f'{OUT}/full/wrap-height.bin')
cv2.resize(code, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype('<u2').tofile(f'{OUT}/web/wrap-height.bin')
json.dump({'minMetres': lo, 'maxMetres': hi, 'radiusMetres': 2439400}, open('assets-src/mercury/wrap/height-range.json', 'w'), indent=1)
gx = np.gradient(out, axis=1)
Image.fromarray(np.clip(128 + gx * 0.35, 0, 255).astype(np.uint8)).resize((2048, 1024), Image.LANCZOS).save('out/work/mercury/height-shade.jpg', quality=88)
print('written', lo, hi, 'hero share', float(k.mean()))
