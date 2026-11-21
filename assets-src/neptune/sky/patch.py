import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import geo
from deblock import deblock

Image.MAX_IMAGE_PIXELS = None
FULL = (2816, 1584)
MARGIN = 0.375
FIRST = 0.125
EDGE = (1.004, 1.014)
BEHIND = (0.95, 0.99)
LINE = 23
SUN = (2514, 227, 330)
SUN_FROM = (-150, 900)
SUN_OUT = 520
SUN_STARS = 0.45
LIVE = 'out/work/nep/p6/live-hold-175.png'
GEN_IN = 'out/work/nep/p6/sky-hold-ext-in.jpg'
GEN = 'out/work/nep/p6/sky-hold-ext.png'
CACHE = 'out/work/nep/p6/hold-lin.npy'
ASK = (3072, 1728)
ASK_ZONE = 0.95
ZONE_OUT = (0.45, 2.9)
RAGGED = ((0.45, 420), (0.2, 150), (0.08, 50))
SPREAD = ((60, 0.45, 1.1), (160, 1.0, 2.0), (360, 1.8, 2.8))
NEAR = (0.35, 1.0, 0.4)
THIN = (0.9, 2.9)
STAMP = (3, 0.0004, 0.5)
SEED = 7
REACH_EDGE = (20, 12)
FOLLOW = (0.002, 0.3, 3.0)
FINE = 12
GAIN = (0.6, 1.8)
HAZE = 2
RIM = 10
RING_AT = (24, 56, 96)
STAR_CUT = 1.5
KEEP = 'out/work/nep/p6/sky-hold-full-r3.webp'
LUM = np.array([0.3, 0.5, 0.2], np.float32)
MOON = (337, 407, 95)
RING = dict(normal=[0.1681, 0.9779, 0.1244], centre=[0.0533, 0.0532, -0.4902], inner=1.36, outer=1.86)
SPECK = (0.001, 14)
STRAND = (0.004, 22)
LIMB = (0.99, 1.0, 1.04, 1.06)
STRANDS = (1.3, 1.92)


def sunless(lin):
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    r = np.hypot(xx - SUN[0], yy - SUN[1])
    edges = np.linspace(0, SUN_OUT, 91)
    mid = 0.5 * (edges[:-1] + edges[1:])
    prof = np.stack([[np.percentile(lin[..., c][(r >= a) & (r < b)], 30) for a, b in zip(edges[:-1], edges[1:])] for c in range(3)], -1)
    prof = np.maximum.accumulate((prof - prof[-1])[::-1], axis=0)[::-1]
    glow = np.stack([np.interp(r, mid, prof[:, c], right=0) for c in range(3)], -1)
    flat = lin - glow
    hole = r < SUN[2]
    keep = (~hole).astype(np.float32)
    low = lambda v: ndi.gaussian_filter(np.minimum(v, ndi.gaussian_filter(v, 5)), 5)
    back = np.stack([ndi.gaussian_filter(low(flat[..., c]) * keep, 90) / np.maximum(ndi.gaussian_filter(keep, 90), 1e-4) for c in range(3)], -1)
    src = np.roll(lin, (-SUN_FROM[1], -SUN_FROM[0]), axis=(0, 1))
    stars = np.maximum(src - np.stack([low(src[..., c]) for c in range(3)], -1), 0)
    m = (1 - step(r, SUN[2] * 0.85, SUN[2] * 1.1))[..., None]
    return flat * (1 - m) + (back + stars * SUN_STARS) * m, mid, prof, flat


