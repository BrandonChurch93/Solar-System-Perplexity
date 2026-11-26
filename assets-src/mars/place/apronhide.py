"""Takes an apron of the close ground out where a nearer layer or its apron covers it in the picture (relief.json apron).

The aprons are the ground drawn on beyond the layers' boxes for the glide of the surface view. Where the far layer's apron lies
behind the near layer's apron in the picture, the surface view never shows it; an eye above the picture's eye (the globe side of
the dive and of the rise, where the close ground is drawn too) sees it past the near apron's outer edge as a pale sheet with a
straight border. This step sets the alpha of the far layer's apron atlas to 0 there, less a margin, so that beyond the near apron
the globe's own ground shows. Colour and distance are not touched.

  python3 assets-src/mars/place/apronhide.py --layer L0 --by L1 --set full [--margin 160] --out FILE.webp

With --main the same is done for the far layer's own picture inside its box (its alpha file): the part of it that the near
layer's box covers, less the margin, where the near layer is solid. The near layer's aprons count as solid beyond its box.

  python3 assets-src/mars/place/apronhide.py --layer L0 --by L1 --set full --main [--margin 640] --out FILE.png
"""
import argparse
import json
import cv2
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--layer', required=True)
ap.add_argument('--by', default='')
ap.add_argument('--set', default='full')
ap.add_argument('--relief', default='src/stops/mars/relief.json')
ap.add_argument('--margin', type=float, default=160.0, help='full set px of the picture kept inside the cover')
ap.add_argument('--src', default='', help='the atlas to read, when not the one of the set')
ap.add_argument('--main', action='store_true', help="the layer's own alpha file instead of its apron atlas")
ap.add_argument('--out', required=True)
a = ap.parse_args()
R = json.load(open(a.relief))
A = R['apron']
pad = A['padding']
base = 'public/assets/mars/%s/' % a.set
unit = 1 / A['resolution'][a.set] * (R['imageSize']['full'][0] / R['imageSize'][a.set][0])  # full set px per atlas px


def entry(name):
    return next(x for x in A['layers'] if x['layer'] == name)


E0 = entry(a.layer)
B0 = R['layers'][a.layer]['box']


def atlas_points(w, h):
    """Full set px of the picture, from the corner of the layer's box, for every texel of its apron atlas (as relief.ts lays it out)."""
    left, right, bottom = E0['edges']
    side = bottom + pad if bottom else 0
    start = side + (left + pad if left else 0)
    ux, uy = np.meshgrid((np.arange(w) + 0.5) * unit, (np.arange(h) + 0.5) * unit)
    below = uy < side
    lefts = ~below & (uy < start)
    px = np.where(below, ux - left, np.where(lefts, uy - side - left, uy - start + B0['w'] - pad))
    py = np.where(below, uy - pad + B0['h'], ux)
    return px, py


