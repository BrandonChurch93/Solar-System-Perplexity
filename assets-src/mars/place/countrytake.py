"""The country round the close ground, drawn from the close ground itself (closelay.py, platetone.py, skirt.py, pyramid.py before this step).

The close ground is a picture from one low eye. Laid on the plates it is the true ground where that eye saw it well, near the
place. Everywhere else the plates held ground of another kind: a made plain, the made canyon as flat steps, and far out the
picture's own far ground stretched along the eye's rays. Seen from above that was a flat plain with a patch in it, and at the
change of view the canyon land came in over it. Here the plates of 3.8 degrees and under take, outside the well seen ground,
a take of the same land seen from straight above (takes r38, r16, r07, r03 of RECIPE.md, each led by the plate as laid):

  keep  = the laid ground (land-*-laid.png of closelay.py) where the close ground stands (a<width>-height.npy of
          heights.py --aprons, finite there), drawn in by softDeg, within the reach of the eye (block reach:
          1 within fromDeg of the spot, 0 beyond toDeg, the border wandering by a fixed field of the ground)
  tone  = the take follows the broad tone of the laid ground where both are known, less and less with the distance (toneDeg)
  plate = laid * keep + take * tone * (1 - keep)

  seen  = block seen of plates.json: keep is raised to the laid mask where an eye over the spot at eyeHeight sees the close
          ground squarely (cosine between the ground's vertical and the sight line, from .. to), at any distance

The border lies on the ground: no height of the camera and no time is read. pyramid.py and landunder.py run after it.

  python3 assets-src/mars/place/countrytake.py --dir LAID --laid MASKS --foot FOOT --out OUT
"""
import argparse
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def half(width):
    return math.tan(math.radians(width) / 2)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def fit_take(take, lead, sigma):
    """A repainted take holds the broad tone of its lead (bodylead.py: the take as it stood, the cast shadow of the cap's heights,
    the finer plate, the close set from above) and adds only what is finer (MAIL 963 item 3): per colour, the lead's mean over
    `sigma` texels of this plate over the take's own. A law of the ground: no distance, no border, no height in it."""
    a = cv2.GaussianBlur(lead, (0, 0), sigma)
    b = cv2.GaussianBlur(take, (0, 0), sigma)
    return take * np.clip((a + 1.0) / (b + 1.0), 0.1, 4.0)


def body_share(stem, width, c, body):
    """How much of a plate texel is the close set seen from straight above (plates.json takes.body): by the ground one picture
    pixel covers there, by the air between that ground and the picture's eye (its distance), and soft at the border of what
    the set shows. Returns the share and the colour."""
    hgt = np.load(stem + '-height.npy')
    assert hgt.shape[0] == c, 'heights.py --size %d wanted for %s' % (c, stem)
    seen = np.isfinite(hgt).astype(np.float32)
    col = np.asarray(Image.open(stem + '-colour.png').convert('RGB')).astype(np.float32)
    lies = np.where(seen > 0, np.load(stem + '-reach.npy') / body.get('texelDeg', width / c), 1e9).astype(np.float32)
    v = seen * (1 - smooth((lies - body['texels'][0]) / (body['texels'][1] - body['texels'][0])))
    if body.get('airKm'):
        o = np.array(geom.load()['dive']['terrain']['origin'])
        r = float(np.linalg.norm(o))
        e0, n0, _ = geom.to_patch((o / r)[None, :])
        at = ((np.arange(c) + 0.5) / c * 2 - 1) * geom.half_tan(width)
        far = np.sqrt((at[None, :] - e0[0]) ** 2 + (-at[:, None] - n0[0]) ** 2 + (np.where(seen > 0, hgt, 0) - (r - 1)) ** 2) * 3389.5
        v = v * (1 - smooth((far - body['airKm'][0]) / (body['airKm'][1] - body['airKm'][0]))).astype(np.float32)
    v = v * smooth((cv2.GaussianBlur((v > 0.5).astype(np.float32), (0, 0), body['softTexels']) - 0.5) * 2)
    return v, col


