#!/usr/bin/env python3
"""Made films for the proofs of the ground pop (tests/smooth.test.ts). A flattened globe with a pattern fixed to it, drawn by its own rays at
the film's size with its pose records, under a camera that rises and swings while the globe turns: a moving ground in which nothing pops.
Then the same film with a square plate of another pattern fixed to the ground from one frame on, 40, 80 and 160 px across, whole and
faint (FAINT of the way from the ground to the other pattern). Every frame has its own grain. Fixed seeds. Writes one JSON reply on stdout."""
import json
import os
import sys
import tempfile

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carry as C  # noqa: E402
import madecarry as M  # noqa: E402
import smooth as S  # noqa: E402


SHAPE = (1080, 1920)
FRAMES = 17
AT = 9
SIZES = (40, 80, 160)
FLAT = [1, 0.9, 1]
TILT = M.about([0.3, 0, 1], 20)
GRAIN = 1.2
FAINT = 0.2
JOB = {'op': 'pictures', 'scale': 0.25, 'window': 8, 'floor': 0.25, 'grid': [16, 9], 'changeFrames': 0, 'both': True}
KEYS = ('groundLeft', 'groundBase', 'groundPop', 'groundShare', 'groundAt', 'groundSize')


def pose(t):
    return {**M.camera([0.9 + 0.012 * t, 0.5 + 0.004 * t, 3.7 + 0.02 * t], [0.05 + 0.006 * t, 0.02 - 0.003 * t, 0.0], 40, 0.15 * t), 'globe': {'quaternion': TILT, 'scale': FLAT}}


def turn(t):
    return M.times(TILT, M.about([0, 1, 0], 0.12 * t))


def films(folder):
    """The frames as files, made once: film(size, a, b, gain) gives the paths of the frames a to b, with the plate of that size on the ground
    from frame AT on (size None: the clean film), box(size) the box the plate fills in frame AT, in px, and hit(t) the drawn body of frame t."""
    ground, other = M.waves(11, 0.012, 0.3, 24), M.waves(12, 0.012, 0.3, 24)
    held, made, boxes = {}, {}, {}
    k = SHAPE[0] / 2 / np.tan(np.radians(40) / 2)
    first = pose(AT)

    def placed(x):
        """Where frame AT shows the points x of the globe, in px, and whether they face its camera."""
        v = C.spin(C.back(first['q']), C.spin(turn(AT), x * np.array(FLAT)) - np.array(first['p']))
        return SHAPE[1] / 2 + k * v[..., 0] / -v[..., 2] - 0.5, SHAPE[0] / 2 - k * v[..., 1] / -v[..., 2] - 0.5, x @ (C.spin(C.back(turn(AT)), first['p']) / np.array(FLAT)) > 0

    def drawn(t):
        if t not in held:
            seen = {}

            def both(x):
                seen['x'] = x
                return ground(x)

            picture, _, which = M.draw(pose(t), [{'place': [0, 0, 0], 'turn': turn(t), 'scale': FLAT, 'pattern': both}], SHAPE)
            held[t] = (picture, which > 0, seen['x'], other(seen['x']) if t >= AT else None)
        return held[t]

    def frame(size, t, gain):
        size = size if t >= AT else None
        if (size, t, gain) not in made:
            picture, hit, x, late = drawn(t)
            if size:
                px, py, front = placed(x)
                ys, xs = np.nonzero(drawn(AT)[1])
                cx, cy = round(xs.mean()) + 60, round(ys.mean()) - 40
                on = hit & front & (px >= cx - size / 2 - 0.5) & (px < cx + size / 2 - 0.5) & (py >= cy - size / 2 - 0.5) & (py < cy + size / 2 - 0.5)
                if t == AT:
                    ys, xs = np.nonzero(on)
                    boxes[size] = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
                picture = np.where(on, picture + gain * (late - picture), picture)
            g = picture + np.random.default_rng(7000 + t).normal(0, GRAIN, SHAPE)
            path = os.path.join(folder, '%s-%s-k%03d.png' % (size or 'clean', gain, t))
            cv2.imwrite(path, np.clip(np.round(g), 0, 255).astype(np.uint8))
            made[(size, t, gain)] = path
        return made[(size, t, gain)]

    return (lambda size, a, b, gain=1: [frame(size, t, gain) for t in range(a, b + 1)]), (lambda size: boxes[size]), (lambda t: drawn(t)[1])


