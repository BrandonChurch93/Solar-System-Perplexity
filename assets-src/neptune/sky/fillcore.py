"""fillcore.py IN_FULL OUTDIR [SHARE]: the black hole in the painted Sun's core of Neptune's hold plate, filled (MAIL 1382, 1389).

public/assets/neptune/full/sky-hold.webp carried a round hole of level 0 inside the white core of its painted Sun (79 texels of
level 0, 10 wide by 11 high, middle at texel 3578.5, 818.6 of 4928 by 2772, there since the plate's first version). In the film at
4605 the engine's Sun disc covers all of it but 2 to 3 px at its upper right, which read as a dark crescent in the Sun.
The fill: every texel within REACH of the hole's middle that is darker than FLOOR, grown by GROW texels so the soft dark rim goes
with it, is painted from the core round it (cv2.inpaint, Telea, radius 3), and then trimmed: each such texel gets its old light
plus SHARE of what the paint adds, counted in linear light. The trim is there because the film's bloom carries the added light out
to 267 px from the Sun, where main's glow already stands over the approved image; with the whole of it (SHARE 1) frame 4605's plain
number rose from 2.930514 to 2.930626. No other texel of the file is touched; the file is written lossless as it was. The web size
is the full size halved with Lanczos, as it was made before (the old web file equals the old full file halved, 0 texels differ),
so it changes only where the hole was."""
import os
import sys

import cv2
import numpy as np
from PIL import Image

AT = (3578.5, 818.6)
REACH = 16
FLOOR = 200
GROW = 2
SHARE = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5


def lin(v):
    c = v / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return 255.0 * np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im)
h, w = a.shape[:2]
yy, xx = np.mgrid[0:h, 0:w]
near = np.hypot(xx - AT[0], yy - AT[1]) < REACH
dark = (a.max(2) < FLOOR) & near
mask = cv2.dilate(dark.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))).astype(bool)
paint = cv2.inpaint(a, mask.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA)
old, new = lin(a.astype(np.float64)), lin(paint.astype(np.float64))
out = a.copy()
out[mask] = np.round(srgb(old + SHARE * (new - old)))[mask].astype(np.uint8)
moved = (out != a).any(2)
ys, xs = np.nonzero(moved)
print('share %.3f | full: texels of level 0 at the place %d, in the mask %d, moved %d, in x %d to %d, y %d to %d; the least level left within %d texels: %d' % (SHARE, int(((a.max(2) == 0) & near).sum()), int(mask.sum()), int(moved.sum()), xs.min(), xs.max(), ys.min(), ys.max(), REACH, int(out.max(2)[near].min())))
os.makedirs(os.path.join(outdir, 'full'), exist_ok=True)
os.makedirs(os.path.join(outdir, 'web'), exist_ok=True)
full = Image.fromarray(out)
full.save(os.path.join(outdir, 'full', 'sky-hold.webp'), 'WEBP', lossless=True, quality=100, method=6)
web = full.resize((w // 2, h // 2), Image.LANCZOS)
web.save(os.path.join(outdir, 'web', 'sky-hold.webp'), 'WEBP', lossless=True, quality=100, method=6)
before = np.asarray(im.resize((w // 2, h // 2), Image.LANCZOS))
mw = (np.asarray(web) != before).any(2)
ys, xs = np.nonzero(mw)
print('web: moved %d, in x %d to %d, y %d to %d' % (int(mw.sum()), xs.min(), xs.max(), ys.min(), ys.max()))
