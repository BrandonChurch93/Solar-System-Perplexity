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
W, H = 2816, 1584
MX, MY = W // 8, H // 8
SUN = (2690.65, 175.88, 564.41)
DISC = 1.12
NEAR = (1.3, 1.36)
REACH = (1.5, 1.66)
CALM = 31
WARM = (5.0, 10.0)
GROW = 9
SOFT = 6
FILL = (120, 40)
HAVE = (0.02, 0.3)
SPECK = 5.0
LONG = 2.2
THIN = 0.45
BIG = 260
SMALL = 30
COOL = 1.5
MARK = (2839, 983, 150)

full = f'{OUT}/full/sky-hold.webp'
keep = f'{WORK}/sky-hold-before-reach.webp'
if not os.path.exists(keep):
    shutil.copy(full, keep)
src = np.asarray(Image.open(keep).convert('RGB'))
CH, CW = src.shape[:2]
x0 = int(max(MX + SUN[0] - SUN[2] * REACH[1] - 80, 0))
y1 = int(min(MY + SUN[1] + SUN[2] * REACH[1] + 80, CH))
box = (slice(0, y1), slice(x0, CW))
part = geo.decoded(src[box]).astype(np.float32)
gy, gx = np.mgrid[0:y1, x0:CW].astype(np.float32)
hx, hy = gx - MX, gy - MY
r = np.hypot(hx - SUN[0], hy - SUN[1]) / SUN[2]
ins = (hx >= 0) & (hx < W) & (hy >= 0) & (hy < H)
edge = np.minimum(np.minimum(hx, W - 1 - hx), np.minimum(hy, H - 1 - hy))
deep = 1 - geo.smooth(1.0, 1.15, r)
ringed = (1 - np.clip((edge + 28 - 34 * deep) / (24 + 6 * deep), 0, 1)) * (1 - geo.smooth(1.9, 2.15, r)) * (1 - geo.smooth(1.3, 1.6, r) * (hy > 0))


def code(v):
    return geo.coded(v).astype(np.float32)


def profile(img, pick):
    bins = np.linspace(0, 2.2, 221)
    which = np.clip(np.digitize(r, bins) - 1, 0, 219)
    prof = np.full((220, 3), np.nan, np.float32)
    for k in range(220):
        m = pick & (which == k)
        if m.sum() > 40:
            prof[k] = np.percentile(img[m], 30, axis=0)
    have = np.flatnonzero(~np.isnan(prof[:, 0]))
    for i in range(3):
        prof[:, i] = np.interp(np.arange(220), have, prof[have, i])
    prof = ndi.gaussian_filter1d(prof, 3, axis=0, mode='nearest')
    return np.stack([np.interp(r, (bins[:-1] + bins[1:]) / 2, prof[:, i]) for i in range(3)], -1).astype(np.float32)


def topband(img):
    c0 = MX - x0
    band = cv2.morphologyEx(np.ascontiguousarray(img[MY + 6:MY + 46, c0:c0 + W]), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    return ndi.gaussian_filter1d(np.median(band, axis=0), 16, axis=0, mode='nearest')


def margin(img, pick):
    ring = profile(img, pick)
    c0 = MX - x0
    lift = np.exp(np.minimum(hy[:MY, c0:c0 + W], 0) / 110)[..., None]
    ring[:MY, c0:c0 + W] = ring[:MY, c0:c0 + W] * (1 - lift) + topband(img)[None] * lift
    return ring


med = np.stack([ndi.median_filter(part[..., i], size=CALM, mode='nearest') for i in range(3)], -1)
mc = code(med)
warm = geo.smooth(WARM[0], WARM[1], mc[..., 0] - mc[..., 2])
hole = cv2.dilate(((warm * (r < REACH[1]) > 0.02) | (r < DISC)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (GROW, GROW))) > 0
good = (~hole & (ringed < 0.5)).astype(np.float32)
dark = profile(med, (good > 0) & ins)
fill = dark
for s in FILL:
    den = cv2.GaussianBlur(good, (0, 0), s)
    local = np.stack([cv2.GaussianBlur(med[..., i] * good, (0, 0), s) for i in range(3)], -1) / np.maximum(den, 1e-4)[..., None]
    w = geo.smooth(HAVE[0], HAVE[1], den)[..., None]
    fill = fill * (1 - w) + local * w
cover = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), SOFT)
close = 1 - geo.smooth(NEAR[0], NEAR[1], r)
floor = med * (1 - cover[..., None]) + np.stack([cv2.GaussianBlur(fill[..., i], (0, 0), SOFT) for i in range(3)], -1) * cover[..., None]
floor = floor * (1 - close[..., None]) + dark * close[..., None]

