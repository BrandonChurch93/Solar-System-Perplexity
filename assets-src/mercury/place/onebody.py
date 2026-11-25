"""ONE BODY (MAIL 961, d251): the map, the first level and the plates of the place show the same bodies at every scale they share.

  python3 assets-src/mercury/place/onebody.py make [take]     writes out/work/mercury/place/onebody/<take>/{full,web}/
  python3 assets-src/mercury/place/onebody.py make <take> tone.png   writes the light's file alone, at `light.size`
  python3 assets-src/mercury/place/onebody.py install [take]  copies them into public (never beside a render)
  python3 assets-src/mercury/place/onebody.py law             writes src/stops/mercury/hue.json

Read: the files of the commit `oneBody.from` in out/work/mercury/place/onebody/from (git show <from>:public/assets/mercury/full/<file>):
patch-1.jpg, the map's own ground (A), and the plates, the place's own field in its own light (O). Written: one field F at every
level, in the map's units, so the globe lights it by its one law, and `light.file`, the place's light over F (L), so that F times L
is the place in its own light. Everything is done in the logarithm of the brightness; "the part over X" is a Gaussian of X degrees,
w rises from 0 to 1 between the two angles of `hold` in src/stops/mercury/own.json (degrees from the spot).

Outside the disc (w 1) the parent is the base and a plate adds only what is finer than the parent holds:
  F = A's part over `fineDeg` (`swap`; without it A as the level above shows it) + O's part under `fineDeg`
in A's colour over `toneDeg` (`plain`), and past `keepDeg` in A's own colour. The first level is A itself there.
`map` (two pattern values) lays the map's own ground into A where the reader finds A unlike the map; off in the kept take.

Inside the disc (w 0) the place's bodies are the planet's at every level, the first one included (d251). `restyle` gives them the
hero's light, so that the hold shows them as the map shows its own craters:
  F = A's part over the last of `bands` + every band of O between two of `bands`, mapped by rank onto A's band of the same widths
      in the ring `ring` (degrees from the spot) + O's part under the first of `bands`
`caps` (a pair of percentiles of A's band, or null, per band) holds a band softly inside A's own middle, so a broad pale body of
the place does not take the hero's hot tail. `near` (`at` east and north in degrees, `deg` full and out) takes, round one point,
the ranks of A's bands at that same point: the place's first pit lies on the hero's ring crater and gets that crater's light.
The colour is A's over the last band (geometric) times A's own law of colour against the bands' sum. The curves are written to
<take>/restyle.json. Without `restyle` a take keeps O's bodies between `fineDeg` and `toneDeg` as they are.

`law` writes src/stops/mercury/hue.json: the map's own colour against its brightness inside the disc (public full/wrap-color.jpg in
the frame of the first plate, `steps` knots even in the logarithm between the two percentiles `law`, each the mean colour of
its step over its luma). On the map bright ground is cooler than dark ground, in A it is warmer; the globe gives the disc the
map's law where the first level is not yet in round it (the hold) and the level's own colour where it is (globe.ts `mapHue`).

L (`light`: file, size, most): inside the disc O over F, both under the first band's width; outside it O's part over `lightDeg`
over A's. Held between 1/16 and `most`, written through the film curve, the same file in both sets.
"""
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import mosaic as M
import plates as P

SPEC = P.SPEC['oneBody']
OUT = M.WORK / 'onebody'
SRC = OUT / 'from'
LUMA = np.float32([0.2126, 0.7152, 0.0722])


def ground(path):
    return P.unfilmic(M.linear(np.asarray(Image.open(path).convert('RGB')))).astype(np.float32)


def soft(x, sigma):
    if sigma < 0.3:
        return x
    if sigma <= 12:
        return cv2.GaussianBlur(x, (0, 0), sigma)
    f = sigma / 6
    n = max(int(round(x.shape[0] / f)), 8)
    small = cv2.resize(x, (n, n), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma * n / x.shape[0], borderType=cv2.BORDER_REFLECT)
    return cv2.resize(small, (x.shape[1], x.shape[0]), interpolation=cv2.INTER_CUBIC)


def into(source, source_width, width, size, kind=cv2.INTER_CUBIC):
    gx, gy = M.grid((0, 0), width, size)
    k = source.shape[0] / (2 * M.half(source_width))
    return cv2.remap(source, (gx * k + source.shape[1] / 2 - 0.5).astype(np.float32), (source.shape[0] / 2 - gy * k - 0.5).astype(np.float32), kind, borderMode=cv2.BORDER_REPLICATE)


def geo(x, sigma, f):
    g = np.exp(np.stack([soft(np.log(np.maximum(x[..., c], 0) + f), sigma) for c in range(3)], -1))
    return g / np.maximum(g @ LUMA, 1e-4)[..., None]


