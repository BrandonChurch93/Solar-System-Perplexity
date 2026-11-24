"""The lead of a plate of the carried on canyon: the painted plate (platelead.py) with the shade of the heights laid
on the painted ground, so that the picture model is led by the walls, the gullies and the floor that the heights have.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/canyonlead.py --lead LEAD.png --width-deg 0.7 [--nested 0.7] --out LEAD.png
Values: plates.json, country.paint (fromKm, toKm: where the canyon is painted) and country.lead (low, high: the gain on
the lead where the ground faces away from the Sun and where it faces it; blurDeg: the shade is taken at this scale).
"""
import argparse
import json
import cv2
import numpy as np
import geom
import ground

ap = argparse.ArgumentParser()
ap.add_argument('--lead', required=True)
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--nested', type=float, default=0.0, help='width in degrees of a take nested in the middle of the lead: no shade is laid on it')
ap.add_argument('--country', default='out/work/place/country')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--out', required=True)
a = ap.parse_args()
C = json.load(open(a.config))['country']
P, K, L = C['paint'], C['canyon'], C['lead']
W = a.width_deg


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


lead = cv2.imread(a.lead).astype(np.float32) / 255
N = lead.shape[0]
h = cv2.resize(np.load('%s/c%g-height.npy' % (a.country, W)), (N, N), interpolation=cv2.INTER_AREA)
saw = cv2.resize(np.isfinite(np.load('%s/q%g-height.npy' % (a.country, W))).astype(np.float32), (N, N), interpolation=cv2.INTER_AREA)
c = (np.arange(N) + 0.5) / N
xd = np.degrees((2 * c - 1) * geom.half_tan(W))
xg, yg = np.broadcast_to(xd[None, :], (N, N)), np.broadcast_to(-xd[:, None], (N, N))
prior = ground.trough(xg, yg, K['axis'], K['floorKm'], K['halfFloorDeg'], K['wallDeg'], K['fallFromDeg'], K['fallToDeg'], K.get('wander'), K.get('gullies'))
weight = smooth((-prior - P['fromKm']) / (P['toKm'] - P['fromKm'])) * smooth((0.5 - saw) * 2)
if a.nested > 0:
    inside = np.maximum(np.abs(xg), np.abs(yg)) / (np.degrees(geom.half_tan(a.nested)))
    weight = weight * smooth((inside - 0.9) / 0.1)
deg = W / N
hs = cv2.GaussianBlur(h, (0, 0), max(L['blurDeg'] / deg, 0.6))
b = np.radians(C['sunBearingDeg'])
s = np.array([np.sin(b), np.cos(b), P['sunUp']])
s /= np.linalg.norm(s)
gy, gx = np.gradient(hs, np.radians(deg))
nrm = np.dstack([-gx, gy, np.ones_like(gx)])
nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
cosv = np.clip(nrm @ s, 0, 1)
gain = L['low'] + (L['high'] - L['low']) * smooth(cosv / (2 * s[2]))
out = lead * (1 + (gain[..., None] - 1) * weight[..., None])
cv2.imwrite(a.out, np.round(np.clip(out, 0, 1) * 255).astype(np.uint8))
print('lead %s: the shade of the heights laid on %.2f percent of it (gain %.2f to %.2f)' % (a.out, 100 * (weight > 0.5).mean(), float(gain[weight > 0.5].min()) if (weight > 0.5).any() else 1, float(gain[weight > 0.5].max()) if (weight > 0.5).any() else 1))