fine = part - med
lum = code(part) @ geo.LUMA - mc @ geo.LUMA
calm = lum[(r > REACH[1]) & (r < 2.0) & ins]
noise = 1.4826 * np.median(np.abs(calm - np.median(calm)))
spots, count = ndi.label(lum > SPECK * noise)
drop = np.zeros(count + 1, bool)
for k, sl in enumerate(ndi.find_objects(spots), 1):
    h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
    area = int((spots[sl] == k).sum())
    drop[k] = max(h, w) / min(h, w) > LONG and max(h, w) > 6 or area > SMALL and area / (h * w) < THIN or area > BIG
round5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
gone = cv2.GaussianBlur(cv2.dilate(drop[spots].astype(np.uint8), round5).astype(np.float32), (0, 0), 1.0)
index = np.arange(count + 1)
cool = ndi.sum(fine[..., 0], spots, index) < COOL * ndi.sum(fine[..., 2], spots, index)
kept = (spots > 0) & ~drop[spots] & ((r > NEAR[1]) | cool[spots] & (r > DISC + 0.02))
star = cv2.GaussianBlur(cv2.dilate(kept.astype(np.uint8), round5).astype(np.float32), (0, 0), 1.0)
shut = np.clip(np.maximum(gone, np.maximum(cover, close) * (1 - star)), 0, 1)
new = np.maximum(floor + fine * (1 - shut[..., None]), 0)
new = new * (1 - ringed[..., None]) + margin(new, ins) * ringed[..., None]

weight = (1 - geo.smooth(REACH[0], REACH[1], r))
moved = (weight > 0) & ((shut > 0) | (cover > 0) | (ringed > 0))
mixed = part + (new - part) * weight[..., None]
res = src.copy()
res[box] = np.where(moved[..., None], geo.coded(mixed), src[box])
changed = (res != src).any(-1)
far = np.zeros((CH, CW), bool)
far[box] = r > REACH[1]
far[y1:] = True
far[:, :x0] = True
print('noise', round(float(noise), 3), 'spots', count, 'dropped', int(drop.sum()), 'hole pixels', int(hole.sum()), 'changed pixels', int(changed.sum()), 'of them outside', REACH[1], 'Sun radii', int((changed & far).sum()))
small = np.asarray(Image.fromarray(res).resize((CW // 2, CH // 2), Image.LANCZOS)).astype(np.int32)
web = np.asarray(Image.fromarray(src).resize((CW // 2, CH // 2), Image.LANCZOS)).astype(np.int32)
sy, sx = np.mgrid[0:CH // 2, 0:CW // 2].astype(np.float32)
sr = np.hypot(sx * 2 + 1 - MX - SUN[0], sy * 2 + 1 - MY - SUN[1]) / SUN[2]
wch = (small != web).any(-1)
print('web card: changed pixels', int(wch.sum()), 'of them outside', REACH[1] + 0.02, 'Sun radii', int((wch & (sr > REACH[1] + 0.02)).sum()))
show = lambda a: np.clip(a.astype(np.float32) * 4, 0, 255).astype(np.uint8)
Image.fromarray(np.concatenate([show(src[box]), show(res[box])], 1)).resize(((CW - x0), y1 // 2), Image.LANCZOS).save(f'{WORK}/reach-check.jpg', quality=90)
mask = np.stack([hole * 255, (shut > 0.5) * 255, (star > 0.5) * 255], -1).astype(np.uint8)
Image.fromarray(mask).resize(((CW - x0) // 2, y1 // 2), Image.LANCZOS).save(f'{WORK}/reach-mask.jpg', quality=90)
mx, my, mh = MARK
crop = (slice(my - mh, my + mh), slice(mx - mh, mx + mh))
Image.fromarray(np.concatenate([np.concatenate([src[crop], res[crop]], 1), np.concatenate([show(src[crop]), show(res[crop])], 1)], 0)).save(f'{WORK}/reach-mark.png')
if not DRY:
    img = Image.fromarray(res)
    img.save(full, lossless=True, quality=90, method=6)
    img.resize((CW // 2, CH // 2), Image.LANCZOS).save(f'{OUT}/web/sky-hold.webp', lossless=True, quality=90, method=6)