def scatter(fine, level, chance, rng):
    r, least, dark = STAMP
    h, w = level.shape
    fit = json.load(open(os.path.join(geo.ROOT, 'assets-src/neptune/fit.json')))['circle']
    yy, xx = np.mgrid[0:h, 0:w]
    quiet = (level < np.quantile(level[::4, ::4], dark)) & (np.hypot(xx - fit['cx'], yy - fit['cy']) > fit['r'] * 1.1) & (np.hypot(xx - SUN[0], yy - SUN[1]) > SUN[2] * 1.2) & (np.hypot(xx - MOON[0], yy - MOON[1]) > MOON[2] * 1.5)
    quiet[:r + 1] = quiet[-r - 1:] = False
    quiet[:, :r + 1] = quiet[:, -r - 1:] = False
    lum = np.maximum(fine, 0) @ LUM
    peak = (lum == ndi.maximum_filter(lum, 2 * r + 1)) & (lum > least) & quiet
    ys, xs = np.nonzero(peak)
    count = int(round(len(ys) / quiet.sum() * chance.size))
    print('stars of the approved sky per megapixel', round(len(ys) / quiet.sum() * 1e6), 'stamps', len(ys), 'placed before thinning', count)
    ty, tx = rng.integers(r, chance.shape[0] - r, count), rng.integers(r, chance.shape[1] - r, count)
    kept = rng.random(count) < chance[ty, tx]
    ty, tx, pick = ty[kept], tx[kept], rng.integers(0, len(ys), int(kept.sum()))
    out = np.zeros(chance.shape + (3,), np.float32)
    span = np.hypot(*np.mgrid[-r:r + 1, -r:r + 1])
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            np.add.at(out, (ty + dy, tx + dx), np.maximum(fine[ys[pick] + dy, xs[pick] + dx], 0) * float(1 - step(np.array(span[dy + r, dx + r]), r - 1, r + 0.5)))
    return out


def low(v, s=5):
    return ndi.gaussian_filter(np.minimum(v, ndi.gaussian_filter(v, s)), s)


