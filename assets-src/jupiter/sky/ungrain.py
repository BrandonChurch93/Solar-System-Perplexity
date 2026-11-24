import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import patch as P
from scale import restore, FILM, HERO

Image.MAX_IMAGE_PIXELS = None
f32 = np.float32
PX, PY = round(P.FULL[0] * P.MARGIN), round(P.FULL[1] * P.MARGIN)
NEAR = 24
SOFT = 12
JOIN = 32
BORROW = {'width': 2 * PX + 2 * JOIN, 'dx': 250, 'dy': PY, 'sigma': 24, 'rows': 48}
R2 = (0.7548776662466927, 0.5698402909980532)
POST = {'grain': 0.012, 'dark': 0.6, 'bright': 1.0, 'middle': 0.35, 'fall': 1.4, 'wrap': 4096}
STEPS = (1, 2, 4, 8, 16, 32, 64)
REACH = (0.6, 0.3, 0.1, 0.03)
TRIES = 21
NEIGHBOURS = 4


def tone(lin):
    return (P.to_srgb(P.film(lin)) * 255).astype(np.float32)


def lin_of(a):
    return P.unfilm(P.to_linear(np.asarray(a, dtype=np.float32) / 255))


def frac(a):
    return (a - np.floor(a)).astype(f32)


def hash2(x, y, s):
    k = f32(s) * f32(0.6180339)
    a, b, c = frac(x * f32(0.1031) + k), frac(y * f32(0.1030) + k), frac(x * f32(0.0973) + k)
    d = (a * (b + f32(33.33)) + b * (c + f32(33.33)) + c * (a + f32(33.33))).astype(f32)
    return frac((a + d + b + d) * (c + d))


def noise(frame, w, h):
    s = frame % POST['wrap']
    x = (np.arange(w, dtype=f32) + f32(0.5))[None, :].repeat(h, 0)
    y = (np.arange(h, dtype=f32) + f32(0.5))[::-1][:, None].repeat(w, 1)
    g = hash2(x, y, s) + hash2(x + f32(17), y + f32(17), s + 3) - 1
    d = hash2(x + f32(61), y + f32(61), s + 7) + hash2(x + f32(113), y + f32(113), s + 11) - 1
    return g, d


def shaken(levels, g, d):
    lum = np.clip((levels / 255) @ np.array([0.2126, 0.7152, 0.0722]), 0, 1)
    t = 1 - np.abs(lum - POST['middle']) * POST['fall']
    return (g * POST['grain'] * 255 * (POST['dark'] + (POST['bright'] - POST['dark']) * t) + d)[..., None]


def stepless(q):
    lo, hi = np.maximum(q - 0.5, 0), q + 0.5
    c = q.copy()
    for sigma in STEPS:
        soft = ndi.gaussian_filter(q, (sigma, sigma, 0))
        off = ((soft < lo) | (soft > hi)).any(-1).astype(np.float32)
        calm = np.clip(1 - 4 * ndi.gaussian_filter(ndi.maximum_filter(off, size=int(2 * sigma) | 1), sigma), 0, 1)[..., None]
        c = c * (1 - calm) + soft * calm
    return c


def settle(q, seen, frame):
    h, w, _ = q.shape
    g, d = noise(frame, w, h)
    lo, hi = np.maximum(q - 0.5, 0), q + 0.5
    p = stepless(q)
    n = shaken(p, g, d)
    floor = np.where(seen > 0, seen - 0.5 - n, -np.inf).astype(np.float32)
    roof = np.where(seen < 255, seen + 0.5 - n, np.inf).astype(np.float32)
    near = (NEIGHBOURS, NEIGHBOURS, 0)
    for reach in REACH:
        best = np.full(p.shape, -1, np.float32)
        total = np.zeros(p.shape, np.float32)
        count = np.zeros(p.shape, np.float32)
        for o in np.linspace(-reach, reach, TRIES):
            v = p + f32(o)
            score = ndi.gaussian_filter(((v >= floor) & (v < roof)).astype(np.float32), near)
            more, same = score > best, score == best
            total = np.where(more, f32(o), total + np.where(same, f32(o), 0))
            count = np.where(more, 1, count + same)
            best = np.maximum(best, score)
        p = np.clip(p + ndi.gaussian_filter(total / count, near), lo, hi)
    here = ndi.gaussian_filter(((p >= floor) & (p < roof)).astype(np.float32), near)
    none = ndi.gaussian_filter((floor <= 0).astype(np.float32), near)
    p = np.where((none >= here) & (lo == 0), 0, p)
    return p, ((p >= floor) & (p < roof)).all(-1)


