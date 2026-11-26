"""The land plates of the web set: the full set's plates, reduced.

After closelay.py, countrytake.py and pyramid.py the five land plates of the full set are one picture through the levels.
The web set shows the same ground at its own sizes: each plate is the full plate reduced by the area mean to the size
the web file has, written with the web file's quantisation tables and chroma sampling. landunder.py --set web runs
after it on the result.

  python3 assets-src/mars/place/webplates.py --dir FULLPLATES --out OUT [--over BAKEDFULL --web BAKEDWEB]
"""
import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json'))
    ap.add_argument('--web', default=os.path.join(ROOT, 'public', 'assets', 'mars', 'web'))
    ap.add_argument('--over', help='the full plates as baked: the change of --dir against them, reduced, is laid on the baked web plates of --web, so that what was laid on the web set after this tool (landunder.py --set web and the steps after it) stays; a plate that does not change is not written')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    for l in json.load(open(args.json))['levels']:
        if not l.get('own'):
            continue
        was = Image.open(os.path.join(args.web, l['file']))
        q, s = dict(was.quantization), JpegImagePlugin.get_sampling(was)
        pic = np.asarray(Image.open(os.path.join(args.dir, l['file'])).convert('RGB'))
        if args.over:
            old = np.asarray(Image.open(os.path.join(args.over, l['file'])).convert('RGB'))
            change = cv2.resize(pic.astype(np.float32) - old.astype(np.float32), was.size, interpolation=cv2.INTER_AREA)
            moved = float(np.abs(change).max())
            print(l['file'], 'largest change %.1f levels' % moved, 'written' if moved >= 0.5 else 'kept')
            if moved < 0.5:
                continue
            out = np.clip(np.asarray(was.convert('RGB')).astype(np.float32) + change + 0.5, 0, 255).astype(np.uint8)
            Image.fromarray(out).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s, optimize=True)
            continue
        out = cv2.resize(pic, was.size, interpolation=cv2.INTER_AREA)
        Image.fromarray(out).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
        print(l['file'], pic.shape[0], 'to', was.size[0], os.path.getsize(os.path.join(args.out, l['file'])))


if __name__ == '__main__':
    main()
