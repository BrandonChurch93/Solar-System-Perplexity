#!/usr/bin/env python3
"""Made films for the proofs of the pop score with the carry at the full size (tests/smooth.test.ts). One still picture (stars as points, a soft
field and a fine field under them) under a sideways move of the camera with the drift the sky has in Saturn's rise (DRIFT: px of the reduced
picture from one capture frame to the next, read off the film's frames 3848 to 3894), every frame moved exactly (a phase ramp on a periodic
canvas) and given its own grain: nothing pops in it. Then the same film with one true event from one frame on, at the top of the hill the
standing reader reads on the still (TOP) and at its foot (FOOT): the fine field swapped for another one, or a square lifted by 2, 4 or 8 display
values. Fixed seeds. Writes one JSON reply on stdout."""
import json
import os
import sys
import tempfile

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
import smooth as S  # noqa: E402

H, W, WIDE = 540, 960, 1920
K0, N, FIRST = 7696, 94, 100
TOP, FOOT = 7749, 7738
REACH = 16
DRIFT = [3.42, 3.29, 3.32, 3.25, 3.14, 3.06, 3.02, 3.01, 2.97, 2.88, 2.89, 2.81, 2.75, 2.74, 2.71, 2.62, 2.6, 2.55, 2.44, 2.41, 2.39, 2.36, 2.25, 2.17, 2.12, 2.11, 1.97, 1.92, 1.9, 1.75, 1.76,
         1.65, 1.58, 1.54, 1.41, 1.38, 1.26, 1.3, 1.17, 1.11, 1.08, 0.97, 0.94, 0.88, 0.81, 0.81, 0.73, 0.67, 0.63, 0.58, 0.54, 0.49, 0.46, 0.42, 0.36, 0.32, 0.3, 0.26, 0.23, 0.21, 0.19, 0.16,
         0.14, 0.12, 0.1, 0.08, 0.07, 0.05, 0.04, 0.04, 0.03] + [0.02] * 22
JOB = {'op': 'pictures', 'scale': 0.25, 'window': 32, 'floor': 0.25, 'grid': [16, 9], 'changeFrames': REACH, 'changeBlur': 20, 'patternPx': 40, 'patternFloor': 1, 'total': 198, 'lead': 16, 'tail': 16}
EVENTS = ('layer', 'step2', 'step4', 'step8')


def field(seed, lo, hi, rms, count=64):
    r = np.random.default_rng(seed)
    y, x = np.mgrid[0:H, 0:WIDE].astype(np.float64)
    f = np.zeros((H, WIDE))
    for _ in range(count):
        lam = np.exp(r.uniform(np.log(lo), np.log(hi)))
        a = r.uniform(0, 2 * np.pi)
        kx = round(np.cos(a) * WIDE / lam) / WIDE
        ky = round(np.sin(a) * H / lam) / H
        f += np.cos(2 * np.pi * (kx * x + ky * y) + r.uniform(0, 2 * np.pi))
    return f / f.std() * rms


def stars(seed, count, sigma=0.8):
    r = np.random.default_rng(seed)
    f = np.zeros((H, WIDE))
    ys, xs = r.integers(0, H, count), r.integers(0, WIDE, count)
    np.add.at(f, (ys, xs), 3 * (1 - r.uniform(0, 1, count)) ** -0.8)
    fy, fx = np.fft.fftfreq(H)[:, None], np.fft.fftfreq(WIDE)[None, :]
    return np.minimum(np.real(np.fft.ifft2(np.fft.fft2(f) * np.exp(-2 * np.pi ** 2 * sigma ** 2 * (fx ** 2 + fy ** 2)))) * 2 * np.pi * sigma ** 2, 230)


def moved(canvas, dx):
    fx = np.fft.fftfreq(WIDE)[None, :]
    return np.real(np.fft.ifft2(np.fft.fft2(canvas) * np.exp(-2j * np.pi * fx * dx)))


