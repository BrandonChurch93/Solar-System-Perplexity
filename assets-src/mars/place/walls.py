"""The wall law of the plates (MAIL 1034, 1091 point 2, 1150 D of /root, decision d291): where a level's own heights are
wall, the plate is rock of those heights. Ground painted for a view from above is not stretched down a wall, and where the
approved picture seen from above holds a wall in fewer pixels than the plate has texels, the plate is not that smear.

For the levels of src/stops/mars/country.json from `fromDeg` down, coarse to fine: The heights are read as the cap draws them (`as_drawn`:
each level goes over into the next coarser one across the outer country.json edgeShare of its width).

  where  = wall: the sine of the slope of the level's heights between the two limits `wallSin` (from the angle of rest
           on, where no loose ground lies and paint for a view from above is drawn out to 1.5 times and to twice its length);
           talus: the slope between the limits of detail.json `talus`, where rock from a wall runs onto it. Not where the
           picture's own ground lies on the plate as fine as the plate: where a picture pixel (heights.py --picture-only,
           the stems of --top) covers `grainTexels` texels or fewer the plate stays as it is, from twice that on it is rock, judged by the
           greater part of the ground within `keepTexels` texels, so the border is one line.
  tone   = on wall the law's own rock, the same on every level: plates.json country.light.rock.wall (the lit north wall of
           the approved close image over the light of a wall of 45 degrees facing the Sun), in scene values, times the
           light below. Coarser than `broadKm` of ground the wall keeps the take's own tone and colour (MAIL 1220: ONE
           BODY; the mean of the take over the wall within broadKm over the same mean of the law's rock, per colour, at
           most `broadClip`), finer it is the law's rock: what the level above `fromDeg` can show of a wall stays as it
           shows it. On talus the plate's own broad tone: its mean over takes.fitPx px of the take, from talus alone.
  heights = flutes, gullies, beds and fans move the heights the light is read on only finer than `broadKm` (a flute
           wider than that draws its tone but is the heights' own form; the displacement's mean over wall and talus
           within broadKm is taken out), so no cliff stands where a wall ends.
  joints = columns down the fall line (`jointKm`, `jointCount`), each reading its beds at a height of its own
           (`jointShift`); the beds' step in the heights fades in from a column's border over `jointSoftKm`.
  flutes = spurs and gullies along the fall line: a seeded noise of the ground (the place's own east and north in km, so
           the same rock on every level) drawn out along the fall line, in octaves of `fluteKm`. The fall line is read on
           the heights softened over `fallKm` of ground, the same length on every level. A level draws the octaves that are
           at least `grainTexels` texels of its own wide (whole from twice that), so a child draws every flute of its
           parent and adds only finer ones.
  flow   = the heights' own flow, once, on the coarsest level (steepest descent on a grid of gullyCellKm, never finer than
           two texels, roughened by a seeded noise so that water gathers): gullies where the gathered ground is between
           gullyKm2[0] and gullyKm2[1]; the finer levels read the same field at their place, so there is one network.
           Where wall ground drains onto talus the same flow draws the fans.
  beds   = layers by height (the height wanders with the place as in detail.json strata), in the thicknesses of bedsKm,
           each bed of uneven thickness (a warp of the height by a seeded noise) and of a hardness that changes along the
           wall (lateralKm): a hard bed stands as a riser with a bench above it (ledge, a share of its thickness), a soft
           one is a slope. The beds are read on the heights with the gullies and flutes in them, times bedShift, so their
           edges run up every gully and out on every spur: from above they are steps, not height lines. A thickness is
           drawn only where its thinnest bed is wider than bedTexels texels of the level, whole from twice that.
  light  = by the heights with flutes, gullies, beds and fans on them (laid on the level's heights softened by
           country.light.shadowLiftTexels of their grid). The plate carries its whole light: since MAIL 913 the cap does
           not light an own level (src/stops/mars/cap.json light.own 0). On wall, in scene values: the Sun's part is
           1 + lift (the cap's own law of plates.json country.light) where the Sun reaches (the cast shadow of the
           level's heights and of the fine relief itself); the sky's part is `shadowWall` (the shadowed wall over the lit
           north wall of the approved close image, per colour, so over twice the rock) times the open sky the texel
           sees; the two are joined by a soft greater of the two (power `join`), so a face turned from the Sun is never
           darker than the same face in cast shadow. The open sky: what a texel sees of it over openKm on eight
           bearings, weighed by its own face, over openRef. A shadowed face turned to the open canyon is lighter than
           a recess, a rim lighter than a foot. No painted light. On talus the take's broad tone times what the fine
           relief adds: that light over the light of the softened heights without the fine relief.
  grain  = off a wall the plate's own grain under grainTexels texels. On a wall the take's grain goes out with the wall's
           ramp (MAIL 1247: it is the picture of resting blocks) and the rock has its own: the ground's noise of
           `grainCellTexels` texels drawn out along the fall line (`grainLen` cells each way in `grainSteps` steps), as
           strong as the take's grain is on the ground beside the wall (root mean square under grainTexels, read within
           broadKm), less what the rock's fine relief already gives. The tool prints the three numbers.
           `skyLeast`: the least open sky a texel is given (the light the rock around throws into a slot).

Values: plates.json takes.walls. Run after bodyfull.py and before pyramid.py:

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/walls.py --dir STAGE --out OUT --top out/work/place/topp [--look DIR]
"""
import argparse
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom  # noqa: E402
import countrytake as ct  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = 3389.5
Image.MAX_IMAGE_PIXELS = None


