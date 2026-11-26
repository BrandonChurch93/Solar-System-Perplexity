# hold_reg_grid.py IMG: a coarse grid over the whole frame's shift and scale at a quarter of the size, to see that the least
# plain number found by hold_bands.py is the least there is (shift -32 to 32 px in steps of 4, scale 0.95 to 1.05 by 0.01)
import sys, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
from PIL import Image
from scipy.ndimage import affine_transform
hero = np.asarray(Image.open(os.path.join(ROOT, 'references', 'approved', 'saturn-hero.png')).convert('RGB').resize((480, 270), Image.LANCZOS)).astype(np.float32)
im = np.asarray(Image.open(sys.argv[1]).convert('RGB').resize((480, 270), Image.LANCZOS)).astype(np.float32)
h, w = 270, 480; cy, cx = (h - 1) / 2, (w - 1) / 2
res = []
for s in np.arange(0.95, 1.0501, 0.01):
    for dx in range(-8, 9):
        for dy in range(-8, 9):
            o = affine_transform(im, [1 / s, 1 / s, 1], offset=[cy - (cy + dy) / s, cx - (cx + dx) / s, 0], order=1, mode='nearest')
            ys = (np.arange(h) - cy - dy) / s + cy; xs = (np.arange(w) - cx - dx) / s + cx
            m = ((ys >= 0) & (ys <= h - 1))[:, None] & ((xs >= 0) & (xs <= w - 1))[None, :]
            res.append((float(np.abs(o - hero)[m].mean()), s, dx * 4, dy * 4))
res.sort()
print('quarter size, plain without a move: %.4f' % np.abs(im - hero).mean())
for r in res[:6]: print('plain %.4f at scale %.2f, shift %+d px right, %+d px down' % r)
by_s = {}
for r in res: by_s.setdefault(round(r[1], 2), r)
print('least by scale: ' + ' '.join('%.2f:%.3f' % (s, by_s[s][0]) for s in sorted(by_s)))
