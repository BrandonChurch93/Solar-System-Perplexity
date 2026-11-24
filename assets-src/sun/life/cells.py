"""The map of the convection cells of the close ground, made from the plate itself.

usage: PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/life/cells.py plate|apron [check]

Finds every granule of the picture (a watershed of the smoothed luminance, the smoothing following
the size a cell of CELL stage units has in the picture at each pixel), and writes two pictures with
the frame of the source picture, which the ground shader reads beside it:

  cells-<name>.png  RGB: R, G the stream (128 is zero): the way down the slope of the depth in blue,
                    from the middle of a cell to its lanes, as a direction on the ground (x along the
                    rows of the picture, y down the picture). Its length is one on the flank of a cell
                    and nil in the middle and in the lane. In the penumbra of the spot it points outward
                    from the spot's middle, nil at the dark core; at the edge of the spot it has half
                    its strength and gives way to the stream of the cells over RIM core radii.
                    B how deep the pixel lies inside the bright ground: its distance from the nearest
                    lane measured on the ground (the picture drawn apart where the view flattens it)
                    against the size of a cell there; 255 is FULL times the depth of the middle of the
                    median cell. It is rounded, so it has no crease, and no edge of the flood is in
                    it. In the apron both are the plate's wherever the plate is drawn, so make the
                    plate first.
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
DEPTH = 0.3
ROUNDED = 0.06
SURE = 0.8
NUMBER = 0.12
FULL = 1.6
LEAD = (0.01, 0.13)
EASE = 0.08
HOLD = 0.12
RECT = 6.0
PEN = (1.0, 2.9)
PEN_EDGE = (0.15, 0.3)
RIM = 0.2

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


def ramp01(v):
    v = np.clip(v, 0, 1)
    return v * v * (3 - 2 * v)


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
    far = np.clip((size - 3.0) / 5.0, 0, 1)
    half = size / 2
    # the penumbra: one small step outward on the ground from the middle of the spot, brought into the picture
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
    inner = np.where(inside, 1.0, inner).astype(np.float32)
    # how deep in the bright ground, on the ground: the rows of the picture are drawn apart by how much the view
    # flattens a cell there (not more than RECT times), the distance from the lanes is taken in that picture
    # and brought back. It is rounded off like the other, so the ridge in the middle of a cell is no crease.
    ratio = np.clip(np.where(ok & (tall > 0), wide / np.maximum(tall, 1e-3), 1.0), 1.0, RECT)
    # (the middle value of the pixels of the row that lie on the ground: a row that is half sky has no say)
    per_row = np.array([np.median(a[o]) if o.any() else np.nan for a, o in zip(ratio, ok)])
    seen_rows = np.where(~np.isnan(per_row))[0]
    per_row = np.interp(np.arange(h), seen_rows, per_row[seen_rows])
    ys = np.concatenate([[0.0], np.cumsum(per_row)])
    mids = ((ys[:-1] + ys[1:]) / 2).astype(np.float32)
    h2 = int(np.ceil(ys[-1]))
    rows = np.interp(np.arange(h2) + 0.5, mids, np.arange(h)).astype(np.float32)
    cols = np.arange(w, dtype=np.float32)
    # the edge of the spot is no lane here: a front would run along it as one long line
    drawn = cv2.remap((lane & ~inside).astype(np.uint8), np.tile(cols, (h2, 1)), np.repeat(rows[:, None], w, 1), cv2.INTER_NEAREST)
    far_depth = cv2.distanceTransform(1 - drawn, cv2.DIST_L2, 5)
    deep = cv2.remap(far_depth, np.tile(cols, (h, 1)), np.repeat((mids - 0.5)[:, None], w, 1), cv2.INTER_LINEAR)
    # against the size of a cell there, and so that the middle of the median cell of this picture stands at
    # 1 / FULL: the two pictures then agree where they meet, whatever size each of them calls a cell
    deep = deep / np.maximum(wide, 1.0)
    tops = ndi.maximum(deep, labels, idx)
    mid = float(np.median(tops[tops > 0]))
    deep = np.clip(deep / (mid * FULL), 0, 1).astype(np.float32)
    deep = by_level([cv2.GaussianBlur(deep, (0, 0), sg) for sg in LEVELS], np.interp(np.log(rounded), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32))
    deep = np.where(cells, deep, 0).astype(np.float32)
    if name == 'apron':
        # Where the plate lies over this picture the fronts must run as they do on the plate, or a line shows
        # where the two meet: each picture finds its own lanes, and they are not the same lanes. So the depth
        # of the plate is laid into this picture wherever the plate is drawn, and gives way to this picture's
        # own over LEAD of the image's height in front of the line where the plate ends. The plate is made first.
        theirs = cv2.imread(f'{OUT}/full/cells-plate.png')[..., 0].astype(np.float32) / 255
        hp, wp = theirs.shape
        z = np.maximum(-p[..., 2], 1e-3)
        ix = (p[..., 0] / z / (2 * TX) + 0.5 - LEFT) / SPAN
        iy = (0.5 - p[..., 1] / z / (2 * TY) - TOP) / SPAN
        qx = (ix * wp - 0.5).astype(np.float32)
        qy = ((iy * CANVAS[1] - PLATE_TOP) / (CANVAS[1] - PLATE_TOP) * hp - 0.5).astype(np.float32)
        theirs = cv2.remap(theirs, qx, qy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

        def ramp(v):
            v = np.clip(v, 0, 1)
            return v * v * (3 - 2 * v)
        front = A['front']
        line = front['side'] + (front['centre'] - front['side']) * (1 - ramp((np.abs(ix - front['at']) - front['span'][0]) / (front['span'][1] - front['span'][0])))
        share = (1 - ramp((iy - line - LEAD[0]) / (LEAD[1] - LEAD[0]))) * ramp(ix / A['feather']) * ramp((1 - ix) / A['feather']) * ramp(qy / (0.03 * hp)) * (p[..., 2] < 0) * ok
        deep = (deep + (theirs - deep) * share).astype(np.float32)
        print('apron: share of the picture that takes the depth of the plate', round(float(share.mean()), 3))
    # the stream: down the slope of that depth, from the middle of a cell to its lanes, as a direction on the
    # ground (x along the rows of the picture, y down the picture, both in cell sizes of the place, so the
    # shader turns it into the picture by the size a cell has there). Its length is the slope itself: one on
    # the flank of a cell, nil in the middle and in the lane, since the depth is rounded there.
    dist = (deep * wide * (mid * FULL)).astype(np.float32)
    dist = by_level([cv2.GaussianBlur(dist, (0, 0), sg) for sg in LEVELS], np.interp(np.log(np.maximum(size * EASE, LEVELS[0])), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32))
    sx = -cv2.Sobel(dist, cv2.CV_32F, 1, 0, ksize=3) / 8
    sy = -cv2.Sobel(dist, cv2.CV_32F, 0, 1, ksize=3) / 8 / per_row[:, None].astype(np.float32)
    grip = np.clip(deep / HOLD, 0, 1)
    grip = grip * grip * (3 - 2 * grip) * np.clip((size - 3.0) / 5.0, 0, 1)
    # at the edge of the spot the depth ends in a step, which is no slope of the ground: the stream of the
    # cells comes in over RIM core radii outside it
    grip = grip * ramp01((r - PEN[1]) / RIM)
    long = np.maximum(np.hypot(sx, sy), 1.0)
    sx = np.where(cells, sx / long * grip, 0)
    sy = np.where(cells, sy / long * grip, 0)
    # the penumbra: outward along the ground from the middle of the spot, nil at the dark core, in the same
    # measure (a step on the ground, in cell sizes of the place). At the edge of the spot it hands over to
    # the stream of the cells without a ring of rest between: it is half its strength at the edge and nil
    # RIM core radii outside it, where the cells' stream has come in whole.
    ox = px_per[..., 0] / np.maximum(wide, 1e-3)
    oy = px_per[..., 1] / np.maximum(tall, 1e-3)
    on = np.maximum(np.hypot(ox, oy), 1e-6)
    out = ramp01((r - PEN[0]) / PEN_EDGE[0]) * (1 - 0.5 * ramp01((r - (PEN[1] - RIM)) / RIM)) * (1 - ramp01((r - PEN[1]) / RIM)) * ok
    out = np.where(r < PEN[1], out, 0.5 * (1 - ramp01((r - PEN[1]) / RIM)) * ok)
    sx = sx + out * ox / on
    sy = sy + out * oy / on
    flow = np.zeros((h, w, 3), np.uint8)
    flow[..., 0] = np.round(128 + 127 * np.clip(sx, -1, 1))
    flow[..., 1] = np.round(128 + 127 * np.clip(sy, -1, 1))
    flow[..., 2] = np.round(255 * np.clip(deep, 0, 1))
    print(name, 'stream: mean length on the cells', round(float(np.hypot(sx, sy)[cells].mean()), 3), 'share over 0.5', round(float((np.hypot(sx, sy)[cells] > 0.5).mean()), 3))
    # the two numbers of a cell. Both are laid softly over the edges the flood drew, so that no edge of the
    # flood can show: a number of the cell's rate (blue of the first picture) and a point on the unit circle
    # (red and green of the second), whose angle is the cell's phase and whose length falls to zero where
    # neighbours disagree, in the spot and where no cell is known. The shader lets the life fade with that length.
    quiet = np.where(inside | (labels == 0), 0.0, 1.0).astype(np.float32)
    ns = np.maximum(size * NUMBER, 1.0)
    ln = np.interp(np.log(ns), np.log(LEVELS), np.arange(len(LEVELS))).astype(np.float32)

    def soften(v):
        return by_level([cv2.GaussianBlur(v.astype(np.float32), (0, 0), s) for s in LEVELS], ln)
    second = np.where(labels > 0, hash01(cy[lab] + 3.1, cx[lab] + 1.7), 0).astype(np.float32)
    # the shader takes a second number of the cell from its phase, |fract(second + 0.87) * 2 - 1|, and a cell
    # closes if that is small. A cell that is not sure is kept out of that part of the circle.
    second = np.where(sure[labels], second, np.mod(0.78 + 0.7 * second, 1.0)).astype(np.float32)
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
    print(name, 'still pieces', int(still.sum()), 'sure cells', int(sure.sum()))
    print(name, 'middle of the median cell, in cell sizes', round(mid, 3))
    print(name, 'cells', n, 'median half width px', round(float(np.median(half[labels > 0])), 1))
    if check:
        np.savez_compressed(f'{DIR}/dbg-{name}.npz', smooth=smooth, first=first, labels=labels, valley=valley, level=level, size=size, seeds=seeds)
        show = (img * 255).astype(np.uint8).copy()
        show[edge & cells] = (0, 255, 255)
        show[seeds] = (255, 0, 0)
        show[(pen > 0.5) & ok] = (show[(pen > 0.5) & ok] * 0.6 + np.array([0, 60, 110])).astype(np.uint8)
        # the largest cells, each with the lane that would cut it in two across its short side in the picture:
        # the middle of that lane on the ground in cell sizes (what the shader calls g), its turn there and
        # its half length. life.json takes its split sites from this list.
        lay = p - DOWN
        gnd = np.stack([lay @ RIGHT, lay @ FWD], -1)
        ring = np.maximum(np.linalg.norm(gnd, axis=-1), 1e-4)
        g = gnd * (RADIUS * np.arcsin(np.minimum(ring / RADIUS, 1.0)) / ring)[..., None] / CELL
        flat = labels.ravel()
        count = np.maximum(np.bincount(flat, minlength=n + 1), 1).astype(np.float64)

        def mean(v):
            return np.bincount(flat, v.ravel().astype(np.float64), minlength=n + 1) / count
        room = np.bincount(flat, (1.0 / np.maximum(wide * tall, 1e-3)).ravel(), minlength=n + 1)
        mx, my = mean(xx), mean(yy)
        vxx, vyy, vxy = mean(xx * xx) - mx * mx, mean(yy * yy) - my * my, mean(xx * yy) - mx * my
        half = (vxx + vyy) / 2
        root = np.sqrt(np.maximum(half * half - (vxx * vyy - vxy * vxy), 0))
        short = 2 * np.sqrt(np.maximum(half - root, 1e-9))
        turn = 0.5 * np.arctan2(2 * vxy, vxx - vyy) + np.pi / 2
        order = [k for k in np.argsort(-count) if k > 0 and not still[k - 1]][:60]
        print(name, 'the cells that are largest in the picture: number, size in cells, the lane across it as [g x, g y, turn, half length], place in the map')
        for k in order:
            ends = []
            for sign in (-1, 1):
                ex = int(np.clip(mx[k] + sign * short[k] * np.cos(turn[k]), 0, w - 1))
                ey = int(np.clip(my[k] + sign * short[k] * np.sin(turn[k]), 0, h - 1))
                ends.append(g[ey, ex])
            mid, span = (ends[0] + ends[1]) / 2, ends[1] - ends[0]
            print(f'  {k:5d}  size {room[k]:5.2f}  [{mid[0]:.3f}, {mid[1]:.3f}, {np.arctan2(span[1], span[0]):.3f}, {np.hypot(span[0], span[1]) / 2:.3f}]  px {mx[k]:6.0f} {my[k]:6.0f}')
            cv2.putText(show, str(k), (int(mx[k]) - 14, int(my[k]) + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)
        cv2.imwrite(f'{DIR}/cells-{name}-check.jpg', cv2.cvtColor(show, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
        cv2.imwrite(f'{DIR}/cells-{name}-flow.jpg', cv2.cvtColor(flow, cv2.COLOR_RGB2BGR))
        cv2.imwrite(f'{DIR}/cells-{name}-swell.jpg', cv2.cvtColor(swell, cv2.COLOR_RGB2BGR))
        cv2.imwrite(f'{DIR}/cells-{name}-inner.jpg', swell[..., 2])


if __name__ == '__main__':
    make(sys.argv[1], len(sys.argv) > 2)
