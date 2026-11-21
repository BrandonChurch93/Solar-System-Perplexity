import sys
import numpy as np
import cv2
from common import WORK, LEFT, TOP, SPAN, TY, write, display, step

LINE = (2.1, 4.6)
DIM = (0.55, 0.3, 3.0)

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
out = cv2.remap(sky, src_x, src_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
mask = cv2.imread(f'{WORK}/loops-mask-wide.png', 0).astype(np.float32) / 255
k = SPAN * mask.shape[1] / w
inv = np.array([[k, 0, LEFT * mask.shape[1] + 0.5 * k - 0.5], [0, k, TOP * mask.shape[0] + 0.5 * k - 0.5]])
mask = cv2.GaussianBlur(cv2.warpAffine(mask, inv, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP), (0, 0), 20)
deg = (edge[None, :] - rows) * 2 * np.degrees(np.arctan(TY * SPAN)) / h
out *= (1 - DIM[0] * mask * (1 - step(deg, DIM[1], DIM[2])))[..., None]
img = display(out)
print('sky max', float(img.max()), 'mean', float(img.mean()))
write(f'{OUT}/full/sky-terrain.webp', img, 95)
write(f'{OUT}/web/sky-terrain.webp', cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 92)
write(f'{WORK}/sky-terrain-check.jpg', cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 88)
