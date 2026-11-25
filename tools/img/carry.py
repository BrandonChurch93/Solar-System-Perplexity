#!/usr/bin/env python3
"""The pattern of a pair of frames read by one law: the pair is first carried by the camera's own map, taken from a depth picture and the pose
of each frame (carry: a pure function of depth and pose, the turn of each body taken out, the sky by the camera's rotation alone); the reading
by the map alone is taken there (alone); the flow then runs on the carried pair and finds only what is left; the reading after both is taken
(read). Which of the two is the number of a row is the caller's: in place is at the same point of the matter, so the map alone on a rigid
body, the map and then the flow on a body whose drawer names in the record that its surface moves by itself (bodies[].flows, px a film
frame; own_flow), within that. Called by smooth.py when a pictures job asks for it; main's reader does not pass through here. A row is
refused where over APART of the body's pixels arrive on their own body at another distance than the other frame holds there: the reading is
a 99th percentile, so one pixel in a hundred carried onto a surface it does not belong to can set it alone (a second ground in the range
picture, a moon before the body that the record does not name); and where the flow left over the body, its median, is over BULK_PX and
what its drawer names for the surface's own motion: the range does not carry the pattern."""
import os
import sys
import warnings

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import smooth as S  # noqa: E402

STEPS = 2
LOWEST = -3 * STEPS
SAME = 0.02
BULK_PX = 8.0
APART = 0.01
NOT_CARRIED = 'the range does not carry the pattern'
TWO_GROUNDS = 'two grounds'
FLOW_PX = 0.5
BOUND_PX = 3.0
SURE_SHARE = 0.1
CARRIED_SHARE = 0.5
GRAZE = 0.25
RULES = ('map', 'sky', 'flow')
UNIT = [0.0, 0.0, 0.0, 1.0]


def spin(q, v):
    """The vectors v turned by the quaternion q (x, y, z, w)."""
    u = np.asarray(q[:3], dtype=np.float64)
    v = np.asarray(v, dtype=np.float64)
    t = 2 * np.cross(u, v)
    return v + q[3] * t + np.cross(u, t)


def back(q):
    return [-q[0], -q[1], -q[2], q[3]]


def lens(pose, shape):
    return shape[0] / 2 / np.tan(np.radians(pose['vfov']) / 2)


def rays(pose, shape, q=None):
    """The ray of every pixel as a unit vector in the frame the pose stands in (or turned by q instead of the pose's own quaternion)."""
    h, w = shape
    k = lens(pose, shape)
    xs, ys = S.places(shape)
    v = np.stack([(xs + 0.5 - w / 2) / k, (h / 2 - ys - 0.5) / k, -np.ones(shape, dtype=np.float32)], axis=-1).astype(np.float64)
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    return spin(pose['q'] if q is None else q, v)


def ball(pose, shape):
    """A depth picture made from the pose alone, for the frames that have none of the render: the distance along the ray of every pixel to the
    unit sphere of the stop (the flattened globe when the pose names it), or to its rings in front of it, and which body that is (1 the globe,
    2 the rings, 0 none), with the bodies of the pose record: the globe turns by the pose's turn, the rings do not."""
    ray = rays(pose, shape)
    p = np.array(pose['p'], dtype=np.float64)
    globe = pose.get('globe')
    if globe:
        gq = np.array(globe['quaternion'], dtype=np.float64)
        gs = np.array(globe['scale'], dtype=np.float64)
        own = lambda x: spin(back(gq), x) / gs
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
    depth = np.where(hit, front, np.nan)
    which = hit.astype(np.int32)
    rings = pose.get('rings')
    if rings:
        n = np.array(rings['normal'], dtype=np.float64)
        n /= np.linalg.norm(n)
        with np.errstate(all='ignore'):
            far = -(p @ n) / (ray @ n)
            radius = np.linalg.norm(p + ray * far[..., None], axis=-1)
            ring = np.isfinite(far) & (far > 0) & (radius >= rings['inner']) & (radius <= rings['outer']) & ~(hit & (front < far))
        depth = np.where(ring, far, depth)
        which[ring] = 2
    return depth, which