E1 = entry(a.by)
B1 = R['layers'][a.by]['box']
if a.main:
    src = a.src or R['layers'][a.layer]['files'][a.set]['alpha']
    al = cv2.imread(src, cv2.IMREAD_GRAYSCALE)
    h, w = al.shape
    alpha1 = cv2.imread(R['layers'][a.by]['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE)
    h1, w1 = alpha1.shape
    per = B1['w'] / w1  # full set px per px of the covering layer's alpha
    l1, r1, b1 = E1['edges']
    k = max(1, int(round(a.margin / per)))
    # the covering layer with a rim of 2k round it: solid where its apron runs on, open where it has none and above it
    wide = np.zeros((h1 + 4 * k, w1 + 4 * k), np.uint8)
    wide[2 * k:2 * k + h1, 2 * k:2 * k + w1] = alpha1 > 127
    if l1 > 0:
        wide[2 * k:, :2 * k] = 1
    if r1 > 0:
        wide[2 * k:, 2 * k + w1:] = 1
    if b1 > 0:
        wide[2 * k + h1:, (0 if l1 > 0 else 2 * k):(w1 + 4 * k if r1 > 0 else 2 * k + w1)] = 1
    solid = cv2.distanceTransform(np.pad(wide, 1), cv2.DIST_L2, 5)[1:-1, 1:-1] > k
    ux, uy = np.meshgrid((np.arange(w) + 0.5) * (B0['w'] / w), (np.arange(h) + 0.5) * (B0['h'] / h))
    qx = (ux + B0['x'] - B1['x']) / per + 2 * k
    qy = (uy + B0['y'] - B1['y']) / per + 2 * k
    inside = (qx >= 0) & (qx < wide.shape[1]) & (qy >= 0) & (qy < wide.shape[0])
    sx = np.clip(qx.astype(np.int64), 0, wide.shape[1] - 1)
    sy = np.clip(qy.astype(np.int64), 0, wide.shape[0] - 1)
    hide = inside & (solid[sy, sx] > 0) & (al > 0)
    print('%s behind %s: alpha set to 0 on %.4f of the box (%d px); alpha over 0 before on %.4f' % (a.layer, a.by, hide.mean(), hide.sum(), (al > 0).mean()))
    al[hide] = 0
    cv2.imwrite(a.out, al, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    cv2.imwrite(a.out + '-hide.png', (hide * 255).astype(np.uint8))
    raise SystemExit(0)
im = Image.open(a.src or base + E0['atlas']).convert('RGBA')
atlas = np.asarray(im).copy()
h, w = atlas.shape[:2]
left, right, bottom = E0['edges']
side = bottom + pad if bottom else 0
start = side + (left + pad if left else 0)
ux, uy = np.meshgrid((np.arange(w) + 0.5) * unit, (np.arange(h) + 0.5) * unit)
below = uy < side
lefts = ~below & (uy < start)
px = np.where(below, ux - left, np.where(lefts, uy - side - left, uy - start + B0['w'] - pad))
py = np.where(below, uy - pad + B0['h'], ux)
used = np.where(below, ux <= left + B0['w'] + right, ux <= B0['h'] + min(bottom, pad) if False else ux <= B0['h'] + pad)
# the point in the picture, then against the covering layer's box
qx = px + B0['x'] - B1['x']
qy = py + B0['y'] - B1['y']
l1, r1, b1 = E1['edges']
m = a.margin
inbox = (qx >= m) & (qx <= B1['w'] - m) & (qy >= m) & (qy <= B1['h'])
alpha1 = cv2.imread(R['layers'][a.by]['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE)
k = max(1, int(round(m / (B1['w'] / alpha1.shape[1]))))
solid = cv2.erode((alpha1 > 127).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1)))
sx = np.clip((qx / B1['w'] * alpha1.shape[1]).astype(np.int64), 0, alpha1.shape[1] - 1)
sy = np.clip((qy / B1['h'] * alpha1.shape[0]).astype(np.int64), 0, alpha1.shape[0] - 1)
cover = inbox & (solid[sy, sx] > 0)
# the covering layer's apron: left of its box, right of it and below it, whole (its alpha is 1 there but for a rounded corner)
apron = (qy >= m) & (qy <= B1['h'] + b1 - m) & (qx >= -l1 + m) & (qx <= B1['w'] + r1 - m) & ((qx < 0) | (qx > B1['w']) | (qy > B1['h']))
apron &= np.where(qy > B1['h'], b1 > 0, np.where(qx < 0, l1 > 0, r1 > 0))
if b1 > 0:
    # the box's own lower rim joins its apron: no margin kept between the two
    cover |= (qx >= m) & (qx <= B1['w'] - m) & (qy > B1['h'] - m) & (qy <= B1['h'])
hide = (cover | apron) & (atlas[..., 3] > 0)
print('%s behind %s: alpha set to 0 on %.4f of the atlas (%d texels); alpha over 0 before on %.4f' % (a.layer, a.by, hide.mean(), hide.sum(), (atlas[..., 3] > 0).mean()))
atlas[..., 3][hide] = 0
Image.fromarray(atlas).save(a.out, lossless=True, method=6, exact=True)
cv2.imwrite(a.out + '-hide.png', (hide * 255).astype(np.uint8))
