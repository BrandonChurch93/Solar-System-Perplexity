#!/usr/bin/env python3
"""Made pictures for the proofs of the pattern read by geometry (tests/geo.test.ts): a turning sphere under a camera that dives, swings and
rolls, read over 8 steps. One texture swapped for another; the same texture under a strong light bound to the view's angle; the same with a
drift of the ground the record does not tell. Each through the pictures part of smooth.py, from files, so that the reading by the flow, the
reading by geometry and the reading by the true carry stand side by side. The control (unchanged): the later frame of the pair drawn again
from the first by the map, on the clean case and on the swap under the light. The slide: the texture slides on its body by 2 px of the
picture a step under the lens (16 px over the pair), which the record does not tell: a pattern that does not stick to its body; and by 4 px a step. The sky: the body unchanged, the sky off it one field fading into another, which only the flow part of the line of both reads. Fixed seeds. Writes one JSON reply on stdout."""
import json
import os
import sys
import tempfile

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carry as C  # noqa: E402
import smooth as S  # noqa: E402
from madecarry import FLOOR, FULL, MARGIN, SCALE, WIDE, about, camera, draw, globe  # noqa: E402

STEPS = 8
FORM = {'low': -20, 'octaves': 32, 'units': [1.0]}


def pose(j):
    """The camera at step j of the dive: from 3.4 to 2.3 radii, swinging, rolling 7 degrees, its lens from 44 to 40 degrees."""
    t = j / STEPS
    mix = lambda a, b: list((1 - t) * np.array(a, dtype=np.float64) + t * np.array(b, dtype=np.float64))
    return camera(mix([1.2, 0.2, 3.4], [0.5, 0.3, 2.3]), mix([-0.1, 0.1, 0.0], [0.1, 0.0, 0.0]), 44 - 4 * t, 7 * (1 - t))


def light(mu, width):
    """A strong light bound to the view's angle: the ground is dimmed towards the limb, a veil rises there, and a glint lies where the lens
    looks straight down, of the width given (0.2: wider than the reader's wide window; 0.02: narrower, a detail of its own, and the picture
    is blown out in it). mu: the cosine between the ray and the ground's own up."""
    return 0.35 + 0.65 * mu, 140 * (1 - mu) ** 3 + 90 * np.exp(-(1 - mu) / width)


def field(seed):
    """A sky that is no body: smooth noise of a few px, fixed by its seed."""
    import cv2
    noise = np.random.default_rng(seed).standard_normal(FULL).astype(np.float32)
    return 110 + 260 * cv2.GaussianBlur(noise, (0, 0), 3.0)


def shot(j, seed, lit, drift, mixed=0.0, other=2, width=0.2, sky=False):
    """Step j: the sphere turned 5 degrees over the steps (told) and by drift degrees more (not told), its texture of the seed, mixed with
    the other texture by the share mixed."""
    told = about([0.1, 1, 0], 5 * j / STEPS)
    turn = about([0.1, 1, 0], (5 + drift) * j / STEPS)
    cam = pose(j)
    picture, depth, which = draw(cam, [globe(turn, seed)], FULL)
    if mixed:
        picture = (1 - mixed) * picture + mixed * draw(cam, [globe(turn, other)], FULL)[0]
    record = {**cam, 'range': FORM, 'bodies': [{'place': [0, 0, 0], 'turn': told}]}
    if lit:
        mu = C.slant(depth, which, record, record)[0]
        gain, veil = light(np.nan_to_num(mu, nan=1.0), width)
        picture = np.where(which > 0, picture * gain + veil, picture)
    if sky:
        picture = np.where(which > 0, picture, (1 - j / STEPS) * field(11) + j / STEPS * field(12))
    return np.clip(picture, 0, 255).astype(np.uint8), depth, record


def run(folder, name, lit=False, drift=0.0, swap=False, width=0.2, unchanged=False, sky=False):
    paths, depths, poses = [], [], []
    for j in range(STEPS + 1):
        picture, depth, record = shot(j, 1, lit, drift, j / STEPS if swap else 0.0, width=width, sky=sky)
        paths.append(os.path.join(folder, '%s-f%d.png' % (name, j)))
        depths.append(os.path.join(folder, '%s-d%d.png' % (name, j)))
        Image.fromarray(np.repeat(picture[..., None], 3, axis=2)).save(paths[-1])
        Image.fromarray(C.packed(depth, FORM)).save(depths[-1])
        poses.append(record)
    job = {'op': 'pictures', 'paths': paths, 'poses': poses, 'depths': depths, 'carry': True, 'scale': SCALE, 'changeFrames': STEPS, 'changeBlur': MARGIN / SCALE, 'patternPx': WIDE / SCALE,
           'patternFloor': FLOOR, 'window': 2, 'floor': 0.25, 'grid': [16, 9], 'first': 0, 'total': STEPS + 1, 'own': [0, STEPS + 1], 'lead': 0, 'tail': 0, **({'unchanged': True} if unchanged else {})}
    n = S.pictures(job)
    return {'flow': n['pattern'][0], 'true': n['patternTrue'][0], 'trueSteep': n['patternTrueSteep'][0], 'trueGraze': n['patternTrueGraze'][0], 'trueBy': n['patternTrueBy'][0], 'trueEnds': n['patternTrueEnds'][0], 'trueRest': n['patternRest'][0], 'trueBoth': n['patternBoth'][0], 'trueBothBy': n['patternBothBy'][0], 'trueBothMap': n['patternBothMap'][0], **{key: n[key][0] for key in ('patternMap', 'patternMapBody', 'patternMapAlone', 'patternMapNo', 'patternMapRefused', 'patternMapBulk', 'patternMapSure', 'patternMapGraze', 'patternMapBound', 'patternMapMoved')},
            'limits': n['patternMapLimits']}


def main():
    out = {}
    with tempfile.TemporaryDirectory() as folder:
        out['clean'] = run(folder, 'clean')
        out['swap'] = run(folder, 'swap', swap=True)
        out['light'] = run(folder, 'light', lit=True)
        out['lightSwap'] = run(folder, 'lightswap', lit=True, swap=True)
        out['glint'] = run(folder, 'glint', lit=True, width=0.02)
        out['drift'] = run(folder, 'drift', lit=True, drift=0.8)
        out['far'] = run(folder, 'far', lit=True, drift=3.0)
        last = pose(STEPS)
        slide = float(np.degrees(2 * STEPS * (np.linalg.norm(last['p']) - 1) / C.lens(last, FULL)))
        out['slide'] = {**run(folder, 'slide', drift=slide), 'degrees': slide}
        out['slide4'] = run(folder, 'slide4', drift=2 * slide)
        out['sky'] = run(folder, 'sky', sky=True)
        out['same'] = run(folder, 'same', unchanged=True)
        out['sameSwap'] = run(folder, 'sameswap', lit=True, swap=True, unchanged=True)
    json.dump(out, sys.stdout)


if __name__ == '__main__':
    main()
