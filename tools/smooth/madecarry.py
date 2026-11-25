#!/usr/bin/env python3
"""Made pictures for the proofs of the pattern read by the camera's own map (tests/carry.test.ts): bodies with a pattern fixed to them, drawn by
their own rays with their depth picture, at known poses. Fixed seeds. Writes one JSON reply on stdout."""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img'))
import carry as C  # noqa: E402
import smooth as S  # noqa: E402

FULL = (540, 960)
SCALE = 0.25
WIDE, FLOOR, MARGIN = 10.0, 1.0, 5.0
UNIT = [0.0, 0.0, 0.0, 1.0]


def about(axis, deg):
    axis = np.array(axis, dtype=np.float64)
    axis /= np.linalg.norm(axis)
    half = np.radians(deg) / 2
    return list(axis * np.sin(half)) + [float(np.cos(half))]


def times(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]


def looking(p, target, roll=0.0):
    """The quaternion of a camera at p that looks at the target, its up nearest to y, rolled about its own axis."""
    f = np.array(target, dtype=np.float64) - np.array(p, dtype=np.float64)
    f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0])
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    m = np.stack([r, u, -f], axis=1)
    w = np.sqrt(max(1 + m[0, 0] + m[1, 1] + m[2, 2], 1e-12)) / 2
    q = [(m[2, 1] - m[1, 2]) / (4 * w), (m[0, 2] - m[2, 0]) / (4 * w), (m[1, 0] - m[0, 1]) / (4 * w), w]
    return times(q, about([0, 0, 1], roll))


def waves(seed, lo, hi, count=48):
    """A pattern in space with detail at every width between lo and hi: plane waves of fixed seed."""
    rng = np.random.default_rng(seed)
    k = rng.normal(size=(count, 3))
    k /= np.linalg.norm(k, axis=1, keepdims=True)
    k *= (2 * np.pi / np.exp(rng.uniform(np.log(lo), np.log(hi), count)))[:, None]
    phase = rng.uniform(0, 2 * np.pi, count)

    def at(x):
        out = np.zeros(x.shape[:-1])
        for j in range(count):
            out += np.cos(x @ k[j] + phase[j])
        return 128 + 70 * out / np.sqrt(count)

    return at


def bumps(seed, height, width):
    w = waves(seed, width, width * 2, 12)
    return lambda x: height * (w(x) - 128) / 70


def draw(pose, bodies, shape, sky=None):
    """The picture, the depth picture and the body of every pixel: each body is the unit sphere scaled along its own axes (scale), at its
    place, turned by its turn and then drawn in its shape (a matrix of the pose frame, outside the turn), with relief when it has one (the radius grows by relief(direction)); the nearest one is drawn."""
    ray = C.rays(pose, shape)
    p = np.array(pose['p'], dtype=np.float64)
    picture = np.full(shape, 8.0) if sky is None else sky(C.rays(pose, shape, pose.get('sky')))
    depth = np.full(shape, np.inf)
    which = np.zeros(shape, np.int32)
    for v, b in enumerate(bodies, 1):
        gs = np.array(b.get('scale', [1, 1, 1]), dtype=np.float64)
        f = np.linalg.inv(np.array(b['shape'], dtype=np.float64).reshape(3, 3)) if b.get('shape') else None
        own = lambda x: C.spin(C.back(b['turn']), x if f is None else x @ f.T) / gs
        o, d = own(p - np.array(b['place'], dtype=np.float64)) / b.get('radius', 1), own(ray) / b.get('radius', 1)
        a = (d * d).sum(-1)
        near = -(d @ o)
        relief = b.get('relief')
        top = 1 + (b.get('top', 0) if relief else 0)
        disc = near * near - a * (o @ o - top * top)
        t = (near - np.sqrt(np.maximum(disc, 0))) / a
        hit = (disc > 0) & (t > 0)
        if relief:
            for _ in range(60):
                x = o + d * t[..., None]
                r = np.linalg.norm(x, axis=-1)
                t = t + 0.6 * (r - 1 - relief(x / r[..., None])) / np.sqrt(a)
            x = o + d * t[..., None]
            r = np.linalg.norm(x, axis=-1)
            hit &= np.abs(r - 1 - relief(x / r[..., None])) < 1e-5
        x = o + d * t[..., None]
        if relief:
            x = x / np.linalg.norm(x, axis=-1, keepdims=True)
        nearer = hit & (t < depth)
        picture[nearer] = b['pattern'](x)[nearer]
        depth[nearer] = t[nearer]
        which[nearer] = v
    return picture, np.where(which > 0, depth, np.nan), which


