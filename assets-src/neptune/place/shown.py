"""S2: the shown plates of the place, the deepest levels of the globe's patch pyramid.

A shown plate is a top down picture of the place in the look of the close view itself (display values, like the close
canvases), with its own alpha. The globe draws it through the inverse of its tone curve and of its near grade, so at
low heights it is seen exactly as painted. The file holds the plate with its coarse light taken out (divided by the tone
map, see flat()): the globe multiplies the light back in as the camera comes down. So the 8 bit values of the file are
those of evenly lit ground, and the near black foreground of the close view is made by darkening good values, not by
lifting values of 1 to 5 of 255 (which showed as a red brown smear from above). Inside the ground the close canvas saw, the plate is the close side's own
deck layer laid back through the camera of place.json (no cirrus, no cirrus shadow: the live close layer draws those
with their parallax). Outside it the plate is the repaint (see RECIPE.md), and its alpha falls to nothing toward the
globe's own levels.

python3 assets-src/neptune/place/shown.py first          only the laid back deck, alpha on the seen ground
python3 assets-src/neptune/place/shown.py bake [width]   the plates from the masters in assets-src/neptune/place/masters,
                                                         widest first (each one starts from the plate above it). The
                                                         widest one also writes the coarse tone map; bake every
                                                         deeper plate again after it.
python3 assets-src/neptune/place/shown.py guide width    the picture the image tool starts from for that plate
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import layback  # noqa: E402
from layback import cgeo  # noqa: E402

OUT = 'public/assets/neptune'
WORK = 'out/work/nep/s2'
PATCHES = json.load(open('src/stops/neptune/patches.json'))
SIZE = 4096
EDGE = (0.0, 0.12)
FAR = (7.5, 9.0)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def levels():
    return [l for i, l in enumerate(PATCHES['levels']) if i >= PATCHES['place']['shownFrom']]


def centre(level):
    return (float(np.tan(np.radians(level['offsetDeg'][0]))), float(np.tan(np.radians(level['offsetDeg'][1]))))


def seen_deck(level, size=SIZE):
    """The close side's deck layer on this plate and how far inside the canvas each texel lies (camera heights)."""
    r = layback.lay(level['widthDeg'], size, centre(level))
    d = layback.plate_dirs(level['widthDeg'], size, centre(level))
    n = (layback.flow.deck_shown(d, layback.PLACE['rest']) @ layback.QB).astype(np.float32)
    p = cgeo.CENTRE[None, None, :] + cgeo.RADIUS * n
    dist = np.minimum(np.minimum((p[..., 0] + cgeo.LEFT * p[..., 2]) / np.hypot(1, cgeo.LEFT), (-cgeo.RIGHT * p[..., 2] - p[..., 0]) / np.hypot(1, cgeo.RIGHT)), (p[..., 1] + cgeo.BOTTOM * p[..., 2]) / np.hypot(1, cgeo.BOTTOM))
    dist = np.where(r['seen'], dist, -1.0).astype(np.float32)
    return r['deck'][..., :3].astype(np.float32), dist, r['under'].astype(np.float32), r['stretch'].astype(np.float32)


