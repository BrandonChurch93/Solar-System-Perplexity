import os
import sys
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
sys.path.insert(0, 'assets-src/venus/wrap')
from geo import WORK
from faces import bases, render_face

eq_path, w_path, keys = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
eq = cv2.imread(eq_path, cv2.IMREAD_COLOR)
wt = cv2.imread(w_path, cv2.IMREAD_GRAYSCALE)
os.makedirs(WORK + '/wrap/s1', exist_ok=True)
B = bases()
for k in keys:
    f = render_face(eq, B[k], interp=cv2.INTER_AREA if False else cv2.INTER_LINEAR)
    m = render_face(wt, B[k]).astype(np.float32) / 255
    known = m > 0.9
    known = cv2.erode(known.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    out = np.where(known[..., None], f, np.array([255, 0, 255], np.uint8))
    cv2.imwrite(WORK + f'/wrap/s1/in-{k}.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(WORK + f'/wrap/s1/known-{k}.png', known.astype(np.uint8) * 255)
    print(k, 'known fraction', round(float(known.mean()), 3))
