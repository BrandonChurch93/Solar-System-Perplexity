import sys
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
sys.path.insert(0, 'assets-src/venus/wrap')
from geo import WORK, smoothstep
from faces import bases, splat_face, N

W, H = 8192, 4096
takes = [a.split('=') for a in sys.argv[1:]]
B = bases()


def matched(k, name):
    f = cv2.imread(WORK + '/wrap/s1/' + name, cv2.IMREAD_COLOR)
    if f.shape[0] != N:
        f = cv2.resize(f, (N, N), interpolation=cv2.INTER_AREA)
    a = cv2.cvtColor(f.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    ma, sa = a.reshape(-1, 3).mean(0), a.reshape(-1, 3).std(0)
    mb, sb = TARGET
    gain = np.clip(sb / np.maximum(sa, 1e-3), 0.85, 1.2)
    print(k, name, 'take mean', ma.round(2), 'std', sa.round(2), 'known mean', mb.round(2), 'std', sb.round(2), 'left magenta', int(((f[..., 1] < 90) & (f[..., 0] > 170) & (f[..., 2] > 170)).sum()))
    a = (a - ma) * gain + mb
    return np.clip(cv2.cvtColor(a, cv2.COLOR_Lab2BGR), 0, 1) * 255


hero = cv2.imread(WORK + '/wrap/albedo-flat-eq.png', cv2.IMREAD_COLOR).astype(np.float32)
wt = cv2.imread(WORK + '/wrap/hero-eq-w.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
cap = cv2.cvtColor(hero[600:2000:4, 3200:5000:4] / 255, cv2.COLOR_BGR2Lab)[wt[600:2000:4, 3200:5000:4] > 0.9]
TARGET = (cap.mean(0), cap.std(0))
print('hero cap Lab', TARGET[0].round(2), TARGET[1].round(2))
acc = hero.copy()
cover = (wt > 0.9).astype(np.float32)
for k, name in takes:
    o, w = splat_face(matched(k, name).astype(np.float32), B[k], W, H)
    pad = 64
    soft = cv2.GaussianBlur(np.concatenate([cover[:, -pad:], cover, cover[:, :pad]], 1), (0, 0), 12)[:, pad:-pad]
    a = w * (1 - smoothstep(0.55, 0.97, soft))
    den = cover * (1 - a) + a
    acc = (acc * (cover * (1 - a))[..., None] + o * a[..., None]) / np.maximum(den, 1e-4)[..., None]
    cover = np.maximum(cover, np.clip(den, 0, 1))
    cover = np.where(w > 0.5, 1, cover).astype(np.float32)
    del o, w, soft, a, den
print('cover min', float(cover.min()), 'uncovered share', float((cover < 0.99).mean()))
cv2.imwrite(WORK + '/wrap/far-eq.png', np.clip(acc, 0, 255).astype(np.uint8))
cv2.imwrite(WORK + '/wrap/stage-eq.png', np.clip(acc, 0, 255).astype(np.uint8))
cv2.imwrite(WORK + '/wrap/stage-w.png', ((cover > 0.99) * 255).astype(np.uint8))
cv2.imwrite(WORK + '/wrap/stage-view.jpg', cv2.resize(np.clip(acc, 0, 255).astype(np.uint8), (1600, 800), interpolation=cv2.INTER_AREA))
