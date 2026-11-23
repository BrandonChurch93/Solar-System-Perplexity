"""A labelled contact sheet of check frames.

python3 assets-src/venus/place/sheet.py OUT.jpg COLS WIDTH FILE [FILE ...]
The label of a tile is the part of its file name after the last 'f' or 'top-' tag (the frame number or the height).
"""
import re
import sys
from pathlib import Path

import cv2
import numpy as np

out, cols, width = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
tiles = []
for f in sys.argv[4:]:
    im = cv2.imread(f)
    h = round(im.shape[0] * width / im.shape[1])
    im = cv2.resize(im, (width, h), interpolation=cv2.INTER_AREA)
    m = re.search(r'-(f\d+|top-[\d.f]+?)(?:-[a-z]+)?\.png$', Path(f).name)
    label = m.group(1) if m else Path(f).stem
    cv2.putText(im, label, (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3, cv2.LINE_AA)
    cv2.putText(im, label, (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    tiles.append(im)
while len(tiles) % cols:
    tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
print(out, len(sys.argv) - 4, 'tiles')
