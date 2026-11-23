"""S1 check: the globe side from the twin beside the close side at the same frame.

Usage: python3 assets-src/neptune/place/pair.py GLOBE.png CLOSE.png OUT.jpg [GLOBE_TEXELS.png CLOSE_TEXELS.png]
Writes the two frames side by side over a row with the globe's edges in red on the close frame and a split view.
With the two texels views (green = a pixel of the body) it prints where the horizon lies in each, column by column.
"""
import sys

import cv2
import numpy as np

a = cv2.imread(sys.argv[1])
b = cv2.imread(sys.argv[2])
h, w = a.shape[:2]


def edges(x):
    g = cv2.GaussianBlur(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY), (0, 0), 1.5)
    return cv2.Canny(g, 20, 50)


over = b.copy()
over[edges(a) > 0] = (0, 0, 255)
split = b.copy()
n = 8
for i in range(n):
    if i % 2 == 0:
        split[:, i * w // n:(i + 1) * w // n] = a[:, i * w // n:(i + 1) * w // n]
sheet = np.concatenate([np.concatenate([a, b], 1), np.concatenate([over, split], 1)], 0)
k = 1920 / sheet.shape[1]
cv2.imwrite(sys.argv[3], cv2.resize(sheet, None, fx=k, fy=k, interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])

if len(sys.argv) > 5:
    def line(path):
        m = cv2.imread(path)[..., 1] > 127
        first = np.argmax(m, axis=0).astype(float)
        first[~m.any(axis=0)] = np.nan
        return first
    ya, yb = line(sys.argv[4]), line(sys.argv[5])
    d = ya - yb
    cols = [int(w * f) for f in (0.02, 0.2, 0.4, 0.6, 0.8, 0.98)]
    print('horizon row, globe side :', ' '.join('%6.1f' % ya[c] for c in cols))
    print('horizon row, close side :', ' '.join('%6.1f' % yb[c] for c in cols))
    print('globe minus close, px at %d wide: mean %.2f, largest %.2f, rms %.2f' % (w, np.nanmean(d), np.nanmax(np.abs(d)), np.sqrt(np.nanmean(d * d))))
