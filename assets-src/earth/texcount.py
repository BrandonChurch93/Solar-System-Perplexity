import sys
import numpy as np
import cv2

for path in sys.argv[1:]:
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    r = im[..., 2].astype(np.float32)
    g = im[..., 1]
    counted = g > 127.5
    n = int(counted.sum())
    soft = int((counted & (r < 127.5)).sum())
    t = r[counted] / 255 * 2
    print(path.split('/')[-1], 'counted', n, 'soft', soft, 'fraction %.4f' % (soft / max(n, 1)), 'mean %.2f' % (t.mean() if n else 0), 'min %.2f' % (t.min() if n else 0))
