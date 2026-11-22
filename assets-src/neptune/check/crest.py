import sys

import cv2
import numpy as np

REGIONS = {
    'hold': {'storm': (0.40, 0.33, 0.62, 0.60), 'bands': (0.60, 0.25, 0.82, 0.62), 'lower': (0.50, 0.60, 0.80, 0.90), 'disc': (0.35, 0.15, 0.85, 0.90)},
    'terrain': {'ridge': (0.05, 0.40, 0.55, 0.75), 'eye': (0.42, 0.30, 0.78, 0.60), 'far': (0.10, 0.18, 0.95, 0.40), 'fore': (0.05, 0.70, 0.95, 0.98), 'all': (0.02, 0.12, 0.98, 0.98)},
}
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)


def luma(path, size=None):
    im = cv2.imread(path, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32)
    if size is not None and (im.shape[1], im.shape[0]) != size:
        im = cv2.resize(im, size, interpolation=cv2.INTER_AREA if im.shape[1] > size[0] else cv2.INTER_CUBIC)
    return im @ LUM


def stats(y, ref, box):
    h, w = y.shape
    x0, y0, x1, y1 = int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)
    a, r = y[y0:y1, x0:x1], ref[y0:y1, x0:x1]
    top = np.sort(a.ravel())[-max(a.size // 1000, 1):].mean()
    hp1 = (a - cv2.GaussianBlur(a, (0, 0), 1.2)).std()
    hp4 = (a - cv2.GaussianBlur(a, (0, 0), 4.0)).std()
    k = np.ones((7, 7), np.uint8)
    crest = r >= np.percentile(r, 99)
    pit = r <= np.percentile(r, 5)
    dc = (cv2.dilate(a, k)[crest] - cv2.dilate(r, k)[crest]).mean()
    dp = (cv2.erode(a, k)[pit] - cv2.erode(r, k)[pit]).mean()
    return top, np.percentile(a, 99), np.percentile(a, 50), np.percentile(a, 5), hp1, hp4, dc, dp


def main():
    view, ref_path, files = sys.argv[1], sys.argv[2], sys.argv[3:]
    for f in files:
        first = cv2.imread(f, cv2.IMREAD_COLOR)
        size = (first.shape[1], first.shape[0])
        ref = luma(ref_path, size)
        y = luma(f)
        print(f, size)
        for name, box in REGIONS[view].items():
            a = stats(ref, ref, box)
            b = stats(y, ref, box)
            print('  %-6s top %.1f / %.1f  p99 %.1f / %.1f  p50 %.1f / %.1f  p5 %.1f / %.1f  hp1 %.2f / %.2f (%.3f)  hp4 %.2f / %.2f (%.3f)  crest diff %+.1f  pit diff %+.1f' % (name, a[0], b[0], a[1], b[1], a[2], b[2], a[3], b[3], a[4], b[4], b[4] / a[4], a[5], b[5], b[5] / a[5], b[6], b[7]))


main()
