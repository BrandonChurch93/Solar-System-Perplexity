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
# the light painted in the plates: given for the frame bearing, it turns with the place as the takes do
plate_sun = geom.plate_sun_bearing(C)
print('heading %.2f, turn %.2f, light of the plates from %.1f' % (geom.heading_bearing(), geom.turn_deg(C), plate_sun), flush=True)
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
        coarse, coarse_w = np.load(pre + ('-plain.npy' if os.path.exists(pre + '-plain.npy') else '-height.npy')), W
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
    # the lines turn with the place (the plan's heading); the main trough of the globe's map lies where the map has it
    behind, ahead, main = ground.country_troughs(C, xg, yg)
    prior = behind / ground.KM
    # the canyon the close view looks along runs on beyond the far end of its meshes too (canyon.east): without it
    # the made ground closes the canyon there in a round pit
    if ahead is not None:
        E = K['east']
        prior_east = ahead / ground.KM
        prior = np.minimum(prior, prior_east)
        # the meshes themselves close the canyon far out (their far ground is level from about 0.85 degrees): from
        # takeFromDeg to takeToDeg from the eye's foot the mesh is lowered to the carried on canyon where that is deeper
        # (done after the far heights are calmed, below, so that the canyon keeps its walls where the eye's rays ran
        # over it far out; the main trough is taken the same way)
        take = smooth((np.hypot(xg, yg) - E['takeFromDeg']) / (E['takeToDeg'] - E['takeFromDeg']))
        cut = prior_east if main is None else np.minimum(prior_east, main / ground.KM)
    else:
        take = cut = None
    if main is not None:
        prior = np.minimum(prior, main / ground.KM)
    del behind, ahead, main
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
    if take is not None:
        true = np.where(seen, true + take * np.minimum(cut - true, 0), true).astype(np.float32)
    del take, cut
    exact = seen & (foot <= F['fromDeg'])
    far = cv2.distanceTransform((~seen).astype(np.uint8), cv2.DIST_L2, 5) * deg
    # the mesh has its say on the made ground out to zeroShare of the width, by a line that wanders (seeded noise),
    # so that the fall from the seen ground's own level to the country's is a long gentle one with no straight foot
    Z = C.get('zeroWander')
    zn = 1.0
    if Z:
        zc = Z['cellShare'] * W
        zn = 1 + Z['amount'] * (2 * ground.lattice_noise((xg + 80) / zc, (yg + 80) / zc, Z['seed'], (256, 256)) - 1)
    known = seen | (far > C['zeroShare'] * W * zn)
    diff = ground.membrane(np.where(seen, true - base, 0), known)
    # the first round after the place has moved has no plates yet (bake.py needs these heights): no relief is read
    # then, and the round after it reads it
    raw = cv2.imread(level['picture'])
    if raw is None:
        print('   no plate %s yet: no relief read from its light this round' % level['picture'], flush=True)
        pic = np.full((N, N, 3), 128, np.uint8)
        rel = np.zeros((N, N), np.float32)
    else:
        pic = cv2.resize(raw, (N, N), interpolation=cv2.INTER_AREA)
        rel = ground.relief_from_light(ground.light(pic), deg, plate_sun, broad, hold=C['hold'])
        rel = rel * C['gainKm']
    del raw
    # the made ground takes the roughness of the mesh plateau beside it, octave by octave
    filled = ground.membrane(np.where(seen, true, 0), seen) * ground.KM
    plateau = exact & (true * ground.KM > C['plateauKm'])
    tb, _ = ground.octaves(filled, broad / deg / 2)
    rb, _ = ground.octaves(rel, broad / deg / 2)
    rel = np.zeros_like(rel)
    rel_far = np.zeros_like(rel)
    rel_near = np.zeros_like(rel)
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
        # the plateau is nearly flat: no octave of the relief read from the plate stands steeper than reliefSlope
        # (rms height over the wavelength, times two pi), whatever the plate's streaks say
        if 'reliefSlope' in C:
            rms = float(np.sqrt((rband[~seen] ** 2).mean()))
            most = C['reliefSlope'] * np.radians(wave) * ground.KM / (2 * np.pi)
            f = min(f, most / max(rms, 1e-9))
            cap_far = min(C['roughFar'], most / max(rms, 1e-9))
        else:
            cap_far = C['roughFar']
        table.append('%.3g deg x%.2f' % (wave, f))
        rel += rband * (f + (cap_far - f) * out_far)
        rel_far += rband * cap_far
        rel_near += rband * f
    # the far ground the eye saw only along its rays takes the relief of the plate as the made ground beside it
    # does, growing in beyond far.fromDeg: no flat fan with straight sides stands in the country. The made ground
    # starts at the border of the seen ground with the relief the seen side has there, so the border is no crease
    in_far = smooth((foot - F['fromDeg']) / C['roughFarDeg'])
    rel_in = rel_far * in_far
    # the border of the picture's field is a straight line on the ground: the relief of the made ground runs on
    # across it and dies away inside along a line that wanders (border: share of the width, cells of a seeded noise)
    B = C.get('border')
    keep = np.ones((N, N), np.float32)
    outside = ~seen
    if B:
        flood = (~seen).astype(np.uint8)
        mask = np.zeros((N + 2, N + 2), np.uint8)
        cv2.floodFill(flood, mask, (0, 0), 2)
        outside = flood == 2
        inward = cv2.distanceTransform((~outside).astype(np.uint8), cv2.DIST_L2, 5) * deg
        cellw = B['cellShare'] * W
        wn = 0.65 * ground.lattice_noise((xg + 50) / cellw, (yg + 50) / cellw, B['seed'], (256, 256)) + 0.35 * ground.lattice_noise((xg + 50) / cellw * 2.7, (yg + 50) / cellw * 2.7, B['seed'] + 1, (256, 256))
        reach = min(B['share'] * W, B['mostDeg']) * np.clip(0.55 + 0.6 * wn, 0.08, 1.0)
        keep = smooth(inward / reach)
    join = np.where(outside, 1.0, smooth(far / (C['joinShare'] * W)))
    made = (rel_in + (rel - rel_in) * join) / ground.KM * (1 - wb)
    height = np.where(seen, true + (rel_in + (rel_near - rel_in) * (1 - keep)) / ground.KM * (1 - wb), base + diff + made).astype(np.float32)
    exact = exact & (keep > 0.999)
    dirs = geom.patch_dirs(W, N)
    # ground the close view's mesh leaves open inside its own ground (an island: mist, a tear) is filled by the
    # membrane from the ground round it and is not lowered: it is not ground the eye proved empty
    free = outside if C.get('islandsFilled') else ~seen
    height, low, passes, left = ground.lower_under_sight(height, free, dirs, eye, min(C['stepKm'], 1.2 * np.radians(deg) * ground.KM), passes=800, clear=C['clear'])
    # no slope steeper than slopeMost: a wall of the close view's mesh, a tear of it or the foot of lowered ground is
    # a step from one texel to the next, which a mesh of one vertex a texel draws as a curtain. The limit is a
    # slope of the ground, the same at every level, so the levels still agree where one hands on to the next
    before = float(max(np.abs(np.diff(height, axis=0)).max(), np.abs(np.diff(height, axis=1)).max()) / np.radians(deg))
    held_ = ground.hold_slope(height, C['slopeMost'] * np.radians(deg))
    moved = np.abs(held_ - height) * ground.KM
    height = held_
    after = float(max(np.abs(np.diff(height, axis=0)).max(), np.abs(np.diff(height, axis=1)).max()) / np.radians(deg))
    idx = np.nonzero(~seen)
    left = float(eye.sees(dirs[idx] * (1 + height[idx])[:, None], C['clear']).mean())
    slope_line = 'largest step between neighbours %.1f texel widths before the slope was held, %.2f after; moved more than 5 m on %.4f of the plate (seen ground %.4f), most %.0f m' % (before, after, float((moved > 0.005).mean()), float((moved > 0.005)[seen].mean()) if seen.any() else 0.0, moved.max() * 1000)
    # the craters of the plateau (ground.craters): laid on last, so the levels are tied to each other by the ground
    # without them (cW-plain.npy) and each level holds the craters its texels can draw; in the border band a level
    # holds the craters of the coarser one, as it holds its heights there
    plain = height
    n_craters = 0
    if 'craters' in C:
        R = C['craters']
        kmdeg = np.radians(1.0) * ground.KM
        ring = np.linspace(0, 2 * np.pi, 9)[:-1]

        def stands(cx, cy, r_deg):
            px = np.concatenate([cx[:, None], cx[:, None] + np.cos(ring)[None, :] * (r_deg * R['clear'])[:, None]], axis=1).astype(np.float32)
            py = np.concatenate([cy[:, None], cy[:, None] + np.sin(ring)[None, :] * (r_deg * R['clear'])[:, None]], axis=1).astype(np.float32)
            deep = ground.country_deep(C, px, py)
            ok = (deep > R['canyonKm']).all(axis=1)
            # not on or beside ground the close view saw (the mask of the outermost level, a little wider)
            t8 = geom.half_tan(seen_far_w)
            n8 = seen_far.shape[0]
            jx = np.clip(((np.tan(np.radians(px)) / t8 + 1) / 2 * n8).astype(np.int64), 0, n8 - 1)
            iy = np.clip(((1 - (np.tan(np.radians(py)) / t8 + 1) / 2) * n8).astype(np.int64), 0, n8 - 1)
            return ok & ~seen_far[iy, jx].any(axis=1)

        wfar = C['levels'][0]['widthDeg']
        seen_far_w = wfar
        sf = np.isfinite(np.load('%s/q%g-height.npy' % (a.out, wfar))).astype(np.uint8)
        seen_far = cv2.dilate(sf, np.ones((2 * R['seenTexels'] + 1,) * 2, np.uint8)) > 0
        cr, n_craters = ground.craters(xg, yg, R, R['texels'] * deg * kmdeg, stands)
        if coarse_w is not None:
            cr_c, _ = ground.craters(xg, yg, R, R['texels'] * coarse_w / N * kmdeg, stands)
            cr = cr * (1 - wb) + cr_c * wb
        else:
            cr = cr * (1 - wb)
        height = (plain + np.where(seen, 0, cr) / ground.KM).astype(np.float32)
    np.save(pre + '-plain.npy', plain.astype(np.float32))
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
        rt = ground.relief_from_light(Lt, deg, plate_sun, broad, hold=C['hold'])
        th = height * ground.KM
        th = th - cv2.GaussianBlur(th, (0, 0), broad / deg / 2)
        x, y = rt[inner], th[inner]
        fit = float((x * y).sum() / max((x * x).sum(), 1e-12))
        corr = float(np.corrcoef(x, y)[0, 1])
    look = np.dstack([ground.shaded(height, deg, plate_sun)] * 3)
    look[~seen] *= np.array([1.0, 0.9, 0.8])
    s = 1024
    side = np.hstack([cv2.resize(pic, (s, s), interpolation=cv2.INTER_AREA), cv2.resize(np.round(look * 255).astype(np.uint8), (s, s), interpolation=cv2.INTER_AREA)])
    cv2.imwrite(pre + '-look.jpg', np.ascontiguousarray(side), [cv2.IMWRITE_JPEG_QUALITY, 90])
    mk = (made * ground.KM)[~seen]
    print('%g deg, %d px (%.0f m a texel): seen %.4f of the plate; made relief rms %.3f km (%.2f to %.2f); lowered under the eye\'s sight %.4f of the plate in %d passes, still in sight %.5f of the made ground; fit of the gain on the seen ground %.1f km per unit, correlation %.3f; height %.2f to %.2f km' % (
        W, N, deg * np.pi / 180 * ground.KM * 1000, seen.mean(), float(np.sqrt((mk ** 2).mean())), mk.min(), mk.max(), low.mean(), passes, left, fit, corr, height.min() * ground.KM, height.max() * ground.KM), flush=True)
    print('   ' + slope_line, flush=True)
    print('   roughness of the mesh plateau against the relief read from the light, by wave: ' + ', '.join(table), flush=True)
    print('   craters laid on this level: %d' % n_craters, flush=True)
    coarse, coarse_w = plain, W
