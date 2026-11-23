"""Fills the ground the picture's eye never saw in a height plate of heights.py, by code.

  python3 assets-src/mars/place/fillheights.py --in out/work/place/height/h0.7 --width-deg 0.7 --out out/work/place/height/f0.7
A hole (the back of a ridge, the ground behind a mesa) first takes a smooth membrane hung between the seen ground
round it (push and pull through a pyramid). Then every filled point is tested against the picture: put into the eye
of the close view, it must lie behind what that eye saw in its pixel (or outside the picture). Where it would have
been seen it is lowered step by step until it is hidden, and the lowered ground is smoothed again from below. So
ground made here can never stand in front of the close view's own meshes, and from above it is a slope that falls
away behind the crest the eye saw, not a sheet stretched from one point.
Written: OUT-height.npy (no holes), OUT-made.png (white where the height is made), OUT-look.jpg (shaded relief from
the Sun's side, the made ground tinted).
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--in', dest='src', required=True)
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--set', default='full')
ap.add_argument('--relief', default='src/stops/mars/relief.json')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--step-km', type=float, default=0.05, help='how far a point that would be seen is lowered per pass')
ap.add_argument('--passes', type=int, default=200)
ap.add_argument('--clear', type=float, default=1.01, help='a made point must be at least this many times farther from the eye than what the eye saw')
ap.add_argument('--sun', default='0.38,-0.92,0.35', help='the Sun in the plate: east, north, up')
ap.add_argument('--picture-only', action='store_true', help='the eye saw only the approved picture, not the margins painted round it (use with heights.py --picture-only)')
ap.add_argument('--out', required=True)
a = ap.parse_args()

KM = 3389.5
R = json.load(open(a.relief))
G = geom.load(a.geometry)['dive']['terrain']
rot = geom.quat_matrix(G['rotation'])
origin = np.array(G['origin'])
scale = G['scale']
W, H = R['imageSize']['full']
th = np.tan(np.radians(R['camera']['vfovDeg']) / 2)

height = np.load(a.src + '-height.npy')
seen = np.isfinite(height)
N = height.shape[0]
dirs = geom.patch_dirs(a.width_deg, N)

# what the eye saw: the nearest distance of the three layers on one grid over the picture and its margins
b0 = R['layers']['L0']['box']
gw, gh = R['layers']['L0']['distSize'][a.set]
near = np.full((gh, gw), np.inf, np.float32)
for name in R['drawOrder']:
    L = R['layers'][name]
    dw, dh = L['distSize'][a.set]
    dist = np.fromfile(L['files'][a.set]['dist'], np.float32).reshape(dh, dw)
    alpha = cv2.resize(cv2.imread(L['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE), (dw, dh), interpolation=cv2.INTER_AREA)
    b = L['box']
    x0 = int(round((b['x'] - b0['x']) / b0['w'] * gw))
    y0 = int(round((b['y'] - b0['y']) / b0['h'] * gh))
    w = int(round(b['w'] / b0['w'] * gw))
    h = int(round(b['h'] / b0['h'] * gh))
    d = cv2.resize(dist, (w, h), interpolation=cv2.INTER_LINEAR)
    al = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR) > 127
    x1, y1 = min(x0 + w, gw), min(y0 + h, gh)
    part = near[y0:y1, x0:x1]
    d = np.where(al[:y1 - y0, :x1 - x0], d[:y1 - y0, :x1 - x0], np.inf)
    near[y0:y1, x0:x1] = np.minimum(part, d)
if a.picture_only:
    cx = b0['x'] + (np.arange(gw) + 0.5) / gw * b0['w']
    cy = b0['y'] + (np.arange(gh) + 0.5) / gh * b0['h']
    near[~(((cx >= 0) & (cx <= W))[None, :] & ((cy >= 0) & (cy <= H))[:, None])] = np.inf
# the horizon band is haze on the sky: no ground was seen there
near[near > 0.93 * R['camera']['horizonDistance']] = np.inf


def would_be_seen(hh, where):
    p = dirs[where] * (1 + hh[where])[:, None]
    local = ((p - origin) @ rot) / scale
    z = -local[:, 2]
    ix = (local[:, 0] / np.maximum(z, 1e-9) / (th * W / H) + 1) / 2 * W
    iy = (1 - local[:, 1] / np.maximum(z, 1e-9) / th) / 2 * H
    gx = ((ix - b0['x']) / b0['w'] * gw - 0.5)
    gy = ((iy - b0['y']) / b0['h'] * gh - 0.5)
    inside = (z > 0) & (gx >= 0) & (gx <= gw - 1) & (gy >= 0) & (gy <= gh - 1)
    xi = np.clip(np.round(gx), 0, gw - 1).astype(np.int64)
    yi = np.clip(np.round(gy), 0, gh - 1).astype(np.int64)
    saw = near[yi, xi]
    return inside & np.isfinite(saw) & (np.linalg.norm(local, axis=1) < saw * a.clear)


def membrane(values, known):
    """Push and pull: the known values stay, the rest takes the smooth mean of what is known round it."""
    v = [np.where(known, values, 0).astype(np.float32)]
    w = [known.astype(np.float32)]
    while min(v[-1].shape) > 1:
        v.append(cv2.resize(v[-1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))
        w.append(cv2.resize(w[-1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))
    out = v[-1] / np.maximum(w[-1], 1e-6)
    for k in range(len(v) - 2, -1, -1):
        up = cv2.resize(out, (v[k].shape[1], v[k].shape[0]), interpolation=cv2.INTER_LINEAR)
        up = cv2.GaussianBlur(up, (0, 0), 1.0)
        wk = np.clip(w[k] * 4, 0, 1)
        out = up * (1 - wk) + (v[k] / np.maximum(w[k], 1e-6)) * wk
    return np.where(known, values, out)


filled = membrane(np.nan_to_num(height), seen)
made = ~seen
idx = np.nonzero(made)
low = np.zeros(height.shape, bool)
step = a.step_km / KM
count = 0
for k in range(a.passes):
    bad = would_be_seen(filled, idx)
    if not bad.any():
        break
    count = k + 1
    filled[idx[0][bad], idx[1][bad]] -= step
    low[idx[0][bad], idx[1][bad]] = True
# the lowered ground keeps its ceiling; smooth it from below so no step of the passes is left
soft = cv2.GaussianBlur(filled, (0, 0), 2.0)
filled = np.where(made, np.minimum(filled, soft), filled)
left = would_be_seen(filled, idx).mean() if len(idx[0]) else 0.0
np.save(a.out + '-height.npy', filled.astype(np.float32))
cv2.imwrite(a.out + '-made.png', (made * 255).astype(np.uint8))

sun = np.array([float(x) for x in a.sun.split(',')])
sun /= np.linalg.norm(sun)
texel = np.radians(a.width_deg) / N
gy, gx = np.gradient(filled, texel)
nrm = np.dstack([-gx, gy, np.ones_like(gx)])
nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
shade = np.clip(nrm @ sun, 0, 1) / max(sun[2], 1e-6) * 0.6
lo, hi = np.percentile(filled, [1, 99])
grey = 0.35 + 0.65 * np.clip((filled - lo) / max(hi - lo, 1e-9), 0, 1)
look = np.clip(np.dstack([grey * shade] * 3), 0, 1)
look[made] = look[made] * np.array([1.0, 0.82, 0.7])
cv2.imwrite(a.out + '-look.jpg', np.round(look * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
print('%g deg: made %.4f of the plate; lowered under the eye\'s sight on %.4f of it in %d passes (the most by %.2f km); still seen %.5f of the made ground; height %.2f to %.2f km' % (
    a.width_deg, made.mean(), low.mean(), count, (np.nan_to_num(membrane(np.nan_to_num(height), seen)) - filled).max() * KM, left, filled.min() * KM, filled.max() * KM))
