"""Frame to frame measures on consecutive frames. usage: python3 assets-src/sun/place/steps.py DIR FIRST LAST
Per frame: mean level (0 to 255), mean absolute difference to the frame before, and sharpness
(mean absolute Laplacian of the luma, 3 x 3). A cover, a wash or a swap that can be seen shows as a step
in one of the three against its neighbours."""
import sys
import numpy as np
import cv2

d, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
prev = None
rows = []
for f in range(a, b + 1):
    im = cv2.imread('%s/f%05d.png' % (d, f))
    if im is None:
        prev = None
        continue
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    lap = float(np.abs(cv2.Laplacian(g, cv2.CV_32F, ksize=3)).mean())
    diff = float(np.abs(im.astype(np.float32) - prev).mean()) if prev is not None else float('nan')
    rows.append((f, float(im.mean()), diff, lap))
    prev = im.astype(np.float32)
print('frame\tlevel\tdiff\tsharp\tsharpRatio')
last = None
for f, level, diff, lap in rows:
    print('%d\t%.2f\t%.2f\t%.2f\t%s' % (f, level, diff, lap, '' if last is None else '%.3f' % (lap / last)))
    last = lap
