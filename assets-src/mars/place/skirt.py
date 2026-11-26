"""The ground round the close ground's footprint: the made country takes the close ground's own border on, so no edge stands.

The globe side draws the close view's meshes (the picture's layers and their aprons) over its own ground by the eye's height.
Inside their footprint the colour plates hold the close ground itself (closelay.py). Beyond it the globe's own ground shows,
past the straight outer edges of the aprons, and that ground was another land: an edge in the frame at every height where the
meshes are drawn. This step makes the ground beyond the footprint out of the footprint's own border:

  - close to the border the plate is the laid ground mirrored at its nearest border point (the border's own texels where the
    mirror point is not laid ground), so the picture runs on across the edge;
  - from there the made country comes in along a wandering line (a fixed field on the ground, the same for every level),
    carrying the broad tone of the border, and that tone leaves with the distance.

Nothing inside the laid footprint is changed. The border lies on the ground: no height, time or eye is read.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/skirt.py --dir LAID --first FIRST --foot FOOT --out OUT

LAID holds the plates after closelay.py and its land-*-laid.png; FIRST the plates before any lay (the made country);
FOOT the a<width>-height.npy of heights.py --aprons (finite where the close ground stands). Values: plates.json, block skirt.
"""
import argparse
import json
import os
import cv2
import numpy as np
from PIL import Image, JpegImagePlugin
from scipy import ndimage
import geom

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser()
ap.add_argument('--dir', required=True)
ap.add_argument('--first', required=True)
ap.add_argument('--foot', default='out/work/place/ap')
ap.add_argument('--out', required=True)
ap.add_argument('--plates', default='assets-src/mars/place/plates.json')
ap.add_argument('--levels', default='src/stops/mars/levels.json')
ap.add_argument('--only', default='')
a = ap.parse_args()
K = json.load(open(a.plates))['skirt']
levels = [l for l in json.load(open(a.levels))['levels'] if l.get('own')]
only = [float(x) for x in a.only.split(',')] if a.only else None
os.makedirs(a.out, exist_ok=True)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def field(x, y):
    """A fixed field on the ground, about -1 to 1: the same for every level."""
    rng = np.random.default_rng(K['seed'])
    out = np.zeros(x.shape, np.float32)
    tw = geom.half_tan(8.5)
    for cells, amp in K['field']:
        g = rng.standard_normal((cells, cells)).astype(np.float32)
        g = cv2.GaussianBlur(g, (0, 0), 1.0)
        g /= np.abs(g).max()
        mx = ((x / tw + 1) / 2 * cells - 0.5).astype(np.float32)
        my = ((1 - y / tw) / 2 * cells - 0.5).astype(np.float32)
        out += amp * cv2.remap(g, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    return out


for L in levels:
    W = L['widthDeg']
    if only and W not in only:
        continue
    f = Image.open(os.path.join(a.dir, L['file']))
    keep = (dict(f.quantization), JpegImagePlugin.get_sampling(f))
    plate = geom.scene_of(np.asarray(f.convert('RGB')).astype(np.float32) / 255)
    N = plate.shape[0]
    first = geom.scene_of(np.asarray(Image.open(os.path.join(a.first, L['file'])).convert('RGB')).astype(np.float32) / 255)
    laid = cv2.imread(os.path.join(a.dir, L['file'].replace('.jpg', '-laid.png')), cv2.IMREAD_GRAYSCALE)
    foot = np.isfinite(np.load('%s/a%g-height.npy' % (a.foot, W))).astype(np.uint8)
    foot = cv2.resize(foot, (N, N), interpolation=cv2.INTER_NEAREST)
    deg = W / N
    own = (foot > 0) & (laid > 127)
    # threads and single texels are no border to run on from; the border itself is taken a little inside, where the lay is whole
    k = max(1, int(round(K['insideDeg'] / deg)))
    own = cv2.erode(own.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))) > 0
    # blades: laid ground too narrow to hold a disc of openDeg (the far end of an apron, a sliver between two holes) is no ground
    # to run on from; it goes back to the made country
    ko = int(round(K.get('openDeg', 0) / deg))
    if ko > 0:
        q = max(1, ko // 24)  # the opening is taken on a smaller grid, a disc of about 24 texels there
        sm_own = cv2.resize(own.astype(np.uint8), (N // q, N // q), interpolation=cv2.INTER_AREA)
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * (ko // q) + 1, 2 * (ko // q) + 1))
        opened = cv2.morphologyEx(sm_own, cv2.MORPH_OPEN, ker)
        own &= cv2.resize(cv2.dilate(opened, np.ones((3, 3), np.uint8)), (N, N), interpolation=cv2.INTER_NEAREST) > 0
    if not own.any():
        Image.fromarray(np.asarray(f.convert('RGB'))).save(os.path.join(a.out, L['file']), 'JPEG', qtables=keep[0], subsampling=keep[1])
        print(L['file'], 'no laid footprint on it, kept')
        continue
    dist, (iy, ix) = ndimage.distance_transform_edt(~own, return_indices=True)
    dist = (dist * deg).astype(np.float32)
    yy, xx = np.mgrid[0:N, 0:N]
    near = plate[iy, ix]
    fill = near.copy()
    done = np.zeros((N, N), bool)
    for share in K['mirror']:
        my = np.round(iy + (iy - yy) * share).astype(np.int64)
        mx = np.round(ix + (ix - xx) * share).astype(np.int64)
        ok = (my >= 0) & (my < N) & (mx >= 0) & (mx < N)
        ok &= own[np.clip(my, 0, N - 1), np.clip(mx, 0, N - 1)] & ~done
        fill[ok] = plate[my[ok], mx[ok]]
        done |= ok
    c = (np.arange(N, dtype=np.float32) + 0.5) / N
    t = geom.half_tan(W)
    x = np.broadcast_to(((2 * c - 1) * t)[None, :], (N, N))
    y = np.broadcast_to(((1 - 2 * c) * t)[:, None], (N, N))
    fld = field(x, y)
    # the broad tone of the border, carried outward along the nearest border point, against the made country's own broad tone
    s = K['toneBlurDeg'] / deg
    sm = max(1, int(round(s / 8)))
    small = lambda m: cv2.resize(m, (max(8, N // sm), max(8, N // sm)), interpolation=cv2.INTER_AREA)
    big = lambda m: cv2.resize(m, (N, N), interpolation=cv2.INTER_LINEAR)
    lg = lambda p: np.log(np.maximum(p, 1e-4))
    g0, g1 = K['gain']
    # the broad tone of the laid ground itself (its own texels only), carried outward without a seam: measured over a breadth that
    # grows with the distance from the border (toneBlurDeg at the border, doubling), so no line stands where the nearest border
    # point changes, and a pale or dark rim texel does not set the tone of the country beside it
    sig = max(s / sm, 0.5)
    w_own = small(own.astype(np.float32))
    v_own = small(lg(plate) * own[..., None])
    steps = max(1, int(np.ceil(np.log2(max(K['toneDeg'] * (1 + K['wander']) / K['toneBlurDeg'], 2)))) + 1)
    tones = []
    for j in range(steps):
        sj = sig * 2 ** j
        tones.append(cv2.GaussianBlur(v_own, (0, 0), sj) / np.maximum(cv2.GaussianBlur(w_own, (0, 0), sj), 1e-4)[..., None])
    ds = cv2.resize(dist / deg / sm, (w_own.shape[1], w_own.shape[0]), interpolation=cv2.INTER_AREA)  # distance in small texels
    lev = np.clip(np.log2(np.maximum(ds, sig) / sig), 0, steps - 1)
    j0 = np.floor(lev).astype(np.int64)
    j1 = np.minimum(j0 + 1, steps - 1)
    fr = (lev - j0)[..., None]
    stack = np.stack(tones)
    yy_s, xx_s = np.mgrid[0:w_own.shape[0], 0:w_own.shape[1]]
    inner = stack[j0, yy_s, xx_s] * (1 - fr) + stack[j1, yy_s, xx_s] * fr
    gain = big(inner - cv2.GaussianBlur(small(lg(first)), (0, 0), sig))
    gain = np.clip(gain, np.log(g0), np.log(g1))
    tone = 1 - smooth(dist / (K['toneDeg'] * (1 + K['wander'] * fld)))
    country = first * np.exp(gain * tone[..., None])
    # the laid ground runs on to a wandering line and ends there over the last share soft of the way: a contact, not a dissolve
    edge = K['holdDeg'] + K['reachDeg'] * np.maximum(1 + K['wander'] * fld, 0.05)
    soft = K.get('soft', 1.0)
    run = 1 - smooth((dist - edge * (1 - soft)) / np.maximum(edge * soft, 1e-6))
    out = fill * run[..., None] + country * (1 - run[..., None])
    out = np.where(dist[..., None] > 0, out, plate)
    res = np.clip(geom.texel_of(out) * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(res).save(os.path.join(a.out, L['file']), 'JPEG', qtables=keep[0], subsampling=keep[1])
    print('%s: laid footprint %.3f of it; the border run on over %.3f, toned country over %.3f; %d bytes' % (L['file'], float(own.mean()), float(((run > 0.5) & (dist > 0)).mean()), float(((tone > 0.05) & (run <= 0.5)).mean()), os.path.getsize(os.path.join(a.out, L['file']))), flush=True)
