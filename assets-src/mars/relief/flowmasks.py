import json, sys, numpy as np, cv2
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H
o = cv2.imread('references/approved/mars-close.jpg').astype(np.float32) / 255
Lm = cv2.cvtColor(o, cv2.COLOR_BGR2Lab)[..., 0] / 100
zone_poly = json.load(open('assets-src/mars/relief/cuts.json'))['mistZone']
zone = np.zeros((H, W), np.float32); cv2.fillPoly(zone, [np.array(zone_poly, np.int32)], 1.0)
zone = cv2.GaussianBlur(zone, (0, 0), 25)
Lb = cv2.GaussianBlur(Lm, (0, 0), 2.5)
floor = cv2.GaussianBlur(cv2.erode(Lm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))), (0, 0), 20)
tex = cv2.GaussianBlur(np.abs(Lm - cv2.GaussianBlur(Lm, (0, 0), 1.5)), (0, 0), 6)
mist = np.clip((Lb - floor - 0.04) / 0.10, 0, 1) * np.clip(1 - (tex - 0.01) / 0.03, 0, 1)
mist = cv2.GaussianBlur(mist, (0, 0), 4) * zone
mist = np.clip(mist * 1.3, 0, 1)
dist = np.load('out/work/dist0.npy')
r1 = np.load('out/work/L1-region.npy').astype(np.float32); r2 = np.load('out/work/L2-region.npy').astype(np.float32)
near = cv2.GaussianBlur(np.maximum(r1, r2), (0, 0), 12)
hy = np.load('out/work/hy_half.npy')
Y = np.arange(H, dtype=np.float32)[:, None]
t = np.clip((np.log(dist) - np.log(8)) / (np.log(25) - np.log(8)), 0, 1)
haze = t * t * (3 - 2 * t)
band = np.exp(-((Y - hy[None, :] + 8) / 22) ** 2)
above = np.clip((Y - (hy[None, :] - 55)) / 30, 0, 1)
smooth = np.clip(1 - (tex - 0.006) / 0.02, 0, 1)
haze = np.maximum(haze * 0.6 * smooth, band) * above * (1 - near)
haze = cv2.GaussianBlur(haze, (0, 0), 6)
mist *= (1 - near)
out = np.zeros((H, W, 3), np.uint8)
out[..., 2] = np.clip(mist * 255 + 0.5, 0, 255).astype(np.uint8)
out[..., 1] = np.clip(haze * 255 + 0.5, 0, 255).astype(np.uint8)
for s in ('full', 'web'):
    cv2.imwrite(f'public/assets/mars/{s}/relief-masks.png', out if s == 'full' else cv2.resize(out, (W // 2, H // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_PNG_COMPRESSION, 9])
vis = (o * 255).astype(np.float32) * 0.5
vis[..., 2] += mist * 127; vis[..., 1] += haze * 127
cv2.imwrite('out/work/masks-vis.jpg', np.clip(vis, 0, 255).astype(np.uint8))
