import sys
import numpy as np
import cv2
from common import WORK, LEFT, TOP, SPAN, TY, write, display, step

LINE = (2.1, 4.6)
NEAR = (0.9, 0.5, 1.7, 4.5)
ARCH = 0.25
SOFT = 24
SHIFT = 160
STARS = 0.4
DEEP = 240

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/sun'
sky = np.load(f'{WORK}/sky-scene.npy')
ground = np.load(f'{WORK}/sky-ground.npy')
edge = np.load(f'{WORK}/canvas-edge.npy')
h, w = ground.shape
edge = cv2.resize(edge[None, :], (w, 1), interpolation=cv2.INTER_AREA)[0] / 2
rows = np.arange(h, dtype=np.float32)[:, None]
cols = (np.arange(w, dtype=np.float32) + 0.5) / w * SPAN + LEFT
centre = step(cols, -0.02, 0.1) * (1 - step(cols, 0.9, 1.02))
line = edge - (LINE[1] + (LINE[0] - LINE[1]) * centre) * h / (2 * np.degrees(np.arctan(TY * SPAN)))
mirror = 2 * line[None, :] - rows
below = rows > line[None, :]
src_y = np.where(below, np.clip(mirror, 0, h - 1), rows).astype(np.float32)
src_x = np.repeat(np.arange(w, dtype=np.float32)[None, :], h, 0)
low = cv2.GaussianBlur(sky, (0, 0), SOFT)
moved = np.roll(sky - low, SHIFT, axis=1)
far_y = np.where(below, np.clip(np.roll(line, SHIFT)[None, :] - (rows - line[None, :]), 0, h - 1), rows).astype(np.float32)
fill = cv2.remap(low, src_x, src_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) + cv2.remap(moved, src_x, far_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
out = np.where(below[..., None], np.maximum(fill, 0) * step(mirror, 0, DEEP)[..., None], sky)
mask = cv2.imread(f'{WORK}/loops-mask-wide.png', 0).astype(np.float32) / 255
k = SPAN * mask.shape[1] / w
inv = np.array([[k, 0, LEFT * mask.shape[1] + 0.5 * k - 0.5], [0, k, TOP * mask.shape[0] + 0.5 * k - 0.5]])
mask = np.clip(cv2.GaussianBlur(cv2.warpAffine(mask, inv, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP), (0, 0), 20) * 2 - 1, 0, 1)
deg = (edge[None, :] - rows) * 2 * np.degrees(np.arctan(TY * SPAN)) / h
near = NEAR[0] * step(deg, NEAR[1], NEAR[2]) + (1 - NEAR[0]) * step(deg, NEAR[2], NEAR[3])
floor = cv2.GaussianBlur(out, (0, 0), SOFT)
out = np.maximum(floor * near[..., None] + (out - floor) * (STARS + (1 - STARS) * near)[..., None], 0) * (1 - ARCH * mask)[..., None]
img = display(out)
print('line', float(line.min()), float(line.max()), 'first faded row', float((2 * line - DEEP).min()), 'first repeated row', float((2 * line).min()))
print('sky max', float(img.max()), 'mean', float(img.mean()))
write(f'{OUT}/full/sky-terrain.webp', img, 95)
write(f'{OUT}/web/sky-terrain.webp', cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 92)
write(f'{WORK}/sky-terrain-check.jpg', cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 88)
