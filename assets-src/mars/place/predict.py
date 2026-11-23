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
a = ap.parse_args()
levels = [float(x) for x in a.levels.split(',')]
sizes = [int(x) for x in a.sizes.split(',')] if a.sizes else [a.size] * len(levels)
f0, f1 = [float(x) for x in a.fade.split(',')]
g = geom.load(a.geometry)
W, H = g['format']['width'], g['format']['height']


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def frame(pose):
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
    gd = np.sqrt(np.maximum((gx1 - gx0) ** 2 + (gy1 - gy0) ** 2, (gx2 - gx0) ** 2 + (gy2 - gy0) ** 2))
    front = dn > 0.3
    parent = texels.copy()
    weights = []
    for wdeg, size in zip(levels, sizes):
        scale = 1 / (2 * geom.half_tan(wdeg))
        q = np.maximum(np.abs(gx0 * scale), np.abs(gy0 * scale))
        w = front * smoothstep(0.5, 0.5 - a.feather, q) * (1 - smoothstep(f0, f1, parent))
        parent = gd * scale * size
        texels = np.where(w >= 0.5, parent, texels)
        weights.append(float(np.max(np.where(ok, w, 0))) if ok.any() else 0.0)
    n = int(ok.sum())
    soft = int((ok & (texels < 1.0)).sum())
    return n, soft, weights


print('levels', levels, 'sizes', sizes)
for kind in ('hold', 'dive', 'rise'):
    rows = g[kind] if kind == 'hold' else g[kind]['frames']
    worst = 0.0
    bad = []
    for r in rows[::a.every]:
        if r.get('side') == 'terrain':
            continue
        n, soft, weights = frame(r)
        share = soft / max(n, 1)
        worst = max(worst, share)
        if share > 0.02:
            bad.append(r['frame'])
        if a.verbose or kind == 'hold' or share > 0.02:
            print(kind, r['frame'], 'h %.5f' % (np.linalg.norm(r['position']) - 1), 'soft %.4f' % share, 'weights', ' '.join('%.2f' % w for w in weights))
    print(kind, 'worst soft share %.4f' % worst, 'frames over 0.02:', bad)
