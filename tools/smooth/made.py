#!/usr/bin/env python3
"""Made pictures for the proofs of the pattern measure, of the body mask and of the pop score at the ends of a window (tests/smooth.test.ts). Fixed seeds. Writes one JSON reply on stdout."""
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


POPS = {'total': 40, 'window': 32, 'reach': 16, 'context': 16, 'shape': (180, 320)}


def pops(needs):
    """A window of 40 frames with 16 of context at each end: one fixed pattern under a grain that falls steadily from frame to frame, no
    spike anywhere. Read as a whole run without context, as a whole run with it, and in the slices whose frames the test names."""
    import tempfile
    from PIL import Image
    total, window, reach, ctx = POPS['total'], POPS['window'], POPS['reach'], POPS['context']
    rng = np.random.default_rng(6530)
    ground = 110 + 12 * cv2.GaussianBlur(rng.standard_normal(POPS['shape']).astype(np.float32), (0, 0), 6) / 0.05
    with tempfile.TemporaryDirectory() as folder:
        paths = {}
        for place in range(-ctx, total + ctx):
            grain = 9.0 * 0.5 ** ((place + ctx) / 24)
            g = np.clip(ground + grain * rng.standard_normal(POPS['shape']), 0, 255).astype(np.uint8)
            paths[place] = os.path.join(folder, '%03d.png' % (place + ctx))
            Image.fromarray(np.stack([g, g, g], axis=2)).save(paths[place])

        def read(own, lo, hi, lead, tail):
            job = {'paths': [paths[j] for j in range(lo, hi + 1)], 'scale': 1, 'window': window, 'floor': 0.25, 'grid': [16, 9], 'changeFrames': reach,
                   'changeBlur': 5, 'patternPx': 10, 'patternFloor': 1, 'first': lo, 'total': total, 'own': own, 'lead': lead, 'tail': tail}
            n = S.pictures(job)
            return {j: {c: n[c][j - lo] for c in n if isinstance(n[c], list) and len(n[c]) == hi - lo + 1} for j in range(max(lo, own[0]), min(hi + 1, own[1]))}

        plain = read([0, total], 0, total - 1, 0, 0)
        whole = read([0, total], -ctx, total - 1 + ctx, ctx, ctx)
        parts = {}
        for own, (lo, hi) in needs:
            parts.update(read(own, lo, hi, ctx, ctx))
    columns = sorted(whole[0])
    differ = sorted({c for j in whole for c in columns if whole[j][c] != plain[j][c]})
    apart = sum(1 for j in whole for c in columns if j not in parts or parts[j][c] != whole[j][c])
    spans = [[i, n, w, lead, tail, *S.span(i, n, w, lead, tail)] for n, w, lead, tail in ((228, 32, 0, 0), (228, 32, 16, 16), (228, 32, 6, 16), (10, 32, 0, 0), (10, 32, 16, 3)) for i in range(n)]
    return {'residual': [plain[j]['residual'] for j in range(total)], 'before': [plain[j]['pop'] for j in range(total)], 'now': [whole[j]['pop'] for j in range(total)],
            'differ': differ, 'apart': apart, 'rows': len(parts), 'spans': spans}


FILM = {'shape': (540, 960), 'scale': 0.25, 'frames': 16, 'level': 110.0, 'contrast': 16.0, 'grain': 1.24, 'blur': 20.0, 'wide': 40.0}
ZOOMS = (2, 3, 3.7, 4.4, 5.3)
WIDTHS = (16, 32, 64)
WEIGHTS = {'none': lambda t: t * 0, 'whole': lambda t: t, 'half': lambda t: 0.25 + t / 2, 'cut': lambda t: (t > 0.5) * 1.0}


def ground(rng):
    """A ground with detail at every width from 1 to 64 px, twice the frame each way."""
    shape = (FILM['shape'][0] * 2, FILM['shape'][1] * 2)
    g = sum(s ** 0.5 * cv2.GaussianBlur(rng.standard_normal(shape).astype(np.float32), (0, 0), s) for s in (0.5, 1, 2, 4, 8, 16, 32, 64))
    return FILM['level'] + FILM['contrast'] * g / g.std()


def exchanged(one, other, width):
    """The ground one with all its detail finer than the width replaced by that of the ground other."""
    low = lambda x: cv2.GaussianBlur(x, (0, 0), width)
    return low(one) + other - low(other)


def shot(world, shrink, across):
    """The frame, at the full size, that shows the middle of the world shrunk and moved across by px: reduced by area means, mirrored beyond
    the edge of the world. Nothing in it but the world."""
    if shrink > 1:
        world = cv2.resize(world, (int(round(world.shape[1] / shrink)), int(round(world.shape[0] / shrink))), interpolation=cv2.INTER_AREA)
    h, w = FILM['shape']
    m = np.array([[1, 0, (w - 1) / 2 - (world.shape[1] - 1) / 2 + across], [0, 1, (h - 1) / 2 - (world.shape[0] - 1) / 2]])
    return cv2.warpAffine(world, m, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)


