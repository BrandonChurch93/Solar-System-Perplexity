import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
import geom

WORK = 'out/work/mercury/relief/'
FIX = WORK + 'lens-fix.npy'
W, H, ML = geom.W, geom.H, geom.ML

film = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32) / 255
fh, fw = film.shape[:2]
ref = np.asarray(Image.open('out/work/mercury/close-db.png').convert('RGB')).astype(np.float32) / 255
ref = cv2.resize(ref, (fw, fh), interpolation=cv2.INTER_AREA)
a = geo.unfilm(geo.to_linear(ref))
b = geo.unfilm(geo.to_linear(film))
hy = np.interp((np.arange(fw) + 0.5) * W / fw, np.arange(W) + 0.5, geom.horizon_y()[ML:ML + W]) * fh / H
g = ((np.arange(fh)[:, None] + 0.5) > hy[None, :] + 3 * fh / H).astype(np.float32)
s = 3.0 * fw / 1920
num = np.stack([cv2.GaussianBlur(a[..., c] * g, (0, 0), s) for c in range(3)], -1)
den = np.stack([cv2.GaussianBlur(b[..., c] * g, (0, 0), s) for c in range(3)], -1)
ratio = np.clip((num + 1e-4) / (den + 1e-4), 0.4, 1.6)
valid = (cv2.GaussianBlur(g, (0, 0), s) > 0.5).astype(np.uint8)
_, labels = cv2.distanceTransformWithLabels(1 - valid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
idx = np.zeros(labels.max() + 1, np.int64)
flat = np.flatnonzero(valid)
idx[labels.ravel()[flat]] = flat
ratio = ratio.reshape(-1, 3)[idx[labels].ravel()].reshape(fh, fw, 3)
lum = ratio @ geo.LUMA
print('ground approved/film before this fix: median %.3f p10 %.3f p90 %.3f' % tuple(np.percentile(lum[g > 0.5], [50, 10, 90])))
if os.path.exists(FIX) and '--fresh' not in sys.argv:
    ratio = ratio * np.load(FIX)
np.save(FIX, ratio.astype(np.float32))
