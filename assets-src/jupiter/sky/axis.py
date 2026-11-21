import sys
import numpy as np
from PIL import Image, ImageFilter
W = 48
def scan(path, gap=6):
    g = Image.open(path).convert('L')
    raw = np.asarray(g, dtype=np.float32)
    im = raw - np.asarray(g.filter(ImageFilter.GaussianBlur(4)), dtype=np.float32)
    h, w = im.shape
    out = []
    for x0 in range(W, w - W, 2):
        for y0 in range(0, h - 216 + 1, 108):
            a = im[y0:y0 + 216, x0 - W:x0][:, ::-1]
            b = im[y0:y0 + 216, x0:x0 + W]
            if a.std() < 1.5 or b.std() < 1.5 or raw[y0:y0 + 216, x0 - W:x0 + W].mean() > 70:
                continue
            c = float(np.corrcoef(a.ravel(), b.ravel())[0, 1])
            if c > 0.5:
                c2 = float(np.corrcoef(a[:, gap:].ravel(), b[:, gap:].ravel())[0, 1])
                out.append(('vertical x', x0, y0, round(c, 2), 'without the %d px beside the axis' % gap, round(c2, 2)))
    for y0 in range(W, h - W, 2):
        for x0 in range(0, w - 384 + 1, 192):
            a = im[y0 - W:y0, x0:x0 + 384][::-1, :]
            b = im[y0:y0 + W, x0:x0 + 384]
            if a.std() < 1.5 or b.std() < 1.5 or raw[y0 - W:y0 + W, x0:x0 + 384].mean() > 70:
                continue
            c = float(np.corrcoef(a.ravel(), b.ravel())[0, 1])
            if c > 0.5:
                c2 = float(np.corrcoef(a[gap:].ravel(), b[gap:].ravel())[0, 1])
                out.append(('horizontal y', y0, x0, round(c, 2), 'without the %d px beside the axis' % gap, round(c2, 2)))
    return out
for p in sys.argv[1:]:
    r = scan(p)
    print(p[-32:], 'clean' if not r else '')
    for t in sorted(r, key=lambda t: -t[3])[:5]:
        print('   ', *t)
