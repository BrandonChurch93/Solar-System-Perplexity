"""hold.py PLATE CLOSE OUTDIR: the two sky cards of Neptune (MAIL 1363 point 2, MAIL 1395 ruling 2).

PLATE: the approved hero's own sky as main carries it (public/assets/neptune/full/sky-hold.webp on main, pits filled by
sky_builder's calm.py, the core filled by fillcore.py). CLOSE: the approved close picture's sky as main carries it
(public/assets/neptune/full/sky-terrain.webp on main).

1. sky-hold.webp, at the hold's aim: the plate without its Sun (sunless below), in the middle of its continuation by recipe.
   Nothing of a Sun's disc, core or rays is painted into a sky card of this stop. sky-sun.webp is what the card gave up: the
   hero's own Sun as a picture, which sky_builder's law draws where its Sun stands and hides behind the limb with it.
2. sky-terrain.webp, at the aim of the surface view: the close picture's sky in the middle of the same kind of recipe sky. Its
   floor goes from the close picture's dark floor to the hold card's floor with the angle from the aim (floor_by_angle).
The recipe sky (wide): sparse blue grey stars on a floor, no band. Stars are laid evenly by solid angle with a fixed seed, with the
count by brightness, the size and the colours read from the open parts of the hero's sky (the numbers stand in
src/stops/neptune/sky.json, made), and drawn as round points on the sky, so on the flat card they are longer away from its middle.
Each card is a flat picture on the tangent plane at its aim (src/space/sky.ts, patchCoord) on the texel grid of its plate, so the
plate's texels are not resampled; the plate ends softly inside the card as the engine would end it (join). Deterministic: the same
input gives the same bytes. No picture is generated here.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('NEPTUNE_ROOT', os.path.join(HERE, '..', '..', '..'))
DEF = json.load(open(os.path.join(ROOT, 'src', 'stops', 'neptune', 'sky.json')))


def line(length, deg):
    """A straight line of length texels through the middle of a square, at deg degrees: the footprint of one opening."""
    k = np.zeros((length, length), bool)
    c = (length - 1) / 2
    t = np.radians(deg)
    for s in np.linspace(-c, c, 4 * length):
        k[int(round(c + s * np.sin(t))), int(round(c + s * np.cos(t)))] = True
    return k


def sunless(plate, sun):
    """The plate without its Sun, and the Sun as a picture of its own (MAIL 1395, ruling 3: the law's Sun at this stop is drawn
    with the hero's own light, as a picture; sky_builder's law draws it, nameSunPicture in src/space/sky.ts).
    H: the plate's light as the engine reads a sky picture (inverse filmic of the linear texel). Round sun.at (plate texels):
    - G: the smooth light, the largest of the openings of H by a line of sun.line texels in sun.directions directions. A star (a dot
      shorter than the line every way) is not in it; the core, the glow and the rays (long one way) are.
    - S = H less G: the stars. Inside sun.core texels none are kept.
    - the card keeps S and of G no more than sun.cap (levels, the sky's level round the Sun where its glow has ended); between the
      radii sun.join the card goes back to the plate's own texels, so beyond them the card is the plate, texel for texel.
    - the picture is what the card gave up: D = H less the card's light, written as srgb(filmic(D)), over the square sun.crop
      (left, top, size in plate texels); zero beyond sun.join[1].
    Returns the card (levels, uint8) and the picture (levels, uint8)."""
    from scipy import ndimage
    cx, cy = sun['at']
    reach = sun['join'][1] + sun['line'] + 4
    x0, x1 = int(cx) - reach, int(cx) + reach + 2
    y0, y1 = max(int(cy) - reach, 0), int(cy) + reach + 2
    part = plate[y0:y1, x0:x1].astype(np.float64)
    H = inverse_filmic(lin(part))
    G = np.zeros_like(H)
    for i in range(sun['directions']):
        k = line(sun['line'], 180.0 * i / sun['directions'])
        for c in range(3):
            G[..., c] = np.maximum(G[..., c], ndimage.grey_opening(H[..., c], footprint=k, mode='nearest'))
    yy, xx = np.mgrid[y0:y1, x0:x1]
    r = np.hypot(xx - cx, yy - cy)
    S = (H - G) * smooth(sun['core'][0], sun['core'][1], r)[..., None]
    cap = inverse_filmic(lin(np.array(sun['cap'], np.float64)))
    k = smooth(sun['join'][0], sun['join'][1], r)[..., None]
    low = np.minimum(H - S, cap[None, None, :])
    under = S + low * (1 - k) + (H - S) * k
    card = plate.copy()
    u8 = np.clip(np.round(srgb(filmic(under))), 0, 255).astype(np.uint8)
    keep = (r >= sun['join'][1])
    u8[keep] = plate[y0:y1, x0:x1][keep]
    card[y0:y1, x0:x1] = u8
    X, Y, N = sun['crop']
    Hc = inverse_filmic(lin(plate[Y:Y + N, X:X + N].astype(np.float64)))
    Uc = inverse_filmic(lin(card[Y:Y + N, X:X + N].astype(np.float64)))
    pic = np.clip(np.round(srgb(filmic(np.maximum(Hc - Uc, 0)))), 0, 255).astype(np.uint8)
    return card, pic


def wide(recipe, tan, size, floor=None):
    """The recipe sky on the tangent plane: size[0] by size[1] pixels over tan[0] by tan[1] to each side. floor: the level under the
    stars; without it the recipe's own floor everywhere."""
    rng = np.random.default_rng(recipe['seed'])
    sw, sh = size
    out = np.zeros((sh, sw, 3), np.float32)
    out += np.array(recipe['floor'], np.float32) if floor is None else floor
    # the cap that holds the whole picture
    reach = np.arctan(np.hypot(tan[0], tan[1]))
    cap = 2 * np.pi * (1 - np.cos(reach))
    n = int(round(recipe['perSteradian'] * cap))
    z = 1 - rng.random(n) * (1 - np.cos(reach))
    phi = rng.random(n) * 2 * np.pi
    s = np.sqrt(np.maximum(1 - z * z, 0))
    d = np.stack([s * np.cos(phi), s * np.sin(phi), z], 1)
    # brightness over the floor: counts fall as a power of the level, between least and most
    lo, hi, p = recipe['least'], recipe['most'], recipe['slope']
    u = rng.random(n)
    amp = (lo ** -p + u * (hi ** -p - lo ** -p)) ** (-1 / p)
    tint = np.array(recipe['tints'], np.float32)
    col = tint[rng.integers(0, len(tint), n)]
    sig = np.radians(recipe['sigmaDeg']) * (1 + recipe['sigmaSpread'] * (rng.random(n) - 0.5))
    px = np.array([sw / (2 * tan[0]), sh / (2 * tan[1])])
    x = d[:, 0] / d[:, 2]
    y = d[:, 1] / d[:, 2]
    keep = (np.abs(x) < tan[0]) & (np.abs(y) < tan[1])
    count = 0
    for i in np.nonzero(keep)[0]:
        r2 = 1 + x[i] * x[i] + y[i] * y[i]
        half = int(np.ceil(3.5 * sig[i] * r2 * max(px))) + 1
        u0 = (x[i] + tan[0]) * px[0] - 0.5
        v0 = (tan[1] - y[i]) * px[1] - 0.5
        ua, ub = max(int(u0) - half, 0), min(int(u0) + half + 2, sw)
        va, vb = max(int(v0) - half, 0), min(int(v0) + half + 2, sh)
        if ua >= ub or va >= vb:
            continue
        tx = (np.arange(ua, ub) + 0.5) / px[0] - tan[0]
        ty = tan[1] - (np.arange(va, vb) + 0.5) / px[1]
        gx, gy = np.meshgrid(tx, ty)
        inv = 1 / np.sqrt(1 + gx * gx + gy * gy)
        cosang = (gx * d[i, 0] + gy * d[i, 1] + d[i, 2]) * inv
        ang2 = 2 * np.maximum(1 - cosang, 0)
        out[va:vb, ua:ub] += (amp[i] * np.exp(-ang2 / (2 * sig[i] * sig[i])))[..., None] * col[i]
        count += 1
    return np.clip(out, 0, 255, out=out), count


def lin(v):
    """sRGB levels (0 to 255) to linear light, as the sampler of an sRGB texture gives it."""
    v = v / 255.0
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def srgb(v):
    v = np.clip(v, 0, 1)
    return 255.0 * np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055)


