"""The colour plates of the country without slope light, with the cast shadow of the heights laid in.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/relight.py --out out/work/place/relit [--only 1.6]
Values: plates.json, country.light (the note there says what is done and why). Read: the heights of country.py
(--country FOLDER/cW-height.npy, cW-seen.png) and the colour plates as bake.py left them in its work folder
(--plates-in FOLDER/NAME.png, lossless; never the set's own files, so the step can be run again).
Written: OUT/<file of the level> for every level that has heights, with --write also the set's files
(public/assets/mars/full and web, at bake.plates[].size of plates.json and webShare of it, JPEG as bake.py writes them), OUT/sW-shadow.png (the share of the Sun's disc
that reaches the ground, white = open) and the lines of what was measured.
"""
import argparse
import json
import os
import cv2
import numpy as np
from PIL import Image
import geom
import ground

ap = argparse.ArgumentParser()
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--levels', default='src/stops/mars/levels.json')
ap.add_argument('--country', default='out/work/place/country')
ap.add_argument('--plates-in', default='out/work/place/bake', help='the plates as bake.py made them, before this step: NAME.png, lossless')
ap.add_argument('--write', action='store_true', help='also write the plates into public/assets/mars/full and web, at the sizes of plates.json')
ap.add_argument('--out', required=True)
ap.add_argument('--only', default='')
a = ap.parse_args()
C = json.load(open(a.config))['country']
BK = json.load(open(a.config))['bake']
Lg = C['light']
os.makedirs(a.out, exist_ok=True)
only = [float(x) for x in a.only.split(',')] if a.only else None
files = {l['widthDeg']: l['file'] for l in json.load(open(a.levels))['levels']}
sizes = {p['widthDeg']: p['size'] for p in BK['plates']}
# the Sun of this step is the scene's own (the globe's Sun at the spot at the moment light.sunMoment): the place stands
# on the globe so that the light of the approved close image falls on it
sun = geom.scene_sun(Lg['sunMoment'])
print('Sun of the scene at the spot (%s): bearing %.1f, %.1f degrees up' % (Lg['sunMoment'], np.degrees(np.arctan2(sun[0], sun[1])) % 360, np.degrees(np.arcsin(sun[2]))), flush=True)
flat = float(np.hypot(sun[0], sun[1]))
widths = [l['widthDeg'] for l in C['levels']]
H = {w: np.load('%s/c%g-height.npy' % (a.country, w)) for w in widths}
N = C['size']


