"""What the approved picture's own eye sees: public/assets/mars/{full,web}/relief-seen.png.

The close view's layers overlap in the picture: the far layer (L0) runs on behind the near ones (L1, L2) as drawn out ground, which
the surface view needs when its eye stands beside the picture's eye, and which the picture's eye never saw. On the globe's ground
that hidden ground is not the place: the law of the stop (src/stops/mars/law.ts) leaves it out. This file tells it where: one
channel over the layers' boxes taken together (left to right, top to bottom as the picture), --scale of the full picture's pixels
a texel. Where two layers stand at one place of the picture the value is 255 x nearest / (front x (1 + spare)), front the distance
of the nearest of them from the picture's eye (the layers' own distance files) and nearest the value of --nearest; where one layer
or none stands it is 0. A ground point of the relief at distance d is seen when d x value / 255 / nearest is at or under 1.
The lower half of the file (the same field again, under the first) is how far the cap stands from the picture's ground along the
picture's own ray: e = (c - front) / front, c the distance from the picture's eye at which that ray meets the cap (the height plates
of the cap, country.json and the full set's bins, marched from the eye), front as above for every place where a layer stands. Stored
as 128 + 127 x sign(e) x sqrt(|e| / gap.range), so the steps are fine about 0; 128 where no layer stands, the ends where the ray
meets no cap or e leaves the range. The law reads from it how many pixels apart the two surfaces stand for the present eye
(law.ts, the gap), none for the picture's own eye. Run after fitheights.py: the map is of the heights as they stand.
The lower half goes into the file only while close.json law.gap.on is true (the law reads it only then); the measure of it is
printed and kept as a work file for gap.py either way, so the table of the gap can be made without the bytes in the set.
No generated input: the distance files and the alpha files of the relief, src/stops/mars/relief.json, the cap's height plates.

  python3 assets-src/mars/place/seenby.py            (values: src/stops/mars/close.json, block law.seen)
"""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'relief.json')))
LAW = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'close.json')))['law']
K = LAW['seen']
boxes = [v['box'] for v in R['layers'].values()]
x0 = min(b['x'] for b in boxes)
x1 = max(b['x'] + b['w'] for b in boxes)
y0 = min(b['y'] for b in boxes)
y1 = max(b['y'] + b['h'] for b in boxes)
w, h = int(round((x1 - x0) / K['scale'])), int(round((y1 - y0) / K['scale']))
front = np.full((h, w), np.inf, np.float32)
count = np.zeros((h, w), np.int32)
for name, v in R['layers'].items():
    dw, dh = v['distSize']['full']
    d = np.fromfile(os.path.join(ROOT, v['files']['full']['dist']), dtype='<f4').reshape(dh, dw)
    al = cv2.imread(os.path.join(ROOT, v['files']['full']['alpha']), cv2.IMREAD_GRAYSCALE)
    b = v['box']
    # the layer's box in texels of the file written
    bx, by, bw, bh = (b['x'] - x0) / K['scale'], (b['y'] - y0) / K['scale'], b['w'] / K['scale'], b['h'] / K['scale']
    X, Y = np.meshgrid((np.arange(w) + 0.5 - bx) / bw, (np.arange(h) + 0.5 - by) / bh)
    inside = (X > 0) & (X < 1) & (Y > 0) & (Y < 1)
    mx, my = (X * dw - 0.5).astype(np.float32), (Y * dh - 0.5).astype(np.float32)
    dd = cv2.remap(d, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    aa = cv2.remap(al, (X * al.shape[1] - 0.5).astype(np.float32), (Y * al.shape[0] - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    there = inside & (aa > 127) & np.isfinite(dd) & (dd > 0)
    front = np.where(there, np.minimum(front, dd), front)
    count += there
    print(name, 'stands on %.3f of the field, distance %.2f to %.2f' % (float(there.mean()), float(dd[there].min()), float(dd[there].max())))
two = count >= 2
value = np.where(two, 255 * K['nearest'] / (front * (1 + K['spare'])), 0)
if value.max() > 255:
    raise SystemExit('nearest %.3f is over the nearest front %.3f' % (K['nearest'], float(front[two].min())))
out = np.clip(np.round(value), 0, 255).astype(np.uint8)

# the lower half: the cap along the picture's own rays
GAP = LAW['gap']
C = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json')))
G = geom.load(os.path.join(ROOT, 'out', 'work', 'place', 'geometry.json'))['dive']['terrain']
rot, origin, scale = geom.quat_matrix(G['rotation']), np.array(G['origin']), G['scale']
nrm, east, north = geom.patch_frame()
W, H = R['imageSize']['full']
focal = R['camera']['focalPxFull']
plates = []
for L in C['levels']:
    N = L['size']['full']
    plates.append((L['widthDeg'], L['low'] + np.fromfile(os.path.join(ROOT, 'public', 'assets', 'mars', 'full', L['height']), '<u2').reshape(N, N).astype(np.float32) / 65535 * (L['high'] - L['low'])))


def cap_height(x, y):
    res = None
    for width, arr in plates:
        t = geom.half_tan(width)
        N = arr.shape[0]
        row = 4096
        pad = (-len(x)) % row
        mx = np.pad(((x / t + 1) / 2 * N - 0.5).astype(np.float32), (0, pad)).reshape(-1, row)
        my = np.pad(((1 - y / t) / 2 * N - 0.5).astype(np.float32), (0, pad)).reshape(-1, row)
        v = cv2.remap(arr, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).reshape(-1)[:len(x)]
        wgt = np.clip((1 - np.maximum(np.abs(x), np.abs(y)) / t) / C['edgeShare'], 0, 1)
        res = v if res is None else res * (1 - wgt) + v * wgt
    return res


def over(ray, t):
    """Height of the point at distance t on the picture's rays over the cap (radii); positive: in the open."""
    p = (ray * t[:, None] * scale) @ rot.T + origin
    r = np.linalg.norm(p, axis=1)
    d = p / r[:, None]
    up = d @ nrm
    return r - 1 - cap_height((d @ east) / up, (d @ north) / up)


stands = np.isfinite(front)
X, Y = np.meshgrid(x0 + (np.arange(w) + 0.5) * K['scale'], y0 + (np.arange(h) + 0.5) * K['scale'])
ray = np.stack([(X - W / 2) / focal, -(Y - H / 2) / focal, -np.ones_like(X)], -1)[stands]
ray /= np.linalg.norm(ray, axis=1, keepdims=True)
fr = front[stands].astype(np.float64)
lo = np.full(len(fr), np.nan)
hi = np.full(len(fr), np.nan)
prev_t = np.full(len(fr), GAP['from'])
prev_o = over(ray, prev_t)
open_ = prev_o > 0
for t in np.geomspace(GAP['from'], GAP['to'], GAP['steps'])[1:]:
    tt = np.full(len(fr), t)
    o = over(ray, tt)
    hit = open_ & (o <= 0) & np.isnan(lo)
    lo[hit], hi[hit] = prev_t[hit], t
    prev_t = tt
for _ in range(GAP['halvings']):
    got = np.isfinite(lo)
    mid = np.where(got, (lo + hi) / 2, 1.0)
    o = over(ray, mid)
    lo = np.where(got & (o > 0), mid, lo)
    hi = np.where(got & (o <= 0), mid, hi)
cap = np.where(np.isfinite(lo), (lo + hi) / 2, np.inf)
cap = np.where(open_, cap, GAP['from'])
e = np.clip((cap - fr) / fr, -GAP['range'], GAP['range'])
low = np.full((h, w), 128, np.uint8)
low[stands] = np.clip(np.round(128 + 127 * np.sign(e) * np.sqrt(np.abs(e) / GAP['range'])), 1, 255).astype(np.uint8)
far = np.full((h, w), np.nan, np.float32)
far[stands] = e
os.makedirs(os.path.join(ROOT, 'out', 'work', 'place', 'seen'), exist_ok=True)
np.save(os.path.join(ROOT, 'out', 'work', 'place', 'seen', 'gap-e.npy'), far)
print('the cap along the picture rays: %d places; |e| median %.4f, 90th %.4f, 99th %.4f; no cap met on %.4f; within 0.002: %.3f, within 0.01: %.3f' % (len(fr), float(np.median(np.abs(e))), float(np.percentile(np.abs(e), 90)), float(np.percentile(np.abs(e), 99)), float(np.isinf(cap).mean()), float((np.abs(e) < 0.002).mean()), float((np.abs(e) < 0.01).mean())))
if GAP['on']:
    out = np.concatenate([out, low], 0)

for s in ('full', 'web'):
    path = os.path.join(ROOT, 'public', 'assets', 'mars', s, 'relief-seen.png')
    cv2.imwrite(path, out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(path, out.shape, os.path.getsize(path), 'two layers on %.3f of the field, values %d to %d' % (float(two.mean()), int(out[:h][two].min()), int(out[:h][two].max())))
