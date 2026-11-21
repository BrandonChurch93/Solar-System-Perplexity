import sys
import numpy as np, cv2

W, H = 2816, 1584
M, MB = 704, 396
im = cv2.imread('references/approved/earth-close.jpg')
BOX = {'left': (M, 0, W, H), 'right': (0, 0, W - M, H), 'bottom': (0, 0, W, H - MB)}
for n in sys.argv[1:]:
    ref = cv2.imread(f'out/work/earth/relief/edge-input-{n}.jpg')
    t = cv2.resize(cv2.imread(f'out/work/earth/relief/edge-{n}.png'), (W, H), interpolation=cv2.INTER_LANCZOS4)
    x0, y0, x1, y1 = BOX[n]
    s = 4
    g0 = cv2.cvtColor(cv2.resize(ref, (W // s, H // s), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    g1 = cv2.cvtColor(cv2.resize(t, (W // s, H // s), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    mask = np.zeros(g0.shape, np.uint8)
    mask[(y0 + 24) // s:(y1 - 24) // s, (x0 + 24) // s:(x1 - 24) // s] = 255
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), mask, 5)
    full = warp.copy()
    full[:, 2] *= s
    al = cv2.warpAffine(t, full, (W, H), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    a = cv2.cvtColor(cv2.resize(ref, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    b = cv2.cvtColor(cv2.resize(al, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 5, 31, 5, 7, 1.5, 0)
    mag = np.hypot(flow[..., 0], flow[..., 1]) * 2
    inner = np.zeros(mag.shape, bool)
    inner[(y0 + 30) // 2:(y1 - 30) // 2, (x0 + 30) // 2:(x1 - 30) // 2] = True
    core = np.zeros(mag.shape, bool)
    core[(y0 + 150) // 2:(y1 - 150) // 2, (x0 + 150) // 2:(x1 - 150) // 2] = True
    ring = inner & ~core
    d = np.abs(al.astype(np.float32) - ref.astype(np.float32)).mean(2)
    left = (al.astype(int) - [255, 0, 255])
    magenta = int(((np.abs(left).sum(2) < 60)).sum())
    print(n, 'ECC %.4f' % cc, 'affine', np.round(full, 4).tolist())
    print('  flow inside px: median %.2f p90 %.2f p99 %.2f; ring: median %.2f p99 %.2f; mean abs colour %.2f; magenta px left %d' % (*np.percentile(mag[inner], [50, 90, 99]), *np.percentile(mag[ring], [50, 99]), d[y0 + 24:y1 - 24, x0 + 24:x1 - 24].mean(), magenta))
    cv2.imwrite(f'out/work/earth/relief/edge-{n}-aligned.png', al)
    cv2.imwrite(f'out/work/earth/view/edge-{n}-small.jpg', cv2.resize(al, (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