def read(w, x, y):
    """Bilinear read of level w at plane coordinates (tangents, east and north); nan outside."""
    t = geom.half_tan(w)
    mx = ((x / t + 1) / 2 * N - 0.5).astype(np.float32)
    my = ((1 - y / t) / 2 * N - 0.5).astype(np.float32)
    v = cv2.remap(H[w], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    inside = np.maximum(np.abs(x), np.abs(y)) < t * (1 - 1.0 / N)
    return v, inside


def height_at(x, y, upto):
    """The ground at plane coordinates from the levels down to index `upto` (finer ones are left out), finest inside first."""
    out = np.zeros(x.shape, np.float32)
    for w in widths[:upto + 1]:
        v, inside = read(w, x, y)
        out = np.where(inside, v, out)
    return out


for li, w in enumerate(widths):
    if only is not None and w not in only:
        continue
    t = geom.half_tan(w)
    c = ((np.arange(N) + 0.5) / N * 2 - 1) * t
    x = np.broadcast_to(c[None, :], (N, N)).astype(np.float32)
    y = np.broadcast_to(-c[:, None], (N, N)).astype(np.float32)
    h0 = H[w]
    cell = 2 * t / N
    # the share of the Sun's disc that reaches the ground
    open_ = np.ones((N, N), np.float32)
    size = np.radians(Lg['sunSizeDeg'])
    for u in np.geomspace(cell, Lg['shadowKm'] / ground.KM, Lg['steps']):
        ray = h0 + u * sun[2] / flat
        occ = height_at(x + sun[0] / flat * u, y + sun[1] / flat * u, li)
        open_ = np.minimum(open_, np.clip(0.5 + (ray - occ) / (u * size), 0, 1))
    open_ = cv2.GaussianBlur(open_, (0, 0), 0.8)
    cv2.imwrite('%s/s%g-shadow.png' % (a.out, w), np.round(open_ * 255).astype(np.uint8))
    # the lift the cap gives the heights' normal
    gy, gx = np.gradient(h0, cell)
    nl = np.sqrt(gx * gx + gy * gy + 1)
    ndl = (-gx * sun[0] + gy * sun[1] + sun[2]) / nl
    lift = np.clip((ndl - sun[2]) / max(sun[2] + Lg['wrap'], 0.06), -0.85, 1.6)
    seen = cv2.imread('%s/c%g-seen.png' % (a.country, w), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    seen = cv2.GaussianBlur(seen, (0, 0), 1.5)
    plate = cv2.imread('%s/%s.png' % (a.plates_in, files[w][:-4]))
    if plate is None:
        raise SystemExit('no plate of bake.py for %s in %s' % (files[w], a.plates_in))
    P = plate.shape[0]
    S = geom.scene_of(plate[:, :, ::-1].astype(np.float32) / 255)
    del plate
    up = lambda m: cv2.resize(m, (P, P), interpolation=cv2.INTER_LINEAR)
    open_p, lift_p, seen_p = up(open_), up(lift), up(seen)
    logS = np.log(np.maximum(S, 1e-4))
    lum_w = np.array([0.2126, 0.7152, 0.0722], np.float32)
    L = logS @ lum_w
    deg_px = w / P
    # the colour of the region: the mean (of scene values) of the open, level made ground about each texel
    level = np.clip(1 - np.abs(lift_p) / Lg['steep'], 0, 1)
    wgt = np.clip(open_p * 2 - 1, 0, 1) * (1 - seen_p) * level
    sig = min(Lg['regionDeg'], Lg['regionShare'] * w) / deg_px / 2
    k = max(int(sig / 24), 1)
    small = lambda m: cv2.resize(m, (P // k, P // k), interpolation=cv2.INTER_AREA)
    ws = small(wgt)
    den = cv2.GaussianBlur(ws, (0, 0), sig / k)
    mean_all = [float((small(S[..., c] * wgt)).sum() / max(ws.sum(), 1e-6)) for c in range(3)]
    own = np.log(np.dstack([up((cv2.GaussianBlur(small(S[..., c] * wgt), (0, 0), sig / k) + 1e-4 * mean_all[c]) / (den + 1e-4)) for c in range(3)]))
    # about the place the region's colour is the plateau's of the close view (plateau: measured, printed below),
    # so the made plateau and the seen one are one ground; far out the plate keeps its own
    cp = ((np.arange(P) + 0.5) / P * 2 - 1) * t
    foot = np.degrees(np.arctan(np.hypot(cp[None, :], cp[:, None]))).astype(np.float32)
    m = np.clip((Lg['matchToDeg'] - foot) / (Lg['matchToDeg'] - Lg['matchFromDeg']), 0, 1)
    m = m * m * (3 - 2 * m)
    # the main trough of the map keeps the colour of its own region (it is not plateau): the match ends at its rim
    xd0 = np.degrees(c)
    main0 = ground.country_troughs(C, np.broadcast_to(xd0[None, :], (N, N)), np.broadcast_to(-xd0[:, None], (N, N)))[2]
    # tw: 1 in the main trough, where the plate keeps the map's own paint as it is
    tw = np.zeros((P, P), np.float32)
    if main0 is not None:
        tw = up(np.clip(-main0 / Lg.get('troughKm', 1.0), 0, 1).astype(np.float32))
        tw = tw * tw * (3 - 2 * tw)
        m = m * (1 - tw)
    del main0
    m = m[..., None]
    base = own * (1 - m) + np.log(np.array(Lg['plateau'], np.float32)) * m
    # the made canyon is rock: by the height the colour goes from the plateau's to the wall's (layered) and, on level
    # ground down there, to the floor's
    if 'rock' in Lg:
        Rk = Lg['rock']
        zk = up(h0) * ground.KM
        # where the canyon is: the canyon function of country.py (the plateau's own hollows stay plateau)
        xd = np.degrees(c)
        xg, yg = np.broadcast_to(xd[None, :], (N, N)), np.broadcast_to(-xd[:, None], (N, N))
        behind, ahead, main = ground.country_troughs(C, xg, yg)
        deep = behind if ahead is None else np.minimum(behind, ahead)
        deep = np.minimum(up(deep), zk + (Rk['fromKm'] - Rk['toKm']))
        rockw = np.clip((Rk['fromKm'] - deep) / (Rk['fromKm'] - Rk['toKm']), 0, 1)
        # the main trough is not made rock: where the side canyon runs through its wall the canyon function alone says rock
        rock_fn = np.clip((Rk['fromKm'] - up(behind if ahead is None else np.minimum(behind, ahead))) / (Rk['fromKm'] - Rk['toKm']), 0, 1)
        # and only where the side canyon lies under the trough's own ground: its line ends inside the trough, and without this
        # its floor stood as a pale tongue with a round end on the trough's dark floor (engine stills 2439 and 2713)
        if main is not None:
            rock_fn = rock_fn * np.clip((up(main.astype(np.float32)) - up((behind if ahead is None else np.minimum(behind, ahead)).astype(np.float32))) / Rk.get('underTroughKm', 0.5), 0, 1)
        rockw = rockw * (1 - tw) + rock_fn * tw
        rockw = (rockw * rockw * (3 - 2 * rockw))[..., None]
        xe = np.degrees(cp)[None, :] / Rk['wanderDeg']
        yn = -np.degrees(cp)[:, None] / Rk['wanderDeg']
        zw = zk + Rk['wanderKm'] * ground.lattice_noise(np.broadcast_to(xe, (P, P)) + 300, np.broadcast_to(yn, (P, P)) + 300, Rk['seed'], (512, 512))
        layer = np.zeros((P, P), np.float32)
        for o, (thick, share) in enumerate(zip(Rk['bandsKm'], Rk['shares'])):
            layer += share * ground.lattice_noise(zw / thick + 40 * o, np.zeros((P, P), np.float32), Rk['seed'] + 1 + o, (1024, 4))
        bed = level[..., None]
        rock = np.log(np.array(Rk['wall'], np.float32)) * (1 - bed) + np.log(np.array(Rk['floor'], np.float32)) * bed + (Rk['strata'] * layer * (1 - level))[..., None]
        base = base * (1 - rockw) + rock * rockw
        del zw, layer, rock
    soft = cv2.GaussianBlur(logS, (0, 0), Lg['fineTexels'])
    grain = L - cv2.GaussianBlur(L, (0, 0), Lg['fineTexels'])
    mid = soft - own
    mid_l = mid @ lum_w
    hue = mid - mid_l[..., None]
    hold = Lg['keep'] * open_p * level
    fill = np.array(Lg['fill'], np.float32)
    lim = np.where(mid_l < 0, Lg['darkest'], Lg['brightest']).astype(np.float32)
    after = hold * lim * np.tanh(mid_l / lim)
    # the grain of paint far darker than its region is noise of the black: it goes out there
    gw = np.clip((mid_l + Lg['grainDarkFrom']) / (Lg['grainDarkFrom'] - Lg['grainDarkTo']), 0, 1) * (0.35 + 0.65 * open_p)
    made = np.exp(base + after[..., None] + Lg['hue'] * Lg['hueMost'] * np.tanh(hue / Lg['hueMost']) + Lg['grain'] * (Lg['grainMost'] * np.tanh(grain / Lg['grainMost']) * gw)[..., None]) * (open_p[..., None] + (1 - open_p[..., None]) * fill / np.maximum(1 + cv2.GaussianBlur(lift_p, (0, 0), Lg['shadowLiftTexels']), Lg['shadowLiftLeast'])[..., None])
    # about the spot the made ground takes the tone of the ground the close view shows there (close: its dark fore ground,
    # measured on the two sides of the change of view), by the distance on the ground, so both sides are one ground at T
    if 'close' in Lg:
        Cl = Lg['close']
        cm = np.clip((Cl['toDeg'] - foot) / (Cl['toDeg'] - Cl['fromDeg']), 0, 1)
        cm = cm * cm * (3 - 2 * cm)
        made = made * (1 + (np.array(Cl['gain'], np.float32) - 1) * cm[..., None])
        del cm
    # in the main trough the map's paint stays as it is under the cast shadow (never darker for it than the fill allows)
    shade = open_p[..., None] + (1 - open_p[..., None]) * fill
    keepw = (tw * (1 - (rockw[..., 0] if 'rock' in Lg else 0)))[..., None]
    made = made * (1 - keepw) + S * shade * keepw
    del shade, keepw
    band = mid_l
    pl = (seen_p > 0.99) & (open_p > 0.9) & (np.abs(lift_p) < 0.2) & (up(h0) * ground.KM > -1.0)
    plateau_seen = (S[pl] / (1 + lift_p[pl])[:, None]).mean(0) if pl.sum() > 1000 else np.full(3, np.nan)
    plateau_made = np.exp(own[wgt > 0.9]).mean(0) if (wgt > 0.9).sum() > 1000 else np.full(3, np.nan)
    del soft, mid, hue, base, logS, own
    kept = S / (1 + lift_p)[..., None]
    out = made * (1 - seen_p[..., None]) + kept * seen_p[..., None]
    del made, kept, S
    img = np.round(np.clip(geom.texel_of(out), 0, 1) * 255).astype(np.uint8)[:, :, ::-1]
    cv2.imwrite('%s/%s' % (a.out, files[w]), np.ascontiguousarray(img), [cv2.IMWRITE_JPEG_QUALITY, 92])
    if a.write:
        for kind in ('full', 'web'):
            path = 'public/assets/mars/%s/%s' % (kind, files[w])
            s = sizes[w] if kind == 'full' else int(round(sizes[w] * BK['webShare']))
            one = img if s == P else cv2.resize(img, (s, s), interpolation=cv2.INTER_AREA)
            Image.fromarray(np.ascontiguousarray(one[:, :, ::-1])).save(path, quality=BK['jpegQuality'], subsampling=0)
    m = seen < 0.5
    mp = seen_p < 0.5
    print('%g deg: in cast shadow (under a half open) %.4f of the made ground, %.4f of the seen ground; lift on the made ground rms %.3f (%.2f to %.2f), on the seen ground rms %.3f; middle waves of the plate on the made ground (painted light and blots): rms %.3f log units before, %.3f after; level open plateau of the seen ground, colour over 1 + lift (scene values) %s; region colour of the made ground %s' % (
        w, float((open_[m] < 0.5).mean()), float((open_[~m] < 0.5).mean()) if (~m).any() else 0, float(np.sqrt((lift[m] ** 2).mean())), float(lift[m].min()), float(lift[m].max()),
        float(np.sqrt((lift[~m] ** 2).mean())) if (~m).any() else 0, float(np.sqrt((band[mp] ** 2).mean())), float(np.sqrt((after[mp] ** 2).mean())), np.round(plateau_seen, 4), np.round(plateau_made, 4)), flush=True)
