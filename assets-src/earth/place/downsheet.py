import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
D = ROOT / 'out/work/earth/place/down'
name = sys.argv[1] if len(sys.argv) > 1 else 'dive-down'
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4
items = json.loads((D / (name + '.json')).read_text())
w, h = 640, 360
rows = (len(items) + cols - 1) // cols
sheet = np.zeros((rows * h, cols * w, 3), np.uint8)
for i, it in enumerate(items):
    img = cv2.resize(cv2.imread(it['file']), (w, h), interpolation=cv2.INTER_AREA)
    cv2.putText(img, 'f%d  height %.4f' % (it['frame'], it['height']), (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
    cv2.putText(img, 'f%d  height %.4f' % (it['frame'], it['height']), (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
    sheet[(i // cols) * h : (i // cols + 1) * h, (i % cols) * w : (i % cols + 1) * w] = img
out = D / (name + '-sheet.jpg')
cv2.imwrite(str(out), sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
print(out)