def bulk(v):
    half = cv2.resize(v.astype(np.float32), None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    med = np.stack([cv2.medianBlur(np.ascontiguousarray(half[..., c]), 5) for c in range(3)], -1)
    return cv2.resize(med, (v.shape[1], v.shape[0]), interpolation=cv2.INTER_LINEAR)


def blur(v, s):
    return np.stack([ndi.gaussian_filter(v[..., c], s, mode='nearest') for c in range(3)], -1)


def save(lin, name, out):
    w, h = FULL
    px, py = round(w * MARGIN), round(h * MARGIN)
    qx, qy = round(w * FIRST), round(h * FIRST)
    cw, ch = w + 2 * px, h + 2 * py
    bare, mid, prof, flat = sunless(lin)
    bare = bare.astype(np.float32)
    own = np.zeros((ch, cw), bool)
    own[py:py + h, px:px + w] = True
    plain = np.zeros((ch, cw, 3), np.float32)
    plain[py:py + h, px:px + w] = bare
    live = to_linear(np.asarray(Image.open(os.path.join(geo.ROOT, LIVE)).convert('RGB').resize((cw, ch), Image.LANCZOS)).astype(np.float32) / 255).astype(np.float32)
    live_bg = np.stack([low(live[..., c]) for c in range(3)], -1)
    live_stars = np.maximum(live - live_bg, 0)
    cy, cx = np.mgrid[0:ch, 0:cw]
    xh, yh = cx - px, cy - py
    ox, oy = np.maximum(-xh, xh - (w - 1)).clip(0), np.maximum(-yh, yh - (h - 1)).clip(0)
    away = np.maximum(ox / qx, oy / qy).astype(np.float32)
    rng = np.random.default_rng(SEED)
    ragged = np.zeros((ch, cw), np.float32)
    for amount, size in RAGGED:
        wave = ndi.gaussian_filter(rng.standard_normal((ch // 8, cw // 8)).astype(np.float32), size / 8)
        ragged += amount * cv2.resize(wave / np.abs(wave).max(), (cw, ch), interpolation=cv2.INTER_CUBIC)
    to_live = step(away + ragged, ZONE_OUT[0], ZONE_OUT[1])
    to_live[own] = 0
    level = bulk(plain)
    calm = blur(level, 6) * own[..., None]
    inner = ndi.binary_erosion(own, iterations=8)
    nearest = ndi.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    rim = (inner & ~ndi.binary_erosion(own, iterations=8 + RIM)).astype(np.float32)
    inside = np.maximum(ndi.gaussian_filter(rim, REACH_EDGE[0]), 1e-4)

    def outward(x):
        near = ndi.gaussian_filter(x * rim, REACH_EDGE[0]) / inside
        return ndi.gaussian_filter(near[nearest[0], nearest[1]], REACH_EDGE[1])

    def spread(x):
        for sigma, lo, hi in SPREAD:
            small = cv2.resize(x, None, fx=0.125, fy=0.125, interpolation=cv2.INTER_AREA)
            wide = cv2.resize(cv2.GaussianBlur(small, (0, 0), sigma / 8, borderType=cv2.BORDER_REPLICATE), (cw, ch), interpolation=cv2.INTER_CUBIC)
            m = step(away, lo, hi)
            x = x * (1 - m[..., None]) + wide * m[..., None] if x.ndim == 3 else x * (1 - m) + wide * m
        return x

    ext = spread(np.stack([outward(calm[..., c]) for c in range(3)], -1))
    print('sky level of the approved image at the border', (to_srgb(film(np.median(ext[~own], 0))) * 255).round(1), 'of the live plate', (to_srgb(film(np.median(live_bg[~own], 0))) * 255).round(1))
    gen_path = os.path.join(geo.ROOT, GEN)
    if not os.path.exists(gen_path):
        ask = to_srgb(film(np.where(own[..., None], plain, live)))
        ask[~own & (away < ASK_ZONE)] = (1, 0, 1)
        Image.fromarray((ask[py - qy:py + h + qy, px - qx:px + w + qx] * 255 + 0.5).astype(np.uint8)).resize(ASK, Image.LANCZOS).save(os.path.join(geo.ROOT, GEN_IN), quality=96)
        print('wrote', GEN_IN, 'generate', GEN, 'from it, then run again')
        sys.exit(0)
    gen = np.asarray(Image.open(gen_path).convert('RGB').resize((w + 2 * qx, h + 2 * qy), Image.LANCZOS)).astype(np.float32) / 255
    gen = cv2.copyMakeBorder(gen, py - qy, py - qy, px - qx, px - qx, cv2.BORDER_REPLICATE)
    ref = to_srgb(film(plain)).astype(np.float32)
    grey = lambda x: cv2.GaussianBlur(x.mean(-1), (0, 0), 2)
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(grey(ref), grey(gen), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), own.astype(np.uint8), 5)
    gen = cv2.warpAffine(gen, warp, (cw, ch), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    gen = unfilm(to_linear(np.clip(gen, 0, 1))).astype(np.float32)
    lum_c = blur(bulk(gen), 6) @ LUM
    off = ndi.distance_transform_edt(~own).astype(np.float32)
    ring = (off >= RING_AT[0]) & (off <= RING_AT[1])
    from_ring = ndi.distance_transform_edt(~ring, return_distances=False, return_indices=True)
    there = (ndi.gaussian_filter(lum_c * ring, REACH_EDGE[0]) / np.maximum(ndi.gaussian_filter(ring.astype(np.float32), REACH_EDGE[0]), 1e-4))[from_ring[0], from_ring[1]]
    carry = np.clip((lum_c + FOLLOW[0]) / (ndi.gaussian_filter(there, REACH_EDGE[1]) + FOLLOW[0]), FOLLOW[1], FOLLOW[2])
    carry = 1 + (carry - 1) * step(off, RING_AT[0], RING_AT[2])
    carry = 1 + (spread(carry.astype(np.float32)) - 1) * (1 - step(away, 1.0, 2.2))
    base = ext * carry[..., None]
    sx = np.where(xh < 0, xh + qx, np.where(xh >= w, xh - qx, xh)) % w
    sy = np.where(yh < 0, yh + qy, np.where(yh >= h, yh - qy, yh)) % h
    calm_bare = bulk(bare)
    bare_low = blur(np.minimum(bare, calm_bare + STAR_CUT * np.maximum(blur(np.abs(bare - calm_bare), FINE), 1e-5)), FINE)
    src_low = bare_low[sy, sx] @ LUM
    fine = bare - bare_low
    near = 1 - step(away + ragged * NEAR[2], NEAR[0], NEAR[1])
    grain = fine[sy, sx] * (np.clip((base @ LUM + FOLLOW[0]) / (src_low + FOLLOW[0]), GAIN[0], GAIN[1]) * near)[..., None]
    grain += scatter(fine, bare_low @ LUM, (1 - near) * (1 - step(away + ragged, THIN[0], THIN[1])), rng)
    haze = np.zeros((ch, cw, 3), np.float32)
    haze[py:py + h, px:px + w] = blur(bulk(flat.astype(np.float32)) - bulk(bare), 6)
    r = np.hypot(xh - SUN[0], yh - SUN[1])
    glow = np.stack([np.interp(r, mid, prof[:, c], right=0) for c in range(3)], -1).astype(np.float32)
    fall = np.clip(r[nearest[0], nearest[1]] / np.maximum(r, 1), 0, 1) ** HAZE
    haze = np.stack([outward(haze[..., c]) for c in range(3)], -1) * fall[..., None]
    print('generated sky registered', round(float(cc), 4), 'carry median', round(float(np.median(carry[~own & (to_live < 1)])), 3), 'fine gain median', round(float(np.median((base @ LUM + FOLLOW[0])[~own] / (src_low + FOLLOW[0])[~own])), 3))
    keep = (1 - to_live)[..., None]
    wide = np.maximum((base + haze) * keep + grain + live_bg * (1 - keep), 0) + live_stars * (1 - keep) + glow
    img = np.asarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8)).copy()
    fixed = os.path.join(geo.ROOT, KEEP)
    if os.path.exists(fixed):
        img[py:py + h, px:px + w] = np.asarray(Image.open(fixed).convert('RGB'))[qy:qy + h, qx:qx + w]
    else:
        img[py:py + h, px:px + w] = (to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8)
    img = Image.fromarray(img)
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/{name}', lossless=True, quality=90, method=6)
        print(key, name, im.size, round(os.path.getsize(f'{out}/{key}/{name}') / 1e6, 2), 'MB')
    img.resize((1760, 990), Image.LANCZOS).save(os.path.join(geo.ROOT, 'out/work/nep/p6/sky-hold-preview.jpg'), quality=90)
    Image.fromarray(np.clip(np.asarray(img).astype(np.float32) * 4, 0, 255).astype(np.uint8)).resize((1760, 990), Image.LANCZOS).save(os.path.join(geo.ROOT, 'out/work/nep/p6/sky-hold-preview-x4.jpg'), quality=90)


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    ca, cb, cc, cd, ce = 2.51, 0.03, 2.43, 0.59, 0.14
    kk = cd * y - cb
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (cc * y - ca) * ce * y, 0))) / (2 * (cc * y - ca))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(path, resample, blocks=False):
    img = Image.open(path).convert('RGB')
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], 'F').resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return unfilm(to_linear(a))


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def luma(a):
    return a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def compact(a):
    a = a.astype(np.float32)
    best = np.zeros_like(a)
    for ang in range(0, 180, 15):
        t = np.radians(ang)
        k = np.zeros((LINE, LINE), np.uint8)
        c = LINE // 2
        cv2.line(k, (int(round(c - c * np.cos(t))), int(round(c - c * np.sin(t)))), (int(round(c + c * np.cos(t))), int(round(c + c * np.sin(t)))), 1, 1)
        best = np.maximum(best, cv2.morphologyEx(a, cv2.MORPH_OPEN, k))
    return np.maximum(a - best, 0)


