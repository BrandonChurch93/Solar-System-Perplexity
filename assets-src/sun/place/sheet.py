"""Lay frames into one sheet. usage: python3 assets-src/sun/place/sheet.py OUT.jpg COLS WIDTH FILE [FILE ...]"""
import sys
import numpy as np
import cv2

out, cols, width = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
tiles = []
for f in files:
    im = cv2.imread(f)
    h = width * im.shape[0] // im.shape[1]
    im = cv2.resize(im, (width, h), interpolation=cv2.INTER_AREA)
    label = f.split('/')[-1].rsplit('.', 1)[0]
    cv2.putText(im, label, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3, cv2.LINE_AA)
    cv2.putText(im, label, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    tiles.append(im)
while len(tiles) % cols:
    tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
