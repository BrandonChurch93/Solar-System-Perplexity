"""The base of a plate before its take: the centre crop of the plate above, enlarged, with the plate below nested.

  python3 assets-src/mars/place/nestbase.py --above out/work/place/plate/p3.25-t4.png,3.25 --width-deg 1.2 [--below out/work/place/plate/p0.6-t1.png,0.6] --out out/work/place/plate/base-1.2.png
The plate below is laid in over its whole square but for a feather of --feather of its width at its rim.
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--above', required=True)
ap.add_argument('--below', default='')
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--size', type=int, default=4096)
ap.add_argument('--feather', type=float, default=0.06)
ap.add_argument('--out', required=True)
a = ap.parse_args()


def read(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    return (img.astype(np.float32) / (65535 if img.dtype == np.uint16 else 255))[..., :3]


n = a.size
path, w = a.above.split(',')
A = read(path)
c = int(round(a.width_deg / float(w) * A.shape[0] / 2)) * 2
o = (A.shape[0] - c) // 2
out = cv2.resize(A[o:o + c, o:o + c], (n, n), interpolation=cv2.INTER_CUBIC)
if a.below:
    path, w = a.below.split(',')
    c = int(round(float(w) / a.width_deg * n / 2)) * 2
    B = cv2.resize(read(path), (c, c), interpolation=cv2.INTER_AREA)
    f = max(1, int(round(a.feather * c)))
    ramp = np.clip((np.minimum(np.arange(c), c - 1 - np.arange(c)) + 0.5) / f, 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)
    k = np.minimum(ramp[:, None], ramp[None, :])[..., None].astype(np.float32)
    o = (n - c) // 2
    out[o:o + c, o:o + c] = out[o:o + c, o:o + c] * (1 - k) + B * k
cv2.imwrite(a.out, np.round(np.clip(out, 0, 1) * 65535).astype(np.uint16))
