"""Bakes the country's heights (country.py) into the Mars set: one height plate per level for both asset sets.

  python3 assets-src/mars/place/countrybake.py [--in out/work/place/country]
Written: public/assets/mars/<set>/country-<level>.bin (raw little endian uint16, row major, row 0 at the north edge,
column 0 at the west edge, no header; radii over the unit sphere = low + v / 65535 * (high - low)),
public/assets/mars/<set>/country-<level>-seen.png (8 bit, one channel: 255 where the height is the close view's own
mesh as it is) and src/stops/mars/country.json (per level: files, widthDeg, size per set, low, high).
"""
import argparse
import json
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--in', dest='src', default='out/work/place/country')
ap.add_argument('--plates', default='assets-src/mars/place/plates.json')
ap.add_argument('--out', default='src/stops/mars/country.json')
a = ap.parse_args()
C = json.load(open(a.plates))['country']
SIZES = {'full': C['size'], 'web': C['size'] // 2}
levels = []
for level in C['levels']:
    W = level['widthDeg']
    name = ('%g' % W).replace('.', 'p')
    h = np.load('%s/c%g-height.npy' % (a.src, W)).astype(np.float64)
    seen = cv2.imread('%s/c%g-seen.png' % (a.src, W), cv2.IMREAD_GRAYSCALE)
    low, high = float(np.floor(h.min() * 1e5) / 1e5), float(np.ceil(h.max() * 1e5) / 1e5)
    for kind, n in SIZES.items():
        hk = h if n == h.shape[0] else cv2.resize(h, (n, n), interpolation=cv2.INTER_AREA)
        v = np.clip(np.round((hk - low) / (high - low) * 65535), 0, 65535).astype('<u2')
        v.tofile('public/assets/mars/%s/country-%s.bin' % (kind, name))
        sk = seen if n == seen.shape[0] else cv2.resize(seen, (n, n), interpolation=cv2.INTER_AREA)
        if not cv2.imwrite('public/assets/mars/%s/country-%s-seen.png' % (kind, name), np.ascontiguousarray(sk)):
            raise SystemExit('could not write the mask')
    levels.append({'height': 'country-%s.bin' % name, 'seen': 'country-%s-seen.png' % name, 'widthDeg': W, 'size': SIZES, 'low': low, 'high': high})
    print('%s: %g deg, %.2f to %.2f km, low %.5f high %.5f radii' % (name, W, h.min() * 3389.5, h.max() * 3389.5, low, high))
doc = {
    'note': 'The heights of the country round the place, coarse to fine (assets-src/mars/place/country.py, countrybake.py). Square gnomonic plates about patches.spot, north up, the frame of the colour plates of the same width. height: raw little endian uint16, row major, row 0 at the north edge; radii over the unit sphere = low + v / 65535 * (high - low). In a band of edgeShare of its width at its border each level is the next coarser one; the outermost is 0 on its edge. seen: 255 where the ground is the close view\'s own mesh; its heights are as they are except that no slope is steeper than slopeMost (plates.json, country), so that no two neighbours of a level differ by more than slopeMost texel widths.',
    'edgeShare': C['edgeShare'],
    'reachNote': C['reach']['note'],
    'reach': C['reach']['knots'],
    'levels': levels,
}
json.dump(doc, open(a.out, 'w'), indent=2)
open(a.out, 'a').write('\n')
