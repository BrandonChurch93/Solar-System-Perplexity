import cv2
import numpy as np

from common import WORK, blur, load, save

col = cv2.resize(load(f'{WORK}/eq8k-color.png'), (4096, 2048), interpolation=cv2.INTER_AREA).astype(np.float32)
wgt = cv2.resize(load(f'{WORK}/eq8k-weight.png')[..., 0], (4096, 2048), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
H, W, _ = col.shape
moon = np.zeros((H, W), np.float32)
yy, xx = np.mgrid[0:H, 0:W]
grs = (((xx - 1848) / 150) ** 2 + ((yy - 1142) / 90) ** 2) < 1
use = (wgt > 0.6) & (moon < 0.02) & ~grs
prof = np.full((H, 3), np.nan, np.float32)
for y in range(H):
    s = use[y]
    if s.sum() > 160:
        prof[y] = np.median(col[y, s], axis=0)
good = np.where(~np.isnan(prof[:, 0]))[0]
print('profile rows', good[0], good[-1], 'lat', 90 - good[0] / H * 180, 90 - good[-1] / H * 180)
for c in range(3):
    prof[:, c] = np.interp(np.arange(H), good, prof[good, c])
np.save(f'{WORK}/profile_coded.npy', prof)
stripes = np.repeat(prof[:, None, :], W, 1)
save(f'{WORK}/guide-stripes.png', np.round(stripes).astype(np.uint8))
strip_x0, strip_x1 = 1420, 2360
sw = strip_x1 - strip_x0
filled = col.copy()
hole = (moon > 0.02) | grs
hole8 = cv2.dilate(hole.astype(np.uint8) * 255, np.ones((15, 15), np.uint8))
filled = cv2.inpaint(np.round(filled).astype(np.uint8), hole8, 9, cv2.INPAINT_TELEA).astype(np.float32)
src = filled[:, strip_x0:strip_x1]
sv = wgt[:, strip_x0:strip_x1]
rng = np.random.default_rng(7)
bands = np.cumsum(rng.uniform(-1, 1, H // 64 + 2))
shift = np.interp(np.arange(H), np.arange(len(bands)) * 64, bands) * sw * 0.18
shift = cv2.GaussianBlur(shift.reshape(-1, 1).astype(np.float32), (0, 0), 6).ravel()
acc = np.zeros((H, W, 3), np.float32)
wacc = np.zeros((H, W), np.float32)
for k in range(-3, 6):
    x0 = strip_x0 + k * (sw - 260)
    mapx = (np.arange(W)[None, :] - x0 - shift[:, None] * (k % 3 - 1 + 0.5 * k)).astype(np.float32)
    mapx = np.mod(mapx + 4 * W, W)
    inside = mapx < sw - 1
    mapy = np.repeat(np.arange(H, dtype=np.float32)[:, None], W, 1)
    c = cv2.remap(src, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    a = cv2.remap(sv, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * inside
    a = a * a
    acc += c * a[..., None]
    wacc += a
copy = acc / np.maximum(wacc, 1e-3)[..., None]
cover = np.clip(wacc * 4, 0, 1)[..., None]
copy = copy * cover + stripes * (1 - cover)
lf = blur(stripes, 40)
copy = copy - blur(copy, 40) + lf
w3 = wgt[..., None] * (1 - np.clip(blur(hole.astype(np.float32), 8) * 3, 0, 1))[..., None]
for name, base in [('stripes', stripes), ('copies', copy)]:
    out = base * (1 - w3) + col * w3
    save(f'{WORK}/guide-{name}-hero.png', np.round(np.clip(out, 0, 255)).astype(np.uint8))
    cv2.imwrite(f'out/work/view/guide-{name}.jpg', cv2.resize(out[..., ::-1], (1400, 700), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