def told(pose):
    """The pose with its bodies: as the record of the render names them (camera: p, q, vfov; sky: q; range; bodies: place, turn), or the globe
    of the stop at its centre with the pose's turn, and its rings."""
    if pose.get('camera'):
        return {**pose['camera'], 'sky': (pose.get('sky') or {}).get('q'), 'range': pose.get('range'), 'bodies': pose['bodies']}
    if pose.get('bodies'):
        return pose
    return {**pose, 'bodies': [{'place': [0, 0, 0], 'turn': pose.get('turn') or UNIT}, {'place': [0, 0, 0], 'turn': UNIT}]}


def form(body):
    """The drawn shape of a body at its frame as a matrix of the pose frame, None where the record names none: a point g of the turned body
    stands at place + shape g. The shape sits outside the body's turn."""
    return np.array(body['shape'], dtype=np.float64).reshape(3, 3) if body.get('shape') else None


def plain(body, x):
    """A point of the pose frame about the body's place with its drawn shape taken out."""
    f = form(body)
    v = x - np.array(body['place'], dtype=np.float64)
    return v if f is None else v @ np.linalg.inv(f).T


def formed(body, g):
    f = form(body)
    return g if f is None else g @ f.T


def carry(depth, which, a, b):
    """The camera's own map from a frame to another: for every pixel of the frame with the pose a its place in the frame with the pose b, in
    pixels of the same grid. depth is the distance from the lens along the pixel's ray to the surface it shows, which names the body the
    surface belongs to (0: no body, the sky; v: bodies[v - 1] of both poses). A point of a body keeps its place on the body: it is taken into
    the body's own frame with the body's place, drawn shape and turn at a and out of it with those at b (the shape, where the record names
    one, sits outside the turn: a point g of the turned body stands at place + shape g). The sky has no place, only a direction, and is
    carried by the camera's rotation alone (the pose's sky quaternion when it has one). Poses: p, q (x, y, z, w; the camera looks down its
    own minus z), vfov in degrees, bodies: [{place, turn}], all in one frame. Gives the places x and y, the distance of the carried point
    from the lens of b (nan for the sky), and where the point lies before that lens and inside its frame."""
    h, w = depth.shape
    ka, kb = lens(a, depth.shape), lens(b, depth.shape)
    xs, ys = S.places(depth.shape)
    cam = np.stack([(xs + 0.5 - w / 2) / ka, (h / 2 - ys - 0.5) / ka, -np.ones(depth.shape, dtype=np.float32)], axis=-1).astype(np.float64)
    cam /= np.linalg.norm(cam, axis=-1, keepdims=True)
    there = np.full(depth.shape + (3,), np.nan)
    far = np.full(depth.shape, np.nan)
    solid = (which > 0) & np.isfinite(depth) & (depth > 0)
    sky = ~solid
    there[sky] = spin(back(b.get('sky') or b['q']), spin(a.get('sky') or a['q'], cam[sky]))
    pa, pb = np.array(a['p'], dtype=np.float64), np.array(b['p'], dtype=np.float64)
    for v in np.unique(which[solid]):
        m = solid & (which == v)
        ba, bb = a['bodies'][v - 1], b['bodies'][v - 1]
        x = pa + spin(a['q'], cam[m]) * depth[m][:, None]
        x = np.array(bb['place'], dtype=np.float64) + formed(bb, spin(bb['turn'], spin(back(ba['turn']), plain(ba, x))))
        far[m] = np.linalg.norm(x - pb, axis=-1)
        there[m] = spin(back(b['q']), x - pb)
    with np.errstate(all='ignore'):
        mx = there[..., 0] / -there[..., 2] * kb + w / 2 - 0.5
        my = h / 2 - 0.5 - there[..., 1] / -there[..., 2] * kb
    held = (there[..., 2] < 0) & (mx >= 0) & (mx <= w - 1) & (my >= 0) & (my <= h - 1)
    return np.where(held, mx, xs).astype(np.float32), np.where(held, my, ys).astype(np.float32), far, held


def met(mx, my, far, held, which, depth, body):
    """Where a carried pixel of a body arrives on its own body (own), and where the distance to the lens there is the one the picture holds
    at that place or beside it, to SAME of it (at)."""
    solid = (body > 0) & np.isfinite(depth) & (depth > 0)
    near = cv2.erode(np.where(solid, depth, np.inf).astype(np.float32), np.ones((3, 3), np.uint8))
    wide = cv2.dilate(np.where(solid, depth, 0).astype(np.float32), np.ones((3, 3), np.uint8))
    take = lambda x: cv2.remap(x, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)
    lo, hi, on = take(near), take(wide), take(np.where(solid, body, 0).astype(np.float32))
    ground = (which > 0) & np.isfinite(far)
    own = held & ground & (on == which)
    with np.errstate(all='ignore'):
        at = own & (far >= lo * (1 - SAME)) & (far <= hi * (1 + SAME))
    return own, at, held & ~ground & (on == 0)


