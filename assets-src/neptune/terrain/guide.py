import sys
import cv2
import numpy as np

sys.path.insert(0, 'assets-src/neptune/terrain')
import cgeo

w, h = 2816, 1584
img = cv2.imread(cgeo.CLOSE)
x0, y0, x1, y1 = cgeo.approved_box(w, h)
bw, bh = int(round(x1 - x0)), int(round(y1 - y0))
bx = int(round(x0))
small = cv2.resize(img, (bw, bh), interpolation=cv2.INTER_AREA)
d = cgeo.canvas_rays(w, h)
rt = cgeo.tangent(d)
below = (rt < 1) & (d @ cgeo.NADIR > 0)
canvas = np.zeros((h, w, 3), np.uint8)
depth = np.clip((1 - rt) / 0.02, 0, 1)[..., None]
deck = np.array([120, 62, 26], np.float32) * (0.45 + 0.55 * depth) + np.array([70, 40, 10], np.float32) * (1 - depth)
shade = np.clip(1.15 - 0.9 * (np.arange(h)[:, None] / h), 0.25, 1)[..., None]
canvas[below] = np.clip(deck * shade, 0, 255).astype(np.uint8)[below]
glow = np.exp(-np.maximum(rt - 1, 0) / 0.0012)[..., None] * np.array([230, 150, 70], np.float32)
canvas[~below] = np.clip(glow, 0, 255).astype(np.uint8)[~below]
canvas[:bh, bx:bx + bw] = small
cv2.imwrite('out/work/nep/terrain/guide.png', canvas)
print(bx, bw, bh)
