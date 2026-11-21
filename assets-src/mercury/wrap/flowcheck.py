import sys

import cv2
import numpy as np


def prep(path, n):
    im = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    im = cv2.resize(im, (n, n), interpolation=cv2.INTER_AREA).astype(np.float32)
    lo = cv2.GaussianBlur(im, (0, 0), n / 40)
    hp = im - lo
    sd = np.sqrt(cv2.GaussianBlur(hp * hp, (0, 0), n / 40)) + 2
    return np.clip(128 + 40 * hp / sd, 0, 255).astype(np.uint8)


def flow_stats(a, b, n=1024, mask=None):
    A, B = prep(a, n), prep(b, n)
    f = cv2.calcOpticalFlowFarneback(A, B, None, 0.5, 5, 25, 5, 7, 1.5, 0)
    mag = np.hypot(f[..., 0], f[..., 1])
    m = np.ones_like(mag, bool) if mask is None else mask
    return f, mag, (np.median(mag[m]), np.percentile(mag[m], 90), np.percentile(mag[m], 99))


if __name__ == "__main__":
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
    _, mag, s = flow_stats(sys.argv[1], sys.argv[2], n)
    print(f"{sys.argv[2]} @ {n}: median {s[0]:.2f} p90 {s[1]:.2f} p99 {s[2]:.2f}")
