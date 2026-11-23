"""Measures the globe's own light on the plates at the handover frame and lays it back onto every plate.

Two ungraded stills of the globe side with the place picture off are rendered with every level filled by one flat
value (flat.sh). In scene values the globe shows G = a * s + h for a plate scene value s: a is shade, tint,
extinction and gain, h is the haze the globe adds. Both come out per pixel from the two stills. A plate that
shall show the picture's scene value c under this light must hold s = (c - h) / a.
Written: <out>-<width>.npy for every plate, float32 [size, size, 6] = a (b g r) and h (b g r), and the same in
frame space as <out>-frame.npy.
  python3 assets-src/mars/place/light.py --flat out/work/place/cal/flat-77.png,77 --flat2 out/work/place/cal/flat-179.png,179 --close out/work/place/cal/c.png --out out/work/place/cal/light
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--flat', required=True)
ap.add_argument('--flat2', required=True)
ap.add_argument('--close', default='')
ap.add_argument('--out', required=True)
ap.add_argument('--kind', default='dive')
ap.add_argument('--spec', default='assets-src/mars/place/plates.json')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--size', type=int, default=1024)
ap.add_argument('--widths', default='')
a = ap.parse_args()
g = geom.load(a.geometry)
W, H = g['format']['width'], g['format']['height']
cam = geom.Camera(g[a.kind]['twin'], W, H)


def scene(path):
    return geom.to_linear(cv2.imread(path, cv2.IMREAD_COLOR).astype(np.float32) / 255)


def flat(arg):
    path, value = arg.split(',')
    return scene(path), float(geom.scene_of(np.float32(int(value) / 255)))


G1, s1 = flat(a.flat)
G2, s2 = flat(a.flat2)
py, px = np.mgrid[0:H, 0:W]
pts, hit = cam.hit(cam.rays(px + 0.5, py + 0.5))
A = np.maximum((G2 - G1) / (s2 - s1), 1e-5)
Hz = np.maximum(G1 - A * s1, 0)
ok = hit & (G2.max(axis=2) < 0.98)
print('flat scene values %.4f and %.4f' % (s1, s2))
rows = [int(H * k) for k in (0.3, 0.4, 0.5, 0.65, 0.8, 0.95)]
for y in rows:
    sel = ok[y]
    if sel.any():
        print('row %4d: light a (b g r) %s  haze h (b g r) %s' % (y, np.round(A[y][sel].mean(axis=0), 3), np.round(Hz[y][sel].mean(axis=0), 4)))
if a.close:
    C = scene(a.close)
    need = (C - Hz) / A
    under = (C < Hz)[ok]
    print('share of the ground where the globe haze alone is brighter than the close side, b g r: %s' % np.round(under.mean(axis=0), 3))
    print('plate scene value needed, percentiles 5 50 95 99 (b g r):')
    for q in (5, 50, 95, 99):
        print('  %2d: %s' % (q, np.round(np.percentile(need[ok], q, axis=0), 4)))
both = np.dstack([A, Hz]).astype(np.float32)
# beyond the rim of the body in the frame take the nearest ground row above the horizon line
fill = both.copy()
for x in range(W):
    col = ok[:, x]
    if col.any():
        first = int(np.argmax(col))
        fill[:first + 2, x] = both[min(first + 2, H - 1), x]
both = cv2.GaussianBlur(fill, (0, 0), 1.5)
np.save(a.out + '-frame.npy', both)
spec = json.load(open(a.spec))
widths = [float(x) for x in a.widths.split(',')] if a.widths else [p['widthDeg'] for p in spec['plates']]
for w in widths:
    d = geom.patch_dirs(w, a.size)
    fx, fy, front = cam.project(d)
    lay = cv2.remap(both, (fx - 0.5).astype(np.float32), (fy - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    np.save('%s-%g.npy' % (a.out, w), lay.astype(np.float32))
print('wrote', a.out, 'for', widths)
