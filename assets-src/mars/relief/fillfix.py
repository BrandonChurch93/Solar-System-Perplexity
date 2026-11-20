import sys

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
BOX = (3800, 1250, 4400, 1650)
WEDGE = [(3934, 1451), (4071, 1417), (4226, 1357), (4277, 1331), (4226, 1409), (4140, 1486), (4054, 1537), (3968, 1554), (3900, 1520), (3848, 1486)]

for key, k in (('full', 1.0), ('web', 0.5)):
    path = f'public/assets/mars/{key}/relief-L0-color.jpg'
    im = np.asarray(Image.open(path).convert('RGB')).copy()
    x0, y0, x1, y1 = [int(v * k) for v in BOX]
    c = im[y0:y1, x0:x1].astype(np.float32)
    lum = c @ np.array([0.299, 0.587, 0.114], np.float32)
    poly = np.zeros(c.shape[:2], np.uint8)
    cv2.fillPoly(poly, [np.array([(int(x * k) - x0, int(y * k) - y0) for x, y in WEDGE], np.int32)], 255)
    poly = cv2.dilate(poly, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(31 * k) | 1, int(31 * k) | 1)))
    navy = ((lum < 46) & (poly > 0)).astype(np.uint8) * 255
    navy = cv2.dilate(navy, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(13 * k) | 1, int(13 * k) | 1)))
    navy[:2] = navy[-2:] = 0
    navy[:, :2] = navy[:, -2:] = 0
    s = 4 if key == 'full' else 2
    small = cv2.resize(im[y0:y1, x0:x1], None, fx=1 / s, fy=1 / s, interpolation=cv2.INTER_AREA)
    hole = cv2.resize(navy, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
    fill = cv2.resize(cv2.inpaint(small, hole, 9, cv2.INPAINT_TELEA), (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    rng = np.random.default_rng(7)
    fill += cv2.GaussianBlur(rng.normal(0, 5, fill.shape[:2]).astype(np.float32), (0, 0), 1.2 * k + 0.4)[..., None]
    a = cv2.GaussianBlur(navy.astype(np.float32) / 255, (0, 0), 6 * k)[..., None]
    im[y0:y1, x0:x1] = np.clip(c * (1 - a) + fill * a, 0, 255).astype(np.uint8)
    Image.fromarray(im).save(path, quality=93, subsampling=0)
    print(key, int((navy > 0).sum()), 'px repainted')