def seen(mx, my, far, held, which, depth, body):
    """Where a carried pixel arrives on the surface it left: depth and body are the depth picture of the frame it arrives in. The body there is
    its own and the distance to the lens is the one the picture holds at that place or beside it, to SAME of it; the sky arrives on sky. What
    is covered in the frame it arrives in, or was covered where it left, is not seen."""
    _, at, sky = met(mx, my, far, held, which, depth, body)
    return at | sky


def hidden(mx, my, held, which, depth, body):
    """Where a carried pixel of the sky arrives on a body of the frame it is carried into: the body stands before that sky there, the sky is
    covered and nothing of the pair can be read on it."""
    solid = ((body > 0) & np.isfinite(depth) & (depth > 0)).astype(np.float32)
    return held & (which == 0) & (cv2.remap(solid, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) > 0)


def grown(mx, my, held):
    """How many times larger the carried frame is drawn than it was, per pixel, from the slopes of the map: under 1 where it is drawn smaller,
    1 where the map has no slope to read."""
    def slopes(m):
        dx = np.zeros(m.shape, np.float32)
        dy = np.zeros(m.shape, np.float32)
        dx[:, 1:-1] = (m[:, 2:] - m[:, :-2]) / 2
        dy[1:-1, :] = (m[2:, :] - m[:-2, :]) / 2
        return dx, dy

    whole = np.zeros(held.shape, bool)
    whole[1:-1, 1:-1] = held[1:-1, 1:-1] & held[1:-1, 2:] & held[1:-1, :-2] & held[2:, 1:-1] & held[:-2, 1:-1]
    a, b = slopes(mx)
    c, d = slopes(my)
    g = 1 / np.sqrt(np.maximum(np.abs(a * d - b * c), 1e-6))
    g[~whole] = 1
    return cv2.medianBlur(g.astype(np.float32), 5)


def drawn(full, scale, mx, my, step, levels):
    """The frame full, at its full size, carried along the map mx, my of the pictures reduced to scale: each pixel from the picture reduced to
    scale times 2 ** (step / STEPS), in which a pixel of the frame is as large as the pixel it is carried onto."""
    h, w = step.shape
    out = np.zeros(step.shape, np.float32)
    for k in np.unique(step):
        if k not in levels:
            levels[k] = S.small(full, scale * 2 ** (k / STEPS)).astype(np.float32)
        rx, ry = levels[k].shape[1] / w, levels[k].shape[0] / h
        here = step == k
        out[here] = cv2.remap(levels[k], (mx + 0.5) * rx - 0.5, (my + 0.5) * ry - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[here]
    return out


def stepped(g, scale):
    top = int(np.floor(STEPS * np.log2(1 / scale) + 1e-9))
    return np.clip(np.rint(STEPS * np.log2(np.maximum(g, 1e-6))), LOWEST, top).astype(int)


def rim(which, margin):
    """The rim of a depth picture: what lies within the margin of the edge between a surface and none, on both sides of it. There the air
    stands between the lens and the ground at its longest and the depth of a grazing ray moves the most; the edge of the frame is no rim."""
    if margin < 1:
        return np.zeros(which.shape, bool)
    solid = (which > 0).astype(np.uint8)
    box = np.ones((2 * int(round(margin)) + 1,) * 2, np.uint8)
    return (cv2.dilate(solid, box, borderType=cv2.BORDER_CONSTANT, borderValue=0) > 0) & ~(cv2.erode(solid, box, borderType=cv2.BORDER_CONSTANT, borderValue=1) > 0)


def detail(g, wide, floor):
    """A picture reduced to its detail for the flow: what lies between 1 px and the wide window, divided by its local contrast (never by less
    than the floor), about a middle grey. A light that lies smoothly over the ground is not in it, so a flow on it has only the ground to
    follow."""
    soft = lambda x, s: cv2.GaussianBlur(x.astype(np.float32), (0, 0), s)
    d = soft(g, 1.0) - soft(g, wide)
    c = np.sqrt(np.maximum(soft(d * d, wide), 0))
    return np.clip(128 + 48 * d / np.maximum(c, floor), 0, 255)


def slant(depth, which, a, b):
    """How steeply each pixel of a body is seen, in the frame with the pose a and in the frame with the pose b it is carried into: the cosine
    of the angle between the ray and the line from the body's place through the point (1 straight down, 0 along the ground); nan off the
    bodies. Under GRAZE the lens looks through GRAZE ** -1 times the depth of whatever lies over the ground, and that is a light bound to the
    view's angle, not the ground."""
    h, w = depth.shape
    ka = lens(a, depth.shape)
    xs, ys = S.places(depth.shape)
    cam = np.stack([(xs + 0.5 - w / 2) / ka, (h / 2 - ys - 0.5) / ka, -np.ones(depth.shape, dtype=np.float32)], axis=-1).astype(np.float64)
    cam /= np.linalg.norm(cam, axis=-1, keepdims=True)
    here, there = np.full(depth.shape, np.nan), np.full(depth.shape, np.nan)
    solid = (which > 0) & np.isfinite(depth) & (depth > 0)
    pa, pb = np.array(a['p'], dtype=np.float64), np.array(b['p'], dtype=np.float64)
    unit = lambda v: v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-12)
    for v in np.unique(which[solid]):
        m = solid & (which == v)
        ba, bb = a['bodies'][v - 1], b['bodies'][v - 1]
        ray = spin(a['q'], cam[m])
        x = pa + ray * depth[m][:, None]
        here[m] = -(ray * unit(x - np.array(ba['place'], dtype=np.float64))).sum(-1)
        up = formed(bb, spin(bb['turn'], spin(back(ba['turn']), plain(ba, x))))
        there[m] = -(unit(np.array(bb['place'], dtype=np.float64) + up - pb) * unit(up)).sum(-1)
    return here, there