def the_map(width, size):
    src = np.asarray(Image.open(P.PUBLIC / 'full/wrap-color.jpg').convert('RGB'))
    h, w = src.shape[:2]
    gx, gy = M.grid((0, 0), width, size)
    d = M.dirs(gx, gy)
    u = (np.arctan2(d[..., 0], d[..., 2]) / (2 * math.pi) + 0.5) * w - 0.5
    v = (0.5 - np.arcsin(np.clip(d[..., 1], -1, 1)) / math.pi) * h - 0.5
    return P.unfilmic(M.linear(cv2.remap(src, u.astype(np.float32), v.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP))).astype(np.float32)


RANKS = np.concatenate([[0, 0.1, 0.5], np.linspace(1, 99, 99), [99.5, 99.9, 100]])


def curves(a, o, width, size, spec):
    px = lambda deg: math.radians(deg) / (2 * M.half(width)) * size
    f, e = spec['floor'], spec['restyle']['bands']
    gx, gy = M.grid((0, 0), width, size)
    r = np.hypot(gx, gy)
    disc = (r < math.tan(math.radians(spec['disc'][1])))[::2, ::2]
    ring = ((r > math.tan(math.radians(spec['restyle']['ring'][0]))) & (r < math.tan(math.radians(spec['restyle']['ring'][1]))))[::2, ::2]
    la, lo = np.log(np.maximum(a @ LUMA, 0) + f), np.log(np.maximum(o @ LUMA, 0) + f)
    sa, so = [soft(la, px(d))[::2, ::2] for d in e], [soft(lo, px(d))[::2, ::2] for d in e]
    bands = []
    for k in range(len(e) - 1):
        band = {'deg': [e[k], e[k + 1]], 'from': np.percentile((so[k] - so[k + 1])[disc], RANKS).round(4).tolist(), 'to': np.percentile((sa[k] - sa[k + 1])[ring], RANKS).round(4).tolist()}
        cap = (spec['restyle'].get('caps') or [None] * len(e))[k]
        if cap:
            band['cap'] = np.percentile((sa[k] - sa[k + 1])[ring], cap).round(4).tolist()
            assert band['cap'][0] < 0 < band['cap'][1], band['cap']
        bands.append(band)
    near = spec['restyle'].get('near')
    if near:
        at = [math.tan(math.radians(v)) for v in near['at']]
        spot = (np.hypot(gx - at[0], gy - at[1]) < math.tan(math.radians(near['deg'][1])))[::2, ::2]
        for k, band in enumerate(bands):
            band['near'] = {'from': np.percentile((so[k] - so[k + 1])[spot], RANKS).round(4).tolist(), 'to': np.percentile((sa[k] - sa[k + 1])[spot], RANKS).round(4).tolist()}
    d = (sa[0] - sa[-1])[ring]
    tint = (geo(a, px(e[0]), f) / np.maximum(geo(a, px(e[-1]), f), 1e-4))[::2, ::2][ring]
    edges = np.percentile(d, np.linspace(0, 100, 33))
    idx = np.clip(np.digitize(d, edges) - 1, 0, 31)
    rgb = np.stack([np.bincount(idx, tint[:, c], 32) / np.maximum(np.bincount(idx, minlength=32), 1) for c in range(3)], 1)
    return {'ranks': RANKS.tolist(), 'bands': bands, 'colour': {'at': (0.5 * (edges[1:] + edges[:-1])).round(4).tolist(), 'rgb': rgb.round(4).tolist()}}


def restyled(x, band):
    y = np.interp(x, band['from'], band['to']).astype(np.float32)
    if 'cap' in band:
        low, high = band['cap']
        y = np.where(y > 0, high * np.tanh(y / high), low * np.tanh(y / low)).astype(np.float32)
    return y


