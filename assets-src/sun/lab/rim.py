"""Level against the distance from the lane, a render beside the approved close image.

python3 assets-src/sun/lab/rim.py RENDER.png [RENDER.png ...] [--out PLOT.png] [--box X Y W H] [--dark SHARE]

The lanes of a picture are its darkest SHARE of pixels in the box (default 0.12) after a blur of 1 px. For every
other pixel the way to the nearest lane pixel is read, and the mean and the quartiles of the level (largest
channel) are printed for each px of that way up to 40. A rim shows as a rise, a fall and a second rise (in the mean or in the upper quartile). Plates show as a
larger share of pixels far from any lane.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

args = sys.argv[1:]
out = None
box = (260, 820, 1400, 260)
dark = 0.12
names = []
i = 0
while i < len(args):
    if args[i] == '--out':
        out = args[i + 1]; i += 2
    elif args[i] == '--box':
        box = tuple(int(v) for v in args[i + 1:i + 5]); i += 5
    elif args[i] == '--dark':
        dark = float(args[i + 1]); i += 2
    else:
        names.append(args[i]); i += 1


def read(path):
    im = Image.open(path).convert('RGB')
    if not im.size == (1920, 1080):
        im = im.resize((1920, 1080), Image.LANCZOS)
    x, y, w, h = box
    return np.asarray(im.crop((x, y, x + w, y + h))).astype(float).max(axis=2) / 255


def profile(level):
    soft = ndi.gaussian_filter(level, 1.0)
    lane = soft < np.quantile(soft, dark)
    way = ndi.distance_transform_edt(~lane)
    rows = []
    for d in range(1, 41):
        pick = level[(way > d - 0.5) & (way <= d + 0.5)]
        rows.append((pick.mean(), np.quantile(pick, 0.25), np.quantile(pick, 0.75), pick.size) if pick.size else (np.nan, np.nan, np.nan, 0))
    return np.array(rows)


def bump(mean):
    worst = 0.0
    for d in range(0, 14):
        later = mean[d + 1:d + 12]
        worst = max(worst, mean[d] - later.min())
    return worst


sets = [('approved', profile(read('references/approved/sun-close.jpg')))] + [(n.split('/')[-1], profile(read(n))) for n in names]
for name, p in sets:
    total = p[:, 3].sum()
    print(name, 'upper quartile by px 1 2 3 4 5 6 8 10 12 16 20:', ' '.join('%.3f' % p[d - 1, 2] for d in (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20)), 'share of pixels within 40 px that lie over 10 px from a lane: %.3f, over 20 px: %.3f' % (p[10:, 3].sum() / total, p[20:, 3].sum() / total))
    print(name, 'mean by px 1 2 3 4 5 6 8 10 12 16 20 25 30 40:', ' '.join('%.3f' % p[d - 1, 0] for d in (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 30, 40)), 'fall after a rise: %.3f' % bump(p[:, 0]))
if out:
    w, h = 820, 420
    im = np.full((h, w, 3), 20, np.uint8)
    cols = [(255, 255, 255), (255, 170, 40), (90, 200, 255), (120, 255, 120), (255, 110, 160)]
    for k, (name, p) in enumerate(sets):
        for d in range(40):
            for q, wgt in ((0, 3), (1, 1), (2, 1)):
                v = p[d, q]
                if np.isnan(v):
                    continue
                x = int(10 + d * 20)
                y = int(h - 10 - v * (h - 20))
                im[max(y - wgt, 0):y + wgt, x:x + 16] = cols[k % len(cols)]
    Image.fromarray(im).save(out)
