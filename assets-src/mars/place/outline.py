"""The outline of what the approved picture's own eye did not see: the blue of public/assets/mars/{full,web}/relief-masks.png.

relief-seen.png (seenby.py) tells the law of the stop (src/stops/mars/law.ts, count 4) how far the front stands where two layers
stand at one place of the picture, at 8 pixels of the full picture a texel. Its outline was the outline of hidden ground on the way
down: steps at the file's pitch on the far mesa's crest at 2460 to 2474, and a cut that bit into a front that is half clear. The
outline is now a value of its own, at 2 pixels of the full picture a texel, in the blue of the relief's masks (the layers read the
red and the green of that file and nothing else: the contract of Relief.presenceLaw, src/terrain/relief.ts), so no file and no
memory is added; relief-seen.png holds the front's value carried on beyond its outline (close.json law.seen.carry, seenby.py).

The rule, at 1 pixel of the full picture, from the layers' own alpha and distance files:
  two layers stand here (alpha over one half) AND the front one is whole (alpha at or over `wholeAlpha`) within `withinPx` pixels.
  An outline that ends within those pixels is cut from its half line on; a front that goes over into the ground behind it over
  many pixels is cut only where it is whole (under its feather the picture's eye saw the ground behind by what the front let through).
  Where the ground behind stands close behind the front (less than `close`[0] of the distance farther) it comes into view by a
  pixel or two beside the front's outline and is the same ground: there the outline lies `insidePx` pixels inside; from `close`[1]
  on it lies on the front's outline, between the two it goes over.
Then soft by a gaussian of `softPx` pixels, the mean of 2 by 2 for the full set and of 4 by 4 for the web set, 0 to 255.

The rule, its numbers and the first build are handover_engineer's (scratch fields.py, mail of 26 November 09:34); this file is that
build with its numbers in close.json. No generated input. Run after the relief's masks are written (assets-src/mars/relief) and
after seenby.py; it writes the blue alone and may be run again.

  python3 assets-src/mars/place/outline.py            (values: src/stops/mars/close.json, block law.seen.outline)
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'relief.json')))
O = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'close.json')))['law']['seen']['outline']
boxes = [v['box'] for v in R['layers'].values()]
x0 = min(b['x'] for b in boxes)
x1 = max(b['x'] + b['w'] for b in boxes)
y0 = min(b['y'] for b in boxes)
y1 = max(b['y'] + b['h'] for b in boxes)
w, h = x1 - x0, y1 - y0
front = np.full((h, w), np.inf, np.float32)
far = np.zeros((h, w), np.float32)
afront = np.zeros((h, w), np.float32)
count = np.zeros((h, w), np.uint8)
for name, v in R['layers'].items():
    dw, dh = v['distSize']['full']
    d = np.fromfile(os.path.join(ROOT, v['files']['full']['dist']), dtype='<f4').reshape(dh, dw)
    al = cv2.imread(os.path.join(ROOT, v['files']['full']['alpha']), cv2.IMREAD_GRAYSCALE)
    b = v['box']
    bx, by, bw, bh = float(b['x'] - x0), float(b['y'] - y0), float(b['w']), float(b['h'])
    # only the layer's own rectangle of the field
    c0, c1 = max(int(np.floor(bx)) - 1, 0), min(int(np.ceil(bx + bw)) + 1, w)
    r0, r1 = max(int(np.floor(by)) - 1, 0), min(int(np.ceil(by + bh)) + 1, h)
    X, Y = np.meshgrid(((np.arange(c0, c1) + 0.5 - bx) / bw).astype(np.float64), ((np.arange(r0, r1) + 0.5 - by) / bh).astype(np.float64))
    inside = (X > 0) & (X < 1) & (Y > 0) & (Y < 1)
    dd = cv2.remap(d, (X * dw - 0.5).astype(np.float32), (Y * dh - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    aa = cv2.remap(al, (X * al.shape[1] - 0.5).astype(np.float32), (Y * al.shape[0] - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    there = inside & (aa > 127) & np.isfinite(dd) & (dd > 0)
    sub = front[r0:r1, c0:c1]
    nearer = there & (dd < sub)
    afront[r0:r1, c0:c1] = np.where(nearer, aa, afront[r0:r1, c0:c1])
    front[r0:r1, c0:c1] = np.where(nearer, dd, sub)
    far[r0:r1, c0:c1] = np.where(there, np.maximum(far[r0:r1, c0:c1], dd), far[r0:r1, c0:c1])
    count[r0:r1, c0:c1] += there
    del X, Y, inside, dd, aa, there, nearer

two = count >= 2
whole = (two & (afront >= O['wholeAlpha'])).astype(np.uint8)
D = int(O['withinPx'])
grown = cv2.dilate(whole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * D + 1, 2 * D + 1))) > 0
zone = two & grown
ratio = np.where(two, far / np.where(np.isfinite(front), front, 1.0), 1.0)
g0, g1 = O['close']
t = np.clip((ratio - 1 - g0) / max(g1 - g0, 1e-6), 0, 1)
E = int(O['insidePx'])
inner = cv2.erode(zone.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * E + 1, 2 * E + 1))) > 0
hidden = np.where(zone, np.maximum(t * t * (3 - 2 * t), inner.astype(np.float32)), 0).astype(np.float32)
print('two layers on %.4f of the field; the front whole (alpha from %g) on %.4f; within %d px of that and two layers %.4f; of that %d px inside %.4f'
      % (float(two.mean()), O['wholeAlpha'], float(whole.mean()), D, float(zone.mean()), E, float((zone & inner).mean())))
soft = cv2.GaussianBlur(hidden, (0, 0), float(O['softPx'])) if O['softPx'] > 0 else hidden
for s, step in (('full', 2), ('web', 4)):
    hh, ww = h // step, w // step
    m = soft[:hh * step, :ww * step].reshape(hh, step, ww, step).mean(axis=(1, 3))
    matte = np.clip(np.round(m * 255), 0, 255).astype(np.uint8)
    path = os.path.join(ROOT, 'public', 'assets', 'mars', s, 'relief-masks.png')
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im.shape[:2] != matte.shape:
        raise SystemExit('%s is %s, the outline is %s' % (path, im.shape[:2], matte.shape))
    im[..., 0] = matte
    # the file may be a hard link into dist: write beside it and move it in
    cv2.imwrite(path + '.new.png', im, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    os.replace(path + '.new.png', path)
    print(path, im.shape, os.path.getsize(path), 'bytes; the outline over one half on %.4f, texels neither 0 nor 255: %d' % (float((matte > 127).mean()), int(((matte > 0) & (matte < 255)).sum())))
