"""The lead picture for a fill take: a held plate (force.py) with the ground around the twin's fan greyed out.

Inside the fan (mask over maskFrom) the held plate stays; within --reach-deg of the fan, or everywhere outside it
when no reach is given, the picture is flat grey for the generator to fill; an outer frame of --frame-share of the
width stays as it is, so the take joins the level above.
  python3 assets-src/mars/place/ringlead.py --held out/work/place/plate/p0.6-base.png --width-deg 0.6 --frame-share 0.08 --out out/work/place/gen/p06-lead.png
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--held', required=True, help='plate of force.py; its mask is read from NAME-mask.png')
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--reach-deg', type=float, default=0.0)
ap.add_argument('--frame-share', type=float, default=0.08)
ap.add_argument('--keep-centre', type=float, default=0.0, help='share of the width of a centre square that stays (the nested plate below)')
ap.add_argument('--mask-from', type=float, default=0.35)
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--out', required=True)
a = ap.parse_args()
p = cv2.imread(a.held, cv2.IMREAD_UNCHANGED)
if p.dtype == np.uint16:
    p = (p / 257).astype(np.uint8)
p = p[..., :3]
m = cv2.imread(a.held[:-4] + '-mask.png', 0).astype(np.float32) / 255
n = p.shape[0]
fan = (m > a.mask_from).astype(np.uint8)
grey = fan == 0
if a.reach_deg > 0:
    grey &= cv2.distanceTransform(1 - fan, cv2.DIST_L2, 5) < a.reach_deg / a.width_deg * n
f = int(round(a.frame_share * n))
if f > 0:
    keep = np.zeros((n, n), bool)
    keep[:f] = keep[-f:] = True
    keep[:, :f] = keep[:, -f:] = True
    grey &= ~keep
if a.keep_centre > 0:
    c = int(round(a.keep_centre * n / 2))
    grey[n // 2 - c:n // 2 + c, n // 2 - c:n // 2 + c] = False
p[grey] = (128, 128, 128)
cv2.imwrite(a.out, cv2.resize(p, (a.size, a.size), interpolation=cv2.INTER_AREA))
print('grey share %.3f, fan share %.3f' % (grey.mean(), fan.mean()))