def film(rng, way, shrink, speed, one, other, weight):
    """17 capture frames at the full size of a camera over the ground one, which gives way to the ground other by the weight (a function of
    the share of the window that has passed). rise: the picture shrinks, the first frame is the nearest and shows the ground at its own
    sharpness; dive: the rise run backwards, the exchange still onward in time. speed: px of the film a capture frame, across."""
    n = FILM['frames']
    weights = WEIGHTS[weight](np.arange(n + 1) / n)
    out = []
    for at in range(n + 1):
        j = n - at if way == 'dive' else at
        a, b = (shot(w, shrink ** (j / n), speed * j) if w is not None else 0 for w in (one, other if weights[at] > 0 else None))
        f = (1 - weights[at]) * a + weights[at] * b
        out.append(np.clip(f + FILM['grain'] * rng.standard_normal(FILM['shape']).astype(np.float32), 0, 255).astype(np.float64))
    return out


def judged(full):
    """A made film read as the pictures part reads a row: its first frame against its last. main: the measure as it stood, the later frame
    carried back from the reduced picture; now: the reading of the pair on the nearer of its frames."""
    scale, sigma, wide = FILM['scale'], FILM['blur'] * FILM['scale'], FILM['wide'] * FILM['scale']
    frames = [S.small(f, scale) for f in full]
    n = len(frames) - 1
    fw = [S.motion(frames[j], frames[j + 1]) for j in range(n)]
    bw = [S.motion(frames[j + 1], frames[j]) for j in range(n)]
    way = S.carry(fw, bw, 0, n)
    d, moved, ok = S.change(frames, fw, bw, 0, n, sigma, None, None, way)
    p = S.pattern(frames[0].astype(np.float32), moved, ok, wide / 5, wide, FLOOR)
    main = S.patterned(p)
    onward, back = S.readings(frames, fw, bw, 0, n, scale, sigma, wide, FLOOR, None, None, lambda j: full[j], way, moved)
    now, at, share, band = S.reading(onward, back, scale)
    grown = S.enlarged(way[0], way[1], ok, wide)
    return {'main': main[0], 'mainShare': main[2], 'now': now, 'share': share, 'band': band, 'onward': S.patterned(onward[0])[0], 'back': S.patterned(back[0])[0] if back else None,
            'same': bool(np.array_equal(p, onward[0], equal_nan=True)), 'grown': float(np.median(grown[ok])) if ok.any() else None}


def carries():
    import tempfile
    from PIL import Image
    rng = np.random.default_rng(710)
    one, other = ground(rng), ground(rng)
    swaps = {w: exchanged(one, other, w) for w in WIDTHS}
    out = {'rigid': [], 'exchange': [], 'still': []}
    for way in ('rise', 'dive'):
        for z in ZOOMS:
            out['rigid'].append({'way': way, 'zoom': z, **judged(film(rng, way, z, 0, one, None, 'none'))})
            for w in WIDTHS:
                for weight in ('whole',) + (('half',) if way == 'rise' else ()) + (('cut',) if w == WIDTHS[0] else ()):
                    out['exchange'].append({'way': way, 'zoom': z, 'width': w, 'weight': weight, **judged(film(rng, way, z, 0, one, swaps[w], weight))})
    for speed, weight in ((0, 'none'), (8, 'none'), (32, 'none'), (0, 'whole'), (8, 'whole'), (0, 'half'), (0, 'cut')):
        out['still'].append({'speed': speed, 'weight': weight, **judged(film(rng, 'rise', 1, speed, one, swaps[32], weight))})
    with tempfile.TemporaryDirectory() as folder:
        def through(way, later, weight):
            paths = []
            for j, f in enumerate(film(rng, way, 4.4, 0, one, later, weight)):
                g = np.rint(f).astype(np.uint8)
                paths.append(os.path.join(folder, '%02d.png' % j))
                Image.fromarray(np.stack([g, g, g], axis=2)).save(paths[-1])
            n = S.pictures({'paths': paths, 'scale': FILM['scale'], 'window': 32, 'floor': 0.25, 'grid': [16, 9], 'changeFrames': FILM['frames'], 'changeBlur': FILM['blur'], 'patternPx': FILM['wide'], 'patternFloor': FLOOR})
            return {'pattern': n['pattern'][0], 'band': n['patternBand'][0], 'at': n['patternAt'][0]}
        out['through'] = {'rise': through('rise', None, 'none'), 'dive': through('dive', None, 'none'), 'riseExchange': through('rise', swaps[16], 'whole'), 'diveExchange': through('dive', swaps[16], 'whole')}
    return out


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'carried':
        json.dump({'carried': carries()}, sys.stdout)
    elif len(sys.argv) > 1:
        json.dump({'pops': pops(json.loads(sys.argv[1]))}, sys.stdout)
    else:
        json.dump({'patterns': patterns(), 'bodies': bodies()}, sys.stdout)
