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
    m = B.get('baseLinear', 0)
    if m > 0:
        low = (1 - m) * low + m * RP.ln(wide(x * w[..., None], s) / np.maximum(near, 1e-4)[..., None])
    small = 512
    f = RP.spread(cv2.resize(low, (small, small), interpolation=cv2.INTER_AREA), cv2.resize(w * (near > 0.6), (small, small), interpolation=cv2.INTER_AREA))
    return n, wide(cv2.resize(f, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC), B['baseSoftDeg'] * per_deg(n))


def forms():
    n = B['baseLevel']
    x = np.load(WORK / ('L%d.npy' % n)).astype(np.float32)
    w = (RP.laid(n)[1] > 0.5).astype(np.float32)
    win = B['matchWindowDeg'] * per_deg(n)
    near = wide(w, win)
    ok = cv2.resize(w * (near > 0.6), (512, 512), interpolation=cv2.INTER_AREA)
    g = np.log(np.maximum(x @ LUMA, 2e-3))
    out = []
    for deg in B['matchDeg']:
        h = wide(g, deg * per_deg(n))
        b = g - h
        g = h
        rms = np.sqrt(np.maximum(wide(b * b * w, win), 0) / np.maximum(near, 1e-4))
        small = cv2.resize(rms, (512, 512), interpolation=cv2.INTER_AREA)
        out.append(RP.spread(np.dstack([small, small, small]), ok)[..., 0])
    return n, out


def matched(dq, n, u, src, rms, free):
    g = dq
    out = np.zeros_like(dq)
    lo, hi = B['matchGain']
    said = []
    for k, (deg, f) in enumerate(zip(B['matchDeg'], rms)):
        s = deg * per_deg(n)
        if s < 0.7:
            continue
        h = wide(g, s)
        b = g - h
        g = h
        if k == 0:
            out += b
            continue
        q = float(np.sqrt((b[free] ** 2).mean()))
        p = across(cv2.resize(f, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC), src, n)
        gain = np.clip(p / max(q, 1e-4), lo, hi)
        said.append((deg, round(q, 3), round(float(gain[u < 0.2].mean()), 2)))
        out += b * (1 + (1 - u) * (gain - 1))
    out += g
    print('level', n, 'forms matched (deg, deviation of the field, mean gain near the place)', said, flush=True)
    return out - (1 - u) * np.log(np.maximum(wide(np.exp(out), B['matchWindowDeg'] * per_deg(n)), 1e-3))


def to_edge(level):
    px = P.SPEC['mask']['borderPx']
    f = WORK / ('ground-%d-e%d.npy' % (level, px))
    if not f.exists():
        out = np.zeros((SIZE, SIZE), np.float16)
        for y in range(0, SIZE, 512):
            gx, gy = M.grid((0, 0), RP.WIDTH[level], SIZE, (0, y, SIZE, y + 512))
            out[y:y + 512] = M.valid(M.dirs(gx, gy), px)
        np.save(f, out)
    return np.load(f).astype(np.float32)


def membrane(diff, known):
    S = B['spill']
    d, w = [diff * known[..., None]], [known]
    while min(w[-1].shape) > S['coarsestPx']:
        d.append(cv2.pyrDown(d[-1]))
        w.append(cv2.pyrDown(w[-1]))
    v = d[-1] / np.maximum(w[-1], 1e-6)[..., None]
    for k in range(len(w) - 2, -1, -1):
        up = cv2.pyrUp(v, dstsize=(w[k].shape[1], w[k].shape[0]))
        c = np.clip(w[k] * S['hold'], 0, 1)[..., None]
        v = c * d[k] / np.maximum(w[k], 1e-6)[..., None] + (1 - c) * up
    return v


def field(level, kind):
    R = RP.R
    lay = np.load(P.OUT / kind / ('lay-%d.npy' % level)).astype(np.float32)
    f = to_edge(level) > R['seen']
    own = R.get('layWeight', {}).get(kind)
    if own:
        f &= P.step(own[0], own[1], lay[..., 3]) > 0.5
    return f, lay