def specks(hs, zone, rule):
    lab, n = ndi.label(luma(hs) > rule[0], structure=np.ones((3, 3)))
    size = np.array([max(s[0].stop - s[0].start, s[1].stop - s[1].start) for s in ndi.find_objects(lab)])
    long = (size > rule[1])[lab - 1] & (lab > 0)
    cut = ndi.gaussian_filter(ndi.binary_dilation(long, iterations=2).astype(np.float32), 1) * zone
    print('lines taken out of the stars: px', int((cut > 0.5).sum()))
    return hs * (1 - np.clip(cut, 0, 1))[..., None]


def ring_mask(inner=None, outer=None):
    inner = RING['inner'] if inner is None else inner
    outer = RING['outer'] if outer is None else outer
    n = np.array(RING['normal'], float)
    n /= np.linalg.norm(n)
    c = np.array(RING['centre'], float)
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    f = (FULL[1] / 2) / np.tan(np.radians(15))
    d = np.stack([(xx - FULL[0] / 2) / f, -(yy - FULL[1] / 2) / f, -np.ones(xx.shape)], -1)
    t = ((c - geo.CAM) @ n) / (d @ n)
    p = geo.CAM + d * t[..., None] - c
    r = np.linalg.norm(p, axis=-1)
    m = step(r, inner - 0.06, inner) * (1 - step(r, outer, outer + 0.06)) * (t > 0)
    return m.astype(np.float32)


