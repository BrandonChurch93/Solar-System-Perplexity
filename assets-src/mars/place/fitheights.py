"""The cap's heights fitted to the approved picture: a step on the baked height plates (country-*.bin).

The place has one ground, the globe's cap; the approved picture lies on it by the law of the stop (src/stops/mars/law.ts).
Where the picture comes in, the cap under it must be the picture's own ground to less than a pixel (gap.py measures it). country.py
holds every slope of the cap under slopeMost and calms the picture's ground far out; this step undoes both where the picture's own
eye saw the ground and where the film's lens meets it:

1. Fit. Out to fit.toDeg from the eye's foot (gone by fit.goneDeg) a texel the picture's eye saw takes the picture's own height
   (heights.py --picture-only, hidden ground left out), walls and all. The made ground beside it follows through a membrane over
   fit.joinTexels texels, so no step stands at the border of the seen ground.
2. Sight. Made ground outside the picture's field (left, right and under it, and behind its eye) was never held under any sight line.
   It is lowered, in steps of fit.stepKm, until it stands in front of no ground of the picture for the lenses of fit.eyes (the frame
   of the dive and of the rise at which the surface view takes over, read from geometry.json): no made hill hides the place where the
   film shows the picture whole. Done on a grid of fit.grid texels a side, laid back smooth.
3. Slope. Made ground keeps the limit of country.slopeMost from below (ground.cone_under); the picture's own ground keeps its walls.

In the band at its border a level is moved by what the coarser level was moved by, so the levels stay one ground. The 8.5 degree
level is left as it is (fit.levels names the levels). country.json gets the new low and high of each level.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/fitheights.py --src FOLDER --src-country FILE [--out public/assets/mars]
FOLDER holds the sets with the plates of country.py (full, web); FILE the country.json that belongs to them. The step is not done in
place: it reads the plates of country.py and writes the fitted ones. Values: plates.json, block fit.
"""
import argparse
import json
import os
import subprocess
import sys
import cv2
import numpy as np
import geom
import ground

