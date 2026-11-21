import sys, os
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

W, H = 2816, 1584
WORK = 'out/work/earth/relief'
im = cv2.imread('references/approved/earth-close.jpg')
D = np.fromfile(f'{WORK}/depth.raw', np.float32).reshape(H, W)
X, Y = geom.grid(0, 0, W, H, W, H)
t, hit, _ = geom.ground(geom.rays(X, Y, W, H))
hrow = geom.horizon_row(np.arange(W) + 0.5, W, H)

Ds = cv2.GaussianBlur(D, (0, 0), 1.5)
ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (301, 301))
bg = cv2.GaussianBlur(cv2.morphologyEx(Ds, cv2.MORPH_OPEN, ker), (0, 0), 30)
rel = np.maximum(Ds - bg, 0) / np.maximum(Ds, 1e-6)

lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
L = lab[..., 0]
chroma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
below = (Y > hrow[None, :] + 60) & (Y < 1440)
seed = (rel > 0.022) & below
seed = cv2.morphologyEx(seed.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
n, lbl, stats, _ = cv2.connectedComponentsWithStats(seed)
keep = np.zeros(seed.shape, np.uint8)
for i in range(1, n):
    x, y, w, h, a = stats[i]
    m = lbl == i
    if a < 500:
        continue
    if rel[m].max() < 0.035 or L[m].mean() < 95:
        continue
    keep[m] = 1
print('seed components kept', len(np.unique(lbl[keep > 0])))

sure = cv2.erode(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
near = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
gc = np.full(seed.shape, cv2.GC_BGD, np.uint8)
gc[near > 0] = cv2.GC_PR_BGD
gc[keep > 0] = cv2.GC_PR_FGD
gc[(sure > 0) & (L > 110)] = cv2.GC_FGD
out = np.zeros(seed.shape, np.uint8)
n2, lbl2, stats2, _ = cv2.connectedComponentsWithStats(near)
for i in range(1, n2):
    x, y, w, h, a = stats2[i]
    x0, y0, x1, y1 = max(x - 8, 0), max(y - 8, 0), min(x + w + 8, W), min(y + h + 8, H)
    roi = im[y0:y1, x0:x1]
    g = gc[y0:y1, x0:x1].copy()
    g[lbl2[y0:y1, x0:x1] != i] = np.minimum(g[lbl2[y0:y1, x0:x1] != i], cv2.GC_BGD)
    if not ((g == cv2.GC_FGD) | (g == cv2.GC_PR_FGD)).any():
        continue
    bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
    try:
        cv2.grabCut(roi, g, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        continue
    out[y0:y1, x0:x1] |= ((g == cv2.GC_FGD) | (g == cv2.GC_PR_FGD)).astype(np.uint8)
out = cv2.morphologyEx(out, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
n3, lbl3, stats3, _ = cv2.connectedComponentsWithStats(out)
mask = np.zeros(out.shape, np.uint8)
for i in range(1, n3):
    if stats3[i][4] >= 600 and (keep[lbl3 == i].sum() > 200):
        mask[lbl3 == i] = 1
cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
mask = np.zeros(out.shape, np.uint8)
cv2.drawContours(mask, cnts, -1, 1, -1)
print('towers', len(cnts), 'pixels', int(mask.sum()))
np.save(f'{WORK}/tower-mask.npy', mask)
np.save(f'{WORK}/tower-rel.npy', rel.astype(np.float32))
v = im.copy()
v[..., 2] = np.where(mask > 0, np.minimum(v[..., 2].astype(int) + 90, 255), v[..., 2])
cv2.drawContours(v, cnts, -1, (0, 0, 255), 2)
cv2.imwrite('out/work/earth/view/towers.jpg', cv2.resize(v, (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
cv2.imwrite('out/work/earth/view/towers-crop.jpg', v[900:1500, 200:1400], [cv2.IMWRITE_JPEG_QUALITY, 88])
