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


MOVE = {'frames': 16, 'world': 4, 'level': 110.0, 'contrast': 14.0, 'film': 4, 'edge': 3.0}
MOVES = [('rise', 1, 20), ('rise', 1, 80), ('rise', 1.3, 20), ('rise', 1.3, 80), ('rise', 2, 20), ('rise', 3, 20), ('rise', 4, 5), ('rise', 4, 10), ('rise', 4, 20), ('rise', 4, 40),
         ('rise', 6, 20), ('rise', 8, 20), ('rise soft', 3, 20), ('rise soft', 4, 20), ('dive', 1.3, 20), ('dive', 3, 20), ('dive', 4, 20), ('pan', 1, 20), ('pan', 1, 80)]
SWAPS = [('rise', 1, 20), ('rise', 1.3, 20), ('rise', 2, 20), ('rise', 3, 20), ('rise', 4, 20), ('rise', 8, 20), ('rise soft', 3, 20), ('rise soft', 4, 20), ('dive', 4, 20), ('pan', 1, 20)]
HALVES = [('rise', 1, 20), ('rise', 2, 20), ('rise', 3, 20), ('rise', 4, 20), ('dive', 4, 20)]
PARTS = [('rise', 1, 20, 16), ('rise', 1, 20, 32), ('rise', 3, 20, 16), ('rise', 3, 20, 32), ('rise', 4, 20, 16), ('rise', 4, 20, 32)]
SEEDS = (697, 1, 2, 3, 4, 5, 6)


def ground(rng):
    """A ground with detail at every width from 1 to 64 px, MOVE['world'] times the frame each way."""
    shape = (SHAPE[0] * MOVE['world'], SHAPE[1] * MOVE['world'])
    g = sum(s * cv2.GaussianBlur(rng.standard_normal(shape).astype(np.float32), (0, 0), s) for s in (1, 2, 4, 8, 16, 32, 64))
    return MOVE['level'] + MOVE['contrast'] * g / g.std()


def patch(one, other, radius):
    """The ground one with the ground other in a disc at its middle, of a radius in px of the ground, a soft edge."""
    ys, xs = np.mgrid[0:one.shape[0], 0:one.shape[1]]
    m = np.clip((radius - np.hypot(xs - (one.shape[1] - 1) / 2, ys - (one.shape[0] - 1) / 2)) / MOVE['edge'] + 0.5, 0, 1).astype(np.float32)
    return one * (1 - m) + other * m


def view(world, zoom, across):
    """The frame that shows the middle of the world at a zoom, moved across by px: reduced by area means, enlarged by Lanczos, mirrored beyond
    the edge of the world. Nothing in it but the world."""
    if zoom < 1:
        world = cv2.resize(world, (int(round(world.shape[1] * zoom)), int(round(world.shape[0] * zoom))), interpolation=cv2.INTER_AREA)
        zoom = 1
    h, w = SHAPE
    m = np.array([[zoom, 0, (w - 1) / 2 - zoom * (world.shape[1] - 1) / 2 + across], [0, zoom, (h - 1) / 2 - zoom * (world.shape[0] - 1) / 2]])
    return cv2.warpAffine(world, m, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT_101)


def move(rng, way, ratio, speed, worlds):
    """17 capture frames of a camera over a ground in which nothing changes (one world) or over one ground that is exchanged for another, cross
    faded over the frames (two worlds). rise: the picture shrinks ratio times, the closest frame at the sharpness of the world; rise soft: the
    same with the farthest frame at the sharpness of the world, so the closer ones are enlargements; dive: the rise run backwards; pan: no
    shrink. speed: px of the film a capture frame, across. The frames are the quarter size ones the measure works on."""
    n = MOVE['frames']
    zooms = [ratio ** (-j / n) if way != 'rise soft' else ratio ** (1 - j / n) for j in range(n + 1)]
    order = range(n, -1, -1) if way == 'dive' else range(n + 1)
    frames = []
    for at, j in enumerate(order):
        shown = [view(w, zooms[j], speed / MOVE['film'] * j) for w in worlds]
        f = shown[0] if len(shown) == 1 else (1 - at / n) * shown[0] + at / n * shown[1]
        frames.append(np.clip(f + GRAIN * rng.standard_normal(SHAPE).astype(np.float32), 0, 255).astype(np.float32))
    return frames


