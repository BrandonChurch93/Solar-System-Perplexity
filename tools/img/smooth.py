#!/usr/bin/env python3
"""Image measures of npm run smooth. Reads one JSON job on stdin, writes one JSON reply on stdout."""
import json
import sys
import warnings

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

LUMA = np.array([0.2126, 0.7152, 0.0722])
AGREE_SHARE = 0.01
AGREE_PX2 = 0.5
JUDGED_SHARE = 0.1
BLOCK_SHARE = 0.5
PATTERN_SHARE = 0.02
PLANE_RIDGE = 1e-3


def grey(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64) @ LUMA


def font(size):
    for name in ('DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def small(g, scale):
    h, w = g.shape
    size = (max(int(round(w * scale)), 16), max(int(round(h * scale)), 16))
    return cv2.resize(g, size, interpolation=cv2.INTER_AREA)


def motion(a, b):
    a8 = np.clip(a, 0, 255).astype(np.uint8)
    b8 = np.clip(b, 0, 255).astype(np.uint8)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    return dis.calc(a8, b8, None)


def along(f, g, mx, my):
    """One frame further along the flow f from the places mx, my. g is the flow back: where the two do not agree the flow carries nothing."""
    fx = cv2.remap(f[..., 0], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    fy = cv2.remap(f[..., 1], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    nx = mx + fx
    ny = my + fy
    gx = cv2.remap(g[..., 0], nx, ny, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    gy = cv2.remap(g[..., 1], nx, ny, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    h, w = f.shape[:2]
    inside = (nx >= 0) & (nx <= w - 1) & (ny >= 0) & (ny <= h - 1)
    agree = (fx + gx) ** 2 + (fy + gy) ** 2 <= AGREE_SHARE * (fx * fx + fy * fy + gx * gx + gy * gy) + AGREE_PX2
    return nx, ny, inside, agree


def places(shape):
    h, w = shape
    return np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))


def left(a, b, f=None, g=None, agree=True):
    """What is left of the difference between a and the next frame b once the motion between them is taken out.
    Pixels that leave the frame are not counted. Pixels where the flow and the flow back do not agree (ground uncovered, content entering) count as nothing left; their share is the third value."""
    f = motion(a, b) if f is None else f
    g = motion(b, a) if g is None else g
    xs, ys = places(a.shape)
    mx, my, inside, sure = along(f, g, xs, ys)
    moved = cv2.remap(b.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    d = np.abs(moved - a.astype(np.float32))
    unsure = inside & ~sure if agree else np.zeros_like(inside)
    d[unsure] = 0
    d[~inside] = np.nan
    return d, float(np.hypot(f[..., 0], f[..., 1]).mean()), unsure


def body(pose, shape, margin):
    """Where the frame shows the body: the pixels whose ray meets the unit sphere of the stop, or its rings in front of it when the pose names them
    (rings: normal, inner, outer), less a margin at the edge. pose: p, q (x, y, z, w), vfov. When the pose names the globe (globe: quaternion,
    scale) the body is the unit sphere scaled along the axes of the globe's own frame, as the stop draws it."""
    h, w = shape
    k = h / 2 / np.tan(np.radians(pose['vfov']) / 2)
    xs, ys = places(shape)
    v = np.stack([(xs + 0.5 - w / 2) / k, (h / 2 - ys - 0.5) / k, -np.ones(shape, dtype=np.float32)], axis=-1).astype(np.float64)
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    u = np.array(pose['q'][:3], dtype=np.float64)
    t = 2 * np.cross(u, v)
    ray = v + pose['q'][3] * t + np.cross(u, t)
    p = np.array(pose['p'], dtype=np.float64)
    globe = pose.get('globe')
    if globe:
        gq = np.array(globe['quaternion'], dtype=np.float64)
        gs = np.array(globe['scale'], dtype=np.float64)

        def own(x):
            """A direction or a point of the stop in the globe's own frame, its scale taken out: there the body is the unit sphere."""
            t = 2 * np.cross(-gq[:3], x)
            return (x + gq[3] * t + np.cross(-gq[:3], t)) / gs

        rs, ps = own(ray), own(p)
        along = (rs * rs).sum(-1)
        near = -(rs @ ps)
        disc = near * near - along * (ps @ ps - 1)
        front = (near - np.sqrt(np.maximum(disc, 0))) / along
    else:
        near = -(ray @ p)
        disc = near * near - p @ p + 1
        front = near - np.sqrt(np.maximum(disc, 0))
    hit = (disc > 0) & (front > 0)
    rings = pose.get('rings')
    if rings:
        n = np.array(rings['normal'], dtype=np.float64)
        n /= np.linalg.norm(n)
        slope = ray @ n
        with np.errstate(all='ignore'):
            far = -(p @ n) / slope
            radius = np.linalg.norm(p + ray * far[..., None], axis=-1)
            hit |= np.isfinite(far) & (far > 0) & (radius >= rings['inner']) & (radius <= rings['outer']) & ~(hit & (front < far))
    size = 2 * int(round(margin)) + 1
    return cv2.erode(hit.astype(np.uint8), np.ones((size, size), np.uint8), borderType=cv2.BORDER_CONSTANT, borderValue=1) > 0


def change(frames, fw, bw, i, n, sigma, first=None, last=None):
    """Frame i against frame i + n carried back along the flows: the signed difference, smoothed, where every flow on the way agrees with its way back.
    first and last are the body in frame i and in frame i + n: when given, only what starts on the body and arrives on it is judged."""
    xs, ys = places(frames[i].shape)
    mx, my = xs, ys
    ok = np.ones(frames[i].shape, bool) if first is None else first.copy()
    for j in range(i, i + n):
        mx, my, inside, sure = along(fw[j], bw[j], mx, my)
        ok &= inside & sure
    if last is not None:
        ok &= cv2.remap(last.astype(np.float32), mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.5
    moved = cv2.remap(frames[i + n].astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    weight = cv2.GaussianBlur(ok.astype(np.float32), (0, 0), sigma)
    d = cv2.GaussianBlur((moved - frames[i].astype(np.float32)) * ok, (0, 0), sigma) / np.maximum(weight, 1e-6)
    d[weight < 0.5] = np.nan
    return d, moved, ok


def leaning(okf, fine, wide):
    """What the two windows of the detail read of a level that only slopes, where the border of the judged area cuts them: cut windows have their
    middles at different places, and a slope read over that distance is no detail. Gives the function of a picture: the plane through its level
    in the wide window, times the way from the middle of the wide window to the middle of the fine one. 0 where no border cuts the windows."""
    o = okf.astype(np.float64)
    soft = lambda x, s: cv2.GaussianBlur(x, (0, 0), s)
    near, far = np.maximum(soft(o, fine), 1e-9), np.maximum(soft(o, wide), 1e-9)
    ys, xs = np.mgrid[0:o.shape[0], 0:o.shape[1]] / wide
    mean = lambda x: soft(x * o, wide) / far
    mx, my = mean(xs), mean(ys)
    sxx, sxy, syy = mean(xs * xs) - mx * mx + PLANE_RIDGE, mean(xs * ys) - mx * my, mean(ys * ys) - my * my + PLANE_RIDGE
    det = sxx * syy - sxy * sxy
    wx, wy = soft(xs * o, fine) / near - mx, soft(ys * o, fine) / near - my

    def lean(x):
        x = x.astype(np.float64)
        m = mean(x)
        sx, sy = mean(xs * x) - mx * m, mean(ys * x) - my * m
        return (((syy * sx - sxy * sy) * wx + (sxx * sy - sxy * sx) * wy) / det).astype(np.float32)

    return lean


def pattern(a, b, ok, fine, wide, floor):
    """How far the pattern of b is from the pattern of a, per pixel: 0 the same pattern, 1 an unrelated one, 2 the reverse.
    Both are reduced to their detail between the two widths (the local mean taken out, and at a border the slope of the level, see leaning)
    and divided by their local contrast, so a veil that lifts the level and lowers the contrast counts little. Only where both have detail
    over the floor."""
    okf = ok.astype(np.float32)
    soft = lambda x, s: cv2.GaussianBlur(x.astype(np.float32), (0, 0), s)
    near, far = np.maximum(soft(okf, fine), 1e-6), np.maximum(soft(okf, wide), 1e-6)
    lean = leaning(okf, fine, wide)
    da = (soft(a * okf, fine) / near - soft(a * okf, wide) / far - lean(a)) * okf
    db = (soft(b * okf, fine) / near - soft(b * okf, wide) / far - lean(b)) * okf
    ca = np.sqrt(np.maximum(soft(da * da, wide) / far, 0))
    cb = np.sqrt(np.maximum(soft(db * db, wide) / far, 0))
    p = 1 - (soft(da * db, wide) / far) / np.maximum(ca * cb, 1e-6)
    p[~(ok & (soft(okf, wide) >= 0.5) & (ca > floor) & (cb > floor))] = np.nan
    return p


def patterned(p):
    """The 99th percentile of a pattern change, where its largest value is, and the share of the frame that is judged."""
    judged = np.isfinite(p)
    share = float(judged.mean())
    if share < PATTERN_SHARE:
        return None, None, share
    at = np.unravel_index(np.nanargmax(p), p.shape)
    return float(np.nanpercentile(p, 99)), [int(at[1]), int(at[0])], share


def changed(d):
    """The 99th percentile and the largest value of a smoothed change, where the largest is, and the share of the frame that is judged."""
    judged = np.isfinite(d)
    share = float(judged.mean())
    if share < JUDGED_SHARE:
        return None, None, None, share
    size = np.abs(d)
    at = np.unravel_index(np.nanargmax(size), size.shape)
    return float(np.nanpercentile(size, 99)), float(size[at]), [int(at[1]), int(at[0])], share


def blocks(d, cols, rows, share=0.0):
    """The mean of d in each block of the grid, where more than the share of the block is counted."""
    h, w = d.shape
    out = np.full((rows, cols), np.nan)
    for r in range(rows):
        for c in range(cols):
            part = d[r * h // rows:(r + 1) * h // rows, c * w // cols:(c + 1) * w // cols]
            if np.isfinite(part).mean() > share:
                out[r, c] = np.nanmean(part)
    return out


def span(i, n, window, lead=0, tail=0):
    """The window round i: window neighbours when the row is long enough, moved inward at both ends. A row that is drawn with lead frames
    of context before its first frame and tail after its last has its ends that much further out."""
    lo = max(min(i - window // 2, n - 1 + tail - window), -lead)
    return lo, min(lo + window, n - 1 + tail)


def near(i, n, window, first=0, total=None, lead=0, tail=0):
    """The window round i as places in a list of n that starts at place first of a row of total: the window is the whole row's."""
    lo, hi = span(i + first, n if total is None else total, window, lead, tail)
    if lo < first or hi - first > n - 1:
        raise SystemExit('smooth.py: the slice does not hold the window round frame %d of the row' % (i + first))
    return lo - first, hi - first


def around(values, i, window, first=0, total=None, lead=0, tail=0):
    """The median of the values in the window round i, i itself left out."""
    lo, hi = near(i, len(values), window, first, total, lead, tail)
    picked = [values[j] for j in range(lo, hi + 1) if j != i and values[j] is not None]
    return float(np.median(picked)) if picked else None


def pictures(job):
    paths = job['paths']
    scale = job.get('scale', 0.25)
    window = job.get('window', 16)
    floor = job.get('floor', 0.25)
    cols, rows = job.get('grid', [16, 9])
    marks = set(job.get('breaks', []))
    agree = job.get('agree', True)
    reach = int(job.get('changeFrames', 0))
    sigma = float(job.get('changeBlur', 20)) * scale
    wide = float(job.get('patternPx', 40)) * scale
    low = float(job.get('patternFloor', 1))
    poses = job.get('poses') or [None] * len(paths)
    frames = []
    levels = []
    for p in paths:
        g = grey(p)
        levels.append(float(g.mean()))
        frames.append(small(g, scale))
    n = len(paths)
    start = int(job.get('first', 0))
    total = int(job.get('total', n))
    own = job.get('own') or [start, start + n]
    lead = int(job.get('lead', 0))
    tail = int(job.get('tail', 0))
    inside = lambda i: 0 <= i + start < total
    fw = [None] * n
    bw = [None] * n
    residual = [None] * n
    carried = [None] * n
    moved = [None] * n
    unsure = [None] * n
    grids = [None] * n
    sure = [None] * n
    for i in range(n - 1):
        if (i + 1) in marks:
            continue
        fw[i] = motion(frames[i], frames[i + 1])
        bw[i] = motion(frames[i + 1], frames[i])
        d, m, u = left(frames[i], frames[i + 1], fw[i], bw[i], False)
        counted = np.isfinite(d)
        if not counted.any():
            continue
        moved[i] = m / scale
        residual[i] = float(np.nanmean(d))
        grids[i] = blocks(d, cols, rows)
        if agree:
            d, _, u = left(frames[i], frames[i + 1], fw[i], bw[i], True)
            carried[i] = float(np.nanmean(d))
            unsure[i] = float(u.sum() / counted.sum())
            d[u] = np.nan
            sure[i] = blocks(d, cols, rows, BLOCK_SHARE)
    step = [None] * n
    for i in range(1, n - 1):
        if i in marks or (i + 1) in marks or not (inside(i - 1) and inside(i + 1)):
            continue
        step[i] = abs(levels[i] - (levels[i - 1] + levels[i + 1]) / 2)
    pop = [None] * n
    base = [None] * n
    plain = [None] * n
    masked = [None] * n
    block = [None] * n
    where = [None] * n

    def ratio(stack, i):
        lo, hi = near(i, n, window, start, total, lead, tail)
        rest = [stack[j] for j in range(lo, hi + 1) if j != i and stack[j] is not None]
        if not rest or not np.isfinite(np.stack(rest)).any():
            return None
        with np.errstate(all='ignore'), warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            return stack[i] / np.maximum(np.nanmedian(np.stack(rest), axis=0), floor)

    for i in range(n):
        if residual[i] is None or not own[0] <= i + start < own[1] or not inside(i + 1):
            continue
        m = around(residual, i, window, start, total, lead, tail)
        if m is None:
            continue
        base[i] = m
        plain[i] = pop[i] = residual[i] / max(m, floor)
        cells = ratio(grids, i)
        if agree:
            masked[i] = carried[i] / max(around(carried, i, window, start, total, lead, tail), floor)
            pop[i] = min(plain[i], masked[i])
            other = ratio(sure, i)
            cells = None if cells is None or other is None else np.minimum(cells, other)
        if cells is not None and np.isfinite(cells).any():
            at = np.unravel_index(np.nanargmax(cells), cells.shape)
            block[i] = float(cells[at])
            where[i] = [int(at[1]), int(at[0])]
    shift = [None] * n
    top = [None] * n
    spot = [None] * n
    judged = [None] * n
    weave = [None] * n
    weaveAt = [None] * n
    weaveShare = [None] * n
    if reach > 0:
        for i in range(n - reach):
            if not own[0] <= i + start < own[1] or not inside(i + reach) or any(fw[j] is None for j in range(i, i + reach)):
                continue
            first, last = (body(poses[j], frames[j].shape, sigma) if poses[j] else None for j in (i, i + reach))
            d, later, ok = change(frames, fw, bw, i, reach, sigma, first, last)
            shift[i], top[i], at, judged[i] = changed(d)
            spot[i] = [int(round(at[0] / scale)), int(round(at[1] / scale))] if at else None
            weave[i], at, weaveShare[i] = patterned(pattern(frames[i].astype(np.float32), later, ok, wide / 5, wide, low))
            weaveAt[i] = [int(round(at[0] / scale)), int(round(at[1] / scale))] if at else None
    for i in range(n):
        if not inside(i + 1):
            residual[i] = moved[i] = unsure[i] = None
    more = mapped(job, paths, frames, poses, scale, sigma, wide, low, reach, [i for i in range(n - reach) if own[0] <= i + start < own[1] and inside(i + reach) and not any((j + 1) in marks for j in range(i, i + reach))]) if reach > 0 and job.get('carry') else {}
    return {**more, 'level': levels, 'levelStep': step, 'residual': residual, 'base': base, 'popAll': plain, 'popCarried': masked, 'pop': pop, 'motionPx': moved, 'unsure': unsure, 'popBlock': block, 'popBlockAt': where, 'grid': [cols, rows],
            'change': shift, 'changeTop': top, 'changeAt': spot, 'changeShare': judged, 'changeFrames': reach,
            'pattern': weave, 'patternAt': weaveAt, 'patternShare': weaveShare}


def mapped(job, paths, frames, poses, scale, margin, wide, floor, reach, rows):
    """The pattern of each row's pair read a second way, beside the reader above and judging nothing: the pair carried by the camera's own map,
    the flow on the carried pair, the reading after both (carry.py). Keys of their own: patternMap and what belongs to it."""
    import carry as C
    n = len(paths)
    keys = {key: [None] * n for key in ('patternMap', 'patternMapAt', 'patternMapShare', 'patternMapOn', 'patternMapBy', 'patternMapRule', 'patternMapLeft', 'patternMapUnits', 'patternMapBulk', 'patternMapApart', 'patternMapNo', 'patternMapRefused')}
    held = {}
    depths = job.get('depths') or [None] * n

    def frame(j):
        if j not in held:
            pose = C.told(poses[j])
            depth, which, unit = C.source(pose, frames[j].shape, depths[j])
            held[j] = {'grey': frames[j], 'full': lambda: grey(paths[j]), 'depth': depth, 'which': which, 'unit': unit, 'pose': pose}
        return held[j]

    for i in rows:
        if not poses[i] or not poses[i + reach] or (job.get('depths') and not (depths[i] and depths[i + reach])):
            continue
        for j in [j for j in held if j < i]:
            del held[j]
        out, _ = C.read(frame(i), frame(i + reach), margin, scale, wide, floor)
        keys['patternMap'][i], keys['patternMapAt'][i], keys['patternMapShare'][i] = out['value'], out['at'], out['share']
        keys['patternMapOn'][i], keys['patternMapBy'][i], keys['patternMapRule'][i], keys['patternMapLeft'][i], keys['patternMapUnits'][i] = out['on'], out['by'], out['rule'], out['left'], out['units']
        keys['patternMapBulk'][i], keys['patternMapApart'][i], keys['patternMapNo'][i], keys['patternMapRefused'][i] = out['bulk'], out['apart'], out['no'], out['refused']
    keys['patternMapLimits'] = {'bulkPx': C.BULK_PX, 'apart': C.APART}
    return keys


def maps(job):
    """Rows of six for pairs read by the camera's own map (carry.py): the frame read on, the other frame as it is, the other frame carried onto
    it by the map and the flow, their difference times 4, the rule of each pixel (green the map, blue the sky, orange the flow, black not
    judged), the change of their pattern (white is 1). The label of a row ends with its reading."""
    import carry as C
    scale = job.get('scale', 0.25)
    margin = float(job.get('changeBlur', 20)) * scale
    wide = float(job.get('patternPx', 40)) * scale
    low = float(job.get('patternFloor', 1))
    rows = []
    readings = []
    for item in job['pairs']:
        sides = []
        for path, pose, depth in zip(item['paths'], item['poses'], item.get('depths') or [None, None]):
            g = grey(path)
            reduced = small(g, scale)
            pose = C.told(pose)
            d, which, unit = C.source(pose, reduced.shape, depth)
            sides.append({'grey': reduced, 'full': (lambda g=g: g), 'depth': d, 'which': which, 'unit': unit, 'pose': pose})
        out, row = C.panels(sides[0], sides[1], margin, scale, wide, low)
        readings.append(out)
        by = out['by'] or {}
        rows.append((item['label'] + (': no reading: %s (the flow left over the body %s px, the body at another distance on %s of it%s)' % (out['no'], '%.1f' % out['bulk'] if out['bulk'] is not None else 'none', '%.2f' % out['apart'] if out['apart'] is not None else 'none', ', the pair gave %.2f' % out['refused'] if out['refused'] is not None else '') if out['no'] else ': no reading' if out['value'] is None else ': %.2f read on the %s frame, shares map %.2f, sky %.2f, flow %.2f, largest block under the %s' % (out['value'], 'later' if out['on'] else 'first', by.get('map', 0), by.get('sky', 0), by.get('flow', 0), out['rule'])), row))
    if not rows:
        return {'written': False, 'readings': readings}
    return {'written': True, 'readings': readings, 'size': write_sheet(rows, job['output'], job.get('limit'))}


def changes(job):
    """Rows of four: a frame, a later frame carried back to it along the flows, their smoothed difference times the gain, and the change of their
    pattern (white is 1, an unrelated pattern). Black where it is not judged."""
    scale = job.get('scale', 0.25)
    gain = job.get('gain', 6)
    sigma = float(job.get('changeBlur', 20)) * scale
    wide = float(job.get('patternPx', 40)) * scale
    low = float(job.get('patternFloor', 1))
    rows = []
    for item in job['chains']:
        frames = [small(grey(p), scale) for p in item['paths']]
        n = len(frames) - 1
        fw = [motion(frames[i], frames[i + 1]) for i in range(n)]
        bw = [motion(frames[i + 1], frames[i]) for i in range(n)]
        first, last = (body(q, frames[0].shape, sigma) if q else None for q in item.get('poses') or [None, None])
        d, moved, ok = change(frames, fw, bw, 0, n, sigma, first, last)
        size = (frames[0].shape[1], frames[0].shape[0])
        ca = np.asarray(Image.open(item['paths'][0]).convert('RGB').resize(size, Image.LANCZOS))
        back = np.clip(moved, 0, 255).astype(np.uint8)
        back[~ok] = 0
        cb = np.repeat(back[..., None], 3, axis=2)
        dd = np.repeat(np.clip(np.abs(np.nan_to_num(d)) * gain, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
        p = pattern(frames[0].astype(np.float32), moved, ok, wide / 5, wide, low)
        pp = np.repeat(np.clip(np.nan_to_num(p) * 255, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
        rows.append((item['label'], np.concatenate([ca, cb, dd, pp], axis=1)))
    if not rows:
        return {'written': False}
    return {'written': True, 'size': write_sheet(rows, job['output'], job.get('limit'))}


def panel(job):
    """Rows of three: a frame, the next one, and what is left of their difference once the motion is taken out, times the gain."""
    scale = job.get('scale', 0.25)
    gain = job.get('gain', 8)
    rows = []
    for item in job['pairs']:
        a = small(grey(item['a']), scale)
        b = small(grey(item['b']), scale)
        d, _, _ = left(a, b, agree=job.get('agree', True))
        d = np.nan_to_num(d)
        ca = np.asarray(Image.open(item['a']).convert('RGB').resize((a.shape[1], a.shape[0]), Image.LANCZOS))
        cb = np.asarray(Image.open(item['b']).convert('RGB').resize((a.shape[1], a.shape[0]), Image.LANCZOS))
        dd = np.repeat(np.clip(d * gain, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
        rows.append((item['label'], np.concatenate([ca, cb, dd], axis=1)))
    if not rows:
        return {'written': False}
    return {'written': True, 'size': write_sheet(rows, job['output'], job.get('limit'))}


def rgb(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64)


def parity(job):
    """The same frame drawn large and scaled down against the frame drawn at the film's size."""
    coarse = int(job.get('coarse', 8))
    cols, rows = job.get('grid', [16, 9])
    gain = job.get('gain', 8)
    out = []
    sheet_rows = []
    for item in job['pairs']:
        film = rgb(item['film'])
        big = rgb(item['big'])
        h, w = film.shape[:2]
        if big.shape[0] % h or big.shape[1] % w or big.shape[0] // h != big.shape[1] // w:
            raise SystemExit('parity: ' + item['big'] + ' is not a whole multiple of ' + item['film'])
        down = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA)
        a = film @ LUMA
        b = down @ LUMA
        d = b - a
        ad = np.abs(d)
        cw, ch = max(w // coarse, 1), max(h // coarse, 1)
        cd = np.abs(cv2.resize(b, (cw, ch), interpolation=cv2.INTER_AREA) - cv2.resize(a, (cw, ch), interpolation=cv2.INTER_AREA))
        grid = cv2.resize(d, (cols, rows), interpolation=cv2.INTER_AREA)
        at = np.unravel_index(np.argmax(np.abs(grid)), grid.shape)
        fine_a = float(np.abs(cv2.Laplacian(a, cv2.CV_64F)).mean())
        fine_b = float(np.abs(cv2.Laplacian(b, cv2.CV_64F)).mean())
        channel = (down - film).reshape(-1, 3).mean(axis=0)
        out.append({
            'mean': float(ad.mean()), 'p99': float(np.percentile(ad, 99)), 'max': float(ad.max()), 'level': float(d.mean()),
            'colour': float(channel[np.argmax(np.abs(channel))]), 'coarse': float(cd.mean()), 'coarseMax': float(cd.max()),
            'blockLevel': float(grid[at]), 'blockAt': [int(at[1]), int(at[0])], 'detail': fine_a / max(fine_b, 1e-6),
        })
        if job.get('output'):
            size = (w // 3, h // 3)
            fa = np.asarray(Image.fromarray(np.clip(film, 0, 255).astype(np.uint8)).resize(size, Image.LANCZOS))
            fb = np.asarray(Image.fromarray(np.clip(down, 0, 255).astype(np.uint8)).resize(size, Image.LANCZOS))
            dd = cv2.resize(ad, size, interpolation=cv2.INTER_AREA)
            dd = np.repeat(np.clip(dd * gain, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
            sheet_rows.append((item['label'], np.concatenate([fa, fb, dd], axis=1)))
    if sheet_rows:
        write_sheet(sheet_rows, job['output'], job.get('limit'))
    return out


def write_sheet(rows, output, limit):
    pad = 26
    width = rows[0][1].shape[1]
    height = sum(r[1].shape[0] + pad for r in rows)
    sheet = Image.new('RGB', (width, height), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    f = font(16)
    y = 0
    for label, img in rows:
        draw.text((6, y + 4), label, fill=(235, 235, 235), font=f)
        sheet.paste(Image.fromarray(img), (0, y + pad))
        y += img.shape[0] + pad
    if limit and max(sheet.size) > limit:
        k = limit / max(sheet.size)
        sheet = sheet.resize((max(int(sheet.size[0] * k), 1), max(int(sheet.size[1] * k), 1)), Image.LANCZOS)
    sheet.save(output)
    return list(sheet.size)


def main():
    job = json.load(sys.stdin)
    op = job.get('op')
    if op == 'pictures':
        out = pictures(job)
    elif op == 'panel':
        out = panel(job)
    elif op == 'changes':
        out = changes(job)
    elif op == 'maps':
        out = maps(job)
    elif op == 'parity':
        out = parity(job)
    else:
        raise SystemExit('unknown op ' + str(op))
    json.dump(out, sys.stdout)


if __name__ == '__main__':
    main()
