"""Level against the distance from the lane, a render beside the approved close image.

python3 assets-src/sun/lab/rim.py RENDER.png [RENDER.png ...] [--out PLOT.png] [--box X Y W H] [--dark SHARE]

The lanes of a picture are its darkest SHARE of pixels in the box (default 0.12) after a blur of 1 px. For every
other pixel the way to the nearest lane pixel is read, and the mean and the quartiles of the level (largest
channel) are printed for each px of that way up to 40. A rim shows as a rise, a fall and a second rise (in the mean or in the upper quartile). Plates show as a
larger share of pixels far from any lane.

Cell by cell (the mean over all cells cannot see a band that lies at another distance in each): the picture more
than 2 px from a lane is cut into pieces round the places farthest from any lane (watershed of the way); those of
1200 to 14000 px have each their own profile of the mean level against the
way from the lane. The dip of a cell is the deepest fall between a crest within 8 px of the lane and a later rise
(the lesser of the fall and the rise after it). Printed: the count of cells, the quartiles of the dip, the share of
cells with a dip over 0.04. With --cells PLOT.png the profiles of the ten largest cells of each picture are drawn,
one row a picture.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

args = sys.argv[1:]
out = None
cells = None
box = (260, 820, 1400, 260)
dark = 0.12
names = []
i = 0
while i < len(args):
    if args[i] == '--out':
        out = args[i + 1]; i += 2
    elif args[i] == '--box':
        box = tuple(int(v) for v in args[i + 1:i + 5]); i += 5
    elif args[i] == '--cells':
        cells = args[i + 1]; i += 2
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


def dips(level):
    soft = ndi.gaussian_filter(level, 1.0)
    lane = soft < np.quantile(soft, dark)
    way = ndi.distance_transform_edt(~lane)
    calm = ndi.gaussian_filter(way, 2.0)
    tops, count = ndi.label((calm == ndi.maximum_filter(calm, size=25)) & (calm > 5))
    marks = ndi.watershed_ift((255 - np.clip(calm * 5, 0, 255)).astype(np.uint8), tops.astype(np.int32))
    marks[way <= 2] = 0
    sizes = ndi.sum(np.ones_like(level), marks, range(1, count + 1))
    found = []
    for k in np.argsort(-sizes):
        if sizes[k] > 14000 or sizes[k] < 1200:
            continue
        inside = marks == k + 1
        far = int(way[inside].max())
        if far < 10:
            continue
        mean = np.array([level[inside & (way > d - 0.5) & (way <= d + 0.5)].mean() for d in range(3, far + 1) if (inside & (way > d - 0.5) & (way <= d + 0.5)).sum() >= 12])
        dip = 0.0
        for a in range(0, min(6, len(mean))):
            for b in range(a + 1, len(mean)):
                if b + 1 < len(mean):
                    dip = max(dip, min(mean[a] - mean[b], mean[b + 1:].max() - mean[b]))
        found.append((sizes[k], dip, mean))
    return found


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
rows = [('approved', dips(read('references/approved/sun-close.jpg')))] + [(n.split('/')[-1], dips(read(n))) for n in names]
for name, found in rows:
    d = np.array([f[1] for f in found])
    print(name, 'cells %d dip quartiles %.3f %.3f %.3f share of cells with a dip over 0.04: %.3f' % (len(d), np.quantile(d, 0.25), np.quantile(d, 0.5), np.quantile(d, 0.75), (d > 0.04).mean()))
if cells:
    cw, ch = 150, 130
    im = np.full((ch * len(rows), cw * 10, 3), 20, np.uint8)
    for r, (name, found) in enumerate(rows):
        for c, (size, dip, mean) in enumerate(found[:10]):
            x0, y0 = c * cw, r * ch
            im[y0:y0 + ch, x0] = 70
            im[y0, x0:x0 + cw] = 70
            for d, v in enumerate(mean[:46]):
                y = int(y0 + ch - 6 - v * (ch - 12))
                im[max(y - 1, y0):y + 1, x0 + 4 + d * 3:x0 + 6 + d * 3] = (255, 255, 255) if r == 0 else (255, 170, 40) if dip <= 0.04 else (255, 90, 90)
    Image.fromarray(im).save(cells)