def frame(pose, bodies, sky=None, source='depth'):
    """A frame as the reader takes it: drawn at the full size and reduced, its depth picture and bodies at the reduced size."""
    full, _, _ = draw(pose, bodies, FULL, sky)
    grey = S.small(full, SCALE)
    told = {**pose, 'bodies': [{'place': b['place'], 'turn': b.get('told', b['turn']), **{key: b[key] for key in ('shape', 'flows', 'light') if b.get(key)}} for b in bodies]}
    if source == 'ball':
        told = C.told({**pose, 'turn': bodies[0]['turn']})
        depth, which = C.ball(told, grey.shape)
    else:
        _, depth, which = draw(pose, bodies, grey.shape, sky)
    return {'grey': grey, 'full': lambda: full, 'depth': depth, 'which': which, 'pose': told}


def read(a, b, span=None):
    out, (p, later, rule) = C.read(a, b, MARGIN, SCALE, WIDE, FLOOR, span)
    return out, p, rule


def camera(p, target, vfov=40, roll=0.0, sky=None):
    q = looking(p, target, roll)
    return {'p': list(map(float, p)), 'q': q, 'vfov': vfov, **({'sky': sky} if sky else {})}


def globe(turn, seed=1, **more):
    return {'place': [0, 0, 0], 'turn': turn, 'pattern': waves(seed, 0.02, 0.3), **more}


def leave(seed, way):
    """A rise or a dive over a turning sphere: the camera goes from 2.2 to 3.6 radii (or back), swings and rolls, the body turns 5 degrees."""
    near, far = camera([0.5, 0.3, 2.1], [0.1, 0.0, 0.0]), camera([1.2, 0.2, 3.4], [-0.1, 0.1, 0.0], 44, 7)
    first, later = (near, far) if way == 'rise' else (far, near)
    return first, later, about([0.1, 1, 0], 0), about([0.1, 1, 0], 5)


def tool(folder):
    """The same made rise through the pictures part of smooth.py, from files: three frames with their depth pictures as the render packs them,
    once as main reads them and once with the second reader beside."""
    from PIL import Image
    first, later, t0, t1 = leave(1, 'rise')
    mid = camera([0.85, 0.25, 2.75], [0.0, 0.05, 0.0], 42, 3.5)
    form = {'low': -20, 'octaves': 32, 'units': [1.0]}
    paths, depths, poses = [], [], []
    for j, (pose, turn, seed) in enumerate(((first, t0, 1), (mid, about([0.1, 1, 0], 2.5), 1), (later, t1, 1), (later, t1, 2))):
        picture, depth, _ = draw(pose, [globe(turn, seed)], FULL)
        paths.append(os.path.join(folder, 'f%d.png' % j))
        depths.append(os.path.join(folder, 'd%d.png' % j))
        Image.fromarray(np.repeat(np.clip(picture, 0, 255).astype(np.uint8)[..., None], 3, axis=2)).save(paths[-1])
        Image.fromarray(C.packed(depth, form)).save(depths[-1])
        poses.append({**pose, 'range': form, 'bodies': [{'place': [0, 0, 0], 'turn': turn}]})
    job = lambda order, **more: {'op': 'pictures', 'paths': [paths[j] for j in order], 'poses': [poses[j] for j in order], 'scale': SCALE, 'changeFrames': 2, 'changeBlur': MARGIN / SCALE, 'patternPx': WIDE / SCALE, 'patternFloor': FLOOR, **more}
    plain = S.pictures(job([0, 1, 2]))
    beside = S.pictures(job([0, 1, 2], carry=True, depths=[depths[j] for j in (0, 1, 2)]))
    other = S.pictures(job([0, 1, 3], carry=True, depths=[depths[j] for j in (0, 1, 3)]))
    ball = S.pictures(job([0, 1, 2], carry=True))
    return {'plainKeys': sorted(plain.keys()), 'mainSame': all(plain[k] == beside[k] for k in plain), 'more': sorted(set(beside) - set(plain)), 'main': plain['pattern'][0],
            'limits': beside['patternMapLimits'], 'clean': {k: beside[k][0] for k in beside if k.startswith('patternMap') and k != 'patternMapLimits'}, 'exchange': {k: other[k][0] for k in other if k.startswith('patternMap') and k != 'patternMapLimits'}, 'ball': ball['patternMap'][0], 'ballUnits': ball['patternMapUnits'][0], 'rows': [v is not None for v in beside['patternMap']]}