def pair(a, full, scale, way, same, which, covered=None, wide=None, floor=1.0, bound=BOUND_PX, skip=None):
    """The frame a against another frame carried onto it: first by the camera's map (way: mx, my, far, held of carry; same: seen), from the
    finer picture of the other frame where the map draws it larger (full() gives it at its full size); then the flow between a and the carried
    picture finds what is left, and the other frame is carried once more along the map and that flow. The flow is taken on the detail of the
    two (detail, with the wide window), so that it cannot follow a light, is smoothed over the wide window, weighted by where the flow and its
    way back agree, and is bounded: no pixel is moved by more than bound px of the reduced picture. Where the flow and its way back do not
    agree within the wide window it carries nothing and the map stands alone; a pixel within half the wide window of one that does not arrive on the surface it left,
    or in skip, has no say in it. Gives the carried picture, where the pair is judged, the rule of
    each pixel (0 none, 1 the map, 2 the sky by the camera's rotation, 3 the flow: what the flow moved by more than FLOW_PX; what the map does
    not hold and the flow does not move is covered and not judged, and what is covered by the range picture itself is not judged whatever
    the flow finds), the size of the flow as it was found, before the bound, the picture carried by the map alone, and where the flow and its
    way back agree."""
    mx, my, far, held = way
    step = stepped(grown(mx, my, held), scale)
    g, levels = full(), {}
    first = np.where(held, drawn(g, scale, mx, my, step, levels), a)
    xs, ys = S.places(a.shape)
    wide = wide or 10.0
    da, db = detail(a, wide, floor), detail(first, wide, floor)
    f, r = S.motion(da, db), S.motion(db, da)
    nx, ny, inside, agree = S.along(f, r, xs, ys)
    size = np.hypot(f[..., 0], f[..., 1])
    lands = cv2.remap(held.astype(np.float32), nx, ny, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.99
    sure = held & inside & agree & lands
    soft = lambda x: cv2.GaussianBlur(x.astype(np.float32), (0, 0), wide)
    reach = 2 * int(round(wide / 2)) + 1
    sure &= ~(cv2.dilate((held & ~same).astype(np.uint8), np.ones((reach, reach), np.uint8)) > 0)
    if skip is not None:
        sure &= ~skip
    weight = (sure & (size <= bound)).astype(np.float32)
    heavy = soft(weight)
    fx, fy = soft(f[..., 0] * weight) / np.maximum(heavy, 1e-3), soft(f[..., 1] * weight) / np.maximum(heavy, 1e-3)
    over = np.maximum(np.hypot(fx, fy) / bound, 1)
    fx, fy = fx / over, fy / over
    use = held & (heavy >= SURE_SHARE)
    use &= cv2.remap(held.astype(np.float32), xs + fx, ys + fy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.99
    sx = np.where(use, cv2.remap(mx, xs + fx, ys + fy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), mx)
    sy = np.where(use, cv2.remap(my, xs + fx, ys + fy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), my)
    b = drawn(g, scale, sx, sy, step, levels)
    moved = use & (np.hypot(fx, fy) > FLOW_PX)
    if covered is not None:
        moved &= ~covered
    still = same & ~moved
    rule = np.zeros(a.shape, np.uint8)
    rule[moved] = 3
    rule[still & (which > 0)] = 1
    rule[still & (which == 0)] = 2
    return b, rule > 0, rule, size, first, sure


def block(p, value, rule):
    """The rule that holds the largest block of a reading: the largest joined area of pixels that read the value of the row (its 99th
    percentile) or more, and the rule most of its pixels stand under."""
    hot = (np.isfinite(p) & (np.nan_to_num(p, nan=-1) >= value)).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(hot, connectivity=8)
    if count < 2:
        return None
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    held = np.bincount(rule[labels == largest], minlength=4)[1:]
    return RULES[int(np.argmax(held))]


def own_flow(a, b, span):
    """How far the surface of the stop's body may move by itself between the two frames, in px of the frame: the largest speed its drawer
    names in the record (bodies[0].flows, px a film frame at that frame's range) times the film frames between them (span); None where neither
    record names one: the body is rigid."""
    told = [f['pose']['bodies'][0].get('flows') for f in (a, b) if f['pose'].get('bodies')]
    told = [float(x) for x in told if x is not None]
    return max(told) * span if told and span else None


def lit(pose, shape):
    """Where the light of a body reaches, by its drawer: every pixel whose ray passes a body nearer than its light (bodies[].light, radii of
    the body from its centre); None where no body of the pose names one."""
    told = [(body, float(body['light'])) for body in pose.get('bodies') or [] if body.get('light') is not None]
    if not told:
        return None
    ray, p = rays(pose, shape), np.array(pose['p'], dtype=np.float64)
    out = np.zeros(shape, bool)
    for body, light in told:
        c = np.array(body['place'], dtype=np.float64) - p
        t = ray @ c
        out |= ((c @ c - t * t) <= light * light) & ((t > 0) | (c @ c <= light * light))
    return out


def read(a, b, margin, scale, wide, floor, span=None):
    """The pattern of a pair of frames by the one law, read on the nearer of the two (the one the camera's map draws the other larger on; the
    first when neither is). a and b: for each frame its reduced picture (grey), full() its picture at full size, its depth picture and bodies
    at the reduced size (depth, which) and its pose. Nothing is judged on the rim of either depth picture (rim, margin px of the reduced size),
    nor where either frame sees the body's ground at a cosine under GRAZE (slant).
    span: the film frames between the two. Gives the value (the 99th percentile), the place of the largest in px of the full size of
    the frame read on, the share of the frame judged, which frame it is read on (0 the first, 1 the other), the share of the judged pixels
    under each rule, the rule of the largest block, and the 99th percentile of the flow, in px of the full size, on what the map holds; alone:
    the reading by the map alone, before any flow, on the bodies (the whole frame's where no body holds enough of it); moves: how far the
    surface may move by itself (own_flow); moved: the 99th percentile of the flow on the body's judged pixels, in px of the full size; bound:
    the most the flow may move a pixel, in px of the full size (BOUND_PX of the reduced picture and what the surface may move by itself);
    graze: the share of the body, less its rim, left out for its angle; sure: the share of the body's pixels where the flow and its way back
    agree, and the flow's numbers (bulk, left, moved) are taken on those alone, bulk none under SURE_SHARE."""
    on = 0
    way = carry(a['depth'], a['which'], a['pose'], b['pose'])
    g = grown(*way[:2], way[3])
    if way[3].any() and np.median(g[way[3]]) < 1:
        on, a, b = 1, b, a
        way = carry(a['depth'], a['which'], a['pose'], b['pose'])
    same = seen(*way, a['which'], b['depth'], b['which'])
    picture = a['grey'].astype(np.float32)
    moves = own_flow(a, b, span)
    bound = BOUND_PX + (moves or 0) * scale
    edge = rim(a['which'], margin) | (cv2.remap(rim(b['which'], margin).astype(np.float32), way[0], way[1], cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE) > 0.5)
    here, there = slant(a['depth'], a['which'], a['pose'], b['pose'])
    with np.errstate(invalid='ignore'):
        low = (a['which'] > 0) & ((here < GRAZE) | (there < GRAZE))
    later, ok, rule, size, first, sure = pair(picture, b['full'], scale, way, same, a['which'], hidden(way[0], way[1], way[3], a['which'], b['depth'], b['which']), wide, floor, bound, edge | low)
    inner = (a['which'] > 0) & ~edge
    edge |= low
    rule[edge] = 0
    ok &= ~edge
    p = S.pattern(picture, later, ok, wide / 5, wide, floor)
    value, at, share = S.patterned(p)
    out = {'value': value, 'at': [int(round(at[0] / scale)), int(round(at[1] / scale))] if at else None, 'share': share, 'on': on, 'by': None, 'rule': None, 'left': None, 'units': None, 'bulk': None, 'apart': None, 'no': None, 'refused': None, 'body': None, 'sky': None, 'alone': None, 'moves': moves, 'moved': None, 'bound': bound / scale, 'graze': float((low & inner).sum() / inner.sum()) if inner.any() else None, 'sure': None}
    q = S.pattern(picture, first, same & way[3] & ~edge, wide / 5, wide, floor)
    for part in (np.isfinite(q) & (a['which'] > 0), np.isfinite(q)):
        if out['alone'] is None and part.mean() >= S.PATTERN_SHARE:
            out['alone'] = float(np.percentile(q[part], 99))
    body = way[3] & (a['which'] > 0) & ~edge
    own, met_at, _ = met(*way, a['which'], b['depth'], b['which'])
    if body.any():
        out['sure'] = float((sure & body).sum() / body.sum())
        if out['sure'] >= SURE_SHARE:
            out['bulk'] = float(np.median(size[sure & body]) / scale)
    if (own & ~edge).any():
        out['apart'] = float((own & ~met_at & ~edge).sum() / (own & ~edge).sum())
    if out['bulk'] is not None and out['bulk'] > BULK_PX + (out['moves'] or 0) and out['sure'] >= CARRIED_SHARE:
        out['no'] = NOT_CARRIED
    elif out['apart'] is not None and out['apart'] > APART:
        out['no'] = TWO_GROUNDS
    if value is None:
        return out, (p, later, rule)
    judged = np.isfinite(p)
    for name, part in (('body', judged & (a['which'] > 0)), ('sky', judged & (a['which'] == 0))):
        if part.mean() >= S.PATTERN_SHARE:
            out[name] = float(np.percentile(p[part], 99))
    counts = np.bincount(rule[judged], minlength=4)[1:]
    out['by'] = {name: float(counts[i] / max(counts.sum(), 1)) for i, name in enumerate(RULES)}
    out['rule'] = block(p, value, rule)
    held = judged & same & (rule > 0) & sure
    out['left'] = float(np.percentile(size[held], 99) / scale) if held.any() else None
    if (held & (a['which'] > 0)).any():
        out['moved'] = float(np.percentile(size[held & (a['which'] > 0)], 99) / scale)
    if a.get('unit') is not None:
        out['units'] = [float((judged & (a['unit'] == i)).sum() / judged.sum()) for i in range(len((a['pose'].get('range') or {}).get('units') or [1]))]
    if out['no']:
        out['refused'], out['value'] = value, None
    return out, (p, later, rule)


def packed(depth, form, unit=1.0):
    """A depth as the render packs it into 8 bit colour: n = 1 + floor(16777214 * (log2(depth / unit) - low) / octaves) in red, green and blue,
    the highest bits in red; black is no surface. unit: the size of the unit the layer counts in, a number or one for each pixel."""
    with np.errstate(all='ignore'):
        n = 1 + np.floor(16777214 * np.clip((np.log2(depth / unit) - form['low']) / form['octaves'], 0, 1))
    n = np.where(np.isfinite(depth) & (depth > 0), n, 0).astype(np.int64)
    return np.stack([n >> 16, (n >> 8) & 255, n & 255], axis=-1).astype(np.uint8)


def shaped(body, x):
    """A point in the body's own frame with its scale taken out: there the body is the unit sphere."""
    return spin(back(body.get('axes') or UNIT), plain(body, x)) / np.array(body.get('scale') or [1, 1, 1], dtype=np.float64)


def ranged(rgb, pose, shape):
    """The depth picture of the render at the reduced size: the distance along each pixel's ray in the units of the pose, nan where there is no
    surface (packed has the form; the pose's range: low, octaves, units), and which of the units each pixel was taken in (-1: no surface).
    A layer of the render hands its range in its own units, and the record names them all: of each pixel the unit is taken that puts its
    point nearest the surface of the pose's first body, and never one that puts it nearer than the lens can draw (the pose's near, when it
    names one). A reduced pixel takes the median of the pixels it covers and the unit of most of
    them when half of them or more show a surface, and none otherwise."""
    form = pose['range']
    n = (rgb[..., 0].astype(np.int64) << 16) | (rgb[..., 1].astype(np.int64) << 8) | rgb[..., 2].astype(np.int64)
    raw = np.where(n > 0, 2.0 ** (form['low'] + (n - 1) / 16777214 * form['octaves']), np.nan)
    units = form.get('units') or [form.get('unit', 1.0)]
    d = raw * units[0]
    unit = np.zeros(raw.shape, dtype=np.int32)
    if len(units) > 1:
        ray = rays(pose, raw.shape)
        p = np.array(pose['p'], dtype=np.float64)
        near = pose.get('near') or 0
        miss = lambda value: np.where(raw * value < near, np.inf, np.abs(np.linalg.norm(shaped(pose['bodies'][0], p + ray * (raw * value)[..., None]), axis=-1) - 1))
        with np.errstate(all='ignore'):
            off = miss(units[0])
            for i, value in enumerate(units[1:], 1):
                other = miss(value)
                nearer = other < off
                d, unit, off = np.where(nearer, raw * value, d), np.where(nearer, i, unit), np.where(nearer, other, off)
    unit = np.where(np.isfinite(d), unit, -1)
    h, w = shape
    fy, fx = d.shape[0] // h, d.shape[1] // w
    if fy < 1 or fx < 1 or d.shape != (h * fy, w * fx):
        ys = np.clip(np.rint((np.arange(h) + 0.5) * d.shape[0] / h - 0.5).astype(int), 0, d.shape[0] - 1)
        xs = np.clip(np.rint((np.arange(w) + 0.5) * d.shape[1] / w - 0.5).astype(int), 0, d.shape[1] - 1)
        return d[ys][:, xs], unit[ys][:, xs]
    cells = lambda x: x.reshape(h, fy, w, fx).transpose(0, 2, 1, 3).reshape(h, w, fy * fx)
    with np.errstate(all='ignore'), warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)
        mid = np.nanmedian(cells(d), axis=-1)
    most = np.stack([(cells(unit) == i).sum(-1) for i in range(len(units))], axis=-1).argmax(-1)
    surface = np.isfinite(cells(d)).sum(-1) * 2 >= fy * fx
    return np.where(surface, mid, np.nan), np.where(surface, most, -1).astype(np.int32)


def source(pose, shape, picture=None):
    """The depth, the bodies and the units of a frame at the reduced size: from the depth picture of the render when the job names one (every
    surface is the first body of the pose record), else made from the pose (ball; no units then)."""
    if picture:
        depth, unit = ranged(np.asarray(Image.open(picture).convert('RGB')), pose, shape)
        return depth, np.isfinite(depth).astype(np.int32), unit
    return ball(pose, shape) + (None,)


def panels(a, b, margin, scale, wide, floor):
    """A pair as the reader takes it, six pictures in a row: the frame read on, the other frame as it is, the other frame carried onto it by
    the camera's map and the flow, the difference of the two times 4, the rule of each pixel (green the map, blue the sky, orange the flow,
    black not judged), and the change of the pattern (white is 1). Gives the reading and the row."""
    out, (p, later, rule) = read(a, b, margin, scale, wide, floor)
    on, other = (b, a) if out['on'] else (a, b)
    grey = lambda x: np.repeat(np.clip(x, 0, 255).astype(np.uint8)[..., None], 3, axis=2)
    judged = np.isfinite(p)
    colours = np.array([[0, 0, 0], [40, 170, 60], [50, 90, 220], [240, 150, 30]], np.uint8)
    by = colours[np.where(judged, rule, 0)]
    diff = np.where(rule > 0, np.abs(later - on['grey']) * 4, 0)
    row = np.concatenate([grey(on['grey']), grey(other['grey']), grey(np.where(rule > 0, later, 0)), grey(diff), by, grey(np.nan_to_num(p) * 255)], axis=1)
    return out, row
