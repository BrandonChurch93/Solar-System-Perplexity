"""One picture through the levels of the made ground of the place (land-*.jpg): each level is made from the level under it.

The levels are squares about one spot on one tangent plane (widthDeg of levels.json), so a finer level covers the middle of
the coarser one. From the finest pair up: the finer level's rim goes over to the coarser level's picture (the outer `--rim`
of its half width, smooth), and the coarser level's middle is the finer level reduced to its scale. After it the two show
the same picture wherever both are drawn, and the eye sees no other ground when the globe goes from one to the next.
Judged with assets-src/shared/globe-levels.py.

  python3 assets-src/mars/place/pyramid.py --dir public/assets/mars/full --out out/work/place/pyr/full

Reads --dir, writes the changed levels to --out with the quantisation tables and the chroma sampling of the files read.
With --over BAKED the change of the levels in --dir against the baked plates goes through the levels and is laid on them
(inside.py runs on baked plates).
"""
import argparse
import json
import math
import os

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def half(width):
    return math.tan(math.radians(width) / 2)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json'))
    ap.add_argument('--rim', type=float, default=0.1)
    ap.add_argument('--over', help='the plates as baked: --dir holds changed levels of them as PNG; the change alone goes through the levels (the law is linear) and is laid on the baked plates, so that what was laid on them after this tool (landunder.py, asdrawn.py) stays; only levels that change are written')
    args = ap.parse_args()
    levels = [l for l in json.load(open(args.json))['levels'] if l.get('own')]
    os.makedirs(args.out, exist_ok=True)
    if args.over:
        files = [Image.open(os.path.join(args.over, l['file'])) for l in levels]
        keep = [(dict(f.quantization), JpegImagePlugin.get_sampling(f)) for f in files]
        base = [np.asarray(f.convert('RGB')).astype(np.float32) for f in files]
        pics = [np.asarray(Image.open(os.path.join(args.dir, l['file'][:-4] + '.png')).convert('RGB')).astype(np.float32) if os.path.exists(os.path.join(args.dir, l['file'][:-4] + '.png')) else b for l, b in zip(levels, base)]
        made = [b + d for b, d in zip(base, through([p - b for p, b in zip(pics, base)], levels, args.rim, False))]
        for l, b, p, (q, s) in zip(levels, base, made, keep):
            moved = float(np.abs(p - b).max())
            if moved >= 0.5:
                Image.fromarray(np.clip(p + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s, optimize=True)
            print(l['file'], 'largest change %.1f levels' % moved, 'written' if moved >= 0.5 else 'kept')
        return
    files = [Image.open(os.path.join(args.dir, l['file'])) for l in levels]
    keep = [(dict(f.quantization), JpegImagePlugin.get_sampling(f)) for f in files]
    pics = [np.asarray(f.convert('RGB')).astype(np.float32) for f in files]
    pics = through(pics, levels, args.rim, True)
    for l, p, (q, s) in zip(levels, pics, keep):
        Image.fromarray(np.clip(p + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
        print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])))


def through(pics, levels, rim, say):
    pics = list(pics)
    for i in range(len(levels) - 2, -1, -1):
        parent, child = pics[i], pics[i + 1]
        n, c = parent.shape[0], child.shape[0]
        m = int(round(n * half(levels[i + 1]['widthDeg']) / half(levels[i]['widthDeg'])))
        if (m - n) % 2:
            m += 1
        x0 = (n - m) // 2
        under = cv2.resize(parent[x0:x0 + m, x0:x0 + m], (c, c), interpolation=cv2.INTER_CUBIC)
        at = (np.arange(c, dtype=np.float32) + 0.5) / c
        edge = np.minimum(at, 1 - at) * 2 / rim
        w = smooth(np.minimum(edge[:, None], edge[None, :]))[:, :, None]
        child = under + (child - under) * w
        pics[i + 1] = child
        parent = parent.copy()
        parent[x0:x0 + m, x0:x0 + m] = cv2.resize(child, (m, m), interpolation=cv2.INTER_AREA)
        pics[i] = parent
        if say:
            print('%s into %s: %d of %d texels across, rim %.2f' % (levels[i + 1]['file'], levels[i]['file'], m, n, rim))
    return pics


if __name__ == '__main__':
    main()
