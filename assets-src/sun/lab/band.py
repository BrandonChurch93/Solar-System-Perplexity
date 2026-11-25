"""Reads band.ts's pictures: the share of the low band at each frame (least squares of the law's picture between the
pictures with the share at 0 and at 1), and the largest change of a fixed place of the ground from a frame to the
next that the law makes: the share's step times the band's whole swing at that place, in levels of 255.
usage: python3 assets-src/sun/lab/band.py out/work/sun/lab/band"""
import sys, glob, re
import numpy as np
from PIL import Image

d = sys.argv[1]
frames = sorted({int(re.search(r'f(\d+)-', f).group(1)) for f in glob.glob(d + '/f*-law.png')})
load = lambda f, n: np.asarray(Image.open('%s/f%d-%s.png' % (d, f, n)).convert('RGB')).astype(float)
share = {}
swing = {}
for f in frames:
    p0, p1, pl = load(f, '0'), load(f, '1'), load(f, 'law')
    dd = p1 - p0
    share[f] = float((dd * (pl - p0)).sum() / max((dd * dd).sum(), 1e-9))
    sw = np.abs(dd).max(axis=2)
    swing[f] = sw
    print('frame %d share %.4f swing of the band: largest %.1f levels, 99th percentile %.1f, mean %.2f' % (f, share[f], sw.max(), np.percentile(sw, 99), sw.mean()))
for a, b in zip(frames, frames[1:]):
    if b - a != 1:
        continue
    st = abs(share[b] - share[a])
    sw = np.maximum(swing[a], swing[b])
    print('frames %d to %d: share steps %.4f, largest change of a fixed place %.2f levels (99th percentile of places %.2f)' % (a, b, st, st * sw.max(), st * np.percentile(sw, 99)))
