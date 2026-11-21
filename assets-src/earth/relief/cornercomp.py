import numpy as np, cv2
from scipy import ndimage

WORK = 'out/work/earth/relief'
ref = cv2.imread(f'{WORK}/corner-input.jpg').astype(np.float32)
t = cv2.imread(f'{WORK}/edge-corners-aligned.png').astype(np.float32)
hole = np.abs(ref - (255, 0, 255)).sum(2) < 120
hole = cv2.dilate(hole.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
w = (~hole).astype(np.float32)
d = (ref - t) * w[..., None]
d = cv2.GaussianBlur(d, (0, 0), 10) / np.maximum(cv2.GaussianBlur(w, (0, 0), 10), 1e-3)[..., None]
dist, (iy, ix) = ndimage.distance_transform_edt(hole, return_indices=True)
corr = d[iy, ix] * np.exp(-dist / 330.0)[..., None]
corr = np.where(hole[..., None], cv2.GaussianBlur(corr, (0, 0), 5), 0)
out = np.clip(t + corr, 0, 255)
print('corner correction mean', np.round(d[iy, ix][hole].mean(0), 2))
H, W = out.shape[:2]
cv2.imwrite(f'{WORK}/corner-left.png', out[1256:H, 0:534].astype(np.uint8))
cv2.imwrite(f'{WORK}/corner-right.png', out[1256:H, 2282:W].astype(np.uint8))
