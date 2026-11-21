import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
a = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))
H, W = a.shape[:2]
boxes = {"near B": (500, 900, 470, 560), "left A": (60, 700, 360, 500), "mid B": (1300, 1000, 600, 400), "far B": (700, 520, 500, 160)}


def hp(img, sigma):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    return g - cv2.GaussianBlur(g, (0, 0), sigma)


out = []
names = sys.argv[2:]
imgs = [a] + [cv2.resize(cv2.imread(n), (W, H), interpolation=cv2.INTER_CUBIC) for n in names]
for key, (x, y, w, h) in boxes.items():
    row = []
    for im in imgs:
        c = im[y:y + h, x:x + w]
        row.append("%.4f/%.4f" % (hp(c, 1.5).std(), hp(c, 6).std()))
    print(key, "rms above 1.5 px / 6 px:", " | ".join(row))
x, y, w, h = boxes[sys.argv[1]] if sys.argv[1] in boxes else boxes["near B"]
cv2.imwrite(str(ROOT / "out/work/saturn/fine-check.jpg"), np.hstack([im[y:y + h, x:x + w] for im in imgs]), [cv2.IMWRITE_JPEG_QUALITY, 93])
