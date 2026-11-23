"""How the brightness of the hero's rings changes round the globe, ring by ring.

For the lit, unhidden ring pixels of the approved hero this prints, per ring and per slice of azimuth from
the camera, the median scene linear luma with the cosine of the view to the ring normal and the phase angle.
It is the measurement behind the view and phase dials of sheet.json. Nothing here is shipped.
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

img = np.asarray(Image.open(geom.HERO).convert('RGB'))
H, W = img.shape[:2]
scene = geom.scene_of(img)
luma = scene @ np.array([0.2126, 0.7152, 0.0722])
d = geom.rays(W, H, geom.FIT['vfovDeg']) @ geom.TILT
p, k, ok = geom.ring_hits(geom.CAM_L, d)
r = np.hypot(p[..., 0], p[..., 2])
az = np.degrees(np.arctan2(p[..., 2], p[..., 0]))
hidden = geom.globe_hits(geom.CAM_L, d, 1.06) < k
shadow = geom.in_globe_shadow(p, geom.SUN_L, 1.15)
good = ok & ~hidden & ~shadow & (r > 1.2) & (r < 2.4)
good[:24] = False
good[-24:] = False
good[:, :24] = False
good[:, -24:] = False
mu = np.abs(d[..., 1])
phase = np.degrees(np.arccos(np.clip(-(d @ geom.SUN_L), -1, 1)))
cam_az = np.degrees(np.arctan2(geom.CAM_L[2], geom.CAM_L[0]))
rel = (az - cam_az + 540) % 360 - 180
rings = {'C': (1.30, 1.48), 'B': (1.60, 1.90), 'A': (2.10, 2.30)}
rows = []
for name, (r0, r1) in rings.items():
    print(name, 'ring, radius %.2f to %.2f: azimuth from the camera, pixels, mu, phase, luma, red over luma, blue over luma' % (r0, r1))
    for a0 in range(-180, 180, 20):
        m = good & (r >= r0) & (r < r1) & (rel >= a0) & (rel < a0 + 20)
        if m.sum() < 400:
            continue
        v = scene[m]
        y = float(np.median(luma[m]))
        rows.append((name, a0 + 10, float(np.median(mu[m])), float(np.median(phase[m])), y))
        print('  %5d %7d  mu %.3f  phase %5.1f  luma %.3f  %.2f %.2f' % (a0 + 10, int(m.sum()), np.median(mu[m]), np.median(phase[m]), y, np.median(v[:, 0]) / y, np.median(v[:, 2]) / y))
np.save(os.path.join(geom.HERE, 'out', 'hero_light.npy'), np.array([(('C', 'B', 'A').index(n), a, m, ph, y) for n, a, m, ph, y in rows]))