def hold(hero, fill, glow, out):
    fit = json.load(open(os.path.join(geo.ROOT, 'assets-src/neptune/fit.json')))
    c = fit['circle']
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    d = np.hypot(xx - c['cx'], yy - c['cy']) / c['r']
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    f = scene(fill, Image.LANCZOS, False)
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    sun = 1 - step(np.hypot(xx - SUN[0], yy - SUN[1]), SUN[2] * 0.7, SUN[2])
    moon = step(np.hypot(xx - MOON[0], yy - MOON[1]), MOON[2] * 1.12, MOON[2] * 1.3)
    covered = step(lg / np.maximum(la, 1e-5), 0.6, 0.85) * (1 - sun)
    own = step(d, 1.03, 1.07) * (1 - covered) * moon * (1 - ring_mask())
    own = ndi.gaussian_filter(own, 3)
    zone = (d > 1.1) & (d < 1.45) & (own > 0.98)
    gain = np.array([np.median(sky[..., i][zone]) / max(np.median(f[..., i][zone]), 1e-6) for i in range(3)])
    near = (own > 0.98).astype(np.float32)
    soft = lambda v: ndi.gaussian_filter(v, 48)
    local = np.stack([soft(np.minimum(sky[..., i], 0.2) * near) / np.maximum(soft(np.minimum(f[..., i], 0.2) * near), 1e-6) for i in range(3)], -1)
    reach = (soft(near) > 0.02)[..., None] * step(d, 0.72, 1.04)[..., None]
    scale = gain * (1 - reach) + np.clip(local, gain * 0.35, gain * 2.5) * reach
    print('fill gain', gain.round(3), 'own share', float(own.mean().round(3)))
    f = f * scale
    hs, fs = compact(a), compact(f)
    k = float(luma(hs)[zone].mean() / max(luma(fs)[zone].mean(), 1e-6))
    print('fill star gain', round(k, 3))
    hs = specks(hs, step(d, LIMB[0], LIMB[1]) * (1 - step(d, LIMB[2], LIMB[3])), SPECK)
    hs = specks(hs, ring_mask(*STRANDS), STRAND)
    outside = (step(d, EDGE[0], EDGE[1]) * moon)[..., None]
    behind = (1 - step(d, BEHIND[0], BEHIND[1]))[..., None]
    f = f - fs + fs * k * behind + hs * outside
    lin = sky * own[..., None] + f * (1 - own[..., None])
    np.save(os.path.join(geo.ROOT, CACHE), lin.astype(np.float32))
    save(lin, 'sky-hold.webp', out)
    Image.fromarray((np.clip(own, 0, 1) * 255).astype(np.uint8)).resize((1408, 792)).save(os.path.join(geo.ROOT, 'out/work/nep/sky/own.png'))


if __name__ == '__main__':
    if sys.argv[1] == 'zone':
        save(np.load(os.path.join(geo.ROOT, CACHE)), 'sky-hold.webp', sys.argv[2])
    else:
        hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
