"""Palette of the close ground, read from the approved close image.

The ground pixels of references/approved/sun-close.jpg (below the limb, outside the sunspot and the two feet of
the arcade) are sorted by brightness; the mean colour of each brightness class is one stop of the ramp. The ramp
is written into src/stops/sun/convect.json (key ramp) as display values 0 to 1. Nothing else is taken from the
image here: no cell, no position.

  python3 assets-src/sun/convect/ramp.py
"""
import json, sys
import numpy as np
from PIL import Image

root = sys.argv[1] if len(sys.argv) > 1 else '.'
im = np.asarray(Image.open(root + '/references/approved/sun-close.jpg').convert('RGB')).astype(np.float64) / 255
h, w, _ = im.shape
yy, xx = np.mgrid[0:h, 0:w]
ax, ay = xx / w, yy / h
ground = ay > 0.56
spot = ((ax - 0.5237) / 0.16) ** 2 + ((ay - 0.609) / 0.09) ** 2 < 1
ground &= ~spot
px = im[ground]
lum = px @ np.array([0.3, 0.5, 0.2])
order = np.argsort(lum)
stops = 16
edges = np.linspace(0, len(order), stops + 1).astype(int)
ramp = [[round(float(v), 4) for v in px[order[edges[i]:edges[i + 1]]].mean(axis=0)] for i in range(stops)]
levels = [round(float(lum[order[edges[i]:edges[i + 1]]].mean()), 4) for i in range(stops)]
qs = [0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99]
print('ground pixels', len(px), 'brightness quantiles', {q: round(float(np.quantile(lum, q)), 3) for q in qs})
path = root + '/src/stops/sun/convect.json'
try:
    data = json.load(open(path))
except FileNotFoundError:
    data = {}
data['ramp'] = {'note': 'mean colour of 16 equal brightness classes of the ground of the approved close image (assets-src/sun/convect/ramp.py), display values', 'stops': ramp, 'levels': levels}
json.dump(data, open(path, 'w'), indent=1)
for r, l in zip(ramp, levels):
    print(l, r)
