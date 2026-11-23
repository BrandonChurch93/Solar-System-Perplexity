"""The lead picture of a top down fill take: the level above with flat grey where new ground is wanted.

  python3 assets-src/mars/place/filllead.py --above FILE,WIDTH_DEG --width-deg W --grey x0,y0,x1,y1 [--grey ...]
      [--inset FILE,WIDTH_DEG] [--corner SHARE] [--size 2048] --out LEAD.png
--above is cropped about the place to --width-deg. Every --grey box (shares of the width, from the left and the
top) is painted flat grey with corners rounded by --corner of the width. --inset lays a deeper plate into the
middle, at its true size, over the grey: it tells the generator what the ground at the place is. Every --grey-over
box is painted grey after the inset, so it also covers a part of the inset.
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--above', required=True)
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--grey', action='append', default=[])
ap.add_argument('--inset', default='')
ap.add_argument('--grey-over', action='append', default=[])
ap.add_argument('--corner', type=float, default=0.04)
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--out', required=True)
a = ap.parse_args()


def read(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img.dtype == np.uint16:
        img = (img / 257).astype(np.uint8)
    return img[..., :3]


n = a.size
path, w = a.above.split(',')
A = read(path)
c = int(round(a.width_deg / float(w) * A.shape[0] / 2)) * 2
o = (A.shape[0] - c) // 2
out = cv2.resize(A[o:o + c, o:o + c], (n, n), interpolation=cv2.INTER_AREA if c > n else cv2.INTER_CUBIC)
grey = np.zeros((n, n), np.uint8)
for box in a.grey:
    x0, y0, x1, y1 = [int(round(float(v) * n)) for v in box.split(',')]
    grey[y0:y1, x0:x1] = 255
r = max(1, int(round(a.corner * n)))
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
grey = cv2.morphologyEx(grey, cv2.MORPH_OPEN, k)
out[grey > 0] = (128, 128, 128)
if a.inset:
    path, w = a.inset.split(',')
    c = int(round(float(w) / a.width_deg * n / 2)) * 2
    o = (n - c) // 2
    out[o:o + c, o:o + c] = cv2.resize(read(path), (c, c), interpolation=cv2.INTER_AREA)
over = np.zeros((n, n), np.uint8)
for box in a.grey_over:
    x0, y0, x1, y1 = [int(round(float(v) * n)) for v in box.split(',')]
    over[y0:y1, x0:x1] = 255
out[cv2.morphologyEx(over, cv2.MORPH_OPEN, k) > 0] = (128, 128, 128)
cv2.imwrite(a.out, out)
print('grey share %.3f' % ((out == 128).all(axis=2).mean()))
