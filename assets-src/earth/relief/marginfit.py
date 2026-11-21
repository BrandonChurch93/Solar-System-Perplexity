import sys
import numpy as np, cv2

take = sys.argv[1]
MX, MY, W, H = 450, 506, 2816, 1584
CW, CH = W + 2 * MX, H + MY
ref = cv2.imread('out/work/earth/relief/margin-input.png')
t = cv2.resize(cv2.imread(f'out/work/earth/relief/margin-{take}.png'), (CW, CH), interpolation=cv2.INTER_LANCZOS4)
s = 4
g0 = cv2.cvtColor(cv2.resize(ref, (CW // s, CH // s), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
g1 = cv2.cvtColor(cv2.resize(t, (CW // s, CH // s), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
mask = np.zeros(g0.shape, np.uint8)
mask[100 // s:(H - 20) // s, (MX + 20) // s:(MX + W - 20) // s] = 255
warp = np.eye(2, 3, dtype=np.float32)
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7)
cc, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, crit, mask, 5)
print('ECC', round(float(cc), 4), 'affine at 1/%d' % s, np.round(warp, 5).tolist())
full = warp.copy()
full[:, 2] *= s
al = cv2.warpAffine(t, full, (CW, CH), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
a = cv2.cvtColor(cv2.resize(ref, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
b = cv2.cvtColor(cv2.resize(al, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 5, 31, 5, 7, 1.5, 0)
mag = np.hypot(flow[..., 0], flow[..., 1]) * 2
inner = np.zeros(mag.shape, bool)
inner[200 // 2:(H - 30) // 2, (MX + 30) // 2:(MX + W - 30) // 2] = True
ring = inner.copy()
ring[200 // 2:(H - 150) // 2, (MX + 150) // 2:(MX + W - 150) // 2] = False
print('flow inside frame px: median %.2f p90 %.2f p99 %.2f' % tuple(np.percentile(mag[inner], [50, 90, 99])))
print('flow in the 120 px ring inside the edges: median %.2f p90 %.2f p99 %.2f' % tuple(np.percentile(mag[ring], [50, 90, 99])))
d = np.abs(al.astype(np.float32) - ref.astype(np.float32)).mean(2)
print('mean abs colour difference inside frame: %.2f' % d[100:H - 20, MX + 20:MX + W - 20].mean())
cv2.imwrite(f'out/work/earth/relief/margin-{take}-aligned.png', al)
np.save(f'out/work/earth/relief/margin-{take}-flow.npy', flow.astype(np.float32))
