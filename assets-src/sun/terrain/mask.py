import numpy as np
import cv2
from common import WORK, APPROVED, LOOPS_BOX, read, write, take_to_grid, step

a = read(APPROVED).astype(np.float32) / 255
clean = take_to_grid('clean', read(f'{WORK}/close-clean-x.png'), (2816, 1584), (0.0, 0.0), 1.0).astype(np.float32) / 255
lum = lambda x: x @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
d = lum(a) - lum(clean)
print('diff mean', float(d.mean()), 'abs', float(np.abs(d).mean()))
h, w = d.shape
ground = np.zeros_like(d, bool)
ground[int(h * 0.7):] = True
for c in range(3):
    print('ground ratio', c, float(a[ground][:, c].mean() / clean[ground][:, c].mean()))
pos = cv2.GaussianBlur(np.maximum(d, 0), (0, 0), 5)
neg = cv2.GaussianBlur(np.maximum(-d, 0), (0, 0), 5)
both = cv2.GaussianBlur(np.abs(d), (0, 0), 9)
box = np.zeros_like(d)
x0, y0, x1, y1 = LOOPS_BOX
box[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1
core = (pos > 0.03).astype(np.uint8)
core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
n, lab, stats, _ = cv2.connectedComponentsWithStats(core)
keep = np.zeros_like(core)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 1500:
        keep[lab == i] = 1
keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))).astype(np.float32) * box
m = np.clip(cv2.GaussianBlur(keep, (0, 0), 5) * 1.6 - 0.3, 0, 1)
cv2.imwrite(f'{WORK}/loops-mask.png', (m * 255).astype(np.uint8))
view = np.concatenate([a, clean, np.repeat(m[..., None], 3, 2), np.clip(np.stack([pos, neg, both], -1) * 6, 0, 1)], 1)
write(f'{WORK}/mask-check2.jpg', cv2.resize(view, (view.shape[1] // 4, view.shape[0] // 4), interpolation=cv2.INTER_AREA), 85)
