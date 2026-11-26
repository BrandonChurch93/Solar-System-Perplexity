#!/usr/bin/env python3
"""Made pictures for the proof that a picture which only slides leaves nothing (tests/slide.test.ts): one sharp detailed still, made SUP times
finer than the frame and reduced by area as a renderer with full coverage would, slid by whole fine pixels a half frame with no other change,
read by pictures() of tools/img/smooth.py as it stands and with carryFull. Fixed seed. Writes one JSON reply on stdout."""
import json
import os
import shutil
import sys
import tempfile

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
import smooth as S  # noqa: E402

W, H, SUP = 960, 540, 8
SCALE = 0.25
REACH = 4


def scene(seed, extra):
    """Detail at every width from a fine pixel up, sharp edges, and small bright points."""
    rng = np.random.default_rng(seed)
    w, h = (W + extra) * SUP, H * SUP
    base = np.zeros((h, w), np.float32)
    for k in range(9):
        layer = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 2.0 ** k / 2)
        base += layer / layer.std()
    base /= base.std()
    low = cv2.GaussianBlur(base, (0, 0), 6 * SUP)
    edges = (low > np.percentile(low, 60)).astype(np.float32)
    points = np.zeros((h, w), np.float32)
    count = (h * w) // (SUP * SUP * 900)
    points[rng.integers(0, h, count), rng.integers(0, w, count)] = 1
    sigma = 0.6 * SUP
    return 105 + 22 * base + 30 * edges + cv2.GaussianBlur(points, (0, 0), sigma) * 130 * 2 * np.pi * sigma * sigma


def frame(img, off):
    return np.rint(np.clip(cv2.resize(img[:, off:off + W * SUP], (W, H), interpolation=cv2.INTER_AREA), 0, 255)).astype(np.uint8)


def read(pictures, folder, tag, window):
    paths = []
    for i, g in enumerate(pictures):
        paths.append(os.path.join(folder, '%s-%02d.png' % (tag, i)))
        Image.fromarray(np.repeat(g[..., None], 3, axis=2)).save(paths[-1])
    n = len(paths)
    job = {'op': 'pictures', 'paths': paths, 'scale': SCALE, 'window': window, 'floor': 0.25, 'grid': [16, 9], 'changeFrames': REACH, 'changeBlur': 20, 'patternPx': 40, 'patternFloor': 1, 'first': 0, 'total': n, 'own': [0, n], 'lead': 0, 'tail': 0}
    out = {}
    for name, more in (('stands', {}), ('full', {'carryFull': True})):
        r = S.pictures({**job, **more})
        some = lambda key: [v for v in r[key] if v is not None]
        most = lambda key: max(some(key), default=None)
        out[name] = {'left': [min(some('residual')), max(some('residual'))], 'pop': most('pop'), 'pops': r['pop'], 'block': most('popBlock'), 'change': most('change'), 'pattern': most('pattern'), 'step': most('levelStep')}
    return out


def main():
    img = scene(7, 140)
    other = scene(8, 140)
    folder = tempfile.mkdtemp(prefix='slide-')
    try:
        slides = []
        for unit, per in (('reduced', int(SUP / SCALE)), ('full', SUP)):
            for px in (0.25, 0.5, 1, 1.5, 3.66):
                d = int(round(px * per))
                slides.append({'unit': unit, 'px': px, 'made': d / per, **read([frame(img, i * d) for i in range(7)], folder, '%s-%d' % (unit, d), 6)})
        per = int(SUP / SCALE)
        steps = [int(round(v * per)) for v in np.linspace(3.0, 3.5, 9)]
        offs = [0] + list(np.cumsum(steps))
        grow = {'slides': [v / per for v in steps], **read([frame(img, off) for off in offs], folder, 'grow', 16)}
        d = int(round(1.5 * per))
        pictures = [frame(img, i * d) for i in range(10)]
        for i in range(5, 10):
            swap = frame(other, i * d)
            pictures[i][H // 3: 2 * H // 3, W // 3: 2 * W // 3] = swap[H // 3: 2 * H // 3, W // 3: 2 * W // 3]
        popped = {'at': 4, **read(pictures, folder, 'pop', 16)}
        print(json.dumps({'slides': slides, 'grow': grow, 'popped': popped, 'soft': S.SOFT_PX, 'settle': S.SETTLE_PX, 'edge': S.EDGE}))
    finally:
        shutil.rmtree(folder, ignore_errors=True)


if __name__ == '__main__':
    main()
