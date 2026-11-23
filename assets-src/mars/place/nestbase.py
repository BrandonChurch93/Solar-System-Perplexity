"""The base of a plate before its take: the centre crop of the plate above, enlarged, with the plate below nested.

  python3 assets-src/mars/place/nestbase.py --above out/work/place/plate/p3.25-t4.png,3.25 --width-deg 1.2 [--below out/work/place/plate/p0.6-t1.png,0.6] --out out/work/place/plate/base-1.2.png
The plate below is laid in over its whole square but for a feather of --feather of its width at its rim. Its broad
tone is matched to the plate above at the rim by a gain (blurred above over blurred below, 0.5 to 2), fading out
--match-reach of its width inside the rim, so the nested square does not read as a lighter or darker tile. With a
floor (nest.matchFloor of plates.json by plate width) the match keeps that share over the whole square: the take
keeps its forms and takes the broad colour of the land above, so the place does not stand pale in the globe.
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
ap.add_argument('--match-blur', type=float, default=0.06, help='blur of the tone match, share of the nested width')
ap.add_argument('--match-reach', type=float, default=0.5, help='how far inside the rim the tone match fades out')
ap.add_argument('--match-floor', type=float, default=-1, help='the tone match never falls under this share inside the nested square (default: nest.matchFloor of plates.json for this width, else 0)')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--out', required=True)
a = ap.parse_args()
floor = a.match_floor
if floor < 0:
    import json
    floor = json.load(open(a.config)).get('nest', {}).get('matchFloor', {}).get('%g' % a.width_deg, 0.0)


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
    under = out[o:o + c, o:o + c]
    s = a.match_blur * c
    gain = np.clip((cv2.GaussianBlur(under, (0, 0), s) + 1e-4) / (cv2.GaussianBlur(B, (0, 0), s) + 1e-4), 0.5, 2.0)
    reach = np.clip((np.minimum(np.arange(c), c - 1 - np.arange(c)) + 0.5) / (a.match_reach * c), 0, 1)
    reach = reach * reach * (3 - 2 * reach)
    m = np.maximum(1 - np.minimum(reach[:, None], reach[None, :]), floor)[..., None].astype(np.float32)
    B = B * (1 + (gain - 1) * m)
    out[o:o + c, o:o + c] = under * (1 - k) + B * k
cv2.imwrite(a.out, np.round(np.clip(out, 0, 1) * 65535).astype(np.uint16))
