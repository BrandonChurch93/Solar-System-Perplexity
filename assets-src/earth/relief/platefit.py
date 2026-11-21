import sys
import numpy as np, cv2

W, H = 2816, 1584
WORK = 'out/work/earth/relief'
take = sys.argv[1] if len(sys.argv) > 1 else 't1'
im = cv2.imread('references/approved/earth-close.jpg')
t = cv2.resize(cv2.imread(f'{WORK}/plate-{take}.png'), (W, H), interpolation=cv2.INTER_LANCZOS4)
s = 4
small = lambda a: cv2.cvtColor(cv2.resize(a, (W // s, H // s), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
g0, g1 = small(im), small(t)
mask = np.full(g0.shape, 255, np.uint8)
warp = np.eye(2, 3, dtype=np.float32)
for it in range(2):
    cc, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), mask, 5)
    al = cv2.warpAffine(g1, warp, (W // s, H // s), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    d = cv2.GaussianBlur(np.abs(al - g0), (0, 0), 3)
    mask = np.where(cv2.dilate((d > 14).astype(np.uint8), np.ones((15, 15), np.uint8)) > 0, 0, 255).astype(np.uint8)
    print('pass', it, 'ECC %.4f' % cc, 'masked share %.3f' % (1 - mask.mean() / 255))
full = warp.copy()
full[:, 2] *= s
al = cv2.warpAffine(t, full, (W, H), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
same = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST) > 0
a = cv2.cvtColor(cv2.resize(im, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
b = cv2.cvtColor(cv2.resize(al, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 5, 31, 5, 7, 1.5, 0)
mag = np.hypot(flow[..., 0], flow[..., 1]) * 2
sm = same[::2, ::2]
print('affine', np.round(full, 4).tolist())
print('flow where unchanged, px: median %.2f p90 %.2f p99 %.2f' % tuple(np.percentile(mag[sm], [50, 90, 99])))
wgt = cv2.GaussianBlur(same.astype(np.float32), (0, 0), 40)
low = lambda v: cv2.GaussianBlur(v.astype(np.float32) * same[..., None], (0, 0), 40) / np.maximum(wgt[..., None], 1e-3)
corr = low(im) - low(al)
print('low frequency colour offset (code values): mean', np.round(corr.reshape(-1, 3).mean(0), 2).tolist(), 'max abs %.1f' % np.abs(corr).max())
al = np.clip(al.astype(np.float32) + corr, 0, 255)
diff = np.abs(al - im.astype(np.float32)).max(2)
print('mean abs difference where unchanged %.2f' % diff[same].mean())
cv2.imwrite(f'{WORK}/plate-{take}-aligned.png', np.clip(al + 0.5, 0, 255).astype(np.uint8))
np.save(f'{WORK}/plate-{take}-diff.npy', diff.astype(np.float32))
v = np.clip(cv2.GaussianBlur(diff, (0, 0), 1.5) * 3, 0, 255).astype(np.uint8)
cv2.imwrite('out/work/earth/view/plate-diff.jpg', cv2.resize(v, (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
