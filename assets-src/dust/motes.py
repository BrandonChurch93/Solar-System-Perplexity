import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float64)

with_dust, without = load(sys.argv[1]), load(sys.argv[2])
floor = float(sys.argv[3]) if len(sys.argv) > 3 else 2.5
d = with_dust - without
peak = d.max(axis=2)
lum = d @ np.array([0.2126, 0.7152, 0.0722])
print('changed pixels', int((np.abs(d).max(axis=2) > 0).sum()), 'max rise', peak.max(), 'max fall', d.min())
mask = peak >= floor
labels, n = ndimage.label(mask, structure=np.ones((3, 3)))
rows = []
for i, sl in enumerate(ndimage.find_objects(labels), 1):
    region = labels[sl] == i
    p = peak[sl] * region
    top = p.max()
    half = int((p >= top / 2).sum())
    h, w = region.shape
    y, x = np.unravel_index(p.argmax(), p.shape)
    rows.append((top, half, w, h, sl[1].start + x, sl[0].start + y, without[sl[0].start + y, sl[1].start + x].max()))
rows.sort(reverse=True)
tops = np.array([r[0] for r in rows]) if rows else np.zeros(0)
print('marks at or over', floor, 'levels:', len(rows))
for lo, hi in [(2.5, 3), (3, 6), (6, 10), (10, 15), (15, 999)]:
    print('  peak', lo, 'to', hi, ':', int(((tops >= lo) & (tops < hi)).sum()))
print('largest box (w, h):', max((max(r[2], r[3]) for r in rows), default=0), ' median px over half peak:', float(np.median([r[1] for r in rows])) if rows else 0)
for r in rows[: int(sys.argv[4]) if len(sys.argv) > 4 else 12]:
    print('  peak %5.1f  px over half %3d  box %3dx%-3d at %4d,%-4d sky %3d' % r)
