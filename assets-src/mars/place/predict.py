"""Predicts the texel density of the patch pyramid for every frame of the Mars dive and rise (G13) by casting the
film camera's rays and repeating the planet shader's density math. No render.
  python3 assets-src/mars/place/predict.py [--levels 96,48,24,12,3] [--size 4096] [--frames hold] [--every 1]
"""
import argparse
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--levels', default='96,48,24,12,3')
ap.add_argument('--sizes', default='')
ap.add_argument('--size', type=int, default=4096)
ap.add_argument('--map-width', type=int, default=8192)
ap.add_argument('--fade', default='1.02,1.5')
ap.add_argument('--feather', type=float, default=0.12)
ap.add_argument('--every', type=int, default=1)
ap.add_argument('--grid', type=int, default=8)
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--verbose', action='store_true')
ap.add_argument('--centres', default='', help='per level centre as east:north in degrees from the spot, comma separated, empty entries are 0:0')
ap.add_argument('--no-place', action='store_true', help='leave the place picture out of the count')
ap.add_argument('--minor', action='store_true', help='levels fade in by the minor axis of the footprint (asked of the engine), capped by --aniso')
ap.add_argument('--aniso', type=float, default=16)
ap.add_argument('--place-frames', type=int, default=-1, help='override placeFrames of both handovers')
ap.add_argument('--max-enlarge', type=float, default=3)
ap.add_argument('--enlarge-soft', type=float, default=0.5)
ap.add_argument('--seen', type=float, default=0.5)
ap.add_argument('--edge', type=float, default=0.8)
a = ap.parse_args()
levels = [float(x) for x in a.levels.split(',')]
sizes = [int(x) for x in a.sizes.split(',')] if a.sizes else [a.size] * len(levels)
f0, f1 = [float(x) for x in a.fade.split(',')]
centres = [(0.0, 0.0)] * len(levels)
if a.centres:
    centres = [tuple(np.tan(np.radians(float(v))) for v in c.split(':')) if c else (0.0, 0.0) for c in a.centres.split(',')]
g = geom.load(a.geometry)
W, H = g['format']['width'], g['format']['height']


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def place_weight(kind, f):
    """placeWeight of src/director/handover.ts at the start of frame f."""
    h = g[kind]['handover']
    n = a.place_frames if a.place_frames >= 0 else (h['firstFrame'] - h['placeFirstFrame'] if kind == 'dive' else h['placeLastFrame'] - h['lastFrame'])
    if kind == 'dive':
        first = h['firstFrame'] - n
        if f < first or f > h['lastFrame']:
            return 0.0
        return 1.0 if f >= h['firstFrame'] or n == 0 else smooth((f - first) / n)
    last = h['lastFrame'] + n
    if f < h['firstFrame'] or f > last:
        return 0.0
    return 1.0 if f <= h['lastFrame'] or n == 0 else smooth((last + 1 - f) / n)


def place_cover(kind, pose, pts, px, py, weight):
    """Where the texels view of src/core/place.ts counts the pixel from the place picture (k > 0.5), and its texels there
    (the close side is taken as 1 texel per picture pixel or more)."""
    twin = geom.Camera(g[kind]['twin'], W, H)
    lay = g[kind]['layout']
    cam_p = np.array(pose['position'])
    h_cam = np.linalg.norm(cam_p) - 1
    h_twin = np.linalg.norm(twin.p) - 1

    def pic(p):
        x, y, front = twin.project(p)
        u, v = geom.picture_xy(lay, x, y)
        return u, v, front

    u0, v0, front = pic(pts[0])
    u1, v1, _ = pic(pts[1])
    u2, v2, _ = pic(pts[2])
    dx = np.stack([u1 - u0, v1 - v0], -1)
    dy = np.stack([u2 - u0, v2 - v0], -1)
    s1 = np.sum(dx * dx, -1) + np.sum(dy * dy, -1)
    det = dx[..., 0] * dy[..., 1] - dx[..., 1] * dy[..., 0]
    least = np.sqrt(np.maximum(0.5 * (s1 - np.sqrt(np.maximum(s1 * s1 - 4 * det * det, 0))), 1e-12))
    sharp = 1 - smoothstep(a.max_enlarge, a.max_enlarge * (1 + a.enlarge_soft), lay['scale'] / least)
    n = pts[0]
    own = np.sum(n * (cam_p - n), -1)
    honest = np.sum(n * (twin.p - n), -1) / np.maximum(own, 1e-30) * (h_cam / h_twin)
    k = weight * front * smoothstep(0, a.seen, honest) * sharp
    for dist, margin in ((u0, lay['left']), (lay['width'] - u0, lay['right']), (lay['height'] - v0, lay['bottom']), (v0, lay['top'])):
        e = np.clip((dist - 0.5) / max(a.edge * (margin * lay['scale'] - 1), 1e-3), 0, 1)
        k = k * e * e * (3 - 2 * e)
    return k > 0.5, np.sqrt(np.maximum(np.sum(dx * dx, -1), np.sum(dy * dy, -1)))


