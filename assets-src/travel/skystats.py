#!/usr/bin/env python3
# usage: skystats.py IMAGE x0,y0,x1,y1 [IMAGE x0,y0,x1,y1 ...]   box in pixels of the image scaled to 1920 wide; prints median luminance and peaks per megapixel above 0.06, 0.25, 0.5
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter, maximum_filter

WIDE = 1920
LEVELS = (0.06, 0.25, 0.5)

def stats(path, box):
    im = Image.open(path).convert('RGB')
    if im.width != WIDE:
        im = im.resize((WIDE, round(im.height * WIDE / im.width)), Image.LANCZOS)
    lum = np.asarray(im, dtype=np.float32).mean(axis=2) / 255
    x0, y0, x1, y1 = box
    pad = 8
    a = lum[max(y0 - pad, 0):y1 + pad, max(x0 - pad, 0):x1 + pad]
    over = a - median_filter(a, size=9)
    peak = (over == maximum_filter(over, size=3))
    oy, ox = y0 - max(y0 - pad, 0), x0 - max(x0 - pad, 0)
    over = over[oy:oy + y1 - y0, ox:ox + x1 - x0]
    peak = peak[oy:oy + y1 - y0, ox:ox + x1 - x0]
    mp = over.size / 1e6
    return float(np.median(lum[y0:y1, x0:x1])), [int(round(np.count_nonzero(peak & (over > t)) / mp)) for t in LEVELS]

if __name__ == '__main__':
    args = sys.argv[1:]
    for i in range(0, len(args), 2):
        box = [int(v) for v in args[i + 1].split(',')]
        med, counts = stats(args[i], box)
        print(f'{args[i]} box {args[i + 1]}: median {med:.3f}; peaks per megapixel above 0.06 / 0.25 / 0.5: {counts[0]:,} / {counts[1]:,} / {counts[2]:,}')
