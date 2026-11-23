import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import mosaic as M
import plates as P
import repaint as RP

B = RP.SPEC['band']
SIZE = RP.SIZE
LUMA = RP.LUMA
WIDE = min(RP.WIDTH)
TEXEL = 2 * M.half(RP.WIDTH[max(RP.WIDTH)]) / SIZE
DEG = np.radians(1) / TEXEL
N = 2 * int(round(M.half(B['canvasDeg']) / TEXEL))
WORK = RP.WORK


def inside(x, y):
    r = (x ** 4 + y ** 4) ** 0.25
    return 1 - P.step(B['reachDeg'][0], B['reachDeg'][1], r)


def tangent(level):
    c = np.degrees(((np.arange(SIZE, dtype=np.float32) + 0.5) / SIZE - 0.5) * 2 * M.half(RP.WIDTH[level]))
    return c[None, :], c[:, None]


def here(level):
    return inside(*tangent(level))


def faded(level):
    x, y = tangent(level)
    return 1 - P.step(B['fadeDeg'][0], B['fadeDeg'][1], (x ** 4 + y ** 4) ** 0.25)


def per_deg(level):
    return np.radians(1) / (2 * M.half(RP.WIDTH[level]) / SIZE)


def scale(level):
    return 2 * M.half(RP.WIDTH[level]) / SIZE / TEXEL


def across(field, src, dst):
    if src == dst:
        return field
    k = M.half(RP.WIDTH[dst]) / M.half(RP.WIDTH[src])
    x = ((np.arange(SIZE, dtype=np.float32) + 0.5) / SIZE - 0.5) * k * SIZE + SIZE / 2 - 0.5
    xx, yy = np.meshgrid(x, x)
    return cv2.remap(field, xx, yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def away(level):
    place = RP.laid(level)[1]
    return cv2.distanceTransform((place < 0.5).astype(np.uint8), cv2.DIST_L2, 5) / per_deg(level), place


def wide(a, sigma):
    if sigma < 12:
        return RP.blur(a, sigma)
    f = 2 ** int(np.floor(np.log2(sigma / 6)))
    n = (a.shape[1] // f, a.shape[0] // f)
    return cv2.resize(RP.blur(cv2.resize(a, n, interpolation=cv2.INTER_AREA), sigma / f), (a.shape[1], a.shape[0]), interpolation=cv2.INTER_CUBIC)


def lows():
    n = B['baseLevel']
    x = np.load(WORK / ('L%d.npy' % n)).astype(np.float32)
    place = RP.laid(n)[1]
    w = (place > 0.5).astype(np.float32)
    s = B['detailDeg'] * per_deg(n)
    near = wide(w, s)
    low = wide(RP.ln(x) * w[..., None], s) / np.maximum(near, 1e-4)[..., None]
    small = 512
    f = RP.spread(cv2.resize(low, (small, small), interpolation=cv2.INTER_AREA), cv2.resize(w * (near > 0.6), (small, small), interpolation=cv2.INTER_AREA))
    return n, wide(cv2.resize(f, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC), B['baseSoftDeg'] * per_deg(n))


def dusk(level):
    import json
    sun = np.array(json.loads((M.WORK / 'tiles/cameras.json').read_text())['dive']['sun'])
    gx, gy = M.grid((0, 0), RP.WIDTH[level], 256)
    ndl = cv2.resize((M.dirs(gx, gy) @ sun).astype(np.float32), (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)
    return np.log(np.clip(P.step(B['dusk'][0], B['dusk'][1], ndl), B['duskFloor'], 1))


def fill(lx, dq, n):
    lum = np.log(np.maximum(np.exp(lx) @ LUMA, 2e-3))
    window = B['fillWindowDeg'] * per_deg(n)
    add = np.zeros_like(lum)
    gx, gq = lum, dq
    for deg in B['fillDeg']:
        s = deg * per_deg(n)
        if s < 0.35:
            continue
        hx, hq = wide(lum, s), wide(dq, s)
        bx, bq = gx - hx, gq - hq
        gx, gq = hx, hq
        share = wide(bx * bx, window) / np.maximum(wide(bq * bq, window), 1e-6)
        add += np.sqrt(np.clip(1 - share, 0, 1)) * bq
    return add


def craters(level):
    return np.load(WORK / ('crater-%d.npy' % level)).astype(np.float32)


def body():
    lx = RP.ln(np.load(WORK / ('L%d.npy' % WIDE)).astype(np.float32))
    low = wide(lx, B['baseLowDeg'] * per_deg(WIDE))
    mid = wide(lx, B['midDeg'] * per_deg(WIDE)) - low
    up, down = B['midCap']
    return low + np.where(mid > 0, up * np.tanh(mid / up), down * np.tanh(mid / down)), lx


def lay(levels):
    far = away(WIDE)[0]
    base_level, base = lows()
    wide_body, wide_lx = body()
    for n in levels:
        lx = wide_lx if n == WIDE else RP.ln(np.load(WORK / ('L%d.npy' % n)).astype(np.float32))
        laid = RP.laid(n)
        place = laid[1][..., None]
        u = P.step(0, B['fullDeg'], across(far, WIDE, n))[..., None]
        on = here(n)
        dq = craters(n) * faded(n)
        print('level', n, 'log of the mean shade of the crater field where it is whole', round(float(np.log(np.exp(dq[(on > 0.99) & (laid[1] < 0.01)]).mean())), 4), flush=True)
        mixed = (1 - u) * across(base, base_level, n) + u * across(wide_body, WIDE, n) + (dq + B['lift'] * on + dusk(n))[..., None]
        if n == WIDE:
            mixed += (1 - on)[..., None] * (lx - wide(lx, B['midDeg'] * per_deg(n)))
        soft = np.clip(laid[1] - laid[2], 0, 1)[..., None]
        out = np.exp(place * (lx + soft * fill(lx, dq, n)[..., None]) + (1 - place) * mixed)
        np.save(WORK / ('B%d.npy' % n), out.astype(np.float16))
        Image.fromarray(RP.shown(out)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('B%d-view.jpg' % n), quality=90)
        print('band laid on level', n, flush=True)


def rise(levels):
    for n in levels:
        under = np.load(WORK / ('B%d.npy' % n)).astype(np.float32)
        rgb, place, sharp, sigma = RP.laid(n, 'rise')
        tone = RP.match(rgb, place, under, n)
        lx = RP.ln(rgb)
        soft = np.clip(place - sharp, 0, 1)[..., None]
        place = place[..., None]
        out = np.exp(place * (lx + soft * fill(lx, craters(n), n)[..., None]) + (1 - place) * (RP.ln(under) + tone))
        np.save(WORK / ('B%dr.npy' % n), out.astype(np.float16))
        Image.fromarray(RP.shown(out)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('B%dr-view.jpg' % n), quality=90)
        print('rise laid over level', n, 'tone at the edge 10 50 90 percentile', np.round(np.percentile(tone[::8, ::8][np.abs(tone[::8, ::8]).sum(-1) > 1e-4], [10, 50, 90]), 3), flush=True)


if __name__ == '__main__':
    if sys.argv[1] == 'rise':
        rise([int(v) for v in sys.argv[2:]] or P.SPEC['sets']['rise']['levels'])
    else:
        lay([int(v) for v in sys.argv[2:]] or sorted(RP.WIDTH))
