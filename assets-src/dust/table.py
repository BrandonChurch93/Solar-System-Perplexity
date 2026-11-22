import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float64)

def row(a, n):
    d = load(a) - load(n)
    peak = d.max(axis=2)
    labels, k = ndimage.label(peak >= 2, structure=np.ones((3, 3)))
    tops = ndimage.maximum(peak, labels, range(1, k + 1)) if k else np.zeros(0)
    boxes = [max(s[0].stop - s[0].start, s[1].stop - s[1].start) for s in ndimage.find_objects(labels)]
    band = lambda lo, hi: int(((tops >= lo) & (tops < hi)).sum())
    return int((peak > 0).sum()), band(3, 999), band(3, 6), band(6, 10.5), band(10.5, 15), band(15, 999), int(peak.max()), max(boxes, default=0)

print('| frame | which | pixels changed | grains at 3 or more | 3 to 5 | 6 to 10 | 11 to 14 | 15 or more | largest | longest mark px |')
print('|---|---|---|---|---|---|---|---|---|---|')
for arg in sys.argv[1:]:
    f, which, a, n = arg.split(',')
    print('| ' + ' | '.join(str(v) for v in (f, which) + row(a, n)) + ' |')
