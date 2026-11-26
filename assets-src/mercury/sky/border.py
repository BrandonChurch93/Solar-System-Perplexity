import hashlib
import os
import shutil
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

OUT = sys.argv[1]
WORK = sys.argv[2]
DRY = len(sys.argv) > 3 and sys.argv[3] == '--dry'
W, H = 2816, 1584
MX, MY = W // 8, H // 8
SUN = (2690.65, 175.88, 564.41)
CALM = 31
SHIFT = 211
WIDE = 96
NEAR = 120
STARS = (1.3, 1.5)

full = f'{OUT}/full/sky-hold.webp'
keep = f'{WORK}/sky-hold-before-border.webp'
if not os.path.exists(keep):
    shutil.copy(full, keep)
src = np.asarray(Image.open(keep).convert('RGB'))
CH, CW = src.shape[:2]
inner = (slice(MY, MY + H), slice(MX, MX + W))


def calm(code):
    return geo.decoded(np.dstack([cv2.medianBlur(np.ascontiguousarray(code[..., c]), CALM) for c in range(3)])).astype(np.float32)


code = src[inner]
floor = calm(code)
fine = geo.decoded(code).astype(np.float32) - floor


def mirror(i, n):
    i = np.mod(i, 2 * n - 2)
    return np.where(i < n, i, 2 * n - 2 - i)


ys, xs = np.arange(CH) - MY, np.arange(CW) - MX
ground = floor[mirror(ys, H)][:, mirror(xs, W)]
wide = cv2.GaussianBlur(np.pad(floor, ((MY, MY), (MX, MX), (0, 0)), mode='edge'), (0, 0), WIDE)
away = np.maximum(np.maximum(np.maximum(-ys, ys - (H - 1)), 0)[:, None], np.maximum(np.maximum(-xs, xs - (W - 1)), 0)[None, :])
t = geo.smooth(0, NEAR, away.astype(np.float32))[..., None]
ground = ground * (1 - t) + wide * t
rows = (ys < 0) | (ys >= H)
along = fine[mirror(ys, H)][:, mirror(xs + SHIFT, W)]
across = fine[mirror(ys + SHIFT, H)][:, mirror(xs, W)]
moved = np.where(rows[:, None, None], along, across)
moved *= geo.smooth(STARS[0], STARS[1], np.hypot(xs[None, :] - SUN[0], ys[:, None] - SUN[1]) / SUN[2])[..., None].astype(np.float32)
res = geo.coded(np.maximum(ground + moved, 0))
res[inner] = code

changed = (res != src).any(-1)
inside = np.zeros((CH, CW), bool)
inside[inner] = True
print('input', hashlib.sha256(open(keep, 'rb').read()).hexdigest())
print('changed pixels', int(changed.sum()), 'of them in the approved frame', int((changed & inside).sum()))
luma = lambda a: a.reshape(-1, 3).astype(np.float32) @ geo.LUMA
for name, sl, was in (('right margin', (slice(MY + 900, MY + H), slice(MX + W + 20, CW)), (slice(MY + 900, MY + H), slice(MX + W - MX, MX + W - 20))), ('bottom margin', (slice(MY + H + 20, CH), slice(MX + 1400, MX + W)), (slice(MY + H - MY, MY + H - 20), slice(MX + 1400, MX + W))), ('left margin', (slice(MY, MY + H), slice(0, MX - 20)), (slice(MY, MY + H), slice(MX + 20, 2 * MX)))):
    a, b, c = luma(src[sl]), luma(res[sl]), luma(res[was])
    print(name, 'median code before %.1f after %.1f, the frame beside it %.1f; share over code 24 before %.4f after %.4f, the frame beside it %.4f' % (np.median(a), np.median(b), np.median(c), (a > 24).mean(), (b > 24).mean(), (c > 24).mean()))
show = lambda a: np.clip(a.astype(np.float32) * 6, 0, 255).astype(np.uint8)
Image.fromarray(np.concatenate([show(src), show(res)], 0)).resize((CW // 2, CH), Image.LANCZOS).save(f'{WORK}/border-check.jpg', quality=88)
if not DRY:
    img = Image.fromarray(res)
    img.save(full, lossless=True, quality=90, method=6)
    img.resize((CW // 2, CH // 2), Image.LANCZOS).save(f'{OUT}/web/sky-hold.webp', lossless=True, quality=90, method=6)
    print('written', full, os.path.getsize(full), hashlib.sha256(open(full, 'rb').read()).hexdigest())