ap = argparse.ArgumentParser()
ap.add_argument('--plates', default='assets-src/mars/place/plates.json')
ap.add_argument('--country', default='src/stops/mars/country.json', help='written')
ap.add_argument('--src', required=True, help='folder of the sets with the height plates of country.py')
ap.add_argument('--src-country', required=True, help='country.json that belongs to --src')
ap.add_argument('--out', default='public/assets/mars')
ap.add_argument('--work', default='out/work/place/fit')
ap.add_argument('--relief', default='src/stops/mars/relief.json')
ap.add_argument('--close', default='src/stops/mars/close.json')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
a = ap.parse_args()
P = json.load(open(a.plates))
F = P['fit']
C = P['country']
before = json.load(open(a.src_country))
doc = json.loads(json.dumps(before))
R = json.load(open(a.relief))
SEEN = json.load(open(a.close))['law']['seen']
GEO = geom.load(a.geometry)
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(a.work, exist_ok=True)
W, H = R['imageSize']['full']
focal = R['camera']['focalPxFull']
G = GEO['dive']['terrain']
rot = geom.quat_matrix(G['rotation'])
origin = np.array(G['origin'])
scale = G['scale']


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def picture_points(every):
    """The ground the picture's own eye saw, as body points: the layers' distance files inside the picture's field, hidden ground out."""
    boxes = [v['box'] for v in R['layers'].values()]
    sx0, sx1 = min(b['x'] for b in boxes), max(b['x'] + b['w'] for b in boxes)
    sy0, sy1 = min(b['y'] for b in boxes), max(b['y'] + b['h'] for b in boxes)
    seen_map = cv2.imread('public/assets/mars/full/' + SEEN['file'], cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    if json.load(open(a.close))['law']['gap']['on']:
        seen_map = seen_map[:seen_map.shape[0] // 2]  # the upper half: what the picture's eye saw (seenby.py)
    out = []
    for v in R['layers'].values():
        w, h = v['distSize']['full']
        d = np.fromfile(v['files']['full']['dist'], dtype='<f4').reshape(h, w)[::every, ::every]
        b = v['box']
        X, Y = np.meshgrid(b['x'] + (np.arange(w)[::every] + 0.5) * b['w'] / w, b['y'] + (np.arange(h)[::every] + 0.5) * b['h'] / h)
        al = cv2.resize(cv2.imread(v['files']['full']['alpha'], cv2.IMREAD_GRAYSCALE), (w, h), interpolation=cv2.INTER_AREA)[::every, ::every]
        front = cv2.remap(seen_map, ((X - sx0) / (sx1 - sx0) * seen_map.shape[1] - 0.5).astype(np.float32), ((Y - sy0) / (sy1 - sy0) * seen_map.shape[0] - 0.5).astype(np.float32), cv2.INTER_LINEAR)
        ok = np.isfinite(d) & (d > 0) & (al > 127) & (X >= 0) & (X <= W) & (Y >= 0) & (Y <= H) & (d * front / SEEN['nearest'] <= 1)
        ok &= d < 0.93 * R['camera']['horizonDistance']
        r = np.stack([(X - W / 2) / focal, -(Y - H / 2) / focal, -np.ones_like(X)], -1)
        r /= np.linalg.norm(r, axis=-1, keepdims=True)
        out.append((r[ok] * d[ok][:, None] * scale) @ rot.T + origin)
    return np.concatenate(out)


class Lenses:
    """The film's lenses of fit.eyes: per lens the farthest ground of the picture in each cell of its frame."""

    def __init__(self):
        pts = picture_points(F['every'])
        self.cell = F['cellPx']
        self.nx, self.ny = int(np.ceil(1920 / self.cell)), int(np.ceil(1080 / self.cell))
        self.cams = []
        for kind in ('dive', 'rise'):
            lo, hi, step = F['eyes'][kind]
            for pose in GEO[kind]['frames']:
                if pose['frame'] < lo or pose['frame'] > hi or (pose['frame'] - lo) % step:
                    continue
                cam = geom.Camera(pose, 1920, 1080)
                x, y, front = cam.project(pts)
                ok = front & (x >= 0) & (x < 1920) & (y >= 0) & (y < 1080)
                far = np.zeros(self.nx * self.ny, np.float32)
                np.maximum.at(far, (y[ok] / self.cell).astype(np.int64) * self.nx + (x[ok] / self.cell).astype(np.int64), np.linalg.norm(pts[ok] - cam.p, axis=1).astype(np.float32))
                self.cams.append((cam, far))
        print('%d lenses, %d points of the picture' % (len(self.cams), len(pts)))

    def sees(self, points, clear):
        """True where a body point stands in front of ground of the picture for one of the lenses."""
        bad = np.zeros(len(points), bool)
        for cam, far in self.cams:
            x, y, front = cam.project(points)
            ok = front & (x >= 0) & (x < 1920) & (y >= 0) & (y < 1080)
            cell = (np.clip(y, 0, 1079) / self.cell).astype(np.int64) * self.nx + (np.clip(x, 0, 1919) / self.cell).astype(np.int64)
            bad |= ok & (np.linalg.norm(points - cam.p, axis=1) * clear < far[cell])
        return bad


def outside_field(dirs, height):
    """True where a ground point lies outside the field of the picture's own eye (beside it, under it or behind the eye)."""
    local = ((dirs * (1 + height)[..., None] - origin) @ rot) / scale
    z = -local[..., 2]
    zz = np.maximum(z, 1e-9)
    ix = local[..., 0] / zz * focal + W / 2
    iy = H / 2 - local[..., 1] / zz * focal
    return (z <= 0) | (ix < 0) | (ix > W) | (iy < 0) | (iy > H)


lenses = Lenses()
coarser = None
for k, L in enumerate(doc['levels']):
    Wd = L['widthDeg']
    N = L['size']['full']
    B = before['levels'][k]
    cur = B['low'] + np.fromfile('%s/full/%s' % (a.src, B['height']), '<u2').reshape(N, N).astype(np.float64) / 65535 * (B['high'] - B['low'])
    if Wd not in F['levels']:
        # a level that is not fitted keeps its bytes
        coarser = np.zeros((N, N))
        for kind in L['size']:
            os.makedirs('%s/%s' % (a.out, kind), exist_ok=True)
            open('%s/%s/%s' % (a.out, kind, L['height']), 'wb').write(open('%s/%s/%s' % (a.src, kind, B['height']), 'rb').read())
        continue
    if True:
        p = '%s/p%g' % (a.work, Wd)
        if not os.path.exists(p + '-height.npy'):
            subprocess.run([sys.executable, here + '/heights.py', '--width-deg', str(Wd), '--size', str(N), '--most', '256', '--picture-only', '--geometry', a.geometry, '--out', p], check=True, stdout=subprocess.DEVNULL)
        pic = np.load(p + '-height.npy').astype(np.float64)
        picture = np.isfinite(pic)
        deg = Wd / N
        c = (np.arange(N) + 0.5) / N
        xd = np.degrees((2 * c - 1) * geom.half_tan(Wd))
        foot = np.hypot(xd[None, :], xd[:, None])
        # 1. the fit
        w = 1 - smooth((foot - F['toDeg']) / (F['goneDeg'] - F['toDeg']))
        fit = picture & (w > 0)
        far = cv2.distanceTransform((~fit).astype(np.uint8), cv2.DIST_L2, 5)
        known = fit | (far > F['joinTexels'])
        move = ground.membrane(np.where(fit, (pic - cur) * w, 0).astype(np.float32), known).astype(np.float64)
        new = cur + move
        # 2. the sight of the film's lenses, on a coarse grid
        n = F['grid']
        small = cv2.resize(new, (n, n), interpolation=cv2.INTER_AREA)
        made_small = cv2.resize(picture.astype(np.float32), (n, n), interpolation=cv2.INTER_AREA) < 0.01
        dirs = geom.patch_dirs(Wd, n)
        free = made_small & outside_field(dirs, small)
        idx = np.nonzero(free)
        d = dirs[idx]
        h = small[idx].copy()
        live = np.arange(len(h))
        step = F['stepKm'] / ground.KM
        passes = 0
        while len(live) and passes < F['passes']:
            bad = lenses.sees(d[live] * (1 + h[live])[:, None], F['clear'])
            live = live[bad]
            h[live] -= step
            passes += 1
        down = np.zeros((n, n), np.float32)
        down[idx] = small[idx] - h
        lowered = float((down > 0).mean())
        most = float(down.max() * ground.KM)
        # laid back smooth: the lowering spreads by one cell of the grid and is taken where it is deeper
        down = np.maximum(down, cv2.GaussianBlur(cv2.dilate(down, np.ones((3, 3), np.uint8)), (0, 0), 1.0))
        down = cv2.resize(down, (N, N), interpolation=cv2.INTER_CUBIC)
        new = np.where(picture, new, new - np.maximum(down, 0))
        # 3. the slope of the made ground
        under = ground.cone_under(new.astype(np.float32), C['slopeMost'] * np.radians(deg)).astype(np.float64)
        new = np.where(fit, new, under)
        # at the level's border the plate is the coarser level: it moves as that one moved
        border = np.minimum(np.minimum(c[None, :], 1 - c[None, :]), np.minimum(c[:, None], 1 - c[:, None]))
        inner = smooth(border / (C['edgeShare'] / 2)) if k > 0 else np.ones((N, N))
        if k > 0:
            r = geom.half_tan(Wd) / geom.half_tan(doc['levels'][k - 1]['widthDeg'])
            M = coarser.shape[0]
            at = (((2 * c - 1) * r + 1) / 2 * M - 0.5).astype(np.float32)
            below = cv2.remap(coarser.astype(np.float32), np.broadcast_to(at[None, :], (N, N)).copy(), np.broadcast_to(at[:, None], (N, N)).copy(), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            new = cur + (new - cur) * inner + below * (1 - inner)
        coarser = new - cur
        moved = np.abs(new - cur) * ground.KM
        left = np.abs(new - pic)[fit & (w > 0.999)] * ground.KM * 1000
        print('%s: picture ground %.4f of the plate, fitted %.4f; moved more than 5 m on %.4f, most %.0f m; from the picture after the fit: median %.1f m, 99th %.1f m; lowered under the lenses %.4f of the plate in %d passes, most %.2f km' % (L['height'], float(picture.mean()), float(fit.mean()), float((moved > 0.005).mean()), moved.max() * 1000, float(np.median(left)) if len(left) else 0, float(np.percentile(left, 99)) if len(left) else 0, lowered, passes, most))
        gy, gx = np.gradient(new / np.radians(deg))
        shade = np.clip(0.5 + 0.25 * (gx - gy), 0, 1)
        look = np.dstack([shade, shade, shade])
        look[cv2.resize(down, (N, N)) > 0.5 * step] *= [1.0, 0.8, 0.6]
        cv2.imwrite('%s/look-%g.jpg' % (a.work, Wd), np.round(cv2.resize(look, (1024, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8))
    low, high = float(np.floor(new.min() * 1e5) / 1e5), float(np.ceil(new.max() * 1e5) / 1e5)
    for kind, n_ in L['size'].items():
        hk = new if n_ == N else cv2.resize(new, (n_, n_), interpolation=cv2.INTER_AREA)
        v = np.clip(np.round((hk - low) / (high - low) * 65535), 0, 65535).astype('<u2')
        os.makedirs('%s/%s' % (a.out, kind), exist_ok=True)
        v.tofile('%s/%s/%s' % (a.out, kind, L['height']))
    L['low'], L['high'] = low, high
json.dump(doc, open(a.country, 'w'), indent=2)
open(a.country, 'a').write('\n')