def frame(pose, kind='hold'):
    cam = geom.Camera(pose, W, H)
    xs = np.arange(a.grid / 2, W, a.grid)
    ys = np.arange(a.grid / 2, H, a.grid)
    px, py = np.meshgrid(xs, ys)

    def at(dx, dy):
        d = cam.rays(px + dx, py + dy)
        pts, ok = cam.hit(d)
        gx, gy, dn = geom.to_patch(pts)
        return pts, ok, gx, gy, dn

    p0, ok0, gx0, gy0, dn = at(0, 0)
    p1, ok1, gx1, gy1, _ = at(1, 0)
    p2, ok2, gx2, gy2, _ = at(0, 1)
    ok = ok0 & ok1 & ok2
    ddx = np.sum((p1 - p0) ** 2, axis=-1)
    ddy = np.sum((p2 - p0) ** 2, axis=-1)
    texels = np.sqrt(np.maximum(ddx, ddy)) * a.map_width / (2 * np.pi)
    ax, ay = (gx1 - gx0) ** 2 + (gy1 - gy0) ** 2, (gx2 - gx0) ** 2 + (gy2 - gy0) ** 2
    gd = np.sqrt(np.maximum(ax, ay))
    if a.minor:
        det = (gx1 - gx0) * (gy2 - gy0) - (gy1 - gy0) * (gx2 - gx0)
        s1 = ax + ay
        least = np.sqrt(np.maximum(0.5 * (s1 - np.sqrt(np.maximum(s1 * s1 - 4 * det * det, 0))), 1e-30))
        fade_d = np.maximum(least, gd / a.aniso)
    else:
        fade_d = gd
    front = dn > 0.3
    parent = texels.copy()
    weights = []
    for wdeg, size, (ce, cn) in zip(levels, sizes, centres):
        scale = 1 / (2 * geom.half_tan(wdeg))
        q = np.maximum(np.abs((gx0 - ce) * scale), np.abs((gy0 - cn) * scale))
        w = front * smoothstep(0.5, 0.5 - a.feather, q) * (1 - smoothstep(f0, f1, parent))
        parent = fade_d * scale * size
        texels = np.where(w >= 0.5, gd * scale * size, texels)
        weights.append(float(np.max(np.where(ok, w, 0))) if ok.any() else 0.0)
    covered = np.zeros_like(ok)
    weight = 0.0 if kind == 'hold' or a.no_place else place_weight(kind, pose['frame'])
    if weight > 0.5:
        covered, pt = place_cover(kind, pose, (p0, p1, p2), px, py, weight)
        covered &= ok
        texels = np.where(covered, pt, texels)
    n = int(ok.sum())
    soft = int((ok & (texels < 1.0)).sum())
    return n, soft, weights, int(covered.sum()), int((ok & ~covered & (texels < 1.0)).sum())


print('levels', levels, 'sizes', sizes)
for kind in ('hold', 'dive', 'rise'):
    rows = g[kind] if kind == 'hold' else g[kind]['frames']
    worst = 0.0
    bad = []
    for r in rows[::a.every]:
        if r.get('side') == 'terrain':
            continue
        n, soft, weights, cov, soft_globe = frame(r, kind)
        share = soft / max(n, 1)
        worst = max(worst, share)
        if share > 0.02:
            bad.append(r['frame'])
        if a.verbose or kind == 'hold' or share > 0.02:
            print(kind, r['frame'], 'h %.5f' % (np.linalg.norm(r['position']) - 1), 'soft %.4f' % share, 'place %.3f' % (cov / max(n, 1)), 'weights', ' '.join('%.2f' % w for w in weights))
    print(kind, 'worst soft share %.4f' % worst, 'frames over 0.02:', bad)
