"""Measure the radial profile of the rings in the approved hero.

Every hero pixel whose ray meets the ring plane where the plane is lit, not hidden by the globe and well
resolved in radius is binned by ring radius. The output is the median scene linear colour per bin, with the
spread, for the tools that build the ring model. Nothing here is shipped: it is a measurement.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

OUT = os.path.join(geom.HERE, 'out')
os.makedirs(OUT, exist_ok=True)

img = np.asarray(Image.open(geom.HERO).convert('RGB'))
H, W = img.shape[:2]
scene = geom.scene_of(img)
d_body = geom.rays(W, H, geom.FIT['vfovDeg'])
d = d_body @ geom.TILT  # body to ring frame: transpose of TILT applied to row vectors
p, k, ok = geom.ring_hits(geom.CAM_L, d)
r = np.hypot(p[..., 0], p[..., 2])
az = np.degrees(np.arctan2(p[..., 2], p[..., 0]))
hidden = geom.globe_hits(geom.CAM_L, d, 1.05) < k
shadow = geom.in_globe_shadow(p, geom.SUN_L, 1.12)
dr = np.hypot(np.gradient(r, axis=1), np.gradient(r, axis=0))
edge = 24
inside = np.zeros_like(ok)
inside[edge:-edge, edge:-edge] = True
good = ok & ~hidden & ~shadow & inside & (r > 1.05) & (r < 2.7)

lo, hi, n = 1.05, 2.7, 1650
bins = np.clip(((r - lo) / (hi - lo) * n).astype(int), 0, n - 1)
cam_az = np.degrees(np.arctan2(geom.CAM_L[2], geom.CAM_L[0]))
sun_az = np.degrees(np.arctan2(geom.SUN_L[2], geom.SUN_L[0]))
print('camera azimuth %.1f elevation %.1f, sun azimuth %.1f elevation %.1f' % (cam_az, np.degrees(np.arcsin(geom.CAM_L[1] / np.linalg.norm(geom.CAM_L))), sun_az, np.degrees(np.arcsin(geom.SUN_L[1]))))

rel = (az - cam_az + 540) % 360 - 180
sectors = {}
for name, a0, a1 in [('left', 60, 120), ('near', -40, 40), ('right', -120, -60), ('far', 140, 220)]:
    m = good & (((rel >= a0) & (rel <= a1)) | ((rel + 360 >= a0) & (rel + 360 <= a1))) & (dr < 0.004)
    med = np.full((n, 3), np.nan)
    cnt = np.zeros(n, int)
    q25 = np.full((n, 3), np.nan)
    q75 = np.full((n, 3), np.nan)
    idx = bins[m]
    vals = scene[m]
    order = np.argsort(idx, kind='stable')
    idx = idx[order]
    vals = vals[order]
    starts = np.searchsorted(idx, np.arange(n))
    ends = np.searchsorted(idx, np.arange(n), side='right')
    for i in range(n):
        if ends[i] - starts[i] >= 6:
            v = vals[starts[i]:ends[i]]
            med[i] = np.median(v, 0)
            q25[i] = np.percentile(v, 25, 0)
            q75[i] = np.percentile(v, 75, 0)
            cnt[i] = len(v)
    sectors[name] = {'median': med, 'q25': q25, 'q75': q75, 'count': cnt}
    print(name, 'bins with data', int((cnt > 0).sum()), 'pixels', int(m.sum()), 'median radial footprint', float(np.median(dr[m])) if m.any() else None)

np.savez(os.path.join(OUT, 'hero_profile.npz'), lo=lo, hi=hi, n=n, **{k + '_' + kk: vv for k, v in sectors.items() for kk, vv in v.items()})

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
rc = lo + (np.arange(n) + 0.5) / n * (hi - lo)
fig, ax = plt.subplots(len(sectors), 1, figsize=(20, 4 * len(sectors)))
for a, (name, s) in zip(ax, sectors.items()):
    for i, c in enumerate('rgb'):
        a.plot(rc, s['median'][:, i], c, lw=0.6)
    a.set_title(name + ' sector, scene linear')
    a.set_xlim(lo, hi)
    a.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(OUT, 'hero_profile.png'), dpi=60)

mask_img = (img * 0.35).astype(np.uint8)
mask_img[good & (dr < 0.004)] = img[good & (dr < 0.004)]
Image.fromarray(mask_img).resize((W // 2, H // 2)).save(os.path.join(OUT, 'hero_mask.jpg'), quality=85)
