#!/usr/bin/env python3
"""Made readings for the proofs of the torn mark (tests/smooth.test.ts). A turning sphere under a camera that dives, as two frames with their
pose records; the readings of the pair are made by hand: a pattern that reads 0.9 on a disc of the body and 0.1 beside it, with the way of the
chain equal to the camera's map, or off it on the disc by 30 px of the reduced size (whole), on 0.4 of the disc, by 4 px, and the same
from the later end. Through setters and torn of smooth.py. Writes one JSON reply on stdout."""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carry as C  # noqa: E402
import madecarry as M  # noqa: E402
import smooth as S  # noqa: E402


def made(x, y, off, part=1.0, high=0.9):
    """The reading of the frame x against the frame y: its pattern, the way of the chain, and the disc."""
    wx, wy, _, held = C.carry(x['depth'], x['which'], x['pose'], y['pose'])
    body = held & (x['which'] > 0)
    ys, xs = np.nonzero(body)
    cy, cx = int(np.median(ys)), int(np.median(xs))
    gy, gx = np.mgrid[0:body.shape[0], 0:body.shape[1]]
    disc = body & (np.hypot(gx - cx, gy - cy) <= 0.12 * np.sqrt(body.sum()))
    p = np.where(body, 0.1, np.nan).astype(np.float32)
    p[disc] = high
    moved = disc & (gx < np.quantile(gx[disc], part)) if part < 1 else disc
    way = (wx + off * moved, wy.copy(), body)
    return (p, None, body, way, None), disc


def main():
    first, later, t0, t1 = M.leave(1, 'dive')
    a, b = M.frame(first, [M.globe(t0)]), M.frame(later, [M.globe(t1)])
    far = M.WIDE / 2
    quiet = lambda x: np.where(x['which'] > 0, 0.02, np.nan).astype(np.float32)
    out = {}

    def case(name, onward, back, ends):
        top = S.setters(onward, back)
        if top is None:
            out[name] = None
            return
        share, px, true = S.torn(top, a, b, ends, far, M.SCALE)
        out[name] = {'end': top['end'], 'count': int(len(top['x'])), 'share': share, 'px': px, 'true': true}

    calm = [{'p': quiet(a)}, {'p': quiet(b)}]
    for name, off, part in (('torn', 30, 1.0), ('some', 30, 0.4), ('near', 4, 1.0), ('whole', 0, 1.0)):
        onward, disc = made(a, b, off, part)
        case(name, onward, None, calm)
        out[name]['disc'] = int(disc.sum())
    onward, disc = made(a, b, 30)
    seen = quiet(a)
    seen[disc] = np.linspace(0.01, 0.04, int(disc.sum()))
    case('seen', onward, None, [{'p': seen}, {'p': quiet(b)}])
    case('unseen', onward, None, [{'p': np.where(disc, np.nan, quiet(a))}, {'p': quiet(b)}])
    low, _ = made(a, b, 0, high=0.2)
    back, disc = made(b, a, 30)
    case('back', low, back, calm)
    out['back']['disc'] = int(disc.sum())
    case('onward', made(a, b, 30)[0], made(b, a, 0, high=0.2)[0], calm)
    empty = (np.full(a['grey'].shape, np.nan, np.float32), None, None, (None, None, None), None)
    case('none', empty, None, calm)
    out['far'] = far / M.SCALE
    print(json.dumps(out))


if __name__ == '__main__':
    main()
