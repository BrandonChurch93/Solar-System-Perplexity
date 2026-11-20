import json, sys, numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/mars/relief')
from fill import pushpull
o = cv2.imread('references/approved/mars-close.jpg').astype(np.float32)
H, W = o.shape[:2]
m1 = np.load('out/work/paint-mask.npy')
r1 = np.load('out/work/L1-region.npy') > 0
r2 = np.load('out/work/L2-region.npy') > 0
m2 = np.load('out/work/paint2-mask.npy')
p1 = cv2.resize(cv2.imread('out/work/paint-t2.png'), (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
p2 = o.copy()
x0, y0 = 1296, 380
p2[y0:y0 + 450, x0:x0 + 800] = cv2.resize(cv2.imread('out/work/paint2-t4.png'), (800, 450), interpolation=cv2.INTER_AREA)
def membrane(p, mask, region):
    d = ndi.distance_transform_edt(~mask)
    ring = (d > 1) & (d < 8) & ~region
    diff = cv2.GaussianBlur(o - p, (0, 0), 3)
    off = pushpull(diff, ring.astype(np.float32))
    return p + off
m1only = m1 & ~m2
dd2 = ndi.distance_transform_edt(~m2)
src = (dd2 > 2) & (dd2 < 160) & ~r1 & ~r2
lab_o = cv2.cvtColor(np.clip(o, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
lab_p = cv2.cvtColor(np.clip(p2, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
for c in range(3):
    mo, so = lab_o[..., c][src].mean(), lab_o[..., c][src].std()
    mp, sp = lab_p[..., c][m2].mean(), lab_p[..., c][m2].std()
    lab_p[..., c] = np.where(m2, (lab_p[..., c] - mp) * (so / sp) + mo, lab_p[..., c])
p2 = cv2.cvtColor(np.clip(lab_p, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
q1 = membrane(p1, m1 & r1, r1 | r2)
q2 = membrane(p2, m2, r1 | r2)
comp = o.copy()
w1 = cv2.GaussianBlur((m1 & r1).astype(np.float32), (0, 0), 1.5) * (m1 & r1)
w2 = cv2.GaussianBlur(m2.astype(np.float32), (0, 0), 1.5) * m2
comp = comp * (1 - w1[..., None]) + q1 * w1[..., None]
comp = comp * (1 - w2[..., None]) + q2 * w2[..., None]
cv2.imwrite('out/work/paint-comp-2816.png', np.clip(comp, 0, 255).astype(np.uint8))
np.save('out/work/paint-w.npy', np.maximum(w1, w2).astype(np.float32))
