"""How far the two surfaces of the one ground stand apart on the screen where both are drawn.

The approved picture stands on the globe through its own relief (src/terrain/relief.ts) with a share by place and eye
(src/stops/mars/law.ts, values src/stops/mars/close.json law). Under it stands the globe's cap (country-*.bin). Where the
share is strictly between 0 and 1 both are seen, so they must be one ground (the share here is the law's by the level reading
of the texel count, the air, the field and what the picture's eye saw; the reading of the surface's own footprint needs the
screen and is not in this measure, so the law's share is at or under this one): here every relief point with a share between
--from and --to is put into the body frame, the cap's height is read at its place, and both points are drawn through the
film's own globe camera of the frame. Printed per frame: the count of such points in the frame, the largest and the 99th
percentile distance in px of the 1920 by 1080 master, and where in the frame the largest stands. The law is computed here
as law.ts computes it (the same terms, no engine). A point is left out when nearer ground of the relief with a share of a half or more
stands before it in the frame (cells of --cell px, 2 percent of depth to spare): the lens does not see it. --hidden counts them too.

  npx tsx assets-src/mars/place/geometry.ts out/work/place/geometry-now.json; npx tsx out/work/place/geofilm.ts
  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/gap.py --frames 2400-2480:10,2670-2740:10
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--frames', required=True, help='A-B:step or single frames, comma separated')
ap.add_argument('--geometry', default='out/work/place/geometry-film.json')
ap.add_argument('--relief', default='src/stops/mars/relief.json')
ap.add_argument('--country', default='src/stops/mars/country.json')
ap.add_argument('--close', default='src/stops/mars/close.json')
ap.add_argument('--set', default='full')
ap.add_argument('--heights', default='', help='folder of the sets with the height plates (default public/assets/mars)')
ap.add_argument('--every', type=int, default=2, help='every so many samples of the distance grids')
ap.add_argument('--from', dest='lo', type=float, default=0.02)
ap.add_argument('--to', dest='hi', type=float, default=0.98)
ap.add_argument('--eye-dive', default='-0.355,0.097,1.331', help='the eye at the change of view of the dive in the relief frame (set.ts: plan.closePose at the handover time)')
ap.add_argument('--eye-rise', default='0.313,0.233,0.396')
ap.add_argument('--cell', type=float, default=8)
ap.add_argument('--hidden', action='store_true')
ap.add_argument('--no-gap', action='store_true', help='the share without the gap count of the law (law.ts, 5)')
ap.add_argument('--save', default='', help='folder for per frame arrays (x, y, px, share) as npy')
a = ap.parse_args()

R = json.load(open(a.relief))
C = json.load(open(a.country))
LAW = json.load(open(a.close))['law']
GEO = geom.load(a.geometry)
W, H = R['imageSize']['full']
f = R['camera']['focalPxFull']
pitch = np.radians(R['camera']['pitchDeg'])
up = np.array([0, np.cos(pitch), np.sin(abs(pitch))])
smin = 1 / LAW['farthest']
n, east, north = geom.patch_frame()
base = 'public/assets/mars/%s/' % a.set


def sm(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


plates = []
for L in C['levels']:
    N = L['size'][a.set]
    plates.append((L['widthDeg'], L['low'] + np.fromfile((a.heights + '/' + a.set + '/' if a.heights else base) + L['height'], '<u2').reshape(N, N).astype(np.float32) / 65535 * (L['high'] - L['low'])))


def cap_height(x, y):
    out = None
    for width, arr in plates:
        t = geom.half_tan(width)
        N = arr.shape[0]
        mx = np.clip((x / t + 1) / 2 * N - 0.5, 0, N - 1)
        my = np.clip((1 - y / t) / 2 * N - 0.5, 0, N - 1)
        x0 = np.minimum(np.floor(mx).astype(np.int64), N - 2)
        y0 = np.minimum(np.floor(my).astype(np.int64), N - 2)
        fx, fy = mx - x0, my - y0
        val = (arr[y0, x0] * (1 - fx) + arr[y0, x0 + 1] * fx) * (1 - fy) + (arr[y0 + 1, x0] * (1 - fx) + arr[y0 + 1, x0 + 1] * fx) * fy
        m = np.maximum(np.abs(x), np.abs(y)) / t
        wgt = np.clip((1 - m) / C['edgeShare'], 0, 1)
        out = val if out is None else out * (1 - wgt) + val * wgt
    return out


layers = {}
for name, v in R['layers'].items():
    w, h = v['distSize'][a.set if a.set in v['distSize'] else 'full']
    d = np.fromfile(v['files'][a.set]['dist'], dtype='<f4').reshape(h, w)[::a.every, ::a.every]
    b = v['box']
    xs = b['x'] + (np.arange(w)[::a.every] + 0.5) * b['w'] / w
    ys = b['y'] + (np.arange(h)[::a.every] + 0.5) * b['h'] / h
    X, Y = np.meshgrid(xs, ys)
    r = np.stack([(X - W / 2) / f, -(Y - H / 2) / f, -np.ones_like(X)], -1)
    r /= np.linalg.norm(r, axis=-1, keepdims=True)
    al = cv2.resize(cv2.imread(v['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE), (w, h), interpolation=cv2.INTER_AREA)[::a.every, ::a.every]
    ok = np.isfinite(d) & (d > 0) & (al > 127)
    layers[name] = (r[ok] * d[ok][:, None], r[ok], d[ok], X[ok] / W, Y[ok] / H)

# what the picture's own eye saw (seenby.py), as law.ts reads it
SEEN = LAW.get('seen') or {}
boxes = [v['box'] for v in R['layers'].values()]
sx0, sx1 = min(b['x'] for b in boxes), max(b['x'] + b['w'] for b in boxes)
sy0, sy1 = min(b['y'] for b in boxes), max(b['y'] + b['h'] for b in boxes)
if SEEN.get('on'):
    both = cv2.imread(base + SEEN['file'], cv2.IMREAD_GRAYSCALE).astype(np.float32)
    two = bool((LAW.get('gap') or {}).get('on'))  # the file holds the lower half only while the law reads it (seenby.py)
    seen_map = (both[:both.shape[0] // 2] if two else both) / 255
    # |e|: the cap from the picture's ground along the picture's ray, a share of the distance (the work file of seenby.py)
    gap_map = np.nan_to_num(np.abs(np.load('out/work/place/seen/gap-e.npy')), nan=0.0).astype(np.float32)


def bil(m, ix, iy):
    h, w = m.shape
    mx = np.clip((ix * W - sx0) / (sx1 - sx0) * w - 0.5, 0, w - 1)
    my = np.clip((iy * H - sy0) / (sy1 - sy0) * h - 0.5, 0, h - 1)
    ax, ay = np.minimum(mx.astype(np.int64), w - 2), np.minimum(my.astype(np.int64), h - 2)
    fx, fy = mx - ax, my - ay
    return (m[ay, ax] * (1 - fx) + m[ay, ax + 1] * fx) * (1 - fy) + (m[ay + 1, ax] * (1 - fx) + m[ay + 1, ax + 1] * fx) * fy


def ray_gap(p, d, eye, ix, iy, focal_now):
    """Pixels of the master the cap and the picture's ground stand apart along the picture's ray, for the present eye (law.ts, 5)."""
    s = p - eye
    ln = np.linalg.norm(s, axis=1)
    return bil(gap_map, ix, iy) * d * np.linalg.norm(np.cross(p / d[:, None], s / ln[:, None]), axis=1) * focal_now / ln


def seen(ix, iy, d):
    if not SEEN.get('on'):
        return np.ones_like(d)
    h, w = seen_map.shape
    mx = np.clip((ix * W - sx0) / (sx1 - sx0) * w - 0.5, 0, w - 1)
    my = np.clip((iy * H - sy0) / (sy1 - sy0) * h - 0.5, 0, h - 1)
    ax, ay = np.minimum(mx.astype(np.int64), w - 2), np.minimum(my.astype(np.int64), h - 2)
    fx, fy = mx - ax, my - ay
    front = (seen_map[ay, ax] * (1 - fx) + seen_map[ay, ax + 1] * fx) * (1 - fy) + (seen_map[ay + 1, ax] * (1 - fx) + seen_map[ay + 1, ax + 1] * fx) * fy
    return 1 - sm(1, 1 + SEEN['soft'], d * front / SEEN['nearest'])


def frames(text):
    out = []
    for part in text.split(','):
        if '-' in part:
            ab, _, st = part.partition(':')
            lo, hi = ab.split('-')
            out += list(range(int(lo), int(hi) + 1, int(st or 1)))
        else:
            out.append(int(part))
    return out


def edge(ix, iy):
    """The picture's own field: the share by the place in the picture, as law.ts gives it."""
    e = LAW.get('edge')
    if not e or not any(e):
        return np.ones_like(ix)
    out = np.ones_like(ix)
    for v, side, margin in ((ix * W, e[0], -sx0), ((1 - ix) * W, e[1], sx1 - W), ((1 - iy) * H, e[2], sy1 - H)):
        if side > 0:
            out = out * sm(0, 1, (v + margin) / side)
    return out