def save(rgba, name, level=None):
    """Writes the plate; with a level, with its coarse light taken out (flat). The small picture returned is the plate
    as painted."""
    shown = (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)
    if level is not None:
        rgba = np.dstack([flat(rgba[..., :3], level, -1.0), rgba[..., 3]])
    out = (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    im.save(os.path.join(OUT, 'full', name), quality=92, method=4, exact=True)
    im.resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(os.path.join(OUT, 'web', name), quality=88, method=4, exact=True)
    a = shown[..., 3:4].astype(np.float32) / 255
    comp = (shown[..., :3] * a + np.array([40, 0, 40]) * (1 - a)).astype(np.uint8)
    return cv2.resize(comp, (700, 700), interpolation=cv2.INTER_AREA)


MASTERS = 'assets-src/neptune/place/masters'
EXACT = (0.1, 0.5)
NEAR = (5.5, 7.0)
RING = (10.0, 12.5)
LOCK = (8.0, 11.0)
CARRY = (3.0, 0.25)
GROW = 0.6
FINE = {'16': 0.6, '10': 0.5}


def read(path, size=SIZE):
    im = cv2.imread(path, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255
    if im.shape[0] != size:
        im = cv2.resize(im, (size, size), interpolation=cv2.INTER_LANCZOS4 if im.shape[0] < size else cv2.INTER_AREA)
    return np.clip(im, 0, 1)


def blur(im, sigma):
    """Gaussian blur; a wide one is done on a smaller copy (the result has nothing finer than the copy holds)."""
    if sigma <= 6:
        return cv2.GaussianBlur(im, (0, 0), sigma)
    f = int(sigma // 3)
    h, w = im.shape[:2]
    small = cv2.resize(im, (max(w // f, 1), max(h // f, 1)), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma / f)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)


def radius_deg(level, size=SIZE):
    """Arc from the spot (the eye) to each texel, in degrees."""
    half = np.tan(np.radians(level['widthDeg'] / 2))
    c = centre(level)
    g = ((np.arange(size, dtype=np.float32) + 0.5) / size - 0.5) * 2 * half
    gx, gy = np.meshgrid(g + c[0], -g + c[1])
    return np.degrees(np.arctan(np.hypot(gx, gy)))


def from_parent(parent_rgba, parent, level, size=SIZE):
    """The parent plate resampled onto this plate (both are gnomonic about the spot, so it is a crop and a scale)."""
    hp, hl = np.tan(np.radians(parent['widthDeg'] / 2)), np.tan(np.radians(level['widthDeg'] / 2))
    cp, cl = centre(parent), centre(level)
    g = ((np.arange(size, dtype=np.float32) + 0.5) / size - 0.5) * 2 * hl
    gx, gy = np.meshgrid(g + cl[0], -g + cl[1])
    px = (((gx - cp[0]) / (2 * hp) + 0.5) * size - 0.5).astype(np.float32)
    py = (((cp[1] - gy) / (2 * hp) + 0.5) * size - 0.5).astype(np.float32)
    return cv2.remap(parent_rgba, px, py, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def settle(take, deck, exact, reach, fine):
    """The laid back deck inside the exact zone; round it the take, whose coarse tone (coarser than fine texels) is moved
    to the coarse tone the deck has at the edge of the zone, per channel, the move dying away with the distance from the
    zone over reach texels. So the repaint beside the zone starts at the deck's own light and dark, whatever the take
    drew there, and no step in tone is left where the zone ends: the dark foreground and the bright far side of the
    close view run out into the repaint. A ratio, not a difference: the threads of the take stay threads.

    The tone a texel outside is moved to is that of the nearest point of the zone, blurred over GROW times its distance
    from the zone (never under reach / 6). Without that blur every texel behind a corner of the zone took the tone of
    the corner itself: the dark foreground under the fitted camera ran out as a fan with ruler straight sides, seen
    from above as a dark wedge south of the eye."""
    w = exact[..., None]
    soft = blur(exact, fine)[..., None]
    inside = exact >= 0.5
    coarse = np.log(np.maximum(blur(deck * w, fine) / np.maximum(soft, 1e-3), 2e-3))
    out, labels = cv2.distanceTransformWithLabels((~inside).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    index = np.zeros(int(labels.max()) + 1, np.int64)
    index[labels[inside]] = np.flatnonzero(inside)
    near = coarse.reshape(-1, 3)[index[labels]].astype(np.float32)
    base = reach / 6
    steps = 6
    octave = np.clip(np.log2(np.maximum(GROW * out, base) / base), 0, steps - 1e-3)
    low = np.floor(octave).astype(np.int32)
    part = (octave - low)[..., None]
    target = np.zeros_like(near)
    below = blur(near, base)
    for k in range(steps):
        above = blur(near, base * 2 ** (k + 1))
        target += (low == k)[..., None] * (below * (1 - part) + above * part)
        below = above
    scale = np.clip(target - np.log(np.maximum(blur(take, fine), 2e-3)), -3.0, 3.0)
    carry = np.exp(-out / reach)[..., None]
    return deck * w + np.clip(take * np.exp(scale * carry), 0, 1) * (1 - w)


def plate(level, parent):
    """One shown plate. Level 0 of the shown ones starts from the globe as drawn and its take; a deeper one starts from
    its parent plate (read back from the assets) and takes only what is finer than 1/48 of its width from its take, as a
    ratio to the take's own blur, so the fine detail has the tone of the ground it lies on (dark threads in dark ground), raised to the power FINE
    of the level (under 1 where a take drew its filaments harder than cloud tops are)."""
    deck, dist, under, _ = seen_deck(level)
    radius = radius_deg(level)
    exact = (smoothstep(EXACT[0], EXACT[1], dist) * smoothstep(NEAR[1], NEAR[0], under)).astype(np.float32)
    take_file = os.path.join(MASTERS, 'take-%s.jpg' % level['widthDeg'])
    if parent is None:
        base = read(os.path.join(MASTERS, 'globe-%s.jpg' % level['widthDeg']))
        take = read(take_file)
        wide = SIZE / 12
        take = np.clip(take * blur(base, wide) / np.maximum(blur(take, wide), 1e-3), 0, 1)
        lock = smoothstep(LOCK[0], LOCK[1], radius)[..., None]
        take = np.clip(take + (blur(base, SIZE / 100) - blur(take, SIZE / 100)) * lock, 0, 1)
        alpha = smoothstep(RING[1], RING[0], radius)
    else:
        base = from_parent(painted(parent), parent, level)
        alpha = np.clip(base[..., 3], 0, 1)
        base = np.clip(base[..., :3], 0, 1)
        take = base
        if os.path.exists(take_file):
            fine = read(take_file)
            keep = SIZE / 48
            take = np.clip(blur(base, keep) * (fine / np.maximum(blur(fine, keep), 1e-3)) ** FINE.get(str(level['widthDeg']), 1.0), 0, 1)
    rgb = settle(take, deck, exact, SIZE * CARRY[0] / level['widthDeg'], SIZE * CARRY[1] / level['widthDeg'])
    return np.dstack([rgb, np.maximum(alpha, exact)]).astype(np.float32), base, (exact > 0.5).mean()


def linear(c):
    """sRGB values to light (what the globe's sampler hands the shader)."""
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def display(c):
    """Light to sRGB values."""
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.maximum(c, 0) ** (1 / 2.4) - 0.055)


def tone(rgb):
    """The coarse tone of the place against the globe as drawn: log2 of the ratio of the widest plate's blur to the
    globe's blur (in light, per channel, blur toneDeg degrees), coded as 0.5 + log2 / toneStops. The plates are stored
    divided by it (flat) and the globe multiplies it back in by the share of the close view's light, so the place comes
    in with the globe's own coarse light and dark, and the light of the close view grows in over the whole dive
    (patches.json place.tone). rgb: the widest plate as painted."""
    level = levels()[0]
    cfg = PATCHES['place']['tone']
    globe = read(os.path.join(MASTERS, 'globe-%s.jpg' % level['widthDeg']))
    sigma = SIZE * cfg['deg'] / level['widthDeg']
    ratio = np.log2(np.maximum(blur(linear(rgb), sigma), 1e-4) / np.maximum(blur(linear(globe), sigma), 1e-4))
    code = np.clip(0.5 + ratio / cfg['stops'], 0, 1)
    small = cv2.resize(code.astype(np.float32), (cfg['size'], cfg['size']), interpolation=cv2.INTER_AREA)
    out = Image.fromarray((small * 255 + 0.5).astype(np.uint8), 'RGB')
    for tier in ('full', 'web'):
        out.save(os.path.join(OUT, tier, cfg['file']), lossless=True)
    print(cfg['file'], 'stops min %.2f max %.2f' % (ratio.min(), ratio.max()), flush=True)


def stops(level):
    """The tone map as the globe's shader reads it for this plate (the file, 8 bit, bilinear), in stops."""
    cfg = PATCHES['place']['tone']
    code = np.asarray(Image.open(os.path.join(OUT, 'full', cfg['file'])).convert('RGB'), np.float32) / 255
    widest = levels()[0]
    hp, hl = np.tan(np.radians(widest['widthDeg'] / 2)), np.tan(np.radians(level['widthDeg'] / 2))
    cp, cl = centre(widest), centre(level)
    g = ((np.arange(SIZE, dtype=np.float32) + 0.5) / SIZE - 0.5) * 2 * hl
    gx, gy = np.meshgrid(g + cl[0], -g + cl[1])
    n = cfg['size']
    px = (((gx - cp[0]) / (2 * hp) + 0.5) * n - 0.5).astype(np.float32)
    py = (((cp[1] - gy) / (2 * hp) + 0.5) * n - 0.5).astype(np.float32)
    return (cv2.remap(code, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) - 0.5) * cfg['stops']


def flat(rgb, level, sign):
    """sign -1: the plate as painted to the plate as stored (its coarse light divided out). sign +1: back again."""
    return np.clip(display(linear(np.clip(rgb, 0, 1)) * 2.0 ** (sign * stops(level))), 0, 1).astype(np.float32)


def painted(level):
    """A plate read back from the assets, as painted (RGBA)."""
    file = np.asarray(Image.open(os.path.join(OUT, 'full', level['file'])).convert('RGBA'), np.float32) / 255
    return np.dstack([flat(file[..., :3], level, 1.0), file[..., 3]]).astype(np.float32)


if __name__ == '__main__':
    os.makedirs(WORK, exist_ok=True)
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    only = sys.argv[2] if len(sys.argv) > 2 else None
    tiles = []
    parent = None
    for level in levels():
        mine = only is None or only == str(level['widthDeg'])
        if mode == 'first':
            deck, dist, under, stretch = seen_deck(level)
            w = smoothstep(EDGE[0], EDGE[1], dist) * smoothstep(FAR[1], FAR[0], under)
            tiles.append(save(np.dstack([deck, w]), level['file']))
            print(level['file'], 'seen share %.3f' % (w > 0.5).mean(), flush=True)
        elif mode == 'guide' and mine:
            guide(level, np.clip(from_parent(painted(parent), parent, level)[..., :3], 0, 1), 'guide%s.png' % level['widthDeg'])
        elif mode in ('all', 'bake') and mine:
            rgba, _, share = plate(level, parent)
            if parent is None:
                tone(rgba[..., :3])
            over = float((linear(rgba[..., :3]) * 2.0 ** -stops(level) > 1).mean())
            tiles.append(save(rgba, level['file'], level))
            back = painted(level)[..., :3]
            print(level['file'], 'exact share %.3f, clipped when flat %.5f, read back against painted: mean %.4f, p99 %.4f of 1' % (share, over, float(np.abs(back - rgba[..., :3]).mean()), float(np.percentile(np.abs(back - rgba[..., :3]), 99))), flush=True)
        parent = level
    if tiles:
        Image.fromarray(np.concatenate(tiles, 1)).save(os.path.join(WORK, 'shown-%s%s.jpg' % (mode, '' if only is None else '-' + only)), quality=88)
