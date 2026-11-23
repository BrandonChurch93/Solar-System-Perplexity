"""Is a frame the same picture as its reference? Usage: python3 assets-src/neptune/place/same.py REF NEW [REF NEW ...]"""
import sys

import cv2
import numpy as np

for i in range(1, len(sys.argv) - 1, 2):
    a = cv2.imread(sys.argv[i]).astype(np.int16)
    b = cv2.imread(sys.argv[i + 1]).astype(np.int16)
    if a.shape != b.shape:
        b = cv2.resize(b.astype(np.uint8), (a.shape[1], a.shape[0]), interpolation=cv2.INTER_AREA).astype(np.int16)
    d = np.abs(a - b)
    print('%s against %s: pixels that differ %d of %d, largest step %d, mean %.4f' % (sys.argv[i + 1], sys.argv[i], int((d.max(-1) > 0).sum()), d.shape[0] * d.shape[1], int(d.max()), float(d.mean())))
