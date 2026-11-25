"""How much a cell's mean light changes within 12 film frames (MAIL 1218 point 4: no more than a tenth).
Reads the captures of an eye held clip (clip.ts --from 180 --to 276 --step 24 --hold 180), finds the cells of a box as
the tops of the blurred mean picture, takes the mean of the largest channel in a disc on each, and prints the largest
change between two captures that follow each other, as a share of the lighter of the two.
With a second radius the disc is an ellipse (half width, half height): a cell's own outline under the low eye.
usage: python3 assets-src/sun/lab/flicker.py DIR X Y W H [disc radius px] [half height px]"""
import sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

d = sys.argv[1]
x0, y0, w, h = (int(v) for v in sys.argv[2:6])
rad = int(sys.argv[6]) if len(sys.argv) > 6 else 26
ry = int(sys.argv[7]) if len(sys.argv) > 7 else rad
files = sorted(glob.glob(d + '/k*.png'))
ims = [np.asarray(Image.open(f).convert('RGB')).astype(float).max(axis=2)[y0:y0 + h, x0:x0 + w] / 255 for f in files]
mean = ndimage.gaussian_filter(sum(ims) / len(ims), 10)
top = (mean == ndimage.maximum_filter(mean, size=(2 * ry + 1, 2 * rad + 1))) & (mean > np.percentile(mean, 40))
ys, xs = np.nonzero(top)
keep = (ys >= ry) & (ys < h - ry) & (xs >= rad) & (xs < w - rad)
ys, xs = ys[keep], xs[keep]
yy, xx = np.mgrid[-ry:ry + 1, -rad:rad + 1]
disc = (yy * yy / (ry * ry) + xx * xx / (rad * rad)) <= 1.0
rows = []
for y, x in zip(ys, xs):
    m = [float(im[y - ry:y + ry + 1, x - rad:x + rad + 1][disc].mean()) for im in ims]
    ch = [abs(m[i + 1] - m[i]) / max(m[i + 1], m[i], 1e-6) for i in range(len(m) - 1)]
    rows.append((max(ch), x0 + x, y0 + y, m))
rows.sort(reverse=True)
print('cells', len(rows), 'captures', len(files), 'disc radius', rad, ry)
for c, x, y, m in rows[:5]:
    print('change %.3f at [%d, %d] means %s' % (c, x, y, ' '.join('%.3f' % v for v in m)))
allc = np.array([r[0] for r in rows])
print('largest %.3f median %.3f share of cells over a tenth %.3f' % (allc.max(), np.median(allc), (allc > 0.1).mean()))
