"""Paints the canyon that country.py carries on beyond what the close view saw onto a look plate from above.

The plates of the country were drawn before the canyon was carried on, so west of the seen ground they show a plateau
where the heights now hold a canyon. This step lays colour there by code: the colour the close view's own picture has
on ground of the same height under the same light (a table over height and the cosine to the Sun, measured on the seen
ground of one plate laid back at its true places), with the fine drawing of the plate kept as grain. Light stays paint:
the cap is not shaded again, so the painted light is the only light and is laid where the made slopes face the Sun.
Weight: the depth of the canyon function alone (plates.json country.paint), nothing on ground the picture saw.
  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/paint.py --width-deg 1.6 --plate out/work/place/plate/p1.6.png --out out/work/place/plate/p1.6.png
"""
import argparse
import json
import cv2
import numpy as np
import geom
import ground

ap = argparse.ArgumentParser()
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--plate', required=True)
ap.add_argument('--country', default='out/work/place/country')
ap.add_argument('--lay', default='out/work/place/lay/dive-land', help='the true place lay back the table is measured on: PREFIX-<width>.png and -stretch.npy')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--look', default='')
ap.add_argument('--out', required=True)
a = ap.parse_args()
C = json.load(open(a.config))['country']
P = C['paint']
K = C['canyon']


def sun_cos(height, deg):
    s = geom.scene_sun(C['light']['sunMoment'])
    gy, gx = np.gradient(height, np.radians(deg))
    nrm = np.dstack([-gx, gy, np.ones_like(gx)])
    nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
    return np.clip(nrm @ s, 0, 1).astype(np.float32)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


NH, NS = P['bins']
H0, H1 = P['heightKm']


def cell(h_km, cosv):
    fh = np.clip((h_km - H0) / (H1 - H0), 0, 1) * (NH - 1)
    fs = np.clip(cosv, 0, 1) * (NS - 1)
    return fh, fs


# the table, measured on the plate named in the config
tw = P['tableDeg']
th = np.load('%s/c%g-height.npy' % (a.country, tw))
tq = np.isfinite(np.load('%s/q%g-height.npy' % (a.country, tw)))
n = th.shape[0]
lay = cv2.imread('%s-%g.png' % (a.lay, tw), cv2.IMREAD_UNCHANGED)
lay = cv2.resize(lay, (n, n), interpolation=cv2.INTER_AREA).astype(np.float32) / 65535
stretch = cv2.resize(np.load('%s-%g-stretch.npy' % (a.lay, tw)), (n, n), interpolation=cv2.INTER_AREA)
use = tq & (lay[..., 3] > 0.99) & (stretch < P['stretchMost'])
fh, fs = cell(th * ground.KM, sun_cos(cv2.GaussianBlur(th, (0, 0), P['slopeBlur']), tw / n))
ih, isn = np.round(fh).astype(np.int32)[use], np.round(fs).astype(np.int32)[use]
idx = ih * NS + isn
count = np.bincount(idx, minlength=NH * NS).astype(np.float32)
table = np.zeros((NH, NS, 3), np.float32)
for ch in range(3):
    table[..., ch] = (np.bincount(idx, weights=np.log(np.maximum(lay[..., ch][use], 1e-4)), minlength=NH * NS) / np.maximum(count, 1)).reshape(NH, NS)
known = (count >= P['least']).reshape(NH, NS)
for ch in range(3):
    table[..., ch] = ground.membrane(table[..., ch], known)
table = cv2.GaussianBlur(table, (0, 0), 0.7)

# the plate
W = a.width_deg
plate = cv2.imread(a.plate, cv2.IMREAD_UNCHANGED)
scale = 65535 if plate.dtype == np.uint16 else 255
N = plate.shape[0]
h = cv2.resize(np.load('%s/c%g-height.npy' % (a.country, W)), (N, N), interpolation=cv2.INTER_LINEAR)
saw = cv2.resize(np.isfinite(np.load('%s/q%g-height.npy' % (a.country, W))).astype(np.float32), (N, N), interpolation=cv2.INTER_LINEAR)
c = (np.arange(N) + 0.5) / N
xd = np.degrees((2 * c - 1) * geom.half_tan(W))
xg, yg = np.broadcast_to(xd[None, :], (N, N)), np.broadcast_to(-xd[:, None], (N, N))
prior = ground.country_deep(C, xg, yg)
weight = smooth((-prior - P['fromKm']) / (P['toKm'] - P['fromKm']))
# nothing on the ground the picture saw, with a soft edge of a few texels
far = cv2.distanceTransform((saw < 0.5).astype(np.uint8), cv2.DIST_L2, 3)
weight = weight * smooth(far / max(P['edgeDeg'] / (W / N), 1.0))
# the slopes at the scale the table was measured at
blur = P['slopeBlur'] * (tw / n) / (W / N)
hs = cv2.GaussianBlur(h, (0, 0), blur) if blur > 0.5 else h
fh, fs = cell(h * ground.KM, sun_cos(hs, W / N))
tone = np.exp(cv2.remap(table, fs.astype(np.float32), fh.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE))
rgb = plate[..., :3].astype(np.float32) / scale
grain_px = max(P['grainDeg'] / (W / N), 2.0)
soft = cv2.GaussianBlur(rgb, (0, 0), grain_px)
grain = np.clip((rgb.mean(axis=2) + 0.004) / (soft.mean(axis=2) + 0.004), 1 / P['grainMost'], P['grainMost']) ** P['grain']
paint = np.clip(tone * grain[..., None], 0, 1)
out = rgb * (1 - weight[..., None]) + paint * weight[..., None]
res = plate.copy()
res[..., :3] = np.round(out * scale).astype(plate.dtype)
if not cv2.imwrite(a.out, np.ascontiguousarray(res)):
    raise SystemExit('could not write ' + a.out)
if a.look:
    s = 1024 / N
    cv2.imwrite(a.look, np.round(np.hstack([cv2.resize(rgb, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.resize(out, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)]) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
print('%g deg: canyon painted on %.2f percent of the plate (weight over 0.5), table bins measured %d of %d' % (W, 100 * (weight > 0.5).mean(), int(known.sum()), NH * NS))
