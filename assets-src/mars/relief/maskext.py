import sys, numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H
from fill import pushpull
OX, MB = 338, 190
EW, EH = W + 2 * OX, H + MB
m = cv2.imread('public/assets/mars/full/relief-masks.png').astype(np.float32)
assert m.shape[:2] == (H, W)
big = np.zeros((EH, EW, 3), np.float32); big[:H, OX:OX + W] = m
inside = np.zeros((EH, EW), bool); inside[:H, OX:OX + W] = True
src = inside & (ndi.distance_transform_edt(inside) <= 16)
e = cv2.GaussianBlur(pushpull(big, src.astype(np.float32)), (0, 0), 8)
edge = pushpull(big, (inside & (ndi.distance_transform_edt(inside) <= 1.5)).astype(np.float32))
t = np.clip(ndi.distance_transform_edt(~inside) / 24, 0, 1)[..., None]
v = edge * (1 - t) + e * t
out = np.where(inside[..., None], big, v)
out[..., 0] = 0
out = np.clip(np.round(out), 0, 255).astype(np.uint8)
cv2.imwrite('public/assets/mars/full/relief-masks.png', out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
cv2.imwrite('public/assets/mars/web/relief-masks.png', cv2.resize(out, (EW // 2, EH // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_PNG_COMPRESSION, 9])
print(out.shape)
