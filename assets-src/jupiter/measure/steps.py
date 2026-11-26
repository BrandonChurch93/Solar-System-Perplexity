# steps.py FILE Y0 Y1 [LEVELS] : the lit left limb row by row: where the grey level crosses given levels (sub pixel), and how far those places lie from a smooth curve
import sys, numpy as np
from PIL import Image
f, y0, y1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
levels = [float(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else [60, 80, 120, 160, 200]
a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
L = a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114
ys = np.arange(y0, y1)
for lv in levels:
    xs = []
    for y in ys:
        r = L[y]
        over = r >= lv
        run = np.convolve(over.astype(np.float32), np.ones(12), 'valid')
        j = int(np.argmax(run >= 12))
        x = (j - 1) + (lv - r[j - 1]) / max(r[j] - r[j - 1], 1e-6)
        xs.append(x)
    xs = np.array(xs)
    p = np.polyfit(ys - ys.mean(), xs, 6)
    res = xs - np.polyval(p, ys - ys.mean())
    print('%s level %3.0f rows %d to %d: x %.1f to %.1f, off a smooth curve rms %.3f px, largest %.3f px, row to row rms %.3f px' % (f.split('/')[-1], lv, y0, y1, xs.min(), xs.max(), res.std(), np.abs(res).max(), np.diff(res).std()))