def outward(f, level):
    out = cv2.distanceTransform((~f).astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
    depth = cv2.distanceTransform(f.astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
    smooth = RP.blur(out - depth, max(B['spill']['normalDeg'] * per_deg(level), 1.5))
    gx, gy = cv2.Sobel(smooth, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(smooth, cv2.CV_32F, 0, 1, ksize=3)
    norm = np.maximum(np.hypot(gx, gy), 1e-6)
    return out, depth, gx / norm, gy / norm


def kept(level, kind):
    import json
    import math
    S = B['spill']
    cam = json.loads((M.WORK / 'tiles/cameras.json').read_text())[kind]
    a = math.radians(cam['tiles'][1]['pitchDeg'])
    turn = np.array([[1, 0, 0], [0, math.cos(a), -math.sin(a)], [0, math.sin(a), math.cos(a)]])
    rt = np.array(cam['tiles'][1]['matrix']) @ turn.T
    pos = np.array(cam['position'])
    w, h = S['frame']['size']
    focal = h / 2 / math.tan(math.radians(S['frame']['vfovDeg']) / 2)
    left, right, bottom, top = S['keepPx'][kind]
    out = np.zeros((SIZE, SIZE), bool)
    for y in range(0, SIZE, 512):
        gx, gy = M.grid((0, 0), RP.WIDTH[level], SIZE, (0, y, SIZE, y + 512))
        c = (M.dirs(gx, gy) - pos) @ rt
        z = np.minimum(c[..., 2], -1e-6)
        fx, fy = w / 2 - focal * c[..., 0] / z, h / 2 + focal * c[..., 1] / z
        out[y:y + 512] = (c[..., 2] < 0) & (fx > -left) & (fx < w + right) & (fy > -top) & (fy < h + bottom)
    return out


def seam(f, free, keep, cost):
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import breadth_first_order, maximum_flow
    S = B['spill']['seam']
    q = S['step']
    small = lambda m: cv2.resize(m.astype(np.uint8), (SIZE // q, SIZE // q), interpolation=cv2.INTER_NEAREST) > 0
    cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    grown = lambda m: cv2.dilate(m.astype(np.uint8), cross) > 0
    zone = small(free & f & ~keep)
    start, end = zone & grown(small(~f)), zone & grown(small(keep & f))
    zone &= ~(start & end)
    start &= zone
    end &= zone
    c = cv2.resize(RP.blur(cost, S['softPx']), (SIZE // q, SIZE // q), interpolation=cv2.INTER_AREA)
    ids = np.full(zone.shape, -1, np.int64)
    n = int(zone.sum())
    ids[zone] = np.arange(n)
    rows, cols, caps = [], [], []
    for a, b, ca, cb in ((ids[:, :-1], ids[:, 1:], c[:, :-1], c[:, 1:]), (ids[:-1], ids[1:], c[:-1], c[1:])):
        m = (a >= 0) & (b >= 0)
        cap = (S['length'] + S['scale'] * (ca[m] + cb[m])).astype(np.int32)
        rows += [a[m], b[m]]
        cols += [b[m], a[m]]
        caps += [cap, cap]
    big = np.int32(1 << 24)
    rows += [np.full(int(start.sum()), n), ids[end]]
    cols += [ids[start], np.full(int(end.sum()), n + 1)]
    caps += [np.full(int(start.sum()), big), np.full(int(end.sum()), big)]
    graph = coo_matrix((np.concatenate(caps).astype(np.int32), (np.concatenate(rows), np.concatenate(cols))), shape=(n + 2, n + 2)).tocsr()
    flow = maximum_flow(graph, n, n + 1)
    left = (graph - flow.flow).tocsr()
    left.data = np.maximum(left.data, 0)
    left.eliminate_zeros()
    reached = np.zeros(n + 2, bool)
    reached[breadth_first_order(left, n, directed=True, return_predecessors=False)] = True
    side = np.zeros(zone.shape, np.uint8)
    side[zone] = reached[:n]
    print('seam: nodes', n, 'cut', int(flow.flow_value), 'share of the free ground given to the copy', round(float(side.sum()) / max(n, 1), 3), flush=True)
    return (cv2.resize(side, (SIZE, SIZE), interpolation=cv2.INTER_NEAREST) > 0) & free & f & ~keep


SIDES = {}


def sides(kind):
    if kind not in SIDES:
        S = B['spill']
        d, _, gx, gy = outward(field(max(RP.WIDTH), kind)[0], max(RP.WIDTH))
        near = (d > 3) & (d < 12)
        count = np.bincount(((np.degrees(np.arctan2(gy[near], gx[near])) + 360) % 360 * 2).astype(np.int32) % 720, minlength=720).astype(np.float32)
        k = np.exp(-0.5 * (np.arange(-12, 13) / S['sideBinSoft']) ** 2)
        soft = np.convolve(np.concatenate([count[-12:], count, count[:12]]), k / k.sum(), mode='valid')
        peaks = [i for i in range(720) if soft[i] >= soft[i - 1] and soft[i] > soft[(i + 1) % 720] and soft[i] > S['sideShare'] * soft.sum()]
        SIDES[kind] = [np.radians(i / 2 + 0.25) for i in peaks]
        print(kind, 'sides of the place field, direction outward in degrees', [round(i / 2 + 0.25, 1) for i in peaks], flush=True)
    return SIDES[kind]


def fanned(fan, inner, source, copy, clean, seen, theta, d, depth, room, pd):
    lack = np.clip(1 - seen, 0, 1)
    need = (lack > 1e-3) & (d <= fan['reachDeg'] * pd) & (depth <= room)
    if not need.any():
        return copy, seen
    ys, xs = np.nonzero(need)
    pad = int(fan['blendPx'] * 4) + 2
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, SIZE), max(xs.min() - pad, 0), min(xs.max() + pad + 1, SIZE)
    box = (slice(y0, y1), slice(x0, x1))
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    turns = np.radians(np.arange(0, 360, fan['stepDeg']))
    moves = [(np.float32(round(fan['shiftDeg'] * pd * np.cos(a))), np.float32(round(fan['shiftDeg'] * pd * np.sin(a)))) for a in turns]
    best = np.zeros(xx.shape, np.float32)
    pick = np.full(xx.shape, -1, np.int16)
    gain = []
    for i, (a, (mx, my)) in enumerate(zip(turns, moves)):
        turn = np.abs((theta[box] - a + np.pi) % (2 * np.pi) - np.pi)
        score = np.exp(-(turn / np.radians(fan['softDeg'])) ** 2).astype(np.float32) * (cv2.remap(source, xx - mx, yy - my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) > 0.999)
        better = score > best
        best[better] = score[better]
        pick[better] = i
        gain.append(float(score[need[box]].sum()))
    lead = int(np.argmax(gain))
    pick[cv2.remap(source, xx - moves[lead][0], yy - moves[lead][1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) > 0.999] = lead
    acc = np.zeros(xx.shape + (3,), np.float32)
    tot = np.zeros(xx.shape, np.float32)
    cover = np.zeros(xx.shape, np.float32)
    for i, (mx, my) in enumerate(moves):
        m = (pick == i) & need[box]
        if not m.any():
            continue
        near = RP.blur(m.astype(np.float32), fan['blendPx'])
        w = near * cv2.remap(source, xx - mx, yy - my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        acc += w[..., None] * cv2.remap(inner, xx - mx, yy - my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        tot += w
        cover += near
    have = lack[box] * P.step(fan['least'][0], fan['least'][1], tot / np.maximum(cover, 1e-6)) * need[box]
    whole = seen[box] + have
    mixed = (clean[box] + have[..., None] * acc / np.maximum(tot, 1e-6)[..., None]) / np.maximum(whole, 1e-6)[..., None]
    copy[box] = np.where((have > 1e-4)[..., None], mixed, copy[box])
    seen[box] = whole
    print('fan: px lacking a source', int(need.sum()), 'filled', int((have > 0.5).sum()), 'lead direction', lead, 'share of the fill', round(float(((pick == lead) & need[box] & (have > 0.5)).sum() / max(int((have > 0.5).sum()), 1)), 3), 'directions used', sorted(set(int(v) for v in np.unique(pick[need[box] & (have > 0.5)]))), flush=True)
    return copy, seen


def spill(inner, level, kind='dive'):
    S = B['spill']
    R = RP.R
    f, lay = field(level, kind)
    pd = per_deg(level)
    far = (1 - P.step(R['elong'][0], R['elong'][1], lay[..., 4])) * (1 - P.step(R['glare'][0], R['glare'][1], RP.blur(lay[..., :3] @ LUMA, R['glareBlurDeg'] * pd)))
    d, depth, nx, ny = outward(f, level)
    own = P.step(S['ownDeg'][0] * pd, S['ownDeg'][1] * pd, depth)[..., None]
    inner = np.where(f[..., None], own * inner + (1 - own) * RP.ln(lay[..., :3]), inner)
    if S.get('farElong'):
        far = far * (1 - P.step(S['farElong'][0], S['farElong'][1], lay[..., 4]))
    source = (f * far * (1 - P.step(S['elong'][0], S['elong'][1], lay[..., 4]))).astype(np.float32)
    join = None
    if S.get('join'):
        J = S['join']
        join = (P.step(J['elong'][0], J['elong'][1], lay[..., 4]) * f).astype(np.float32)
        join = wide(join, J['softDeg'] * pd) / np.maximum(wide(f.astype(np.float32), J['softDeg'] * pd), 1e-3)
    del lay
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    theta = np.arctan2(ny, nx)
    copy, seen, total = np.zeros_like(inner), np.zeros_like(d), np.zeros_like(d)
    fan = S.get('fan', {}).get(kind)
    clean = np.zeros_like(inner) if fan else None
    for a in sides(kind):
        turn = np.abs((theta - a + np.pi) % (2 * np.pi) - np.pi)
        w = np.exp(-(turn / np.radians(S['sideSoftDeg'])) ** 2).astype(np.float32)
        sx, sy = xx - np.float32(round(S['shiftDeg'] * pd * np.cos(a))), yy - np.float32(round(S['shiftDeg'] * pd * np.sin(a)))
        moved = cv2.remap(inner, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        there = cv2.remap(source, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        copy += w[..., None] * moved
        seen += w * there
        total += w
        if fan:
            clean += (w * there)[..., None] * moved
        del moved, there
    total = np.maximum(total, fan['leastSum'] if fan else 1e-6)
    copy /= total[..., None]
    seen /= total
    if fan:
        clean /= total[..., None]
        copy, seen = fanned(fan, inner, source, copy, clean, seen, theta, d, depth, S['seam']['roomDeg'] * pd, pd)
        del clean
    del xx, yy, sx, sy, theta, nx, ny
    top = max(RP.WIDTH)
    cut = WORK / ('seam-%s.npy' % kind)
    if S.get('seam') and level == top:
        g = S['gamma']
        np.save(cut, seam(f, seen * far > 0.99, kept(level, kind) | (depth >= S['seam']['roomDeg'] * pd), np.abs(np.exp(inner / g) - np.exp(copy / g)).sum(-1)))
    if S.get('seam'):
        given = np.load(cut)
        f2 = f & ~(across(given.astype(np.float32), top, level) > 0.5)
        del given
        d2 = cv2.distanceTransform((~f2).astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
        depth = cv2.distanceTransform(f2.astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
    else:
        f2, d2 = f, d
    shell = (((depth > 0) & (depth <= S['shellPx'])) * seen * far).astype(np.float32)
    eye = np.exp(copy / S['gamma'])
    del copy, depth
    gap = (np.exp(inner / S['gamma']) - eye) * (shell > 0)[..., None]
    soft = membrane(gap, shell)
    del shell
    np.tanh(soft / S['cap'], out=soft)
    soft *= S['cap']
    at = np.flatnonzero((~f2 & (d2 <= S['nearPx'][1])).ravel())
    label = cv2.distanceTransformWithLabels((~f2).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)[1].ravel()[at]
    t = (1 - P.step(S['nearPx'][0], S['nearPx'][1], d2.ravel()[at]))[:, None]
    flat = soft.reshape(-1, 3)
    flat[at] = t * gap.reshape(-1, 3)[np.flatnonzero(f2.ravel())[label - 1]] + (1 - t) * flat[at]
    del gap, label, flat
    soft *= ((1 - P.step(S['reachDeg'][0] * pd, S['reachDeg'][1] * pd, d2)) * ~f2)[..., None]
    if join is not None:
        soft *= (1 - join)[..., None]
    eye += soft
    del soft
    copy = S['gamma'] * np.log(np.maximum(eye, S['floor']))
    del eye
    place = RP.blur(f2 * far, S['stepPx'])
    weight = seen * (1 - P.step(S['fadeDeg'][0] * pd, S['fadeDeg'][1] * pd, d)) * ~f2
    if fan:
        place = np.where(f2 & (seen * far > 0.99) & (cv2.distanceTransform(f2.astype(np.uint8), cv2.DIST_L2, 5) <= fan['edgePx']), 1, place).astype(np.float32)
        weight = weight * (1 - P.step(0, 1, 2 * RP.blur(((seen < 0.5) & ~f2).astype(np.float32), fan['featherDeg'] * pd)))
    if join is not None:
        k = join * (1 - P.step(0, S['join']['deg'] * pd, cv2.distanceTransform(f2.astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE))) * f2
        weight = weight + np.clip(k * seen / np.maximum(1 - place * (1 - k), 1e-6), 0, 1) * f2
        place = place * (1 - k)
    return place[..., None], inner, copy, weight[..., None]


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
    form_level, rms = forms() if B.get('matchDeg') else (0, None)
    for n in sorted(levels, reverse=True):
        lx = wide_lx if n == WIDE else RP.ln(np.load(WORK / ('L%d.npy' % n)).astype(np.float32))
        laid = RP.laid(n)
        place = laid[1][..., None]
        u = P.step(0, B['fullDeg'], across(far, WIDE, n))[..., None]
        on = here(n)
        dq = craters(n) * faded(n)
        if rms:
            dq = matched(dq, n, P.step(0, B['matchFadeDeg'], across(far, WIDE, n)), form_level, rms, (on > 0.99) & (laid[1] < 0.01))
        print('level', n, 'log of the mean shade of the crater field where it is whole', round(float(np.log(np.exp(dq[(on > 0.99) & (laid[1] < 0.01)]).mean())), 4), flush=True)
        mixed = (1 - u) * across(base, base_level, n) + u * across(wide_body, WIDE, n) + (dq + B['lift'] * on + dusk(n))[..., None]
        if n == WIDE:
            mixed += (1 - on)[..., None] * (lx - wide(lx, B['midDeg'] * per_deg(n)))
        soft = np.clip(laid[1] - laid[2], 0, 1)[..., None]
        inner = lx + soft * fill(lx, dq, n)[..., None]
        if B.get('spill'):
            place, inner, mirror, over = spill(inner, n)
            mixed = over * mirror + (1 - over) * mixed
        out = np.exp(place * inner + (1 - place) * mixed)
        np.save(WORK / ('B%d.npy' % n), out.astype(np.float16))
        Image.fromarray(RP.shown(out)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('B%d-view.jpg' % n), quality=90)
        print('band laid on level', n, flush=True)


def apron(outer, lx, place, n, kind):
    A = B.get('apron', {}).get(kind)
    if not A:
        return outer
    import json
    pd = per_deg(n)
    f = place > 0.5
    out = cv2.distanceTransform((~f).astype(np.uint8), cv2.DIST_L2, 5) / pd
    said = WORK / ('apron-%s.json' % kind)
    if n == max(RP.WIDTH):
        said.write_text(json.dumps({'floor': float(np.percentile(lx[f] @ LUMA, A['floorPct']))}))
    floor = json.loads(said.read_text())['floor']
    w = (1 - P.step(A['fadeDeg'][0], A['fadeDeg'][1], out)).astype(np.float32)
    del out
    outer = outer + w[..., None] * np.array(A['tone'], np.float32)
    lum = outer @ LUMA
    lifted = floor + A['soft'] * np.logaddexp(0, (lum - floor) / A['soft'])
    outer += (w * (lifted - lum))[..., None]
    print('apron level', n, 'tone step', A['tone'], 'shadow floor', round(floor, 3), 'px lifted by over 0.1', int((w * (lifted - lum) > 0.1).sum()), flush=True)
    return outer.astype(np.float32)


def rise(levels):
    for n in sorted(levels, reverse=True):
        under = np.load(WORK / ('B%d.npy' % n)).astype(np.float32)
        rgb, place, sharp, sigma = RP.laid(n, 'rise')
        tone = RP.match(rgb, place, under, n)
        lx = RP.ln(rgb)
        soft = np.clip(place - sharp, 0, 1)[..., None]
        place = place[..., None]
        inner = lx + soft * fill(lx, craters(n), n)[..., None]
        outer = apron(RP.ln(under) + tone, lx, place[..., 0], n, 'rise')
        if B.get('spill'):
            place, inner, mirror, over = spill(inner, n, 'rise')
            outer = over * mirror + (1 - over) * outer
        out = np.exp(place * inner + (1 - place) * outer)
        np.save(WORK / ('B%dr.npy' % n), out.astype(np.float16))
        Image.fromarray(RP.shown(out)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('B%dr-view.jpg' % n), quality=90)
        print('rise laid over level', n, 'tone at the edge 10 50 90 percentile', np.round(np.percentile(tone[::8, ::8][np.abs(tone[::8, ::8]).sum(-1) > 1e-4], [10, 50, 90]), 3), flush=True)


if __name__ == '__main__':
    if sys.argv[1] == 'rise':
        rise([int(v) for v in sys.argv[2:]] or P.SPEC['sets']['rise']['levels'])
    else:
        lay([int(v) for v in sys.argv[2:]] or sorted(RP.WIDTH))
