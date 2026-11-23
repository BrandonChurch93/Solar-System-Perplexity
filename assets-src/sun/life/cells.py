"""The map of the convection cells of the close ground, made from the plate itself.

usage: PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/life/cells.py plate|apron [check]

Finds every granule of the picture (a watershed of the smoothed luminance, the smoothing following
the size a cell of CELL stage units has in the picture at each pixel), and writes two pictures with
the frame of the source picture, which the ground shader reads beside it:

  cells-<name>.png  RGB: R, G the flow of the matter inside its cell, away from the cell's middle,
                    zero in the middle and in the lanes (128 is zero, 127 levels are the length
                    written to cells.json as a share of the picture, x to the right, y down);
                    B a number of the cell (its rate), laid softly over the cell edges. Inside
                    the penumbra of the sunspot the flow runs outward along the filaments.
  swell-<name>.png  RGB: R, G a point on the unit circle per cell (128 is zero), laid softly over the
                    cell edges: its angle is the cell's phase, its length is 1 inside a cell and falls
                    where neighbours disagree, in the spot and where no cell is known. B how far the
                    pixel is inside its cell (255 in the middle, 0 in a lane): its distance from the
                    nearest lane against the size of a cell there, zero where the cells are too small
                    in the picture to carry any life.

No alpha is used: the engine's loader would multiply the colour by it.
Everything is fixed by the picture and the numbers below. No random source: a cell's phase is a
hash of its place.
"""
import json
import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from skimage.segmentation import watershed
from skimage.morphology import h_maxima
from common import WORK, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, TX, TY, read

OUT = 'public/assets/sun'
DIR = f'{WORK}/life'
CELL = 0.16
SMOOTH = 0.11
APART = 0.42
DEEP = 0.045
LANE = 0.11
NONE = 0.5
CALM = 8.0
HOLLOW = 0.3
VALLEY = 0.025
ROOM = 3.0
LEVELS = (1.0, 1.5, 2.2, 3.3, 5.0, 7.5, 11.0, 16.0, 24.0)
FLOW = 0.5
SHAPE = 1.4
SOFT = 0.12
DEPTH = 0.3
ROUNDED = 0.06
SURE = 0.8
UNSURE = 0.25
STEEP = 1.5
NUMBER = 0.12
PEN = (1.0, 2.9)
PEN_EDGE = (0.15, 0.6)
PEN_FLOW = 0.3
FAR = 0.02

T = json.load(open('src/stops/sun/terrain.json'))
A = json.load(open('src/stops/sun/apron.json'))
DOWN = np.array(T['down'], dtype=np.float64)
DOWN /= np.linalg.norm(DOWN)
RADIUS = T['radius']
CENTRE = DOWN * (RADIUS + 1)
FWD = np.array([0, 0, -1.0]) + DOWN * DOWN[2]
FWD /= np.linalg.norm(FWD)
RIGHT = np.cross(FWD, -DOWN)
RIGHT /= np.linalg.norm(RIGHT)


