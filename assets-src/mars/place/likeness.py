"""ONE BODY, measured (MAIL 963 item 3): how like each colour plate of the place is to its parent on the ground they share.

The child plate is reduced to the parent's texel (area mean) and held against the parent's middle, which is the same ground.
  pattern: the reader's own measure of a pattern (tools/img/smooth.py pattern: detail between 8 and 40 px, the local mean out,
           divided by the local contrast; 0 the same pattern, 1 an unrelated one, 2 the reverse), 99th percentile and median
  level:   the mean display luminance of the shared band on both, and the largest difference of the two in cells of 40 px
With --laid the picture seen from above (assets-src/mars/place/laid, where its mask is whole) is held against each plate too.
With --panel a picture: per pair the parent's middle, the child reduced, and their difference times 4.

  python3 assets-src/mars/place/likeness.py --dir public/assets/mars/full [--laid assets-src/mars/place/laid] [--panel OUT.jpg]
"""
import argparse
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'img'))
import smooth as reader  # noqa: E402

FINE, WIDE, FLOOR = 8.0, 40.0, 1.0


def half(width):
    return math.tan(math.radians(width) / 2)


def grey(a):
    return (a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722).astype(np.float32)


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)


def middle(parent, pw, cw):
    """The part of the parent that the child covers, and its size in parent texels."""
    n = parent.shape[0]
    m = n * half(cw) / half(pw)
    x0 = (n - m) / 2
    a, b = int(math.ceil(x0)), int(math.floor(x0 + m))
    return parent[a:b, a:b], (a - x0) / m, (b - a) / m


def reduced(child, off, share, size):
    """The child's same part, reduced to `size` texels by area."""
    c = child.shape[0]
    a, b = off * c, (off + share) * c
    M = np.float32([[(b - a) / size, 0, a + ((b - a) / size - 1) / 2], [0, (b - a) / size, a + ((b - a) / size - 1) / 2]])
    k = (b - a) / size
    src = cv2.GaussianBlur(child, (0, 0), max(k / 2.5, 0.01)) if k > 1 else child
    return cv2.warpAffine(src, M, (size, size), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)


def pair(a, b, ok=None):
    ga, gb = grey(a), grey(b)
    ok = np.ones(ga.shape, bool) if ok is None else ok
    p = reader.pattern(ga, gb, ok, FINE, WIDE, FLOOR)
    judged = np.isfinite(p)
    cell = int(WIDE)
    h, w = (ga.shape[0] // cell) * cell, (ga.shape[1] // cell) * cell
    okf = ok[:h, :w].astype(np.float32)
    blocks = lambda x: (x[:h, :w] * okf).reshape(h // cell, cell, w // cell, cell).sum((1, 3)) / np.maximum(okf.reshape(h // cell, cell, w // cell, cell).sum((1, 3)), 1)
    full = okf.reshape(h // cell, cell, w // cell, cell).mean((1, 3)) > 0.5
    d = np.abs(blocks(ga) - blocks(gb))[full]
    return {'pattern99': float(np.nanpercentile(p, 99)) if judged.any() else None, 'pattern50': float(np.nanmedian(p)) if judged.any() else None, 'judged': float(judged.mean()),
            'levelParent': float(ga[ok].mean()), 'levelChild': float(gb[ok].mean()), 'cellMean': float(d.mean()) if d.size else None, 'cellMost': float(d.max()) if d.size else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--laid')
    ap.add_argument('--panel')
    ap.add_argument('--json')
    args = ap.parse_args()
    levels = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json')))['levels']
    rows, tiles = {}, []
    for parent, child in zip(levels[:-1], levels[1:]):
        if not child.get('own'):
            continue
        P, C = load(os.path.join(args.dir, parent['file'])), load(os.path.join(args.dir, child['file']))
        mid, off, share = middle(P, parent['widthDeg'], child['widthDeg'])
        red = reduced(C, off, share, mid.shape[0])
        r = pair(mid, red)
        rows[child['file'] + ' in ' + parent['file']] = r
        print('%s in %s (%d texels shared): pattern 99th %.2f, median %.2f (judged %.2f); level parent %.1f, child %.1f; cells of 40 px differ by %.1f in the mean, %.1f at most' % (
            child['file'], parent['file'], mid.shape[0], r['pattern99'], r['pattern50'], r['judged'], r['levelParent'], r['levelChild'], r['cellMean'], r['cellMost']))
        if args.panel:
            t = lambda x: cv2.resize(np.clip(x, 0, 255), (512, 512), interpolation=cv2.INTER_AREA)
            tiles.append(np.concatenate([t(mid), t(red), t(128 + (red - mid) * 4)], 1))
    if args.laid:
        for l in levels:
            if not l.get('own'):
                continue
            stem = l['file'][:-4]
            if not os.path.exists(os.path.join(args.laid, stem + '-laid.png')):
                continue
            A, Pl = load(os.path.join(args.laid, l['file'])), load(os.path.join(args.dir, l['file']))
            m = np.asarray(Image.open(os.path.join(args.laid, stem + '-laid.png')).convert('L')) > 250
            if A.shape != Pl.shape:
                continue
            r = pair(Pl, A, m)
            rows['picture from above on ' + l['file']] = r
            print('picture from above on %s (%.2f of it): pattern 99th %s, median %s; level plate %.1f, picture %.1f; cells differ by %.1f in the mean, %.1f at most' % (
                l['file'], float(m.mean()), '%.2f' % r['pattern99'] if r['pattern99'] is not None else 'none', '%.2f' % r['pattern50'] if r['pattern50'] is not None else 'none', r['levelParent'], r['levelChild'], r['cellMean'], r['cellMost']))
    if args.panel and tiles:
        Image.fromarray(np.concatenate(tiles, 0).astype(np.uint8)).save(args.panel, quality=90)
    if args.json:
        json.dump(rows, open(args.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