def filmic(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def inverse_filmic(y):
    """As src/post/chain.ts (INVERSE_FILMIC_GLSL): the light in which the engine lays one sky picture over another."""
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    y = np.clip(y, 0, 0.985)
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def join(under, plate, edge):
    """One card from two pictures on the same texel grid: the plate lies in the middle of the wide picture and ends softly over
    the share edge of its own size at its border, mixed in the engine's light (inverse filmic of the linear texel), as the engine
    mixes one sky picture over another. Where the plate has its full weight its own bytes stand; where it has none, the wide
    picture's. Works in place on under (levels, float32)."""
    ph, pw = plate.shape[:2]
    h, w = under.shape[:2]
    x0, y0 = (w - pw) // 2, (h - ph) // 2
    assert (w - pw) % 2 == 0 and (h - ph) % 2 == 0
    u = (np.arange(pw) + 0.5) / pw
    v = (np.arange(ph) + 0.5) / ph
    wx = smooth(0, edge, np.minimum(u, 1 - u))
    wy = smooth(0, edge, np.minimum(v, 1 - v))
    for a in range(0, ph, 256):
        b = min(a + 256, ph)
        k = np.minimum(wx[None, :], wy[a:b, None])
        # smoothstep of the smaller distance, as patchCoord: min of the two distances first, then the curve; the curve is monotone
        k = k[..., None].astype(np.float32)
        low = under[y0 + a:y0 + b, x0:x0 + pw]
        top = plate[a:b].astype(np.float32)
        mixed = srgb(filmic(inverse_filmic(lin(np.round(low))) * (1 - k) + inverse_filmic(lin(top)) * k))
        under[y0 + a:y0 + b, x0:x0 + pw] = np.where(k >= 1, top, np.where(k <= 0, low, mixed))
    return under


def floor_by_angle(size, tan, law):
    """The level under the stars of the terrain card: law.near inside law.deg[0] degrees of the card's aim (the close picture's own
    dark floor), law.far beyond law.deg[1] (the floor of the hold card's recipe), smooth between; fixed on the sky."""
    sw, sh = size
    x = ((np.arange(sw) + 0.5) / sw * 2 - 1) * tan[0]
    y = (1 - (np.arange(sh) + 0.5) / sh * 2) * tan[1]
    out = np.zeros((sh, sw, 3), np.float32)
    near, far = np.array(law['near'], np.float32), np.array(law['far'], np.float32)
    for a in range(0, sh, 256):
        b = min(a + 256, sh)
        ang = np.degrees(np.arctan(np.hypot(x[None, :], y[a:b, None])))
        k = smooth(law['deg'][0], law['deg'][1], ang)[..., None].astype(np.float32)
        out[a:b] = near * (1 - k) + far * k
    return out


def save(a, path):
    """Lossless, as main's plate is: a lossy file moved the card's far sky by 0.76 levels against the card."""
    (a if isinstance(a, Image.Image) else Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8))).save(path, 'WEBP', lossless=True, quality=100, method=4)


