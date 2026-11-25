"""The lead of a repainted take of ONE BODY (MAIL 963, MAIL 969): what the image tool is given as image 1.

  base   = the take as it stands (--take, its own painted light, times --gain), enlarged to the plate
  child  = the finer plate, already repainted, reduced into its place in the middle (--child, --child-deg); the base takes
           the child's mean on the band they share, one factor per colour
  shadow = the cast shadow of the cap's own heights at the scene's Sun (country.light of plates.json), soft, on the base only:
           the dark of the approved picture's near ground carried on as the shadow its walls cast (--shadow)
  body   = the close set seen from straight above (heights.py; --top stem), whole where it is at least as fine as the plate
           (plates.json takes.body), over all of it

The picture is reduced to the take's size (1254). Nothing here is laid into a plate: countrytake.py lays the body again, the
rest of the plate is the repainted take.

  python3 assets-src/mars/place/bodylead.py --width-deg 0.3 --take s03-take2.png --stem out/work/place/top/m0.3 --shadow --out TAKES/b03-lead1.png
"""
import argparse
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom  # noqa: E402
from countrytake import Heights, body_share, fit_take, half  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
ap = argparse.ArgumentParser()
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--take', required=True)
ap.add_argument('--takes', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'takes'))
ap.add_argument('--stem', required=True)
ap.add_argument('--child')
ap.add_argument('--child-deg', type=float)
ap.add_argument('--shadow', action='store_true')
ap.add_argument('--fit', help='the lead the take was painted from: the take is held to its broad tone (plates.json takes.fitPx), as countrytake.py does; for the child of the next lead')
ap.add_argument('--gain', help='r,g,b: the level\'s own factor on the base (plates.json takes.levelGain as it stood for the take)')
ap.add_argument('--size', type=int, default=1254)
ap.add_argument('--plates', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json'))
ap.add_argument('--out', required=True)
a = ap.parse_args()
P = json.load(open(a.plates))
B, Lg = P['takes']['body'], P['country']['light']
hgt = np.load(a.stem + '-height.npy')
c = hgt.shape[0]
base = np.asarray(Image.open(os.path.join(a.takes, a.take)).convert('RGB')).astype(np.float32)
base = cv2.resize(base, (c, c), interpolation=cv2.INTER_LANCZOS4 if base.shape[0] < c else cv2.INTER_AREA)
said = []
if a.fit:
    lead = np.asarray(Image.open(os.path.join(a.takes, a.fit)).convert('RGB')).astype(np.float32)
    lead = cv2.resize(lead, (c, c), interpolation=cv2.INTER_LANCZOS4 if lead.shape[0] < c else cv2.INTER_AREA)
    base = fit_take(base, lead, P['takes']['fitPx'] * c / 1254.0)
    said.append('fitted to ' + a.fit)
if a.gain:
    base = base * np.float32([float(x) for x in a.gain.split(',')])
    said.append('gain ' + a.gain)
if a.shadow:
    heights = Heights(os.path.join(ROOT, 'public', 'assets', 'mars', 'full'), json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json'))))
    n = min(c, 1024)
    t = half(a.width_deg)
    at = ((np.arange(n) + 0.5) / n * 2 - 1) * t
    x = np.broadcast_to(at[None, :], (n, n)).astype(np.float32)
    y = np.broadcast_to(-at[:, None], (n, n)).astype(np.float32)
    sun = geom.scene_sun(Lg['sunMoment'])
    flat = float(np.hypot(sun[0], sun[1]))
    h0 = heights.at(x, y, a.width_deg)
    open_ = np.ones((n, n), np.float32)
    size = np.radians(Lg['sunSizeDeg'])
    for u in np.geomspace(2 * t / n, Lg['shadowKm'] / 3389.5, Lg['steps']):
        occ = heights.at(x + sun[0] / flat * u, y + sun[1] / flat * u, a.width_deg)
        open_ = np.minimum(open_, np.clip(0.5 + (h0 + u * sun[2] / flat - occ) / (u * size), 0, 1))
    open_ = cv2.resize(cv2.GaussianBlur(open_, (0, 0), 3.0), (c, c), interpolation=cv2.INTER_LINEAR)[..., None]
    base = base * (open_ + (1 - open_) * np.array(Lg['fill'], np.float32))
    said.append('cast shadow on %.3f' % float((open_ < 0.5).mean()))
if a.child:
    k = np.asarray(Image.open(a.child).convert('RGB')).astype(np.float32)
    m = int(round(c * a.child_deg / a.width_deg))
    k = cv2.resize(k, (m, m), interpolation=cv2.INTER_AREA)
    o = (c - m) // 2
    # one tone where the finer plate ends: the base takes the child's mean on the band they share (the outer tenth of the child),
    # one factor per colour for the whole level, nothing by distance
    w = max(m // 10, 4)
    ring = np.ones((m, m), bool)
    ring[w:m - w, w:m - w] = False
    nest = k[ring].mean(0) / base[o:o + m, o:o + m][ring].mean(0)
    base = base * nest
    said.append('nest ' + ' '.join('%.3f' % x for x in nest))
    base[o:o + m, o:o + m] = k
    said.append('child %g deg on %d of %d texels' % (a.child_deg, m, c))
v, col = body_share(a.stem, a.width_deg, c, B)
out = col * v[..., None] + base * (1 - v[..., None])
out = cv2.resize(out, (a.size, a.size), interpolation=cv2.INTER_AREA)
Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(a.out)
print(a.out, 'body on %.3f' % float((v > 0.5).mean()), *said)