def fract(x):
    return x - np.floor(x)


def hash2(px, py):
    q = np.stack([fract(px * 0.1031), fract(py * 0.1030), fract(px * 0.0973)], 0).astype(np.float64)
    d = q[0] * (q[1] + 33.33) + q[1] * (q[2] + 33.33) + q[2] * (q[0] + 33.33)
    q = q + d
    return fract((q[0] + q[1]) * q[2])


def noise(px, py):
    ix, iy = np.floor(px), np.floor(py)
    fx, fy = px - ix, py - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = hash2(ix, iy) * (1 - fx) + hash2(ix + 1, iy) * fx
    b = hash2(ix, iy + 1) * (1 - fx) + hash2(ix + 1, iy + 1) * fx
    return a * (1 - fy) + b * fy


def as_drawn(H, x, y, least, feather):
    """The ground at (x, y) as the cap draws it (src/bodies/cap.ts levelRead): from the levels at least `least` degrees
    wide, coarse to fine, each one mixed over the coarser ones by a weight that falls from 1 to 0 across the outer
    `feather` of its width (country.json edgeShare; the cap's feather is the same number). countrytake.Heights.at
    switches hard at a level's border; where a level's own heights in that band are not its parent's (the 0.3 level at
    its north side, by up to 4.18 km) the hard switch reads a wall that the film never shows."""
    out = np.zeros(x.shape, np.float32)
    for w, h in H.levels:
        if w < least:
            continue
        t, n = ct.half(w), h.shape[0]
        v = cv2.remap(h, ((x / t + 1) / 2 * n - 0.5).astype(np.float32), ((1 - y / t) / 2 * n - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        q = np.maximum(np.abs(x), np.abs(y)) / (2 * t)
        k = (1 - sm((q - (0.5 - feather)) / feather)).astype(np.float32)
        out = out + (v - out) * k
    return out


def sm(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def beds(level, thick, row, warp, edge, crisp, lateral):
    """Beds of uneven thickness along the height `level` (km): the tone (-0.5 to 0.5) and the step (a riser at the foot of a
    hard bed, a bench above it, in shares of the thickness times the bed's hardness) of the bed a height lies in. `lateral`
    (0 to 1, a field of the ground) moves every bed's hardness along the wall, each bed by its own phase."""
    u = level / thick
    i = np.floor(u)
    f = u - i
    f = f * f * (3 - 2 * f)
    u = u + warp * ((hash2(i, np.full_like(i, row + 0.5)) * (1 - f) + hash2(i + 1, np.full_like(i, row + 0.5)) * f) - 0.5)
    i = np.floor(u)
    f = u - i
    row_ = np.full_like(i, row)
    tone, tone0 = hash2(i, row_) - 0.5, hash2(i - 1, row_) - 0.5
    hard = sm(2 * np.abs(2 * fract(hash2(i, row_ + 3.7) + lateral) - 1) - 0.5)
    hard0 = sm(2 * np.abs(2 * fract(hash2(i - 1, row_ + 3.7) + lateral) - 1) - 0.5)
    t = sm(f / edge)
    c = sm(f / crisp)
    return tone0 * (1 - c) + tone * c, (-0.5 * hard0) * (1 - t) + hard * (0.5 - f) * t


def flow(height, zone, source):
    """What gathers at every cell of a grid inside `zone`: the sum of `source` over the cells that drain through it, itself
    included. A cell drains to one of the two neighbours on either side of its fall line, the nearer the likelier, chosen by
    a hash of the cell (so that a plane does not drain along the grid, and lines meet), and to the steepest neighbour where
    that one is not lower."""
    g = height.shape[0]
    idx = np.arange(g * g).reshape(g, g)
    pad, padi = np.pad(height, 1, mode='edge'), np.pad(idx, 1, mode='edge')
    ring = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
    best = np.zeros((g, g), np.float32)
    recv = idx.copy()
    for dx, dy in ring:
        drop = (height - pad[1 + dy:1 + dy + g, 1 + dx:1 + dx + g]) / float(np.hypot(dy, dx))
        m = drop > best
        best[m] = drop[m]
        recv[m] = padi[1 + dy:1 + dy + g, 1 + dx:1 + dx + g][m]
    gy, gx = np.gradient(height.astype(np.float64))
    turn = np.mod(np.arctan2(-gy, -gx), 2 * np.pi) / (np.pi / 4)
    k = np.floor(turn)
    jj, ii = np.meshgrid(np.arange(g, dtype=np.float64), np.arange(g, dtype=np.float64))
    k = (k + (hash2(jj + 0.5, ii + 0.5) < turn - k)).astype(np.int64) % 8
    for q, (dx, dy) in enumerate(ring):
        m = (k == q) & (pad[1 + dy:1 + dy + g, 1 + dx:1 + dx + g] < height)
        recv[m] = padi[1 + dy:1 + dy + g, 1 + dx:1 + dx + g][m]
    recv[~zone] = idx[~zone]
    r = recv.ravel()
    go = r != idx.ravel()
    src = source.ravel().astype(np.float64)
    acc = src.copy()
    for _ in range(6000):
        new = src + np.bincount(r[go], weights=acc[go], minlength=g * g)
        if float(np.abs(new - acc).max()) < 1e-9:
            break
        acc = new
    return acc.reshape(g, g)


def skylight(height_km, cell_km, reach_km, steps):
    """The light of the open sky on every cell, level open ground = 1: on eight bearings the sky between the highest ground
    over `reach_km` and the zenith, weighed by how the cell's own face is turned to it. A face turned to the open canyon
    gets more than a recess, a bench more than the riser under it."""
    g = height_km.shape[0]
    jj, ii = np.meshgrid(np.arange(g, dtype=np.float32), np.arange(g, dtype=np.float32))
    hy, hx = np.gradient(height_km, cell_km)
    norm = np.sqrt(hx * hx + hy * hy + 1)
    acc = np.zeros((g, g), np.float32)
    for k in range(8):
        a = np.pi * k / 4
        cx, cy = float(np.cos(a)), float(np.sin(a))
        top = np.zeros((g, g), np.float32)
        for u in np.geomspace(cell_km, reach_km, steps):
            far = cv2.remap(height_km, (jj + cx * u / cell_km).astype(np.float32), (ii + cy * u / cell_km).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            top = np.maximum(top, (far - height_km) / u)
        rim = np.arctan(top)
        mid = (rim + np.pi / 2) / 2
        acc += (1 - np.sin(rim)) * np.maximum((-(hx * cx + hy * cy) * np.cos(mid) + np.sin(mid)) / norm, 0)
    return (acc / (8 * np.sqrt(0.5))).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--top', required=True, help='the approved picture from above at the plates\' sizes (heights.py --picture-only), stems t<width>')
    ap.add_argument('--levels')
    ap.add_argument('--look', help='folder for the masks and the light as pictures')
    ap.add_argument('--field', help='file the flow of the coarsest level is kept in between runs (made when missing)')
    ap.add_argument('--plates', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json'))
    a = ap.parse_args()
    D = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'detail.json')))
    PL = json.load(open(a.plates))
    P, Lg = PL['takes'], PL['country']['light']
    W, RK = P['walls'], Lg['rock']
    country = json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json')))
    H = ct.Heights(os.path.join(ROOT, 'public', 'assets', 'mars', 'full'), country)
    only = a.levels.split(',') if a.levels else None
    os.makedirs(a.out, exist_ok=True)
    if a.look:
        os.makedirs(a.look, exist_ok=True)
    sun = geom.scene_sun(Lg['sunMoment'])
    up, flat = float(sun[2]), float(np.hypot(sun[0], sun[1]))
    least = Lg['shadowLiftLeast']
    _, east, north = geom.patch_frame()
    grain = W['grainTexels']
    feather = country['edgeShare']
    field = None   # the flow of the coarsest level: (half width, gullies, fed)
    for L in sorted(country['levels'], key=lambda l: -l['widthDeg']):
        w = L['widthDeg']
        name = 'land-%s.jpg' % str(w).replace('.', 'p')
        if w > W['fromDeg']:
            continue
        f = Image.open(os.path.join(a.dir, name))
        kept = (dict(f.quantization), JpegImagePlugin.get_sampling(f))
        img = np.asarray(f.convert('RGB')).astype(np.float32)
        n = img.shape[0]
        t = ct.half(w)
        px = 2 * t / n
        tex_km = px * R
        c = (np.arange(n) + 0.5) / n
        x = np.broadcast_to(((2 * c - 1) * t)[None, :], (n, n)).astype(np.float32)
        y = np.broadcast_to(((1 - 2 * c) * t)[:, None], (n, n)).astype(np.float32)
        h = cv2.GaussianBlur(as_drawn(H, x, y, w, feather), (0, 0), max(n / L['size']['full'], 1.0) * 0.5)
        # everything is read on the heights softened by shadowLiftTexels of their own grid: no facet of that grid, and
        # no beat of it against the plate's, stands in the wall's border or in its light
        hsoft = cv2.GaussianBlur(h, (0, 0), max(n / L['size']['full'], 1.0) * Lg['shadowLiftTexels'])
        gy, gx = np.gradient(hsoft, px)
        tan = np.sqrt(gx * gx + gy * gy).astype(np.float32)
        ns0 = ((-gx * sun[0] + gy * sun[1] + sun[2]) / np.sqrt(gx * gx + gy * gy + 1)).astype(np.float32)
        cap = np.maximum(1 + np.clip((ns0 - up) / max(up + Lg['wrap'], 0.06), -0.85, 1.6), least).astype(np.float32)   # the light of the softened heights without the fine relief
        del gx, gy, ns0
        sin = (tan / np.sqrt(1 + tan * tan)).astype(np.float32)
        wall = sm((sin - W['wallSin'][0]) / (W['wallSin'][1] - W['wallSin'][0])).astype(np.float32)
        dirs = geom.patch_dirs(w, n)
        kx = ((dirs @ east) * R).astype(np.float32)
        ky = ((dirs @ north) * R).astype(np.float32)
        del dirs
        # the flow of the heights, once, on the coarsest level; the finer levels read the same field at their place
        if field is None and a.field and os.path.exists(a.field):
            z = np.load(a.field)
            field = (float(z['t']), z['gul'], z['fed'], float(z['cell']))
        if field is None:
            cell = max(W['gullyCellKm'] / tex_km, 2.0)
            g = int(round(n / cell))
            cell_km = tex_km * n / g
            small = lambda f_: cv2.resize(f_, (g, g), interpolation=cv2.INTER_AREA)
            hg, kxg, kyg, sing, wallg = small(h), small(kx), small(ky), small(sin), small(wall)
            rough = (noise(kxg.astype(np.float64) / W['flowNoiseKm'], kyg.astype(np.float64) / W['flowNoiseKm']) - 0.5) * W['flowNoiseDepthKm'] / R
            zone = sing > D['talus'][0]
            gathered = flow((hg + rough).astype(np.float32), zone, np.ones((g, g))) * cell_km * cell_km
            fed = flow((hg + rough).astype(np.float32), zone, wallg) * cell_km * cell_km
            lo, hi = np.log(W['gullyKm2'][0]), np.log(W['gullyKm2'][1])
            gulg = sm((np.log(np.maximum(gathered, 1e-9)) - lo) / (hi - lo)).astype(np.float32)
            gulg = cv2.GaussianBlur(gulg, (0, 0), W['gullySoftCells'])
            fedg = cv2.GaussianBlur(sm(fed / W['fedKm2']).astype(np.float32), (0, 0), 1.0)
            field = (t, gulg, fedg, cell_km)
            if a.field:
                np.savez(a.field, t=t, gul=gulg, fed=fedg, cell=cell_km)
            del hg, kxg, kyg, sing, wallg, rough, zone, gathered, fed
        t0, gulg, fedg, cell_km = field
        g = gulg.shape[0]
        u = ((x / t0 + 1) / 2 * g - 0.5).astype(np.float32)
        v = ((1 - y / t0) / 2 * g - 0.5).astype(np.float32)
        gul = np.clip(cv2.remap(gulg, u, v, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), 0, 1)
        below = np.clip(cv2.remap(fedg, u, v, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), 0, 1)
        del u, v, x, y
        talus = (sm((sin - D['talus'][0]) / (D['talus'][1] - D['talus'][0])) * (1 - sm((sin - W['restSin'][0]) / (W['restSin'][1] - W['restSin'][0]))) * (1 - wall) * below).astype(np.float32)
        del below
        # not where the picture's own ground lies on the plate as fine as the plate
        stem = os.path.join(a.top, 't%g' % w)
        own = 0.0
        if os.path.exists(stem + '-height.npy'):
            seen = np.isfinite(np.load(stem + '-height.npy'))
            lies = np.where(seen, np.load(stem + '-reach.npy') / (w / n), 1e9).astype(np.float32)
            # by the greater part of the ground about a texel (keepTexels), so that the border between the picture's
            # ground and rock is one line and not the stripes of the picture's own footprints
            keep = cv2.GaussianBlur((seen * (1 - sm((lies - grain) / grain))).astype(np.float32), (0, 0), W['keepTexels'])
            keep = cv2.GaussianBlur(sm((keep - 0.35) / 0.3).astype(np.float32), (0, 0), 2.0)
            own = float((keep * wall).sum() / max(float(wall.sum()), 1.0))
            wall, talus = wall * (1 - keep), talus * (1 - keep)
            del seen, lies, keep
        if only and str(w) not in only:
            continue
        # the plate's broad tone on talus (the wall's tone is the law's rock, not the take's paint)
        sigma = P['fitPx'] * n / 1254.0
        share = cv2.GaussianBlur(talus, (0, 0), sigma)
        tone_talus = cv2.GaussianBlur(img * talus[..., None], (0, 0), sigma) / np.maximum(share, 1e-4)[..., None]
        del share
        # flutes: the ground's own noise drawn out along the fall line of the heights, in octaves of the ground
        span = tex_km * tan
        cut = -W['gullyDepthKm'] * gul
        hs = cv2.GaussianBlur(h, (0, 0), W['fallKm'] / tex_km)
        fy, fx = np.gradient(hs, px)
        fl = np.maximum(np.sqrt(fx * fx + fy * fy), 1e-6)
        ue, un = (fx / fl).astype(np.float64), (-fy / fl).astype(np.float64)
        del hs, fx, fy, fl
        ke, kn = kx.astype(np.float64), ky.astype(np.float64)
        streak = np.zeros((n, n), np.float32)
        drawn = []
        for k, size in enumerate(W['fluteKm']):
            wgt = float(sm((size / tex_km - grain) / grain))
            if wgt <= 0:
                continue
            drawn.append('%g km %.2f' % (size, wgt))
            acc = np.zeros((n, n), np.float32)
            ca, sa = np.cos(0.6 + 1.1 * k), np.sin(0.6 + 1.1 * k)   # each octave's lattice is turned, so no lattice reads
            for q in np.linspace(-W['fluteLen'] * size, W['fluteLen'] * size, W['fluteSteps']):
                pe, pn = (ke + q * ue) / size, (kn + q * un) / size
                acc += noise(ca * pe - sa * pn + 31.0 + 7.3 * k, sa * pe + ca * pn + 17.0 + 3.1 * k).astype(np.float32)
            del pe, pn
            acc = np.clip((acc / W['fluteSteps'] - 0.5) * W['fluteGain'], -1, 1) * wgt
            if size <= W['broadKm']:   # a flute wider than broadKm is the heights' own form and does not move them
                cut += (W['fluteDepth'] * size) * acc
            streak += (W['fluteTone'] * W['fluteShare'] ** k) * acc
            del acc
        # joints: columns down the fall line, each with its beds at a height of its own
        size = W['jointKm']
        wj = float(sm((size / (2 * W['jointCount']) / tex_km - grain) / grain))
        jog = np.zeros((n, n), np.float32)
        jw = None
        if wj > 0:
            for q in np.linspace(-W['fluteLen'] * size, W['fluteLen'] * size, W['fluteSteps']):
                pe, pn = (ke + q * ue) / size, (kn + q * un) / size
                jog += noise(0.8 * pe - 0.6 * pn + 53.0, 0.6 * pe + 0.8 * pn + 71.0).astype(np.float32)
            del pe, pn
            jv = (np.clip((jog / W['fluteSteps'] - 0.5) * W['fluteGain'], -0.999, 0.999) * W['jointCount']).astype(np.float32)
            col = np.floor(jv)
            # the beds' step in the heights fades to nothing toward a column's border (ground distance jointSoftKm), so
            # that the heights stay whole across a joint; the beds' tone keeps its offset
            k3 = np.ones((3, 3), np.uint8)
            jw = cv2.distanceTransform((cv2.dilate(col, k3) == cv2.erode(col, k3)).astype(np.uint8), cv2.DIST_L2, 5)
            jw = (1 - wj * (1 - sm(jw * (tex_km / W['jointSoftKm'])))).astype(np.float32)
            del jv, k3
            jog = ((np.modf(np.sin(col * 12.9898 + 4.1) * 43758.5453)[0] % 1.0 - 0.5) * wj).astype(np.float32)
            del col
        # the rock's own grain (MAIL 1247): the ground's noise of grainCellTexels texels drawn out along the fall line
        gsz = W['grainCellTexels'] * tex_km
        gc = np.zeros((n, n), np.float32)
        for q in np.linspace(-W['grainLen'] * gsz, W['grainLen'] * gsz, W['grainSteps']):
            pe, pn = (ke + q * ue) / gsz, (kn + q * un) / gsz
            gc += noise(0.62 * pe - 0.78 * pn + 91.0, 0.78 * pe + 0.62 * pn + 37.0).astype(np.float32)
        del pe, pn
        gc = gc / W['grainSteps'] - 0.5
        del ke, kn, ue, un
        # beds on the heights with their gullies and flutes
        level = (h * R + W['bedShift'] * cut * wall + ((noise(kx.astype(np.float64) / D['strata']['wanderCellKm'], ky.astype(np.float64) / D['strata']['wanderCellKm']) - 0.5) * D['strata']['wanderKm']).astype(np.float32)).astype(np.float32)
        rcell = max(W['roughKm'], 3 * tex_km)
        ragged = (noise(kx.astype(np.float64) / rcell + 9.0, ky.astype(np.float64) / rcell + 4.0) - 0.5).astype(np.float32)
        lateral = noise(kx.astype(np.float64) / W['lateralKm'] + 5.0, ky.astype(np.float64) / W['lateralKm'] + 2.0)
        del kx, ky
        strata = np.zeros((n, n), np.float32)
        step = np.zeros((n, n), np.float32)
        seen_beds = []
        for k, (thick, sh) in enumerate(zip(W['bedsKm'], W['bedShares'])):
            wide = thick * W['thinnest'] / np.maximum(span, 1e-9)   # texels across the thinnest bed of this thickness
            s_ = sm((wide - W['bedTexels']) / W['bedTexels']).astype(np.float32)
            del wide
            seen_beds.append(float((s_ * wall).sum() / max(float(wall.sum()), 1.0)))
            if seen_beds[-1] < 1e-4:
                continue
            tone_k, step_k = beds((level + W['roughShare'] * thick * ragged + W['jointShift'] * thick * jog).astype(np.float64), thick, 7.0 + 12.0 * k, W['warp'], W['edge'], W['toneEdge'], lateral)
            strata += (2 * sh * tone_k * s_).astype(np.float32)
            step += (W['ledge'] * thick * step_k * s_).astype(np.float32)
            del tone_k, step_k, s_
        del level, ragged, span, lateral, jog
        if jw is not None:
            step *= jw
        del jw
        d = (step + cut) * wall + W['fanShare'] * (W['gullyDepthKm'] * (gul - 0.5) + cut + W['gullyDepthKm'] * gul) * talus
        # only what is finer than broadKm is added to the heights (coarser they hold as they are): the displacement's
        # own mean over the wall and the talus within broadKm is taken out, so no cliff stands where the wall ends
        zone = np.clip(wall + talus, 0, 1)
        d -= zone * cv2.GaussianBlur(d, (0, 0), W['broadKm'] / tex_km) / np.maximum(cv2.GaussianBlur(zone, (0, 0), W['broadKm'] / tex_km), 1e-4)
        del zone
        d = d / R
        h2 = hsoft + d.astype(np.float32)
        del hsoft
        del d, step, cut
        hy, hx = np.gradient(h2, px)
        ns = ((-hx * sun[0] + hy * sun[1] + sun[2]) / np.sqrt(hx * hx + hy * hy + 1)).astype(np.float32)
        del hx, hy
        lift = np.clip((ns - up) / max(up + Lg['wrap'], 0.06), -0.85, 1.6).astype(np.float32)
        del ns
        m = min(n, 1024)
        cm = ((np.arange(m) + 0.5) / m * 2 - 1) * t
        xm = np.broadcast_to(cm[None, :], (m, m)).astype(np.float32)
        ym = np.broadcast_to(-cm[:, None], (m, m)).astype(np.float32)
        h0 = as_drawn(H, xm, ym, w, feather)
        lit = np.ones((m, m), np.float32)
        for u_ in np.geomspace(2 * t / m, Lg['shadowKm'] / R, Lg['steps']):
            occ = as_drawn(H, xm + sun[0] / flat * u_, ym + sun[1] / flat * u_, w, feather)
            lit = np.minimum(lit, np.clip(0.5 + (h0 + u_ * sun[2] / flat - occ) / (u_ * np.radians(Lg['sunSizeDeg'])), 0, 1))
        lit = cv2.resize(cv2.GaussianBlur(lit, (0, 0), 3.0), (n, n), interpolation=cv2.INTER_LINEAR)
        # the flutes, beds, gullies and fans cast their own shadows, read on the level's own texels
        jj, ii = np.meshgrid(np.arange(n, dtype=np.float32), np.arange(n, dtype=np.float32))
        hk = (h2 * R).astype(np.float32)
        near = np.ones((n, n), np.float32)
        for u_ in np.geomspace(tex_km, W['shadowKm'], W['shadowSteps']):
            occ = cv2.remap(hk, jj + np.float32(sun[0] / flat * u_ / tex_km), ii - np.float32(sun[1] / flat * u_ / tex_km), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            near = np.minimum(near, np.clip(0.5 + (hk + u_ * sun[2] / flat - occ) / max(u_ * np.radians(Lg['sunSizeDeg']), 0.5 * tex_km), 0, 1))
        del jj, ii, hk, occ
        # the fine relief's own shadow against that of the level's heights softened alike, so only what is finer is added
        lit0 = lit
        lit = np.minimum(lit, near)
        del near
        og = min(n, W['openGrid'])
        sky = skylight(cv2.resize((h2 * R).astype(np.float32), (og, og), interpolation=cv2.INTER_AREA), tex_km * n / og, W['openKm'], W['openSteps'])
        sky = np.maximum(cv2.resize(sky, (n, n), interpolation=cv2.INTER_LINEAR), W['skyLeast']) / W['openRef']
        dark = wall * (1 - lit)
        del h2
        fine = np.clip((img + 4) / (cv2.GaussianBlur(img, (0, 0), grain) + 4), 0.6, 1.6)
        # the plate carries its whole light (cap.json light.own is 0: the cap does not light an own level a second time)
        pw = W['join']
        fm = 2 * float(np.mean(W['shadowWall']))
        sunp = np.maximum(lit * (1 + lift), 0)
        shade = np.maximum(sky, 0)
        light = ((sunp ** pw + (fm * shade) ** pw) ** (1 / pw)).astype(np.float32)
        # wall: the law's rock under the Sun's part and the sky's part
        mark = np.exp(RK['strata'] * W['bedTone'] * strata + streak)
        rock = np.empty_like(img)
        tk = [0.0, 0.0]
        sb = W['broadKm'] / tex_km
        wb = np.maximum(cv2.GaussianBlur(wall, (0, 0), sb), 1e-4)
        for ch in range(3):
            both = (sunp ** pw + (2 * W['shadowWall'][ch] * shade) ** pw) ** (1 / pw)
            law = (RK['wall'][ch] * both * mark).astype(np.float32)
            take = geom.scene_of(img[..., ch] / 255.0).astype(np.float32)
            tk[0] += float((take * wall).sum())
            tk[1] += float((law * wall).sum())
            # coarser than broadKm the wall keeps the take's tone, finer it is the law's rock
            gain_b = np.clip((cv2.GaussianBlur(take * wall, (0, 0), sb) / wb + 1e-5) / (cv2.GaussianBlur(law * wall, (0, 0), sb) / wb + 1e-5), 1 / W['broadClip'], W['broadClip'])
            rock[..., ch] = geom.texel_of(law * gain_b) * 255.0
        del law, take, gain_b
        # the grain: on a wall the take's grain is not kept (it is the picture of resting blocks); the rock has its own,
        # as strong as the take's grain on the ground beside the wall (root mean square under grainTexels, read within
        # broadKm), less what the rock's own fine relief already gives
        blur = lambda f_, s_: cv2.GaussianBlur(f_, (0, 0), s_)
        part = lambda f_: (f_ + 4) / (blur(f_, grain) + 4) - 1
        lum = img.mean(2)
        m_t = part(lum)
        wn = np.clip(1 - wall - talus, 0, 1)
        by = (wb > 0.05).astype(np.float32) * wn
        t2g = float((by * m_t * m_t).sum() / max(float(by.sum()), 1.0))
        bn = blur(wn, sb)
        t2 = np.where(bn > 0.02, blur(wn * m_t * m_t, sb) / np.maximum(bn, 1e-4), t2g)
        del m_t, wn, by, bn
        rl = rock.mean(2)
        m_r = part(rl)
        r2 = blur(wall * m_r * m_r, sb) / wb
        m_g = gc - blur(gc, grain)
        g2 = float((wall * m_g * m_g).sum() / max(float(wall.sum()), 1.0))
        del m_r, m_g
        amp = np.sqrt(np.maximum(t2 - r2, 0) / max(g2, 1e-12)) * (blur(rl, grain) + 4) / np.maximum(blur(rl, grain), 4)
        rock *= np.clip(1 + amp * gc, 0.6, 1.6)[..., None]
        g_now = part(rock.mean(2))
        on_ = wall > 0.5
        grain_says = 'grain under %g texels (root mean square): the take on the ground beside %.4f, the rock without its grain %.4f, with it %.4f' % (
            grain, t2g ** 0.5, float(np.sqrt((r2[on_]).mean())) if on_.any() else 0, float(np.sqrt((g_now[on_] ** 2).mean())) if on_.any() else 0)
        del t2, r2, amp, rl, g_now, on_, wb, gc, lum
        del sunp, shade, mark, both
        # talus: the take's broad tone times what the fine relief adds to the light of the softened heights
        rel = light / ((lit0 * cap) ** pw + fm ** pw) ** (1 / pw)
        scree = geom.texel_of(geom.scene_of(np.clip(tone_talus, 0, 255) / 255.0) * (rel * np.exp(W['fanTone'] * (gul - 0.5) + W['fanShare'] * streak))[..., None]) * 255.0 * fine
        del lift, rel, lit0
        res = img * (1 - wall - talus)[..., None] + rock * wall[..., None] + scree * talus[..., None]
        Image.fromarray(np.clip(res + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(a.out, name), qtables=kept[0], subsampling=kept[1])
        ws = max(float(wall.sum()), 1.0)
        on = wall > 0.5
        print('%g deg, %d px, %.1f m a texel: wall on %.3f, talus on %.3f, the picture\'s own on %.3f of the wall; flow cell %.3f km; flutes %s; beds seen %s; on the wall: light mean %.2f, Sun reaches %.2f, sky over openRef mean %.3f (in shadow %.3f, 5th to 95th %.2f to %.2f); the plate there %.1f to %.1f, mean change %.2f; take over law %.3f' % (
            w, n, tex_km * 1000, float(on.mean()), float((talus > 0.5).mean()), own, cell_km, ', '.join(drawn), ' '.join('%.2f' % s_ for s_ in seen_beds), float((light * wall).sum() / ws), float((lit * wall).sum() / ws),
            float((sky * wall).sum() / ws), float((sky * dark).sum() / max(float(dark.sum()), 1.0)), *(np.percentile(sky[on], [5, 95]) if on.any() else (0, 0)),
            float(img[on].mean()) if on.any() else 0, float(res[on].mean()) if on.any() else 0, float(np.abs(res - img).mean()), tk[0] / max(tk[1], 1e-9)), flush=True)
        print('  ' + grain_says, flush=True)
        if a.look:
            tag = os.path.join(a.look, name[:-4])
            cv2.imwrite(tag + '-wall.png', (wall * 255).astype(np.uint8))
            cv2.imwrite(tag + '-talus.png', (talus * 255).astype(np.uint8))
            cv2.imwrite(tag + '-gully.png', (gul * 255).astype(np.uint8))
            cv2.imwrite(tag + '-light.png', np.clip(light * 96, 0, 255).astype(np.uint8))
            cv2.imwrite(tag + '-sky.png', np.clip(sky * 160, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    main()
