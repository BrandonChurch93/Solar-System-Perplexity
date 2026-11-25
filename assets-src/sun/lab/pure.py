"""Compares the pictures pure.ts drew: every one against the frame drawn alone, whole and in the rows of the ground.
usage: python3 assets-src/sun/lab/pure.py out/work/sun/lab/pure"""
import sys, glob, hashlib
import numpy as np
from PIL import Image

files = sorted(glob.glob(sys.argv[1] + '/f*.png'))
alone = [f for f in files if f.endswith('-alone.png')][0]
a = np.asarray(Image.open(alone).convert('RGB')).astype(int)
k = int(a.shape[0] * 0.6)
print(alone, 'whole', hashlib.sha256(a.tobytes()).hexdigest()[:16], 'rows', k, 'down', hashlib.sha256(a[k:].tobytes()).hexdigest()[:16])
for f in files:
    if f == alone:
        continue
    b = np.asarray(Image.open(f).convert('RGB')).astype(int)
    d = np.abs(a - b).max(axis=2)
    ys, xs = np.nonzero(d)
    print(f, 'whole', hashlib.sha256(b.tobytes()).hexdigest()[:16], 'rows', k, 'down', hashlib.sha256(b[k:].tobytes()).hexdigest()[:16], 'pixels that differ', len(ys), ('most %d levels, x %d to %d, rows %d to %d, of them in rows %d down: %d' % (d.max(), xs.min(), xs.max(), ys.min(), ys.max(), k, int((ys >= k).sum()))) if len(ys) else '')