def field(a, o, width, size, spec, first, curve=None, lit=False):
    px = lambda deg: math.radians(deg) / (2 * M.half(width)) * size
    f = spec['floor']
    gx, gy = M.grid((0, 0), width, size)
    r = np.hypot(gx, gy)
    w = P.step(math.tan(math.radians(spec['disc'][0])), math.tan(math.radians(spec['disc'][1])), r)
    la, lo = np.log(np.maximum(a @ LUMA, 0) + f), np.log(np.maximum(o @ LUMA, 0) + f)
    low_o = lo if first else soft(lo, px(spec['fineDeg']))
    base = soft(la, px(spec['fineDeg'])) if spec.get('swap') and not first else la
    hue = lambda x, s: soft(x, s) / np.maximum(soft(x @ LUMA, s), 1e-4)[..., None]
    hue_a = hue(a, px(spec['toneDeg']))
    if curve:
        e = spec['restyle']['bands']
        so = [soft(lo, px(d)) for d in e]
        rim = sum(restyled(so[k] - so[k + 1], curve['bands'][k]) for k in range(len(e) - 1))
        near = spec['restyle'].get('near')
        if near:
            at = [math.tan(math.radians(v)) for v in near['at']]
            m = 1 - P.step(math.tan(math.radians(near['deg'][0])), math.tan(math.radians(near['deg'][1])), np.hypot(gx - at[0], gy - at[1]))
            rim = rim * (1 - m) + m * sum(restyled(so[k] - so[k + 1], curve['bands'][k]['near']) for k in range(len(e) - 1))
        ln = w * (base + lo - low_o) + (1 - w) * (soft(la, px(e[-1])) + rim + lo - so[0])
        del so
        inside = geo(a, px(e[-1]), f) * np.stack([np.interp(rim, curve['colour']['at'], np.float32(curve['colour']['rgb'])[:, c]) for c in range(3)], -1).astype(np.float32)
        inside /= np.maximum(inside @ LUMA, 1e-4)[..., None]
    else:
        tone_a, tone_o = soft(la, px(spec['toneDeg'])), soft(lo, px(spec['toneDeg']))
        ln = tone_a + w * (base - tone_a) + (1 - w) * (low_o - tone_o) + (lo - low_o)
        hue_o = hue(o, px(spec['toneDeg']))
        own_hue = np.clip((o / np.maximum(o @ LUMA, 1e-4)[..., None]) / np.maximum(hue_o, 1e-4), 1 / spec['hue'], spec['hue'])
        inside = hue_a * own_hue
    lum = np.maximum(np.exp(ln) - f, 0)
    outside = a / np.maximum(a @ LUMA, 1e-4)[..., None]
    if spec.get('plain') and not first:
        far = P.step(math.tan(math.radians(spec['keepDeg'][0])), math.tan(math.radians(spec['keepDeg'][1])), r)[..., None]
        outside = hue_a * (1 - far) + outside * far
    out = lum[..., None] * (w[..., None] * outside + (1 - w[..., None]) * inside)
    light = None
    if lit:
        s = px(spec.get('lightDeg', spec['toneDeg']))
        light = np.exp(soft(lo, s) - soft(la, s))[..., None] * hue(o, s) / np.maximum(hue(a, s), 1e-4)
        if curve:
            own = np.clip(soft(o, px(e[0])) / np.maximum(soft(out, px(e[0])), 1e-4), 1 / 16, spec['light']['most'])
            light = w[..., None] * light + (1 - w[..., None]) * own
    return out, light, w


def coded(x):
    y = P.filmic(x)
    return (M.srgb(np.where(y >= 0.9849, 1, y)) * 255).astype(np.float32) @ LUMA


def as_map(a1, wide, size, spec):
    import importlib.util
    module = importlib.util.spec_from_file_location('levels', M.ROOT / 'assets-src/shared/globe-levels.py')
    levels = importlib.util.module_from_spec(module)
    module.loader.exec_module(levels)
    config = json.loads((M.ROOT / 'config/showcase.json').read_text())['smooth']['pictures']
    scale, wide_px = float(config.get('flowScale', 0.25)), float(config.get('patternPx', 40)) * float(config.get('flowScale', 0.25))
    m = the_map(wide, size)
    n = max(int(round(2 * M.half(wide) / (2 * math.pi / Image.open(P.PUBLIC / 'full/wrap-color.jpg').size[0]) * 0.8 * scale)), 32)
    small = lambda x: cv2.resize(coded(x), (n, n), interpolation=cv2.INTER_AREA)
    p = levels.judge.pattern(small(m), small(a1), np.ones((n, n), bool), wide_px / 5, wide_px, float(config.get('patternFloor', 1)))
    other = P.step(spec['map'][0], spec['map'][1], cv2.resize(np.nan_to_num(p).astype(np.float32), (size, size), interpolation=cv2.INTER_CUBIC))[..., None]
    print('the first level against the map as the reader takes it: 99th percentile %.2f; share of the level that takes the map\'s own ground %.4f' % (float(np.nanpercentile(p, 99)), float(other.mean())), flush=True)
    return a1 * (1 - other) + m * other


