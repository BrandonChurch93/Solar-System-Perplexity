"""The lead picture of a take that is led by the laid back plate itself: the forced plate, cropped about the place
to a width, at the size the generator takes, lifted by a gain so its dark ground can be read.

  python3 assets-src/mars/place/platelead.py --plate out/work/place/plate/p1.6.png,1.6 --width-deg 1.6 --out LEAD.png
      [--size 1536] [--gain 1.36] [--knee 0.8] [--over 0.4] [--nest TAKE.png,WIDTH_DEG,GAIN]
Above --knee the lifted value is bent over by --over, so the lit crests do not clip.
--nest lays a take of a smaller plate into the centre (the take was painted over a lead of gain GAIN, so it is
brought to this lead's gain; feathered over 0.08 of its width), so the larger take is led by the smaller one and
a feature of the smaller plate stays where it is in the larger.
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--plate', required=True, help='FILE,WIDTH_DEG')
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--size', type=int, default=1536)
ap.add_argument('--gain', type=float, default=1.36)
ap.add_argument('--knee', type=float, default=0.8)
ap.add_argument('--over', type=float, default=0.4)
ap.add_argument('--nest', default='', help='TAKE.png,WIDTH_DEG,GAIN')
ap.add_argument('--out', required=True)
a = ap.parse_args()

path, w = a.plate.split(',')
img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
img = img[..., :3].astype(np.float32) / (65535 if img.dtype == np.uint16 else 255)
n = img.shape[0]
c = int(round(a.width_deg / float(w) * n / 2)) * 2
o = (n - c) // 2
out = cv2.resize(img[o:o + c, o:o + c], (a.size, a.size), interpolation=cv2.INTER_AREA) * a.gain
out = np.where(out > a.knee, a.knee + (out - a.knee) * a.over, out)
if a.nest:
    path, w, g = a.nest.split(',')
    m = int(round(float(w) / a.width_deg * a.size / 2)) * 2
    B = cv2.imread(path, cv2.IMREAD_COLOR).astype(np.float32) / 255
    B = cv2.resize(B, (m, m), interpolation=cv2.INTER_AREA) * (a.gain / float(g))
    f = max(1, int(round(0.08 * m)))
    ramp = np.clip((np.minimum(np.arange(m), m - 1 - np.arange(m)) + 0.5) / f, 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)
    k = np.minimum(ramp[:, None], ramp[None, :])[..., None].astype(np.float32)
    o = (a.size - m) // 2
    out[o:o + m, o:o + m] = out[o:o + m, o:o + m] * (1 - k) + B * k
cv2.imwrite(a.out, (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))
print('lead %s: %d px of the plate to %d px' % (a.out, c, a.size))
