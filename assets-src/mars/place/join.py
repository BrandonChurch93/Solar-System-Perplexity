"""Joins the 3 x 3 windows of a place picture dump (dump.sh) into one picture and one cover.
  python3 assets-src/mars/place/join.py out/work/place/dump dive
"""
import sys
import cv2
import numpy as np

folder, kind = sys.argv[1], sys.argv[2]
W, H = 4496, 2668
for what in ('image', 'alpha'):
    full = np.zeros((H, W, 3), np.uint8)
    seen = np.zeros((H, W), bool)
    worst = 0
    for x in (0, 1920, 2576):
        for y in (0, 1080, 1588):
            tile = cv2.imread('%s/%s-%s-%d-%d.png' % (folder, kind, what, x, y), cv2.IMREAD_COLOR)
            part = full[y:y + 1080, x:x + 1920]
            both = seen[y:y + 1080, x:x + 1920]
            if both.any():
                worst = max(worst, int(np.abs(part[both].astype(int) - tile[both].astype(int)).max()))
            part[:] = tile
            seen[y:y + 1080, x:x + 1920] = True
    print(kind, what, 'covered', bool(seen.all()), 'largest difference where windows overlap', worst)
    cv2.imwrite('%s/%s-%s.png' % (folder, kind, what), full)