def make(take, spec, only=None):
    size = P.SPEC['size']
    a1 = ground(SRC / spec['parent']['file'])
    wide = spec['parent']['widthDeg']
    if spec.get('map'):
        a1 = as_map(a1, wide, size, spec)
    two = spec['plates'][0]
    o2 = ground(SRC / two['file'])
    n = int(round(size * M.half(two['widthDeg']) / M.half(wide)))
    small = cv2.resize(o2, (n, n), interpolation=cv2.INTER_AREA)
    gx, gy = M.grid((0, 0), wide, size)
    k = n / (2 * M.half(two['widthDeg']))
    under = cv2.remap(small, (gx * k + n / 2 - 0.5).astype(np.float32), (n / 2 - gy * k - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    covered = (np.maximum(np.abs(gx), np.abs(gy)) < M.half(two['widthDeg']) * 0.98)[..., None]
    curve = None
    if spec.get('restyle'):
        curve = curves(np.maximum(into(a1, wide, two['widthDeg'], size), 0), o2, two['widthDeg'], size, spec)
        (OUT / take).mkdir(parents=True, exist_ok=True)
        (OUT / take / 'restyle.json').write_text(json.dumps(curve))
        for b in curve['bands']:
            print(take, 'band', b['deg'], 'the place 1, 50, 99 percent', [b['from'][i] for i in (3, 52, 101)], 'the hero', [b['to'][i] for i in (3, 52, 101)], flush=True)
    first, _, w = field(a1, np.where(covered, np.maximum(under, 0), a1), wide, size, spec, True, curve)
    first = np.where(w[..., None] >= 1, a1, first)
    if not only:
        P.write(first, spec['parent']['file'], OUT / take)
    print(take, spec['parent']['file'], 'share of the level that changes', round(float((w < 1).mean()), 5), flush=True)
    for plate in spec['plates']:
        if only and plate['file'] != only and not (only == spec['light']['file'] and plate is two):
            continue
        o = ground(SRC / plate['file'])
        a = np.maximum(into(a1, wide, plate['widthDeg'], size), 0)
        lit = plate is two and only in (None, spec['light']['file'])
        out, light, w = field(a, o, plate['widthDeg'], size, spec, False, curve, lit)
        if only != spec['light']['file']:
            P.write(out, plate['file'], OUT / take)
            print(take, plate['file'], 'F over O in brightness, 1, 50, 99 percentile', np.round(np.percentile(((out @ LUMA + 1e-3) / (o @ LUMA + 1e-3))[::4, ::4], [1, 50, 99]), 3), flush=True)
        if lit:
            m = spec['light']['size']
            coded = (M.srgb(P.filmic(np.minimum(cv2.resize(light, (m, m), interpolation=cv2.INTER_AREA), spec['light']['most']))) * 255 + 0.5).astype(np.uint8)
            for key in ('full', 'web'):
                Image.fromarray(coded).save(OUT / take / key / spec['light']['file'], optimize=True)
            print(take, spec['light']['file'], 'light 1, 50, 99 percentile', np.round(np.percentile(light[::4, ::4], [1, 50, 99]), 3), (OUT / take / 'full' / spec['light']['file']).stat().st_size, flush=True)


def law(spec, steps=16):
    two = spec['plates'][0]
    size = P.SPEC['size'] // 2
    gx, gy = M.grid((0, 0), two['widthDeg'], size)
    m = np.maximum(the_map(two['widthDeg'], size), 0)[np.hypot(gx, gy) < math.tan(math.radians(spec['disc'][1]))]
    lm = np.log(m @ LUMA + spec['floor'])
    first, last = np.percentile(lm, spec['law'])
    idx = np.rint((lm - first) / (last - first) * (steps - 1)).astype(int)
    keep = (idx >= 0) & (idx < steps)
    rgb = np.stack([np.bincount(idx[keep], m[keep][:, c], steps) for c in range(3)], 1)
    path = M.ROOT / 'src/stops/mercury/hue.json'
    about = json.loads(path.read_text())['about'] if path.exists() else ''
    path.write_text(json.dumps({'about': about, 'floor': spec['floor'], 'at': [round(float(first), 4), round(float(last), 4)], 'rgb': (rgb / (rgb @ LUMA)[:, None]).round(4).tolist()}, indent=1) + '\n')
    print('hue.json', steps, 'knots from', round(float(first), 3), 'to', round(float(last), 3), 'px', int(keep.sum()), 'fewest in a step', int(np.bincount(idx[keep], minlength=steps).min()))


def install(take):
    for key in ('full', 'web'):
        for f in sorted((OUT / take / key).iterdir()):
            (P.PUBLIC / key / f.name).write_bytes(f.read_bytes())
            print('installed', key, f.name, f.stat().st_size)


if __name__ == '__main__':
    take = sys.argv[2] if len(sys.argv) > 2 else SPEC['take']
    spec = {**SPEC, 'disc': json.loads((M.ROOT / 'src/stops/mercury/own.json').read_text())['hold'], **SPEC['takes'][take]}
    if sys.argv[1] == 'make':
        make(take, spec, sys.argv[3] if len(sys.argv) > 3 else None)
    elif sys.argv[1] == 'install':
        install(take)
    elif sys.argv[1] == 'law':
        law(spec)
