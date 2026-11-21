import sys
import cv2
import numpy as np
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/venus')
from geo import *

src = load(WORK + '/hero-5632.png')
h, w = src.shape[:2]
lin = scene(src)
lum = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
d = rays(w, h)
ok, p = hit(d)
ndl = p @ SUN
small = cv2.resize(lin, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
ls = small @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
med = cv2.resize(ndi.median_filter(ls, size=41), (w, h), interpolation=cv2.INTER_LINEAR)
ratio = small[..., 2] / np.maximum(small[..., 0], 1e-4)
rmed = cv2.resize(ndi.median_filter(ratio, size=41), (w, h), interpolation=cv2.INTER_LINEAR)
br = lin[..., 2] / np.maximum(lin[..., 0], 1e-4)
BOXES = [(1440, 1105, 1570, 1190), (1610, 1085, 1695, 1145), (1680, 1125, 1740, 1200), (1780, 612, 1810, 640)]
inbox = np.zeros((h, w), bool)
for x0, y0, x1, y1 in BOXES:
    inbox[y0 * 2:y1 * 2, x0 * 2:x1 * 2] = True
core = ok & inbox & (lum > 1.7 * med + 0.008)
region = np.clip(ndi.gaussian_filter(ndi.binary_dilation(core, iterations=30).astype(np.float32), 18) * 1.6, 0, 1)
hard = (region > 0.05).astype(np.uint8) * 255
tint = np.array([1.0, 0.92, 1.1], dtype=np.float32)
e = np.where(region > 0, np.clip((lin[..., 2] - rmed * lin[..., 0]) / np.maximum(1.1 - rmed, 0.3), 0, None), 0) * region
first = np.maximum(lin - e[..., None] * tint, lin * 0.04)
thin = ndi.binary_dilation(core, iterations=4).astype(np.uint8) * 255
img8 = (np.clip(encode(first), 0, 1) * 255 + 0.5).astype(np.uint8)
fill = cv2.inpaint(cv2.cvtColor(img8, cv2.COLOR_RGB2BGR), thin, 7, cv2.INPAINT_TELEA)
fill = cv2.cvtColor(fill, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
soft = ndi.gaussian_filter((thin > 0).astype(np.float32), 2)[..., None]
clean_lin = np.minimum(first * (1 - soft) + scene(fill) * soft, lin)
emis = np.maximum(lin - clean_lin, 0)
clean = encode(clean_lin).astype(np.float32)
save(clean, WORK + '/wrap/hero-clean.png')
np.save(WORK + '/wrap/hero-emis.npy', emis.astype(np.float16))
lab2, n2 = ndi.label(hard > 0)
cells = []
for i in range(1, n2 + 1):
    m = lab2 == i
    e = emis[m].sum()
    if e < 1:
        continue
    cy, cx = ndi.center_of_mass(emis.sum(-1) * m)
    pb = body(p[int(cy), int(cx)])
    lon, lat = dir_lonlat(pb)
    yy, xx = np.nonzero(m)
    cells.append(dict(x=float(cx) / 2, y=float(cy) / 2, lon=float(lon), lat=float(lat), energy=float(e), box=[int(xx.min()), int(yy.min()), int(xx.max()), int(yy.max())]))
    print(cells[-1])
json.dump(cells, open(WORK + '/wrap/lightning-cells.json', 'w'), indent=1)
x0, y0, x1, y1 = 2800, 1900, 3600, 2500
a = np.concatenate([src[y0:y1, x0:x1], clean[y0:y1, x0:x1], encode(emis[y0:y1, x0:x1] * 3)], 1)
save(cv2.resize(a, (a.shape[1] * 2 // 3, a.shape[0] * 2 // 3), interpolation=cv2.INTER_AREA), WORK + '/wrap/lightning-check.jpg', 90)
