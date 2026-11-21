import sys

import cv2
import numpy as np
from PIL import Image


def feat(img):
    f = img.astype(np.float32) / 255
    return cv2.GaussianBlur(f[..., 2] - f[..., 0], (0, 0), 1.5)


def blocks(a, b, block=128, step=64):
    h, w = a.shape
    out = []
    win = cv2.createHanningWindow((block, block), cv2.CV_32F)
    for y in range(0, h - block + 1, step):
        for x in range(0, w - block + 1, step):
            pa, pb = a[y:y + block, x:x + block], b[y:y + block, x:x + block]
            if pa.std() < 0.03:
                continue
            (dx, dy), resp = cv2.phaseCorrelate(pa - pa.mean(), pb - pb.mean(), win)
            out.append((x + block // 2, y + block // 2, dx, dy, resp))
    return np.array(out)


if __name__ == "__main__":
    a = np.asarray(Image.open(sys.argv[1]).convert("RGB"))
    b = Image.open(sys.argv[2]).convert("RGB")
    if b.size != (a.shape[1], a.shape[0]):
        b = b.resize((a.shape[1], a.shape[0]), Image.LANCZOS)
    b = np.asarray(b)
    r = blocks(feat(a), feat(b))
    good = r[r[:, 4] > 0.25]
    mag = np.hypot(good[:, 2], good[:, 3])
    print("blocks %d of %d, shift px at %d: median %.2f p90 %.2f max %.2f, mean dx %.2f dy %.2f" % (len(good), len(r), a.shape[1], np.median(mag), np.percentile(mag, 90), mag.max(), good[:, 2].mean(), good[:, 3].mean()))
    worst = good[np.argsort(-mag)[:8]]
    for x, y, dx, dy, resp in worst:
        print("  at %4d %4d shift %+.2f %+.2f resp %.2f" % (x, y, dx, dy, resp))
    d = np.abs(cv2.GaussianBlur(a.astype(np.float32), (0, 0), 12) - cv2.GaussianBlur(b.astype(np.float32), (0, 0), 12))
    print("low frequency difference in code values: mean %.2f p99 %.2f max %.2f" % (d.mean(), np.percentile(d, 99), d.max()))
