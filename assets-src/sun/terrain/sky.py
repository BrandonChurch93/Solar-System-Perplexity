import sys
import numpy as np
import cv2
from common import WORK, write, display, step

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/sun'
sky = np.load(f'{WORK}/sky-scene.npy')
ground = np.load(f'{WORK}/sky-ground.npy')
edge = np.load(f'{WORK}/canvas-edge.npy')
h, w = ground.shape
edge = cv2.resize(edge[None, :], (w, 1), interpolation=cv2.INTER_AREA)[0] / 2
rows = np.arange(h, dtype=np.float32)[:, None]
mirror = 2 * (edge[None, :] - 10) - rows
below = rows > edge[None, :] - 10
src_y = np.where(below, np.clip(mirror, 0, h - 1), rows).astype(np.float32)
src_x = np.repeat(np.arange(w, dtype=np.float32)[None, :], h, 0)
out = cv2.remap(sky, src_x, src_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
img = display(out)
print('sky max', float(img.max()), 'mean', float(img.mean()))
write(f'{OUT}/full/sky-terrain.webp', img, 95)
write(f'{OUT}/web/sky-terrain.webp', cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 92)
write(f'{WORK}/sky-terrain-check.jpg', cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 88)
