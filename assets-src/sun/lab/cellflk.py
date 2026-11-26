"""MAIL 1218 by the cell itself: how much the mean light of a cell changes within 12 film frames, the cell followed.
Reads two eye held clips of the same captures (clip.ts --from 180 --to 276 --step 24 --hold 180): DIR the picture,
MASKDIR the same with lab.json "show": "seam" (the way to the border as heat, so a cell is a light island). A cell
is a connected island of the mask; from one capture to the next it is the island that shares most of its ground
(at least half of the smaller of the two). Its light is the mean of the largest channel of the picture inside its
own island at that capture. Prints the largest change as a share of the lighter of the two, and the share of
cells over a tenth, for all pairs of captures that follow each other.
usage: python3 assets-src/sun/lab/cellflk.py DIR MASKDIR X Y W H [least area px]"""
import sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

d, md = sys.argv[1], sys.argv[2]
x0, y0, w, h = (int(v) for v in sys.argv[3:7])
least = int(sys.argv[7]) if len(sys.argv) > 7 else 600
files = sorted(glob.glob(d + '/k*.png'))
masks = sorted(glob.glob(md + '/k*.png'))
assert len(files) == len(masks) and files
def box(f):
    return np.asarray(Image.open(f).convert('RGB')).astype(float).max(axis=2)[y0:y0 + h, x0:x0 + w] / 255
ims = [box(f) for f in files]
labs = []
for f in masks:
    m = box(f)
    inside = ndimage.binary_erosion(m > 0.5 * (np.percentile(m, 5) + np.percentile(m, 95)), iterations=1)
    lab, n = ndimage.label(inside)
    labs.append((lab, n))
rows = []
for i in range(len(ims) - 1):
    la, na = labs[i]
    lb, nb = labs[i + 1]
    area_a = np.bincount(la.ravel(), minlength=na + 1)
    area_b = np.bincount(lb.ravel(), minlength=nb + 1)
    sum_a = np.bincount(la.ravel(), weights=ims[i].ravel(), minlength=na + 1)
    sum_b = np.bincount(lb.ravel(), weights=ims[i + 1].ravel(), minlength=nb + 1)
    pair = la.astype(np.int64) * (nb + 1) + lb
    cnt = np.bincount(pair.ravel(), minlength=(na + 1) * (nb + 1)).reshape(na + 1, nb + 1)
    cnt[0, :] = 0
    cnt[:, 0] = 0
    touch = set(np.unique(la[0, :])) | set(np.unique(la[-1, :])) | set(np.unique(la[:, 0])) | set(np.unique(la[:, -1]))
    for a in range(1, na + 1):
        if area_a[a] < least or a in touch:
            continue
        b = int(cnt[a].argmax())
        if b == 0 or cnt[a, b] < 0.5 * min(area_a[a], area_b[b]):
            continue
        ma, mb = sum_a[a] / area_a[a], sum_b[b] / area_b[b]
        cy, cx = ndimage.center_of_mass(la == a)
        rows.append((abs(mb - ma) / max(ma, mb, 1e-6), i, int(x0 + cx), int(y0 + cy), ma, mb, int(area_a[a]), int(area_b[b])))
rows.sort(reverse=True)
print('cells followed', len(rows), 'pairs of captures', len(ims) - 1, 'least area', least)
for c, i, x, y, ma, mb, aa, ab in rows[:6]:
    print('change %.3f capture %d at [%d, %d] means %.3f %.3f areas %d %d' % (c, i, x, y, ma, mb, aa, ab))
allc = np.array([r[0] for r in rows])
print('largest %.3f median %.3f share of cells over a tenth %.3f' % (allc.max(), np.median(allc), (allc > 0.1).mean()))
