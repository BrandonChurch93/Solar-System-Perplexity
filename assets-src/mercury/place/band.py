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
FINE = max(RP.WIDTH)
WIDE = min(RP.WIDTH)
TEXEL = 2 * M.half(RP.WIDTH[FINE]) / SIZE
DEG = np.radians(1) / TEXEL
N = 2 * int(round(M.half(B['canvasDeg']) / TEXEL))
WORK = RP.WORK


def per_deg(level):
    return np.radians(1) / (2 * M.half(RP.WIDTH[level]) / SIZE)


def scale(level):
    return 2 * M.half(RP.WIDTH[level]) / SIZE / TEXEL


def to_level(field, origin, level):
    s = scale(level)
    f = field if s < 1.01 else cv2.GaussianBlur(field, (0, 0), 0.4 * s)
    i = np.arange(SIZE, dtype=np.float32)
    c = (i + 0.5 - SIZE / 2) * s + N / 2 - 0.5
    xx, yy = np.meshgrid(c - origin[0], c - origin[1])
    return cv2.remap(f, xx.astype(np.float32), yy.astype(np.float32), cv2.INTER_NEAREST if s < 1.01 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def from_level(field, level, box):
    s = scale(level)
    x = (np.arange(box[0], box[2], dtype=np.float32) + 0.5 - N / 2) / s + SIZE / 2 - 0.5
    y = (np.arange(box[1], box[3], dtype=np.float32) + 0.5 - N / 2) / s + SIZE / 2 - 0.5
    xx, yy = np.meshgrid(x, y)
    return cv2.remap(field, xx, yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


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


def exemplar():
    rgb, place, sharp, sigma = RP.laid(FINE)
    w = (sharp > 0.99).astype(np.float32)
    e = np.log(np.maximum(rgb @ LUMA, 2e-3))
    s = B['detailDeg'] * DEG
    d = (e - RP.blur(e * w, s) / np.maximum(RP.blur(w, s), 1e-3)) * w
    dark = RP.blur(d, B['darkBlurDeg'] * DEG) < B['darkLimit']
    return d.astype(np.float32), w > 0, dark


def seam(cost):
    acc = cost.copy()
    for r in range(1, acc.shape[0]):
        a = acc[r - 1]
        acc[r] += np.minimum(a, np.minimum(np.concatenate(([np.inf], a[:-1])), np.concatenate((a[1:], [np.inf]))))
    path = np.zeros(acc.shape[0], np.int32)
    path[-1] = int(np.argmin(acc[-1]))
    for r in range(acc.shape[0] - 2, -1, -1):
        c = path[r + 1]
        lo, hi = max(c - 1, 0), min(c + 2, acc.shape[1])
        path[r] = lo + int(np.argmin(acc[r, lo:hi]))
    return path


def quilt():
    rng = np.random.default_rng(B['seed'])
    patch = int(round(B['patchDeg'] * DEG / 4)) * 4
    lap = int(round(B['overlapDeg'] * DEG))
    step = patch - lap
    far, place = away(WIDE)
    reach = B['reachDeg'][1] + B['patchDeg']
    ys, xs = np.nonzero((far < reach) & (place < 0.5))
    s = scale(WIDE)
    cx = lambda i: (i + 0.5 - SIZE / 2) * s + N / 2 - 0.5
    box = [int(max(cx(xs.min()) - patch, 0)), int(max(cx(ys.min()) - patch, 0)), int(min(cx(xs.max()) + patch, N)), int(min(cx(ys.max()) + patch, N))]
    box[2] = box[0] + ((box[2] - box[0] - lap) // step) * step + lap
    box[3] = box[1] + ((box[3] - box[1] - lap) // step) * step + lap
    dist = from_level(far, WIDE, box)
    inside = from_level(RP.laid(WIDE)[2], WIDE, box)
    grown = cv2.dilate((inside < 0.9).astype(np.uint8), np.ones((2 * B['inPx'] + 1, 2 * B['inPx'] + 1), np.uint8)) > 0
    need = grown & (dist < reach)
    h, w = need.shape
    out = np.zeros((h, w), np.float32)
    known = np.zeros((h, w), bool)
    fixed = np.zeros((h, w), bool)
    d, ok, dark = exemplar()
    o = (N - SIZE) // 2
    x0, y0 = max(o - box[0], 0), max(o - box[1], 0)
    x1, y1 = min(o + SIZE - box[0], w), min(o + SIZE - box[1], h)
    sx, sy = x0 + box[0] - o, y0 + box[1] - o
    here = ok[sy:sy + y1 - y0, sx:sx + x1 - x0] & ~need[y0:y1, x0:x1]
    out[y0:y1, x0:x1][here] = d[sy:sy + y1 - y0, sx:sx + x1 - x0][here]
    known[y0:y1, x0:x1] = here
    fixed[y0:y1, x0:x1] = here
    bad = cv2.integral((~ok | dark).astype(np.uint8))
    free = (bad[patch:, patch:] - bad[:-patch, patch:] - bad[patch:, :-patch] + bad[:-patch, :-patch]) == 0
    py, px = np.nonzero(free)
    pick = rng.choice(len(py), size=min(B['candidates'], len(py)), replace=False)
    cand = np.stack([d[py[i]:py[i] + patch, px[i]:px[i] + patch] for i in pick])
    small = cand[:, ::4, ::4]
    print('canvas', N, 'box', box, 'patch', patch, 'overlap', lap, 'free starts', len(py), 'share of the level', round(float(free.mean()), 4), 'candidates', len(cand), flush=True)
    uses = np.zeros(len(cand))
    chosen = {}
    count = 0
    for y in range(0, h - patch + 1, step):
        for x in range(0, w - patch + 1, step):
            win = (slice(y, y + patch), slice(x, x + patch))
            kn = known[win].copy()
            if not (need[win] & ~kn).any():
                continue
            ks = kn[::4, ::4]
            some = rng.choice(len(cand), size=min(B['draw'], len(cand)), replace=False)
            some = np.array([i for i in some if i not in (chosen.get((y, x - step)), chosen.get((y - step, x)))])
            if ks.mean() > 0.02:
                err = (((small[some] - out[win][::4, ::4]) ** 2) * ks).sum(axis=(1, 2)) * (1 + B['reuse'] * uses[some])
                i = int(some[np.argmin(err)])
            else:
                i = int(some[np.argmin(uses[some])])
            uses[i] += 1
            chosen[(y, x)] = i
            new = cand[i]
            cost = np.where(kn, (new - out[win]) ** 2, 0).astype(np.float32)
            take = np.ones((patch, patch), bool)
            if kn[:, :lap].mean() > 0.1:
                take[:, :lap] = np.arange(lap)[None, :] >= seam(cost[:, :lap])[:, None]
            if kn[:lap, :].mean() > 0.1:
                take[:lap, :] &= np.arange(lap)[:, None] >= seam(cost[:lap, :].T)[None, :]
            take |= ~kn
            wt = np.where(take, 1.0, RP.blur(take.astype(np.float32), B['seamSoftPx'])) * need[win] * ~fixed[win]
            out[win] = out[win] * (1 - wt) + new * wt
            known[win] |= wt > 0.5
            count += 1
    np.save(WORK / 'band-detail.npy', out.astype(np.float16))
    np.save(WORK / 'band-box.npy', np.array(box))
    print('patches laid', count, 'filled share of the need', round(float((known & need).sum() / max(need.sum(), 1)), 4), flush=True)
    v = np.clip(np.exp(out) * 0.35, 0, 1)
    Image.fromarray((v * 255).astype(np.uint8)).resize((w // 4, h // 4), Image.LANCZOS).save(WORK / 'band-detail-view.jpg', quality=90)


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


def lay(levels):
    detail = np.load(WORK / 'band-detail.npy').astype(np.float32)
    box = np.load(WORK / 'band-box.npy')
    far = away(WIDE)[0]
    base_level, base = lows()
    for n in levels:
        x = np.load(WORK / ('L%d.npy' % n)).astype(np.float32)
        laid = RP.laid(n)
        place = laid[1][..., None]
        d = across(far, WIDE, n)
        a = ((1 - (1 - B['farShare']) * P.step(B['fullDeg'], B['fadeDeg'], d)) * (1 - P.step(B['reachDeg'][0], B['reachDeg'][1], d)))[..., None]
        k = (B['calm'] + (1 - B['calm']) * P.step(B['calmDeg'][0], B['calmDeg'][1], d))[..., None]
        lx = RP.ln(x)
        low = wide(lx, B['calmLowDeg'] * per_deg(n))
        calm = low + k * (lx - low)
        u = P.step(0, B['fullDeg'], d)[..., None]
        ground = (1 - u) * across(base, base_level, n) + u * wide(lx, B['baseLowDeg'] * per_deg(n))
        dq = to_level(detail, (box[0], box[1]), n)[..., None]
        mixed = (1 - a) * calm + a * (ground + dq) + dusk(n)[..., None]
        soft = np.clip(laid[1] - laid[2], 0, 1)[..., None]
        out = np.exp(place * (lx + soft * fill(lx, dq[..., 0], n)[..., None]) + (1 - place) * mixed)
        np.save(WORK / ('B%d.npy' % n), out.astype(np.float16))
        Image.fromarray(RP.shown(out)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('B%d-view.jpg' % n), quality=90)
        print('band laid on level', n, flush=True)


def rise(levels):
    detail = np.load(WORK / 'band-detail.npy').astype(np.float32)
    box = np.load(WORK / 'band-box.npy')
    for n in levels:
        under = np.load(WORK / ('B%d.npy' % n)).astype(np.float32)
        rgb, place, sharp, sigma = RP.laid(n, 'rise')
        tone = RP.match(rgb, place, under, n)
        lx = RP.ln(rgb)
        soft = np.clip(place - sharp, 0, 1)[..., None]
        place = place[..., None]
        out = np.exp(place * (lx + soft * fill(lx, to_level(detail, (box[0], box[1]), n), n)[..., None]) + (1 - place) * (RP.ln(under) + tone))
        np.save(WORK / ('B%dr.npy' % n), out.astype(np.float16))
        Image.fromarray(RP.shown(out)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('B%dr-view.jpg' % n), quality=90)
        print('rise laid over level', n, 'tone at the edge 10 50 90 percentile', np.round(np.percentile(tone[::8, ::8][np.abs(tone[::8, ::8]).sum(-1) > 1e-4], [10, 50, 90]), 3), flush=True)


if __name__ == '__main__':
    if sys.argv[1] == 'quilt':
        quilt()
    elif sys.argv[1] == 'rise':
        rise([int(v) for v in sys.argv[2:]] or P.SPEC['sets']['rise']['levels'])
    else:
        lay([int(v) for v in sys.argv[2:]] or sorted(RP.WIDTH))
