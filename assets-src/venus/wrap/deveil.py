import sys
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
from geo import *

a = cv2.imread(WORK + '/wrap/albedo-eq.png', cv2.IMREAD_COLOR).astype(np.float32) / 255
mu = cv2.imread(WORK + '/wrap/hero-eq-mu.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
wt = cv2.imread(WORK + '/wrap/hero-eq-w.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
k = 8
h, w = mu.shape
small = cv2.resize(a, (w // k, h // k), interpolation=cv2.INTER_AREA)
ws = cv2.resize((wt > 0.02).astype(np.float32), (w // k, h // k), interpolation=cv2.INTER_AREA)
num = cv2.GaussianBlur(small * ws[..., None], (0, 0), 16)
den = cv2.GaussianBlur(ws, (0, 0), 16)
low = num / np.maximum(den, 1e-3)[..., None]
mus = cv2.resize(mu, (w // k, h // k), interpolation=cv2.INTER_AREA)
core = (mus > 0.65) & (ws > 0.99)
target = np.median(low[core], axis=0)
print('target', target)
low = cv2.resize(low, (w, h), interpolation=cv2.INTER_CUBIC)
s = smoothstep(0.7, 0.42, mu)[..., None]
flat = target[None, None] + (a - low) * 1.25
out = np.clip(a * (1 - s) + flat * s, 0, 1)
cv2.imwrite(WORK + '/wrap/albedo-flat-eq.png', (out * 255 + 0.5).astype(np.uint8))
cv2.imwrite(WORK + '/wrap/albedo-flat-view.jpg', cv2.resize((out * 255).astype(np.uint8), (2048, 1024), interpolation=cv2.INTER_AREA)[0:700, 500:1600])
