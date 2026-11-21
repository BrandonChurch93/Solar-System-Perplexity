import sys
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
from geo import *

W, H = 8192, 4096
CURVE = np.array(json.load(open('src/stops/venus/curve.json'))['curve'])


def curve_at(ndl):
    x = np.clip(ndl * 0.5 + 0.5, 0, 1) * 32
    i = np.minimum(np.floor(x), 31).astype(int)
    f = (x - i)[..., None]
    return CURVE[i] * (1 - f) + CURVE[i + 1] * f


def main():
    src = cv2.imread(WORK + '/wrap/hero-eq.png', cv2.IMREAD_COLOR)[..., ::-1]
    out = np.zeros((H, W, 3), np.uint8)
    band = 256
    for y0 in range(0, H, band):
        ys, xs = np.mgrid[y0:y0 + band, 0:W]
        pw = world(lonlat_dir((xs + 0.5) / W * 360 - 180, 90 - (ys + 0.5) / H * 180))
        ndl = pw @ SUN
        lin = scene(src[y0:y0 + band].astype(np.float32) / 255)
        alb = np.clip(lin / curve_at(ndl), 0, 6)
        out[y0:y0 + band] = (encode(alb) * 255 + 0.5).astype(np.uint8)
    cv2.imwrite(WORK + '/wrap/albedo-eq.png', out[..., ::-1])
    cv2.imwrite(WORK + '/wrap/albedo-eq-view.jpg', cv2.resize(out[..., ::-1], (2048, 1024), interpolation=cv2.INTER_AREA))


if __name__ == '__main__':
    main()
