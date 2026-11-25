# lat_tone.py FILM.png OUT.json [PREV.json]: the factor on the brightness of the clouds by latitude that takes the
# lit globe of a film frame at the pose of skim.json (frame 3720, 1920 by 1080, no grain) to the lit globe of the
# approved close image. One knot per whole degree of latitude from 0 to 80, three numbers (red, green, blue) in
# scene linear light. With PREV the result is PREV times the new measure, so a second pass on a frame drawn with
# the first table gives the table of the measure (kept as lat_tone_raw.json). Measures only: it draws nothing and
# the film does not run it.
# lat_tone.py --smooth RAW.json OUT.json SIGMA FIRST: the table the film keeps (skim.json light.tone.gain): the
# measure smoothed along the latitude, in the logarithm, with a bell of SIGMA degrees (mirrored at both ends),
# the knots under FIRST degrees taken as the knot at FIRST before it (down there the approved image shows the
# band of the rings in front of the globe, not the clouds). The grade comes with the height of the lens, so it
# may change the broad palette of the globe by latitude but no band of it: a table with the measure's steps from
# one degree to the next repainted the bands while the lens climbed, and the report of the pictures read that
# as one pattern exchanged for another (0.58 at frame 3834, limit 0.45).
# lat_tone.py --again MEASURE.json OUT.json SIGMA FIRST: one more pass on a frame drawn with the table the film
# keeps: MEASURE.json is the plain measure of that frame (lat_tone.py FILM MEASURE.json, no PREV); the new table
# is the film's table (skim.json light.tone.gain) times that measure smoothed in the same way, so the table
# stays as smooth as it was and takes only the broad rest of the difference. Put it into skim.json with
# put_table.py light.tone.gain OUT.json.
import sys, json, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
args = sys.argv[1:]
sys.argv = ['x']
def even(raw, sigma, first):
    raw = raw.copy()
    raw[:first] = raw[first]
    n = len(raw)
    at = np.arange(n)
    wide = np.concatenate([raw[::-1], raw, raw[::-1]])
    where = np.concatenate([-at[::-1] - 1, at, 2 * n - 1 - at[::-1]])
    out = np.zeros_like(raw)
    for i in range(n):
        w = np.exp(-0.5 * ((where - i) / sigma) ** 2)
        out[i] = (wide * w[:, None]).sum(0) / w.sum()
    return out


if args and args[0] in ('--smooth', '--again'):
    raw = np.log(np.array(json.load(open(args[1])), float))
    out = even(raw, float(args[3]), int(args[4]))
    if args[0] == '--again':
        kept = json.load(open(os.path.join(REPO, 'src', 'stops', 'saturn', 'skim.json')))['light']['tone']['gain']
        print('factor on the kept table ' + ' '.join('%d:%.2f/%.2f/%.2f' % (i, *np.exp(out[i])) for i in range(0, len(out), 8)))
        out = out + np.log(np.array(kept, float))
    out = np.exp(out)
    n = len(out)
    print('gain', out.min().round(3), 'to', out.max().round(3))
    print(' '.join('%d:%.2f/%.2f/%.2f' % (i, *out[i]) for i in range(0, n, 8)))
    json.dump(np.round(out, 3).tolist(), open(args[2], 'w'))
    raise SystemExit(0)
import pose_fit as pf, geom
W, H = 1920, 1080
skim = json.load(open(os.path.join(REPO, 'src', 'stops', 'saturn', 'skim.json')))
pose = skim['pose']
p = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
pos, rot, sun, f = pf.camera(p)
yy, xx = np.mgrid[0:H, 0:W]
pts = np.stack([xx.ravel() + 0.5, yy.ravel() + 0.5], 1).astype(float)
dr = pf.rays(pts, rot, f)
dr /= np.linalg.norm(dr, axis=1)[:, None]
# the globe made round: heights over the plane divided by the polar radius
sq = np.array([1.0, 1.0 / geom.POLAR, 1.0])
ds = dr * sq
ds /= np.linalg.norm(ds, axis=1)[:, None]
ps = pos * sq
b = ds @ ps
disc = b * b - (ps @ ps - 1)
t = -b - np.sqrt(np.maximum(disc, 0))
hit = ps[None, :] + ds * t[:, None]
globe = (disc > 0).reshape(H, W)
lat = np.degrees(np.arcsin(np.clip(hit[:, 1], -1, 1))).reshape(H, W)
nL = hit * sq
nL /= np.linalg.norm(nL, axis=1)[:, None]
ndl = (nL @ (sun / np.linalg.norm(sun))).reshape(H, W)
dirL = ds * np.array([1.0, geom.POLAR * geom.POLAR, 1.0])
dirL /= np.linalg.norm(dirL, axis=1)[:, None]
mu = np.clip(-(nL * dirL).sum(1), 0, 1).reshape(H, W)
hy = (hit[:, 1] * geom.POLAR).reshape(H, W)

def lin(v):
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)

# the film's tone curve taken back, so the two pictures are compared in scene light
def inv(y):
    y = np.clip(y, 0, 0.985)
    a, bb, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - bb
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))

def load(name):
    im = Image.open(name).convert('RGB')
    if not im.size == (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    return inv(lin(np.asarray(im).astype(float) / 255))

ap = load(os.path.join(REPO, 'references', 'approved', 'saturn-close.jpg'))
mi = load(args[0])
rows = []
for k in range(81):
    best = None
    # in full daylight where there is enough of it, nearer the terminator and the limb where there is not
    for lo, mlo in ((0.2, 0.25), (0.12, 0.2), (0.06, 0.12)):
        s = globe & (ndl > lo) & (mu > mlo) & (hy > 0.1) & (lat >= k - 0.5) & (lat < k + 0.5)
        if s.sum() >= 300:
            best = np.median(ap[s], 0) / np.median(mi[s], 0)
            break
    rows.append(best)
valid = [i for i, r in enumerate(rows) if r is not None]
out = np.array([rows[min(valid, key=lambda v: abs(v - i))].tolist() for i in range(81)])
if len(args) > 2:
    out = out * np.array(json.load(open(args[2])))
print('latitudes measured', valid[0], 'to', valid[-1], 'gain', out.min().round(3), 'to', out.max().round(3))
print(' '.join('%d:%.2f/%.2f/%.2f' % (i, *out[i]) for i in range(valid[0], valid[-1] + 1, 3)))
json.dump(np.round(out, 3).tolist(), open(args[1], 'w'))
