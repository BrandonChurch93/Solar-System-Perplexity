#!/usr/bin/env python3
"""run.py DIR K0 K1 [SCALE]: the reading of chain2.py for every pair of captures REACH chain steps apart over the chain K0..K1
(STEP between captures, default 1; REACH default 8, so with STEP 2 the pairs are 16 captures apart as the gate's are), one line
a pair, then the worst and the mean. LEVEL, MARGIN as chain2.py. The body is my own (the bright ball), not the reader's."""
import sys, os
sys.path.insert(0, '/home/user/workspace/repo/tools/img')
import numpy as np, cv2
import smooth as S
d = sys.argv[1]; k0 = int(sys.argv[2]); k1 = int(sys.argv[3]); scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.25
step = int(os.environ.get('STEP', '1')); reach = int(os.environ.get('REACH', '8'))
level = float(os.environ.get('LEVEL', '45')); margin = int(os.environ.get('MARGIN', '10'))
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
got = []
for i in range(len(frames) - reach):
    first = ball(frames[i]); last = ball(frames[i + reach])
    way = S.carry(fw, bw, i, reach, first, last)
    dd, moved, ok = S.change(frames, fw, bw, i, reach, sigma, first, last, way)
    onward, back = S.readings(frames, fw, bw, i, reach, scale, sigma, wide, 1.0, first, last, lambda j: S.grey(paths[j]), way, moved)
    value, spot, share, band = S.reading(onward, back, scale)
    print('pair %d to %d: pattern %s at %s (judged share %.3f)' % (ks[i], ks[i + reach], 'none' if value is None else '%.3f' % value, spot, share))
    if value is not None:
        got.append((value, ks[i], spot))
if got:
    w = max(got)
    print('%d pairs read: largest %.3f at capture %d at %s, mean %.3f, pairs over 0.45: %d' % (len(got), w[0], w[1], w[2], float(np.mean([g[0] for g in got])), sum(1 for g in got if g[0] > 0.45)))