print('frame  points in frame with a share %.2f to %.2f   largest px   99th px   median px   where the largest stands (x, y of 1920 by 1080)' % (a.lo, a.hi))
for fr in frames(a.frames):
    kind = 'dive' if fr < 2600 else 'rise'
    G = GEO[kind]['terrain']
    rot = geom.quat_matrix(G['rotation'])
    origin = np.array(G['origin'])
    pose = next(x for x in GEO[kind]['frames'] if x['frame'] == fr)
    cam = geom.Camera(pose, 1920, 1080)
    E = (cam.p - origin) @ rot / G['scale']
    ET = np.array([float(v) for v in (a.eye_dive if kind == 'dive' else a.eye_rise).split(',')])
    F = 540 / np.tan(np.radians(pose['vfov']) / 2)
    allpx, allx, ally, alls, allfoot, alldh, allray = [], [], [], [], [], [], []
    got = []
    nx, ny = int(1920 / a.cell) + 1, int(1080 / a.cell) + 1
    nearest = np.full(nx * ny, np.inf)
    for name, (P, r, d, ix, iy) in layers.items():
        bv = P - E
        Dn = np.linalg.norm(bv, axis=1)
        b = bv / Dn[:, None]
        sp = np.maximum(np.abs(r @ up), smin)
        sn = np.maximum(np.abs(b @ up), smin)
        ah = r - np.outer(r @ up, up)
        ah /= np.maximum(np.linalg.norm(ah, axis=1, keepdims=True), 1e-9)
        bh = b - np.outer(b @ up, up)
        bh /= np.maximum(np.linalg.norm(bh, axis=1, keepdims=True), 1e-9)
        c = (ah * bh).sum(1)
        s_ = np.linalg.norm(np.cross(ah, bh), axis=1)
        across = d / f * F / Dn
        along = across / sp * np.sqrt(sn ** 2 * c ** 2 + s_ ** 2)
        tv = P - ET
        sT = np.maximum(np.abs((tv / np.linalg.norm(tv, axis=1)[:, None]) @ up), smin)
        # the same lengths at the eye of T: the count is taken against the limit or the length there, whichever is longer (law.ts, 1)
        Tn = np.linalg.norm(tv, axis=1)
        th = tv / Tn[:, None]
        th = th - np.outer(th @ up, up)
        th /= np.maximum(np.linalg.norm(th, axis=1, keepdims=True), 1e-9)
        acrossT = d / f * F / Tn
        alongT = acrossT / sp * np.sqrt(sT ** 2 * (ah * th).sum(1) ** 2 + np.linalg.norm(np.cross(ah, th), axis=1) ** 2)
        count = np.maximum(across, along) * np.minimum(1, LAW['texel'][0] / np.maximum(acrossT, alongT))
        share = (1 - sm(LAW['texel'][0], LAW['texel'][1], count)) * (1 - sm(LAW['air'][0], LAW['air'][1], sn / sT)) * edge(ix, iy) * seen(ix, iy, d)
        rg = ray_gap(P, d, E, ix, iy, F) if SEEN.get('on') else np.zeros(len(d))
        if (LAW.get('gap') or {}).get('on') and not a.no_gap:
            share = share * (1 - sm(LAW['gap']['px'][0], LAW['gap']['px'][1], rg))
        p = (P * G['scale']) @ rot.T + origin
        x1, y1, front = cam.project(p)
        inframe = front & (x1 > 0) & (x1 < 1920) & (y1 > 0) & (y1 < 1080)
        cell = (np.clip(y1, 0, 1079) / a.cell).astype(np.int64) * nx + (np.clip(x1, 0, 1919) / a.cell).astype(np.int64)
        solid = inframe & (share >= 0.5)
        np.minimum.at(nearest, cell[solid], Dn[solid])
        got.append((p, x1, y1, inframe, cell, Dn, share, rg))
    for p, x1, y1, inframe, cell, Dn, share, rg in got:
        sel = (share > a.lo) & inframe
        if not a.hidden:
            sel &= Dn <= nearest[cell] * 1.02
        if not sel.any():
            continue
        p = p[sel]
        rr = np.linalg.norm(p, axis=1)
        dirs = p / rr[:, None]
        dn = np.maximum(dirs @ n, 0.05)
        q = dirs * (1 + cap_height((dirs @ east) / dn, (dirs @ north) / dn))[:, None]
        x2, y2, _ = cam.project(q)
        allfoot.append(np.degrees(np.arccos(np.clip(dirs @ n, -1, 1))))
        alldh.append((rr - np.linalg.norm(q, axis=1)) * 3389.5)
        allray.append(rg[sel])
        allpx.append(np.hypot(x1[sel] - x2, y1[sel] - y2))
        allx.append(x1[sel])
        ally.append(y1[sel])
        alls.append(share[sel])
    if not allpx or not sum(len(x) for x in allpx):
        print('%5d  none' % fr)
        continue
    px, x, y, s, foot, dh, ray = (np.concatenate(v) for v in (allpx, allx, ally, alls, allfoot, alldh, allray))
    drawn = len(px)
    two_place, two_ray = float((px > 1).mean()), float((ray > 1).mean())
    part = s < a.hi
    px, x, y, s, foot, dh, ray = (v[part] for v in (px, x, y, s, foot, dh, ray))
    if not len(px):
        print('%5d  no point with a share between %.2f and %.2f; of %d points with a share over %.2f: over one px by place %.4f, by the ray %.4f' % (fr, a.lo, a.hi, drawn, a.lo, two_place, two_ray))
        continue
    k = int(np.argmax(px))
    print('%5d  %8d   %8.2f   %7.2f   %7.2f   (%4.0f, %4.0f)   share over one px: %.3f | by the ray: largest %.2f, 99th %.2f | of %d points with a share over %.2f: over one px by place %.4f, by the ray %.4f' % (fr, len(px), px.max(), np.percentile(px, 99), np.median(px), x[k], y[k], float((px > 1).mean()), ray.max(), np.percentile(ray, 99), drawn, a.lo, two_place, two_ray))
    if a.save:
        np.save('%s/gap-%d.npy' % (a.save, fr), np.stack([x, y, px, s, foot, dh]).astype(np.float32))
