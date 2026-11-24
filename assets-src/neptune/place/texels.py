"""Texels per pixel of the frames drawn with --diag texels (round 39, item 3).

python3 assets-src/neptune/place/texels.py DIR/f*-texels.png

The picture of the diagnostic holds in red the texels per pixel (0 to 2, the view caps at 2) and in green 255 where a
pixel is counted (ground of the globe or of the close view). Per frame: the counted pixels, the share under 1 texel per
pixel (the count of G13, tools/measure/texels.ts: red under 127.5), the least value in the frame, the value that 1 in
1000 counted pixels lies under, and the mean.
"""
import os
import sys

import cv2
import numpy as np

print('frame\tcounted\tsoft %\tleast\t0.1 %\tmean')
for path in sys.argv[1:]:
    im = cv2.imread(path)[..., ::-1].astype(np.float32)
    counted = im[..., 1] > 127.5
    n = int(counted.sum())
    name = os.path.basename(path).replace('-texels.png', '').replace('f', '')
    if not n:
        print(name + '\t0')
        continue
    red = im[..., 0][counted] / 255 * 2
    soft = float((im[..., 0][counted] < 127.5).sum()) / n * 100
    print('%s\t%d\t%.3f\t%.2f\t%.2f\t%.2f' % (name, n, soft, float(red.min()), float(np.percentile(red, 0.1)), float(red.mean())))
