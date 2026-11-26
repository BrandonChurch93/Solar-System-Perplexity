# pairnum.py A B [C] : how far B stands from A (pixels that differ, mean, largest) and the fine detail of B over A in boxes of 480 by 270; with C also C over A
import sys
import numpy as np
from PIL import Image
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
def lap(x):
    g = x.mean(2)
    return np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
a = load(sys.argv[1]); la = lap(a)
for p in sys.argv[2:]:
    b = load(p); d = np.abs(a - b).max(2)
    print(p)
    print('  differ %.3f, by over 2 %.3f, by over 8 %.4f, largest %d, mean %.3f' % ((d > 0).mean(), (d > 2).mean(), (d > 8).mean(), d.max(), np.abs(a - b).mean()))
    lb = lap(b); h, w = lb.shape
    for r in range(4):
        print('  ' + ' '.join('%.2f' % (lb[r * h // 4:(r + 1) * h // 4, c * w // 4:(c + 1) * w // 4].mean() / max(la[r * h // 4:(r + 1) * h // 4, c * w // 4:(c + 1) * w // 4].mean(), 1e-6)) for c in range(4)))