def glow(clean, grainy, frame):
    q = np.asarray(Image.open(clean).convert('RGB')).astype(np.float32)
    seen = np.asarray(Image.open(grainy).convert('RGB')).astype(np.float32)
    p, fits = settle(q, seen, frame)
    lit = q.max(-1) > 0
    print('glow without grain: the value inside each step of 8 bit read from the film render of frame', frame, '; it gives the film render back in', round(float(fits.mean()), 4), 'of the frame and in', round(float(fits[lit].mean()), 4), 'of the pixels where the plain render is above zero; exactly zero in', round(float((p.max(-1) == 0).mean()), 4), '(plain render', round(float((~lit).mean()), 4), '); largest move', round(float(np.abs(p - q).max()), 3), 'of 255')
    c = p / 255
    if (q.shape[1], q.shape[0]) != P.FULL:
        c = np.clip(np.stack([np.asarray(Image.fromarray(c[..., i], 'F').resize(P.FULL, Image.BICUBIC)) for i in range(3)], -1), 0, 1)
    return P.unfilm(P.to_linear(c))


def low(v):
    return np.stack([ndi.gaussian_filter(np.minimum(v[..., i], ndi.gaussian_filter(v[..., i], 4)), 4) for i in range(3)], -1)


def masks(a, g):
    fit = json.load(open('assets-src/jupiter/fit.json'))
    c = fit['circle']
    k = P.FULL[0] / fit['imageSize'][0]
    yy, xx = np.mgrid[0:P.FULL[1], 0:P.FULL[0]]
    d = np.hypot(xx - c['cx'] * k, yy - c['cy'] * k) / (c['r'] * k)
    la = ndi.gaussian_filter(P.luma(a), 10)
    lg = ndi.gaussian_filter(P.luma(g), 10)
    share = lg / np.maximum(la, 1e-5)
    calm = 1 - P.step(share, 0.6, 0.85)
    quiet = 1 - P.step(share, P.QUIET[0], P.QUIET[1])
    own = ndi.gaussian_filter(P.step(d, P.RIM[0], P.RIM[1]) * calm, 2)
    trust = ndi.gaussian_filter(P.step(d, 1.03, 1.07) * quiet, 8)
    return own, trust, (trust > 0.98).astype(np.float32)


def factor(after, before, near):
    out, sure = None, None
    for sigma in P.SCALES:
        n = np.clip(P.wide(near, sigma), 0, 1)
        r = np.stack([np.maximum(P.wide(after[..., i] * near, sigma), 0) / np.maximum(P.wide(before[..., i] * near, sigma), 1e-9) for i in range(3)], -1)
        m = P.step(n, 0.04, 0.3)[..., None] if sigma != P.SCALES[-1] else np.ones_like(n)[..., None]
        if out is None:
            out, sure = r, m
        else:
            out = out * sure + r * (1 - sure)
            sure = np.maximum(sure, m)
    return np.clip(out, 0.5, 2)


def harmonic(gap, depth):
    n = gap.shape[0]
    spec = np.fft.rfft(np.concatenate([gap, gap[::-1]], 0), axis=0)
    freq = np.fft.rfftfreq(2 * n)[:, None]
    return np.stack([np.fft.irfft(spec * np.exp(-2 * np.pi * freq * max(j + 1.0, float(SOFT))), 2 * n, axis=0)[:n] for j in range(depth)], 1)