def films(folder):
    """The frames of a case as files, made once: film(case, at, a, b) gives the paths of the frames a to b of the still with the event planted from capture frame at on."""
    pos = [0.0]
    for d in DRIFT:
        pos.append(pos[-1] + 4 * d)
    sky = 22 + stars(1, 9000) + field(2, 30, 400, 3)
    fine = field(3, 4, 24, 1.5)
    other = field(4, 4, 24, 1.5)
    box = np.zeros((H, WIDE))
    box[200:360, 300:460] = 1
    still = sky + fine
    late = {'layer': sky + other, **{'step%d' % v: still + box * v for v in (2, 4, 8)}}
    made = {}

    def frame(case, i):
        if (case, i) not in made:
            g = moved(late[case] if case else still, pos[i])[:, :W] + np.random.default_rng(100000 + K0 + i).normal(0, 1.2, (H, W))
            path = os.path.join(folder, '%s-k%06d.png' % (case or 'still', K0 + i))
            cv2.imwrite(path, np.clip(np.round(g), 0, 255).astype(np.uint8))
            made[(case, i)] = path
        return made[(case, i)]

    return lambda case, at, a, b: [frame(case if case and K0 + i >= at else None, i) for i in range(a, b + 1)]


def read(paths, a, own, **more):
    return S.pictures({**JOB, 'paths': paths, 'first': FIRST + a, 'own': [FIRST + own[0], FIRST + own[1]], **more})


GROUND = ('groundLeft', 'groundBase', 'groundPop', 'groundShare', 'groundAt', 'groundSize')
KEYS = ('residual', 'base', 'popAll', 'popCarried', 'pop', 'motionPx', 'unsure', 'popBlock', 'popBlockAt', 'change', 'changeTop', 'changeAt', 'changeShare') + GROUND


def pops():
    with tempfile.TemporaryDirectory() as folder:
        film = films(folder)
        a, b = 16, 76
        whole = read(film(None, 0, 0, N - 1), 0, (a, b + 1), both=True)
        rows = range(a, b + 1)
        still = {'ks': [K0 + i for i in rows], 'standing': [whole['pop'][i] for i in rows], 'full': [whole['full']['pop'][i] for i in rows],
                 'fullAll': [whole['full']['popAll'][i] for i in rows], 'fullCarried': [whole['full']['popCarried'][i] for i in rows], 'ground': [whole['full']['groundPop'][i] for i in rows], 'groundShare': [whole['full']['groundShare'][i] for i in rows]}
        lo, hi = FOOT - K0 - REACH, TOP - K0 + REACH + 1
        part = film(None, 0, lo, hi)
        own = (FOOT - K0, TOP - K0 + 1)
        plain, full, both = read(part, lo, own), read(part, lo, own, carryFull=True), read(part, lo, own, both=True)
        same = {'standing': all(plain[key] == both[key] for key in plain), 'full': all(full[key] == both['full'][key] for key in KEYS),
                'rest': all(full[key] == both[key] for key in full if key not in KEYS), 'whole': all(whole['full'][key][lo + i] == both['full'][key][i] for key in ('pop', 'popAll', 'popCarried') + GROUND for i in range(own[0] - lo, own[1] - lo)),
                'ground': [key for key in plain if key.startswith('ground')] == [] and list(full)[-len(GROUND):] == list(GROUND) and list(both['full'])[-len(GROUND):] == list(GROUND),
                'rows': own[1] - own[0], 'keys': len(plain)}
        events = {}
        for case in EVENTS:
            events[case] = {}
            for name, at in (('top', TOP), ('foot', FOOT)):
                i = at - 1 - K0
                lo, hi = i - REACH, i + REACH + 1
                r = read(film(case, at, lo, hi), lo, (i, i + 1), both=True)
                events[case][name] = {'k': K0 + i, 'standing': r['pop'][i - lo], 'full': r['full']['pop'][i - lo], 'fullAll': r['full']['popAll'][i - lo], 'fullCarried': r['full']['popCarried'][i - lo], 'still': whole['full']['pop'][i], 'ground': r['full']['groundPop'][i - lo], 'groundAt': r['full']['groundAt'][i - lo], 'groundSize': r['full']['groundSize'][i - lo]}
        return {'still': still, 'same': same, 'events': events}


if __name__ == '__main__':
    json.dump({'pops': pops()}, sys.stdout)
