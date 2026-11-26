#!/usr/bin/env python3
"""chain2.py DIR K0 K1 [SCALE] [OUT.png]: as chain.py, with a body of my own (the bright ball: blurred grey over LEVEL, less a margin),
given to the reader's carry and readings as first and last. Not the reader's body from the poses."""
import sys, os
sys.path.insert(0, '/home/user/workspace/repo/tools/img')
import numpy as np, cv2
import smooth as S
d = sys.argv[1]; k0 = int(sys.argv[2]); k1 = int(sys.argv[3]); scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.25
step = int(os.environ.get('STEP', '1')); level = float(os.environ.get('LEVEL', '45')); margin = int(os.environ.get('MARGIN', '10'))
paths = [os.path.join(d, 'k%06d-r2.png' % k) for k in range(k0, k1 + 1, step)]
frames = [S.small(S.grey(p), scale) for p in paths]
def ball(g):
    m = (cv2.GaussianBlur(g.astype(np.float32), (0, 0), 8) > level).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = (lab == big).astype(np.uint8)
    m = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * margin + 1, 2 * margin + 1)))
    return m > 0
n = len(frames) - 1
first = ball(frames[0]); last = ball(frames[n])
fw = [S.motion(frames[i], frames[i + 1]) for i in range(n)]
bw = [S.motion(frames[i + 1], frames[i]) for i in range(n)]
sigma = 20 * 0.25; wide = 40 * 0.25
way = S.carry(fw, bw, 0, n, first, last)
dd, moved, ok = S.change(frames, fw, bw, 0, n, sigma, first, last, way)
onward, back = S.readings(frames, fw, bw, 0, n, scale, sigma, wide, 1.0, first, last, lambda j: S.grey(paths[j]), way, moved)
value, spot, share, band = S.reading(onward, back, scale)
vo = S.patterned(onward[0]); vb = S.patterned(back[0]) if back is not None else (None, None, None)
print('pattern %s at %s (judged share %.3f, band %s, my body share %.3f) | onward %s | read on the later frame %s' % (
    'none' if value is None else '%.3f' % value, spot, share, band, first.mean(), 'none' if vo[0] is None else '%.3f' % vo[0], 'none' if vb[0] is None else '%.3f' % vb[0]))
if len(sys.argv) > 5:
    p = onward[0] if (back is None or vb[0] is None or (vo[0] or 0) >= vb[0]) else back[0]
    cv2.imwrite(sys.argv[5], np.clip(np.nan_to_num(p) * 255, 0, 255).astype(np.uint8))
    cv2.imwrite(sys.argv[5].replace('.png', '-body.png'), (first * 255).astype(np.uint8))
