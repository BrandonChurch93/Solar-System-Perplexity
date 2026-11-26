#!/usr/bin/env python3
"""pair.py DIR K0 K1 [SCALE] [OUT.png]: the reading of chain2.py for every span K0..k of the chain and for every single step,
and a panel of the whole span: capture K0, capture K1 carried back onto K0, the map of the pattern change (white 1 and more),
with the worst place boxed. STEP, LEVEL, MARGIN as chain2.py."""
import sys, os
sys.path.insert(0, '/home/user/workspace/repo/tools/img')
import numpy as np, cv2
import smooth as S
d = sys.argv[1]; k0 = int(sys.argv[2]); k1 = int(sys.argv[3]); scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.25
step = int(os.environ.get('STEP', '1')); level = float(os.environ.get('LEVEL', '45')); margin = int(os.environ.get('MARGIN', '10'))
ks = list(range(k0, k1 + 1, step))
paths = [os.path.join(d, 'k%06d-r2.png' % k) for k in ks]
frames = [S.small(S.grey(p), scale) for p in paths]
def ball(g):
    m = (cv2.GaussianBlur(g.astype(np.float32), (0, 0), 8) > level).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = (lab == big).astype(np.uint8)
    m = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * margin + 1, 2 * margin + 1)))
    return m > 0
fw = [S.motion(frames[i], frames[i + 1]) for i in range(len(frames) - 1)]
bw = [S.motion(frames[i + 1], frames[i]) for i in range(len(frames) - 1)]
sigma = 20 * 0.25; wide = 40 * 0.25
def read(i, n):
    first = ball(frames[i]); last = ball(frames[i + n])
    way = S.carry(fw, bw, i, n, first, last)
    dd, moved, ok = S.change(frames, fw, bw, i, n, sigma, first, last, way)
    onward, back = S.readings(frames, fw, bw, i, n, scale, sigma, wide, 1.0, first, last, lambda j: S.grey(paths[j]), way, moved)
    value, spot, share, band = S.reading(onward, back, scale)
    return value, spot, share, onward, back
for n in range(1, len(frames)):
    v, spot, share, _, _ = read(0, n)
    print('span %d to %d: pattern %s at %s (judged share %.3f)' % (ks[0], ks[n], 'none' if v is None else '%.3f' % v, spot, share))
for i in range(len(frames) - 1):
    v, spot, share, _, _ = read(i, 1)
    print('step %d to %d: pattern %s at %s (judged share %.3f)' % (ks[i], ks[i + 1], 'none' if v is None else '%.3f' % v, spot, share))
if len(sys.argv) > 5:
    v, spot, share, onward, back = read(0, len(frames) - 1)
    p = np.nan_to_num(onward[0]); a = frames[0].astype(np.float32); b = onward[1]
    q = np.sort(onward[0][np.isfinite(onward[0])])
    print('onward map: median %.3f, 90th %.3f, 99th %.3f, share of the judged area over 0.45: %.3f' % (q[len(q) // 2], q[int(len(q) * .9)], q[int(len(q) * .99)], float((q > 0.45).mean())))
    tiles = [np.clip(a, 0, 255), np.clip(b, 0, 255), np.clip(p * 255, 0, 255)]
    out = np.concatenate([cv2.cvtColor(t.astype(np.uint8), cv2.COLOR_GRAY2BGR) for t in tiles], axis=1)
    if spot:
        x, y = int(spot[0] * scale), int(spot[1] * scale)
        for j in range(3):
            cv2.rectangle(out, (j * a.shape[1] + x - 24, y - 24), (j * a.shape[1] + x + 24, y + 24), (0, 255, 0), 1)
    cv2.imwrite(sys.argv[5], out)