def step_at(after, before, axis):
    return ndi.gaussian_filter1d(np.median(after, axis) - np.median(before, axis), SOFT, axis=0, mode='nearest')


def join(a, b, at, total):
    w = P.step(np.arange(total, dtype=np.float32), at - JOIN / 2, at + JOIN / 2)[None, :, None]
    out = np.zeros((a.shape[0], total, 3), np.float32)
    out[:, :a.shape[1]] = a
    right = np.zeros_like(out)
    right[:, total - b.shape[1]:] = b
    return out * (1 - w) + right * w


def sized(master, size):
    if master.dtype == np.uint8:
        return np.asarray(Image.fromarray(master).resize(size, Image.LANCZOS)).astype(np.float64)
    return np.clip(np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(master[..., i], dtype=np.float32), 'F').resize(size, Image.LANCZOS)) for i in range(3)], -1), 0, 255).astype(np.float64)


def full(master, gain, knee):
    h, w, _ = master.shape
    return restore(sized(master, (round(w * FILM / HERO), round(h * FILM / HERO))), gain, knee)


def web(master):
    h, w, _ = master.shape
    return sized(master, (w // 2, h // 2))


def place(shipped, check, before, after, out, sure, exact):
    src = np.asarray(Image.open(shipped).convert('RGB'))
    same = np.abs((check + 0.5).astype(np.uint8).astype(int) - src.astype(int)).max(axis=2) == 0
    want = np.clip(src.astype(np.float64) + after - before, 0, 255)
    if exact:
        np.save(out + '.npy', want.astype(np.float32))
        new = (want + 0.5).astype(np.uint8)
    else:
        yy, xx = np.mgrid[0:src.shape[0], 0:src.shape[1]]
        new = np.floor(want + np.modf(xx * R2[0] + yy * R2[1])[0][..., None]).astype(np.uint8)
    Image.fromarray(new).save(out, lossless=True, quality=90, method=6)
    moved = want - src
    print(out, 'where the hero alone decides the replay with the grain gives the shipped texel in', round(float(same[sure].mean()), 4), 'of', int(sure.sum()), 'texels; change of the file, of 255: mean', round(float(moved.mean()), 3), 'largest', round(float(np.abs(moved).max()), 2), 'mean of the 8 bit file', round(float((new.astype(float) - src).mean()), 3))


def main(hero, grainy, clean, frame, shipped, out, gain, knee):
    a = P.scene(hero, Image.LANCZOS, True)
    go = P.scene(grainy, Image.BICUBIC)
    gc = glow(clean, grainy, frame)
    own, trust, near = masks(a, go)
    alone = (trust > 0.999) & (own > 0.999)
    raw_o, raw_c = a - go, a - gc
    ls_o, ls_c = low(raw_o), low(raw_c)
    size = (P.FULL[0] + 2 * PX, P.FULL[1] + 2 * PY)
    total = size[0]
    small = np.asarray(Image.open(f'{shipped}/web/sky-hold.webp').convert('RGB')).astype(np.float32)
    est = lin_of(np.clip(np.stack([np.asarray(Image.fromarray(small[..., i], 'F').resize(size, Image.LANCZOS)) for i in range(3)], -1), 0, 255))
    core = (slice(PY, PY + P.FULL[1]), slice(PX, PX + P.FULL[0]))
    lin_o = np.where(alone[..., None], np.maximum(raw_o, 0), est[core])
    rest = np.maximum(lin_o - ls_o * trust[..., None] - (raw_o - ls_o) * own[..., None], 0)
    base = low(rest) * np.clip((1 - trust) * 50, 0, 1)[..., None]
    fine = (rest - low(rest)) * np.clip((1 - own) * 50, 0, 1)[..., None]
    f = factor(ls_c, ls_o, near)
    delta = (ls_c - ls_o) * trust[..., None] + ((raw_c - ls_c) - (raw_o - ls_o)) * own[..., None] + (f - 1) * base + (P.luma(f)[..., None] - 1) * fine
    lin_c = np.where(alone[..., None], np.maximum(raw_c, 0), np.maximum(lin_o + delta, 0))
    print('share of the frame where the hero alone decides', round(float(alone.mean()), 3), 'change of the fill 5, 50, 95 percent', np.percentile(f[~alone], [5, 50, 95]).round(4))

    wide_o = est.copy()
    wide_o[core] = lin_o
    wide_c = wide_o.copy()
    wide_c[core] = lin_c
    rows = slice(PY, PY + P.FULL[1])
    x1 = PX + P.FULL[0]
    y1 = PY + P.FULL[1]
    left = harmonic(step_at(lin_c[:, :NEAR], lin_o[:, :NEAR], 1), PX)
    right = harmonic(step_at(lin_c[:, -NEAR:], lin_o[:, -NEAR:], 1), PX)
    wide_c[rows, :PX] += left[:, ::-1]
    wide_c[rows, x1:] += right
    b = BORROW
    took = (slice(y1 - PY - b['dy'], y1 - b['dy']), slice(b['dx'], b['dx'] + b['width']))
    copied = wide_c[took] - wide_o[took]
    copied = copied - ndi.gaussian_filter(copied, (b['sigma'], b['sigma'], 0), mode='nearest')
    level = ndi.gaussian_filter1d(np.median(wide_c[y1 - b['rows']:y1, :b['width']], 0) - np.median(wide_o[y1 - b['rows']:y1, :b['width']], 0), b['sigma'], axis=0, mode='nearest')
    tops = [harmonic(step_at(wide_c[PY:PY + NEAR, x], wide_o[PY:PY + NEAR, x], 0), PY)[:, ::-1].transpose(1, 0, 2) for x in (slice(0, P.FULL[0]), slice(2 * PX, total))]
    under = harmonic(step_at(wide_c[y1 - NEAR:y1, 2 * PX:], wide_o[y1 - NEAR:y1, 2 * PX:], 0), PY).transpose(1, 0, 2)
    top = join(tops[0], tops[1], total / 2, total)
    bottom = join(copied + level[None], under, 2 * PX + JOIN, total)
    wide_c[:PY] += top
    wide_c[y1:] += bottom
    wide_c = np.maximum(wide_c, 0)
    print('level carried into the margins, x1000: left', (left[:, 0].mean(0) * 1000).round(3), 'right', (right[:, 0].mean(0) * 1000).round(3), 'top', (top[-1].mean(0) * 1000).round(3), 'bottom', (bottom[0].mean(0) * 1000).round(3), 'of that under the borrowed corner', (level.mean(0) * 1000).round(3))

    before, after = tone(wide_o), tone(wide_c)
    check = (before + 0.5).astype(np.uint8)
    moved = after - before
    print('master without the grain against the master with it, of 255: mean', round(float(moved.mean()), 3), 'largest', round(float(np.abs(moved).max()), 2), 'inside the approved frame mean', round(float(moved[core].mean()), 3))
    whole = np.zeros((size[1], size[0]), np.float32)
    whole[core] = alone
    sure_full = ndi.binary_erosion(np.asarray(Image.fromarray(whole, 'F').resize((round(size[0] * FILM / HERO), round(size[1] * FILM / HERO)), Image.BOX)) > 0.999, iterations=4)
    sure_web = ndi.binary_erosion(np.asarray(Image.fromarray(whole, 'F').resize((size[0] // 2, size[1] // 2), Image.BOX)) > 0.999, iterations=4)
    place(f'{shipped}/full/sky-hold.webp', full(check, gain, knee), full(before, gain, knee), full(after, gain, knee), f'{out}/full/sky-hold.webp', sure_full, True)
    place(f'{shipped}/web/sky-hold.webp', web(check), web(before), web(after), f'{out}/web/sky-hold.webp', sure_web, False)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5], sys.argv[6], float(sys.argv[7]), float(sys.argv[8]))
