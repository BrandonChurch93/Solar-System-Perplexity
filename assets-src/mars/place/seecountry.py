"""Draws the country (height plates of country.py with the colour plates on them) as real ground through the film
camera of a frame, without the engine: every pixel's ray is marched down to the heights. A tool to judge the ground
and its border to the close view early; the film itself is drawn by the engine.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/seecountry.py --frame 2442 --out out/work/place/see/f2442
Colour: the plates are read at the undisplaced direction of the ground point, finest level first, as the globe does.
--relief FILE: a picture of the close view's meshes from the same camera with FILE-depth.npy beside it
(heights.py --frame N --out FILE); the meshes are laid over the country where they are nearer than the country
lowered by --sink km on the ground the seen mask names.
--shade: also OUT-shade.png, the heights alone in grey, lit by the Sun of the scene at the spot (plates.json: country.light.sunMoment,
the globe's own Sun) with the shadows they cast; no colour plate is read for it. It shows what the relief is, apart
from what the colour says; and OUT-lit.png, a preview of the colour plates under that light (plates.json: country.preview).
--law: OUT-lit.png by the law of the globe cap instead (colour times 1 + lift of the heights' normal), for the plates of
relight.py (--colour FOLDER), which carry their cast shadow and no slope light.
Written: OUT.png (country alone), OUT-depth.npy, OUT-where.npy (per pixel, the ground point in degrees east and north
of the spot on the plates' plane) and, with --relief, OUT-both.png.
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--frame', type=int, required=True)
ap.add_argument('--country', default='src/stops/mars/country.json')
ap.add_argument('--levels', default='src/stops/mars/levels.json')
ap.add_argument('--set', default='full')
ap.add_argument('--colour', default='', help='folder with colour plates named as in levels.json, instead of the set')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--scale', type=float, default=1.0, help='frame size as a share of 1920 by 1080')
ap.add_argument('--steps', type=int, default=320)
ap.add_argument('--far', type=float, default=0.003, help='least step along a ray as a share of the distance from the eye')
ap.add_argument('--flat', action='store_true', help='heights off: the plates on the smooth sphere, as before')
ap.add_argument('--relief', default='')
ap.add_argument('--sink', type=float, default=0.05)
ap.add_argument('--shade', action='store_true')
ap.add_argument('--plates', default='assets-src/mars/place/plates.json')
ap.add_argument('--shadow-km', type=float, default=30.0, help='how far toward the Sun a shadow is looked for')
ap.add_argument('--law', action='store_true', help='with --shade: OUT-lit.png is the colour times 1 + lift of the heights, the law of the globe cap for own levels (plates.json: country.light.wrap); for plates of relight.py, which carry their cast shadow')
ap.add_argument('--out', required=True)
a = ap.parse_args()

KM = 3389.5
GEO = geom.load(a.geometry)
pose = next(f for k in ('dive', 'rise') for f in GEO[k]['frames'] if f['frame'] == a.frame)
w, h = int(round(1920 * a.scale)), int(round(1080 * a.scale))
cam = geom.Camera(pose, w, h)
C = json.load(open(a.country))
base = 'public/assets/mars/%s/' % a.set
n, east, north = geom.patch_frame()

hs = []
for L in C['levels']:
    N = L['size'][a.set]
    v = np.fromfile(base + L['height'], '<u2').reshape(N, N).astype(np.float32)
    hs.append((L['widthDeg'], L['low'] + v / 65535 * (L['high'] - L['low']), cv2.imread(base + L['seen'], cv2.IMREAD_GRAYSCALE)))
edge = C['edgeShare']


def plane(d):
    dn = np.maximum(d @ n, 0.05)
    return (d @ east) / dn, (d @ north) / dn


def sample(arr, mx, my):
    """Bilinear read of an array at pixel coordinates (centres at whole numbers), the border held."""
    N = arr.shape[0]
    mx = np.clip(mx, 0, N - 1)
    my = np.clip(my, 0, N - 1)
    x0 = np.minimum(np.floor(mx).astype(np.int64), N - 2)
    y0 = np.minimum(np.floor(my).astype(np.int64), N - 2)
    fx = (mx - x0).astype(np.float32)
    fy = (my - y0).astype(np.float32)
    if arr.ndim == 3:
        fx, fy = fx[:, None], fy[:, None]
    return (arr[y0, x0] * (1 - fx) + arr[y0, x0 + 1] * fx) * (1 - fy) + (arr[y0 + 1, x0] * (1 - fx) + arr[y0 + 1, x0 + 1] * fx) * fy


def lookup(plates, x, y, cut):
    """Reads a ladder of square plates (width, array), coarse to fine, at plane coordinates: each finer level
    replaces the coarser inside it, blended over the outer `cut` share of its half width (0: a hard side)."""
    out = None
    for width, arr in plates:
        t = geom.half_tan(width)
        N = arr.shape[0]
        val = sample(arr, (x / t + 1) / 2 * N - 0.5, (1 - y / t) / 2 * N - 0.5).astype(np.float32)
        m = np.maximum(np.abs(x), np.abs(y)) / t
        wgt = (np.clip((1 - m) / cut, 0, 1) if cut > 0 else (m < 1)).astype(np.float32)
        if out is None:
            out = val
        else:
            ww = wgt[:, None] if val.ndim == 2 else wgt
            out = out * (1 - ww) + val * ww
    return out


px, py = np.meshgrid(np.arange(w) + 0.5, np.arange(h) + 0.5)
d = cam.rays(px.ravel(), py.ravel()).astype(np.float64)
o = cam.p
# the shell that holds all the ground: from its top down to its bottom along each ray
top = 1 + max(L['high'] for L in C['levels']) + 1e-6
b = d @ o
cc = o @ o - top * top
disc = b * b - cc
hit = (disc > 0) & ((b < 0) | (cc < 0))
t = np.where(cc > 0, -b - np.sqrt(np.maximum(disc, 0)), 0.0)
t = np.where(hit, np.maximum(t, 0), 0)
alive = hit.copy()
found = np.zeros(len(t), bool)
prev = t.copy()
heights = [(wd, arr) for wd, arr, _ in hs]


def above(tt, sel):
    p = o + d[sel] * tt[:, None]
    r = np.linalg.norm(p, axis=1)
    dir_ = p / r[:, None]
    x, y = plane(dir_)
    if a.flat:
        return r - 1, x, y, r
    hh = lookup(heights, x, y, 2 * edge)
    # outside the outermost plate the ground is the sphere
    m = np.maximum(np.abs(x), np.abs(y)) / geom.half_tan(heights[0][0])
    hh = np.where(m < 1, hh, 0)
    return r - 1 - hh, x, y, r


for k in range(a.steps):
    sel = np.nonzero(alive & ~found)[0]
    if not len(sel):
        break
    g, x, y, r = above(t[sel], sel)
    under = g <= 0
    found[sel[under]] = True
    go = sel[~under]
    prev[go] = t[go]
    # a step of 0.35 of the height over the ground; along grazing rays never less than a share of the way gone
    t[go] += np.maximum(g[~under] * 0.35, np.maximum(a.far * t[go], 2e-7))
    gone = np.linalg.norm(o + d[go] * t[go][:, None], axis=1) > max(top, np.linalg.norm(o)) + 1e-9
    alive[go[gone]] = False
# halve between the last point above and the first below
sel = np.nonzero(found)[0]
lo, hi = prev[sel].copy(), t[sel].copy()
for k in range(12):
    mid = (lo + hi) / 2
    g, _, _, _ = above(mid, sel)
    up = g > 0
    lo = np.where(up, mid, lo)
    hi = np.where(up, hi, mid)
t[sel] = (lo + hi) / 2
depth = np.full(len(t), np.inf)
depth[sel] = t[sel]

# colour at the undisplaced direction
p = o + d[sel] * t[sel][:, None]
dir_ = p / np.linalg.norm(p, axis=1)[:, None]
x, y = plane(dir_)
lev = json.load(open(a.levels))['levels']
folder = a.colour if a.colour else base
img = np.zeros((len(t), 3), np.float32)
plates = []
for L in lev:
    plate = cv2.imread(folder + ('/' if a.colour else '') + L['file'])
    if plate is None:
        plate = cv2.imread(base + L['file'])
    plates.append((L['widthDeg'], plate))
col = lookup(plates, x, y, 0.12)
img[sel] = col
frame = np.round(np.clip(img.reshape(h, w, 3), 0, 255)).astype(np.uint8)
if not cv2.imwrite(a.out + '.png', np.ascontiguousarray(frame)):
    raise SystemExit('could not write ' + a.out)
np.save(a.out + '-depth.npy', depth.reshape(h, w).astype(np.float32))
where = np.full((len(t), 2), np.nan, np.float32)
where[sel, 0], where[sel, 1] = np.degrees(np.arctan(x)), np.degrees(np.arctan(y))
np.save(a.out + '-where.npy', where.reshape(h, w, 2))
print('frame %d (%s, height %.5f radii): ground on %.4f of the frame' % (a.frame, pose['side'], pose['height'], found.mean()))

if a.shade:
    P = json.load(open(a.plates))['country']
    sun = geom.scene_sun(P['light']['sunMoment'])
    flat_len = np.hypot(sun[0], sun[1])
    ang = float(np.arccos(np.clip(d[0] @ d[1], -1, 1)))
    finest = 2 * geom.half_tan(heights[-1][0]) / heights[-1][1].shape[0]
    e = np.maximum(t[sel] * ang, finest)

    def hat(xx, yy):
        hh = lookup(heights, xx, yy, 2 * edge)
        m = np.maximum(np.abs(xx), np.abs(yy)) / geom.half_tan(heights[0][0])
        return np.where(m < 1, hh, 0)

    h0 = hat(x, y)
    hx = (hat(x + e, y) - hat(x - e, y)) / (2 * e)
    hy = (hat(x, y + e) - hat(x, y - e)) / (2 * e)
    nl = np.sqrt(hx * hx + hy * hy + 1)
    lam = np.clip((-hx * sun[0] - hy * sun[1] + sun[2]) / nl, 0, 1)
    open_ = np.ones(len(sel), np.float32)
    for u in np.geomspace(2 * finest, a.shadow_km / KM, 48):
        uu = np.maximum(u, 2 * e)
        ray = h0 + uu * sun[2] / flat_len
        over = hat(x + sun[0] / flat_len * uu, y + sun[1] / flat_len * uu) - ray
        open_ = np.minimum(open_, np.clip(1 - over / (uu * 0.04), 0, 1))
    grey = np.zeros(len(t), np.float32)
    grey[sel] = 255 * np.clip(0.10 + 0.9 * lam * open_ / sun[2] * 0.55, 0, 1)
    cv2.imwrite(a.out + '-shade.png', np.round(grey.reshape(h, w)).astype(np.uint8))
    # a preview only: the colour plates with this light laid on them (their own painted light is still in them)
    pv = P['preview']
    gain = pv['fill'] + (1 - pv['fill']) * np.minimum(lam * open_ / sun[2], pv['most'])
    if a.law:
        ndl = (-hx * sun[0] - hy * sun[1] + sun[2]) / nl
        gain = 1 + np.clip((ndl - sun[2]) / max(sun[2] + P['light']['wrap'], 0.06), -0.85, 1.6)
    lit = np.zeros((len(t), 3), np.float32)
    lit[sel] = geom.texel_of(geom.scene_of(col[:, ::-1] / 255) * gain[:, None])[:, ::-1] * 255
    cv2.imwrite(a.out + '-lit.png', np.round(np.clip(lit.reshape(h, w, 3), 0, 255)).astype(np.uint8))
    print('   shade: in cast shadow %.3f of the ground, facing away from the Sun %.3f' % (float((open_ < 0.5).mean()), float((lam <= 0).mean())))

if a.relief:
    rel = cv2.imread(a.relief + '.png')
    rd = np.load(a.relief + '-depth.npy')
    if rel.shape[1] != w:
        rel = cv2.resize(rel, (w, h), interpolation=cv2.INTER_AREA)
        rd = cv2.resize(rd, (w, h), interpolation=cv2.INTER_NEAREST)
    # where the seen mask names the close view's own ground, the country sinks and the close view wins
    seen_l = [(wd, m_.astype(np.float32) / 255) for wd, _, m_ in hs]
    sm = np.zeros(len(t), np.float32)
    s_ = lookup(seen_l, x, y, 0.0)
    sm[sel] = s_
    cap = depth.reshape(h, w) + sm.reshape(h, w) * a.sink / KM * 4
    win = np.isfinite(rd) & (rd < cap)
    both = frame.copy()
    both[win] = rel[win]
    cv2.imwrite(a.out + '-both.png', np.ascontiguousarray(both))
    print('   the close view shows on %.4f of the frame' % win.mean())