def reach_mask(K, g=2048):
    wide = 2.2 * (K['toDeg'] + K['wanderDeg'])
    per = g / (2 * half(wide))
    at = (np.arange(g, dtype=np.float32) + 0.5 - g / 2) / per
    deg = np.degrees(np.arctan(np.hypot(at[None, :], at[:, None])))
    rng = np.random.default_rng(K['seed'])
    fld = np.zeros((g, g), np.float32)
    for size, share in K['field']:
        k = max(2, int(wide / size) + 2)
        fld += share * cv2.resize(rng.standard_normal((k, k)).astype(np.float32), (g, g), interpolation=cv2.INTER_CUBIC)
    fld = np.clip(fld / max(float(np.abs(fld).max()), 1e-6), -1, 1)
    return wide, 1 - smooth((deg + fld * K['wanderDeg'] - K['fromDeg']) / (K['toDeg'] - K['fromDeg']))


def facing(h, width, eye_height):
    """How squarely an eye over the spot at eye_height (radii) sees the close ground: the cosine between the ground's own
    vertical and the sight line, 0 where the ground is seen along itself or from behind, and 0 where no close ground stands."""
    g = h.shape[0]
    known = np.isfinite(h)
    P = geom.patch_dirs(width, g) * (1 + np.where(known, h, 0.0))[..., None]
    n = -np.cross(np.gradient(P, axis=1), np.gradient(P, axis=0))
    n /= np.maximum(np.linalg.norm(n, axis=2, keepdims=True), 1e-20)
    spot, _, _ = geom.patch_frame()
    v = spot[None, None, :] * (1 + eye_height) - P
    v /= np.linalg.norm(v, axis=2, keepdims=True)
    f = np.clip((n * v).sum(2), 0, 1).astype(np.float32)
    f[cv2.erode(known.astype(np.uint8), np.ones((5, 5), np.uint8)) == 0] = 0
    return cv2.GaussianBlur(f, (0, 0), 1.0)


