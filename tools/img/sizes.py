#!/usr/bin/env python3
"""The same film frame drawn at two sizes of the film: the pattern of one against the other, by the pattern reader of smooth.py."""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import smooth as S


def read(film, big, scale, wide, floor):
    f = S.grey(film)
    a = S.small(f, scale)
    g = S.grey(big)
    full = f.shape
    if g.shape[0] % full[0] or g.shape[1] % full[1] or g.shape[0] // full[0] != g.shape[1] // full[1]:
        raise SystemExit('sizes: ' + big + ' is not a whole multiple of ' + film)
    b = cv2.resize(g, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_AREA)
    ok = np.ones(a.shape, bool)
    value, at, share = S.patterned(S.pattern(a, b, ok, wide / 5, wide, floor))
    coarse, _, _ = S.patterned(S.pattern(a, b, ok, wide, wide * 5, floor))
    return {'pattern': value, 'at': at and [int(round(at[0] / scale)), int(round(at[1] / scale))], 'share': share, 'wide': coarse}


def main():
    job = json.load(sys.stdin)
    scale = float(job.get('scale', 0.25))
    wide = float(job.get('patternPx', 40)) * scale
    floor = float(job.get('patternFloor', 1))
    print(json.dumps([read(item['film'], item['big'], scale, wide, floor) for item in job['pairs']]))


if __name__ == '__main__':
    main()
