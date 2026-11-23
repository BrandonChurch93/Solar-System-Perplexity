"""The heights of the country round the Mars place: one height plate per level of the globe's ladder.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/country.py [--out out/work/place/country] [--only 1.6]
Values: plates.json, block country. Levels are built coarse to fine so that each is tied to the one outside it.
Per level:
  1. the close view's own ground from above (heights.py --picture-only): true heights where the picture's eye saw
     ground, nothing elsewhere;
  2. the base: the coarser level, with its waves shorter than broadShare of this width taken out except in a band
     at this level's border, where it is the coarser level itself (so two levels meet without a step);
  3. on unseen ground the difference of the true heights to that base is hung as a membrane between the seen ground
     and zero farther out (ground.membrane);
  4. the short waves are read from the light in this level's own plate (ground.relief_from_light), so a ridge
     stands where the plate shows one; they come in over joinShare beside seen ground and go out in the border band;
  5. made ground is lowered until it lies behind what the picture's eye saw (ground.lower_under_sight).
Written per level W: cW-height.npy (float32, radii over the sphere, north up, gnomonic about patches.spot),
cW-seen.png (white where the height is the close view's own mesh), cW-look.jpg (plate, shaded heights).
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
ap.add_argument('--out', default='out/work/place/country')
ap.add_argument('--only', default='', help='widths to build again, comma separated; the others are read if present')
ap.add_argument('--most', type=int, default=256)
a = ap.parse_args()
C = json.load(open(a.plates))['country']
N = C['size']
only = [float(x) for x in a.only.split(',')] if a.only else None
os.makedirs(a.out, exist_ok=True)
eye = ground.Eye()
here = os.path.dirname(os.path.abspath(__file__))


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


coarse = None
coarse_w = None
rough = {}
for level in C['levels']:
    W = level['widthDeg']
    pre = '%s/c%g' % (a.out, W)
    deg = W / N
    if only is not None and W not in only and os.path.exists(pre + '-height.npy'):
        coarse, coarse_w = np.load(pre + '-height.npy'), W
        continue
    q = '%s/q%g' % (a.out, W)
    if not os.path.exists(q + '-height.npy'):
        subprocess.run([sys.executable, here + '/heights.py', '--width-deg', str(W), '--size', str(N), '--most', str(a.most), '--picture-only', '--out', q], check=True, stdout=subprocess.DEVNULL)
    true = np.load(q + '-height.npy')
    seen = np.isfinite(true)
    c = (np.arange(N) + 0.5) / N
    border = np.minimum(np.minimum(c[None, :], 1 - c[None, :]), np.minimum(c[:, None], 1 - c[:, None]))
    wb = 1 - smooth(border / C['edgeShare'])
    broad = min(C['broadShare'] * W, C['broadMostDeg'])
    # the canyon carried on along the trough of the globe's map: the same function at every level
    K = C['canyon']
    xd = np.degrees((2 * c - 1) * geom.half_tan(W))
    xg, yg = np.broadcast_to(xd[None, :], (N, N)), np.broadcast_to(-xd[:, None], (N, N))
    prior = ground.trough(xg, yg, K['axis'], K['floorKm'], K['halfFloorDeg'], K['wallDeg'], K['fallFromDeg'], K['fallToDeg']) / ground.KM
    if coarse is None:
        up = prior
    else:
        k = geom.half_tan(W) / geom.half_tan(coarse_w)
        m = (((2 * c - 1) * k + 1) / 2 * N - 0.5).astype(np.float32)
        up = cv2.remap(coarse, np.broadcast_to(m[None, :], (N, N)).copy(), np.broadcast_to(m[:, None], (N, N)).copy(), cv2.INTER_CUBIC)
    rest = up - prior
    lp = cv2.GaussianBlur(rest, (0, 0), broad / deg / 2)
    base = prior + lp + wb * (rest - lp)
    if coarse is None:
        base = prior * (1 - wb)
    # far from the eye's foot the mesh heights are smoothed: from above they are ridged along the eye's rays
    F = C['far']
    foot = np.hypot(xg, yg)
    held = np.where(seen, true, 0)
    whole = ground.membrane(held, seen)
    want = np.maximum(foot - F['fromDeg'], 0) * F['perDeg'] / deg
    if want.max() > 0.5:
        sig = [0.0]
        while sig[-1] < want.max():
            sig.append(max(1.0, sig[-1] * 2))
        stack = [whole] + [cv2.GaussianBlur(whole, (0, 0), s_) for s_ in sig[1:]]
        pos = np.interp(want, sig, np.arange(len(sig)))
        lo_ = np.floor(pos).astype(np.int32)
        hi_ = np.minimum(lo_ + 1, len(sig) - 1)
        fr = (pos - lo_).astype(np.float32)
        st = np.stack(stack)
        ii, jj = np.indices((N, N))
        calm = st[lo_, ii, jj] * (1 - fr) + st[hi_, ii, jj] * fr
        true = np.where(seen, calm, np.nan).astype(np.float32)
        del st, stack
    exact = seen & (foot <= F['fromDeg'])
    far = cv2.distanceTransform((~seen).astype(np.uint8), cv2.DIST_L2, 5) * deg
    known = seen | (far > C['zeroShare'] * W)
    diff = ground.membrane(np.where(seen, true - base, 0), known)
    pic = cv2.resize(cv2.imread(level['picture']), (N, N), interpolation=cv2.INTER_AREA)
    rel = ground.relief_from_light(ground.light(pic), deg, C['sunBearingDeg'], broad, hold=C['hold'])
    rel = rel * C['gainKm']
    # the made ground takes the roughness of the mesh plateau beside it, octave by octave
    filled = ground.membrane(np.where(seen, true, 0), seen) * ground.KM
    plateau = exact & (true * ground.KM > C['plateauKm'])
    tb, _ = ground.octaves(filled, broad / deg / 2)
    rb, _ = ground.octaves(rel, broad / deg / 2)
    rel = np.zeros_like(rel)
    table = []
    out_far = smooth(far / min(C['roughFarDeg'], 0.25 * W))
    for (sg, tband), (_, rband) in zip(tb, rb):
        inner = cv2.erode(plateau.astype(np.uint8), np.ones((int(4 * sg) * 2 + 1,) * 2, np.uint8)) > 0
        wave = sg * deg * 4
        if inner.sum() > 20000:
            f = float(np.sqrt((tband[inner] ** 2).mean() / max((rband[~seen] ** 2).mean(), 1e-12)))
            rough[wave] = f
        elif rough:
            ks = sorted(rough)
            f = float(np.interp(np.log(wave), np.log(ks), [rough[k] for k in ks]))
        else:
            f = 1.0
        f = float(np.clip(f, C['rough'][0], C['rough'][1]))
        table.append('%.3g deg x%.2f' % (wave, f))
        rel += rband * (f + (C['roughFar'] - f) * out_far)
    made = rel / ground.KM * smooth(far / (C['joinShare'] * W)) * (1 - wb)
    height = np.where(seen, true, base + diff + made).astype(np.float32)
    dirs = geom.patch_dirs(W, N)
    height, low, passes, left = ground.lower_under_sight(height, ~seen, dirs, eye, min(C['stepKm'], 1.2 * np.radians(deg) * ground.KM), passes=800, clear=C['clear'])
    np.save(pre + '-height.npy', height.astype(np.float32))
    cv2.imwrite(pre + '-seen.png', (exact * 255).astype(np.uint8))
    # the fit of the gain on the seen ground: the picture at its true place against the mesh heights, same band
    fit = corr = float('nan')
    inner = cv2.erode(seen.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    if inner.sum() > 1000:
        col = cv2.imread(q + '-colour.png')
        Lt = ground.light(col)
        Lt = np.where(seen, Lt, Lt[seen].mean())
        Lt = np.where(seen, Lt, cv2.GaussianBlur(Lt, (0, 0), 6))
        rt = ground.relief_from_light(Lt, deg, C['sunBearingDeg'], broad, hold=C['hold'])
        th = height * ground.KM
        th = th - cv2.GaussianBlur(th, (0, 0), broad / deg / 2)
        x, y = rt[inner], th[inner]
        fit = float((x * y).sum() / max((x * x).sum(), 1e-12))
        corr = float(np.corrcoef(x, y)[0, 1])
    look = np.dstack([ground.shaded(height, deg, C['sunBearingDeg'])] * 3)
    look[~seen] *= np.array([1.0, 0.9, 0.8])
    s = 1024
    side = np.hstack([cv2.resize(pic, (s, s), interpolation=cv2.INTER_AREA), cv2.resize(np.round(look * 255).astype(np.uint8), (s, s), interpolation=cv2.INTER_AREA)])
    cv2.imwrite(pre + '-look.jpg', np.ascontiguousarray(side), [cv2.IMWRITE_JPEG_QUALITY, 90])
    mk = (made * ground.KM)[~seen]
    print('%g deg, %d px (%.0f m a texel): seen %.4f of the plate; made relief rms %.3f km (%.2f to %.2f); lowered under the eye\'s sight %.4f of the plate in %d passes, still in sight %.5f of the made ground; fit of the gain on the seen ground %.1f km per unit, correlation %.3f; height %.2f to %.2f km' % (
        W, N, deg * np.pi / 180 * ground.KM * 1000, seen.mean(), float(np.sqrt((mk ** 2).mean())), mk.min(), mk.max(), low.mean(), passes, left, fit, corr, height.min() * ground.KM, height.max() * ground.KM), flush=True)
    print('   roughness of the mesh plateau against the relief read from the light, by wave: ' + ', '.join(table), flush=True)
    coarse, coarse_w = height, W