class Heights:
    """The cap's height plates (country.json and the bins of one set), read at plane coordinates (tangents east and north)."""

    def __init__(self, folder, doc):
        self.levels = []
        for L in doc['levels']:
            n = L['size']['full']
            h = L['low'] + np.fromfile(os.path.join(folder, L['height']), '<u2').reshape(n, n).astype(np.float32) / 65535 * (L['high'] - L['low'])
            self.levels.append((L['widthDeg'], h))

    def at(self, x, y, least):
        """The ground at (x, y) from the levels at least `least` degrees wide, the finest inside first."""
        out = np.zeros(x.shape, np.float32)
        for w, h in self.levels:
            if w < least:
                continue
            t, n = half(w), h.shape[0]
            v = cv2.remap(h, ((x / t + 1) / 2 * n - 0.5).astype(np.float32), ((1 - y / t) / 2 * n - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            out = np.where(np.maximum(np.abs(x), np.abs(y)) < t * (1 - 1.0 / n), v, out)
        return out


def lift_of(h, width, Lg):
    """1 + lift, the factor the cap's light gives the heights' normal (plates.json country.light.note)."""
    sun = geom.scene_sun(Lg['sunMoment'])
    gy, gx = np.gradient(h, 2 * half(width) / h.shape[0])
    ndl = (-gx * sun[0] + gy * sun[1] + sun[2]) / np.sqrt(gx * gx + gy * gy + 1)
    return 1 + np.clip((ndl - sun[2]) / max(sun[2] + Lg['wrap'], 0.06), -0.85, 1.6)


def take_light(take, width, Lg, heights, K=None, laid=None, known=None, before=None, fit=None):
    """A take is a picture with its own painted light. On the cap the light is the heights' (the cap lights every slope, 1 + lift),
    so the take keeps its ground and gives up its light: in the log of scene values its luminance may leave the colour of its region
    (the mean about a texel, regionDeg wide, at most regionShare of the plate) by no more than `darkest` down and `brightest` up
    (a soft limit, tanh; the numbers of country.light, as relight.py holds made ground), so no blot of paint stands as a pit and no
    painted Sun side glows under the cap's own light. Then the cast shadow of the cap's heights is laid in for the scene's Sun
    (open share of the Sun's disc; shadowed ground keeps `fill`), since the cap's light casts none."""
    c = take.shape[0]
    S = geom.scene_of(take / 255.0).astype(np.float32)
    lum = np.maximum(S @ np.array([0.2126, 0.7152, 0.0722], np.float32), 1e-4)
    sig = min(Lg['regionDeg'], Lg['regionShare'] * width) / (width / c) / 2
    k = max(int(sig / 24), 1)
    region = cv2.resize(cv2.GaussianBlur(cv2.resize(lum, (c // k, c // k), interpolation=cv2.INTER_AREA), (0, 0), sig / k), (c, c), interpolation=cv2.INTER_LINEAR)
    d = np.log(lum / np.maximum(region, 1e-4))
    # a take is painted in full Sun: its bright side may stand over its region by `brightest` of the takes, and the region itself over
    # the plateau's own colour (country.light.plateau) by `regionMost`, both soft (log units). Measured before these two: the 99th
    # percentile of the plates of 3.8 and 1.6 degrees stood at 0.18 in scene luminance against 0.10 and 0.12 on main, the regions up
    # to 0.155 against 0.11; under the cap's light that stood as glowing red patches on the far plateau (MAIL 849, b)
    bright = (K or {}).get('brightest', Lg['brightest'])
    held = np.where(d > 0, bright * np.tanh(d / bright), Lg['darkest'] * np.tanh(d / Lg['darkest']))
    most = (K or {}).get('regionMost')
    if most:
        over = np.log(np.maximum(region, 1e-4) / float(np.dot(Lg['plateau'], [0.2126, 0.7152, 0.0722])))
        held = held + np.where(over > 0, most * np.tanh(over / most) - over, 0)
    # where the heights stand steep the cap's light is the whole light: there the take's own light and dark go to nothing (|lift|
    # over `steep`). Everywhere the take's hue comes back to the region's by `hue`, at most hueMost (log units), as relight.py
    # holds made ground: the takes paint lit ground a saturated red (0.3 to 0.7 percent of the plates of 3.8 and 1.6 degrees
    # stood over 200 in red at twice the green), which under the cap's light stood as glowing patches on the far plateau
    # (MAIL 849, b)
    own = [h for w, h in heights.levels if w == width][0]
    steep = np.clip(np.abs(cv2.resize(lift_of(own, width, Lg).astype(np.float32), (c, c), interpolation=cv2.INTER_LINEAR) - 1) / Lg['steep'], 0, 1)
    held = held * (1 - steep)
    blur = lambda m: cv2.resize(cv2.GaussianBlur(cv2.resize(m, (c // k, c // k), interpolation=cv2.INTER_AREA), (0, 0), sig / k), (c, c), interpolation=cv2.INTER_LINEAR)
    for i in range(3):
        tint = np.log(np.maximum(S[..., i], 1e-5) / lum) - np.log(np.maximum(blur(S[..., i]), 1e-5) / np.maximum(region, 1e-4))
        S[..., i] *= np.exp(np.clip(Lg['hue'] * tint, -Lg['hueMost'], Lg['hueMost']) - tint)
    S *= np.exp(held - d)[..., None]
    # the cast shadow of the heights
    n = [h.shape[0] for w, h in heights.levels if w == width][0]
    t = half(width)
    at = ((np.arange(n) + 0.5) / n * 2 - 1) * t
    x = np.broadcast_to(at[None, :], (n, n)).astype(np.float32)
    y = np.broadcast_to(-at[:, None], (n, n)).astype(np.float32)
    sun = geom.scene_sun(Lg['sunMoment'])
    flat = float(np.hypot(sun[0], sun[1]))
    h0 = heights.at(x, y, width)
    open_ = np.ones((n, n), np.float32)
    size = np.radians(Lg['sunSizeDeg'])
    for u in np.geomspace(2 * t / n, Lg['shadowKm'] / 3389.5, Lg['steps']):
        occ = heights.at(x + sun[0] / flat * u, y + sun[1] / flat * u, width)
        open_ = np.minimum(open_, np.clip(0.5 + (h0 + u * sun[2] / flat - occ) / (u * size), 0, 1))
    open_ = cv2.resize(cv2.GaussianBlur(open_, (0, 0), 0.8), (c, c), interpolation=cv2.INTER_LINEAR)[..., None]
    shade = open_ + (1 - open_) * np.array(Lg['fill'], np.float32)
    toned = 0.0
    if laid is not None:
        # under the approved picture the cap is the picture's own ground (fitheights.py), so there the take carries the picture's broad
        # tone: the mean colour of the laid ground over toneTexels texels of the plate (no stroke of the laid picture is that wide),
        # as the cap's light of the heights it was laid for showed it, over the light of the heights as they stand. The take keeps
        # its own grain. The picture's tone holds its own shadows, so the cast shadow is laid in only where the tone is not.
        A = geom.scene_of(laid / 255.0).astype(np.float32)
        own = [h for w, h in heights.levels if w == width][0]
        was = [h for w, h in before.levels if w == width][0]
        up = lambda m: cv2.resize(m, (c, c), interpolation=cv2.INTER_LINEAR)
        A *= up((lift_of(was, width, Lg) / lift_of(own, width, Lg)).astype(np.float32))[..., None]
        at = ((np.arange(c) + 0.5) / c * 2 - 1) * t
        foot = np.degrees(np.arctan(np.hypot(at[None, :], at[:, None]))).astype(np.float32)
        m = known * (1 - smooth((foot - fit['toDeg']) / (fit['goneDeg'] - fit['toDeg'])))
        sg = K['toneTexels']
        den = cv2.GaussianBlur(m, (0, 0), sg)
        k = smooth(den / K['toneFull'])[..., None]
        # the tone is the laid ground's light and dark alone, one factor for the three colours: the laid ground's hue holds the
        # picture's air drawn out along its rays (the blue and white streaks of MAIL 850), which is not the ground's
        wl = np.array([0.2126, 0.7152, 0.0722], np.float32)
        ratio = cv2.GaussianBlur((A @ wl) * m, (0, 0), sg) / np.maximum(cv2.GaussianBlur((S @ wl) * m, (0, 0), sg), 1e-5)
        gain = np.clip(np.where(den > 1e-3, ratio, 1), K['toneGain'][0], K['toneGain'][1])[..., None]
        S *= np.exp(np.log(gain) * k)
        shade = 1 + (shade - 1) * (1 - k)
        toned = float((k > 0.5).mean())
    S *= shade
    # the whole of it, the picture's tone too (the laid ground holds the picture's Sun lit plateau), may stand over the plateau's own
    # colour by no more than regionMost and brightest together, soft: the cap lights the plate again
    if most:
        wl = np.array([0.2126, 0.7152, 0.0722], np.float32)
        top = most + bright
        over = np.log(np.maximum(S @ wl, 1e-5) / float(np.dot(Lg['plateau'], wl)))
        S *= np.exp(np.where(over > 0, top * np.tanh(over / top) - over, 0))[..., None]
    return geom.texel_of(S) * 255, float(1 - open_.mean()), float((np.abs(held - d) > 0.05).mean()), toned


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--heights', default=os.path.join(ROOT, 'public', 'assets', 'mars', 'full'), help='the height plates of the cap (full set), for the light of a take')
    ap.add_argument('--country', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'country.json'))
    ap.add_argument('--heights-laid', default=os.path.join(ROOT, 'out', 'work', 'place', 'keep-state', 'assets', 'full'), help='the height plates the laid ground was made for (the plates of country.py, before fitheights.py)')
    ap.add_argument('--country-laid', default=os.path.join(ROOT, 'out', 'work', 'place', 'keep-state', 'stop', 'country.json'))
    ap.add_argument('--dir', required=True)
    ap.add_argument('--laid', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--foot', default=os.path.join(ROOT, 'out', 'work', 'place', 'ap'))
    ap.add_argument('--top', default=os.path.join(ROOT, 'out', 'work', 'place', 'top'), help='the picture seen from above per level (heights.py --picture-only --size <the plate>): t<width>-colour.png, -height.npy, -reach.npy')
    ap.add_argument('--takes', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'takes'))
    ap.add_argument('--plates', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json'))
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json'))
    ap.add_argument('--see', action='store_true', help='also write the facing of each plate as a picture')
    args = ap.parse_args()
    P = json.load(open(args.plates))
    K, R, S = P['takes'], P['reach'], P.get('seen')
    own = [l for l in json.load(open(args.json))['levels'] if l.get('own')]
    os.makedirs(args.out, exist_ok=True)
    wide, mask = reach_mask(R)
    g = mask.shape[0]
    heights = Heights(args.heights, json.load(open(args.country))) if not K.get('lay', True) else None
    before = Heights(args.heights_laid, json.load(open(args.country_laid))) if not K.get('lay', True) else None
    for l in own:
        f = Image.open(os.path.join(args.dir, l['file']))
        q, s = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        laid = np.asarray(f.convert('RGB')).astype(np.float32)
        name = K['levels'].get('%g' % l['widthDeg'])
        if not name:
            f.save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
            print(l['file'], 'no take, kept')
            continue
        c = laid.shape[0]
        take = np.asarray(Image.open(os.path.join(args.takes, name)).convert('RGB')).astype(np.float32)
        take = cv2.resize(take, (c, c), interpolation=cv2.INTER_LANCZOS4 if take.shape[0] < c else cv2.INTER_AREA)
        per = c / l['widthDeg']  # texels a degree, near enough at these widths
        if not K.get('lay', True):
            # the one ground carries no copy of the close picture: the take alone, at its own tone (MAIL 837, MAIL 849)
            known = np.asarray(Image.open(os.path.join(args.laid, l['file'].replace('.jpg', '-laid.png'))).convert('L')).astype(np.float32) / 255
            if K.get('light') == 'painted':
                # the take is painted in the approved picture's own light (MAIL 913, 1): it keeps that light whole, the cap adds none
                # (cap.json light.own 0), no cast shadow of the heights is laid in and nothing is toned by a mask
                fit = (K.get('fit') or {}).get('%g' % l['widthDeg'])
                if fit:
                    lead = np.asarray(Image.open(os.path.join(args.takes, fit)).convert('RGB')).astype(np.float32)
                    lead = cv2.resize(lead, (c, c), interpolation=cv2.INTER_LANCZOS4 if lead.shape[0] < c else cv2.INTER_AREA)
                    take = fit_take(take, lead, K['fitPx'] * c / 1254.0)
                tone = K.get('tone')
                level_gain = (K.get('levelGain') or {}).get('%g' % l['widthDeg'])
                if level_gain:
                    # the takes of two levels are painted apart: each is brought to the one above it where they share ground
                    # (taketone.py --nest), so no step stands where a finer plate ends
                    take = geom.texel_of(geom.scene_of(take / 255.0) * np.float32(level_gain)) * 255.0
                if tone:
                    # one light by ground distance from the spot: the take's scene values times the measured ratio of the laid
                    # picture to the take (taketone.py), read between the measured distances in the log of the distance
                    at = (np.arange(c, dtype=np.float32) + 0.5 - c / 2) / c * 2 * half(l['widthDeg'])
                    lg = np.log(np.maximum(np.degrees(np.arctan(np.hypot(at[None, :], at[:, None]))), 1e-4))
                    nodes = np.log(np.float32(tone['deg']))
                    ratio = np.stack([np.exp(np.interp(lg, nodes, np.log(np.float32(tone['ratio'])[:, ch]))) for ch in range(3)], axis=2).astype(np.float32)
                    curve = json.load(open(os.path.join(os.path.dirname(args.plates), tone['curve']))) if tone.get('curve') else None
                    if curve:
                        # the take's value read through the measured shares (taketone.py --curve): at each level's distance the
                        # take holds the laid picture's own range of light and colour, between them by the log of the distance,
                        # itself from the last distance on. Beyond the measured ends the end's own factor holds.
                        v = np.maximum(take / 255.0, 1e-4)
                        logs = []
                        for wdeg in sorted(float(x) for x in curve['levels']):
                            c_ = curve['levels']['%g' % wdeg]
                            ch_out = []
                            for ch in range(3):
                                tq, lq = np.maximum(np.float32(c_['take'][ch]), 1e-4), np.maximum(np.float32(c_['laid'][ch]), 1e-4)
                                tq = np.maximum.accumulate(tq + np.arange(len(tq), dtype=np.float32) * 1e-6)
                                f = np.interp(v[..., ch], tq, lq)
                                f = np.where(v[..., ch] < tq[0], v[..., ch] * lq[0] / tq[0], f)
                                f = np.where(v[..., ch] > tq[-1], v[..., ch] * lq[-1] / tq[-1], f)
                                ch_out.append(np.log(np.maximum(f, 1e-4)))
                            logs.append(np.stack(ch_out, axis=2))
                        logs.append(np.log(v))
                        assert len(logs) == len(nodes)
                        k = np.clip(np.searchsorted(nodes, lg) - 1, 0, len(nodes) - 2)
                        t = np.clip((lg - nodes[k]) / (nodes[k + 1] - nodes[k]), 0, 1)[..., None]
                        out = np.zeros_like(v)
                        for i in range(len(nodes) - 1):
                            sel = (k == i)[..., None]
                            out = np.where(sel, logs[i] * (1 - t) + logs[i + 1] * t, out)
                        take = np.clip(np.exp(out), 0, 1) * 255.0
                    else:
                        take = geom.texel_of(geom.scene_of(take / 255.0) * ratio) * 255.0
                gamut = K.get('gamut')
                if gamut:
                    # never redder at a red value than the approved picture's own ground is there (taketone.py --gamut)
                    r = take[..., 0]
                    take[..., 1] = np.maximum(take[..., 1], r * np.interp(r, gamut['red'], gamut['green']))
                    take[..., 2] = np.maximum(take[..., 2], r * np.interp(r, gamut['red'], gamut['blue']))
                body = K.get('body')
                held = 0.0
                if body:
                    # ONE BODY (MAIL 963): where the approved picture itself shows the ground at least as finely as this plate
                    # does, the plate is the picture seen from straight above (heights.py --picture-only: its colour, and the
                    # ground one picture pixel covers along its longest side). Whole at or under body.texels[0] plate texels a
                    # picture pixel, none at body.texels[1]: a law of the ground, the same two numbers as the stretch of the
                    # stop's law. The take is painted from that ground outward (lead: bodylead.py), so nothing is toned to it.
                    v, col = body_share(os.path.join(args.top, 't%g' % l['widthDeg']), l['widthDeg'], c, body)
                    take = col * v[..., None] + take * (1 - v[..., None])
                    held = float((v > 0.5).mean())
                Image.fromarray(np.clip(take + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
                print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])), name, 'the take alone, in its own painted light' + (', toned by ground distance to the picture' if tone else '') + (', the picture from above on %.3f of it' % held if body else ''))
                continue
            take, shadow, held, toned = take_light(take, l['widthDeg'], P['country']['light'], heights, K, laid, known, before, P['fit'])
            Image.fromarray(np.clip(take + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
            print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])), name, 'the take alone; its painted light held on %.3f of the plate, cast shadow of the heights on %.3f, the picture\'s broad tone on %.3f' % (held, shadow, toned))
            continue
        m = np.asarray(Image.open(os.path.join(args.laid, l['file'].replace('.jpg', '-laid.png'))).convert('L')).astype(np.float32) / 255
        foot = np.isfinite(np.load(os.path.join(args.foot, 'a%g-height.npy' % l['widthDeg']))).astype(np.float32)
        m = m * cv2.resize(foot, (c, c), interpolation=cv2.INTER_LINEAR)
        sg = max(K['softDeg'] * per, 1.0)
        m = smooth((cv2.GaussianBlur(m, (0, 0), sg) - K['inside']) / (1 - K['inside']) * 2)
        z = c * half(wide) / half(l['widthDeg']) / g
        A = np.float32([[z, 0, c / 2 - z * g / 2 + (z - 1) / 2], [0, z, c / 2 - z * g / 2 + (z - 1) / 2]])
        keep = m * cv2.warpAffine(mask, A, (c, c), flags=cv2.INTER_LINEAR if z > 1 else cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        if S:
            f = facing(np.load(os.path.join(args.foot, 'a%g-height.npy' % l['widthDeg'])), l['widthDeg'], S['eyeHeight'])
            if args.see:
                Image.fromarray((255 * f).astype(np.uint8)).save(os.path.join(args.out, 'facing-%g.png' % l['widthDeg']))
            keep = np.maximum(keep, m * cv2.resize(smooth((f - S['from']) / (S['to'] - S['from'])), (c, c), interpolation=cv2.INTER_LINEAR))
        # the tone, on a small grid
        t = 512
        small = lambda a: cv2.resize(a, (t, t), interpolation=cv2.INTER_AREA)
        st = max(K['toneDeg'] * per * t / c, 1.0)
        k = small(keep)
        blur = lambda a: cv2.GaussianBlur(a, (0, 0), st)
        ratio = np.log(np.maximum(blur(small(laid) * k[..., None]), 1e-3) / np.maximum(blur(small(take) * k[..., None]), 1e-3))
        w = blur(k)
        far = smooth(w / K['toneFull'])
        gain = np.exp(np.clip(ratio, math.log(K['gain'][0]), math.log(K['gain'][1])) * far[..., None])
        gain = cv2.resize(gain, (c, c), interpolation=cv2.INTER_CUBIC)
        out = laid * keep[..., None] + take * gain * (1 - keep[..., None])
        Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
        print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])), name, 'laid ground kept on %.3f of it, gain %.2f to %.2f' % (float((keep > 0.5).mean()), float(gain.min()), float(gain.max())))


if __name__ == '__main__':
    main()