def quat(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


def hit(eye, d):
    """Where rays d (unit, H x W x 3) from eye meet the ground: point, distance, cosine to the normal."""
    rel = CENTRE - eye
    b = d @ rel
    disc = b * b - (rel @ rel - RADIUS * RADIUS)
    ok = (disc > 0) & (b > 0)
    t = b - np.sqrt(np.maximum(disc, 0))
    p = eye[None, None, :] + d * t[..., None]
    n = (p - CENTRE) / RADIUS
    graze = np.clip(-(n * d).sum(-1), 0, 1)
    return p, t, graze, ok


def rays_plate(w, h):
    px, py = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    ax = LEFT + px * SPAN
    ay = TOP + (py * (CANVAS[1] - PLATE_TOP) + PLATE_TOP) / CANVAS[1] * SPAN
    d = np.stack([(ax - 0.5) * 2 * TX, (0.5 - ay) * 2 * TY, -np.ones_like(ax)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    tan_per_px = SPAN * 2 * TX / w
    return np.zeros(3), d, tan_per_px


def rays_apron(w, h):
    px, py = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    bx = px
    by = A['top'] + py * (1 - A['top'])
    q = A['quaternion']
    right = quat(q, np.array([1.0, 0, 0]))
    up = quat(q, np.array([0, 1.0, 0]))
    back = quat(q, np.array([0, 0, 1.0]))
    x = (bx - 0.5) * 2 * TX
    y = (0.5 - by) * 2 * TY
    d = x[..., None] * right + y[..., None] * up - back
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    return np.array(A['position'], dtype=np.float64), d, 2 * TX / w


def spot_ground():
    def on(ax, ay):
        d = np.array([(ax - 0.5) * 2 * TX, (0.5 - ay) * 2 * TY, -1.0])
        d /= np.linalg.norm(d)
        p, _, _, _ = hit(np.zeros(3), d[None, None, :])
        return p[0, 0]
    s = on(*T['spot'])
    e = on(T['spot'][0] + T['umbra'][0], T['spot'][1])
    return s, float(np.linalg.norm(e - s))


def by_level(stack, level):
    lo = np.clip(np.floor(level).astype(np.int32), 0, len(stack) - 2)
    f = np.clip(level - lo, 0, 1).astype(np.float32)
    out = np.zeros(stack[0].shape, np.float32)
    for i in range(len(stack) - 1):
        m = lo == i
        if m.any():
            out[m] = (stack[i][m] * (1 - f[m]) + stack[i + 1][m] * f[m])
    return out


def hash01(a, b):
    v = np.sin(a * 127.1 + b * 311.7) * 43758.5453
    return v - np.floor(v)


def merged(labels, n, smooth, size, valley):
    """Two cells with no lane between them are one cell: a shared edge that is on the mean less than
    LANE darker than the lower of the two tops is no lane. A cell does not grow past ROOM nominal areas."""
    idx = np.arange(1, n + 1)
    peak = np.concatenate([[0], ndi.maximum(smooth, labels, idx)])
    area = np.concatenate([[0], ndi.sum(np.ones(labels.shape, np.float32), labels, idx)])
    nominal = np.concatenate([[1], np.pi * (ndi.mean(size, labels, idx) / 2) ** 2])
    keys, vals = [], []
    real = []
    for a, b, va, vb, ra_, rb_ in ((labels[:, :-1], labels[:, 1:], smooth[:, :-1], smooth[:, 1:], valley[:, :-1], valley[:, 1:]), (labels[:-1, :], labels[1:, :], smooth[:-1, :], smooth[1:, :], valley[:-1, :], valley[1:, :])):
        m = (a != b) & (a > 0) & (b > 0)
        lo = np.minimum(a[m], b[m]).astype(np.int64)
        hi = np.maximum(a[m], b[m]).astype(np.int64)
        keys.append(lo * (n + 1) + hi)
        vals.append(np.minimum(va[m], vb[m]))
        real.append((ra_[m] | rb_[m]).astype(np.float64))
    keys = np.concatenate(keys)
    vals = np.concatenate(vals)
    real = np.concatenate(real)
    pair, inv, count = np.unique(keys, return_inverse=True, return_counts=True)
    mean = np.bincount(inv, vals) / count
    a = pair // (n + 1)
    b = pair % (n + 1)
    lack = np.minimum(peak[a], peak[b]) - mean
    parent = np.arange(n + 1)

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for k in np.argsort(lack):
        if lack[k] >= LANE:
            break
        ra, rb = find(a[k]), find(b[k])
        if ra == rb:
            continue
        if area[ra] + area[rb] > ROOM * max(nominal[ra], nominal[rb]):
            continue
        parent[rb] = ra
        area[ra] += area[rb]
        nominal[ra] = max(nominal[ra], nominal[rb])
    # the flood cuts a hill with two tops along straight lines down its flank, where no lane is. Two cells are
    # one, whatever the size, where less than NONE of their shared edge lies in a lane of the picture (valley).
    # A piece larger than CALM cells is left still.
    share = np.bincount(inv, real) / count
    for k in np.argsort(share):
        if share[k] >= NONE:
            break
        ra, rb = find(a[k]), find(b[k])
        if ra == rb:
            continue
        parent[rb] = ra
        area[ra] += area[rb]
        nominal[ra] = max(nominal[ra], nominal[rb])
    root = np.array([find(i) for i in range(n + 1)])
    uniq, new = np.unique(root[1:], return_inverse=True)
    table = np.concatenate([[0], new + 1])
    still = area[uniq] > CALM * nominal[uniq]
    return table[labels].astype(np.int32), len(uniq), still


def make(name, check):
    src = read(f'{OUT}/full/{name}.jpg')
    h0, w0 = src.shape[:2]
    w, h = w0 // 2, h0 // 2
    img = cv2.resize(src, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    lum = img @ np.array([0.3, 0.5, 0.2], np.float32)
    eye, d, tan_px = (rays_plate if name == 'plate' else rays_apron)(w, h)
    p, t, graze, ok = hit(eye, d)
    wide = CELL / np.maximum(t, 0.05) / tan_px
    tall = wide * np.maximum(graze, 0.08)
    size = np.sqrt(wide * tall)
    size = np.where(ok, size, 0).astype(np.float32)
    sigma = np.maximum(size * SMOOTH, LEVELS[0])
    level = np.interp(np.log(sigma), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32)
    stack = [cv2.GaussianBlur(lum, (0, 0), s) for s in LEVELS]
    smooth = by_level(stack, level)
    tops = []
    for s in LEVELS:
        r = max(int(round(s / SMOOTH * APART / 2)), 1)
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
        tops.append(cv2.dilate(smooth, k))
    top = by_level(tops, np.round(level))
    spot, umbra = spot_ground()
    rel = p - spot
    up = (spot - CENTRE) / RADIUS
    rel = rel - (rel @ up)[..., None] * up
    r = np.linalg.norm(rel, axis=-1) / umbra
    pen = np.clip((r - PEN[0]) / PEN_EDGE[0], 0, 1) * np.clip((PEN[1] - r) / PEN_EDGE[1], 0, 1)
    pen = (pen * pen * (3 - 2 * pen)).astype(np.float32)
    inside = (r < PEN[1]) & ok
    cells = ok & (size > 3.0) & ~inside
    # a top counts as a cell of its own only if a lane at least DEEP darker lies between it and a higher top
    high = h_maxima(np.round(smooth * 1023).astype(np.int32), int(round(DEEP * 1023))) > 0
    seeds = high & cells & (top - smooth < DEEP)
    markers, n = ndi.label(seeds, structure=np.ones((3, 3)))
    labels = watershed(-smooth, markers, mask=cells)
    first = labels
    # a lane: darker by VALLEY than the picture closed over a third of a cell
    closed = []
    for sg in LEVELS:
        rr = max(int(round(sg / SMOOTH * HOLLOW)), 1)
        closed.append(cv2.morphologyEx(smooth, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rr + 1, 2 * rr + 1))))
    valley = (by_level(closed, np.round(level)) - smooth) > VALLEY
    labels, n, still = merged(labels, n, smooth, size, valley)
    edge = np.zeros(labels.shape, bool)
    edge[:, 1:] |= labels[:, 1:] != labels[:, :-1]
    edge[1:, :] |= labels[1:, :] != labels[:-1, :]
    idx = np.arange(1, n + 1)
    cy = ndi.mean(np.broadcast_to(np.arange(h, dtype=np.float32)[:, None], (h, w)), labels, idx)
    cx = ndi.mean(np.broadcast_to(np.arange(w, dtype=np.float32)[None, :], (h, w)), labels, idx)
    lab = np.maximum(labels, 1) - 1
    # how far a place is inside its cell: its distance from the nearest lane, against the size a cell has there.
    # A lane is an edge of the flood where the picture has a valley. The edges the flood draws down the flank
    # of a hill with two tops are no lanes and count for nothing here, so they cannot show.
    was = np.zeros(labels.shape, bool)
    was[:, 1:] |= first[:, 1:] != first[:, :-1]
    was[1:, :] |= first[1:, :] != first[:-1, :]
    lane = ((edge | was) & valley) | (labels == 0)
    depth = cv2.distanceTransform((~lane).astype(np.uint8), cv2.DIST_L2, 5)
    inner = np.clip(depth / np.maximum(size * DEPTH, 1.0), 0, 1).astype(np.float32)
    rounded = np.maximum(size * ROUNDED, LEVELS[0])
    inner = by_level([cv2.GaussianBlur(inner, (0, 0), sg) for sg in LEVELS], np.interp(np.log(rounded), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32))
    inner = np.where(cells, inner, 0).astype(np.float32)
    # a cell whose whole edge is lane is sure: only such a cell may close and open again
    count = np.bincount(labels[edge], minlength=n + 1).astype(np.float64)
    inlane = np.bincount(labels[edge & valley], minlength=n + 1).astype(np.float64)
    sure = (inlane / np.maximum(count, 1) >= SURE) & ~np.concatenate([[False], still])
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # the matter runs downhill on that relief, from the tops to the lanes
    calm = by_level([cv2.GaussianBlur(inner, (0, 0), sg) for sg in LEVELS], level)
    gx = cv2.Sobel(calm, cv2.CV_32F, 1, 0, ksize=3) / 8
    gy = cv2.Sobel(calm, cv2.CV_32F, 0, 1, ksize=3) / 8
    mag = np.hypot(gx, gy)
    shape = np.sin(np.pi * np.clip(inner, 0, 1) ** SHAPE) * np.clip(mag * size / STEEP, 0, 1)
    fx = -gx / np.maximum(mag, 1e-6) * shape
    fy = -gy / np.maximum(mag, 1e-6) * shape
    far = np.clip((size - 3.0) / 5.0, 0, 1)
    fx *= far
    fy *= far
    half = size / 2
    reach = np.where(cells, half, 0).astype(np.float32)
    # the penumbra: outward along the filaments, on the ground, brought into the picture
    east = np.array([1.0, 0, 0]) - up * up[0]
    east /= np.linalg.norm(east)
    north = np.cross(up, east)
    psi = np.arctan2(rel @ north, rel @ east)
    out_dir = rel / np.maximum(np.linalg.norm(rel, axis=-1, keepdims=True), 1e-6)
    step = 0.02 * umbra
    q = p + out_dir * step - eye
    if name == 'plate':
        ax = q[..., 0] / -q[..., 2] / (2 * TX) + 0.5
        ay = 0.5 - q[..., 1] / -q[..., 2] / (2 * TY)
        qx = (ax - LEFT) / SPAN * w
        qy = ((ay - TOP) / SPAN * CANVAS[1] - PLATE_TOP) / (CANVAS[1] - PLATE_TOP) * h
    else:
        qd = A['quaternion']
        right = quat(qd, np.array([1.0, 0, 0]))
        upc = quat(qd, np.array([0, 1.0, 0]))
        back = quat(qd, np.array([0, 0, 1.0]))
        z = np.maximum(-(q @ back), 1e-3)
        qx = ((q @ right) / z / (2 * TX) + 0.5) * w
        qy = ((0.5 - (q @ upc) / z / (2 * TY)) - A['top']) / (1 - A['top']) * h
    px_per = np.stack([qx - (xx + 0.5), qy - (yy + 0.5)], -1) / step
    pen_len = umbra * (PEN[1] - PEN[0]) * PEN_FLOW
    pfx = px_per[..., 0] * pen_len
    pfy = px_per[..., 1] * pen_len
    pen_reach = np.hypot(pfx, pfy)
    gate = pen * ok
    reach = np.where(gate > 0, np.maximum(pen_reach, 1e-3), reach).astype(np.float32)
    ux = np.where(gate > 0, gate * pfx / np.maximum(pen_reach, 1e-3), fx)
    uy = np.where(gate > 0, gate * pfy / np.maximum(pen_reach, 1e-3), fy)
    inner = np.where(inside, 1.0, inner).astype(np.float32)
    soft = np.maximum(size * SOFT * 0.25, 0.7)
    lv = np.interp(np.log(soft), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32)
    ux = by_level([cv2.GaussianBlur(ux.astype(np.float32), (0, 0), s) for s in LEVELS], lv)
    uy = by_level([cv2.GaussianBlur(uy.astype(np.float32), (0, 0), s) for s in LEVELS], lv)
    # flow in units of the picture: the red and green bytes times FLOW times reach (px of the half size map)
    # the shader needs the length in uv, so the reach goes into the vector and one scale is stored
    vx = ux * reach * FLOW
    vy = uy * reach * FLOW
    scale = float(np.percentile(np.hypot(vx, vy), 99.9))
    vx = np.clip(vx / scale, -1, 1)
    vy = np.clip(vy / scale, -1, 1)
    flow = np.zeros((h, w, 3), np.uint8)
    flow[..., 0] = np.round(128 + 127 * vx)
    flow[..., 1] = np.round(128 + 127 * vy)
    # the two numbers of a cell. Both are laid softly over the edges the flood drew, so that no edge of the
    # flood can show: a number of the cell's rate (blue of the first picture) and a point on the unit circle
    # (red and green of the second), whose angle is the cell's phase and whose length falls to zero where
    # neighbours disagree, in the spot and where no cell is known. The shader lets the life fade with that length.
    quiet = np.where(inside | (labels == 0), 0.0, 1.0).astype(np.float32)
    ns = np.maximum(size * NUMBER, 1.0)
    ln = np.interp(np.log(ns), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32)

    def soften(v):
        return by_level([cv2.GaussianBlur(v.astype(np.float32), (0, 0), s) for s in LEVELS], ln)
    weight = soften(quiet)
    own = np.where(labels > 0, hash01(cx[lab], cy[lab]), 0.5).astype(np.float32)
    own = np.where(sure[labels], own, UNSURE + (1 - UNSURE) * own).astype(np.float32)
    own = np.where(weight > 0.05, soften(own * quiet) / np.maximum(weight, 0.05), 0.5)
    flow[..., 2] = np.round(np.clip(own, 0, 1) * 255)
    second = np.where(labels > 0, hash01(cy[lab] + 3.1, cx[lab] + 1.7), 0).astype(np.float32)
    held = inner * far
    swell = np.zeros((h, w, 3), np.uint8)
    for i, trig in enumerate((np.cos, np.sin)):
        v = soften(trig(2 * np.pi * second) * quiet)
        swell[..., i] = np.round(128 + 127 * np.clip(v, -1, 1))
    swell[..., 2] = np.round(np.clip(held, 0, 1) * 255)
    for tier, k in (('full', 1), ('web', 2)):
        a = flow if k == 1 else cv2.resize(flow, (w // k, h // k), interpolation=cv2.INTER_AREA)
        b = swell if k == 1 else cv2.resize(swell, (w // k, h // k), interpolation=cv2.INTER_AREA)
        cv2.imwrite(f'{OUT}/{tier}/cells-{name}.png', cv2.cvtColor(a, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_PNG_COMPRESSION, 9])
        cv2.imwrite(f'{OUT}/{tier}/swell-{name}.png', cv2.cvtColor(b, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    meta = {'flow': [scale / w, scale / h], 'cells': int(n), 'size': [w, h]}
    path = 'src/stops/sun/cells.json'
    try:
        data = json.load(open(path))
    except FileNotFoundError:
        data = {}
    data[name] = meta
    json.dump(data, open(path, 'w'), indent=2)
    print(name, 'still pieces', int(still.sum()), 'sure cells', int(sure.sum()))
    print(name, 'cells', n, 'flow scale px', round(scale, 2), 'median half width px', round(float(np.median(half[labels > 0])), 1))
    if check:
        np.savez_compressed(f'{DIR}/dbg-{name}.npz', smooth=smooth, first=first, labels=labels, valley=valley, level=level, size=size, seeds=seeds)
        show = (img * 255).astype(np.uint8).copy()
        show[edge & cells] = (0, 255, 255)
        show[seeds] = (255, 0, 0)
        show[(pen > 0.5) & ok] = (show[(pen > 0.5) & ok] * 0.6 + np.array([0, 60, 110])).astype(np.uint8)
        cv2.imwrite(f'{DIR}/cells-{name}-check.jpg', cv2.cvtColor(show, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
        cv2.imwrite(f'{DIR}/cells-{name}-flow.jpg', cv2.cvtColor(flow, cv2.COLOR_RGB2BGR))
        cv2.imwrite(f'{DIR}/cells-{name}-swell.jpg', cv2.cvtColor(swell, cv2.COLOR_RGB2BGR))
        cv2.imwrite(f'{DIR}/cells-{name}-inner.jpg', swell[..., 2])


if __name__ == '__main__':
    make(sys.argv[1], len(sys.argv) > 2)
