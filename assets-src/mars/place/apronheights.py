"""The aprons of the close view in the country's heights: a step on the baked height plates.

The close view's ground is the approved picture on three meshes and, beyond their boxes, the aprons made for the glide
of the surface view (src/stops/mars/relief.json, apron). Before the change of view the globe side draws those meshes
over its own ground by the eye's height (close.json), and its own ground must be the same ground there: the colour
plates take the close ground through the film's eye (closelay.py), and that only holds for more than one eye where
the heights under the colour are the meshes' own. country.py takes the picture alone (heights.py --picture-only);
this step adds the margins and the aprons as relief.ts builds them (heights.py --aprons).

Per level and set: the height plate is read back; where the close ground from above (highest point) is apron or
margin and the plate is not the picture's own ground, the plate takes it, out to limitDeg from the place's middle;
the made ground beside it goes over to it through a membrane over joinDeg (the same push and pull country.py uses),
and the slope is held as country.py holds it. In the band at its border a level is moved by what the coarser level
was moved by, so the levels stay one ground. country.json gets the new low and high of each level.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/apronheights.py [--from FOLDER] [--work out/work/place/ap]
FOLDER holds the plates before this step (default public/assets/mars: the step is then done in place, once).
Values: plates.json, block aprons.
"""
import argparse
import json
import os
import subprocess
import sys
import cv2
import numpy as np
import geom
import ground

ap = argparse.ArgumentParser()
ap.add_argument('--plates', default='assets-src/mars/place/plates.json')
ap.add_argument('--country', default='src/stops/mars/country.json')
ap.add_argument('--src', default='public/assets/mars', help='folder of the sets with the height plates before this step')
ap.add_argument('--src-country', default='', help='country.json that belongs to --src (default --country)')
ap.add_argument('--out', default='public/assets/mars')
ap.add_argument('--work', default='out/work/place/ap')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
a = ap.parse_args()
P = json.load(open(a.plates))
A = P['aprons']
C = P['country']
doc = json.load(open(a.country))
before = json.load(open(a.src_country)) if a.src_country else doc
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(a.work, exist_ok=True)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


for k, L in enumerate(doc['levels']):
    W = L['widthDeg']
    N = L['size']['full']
    B = before['levels'][k]
    cur = B['low'] + np.fromfile('%s/full/%s' % (a.src, B['height']), '<u2').reshape(N, N).astype(np.float64) / 65535 * (B['high'] - B['low'])
    q = '%s/a%g' % (a.work, W)
    if not os.path.exists(q + '-height.npy'):
        subprocess.run([sys.executable, here + '/heights.py', '--width-deg', str(W), '--size', str(N), '--most', '256', '--aprons', '--geometry', a.geometry, '--out', q], check=True, stdout=subprocess.DEVNULL)
    whole = np.load(q + '-height.npy').astype(np.float64)
    p = '%s/p%g' % (a.work, W)
    if not os.path.exists(p + '-height.npy'):
        subprocess.run([sys.executable, here + '/heights.py', '--width-deg', str(W), '--size', str(N), '--most', '256', '--picture-only', '--geometry', a.geometry, '--out', p], check=True, stdout=subprocess.DEVNULL)
    picture = np.isfinite(np.load(p + '-height.npy'))
    deg = W / N
    c = (np.arange(N) + 0.5) / N
    xd = np.degrees((2 * c - 1) * geom.half_tan(W))
    foot = np.hypot(xd[None, :], xd[:, None])
    add = np.isfinite(whole) & ~picture & (foot <= A['limitDeg'])
    # single texels and threads of apron ground are no ground: opened by a texel
    add = cv2.morphologyEx(add.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    far = cv2.distanceTransform((~add).astype(np.uint8), cv2.DIST_L2, 5) * deg
    join = max(A['joinDeg'], A['joinTexels'] * deg)
    known = add | picture | (far > join)
    diff = ground.membrane(np.where(add, whole - cur, 0).astype(np.float32), known)
    # at the level's border the plate is the coarser level: nothing is moved there
    border = np.minimum(np.minimum(c[None, :], 1 - c[None, :]), np.minimum(c[:, None], 1 - c[:, None]))
    inner = smooth(border / (C['edgeShare'] / 2)) if k > 0 else np.ones((N, N))
    move = np.where(picture, 0, diff)
    if k > 0:
        # what the coarser level was moved by, on this level's texels
        r = geom.half_tan(W) / geom.half_tan(doc['levels'][k - 1]['widthDeg'])
        M = coarser.shape[0]
        at = (((2 * c - 1) * r + 1) / 2 * M - 0.5).astype(np.float32)
        under = cv2.remap(coarser.astype(np.float32), np.broadcast_to(at[None, :], (N, N)).copy(), np.broadcast_to(at[:, None], (N, N)).copy(), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        move = move * inner + under * (1 - inner)
    new = cur + move
    held = ground.hold_slope(new.astype(np.float32), C['slopeMost'] * np.radians(deg)).astype(np.float64)
    new = np.where(picture, new, held)
    coarser = new - cur
    low, high = float(np.floor(new.min() * 1e5) / 1e5), float(np.ceil(new.max() * 1e5) / 1e5)
    for kind, n in L['size'].items():
        hk = new if n == N else cv2.resize(new, (n, n), interpolation=cv2.INTER_AREA)
        v = np.clip(np.round((hk - low) / (high - low) * 65535), 0, 65535).astype('<u2')
        os.makedirs('%s/%s' % (a.out, kind), exist_ok=True)
        v.tofile('%s/%s/%s' % (a.out, kind, L['height']))
    L['low'], L['high'] = low, high
    moved = np.abs(new - cur)
    print('%s: apron and margin ground on %.4f of the plate (picture %.4f); moved more than 5 m on %.4f, most %.0f m; %.2f to %.2f km, low %.5f high %.5f radii' % (L['height'], float(add.mean()), float(picture.mean()), float((moved > 0.005 / ground.KM).mean()), float(moved.max() * ground.KM * 1000), new.min() * ground.KM, new.max() * ground.KM, low, high), flush=True)
    grey = np.clip((new - new.min()) / (new.max() - new.min()), 0, 1)
    look = np.dstack([grey, grey, grey])
    look[add] = look[add] * [1.0, 0.8, 0.6]
    cv2.imwrite('%s/look-%g.jpg' % (a.work, W), np.round(cv2.resize(look, (1024, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8))
json.dump(doc, open(a.country, 'w'), indent=2)
open(a.country, 'a').write('\n')