def both(pic, outdir, name):
    save(pic, os.path.join(outdir, 'full', name))
    im = Image.open(os.path.join(outdir, 'full', name)).convert('RGB')
    save(im.resize((im.size[0] // 2, im.size[1] // 2), Image.LANCZOS), os.path.join(outdir, 'web', name))


if __name__ == '__main__':
    src, close, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(os.path.join(outdir, 'full'), exist_ok=True)
    os.makedirs(os.path.join(outdir, 'web'), exist_ok=True)
    made = DEF['made']
    grid = made['texelsPerTan']
    plate = np.asarray(Image.open(src).convert('RGB'))
    held, pic = sunless(plate, made['sun'])
    X, Y, N = made['sun']['crop']
    back = srgb(filmic(inverse_filmic(lin(held[Y:Y + N, X:X + N].astype(np.float64))) + inverse_filmic(lin(pic.astype(np.float64)))))
    d = np.abs(back - plate[Y:Y + N, X:X + N])
    yy, xx = np.mgrid[Y:Y + N, X:X + N]
    r = np.hypot(xx - made['sun']['at'][0], yy - made['sun']['at'][1])
    print('the Sun out: texels changed', int((held != plate).any(2).sum()), '| card plus picture against the plate, levels: largest %.2f, mean %.3f' % (d.max(), d.mean()), '| picture: largest level beyond the join', int(pic[r >= made['sun']['join'][1]].max()), 'at the border', int(max(pic[0].max(), pic[-1].max(), pic[:, 0].max(), pic[:, -1].max())))
    both(pic, outdir, 'sky-sun.webp')
    held = held.astype(np.float32)
    for name, plate in (('hold', held), ('terrain', np.asarray(Image.open(close).convert('RGB')).astype(np.float32))):
        w = made[name]
        tan = [w['size'][0] / 2 / grid, w['size'][1] / 2 / grid]
        floor = floor_by_angle(w['size'], tan, w['floor']) if 'floor' in w else None
        pic, count = wide(w['recipe'], tan, w['size'], floor)
        del floor
        pic = join(pic, plate, w['plateEdge'])
        print('sky-%s.webp:' % name, count, 'stars by recipe in', w['size'], 'pixels over tan %.6f %.6f' % tuple(tan), '| plate', plate.shape[1], 'by', plate.shape[0], 'in its middle')
        both(pic, outdir, 'sky-%s.webp' % name)
        del pic
