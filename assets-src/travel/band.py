import json, sys
import numpy as np
from PIL import Image

rows = json.load(open(sys.argv[1]))
for stop, r in rows.items():
    im = Image.open(r['file']).convert('RGB')
    w, h = im.size
    a = np.asarray(im.resize((192, 108), Image.BOX)).astype(float)
    lum = a @ np.array([0.3, 0.5, 0.2])
    k = 9
    pad = np.pad(lum, k, mode='edge')
    sm = sum(pad[k + dy:k + dy + 108, k + dx:k + dx + 192] for dy in range(-k, k + 1, 3) for dx in range(-k, k + 1, 3)) / 49
    base = np.percentile(sm, 50)
    wgt = np.clip(sm - base, 0, None)
    ys, xs = np.mgrid[0:108, 0:192]
    x = (xs + 0.5) / 192 * 2 - 1
    y = 1 - (ys + 0.5) / 108 * 2
    x = x * 16 / 9
    tot = wgt.sum()
    if tot <= 0:
        print(stop, 'no band in the patch picture')
        continue
    cx, cy = (wgt * x).sum() / tot, (wgt * y).sum() / tot
    cov = np.array([[(wgt * (x - cx) ** 2).sum(), (wgt * (x - cx) * (y - cy)).sum()], [(wgt * (x - cx) * (y - cy)).sum(), (wgt * (y - cy) ** 2).sum()]]) / tot
    val, vec = np.linalg.eigh(cov)
    ang = np.degrees(np.arctan2(vec[1, 1], vec[0, 1])) % 180
    long = np.sqrt(val[1] / max(val[0], 1e-9))
    contrast = (np.percentile(sm, 98) - base) / 255
    half = r['halfDeg'] * r['wide']
    d = abs(ang - r['lineDeg']) % 180
    d = min(d, 180 - d)
    seen = r['offDeg'] < half * 1.2
    print('%-8s picture %dx%d  patch band: angle %5.1f deg, centre at (%+.2f, %+.2f) of the half height, elongation %.1f, contrast %.3f | shared band: angle %5.1f deg, %4.1f deg from the patch centre (%s) | angle between %4.1f deg' % (stop, w, h, ang, cx, cy, long, contrast, r['lineDeg'], r['offDeg'], 'in the hold frame' if r['offDeg'] < r['halfDeg'] else 'in the patch margin' if seen else 'outside the patch', d))
