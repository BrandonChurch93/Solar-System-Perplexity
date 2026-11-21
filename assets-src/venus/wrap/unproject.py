import sys
import cv2
import numpy as np
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/venus')
from geo import *

W, H = 8192, 4096
src = cv2.imread(WORK + '/wrap/hero-clean.png', cv2.IMREAD_COLOR)
sh, sw = src.shape[:2]
out = np.zeros((H, W, 3), np.uint8)
wt = np.zeros((H, W), np.uint8)
mu_map = np.zeros((H, W), np.uint8)
band = 256
for y0 in range(0, H, band):
    ys, xs = np.mgrid[y0:y0 + band, 0:W]
    lon = (xs + 0.5) / W * 360 - 180
    lat = 90 - (ys + 0.5) / H * 180
    pw = world(lonlat_dir(lon, lat))
    v = CAM - pw
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    mu = (pw * v).sum(-1)
    if mu.max() < 0.05:
        continue
    px, py = project(pw, sw, sh)
    vis = mu > 0.05
    s = cv2.remap(src, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    out[y0:y0 + band] = np.where(vis[..., None], s, 0)
    wt[y0:y0 + band] = np.where(vis, smoothstep(0.2, 0.42, mu) * 255, 0).astype(np.uint8)
    mu_map[y0:y0 + band] = (np.clip(mu, 0, 1) * 255).astype(np.uint8)
cv2.imwrite(WORK + '/wrap/hero-eq.png', out)
cv2.imwrite(WORK + '/wrap/hero-eq-w.png', wt)
cv2.imwrite(WORK + '/wrap/hero-eq-mu.png', mu_map)
cv2.imwrite(WORK + '/wrap/hero-eq-view.jpg', cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA))