def read(paths, a, own, **more):
    return S.pictures({**JOB, 'paths': paths, 'poses': [pose(t) for t in range(a, a + len(paths))], 'first': 0, 'total': len(paths), 'own': list(own), **more})


def masks(hit):
    """The reader's ground against the drawn body, and a ringed pose: what the rings cover is not ground."""
    shape = (SHAPE[0] // 4, SHAPE[1] // 4)
    body = cv2.resize(hit(AT).astype(np.uint8), (shape[1], shape[0]), interpolation=cv2.INTER_AREA) > 0
    here = pose(AT)
    edge = S.body(here, shape, 0, False)
    round_ = S.body({key: here[key] for key in ('p', 'q', 'vfov')}, shape, 0, False)
    ringed = {**here, 'rings': {'normal': list(C.spin(TILT, np.array([0.0, 1.0, 0.0]))), 'inner': 1.2, 'outer': 2.2}}
    plain, alone, cover = S.body(here, shape, 0), S.body(ringed, shape, 0, False), S.body(ringed, shape, 0)
    inner = S.ground(here, pose(AT + 1), shape, 0.25)
    return {'apart': int((edge ^ body).sum()), 'round': int((round_ & ~body).sum()), 'body': int(body.sum()), 'ground': int(inner.sum()), 'outside': int((inner & ~body).sum()),
            'covered': int((plain & ~alone).sum()), 'ringsOnGround': int((alone & ~plain).sum()), 'rings': int((cover & ~plain).sum()), 'noPose': int(S.ground(None, here, shape, 0.25).sum()), 'pixels': shape[0] * shape[1]}


def near():
    full = [1.0] * 8
    holed = [1.0, None, 1.0, 1.0, 1.0, None, 1.0, 1.0]
    return {'middle': S.nearest(full, 4, set(), 8), 'first': S.nearest(full, 0, set(), 8), 'second': S.nearest(full, 1, set(), 8), 'last': S.nearest(full, 7, set(), 8), 'beforeBreak': S.nearest(full, 2, {4}, 8),
            'afterBreak': S.nearest(full, 4, {4}, 8), 'holed': S.nearest(holed, 3, set(), 8), 'alone': S.nearest([1.0, 1.0], 0, set(), 2)}


def grounds():
    with tempfile.TemporaryDirectory() as folder:
        film, box, hit = films(folder)
        clean = read(film(None, 0, FRAMES - 1), 0, (0, FRAMES))
        full = clean['full']
        row = AT - 1
        plain = read(film(None, 0, FRAMES - 1), 0, (0, FRAMES), both=False)
        alone = read(film(None, row - 2, row + 3), row - 2, (2, 3), both=False, carryFull=True)
        plates = {}
        for name, gain in (('whole', 1), ('faint', FAINT)):
            plates[name] = {}
            for size in SIZES:
                r = read(film(size, row - 2, row + 3, gain), row - 2, (2, 3))
                plates[name][str(size)] = {'box': box(size), 'pop': r['full']['groundPop'][2], 'left': r['full']['groundLeft'][2], 'base': r['full']['groundBase'][2], 'at': r['full']['groundAt'][2], 'size': r['full']['groundSize'][2],
                                           'popAll': r['full']['popAll'][2], 'popFull': r['full']['pop'][2], 'popStanding': r['pop'][2], 'read': sum(x is not None for x in r['full']['groundPop'])}
        return {'rows': FRAMES - 1, 'row': row, 'clean': {key: full[key] for key in KEYS}, 'popFull': full['pop'], 'motionPx': clean['motionPx'],
                'plainKeys': [key for key in plain if key.startswith('ground') or key == 'full'], 'standingKeys': [key for key in clean if key.startswith('ground')],
                'alone': {key: alone[key][2] for key in KEYS}, 'aloneAt': list(alone).index('groundLeft') - len(alone), 'plates': plates, 'masks': masks(hit), 'near': near(),
                'law': {'insidePx': S.GROUND_PX, 'near': S.GROUND_NEAR, 'share': S.GROUND_SHARE, 'blurPx': S.GROUND_BLUR_PX}}


if __name__ == '__main__':
    json.dump({'grounds': grounds()}, sys.stdout)
