#!/usr/bin/env python3
"""Made pictures for the proofs of the pattern measure and of the body mask (tests/smooth.test.ts). Fixed seeds. Writes one JSON reply on stdout."""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
import smooth as S  # noqa: E402

SHAPE = (270, 480)
FINE, WIDE, FLOOR = 2.0, 10.0, 1.0
GRAIN = 0.31
FAR = 40
CONTRASTS = (2, 3, 5, 10)


def before(a, b, ok, fine, wide, floor):
    """The pattern measure as it stood before the slope of the level was taken out at a border: what the proofs compare with."""
    okf = ok.astype(np.float32)
    soft = lambda x, s: cv2.GaussianBlur(x.astype(np.float32), (0, 0), s)
    near, far = np.maximum(soft(okf, fine), 1e-6), np.maximum(soft(okf, wide), 1e-6)
    da = (soft(a * okf, fine) / near - soft(a * okf, wide) / far) * okf
    db = (soft(b * okf, fine) / near - soft(b * okf, wide) / far) * okf
    ca = np.sqrt(np.maximum(soft(da * da, wide) / far, 0))
    cb = np.sqrt(np.maximum(soft(db * db, wide) / far, 0))
    p = 1 - (soft(da * db, wide) / far) / np.maximum(ca * cb, 1e-6)
    p[~(ok & (soft(okf, wide) >= 0.5) & (ca > floor) & (cb > floor))] = np.nan
    return p


def area():
    """A judged area with borders of three kinds: the limb of a disc, the edge of the frame that cuts it, and a hole inside it."""
    ys, xs = np.mgrid[0:SHAPE[0], 0:SHAPE[1]]
    radius = np.hypot(xs - 290, ys - 160)
    ok = (radius < 150) & (np.hypot(xs - 395, ys - 120) > 12)
    return ok, radius / 150


def inside(ok):
    """How far a pixel of the area is from its nearest border, the edge of the frame counted as one."""
    return cv2.distanceTransform(np.pad(ok, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]


def field(rng):
    return cv2.GaussianBlur(rng.standard_normal(SHAPE).astype(np.float32), (0, 0), 1.0)


def unit(p, ok):
    """The contrast of a pattern as the measure reads it: the median over the area."""
    okf = ok.astype(np.float32)
    soft = lambda x, s: cv2.GaussianBlur(x.astype(np.float32), (0, 0), s)
    near, far = np.maximum(soft(okf, FINE), 1e-6), np.maximum(soft(okf, WIDE), 1e-6)
    d = (soft(p * okf, FINE) / near - soft(p * okf, WIDE) / far) * okf
    c = np.sqrt(np.maximum(soft(d * d, WIDE) / far, 0))
    return float(np.median(c[ok & (soft(okf, WIDE) >= 0.5)]))


def pair(rng, ok, level, later, contrast, mix):
    """Two frames of one pattern at a contrast over their levels, with the grain of the film. mix 0: the same pattern in both, 1: an
    unrelated one in the second, between: a dissolve part way."""
    p1, p2 = field(rng), field(rng)
    p1, p2 = p1 / unit(p1, ok), p2 / unit(p2, ok)
    grain = lambda: GRAIN * rng.standard_normal(SHAPE).astype(np.float32)
    return level + contrast * p1 + grain(), later + contrast * ((1 - mix) * p1 + mix * p2) + grain()


def number(p):
    return S.patterned(p)[0]


def patterns():
    ok, r = area()
    deep = inside(ok)
    limb = (60 + 60 * r * r).astype(np.float32)
    rng = np.random.default_rng(653)
    out = {'judged': float(ok.mean()), 'far': int((deep > FAR).sum()), 'same': [], 'unrelated': [], 'dissolve': [], 'moved': 0.0}
    for name, mix in (('same', 0.0), ('unrelated', 1.0), ('dissolve', 0.5)):
        for c in CONTRASTS:
            a, b = pair(rng, ok, limb, limb, c, mix)
            now, was = S.pattern(a, b, ok, FINE, WIDE, FLOOR), before(a, b, ok, FINE, WIDE, FLOOR)
            both = np.isfinite(now) & np.isfinite(was) & (deep > FAR)
            out['moved'] = max(out['moved'], float(np.abs(now - was)[both].max()))
            out[name].append({'contrast': c, 'now': number(now), 'before': number(was)})
    ys, xs = np.mgrid[0:SHAPE[0], 0:SHAPE[1]]
    flat = np.full(SHAPE, 130, np.float32)
    sloped = (130 + 0.5 * (xs - 290) + 0.3 * (ys - 160)).astype(np.float32)
    read = lambda a, b: {'now': number(S.pattern(a, b, ok, FINE, WIDE, FLOOR)), 'before': number(before(a, b, ok, FINE, WIDE, FLOOR))}
    out['slope'] = read(*pair(rng, ok, flat, sloped, 1.3, 0.0))
    out['slopeUnrelated'] = read(*pair(rng, ok, flat, sloped, 5, 1.0))
    a, b = pair(rng, ok, limb, limb, 3, 0.0)
    out['veil'] = read(a, 30 + limb + 0.6 * (b - limb))
    return out


def bodies():
    shape = (270, 480)
    pose = {'p': [0, 0, 3], 'q': [0, 0, 0, 1], 'vfov': 40}
    half = np.sqrt(0.5)
    extent = lambda m: [int(m.any(axis=0).sum()), int(m.any(axis=1).sum())]
    sphere = S.body(pose, shape, 0)
    round_ = S.body({**pose, 'globe': {'quaternion': [0.5, 0.5, 0.5, 0.5], 'scale': [1, 1, 1]}}, shape, 0)
    flat = S.body({**pose, 'globe': {'quaternion': [0, 0, 0, 1], 'scale': [1, 0.9, 1]}}, shape, 0)
    turned = S.body({**pose, 'globe': {'quaternion': [0, 0, half, half], 'scale': [1, 0.9, 1]}}, shape, 0)
    return {'sphere': extent(sphere), 'roundDiffers': int((sphere != round_).sum()), 'flat': extent(flat), 'turned': extent(turned), 'outside': int((flat & ~sphere).sum()), 'sky': int((sphere & ~flat).sum())}


if __name__ == '__main__':
    json.dump({'patterns': patterns(), 'bodies': bodies()}, sys.stdout)
