import sys
sys.path.insert(0, 'assets-src/venus/wrap')
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
from geo import *
from albedo import curve_at

W, H = 8192, 4096
TOP = 24.0
MOST = 8.0

far = cv2.imread(WORK + '/wrap/far-eq.png', cv2.IMREAD_COLOR)
src = cv2.imread(WORK + '/wrap/hero-eq.png', cv2.IMREAD_COLOR)
old = cv2.imread(WORK + '/wrap/albedo-eq.png', cv2.IMREAD_COLOR)
wt = cv2.imread(WORK + '/wrap/hero-eq-w.png', cv2.IMREAD_GRAYSCALE)
lift = np.ones((H, W), np.float32)
for y0 in range(0, H, 256):
    ys, xs = np.mgrid[y0:y0 + 256, 0:W]
    ndl = world(lonlat_dir((xs + 0.5) / W * 360 - 180, 90 - (ys + 0.5) / H * 180)) @ SUN
    true = scene(src[y0:y0 + 256, :, ::-1].astype(np.float32) / 255) / curve_at(ndl)
    was = scene(old[y0:y0 + 256, :, ::-1].astype(np.float32) / 255)
    t = smoothstep(3.5, 4.5, true.max(-1))[..., None] * (wt[y0:y0 + 256, :, None] / 255.0)
    ratio = np.clip(true / np.maximum(was, 0.05), 1, 40)
    alb = scene(far[y0:y0 + 256, :, ::-1].astype(np.float32) / 255) * (1 + (ratio - 1) * t)
    lift[y0:y0 + 256] = np.clip(alb.max(-1) / TOP, 1, MOST)
print('texels lifted', float((lift > 1.01).mean()), 'median lift there', float(np.median(lift[lift > 1.01])), 'at most', float((lift >= MOST).mean()))
half = cv2.resize(lift, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
code = np.log2(half) / np.log2(MOST)
for key, k in (('full', 1), ('web', 2)):
    path = 'public/assets/venus/' + key + '/wrap-flow.jpg'
    flow = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if flow.ndim == 3:
        flow = flow[..., 2]
    g = code if k == 1 else cv2.resize(code, (flow.shape[1], flow.shape[0]), interpolation=cv2.INTER_AREA)
    g8 = (np.clip(g, 0, 1) * 255 + 0.5).astype(np.uint8)
    out = np.stack([np.zeros_like(flow), g8, flow], -1)
    cv2.imwrite(path, out, [cv2.IMWRITE_JPEG_QUALITY, 94, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    back = cv2.imread(path)
    print(key, out.shape, 'flow error', float(np.abs(back[..., 2].astype(np.float32) - flow).mean()), 'lift error', float(np.abs(back[..., 1].astype(np.float32) - g8).mean()), 'lift floor p99 where zero', float(np.percentile(back[..., 1][g8 == 0], 99.9)))
cv2.imwrite(WORK + '/wrap/lift-view.jpg', cv2.resize((np.clip(code, 0, 1) * 255).astype(np.uint8), (2048, 1024), interpolation=cv2.INTER_AREA))