def main():
    out = {}
    for way in ('rise', 'dive'):
        first, later, t0, t1 = leave(1, way)
        clean, _, rule = read(frame(first, [globe(t0)]), frame(later, [globe(t1)]))
        other, _, _ = read(frame(first, [globe(t0)]), frame(later, [globe(t1, 2)]))
        untold = frame(later, [globe(t1)])
        untold['pose'] = {**untold['pose'], 'bodies': [{'place': [0, 0, 0], 'turn': t0}]}
        left, _, _ = read(frame(first, [globe(t0)]), untold)
        out[way] = {'clean': clean, 'exchange': other, 'untold': left}
    low, high, turn = camera([0.2, 0.1, 1.12], [0.5, 0.3, 0.0]), camera([0.3, 0.1, 1.4], [0.4, 0.3, 0.0], 44, 3), about([0.1, 1, 0], 1)
    a, b = frame(low, [globe(UNIT)]), frame(high, [globe(turn)])
    shell = lambda f, pose, t: {**f, **{k: v for k, v in frame(pose, [globe(t, radius=1.03)]).items() if k in ('depth', 'which')}}
    out['refusal'] = {'clean': read(a, b)[0], 'shell': read(shell(a, low, UNIT), shell(b, high, turn))[0], 'grounds': read(a, shell(b, high, turn))[0]}
    first, later, t0, t1 = leave(1, 'rise')
    a = frame(first, [globe(t0)])
    mx, my, far, held = C.carry(a['depth'], a['which'], a['pose'], frame(later, [globe(t1)])['pose'])
    at = (60, 150)
    ray = C.rays(first, a['grey'].shape)[at]
    x = np.array(first['p']) + ray * a['depth'][at]
    c, s = np.cos(np.radians(5)), np.sin(np.radians(5))
    n = np.array([0.1, 1, 0]) / np.linalg.norm([0.1, 1, 0])
    x = x * c + np.cross(n, x) * s + n * (n @ x) * (1 - c)
    f = np.array([-0.1, 0.1, 0.0]) - np.array(later['p'])
    f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0])
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    roll = np.radians(7)
    r, u = r * np.cos(roll) + u * np.sin(roll), u * np.cos(roll) - r * np.sin(roll)
    v = x - np.array(later['p'])
    k = a['grey'].shape[0] / 2 / np.tan(np.radians(44) / 2)
    out['point'] = {'carried': [float(mx[at]), float(my[at])], 'byHand': [float((v @ r) / (v @ f) * k + a['grey'].shape[1] / 2 - 0.5), float(a['grey'].shape[0] / 2 - 0.5 - (v @ u) / (v @ f) * k)], 'far': float(far[at]), 'farByHand': float(np.linalg.norm(v))}

    moon = lambda place, turn: {'place': place, 'turn': turn, 'radius': 0.12, 'pattern': waves(5, 0.2, 2)}
    m0, m1 = moon([0.25, 0.1, 1.25], UNIT), moon([0.05, 0.16, 1.3], about([0, 1, 0], 20))
    known, p, rule = read(frame(first, [globe(t0), m0]), frame(later, [globe(t1), m1]))
    fa = frame(first, [globe(t0), m0])
    out['moon'] = {'known': known, 'moonUnderMap': float((rule[fa['which'] == 2] == 1).mean()), 'moonPixels': int((fa['which'] == 2).sum())}
    blind, p, rule = read(frame(first, [globe(t0), m0], source='ball'), frame(later, [globe(t1), m1], source='ball'))
    out['moon']['unknown'] = blind
    one = []
    for pose, bodies in ((first, [globe(t0), m0]), (later, [globe(t1), m1])):
        f = frame(pose, bodies)
        f['which'] = (f['which'] > 0).astype(np.int32)
        one.append(f)
    single, p, rule = read(*one)
    out['moon']['oneBody'] = single
    out['moon']['oneBodyMoonUnderMap'] = float((rule[fa['which'] == 2] == 1).mean())
    out['moon']['unknownMoonUnderMap'] = float((rule[fa['which'] == 2] == 1).mean())
    way = C.carry(fa['depth'], fa['which'], fa['pose'], frame(later, [globe(t1), m1])['pose'])
    fb = frame(later, [globe(t1), m1])
    same = C.seen(*way, fa['which'], fb['depth'], fb['which'])
    lands = cv2.remap((fb['which'] == 2).astype(np.float32), way[0], way[1], cv2.INTER_NEAREST) > 0.5
    under = (fa['which'] == 1) & way[3] & lands
    out['moon']['covered'] = {'pixels': int(under.sum()), 'seen': float(same[under].mean()) if under.any() else None}

    flat = {'scale': [1, 0.9, 1]}
    oa, ob = frame(first, [globe(t0, **flat)]), frame(later, [globe(t1, **flat)])
    made, _ = C.ball({**first, 'globe': {'quaternion': UNIT, 'scale': [1, 0.9, 1]}}, oa['grey'].shape)
    both = np.isfinite(made) & np.isfinite(oa['depth'])
    out['oblate'] = {'clean': read(oa, ob)[0], 'ballOff': float(np.abs(made - oa['depth'])[both].max()), 'ballAgrees': float((np.isfinite(made) == np.isfinite(oa['depth'])).mean()),
                     'asSphere': read(frame(first, [globe(t0, **flat)], source='ball'), frame(later, [globe(t1, **flat)], source='ball'))[0]}

    sa, sb = [1, 0, 0, 0, 0.97, 0, 0, 0, 1], [1, 0.02, 0, 0.03, 0.9, 0, 0, 0, 1.03]
    ga, gb = frame(first, [globe(t0, shape=sa)]), frame(later, [globe(t1, shape=sb)])
    bare = lambda f: {**f, 'pose': {**f['pose'], 'bodies': [{k: v for k, v in b.items() if k != 'shape'} for b in f['pose']['bodies']]}}
    out['shape'] = {'told': read(ga, gb)[0], 'untold': read(bare(ga), bare(gb))[0], 'oneTold': read(ga, bare(gb))[0]}

    slid = about([0.1, 1, 0], 5.9)
    out['moving'] = {}
    for name, flows in (('rigid', None), ('told', 1.5), ('slow', 0.1)):
        more = {'flows': flows} if flows else {}
        out['moving'][name] = read(frame(first, [globe(t0, **more)]), frame(later, [globe(slid, told=t1, **more)]), 8)[0]
    out['moving']['stray'] = {}
    for name, more in (('clean', 0.0), ('slid', 0.5)):
        seen = [frame(camera([0.1 * j, 0, 5], [0, 0, 0], 40), [globe(about([0.1, 1, 0], (1 + more) * j), told=about([0.1, 1, 0], 1.0 * j))]) for j in range(5)]
        g = [f['grey'] for f in seen]
        out['moving']['stray'][name] = S.strayed([S.motion(g[j], g[j + 1]) for j in range(4)], [S.motion(g[j + 1], g[j]) for j in range(4)], 0, 4, seen[0], seen[4], MARGIN, SCALE)
    lamp = camera([0, 0, 6], [0, 0, 0], 40)
    mask = C.lit({**lamp, 'bodies': [{'place': [0, 0, 0], 'turn': UNIT, 'light': 2.0}]}, (135, 240))
    k = 135 / 2 / np.tan(np.radians(20))
    out['light'] = {'none': C.lit({**lamp, 'bodies': [{'place': [0, 0, 0], 'turn': UNIT}]}, (135, 240)) is None, 'share': float(mask.mean()), 'byHand': float(np.pi * (k * 2 / np.sqrt(36 - 4)) ** 2 / (135 * 240)),
                    'inside': bool(C.lit({**camera([0, 0, 1.5], [0, 0, 0], 40), 'bodies': [{'place': [0, 0, 0], 'turn': UNIT, 'light': 2.0}]}, (135, 240)).all())}

    low, high = camera([0.25, 0.12, 1.06], [0.9, 0.2, 0.6], 60), camera([0.3, 0.14, 1.2], [0.9, 0.2, 0.6], 60, 3)
    rough = {'relief': bumps(9, 0.012, 0.15), 'top': 0.03}
    ra, rb = frame(low, [globe(t0, **rough)]), frame(high, [globe(t1, **rough)])
    out['relief'] = {'clean': read(ra, rb)[0], 'asSphere': read(frame(low, [globe(t0, **rough)], source='ball'), frame(high, [globe(t1, **rough)], source='ball'))[0]}

    stars = waves(3, 0.01, 0.1)
    turn = about([0.2, 1, 0.1], 6)
    sa = camera([0, 0, 9], [0, 0, 0], 40)
    sa, sb = {**sa, 'sky': sa['q']}, {**sa, 'sky': times(turn, sa['q'])}
    sky = lambda rays: stars(rays)
    out['sky'] = {'clean': read(frame(sa, [], sky), frame(sb, [], sky))[0]}
    out['skyFlow'] = {}
    for name, seeds in (('clean', (3, 3, 3)), ('exchange', (3, 3, 11))):
        seen = []
        for j, seed in enumerate(seeds):
            pose = {**camera([0.3 * j, 0, 5], [0.3 * j - 0.9, 0, 0], 40), 'sky': times(about([0.2, 1, 0.1], 1.5 * j), sa['q'])}
            field = waves(seed, 0.01, 0.1)
            seen.append(frame(pose, [globe(C.UNIT)], lambda rays: field(rays)))
        frames = [f['grey'] for f in seen]
        fw = [S.motion(frames[j], frames[j + 1]) for j in range(2)]
        bw = [S.motion(frames[j + 1], frames[j]) for j in range(2)]
        limb = [S.glow_px({'glow': 24}, 0.25), S.glow_px({}, 0.25)]
        near = S.unbodied(frames, fw, bw, 0, 2, seen[0]['which'] > 0, seen[2]['which'] > 0, C.rim, MARGIN, WIDE, FLOOR, (limb[0], limb[0]))
        sky = S.unbodied(frames, fw, bw, 0, 2, seen[0]['which'] > 0, seen[2]['which'] > 0, C.rim, MARGIN, WIDE, FLOOR, (None, None))
        covered = C.hidden(*[C.carry(seen[0]['depth'], seen[0]['which'], seen[0]['pose'], seen[2]['pose'])[j] for j in (0, 1, 3)], seen[0]['which'], seen[2]['depth'], seen[2]['which'])
        out['skyFlow'][name] = {'value': sky['value'], 'share': sky['share'], 'far': near['far'], 'farShare': near['farShare'], 'none': [sky['far'], sky['farShare']], 'limb': limb, 'covered': float(covered.mean()), 'coveredOnBody': float((covered & (seen[0]['which'] > 0)).mean())}
    form = {'low': -20, 'octaves': 32, 'units': [330.0]}
    depth = np.exp(np.random.default_rng(4).uniform(-6, 6, FULL))
    depth[:60] = np.nan
    back = C.ranged(C.packed(depth, form, 330.0), {'range': form}, FULL)[0]
    out['range'] = {'off': float(np.nanmax(np.abs(back / depth - 1))), 'none': bool((np.isfinite(back) == np.isfinite(depth)).all()), 'reduced': float(np.isfinite(C.ranged(C.packed(depth, form, 330.0), {'range': form}, (FULL[0] // 4, FULL[1] // 4))[0]).mean())}
    two = {**low, 'range': {'low': -20, 'octaves': 32, 'units': [1.0, 0.003]}, 'bodies': [{'place': [0, 0, 0], 'turn': C.UNIT, 'scale': [1, 0.94, 1], 'axes': about([1, 0, 0.3], 20)}]}
    depth, which = C.ball({**two, 'globe': {'quaternion': two['bodies'][0]['axes'], 'scale': two['bodies'][0]['scale']}}, FULL)
    depth = depth * (1 + 0.004 * np.random.default_rng(5).uniform(-1, 1, FULL))
    layer = np.where(np.arange(FULL[1])[None, :] % 64 < 32, 1.0, 0.003) * np.ones(FULL)
    back, unit = C.ranged(C.packed(depth, two['range'], layer), two, FULL)
    out['range']['units'] = float(np.nanmax(np.abs(back / depth - 1)))
    out['range']['picked'] = bool((unit == np.where(np.isfinite(depth), (layer < 1).astype(int), -1)).all())
    small = C.ranged(C.packed(depth, two['range'], layer), two, (FULL[0] // 4, FULL[1] // 4))[1]
    out['range']['pickedSmall'] = [float((small == i).mean()) for i in (-1, 0, 1)]
    out['range']['near'] = [float((C.ranged(C.packed(depth, two['range'], layer), {**two, 'near': near}, FULL)[1] == 1).mean()) for near in (None, 0.01, 10.0)]
    if len(sys.argv) > 1:
        out['tool'] = tool(sys.argv[1])
    json.dump(out, sys.stdout)


if __name__ == '__main__':
    main()
