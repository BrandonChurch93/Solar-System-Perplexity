#!/usr/bin/env python3
"""Is a new render the same picture as a kept still?

usage: same.py NEW.png KEPT.jpg

The kept stills are JPG, quality 92, no chroma subsampling. The new render is
encoded the same way before it is compared, so the numbers are the difference
of the pictures and not of the encoders. Prints mean and largest difference
in levels of 0 to 255.
"""
import sys
import cv2
import numpy as np

new = cv2.imread(sys.argv[1])
kept = cv2.imread(sys.argv[2]).astype(np.float32)
ok, buf = cv2.imencode('.jpg', new, [cv2.IMWRITE_JPEG_QUALITY, 92, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
same = cv2.imdecode(buf, 1).astype(np.float32)
d = np.abs(same - kept)
print('%s against %s: mean %.4f, 99th percentile %.1f, largest %.0f' % (sys.argv[1], sys.argv[2], d.mean(), np.percentile(d, 99), d.max()))
