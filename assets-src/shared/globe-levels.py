#!/usr/bin/env python3
"""Does a level of a stop's plate pyramid show the same picture as the level above it, in the band the smooth report judges?

Each level is laid against the part of its parent that it covers, both reduced to the state in which the level comes in
(a parent texel is --texel pixels of the frame), and judged with the smooth report's own function (tools/img/smooth.py, pattern).
One line a pair: the 99th percentile, 0 the same pattern, 1 an unrelated one. A pair is a test only when both files are the
same kind of picture (colour with colour, light with light).

  python3 assets-src/shared/globe-levels.py --dir public/assets/mars/full --json src/stops/mars/levels.json
  python3 assets-src/shared/globe-levels.py --dir DIR --level wide.jpg:96 --level near.jpg:42:0.5,-0.2 --panel out.png

--json FILE [--key a.b.levels]: a list of {file, widthDeg, centreDeg?: [east, north]}. --suffix S: put S before the extension of
every file. --pairs 0-1,1-3: the pairs to judge in place of every neighbour. --texel: default 0.8. --limit: default the film's.
"""
import argparse
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'img'))
import smooth as judge  # noqa: E402

Image.MAX_IMAGE_PIXELS = None


def read(path):
    return judge.grey(path).astype(np.float32)


def half(width):
    return math.tan(math.radians(width) / 2)


def lay(parent, child, a, b, texel, scale):
    """The child and the part of the parent under it on one grid, and where the parent has something."""
    n = parent.shape[0]
    per = n / (2 * half(a['widthDeg']))
    ca, cb = (tuple(math.tan(math.radians(v)) for v in l.get('centreDeg', [0, 0])) for l in (a, b))
    mid = (n / 2 + (cb[0] - ca[0]) * per, n / 2 - (cb[1] - ca[1]) * per)
    reach = half(b['widthDeg']) * per
    side = max(int(round(2 * reach * texel * scale)), 32)
    grid = side / (2 * reach)
    x0, x1 = int(round(mid[0] - reach)), int(round(mid[0] + reach))
    y0, y1 = int(round(mid[1] - reach)), int(round(mid[1] + reach))
    cx0, cx1, cy0, cy1 = max(x0, 0), min(x1, n), max(y0, 0), min(y1, n)
    under = np.zeros((side, side), np.float32)
    ok = np.zeros((side, side), bool)
    if cx1 > cx0 and cy1 > cy0:
        px0, py0 = int(round((cx0 - x0) * grid)), int(round((cy0 - y0) * grid))
        px1, py1 = min(int(round((cx1 - x0) * grid)), side), min(int(round((cy1 - y0) * grid)), side)
        if px1 > px0 and py1 > py0:
            under[py0:py1, px0:px1] = cv2.resize(parent[cy0:cy1, cx0:cx1], (px1 - px0, py1 - py0), interpolation=cv2.INTER_AREA)
            ok[py0:py1, px0:px1] = True
    over = cv2.resize(child, (side, side), interpolation=cv2.INTER_AREA)
    return under, over, ok, 2 * reach


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--json')
    ap.add_argument('--key', default='levels')
    ap.add_argument('--level', action='append', default=[])
    ap.add_argument('--suffix', default='')
    ap.add_argument('--pairs')
    ap.add_argument('--texel', type=float, default=0.8)
    ap.add_argument('--limit', type=float)
    ap.add_argument('--panel')
    args = ap.parse_args()
    config = json.load(open(os.path.join(ROOT, 'config', 'showcase.json')))['smooth']['pictures']
    scale = float(config.get('flowScale', 0.25))
    wide = float(config.get('patternPx', 40)) * scale
    floor = float(config.get('patternFloor', 1))
    limit = args.limit if args.limit is not None else float(config['maxPattern'])
    levels = []
    if args.json:
        node = json.load(open(args.json))
        for part in args.key.split('.'):
            node = node[part]
        levels = [dict(l) for l in node]
    for text in args.level:
        parts = text.split(':')
        level = {'file': parts[0], 'widthDeg': float(parts[1])}
        if len(parts) > 2:
            level['centreDeg'] = [float(v) for v in parts[2].split(',')]
        levels.append(level)
    if len(levels) < 2:
        sys.exit('two levels at least')
    for l in levels:
        stem, ext = os.path.splitext(l['file'])
        l['file'] = stem + args.suffix + ext
    pairs = [tuple(int(v) for v in p.split('-')) for p in args.pairs.split(',')] if args.pairs else [(i, i + 1) for i in range(len(levels) - 1)]
    cache = {}

    def picture(i):
        if i not in cache:
            cache[i] = read(os.path.join(args.dir, levels[i]['file']))
        return cache[i]

    rows = []
    worst = 0.0
    for i, j in pairs:
        a, b = levels[i], levels[j]
        under, over, ok, texels = lay(picture(i), picture(j), a, b, args.texel, scale)
        p = judge.pattern(under, over, ok, wide / 5, wide, floor)
        judged = np.isfinite(p)
        share = float(judged.mean())
        head = '%s -> %s: %d texels of the parent across, child %d, grid %d' % (a['file'], b['file'], round(texels), picture(j).shape[0], under.shape[0])
        if share < judge.PATTERN_SHARE:
            print(head + ', judged %.2f of it: too little detail in the band to judge' % share)
        else:
            top = float(np.nanpercentile(p, 99))
            worst = max(worst, top)
            ys, xs = np.nonzero(np.nan_to_num(p, nan=-1) >= top)
            n = under.shape[0]
            rim = float(np.mean((np.minimum(np.minimum(xs, n - 1 - xs), np.minimum(ys, n - 1 - ys)) < 0.1 * n)))
            print(head + ', judged %.2f of it, median %.2f, 99th percentile %.2f (limit %.2f)%s, %.0f percent of the worst 1 percent in the outer tenth' % (share, float(np.nanmedian(p)), top, limit, ' OVER' if top > limit else '', 100 * rim))
        if args.panel:
            show = lambda x: np.clip(x, 0, 255).astype(np.uint8)
            rows.append(np.concatenate([show(under), show(over), show(np.nan_to_num(p) * 255)], axis=1))
    if args.panel and rows:
        width = max(r.shape[1] for r in rows)
        cv2.imwrite(args.panel, np.concatenate([np.pad(r, ((0, 4), (0, width - r.shape[1]))) for r in rows], axis=0))
    sys.exit(1 if worst > limit else 0)


if __name__ == '__main__':
    main()