def carry(frames):
    """A made move read as the pictures part reads a row: the first frame against the last one carried back along the flows. before: the widths
    of the pattern as they stood, the same everywhere; now: the widths follow the enlargement of the carried frame."""
    n = len(frames) - 1
    fw = [S.motion(frames[j], frames[j + 1]) for j in range(n)]
    bw = [S.motion(frames[j + 1], frames[j]) for j in range(n)]
    d, moved, ok, way = S.change(frames, fw, bw, 0, n, WIDE / 2)
    grown = S.enlarged(*way, ok, WIDE)
    p0, p1 = S.pattern(frames[0], moved, ok, FINE, WIDE, FLOOR), S.matched(frames[0], moved, ok, FINE, WIDE, FLOOR, grown)
    was, now = S.patterned(p0), S.patterned(p1)
    return {'before': was[0], 'now': now[0], 'shareBefore': was[2], 'share': now[2], 'same': bool(np.array_equal(p0, p1, equal_nan=True)),
            'grown': float(np.median(grown[ok])) if ok.any() else None, 'p': p1, 'z': grown, 'ok': ok}


def carries():
    import tempfile
    from PIL import Image
    rng = np.random.default_rng(697)
    one, other = ground(rng), ground(rng)
    half = (one + other) / 2
    plain = lambda r: {k: v for k, v in r.items() if k not in ('p', 'z', 'ok')}
    out = {'rigid': [{'way': way, 'zoom': ratio, 'speed': speed, **plain(carry(move(rng, way, ratio, speed, [one])))} for way, ratio, speed in MOVES],
           'exchange': [{'way': way, 'zoom': ratio, 'speed': speed, **plain(carry(move(rng, way, ratio, speed, [one, other])))} for way, ratio, speed in SWAPS],
           'half': [{'way': way, 'zoom': ratio, 'speed': speed, **plain(carry(move(rng, way, ratio, speed, [one, half])))} for way, ratio, speed in HALVES], 'part': []}
    ys, xs = np.mgrid[0:SHAPE[0], 0:SHAPE[1]]
    for way, ratio, speed, radius in PARTS:
        r = carry(move(rng, way, ratio, speed, [one, patch(one, other, radius * ratio)]))
        disc = np.hypot(xs - (SHAPE[1] - 1) / 2, ys - (SHAPE[0] - 1) / 2) < radius * ratio
        judged = np.isfinite(r['p'])
        out['part'].append({'way': way, 'zoom': ratio, 'speed': speed, 'radius': radius, **plain(r), 'inside': float(np.median(r['z'][r['ok'] & disc])),
                            'outside': float(np.median(r['z'][r['ok'] & ~disc])), 'over': float((r['p'][judged & disc] > 0.45).mean()) if (judged & disc).any() else None})
    with tempfile.TemporaryDirectory() as folder:
        def through(worlds):
            paths = []
            for j, f in enumerate(move(rng, 'rise', 4, 20, worlds)):
                g = np.rint(f).astype(np.uint8)
                paths.append(os.path.join(folder, '%02d.png' % j))
                Image.fromarray(np.stack([g, g, g], axis=2)).save(paths[-1])
            n = S.pictures({'paths': paths, 'scale': 1, 'window': 32, 'floor': 0.25, 'grid': [16, 9], 'changeFrames': MOVE['frames'], 'changeBlur': WIDE / 2, 'patternPx': WIDE, 'patternFloor': FLOOR})
            return n['pattern'][0]
        out['through'] = {'rigid': through([one]), 'exchange': through([one, other])}
    return out


def spread():
    """The whole ground exchanged and dissolved half way under a shrink by 3 and by 4, at seven seeds: how far one draw is from the next."""
    out = {'seeds': list(SEEDS), 'exchange': {'3': [], '4': []}, 'half': {'3': [], '4': []}}
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        one, other = ground(rng), ground(rng)
        for ratio in (3, 4):
            for name, later in (('exchange', other), ('half', (one + other) / 2)):
                r = carry(move(rng, 'rise', ratio, 20, [one, later]))
                out[name][str(ratio)].append({'before': r['before'], 'now': r['now']})
    return out


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'carried':
        json.dump({'carried': carries()}, sys.stdout)
    elif len(sys.argv) > 1 and sys.argv[1] == 'spread':
        json.dump({'spread': spread()}, sys.stdout)
    elif len(sys.argv) > 1:
        json.dump({'pops': pops(json.loads(sys.argv[1]))}, sys.stdout)
    else:
        json.dump({'patterns': patterns(), 'bodies': bodies()}, sys.stdout)
