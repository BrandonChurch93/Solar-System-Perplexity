import json, sys
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from deblock import deblock

Image.MAX_IMAGE_PIXELS = None
FULL = (2816, 1584)
WEB = (1408, 792)
MARGIN = 0.125
RIM = (1.012, 1.03)
SCALES = (24, 48, 96, 192, 384, 768)
QUIET = (0.1, 0.3)
FILL_CHROMA = 0.5


def side(lin, take, left):
    px = round(FULL[0] * MARGIN)
    t = scene(take, Image.LANCZOS, True)
    seen = t[:, px:] if left else t[:, :FULL[0] - px]
    kept = lin[:, :FULL[0] - px] if left else lin[:, px:]
    near = slice(0, 512) if left else slice(FULL[0] - px - 512, FULL[0] - px)
    a = np.ascontiguousarray(luma(kept[:, near]) ** 0.5, dtype=np.float32)
    b = np.ascontiguousarray(luma(seen[:, near]) ** 0.5, dtype=np.float32)
    (dx, dy), score = cv2.phaseCorrelate(b, a)
    print('side', 'left' if left else 'right', 'shift', round(dx, 2), round(dy, 2), 'score', round(score, 3))
    if abs(dx) > 8 or abs(dy) > 8:
        raise SystemExit('take is not aligned')
    t = np.stack([ndi.shift(t[..., i], (dy, dx), order=1, mode='nearest') for i in range(3)], -1)
    seen = t[:, px:] if left else t[:, :FULL[0] - px]
    new = t[:, :px] if left else t[:, FULL[0] - px:]
    here = kept[:, :24] if left else kept[:, -24:]
    there = new[:, -24:] if left else new[:, :24]
    step_at_seam = ndi.gaussian_filter1d(np.median(here, 1) - np.median(there, 1), 12, axis=0, mode='nearest')
    print('seam step x1000', (step_at_seam.mean(0) * 1000).round(2), (step_at_seam.min(0) * 1000).round(2), (step_at_seam.max(0) * 1000).round(2))
    rows = step_at_seam.shape[0]
    spec = np.fft.rfft(np.concatenate([step_at_seam, step_at_seam[::-1]], 0), axis=0)
    freq = np.fft.rfftfreq(2 * rows)[:, None]
    far = np.arange(px, 0, -1) if left else np.arange(1, px + 1)
    for col in range(px):
        new[:, col] += np.fft.irfft(spec * np.exp(-2 * np.pi * freq * max(float(far[col]), 12.0)), 2 * rows, axis=0)[:rows]
    new = np.maximum(new, 0)
    old = np.pad(lin, ((0, 0), (px, px), (0, 0)), mode='symmetric')
    old = old[:, :px] if left else old[:, -px:]
    away = np.arange(px, 0, -1) if left else np.arange(1, px + 1)
    w = step(away.astype(np.float32), 0, 24)[None, :, None]
    return old * (1 - w) + new * w


def save(lin, name, out, takes=None):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((0, 0), (px, px), (0, 0)), mode='symmetric')
    if takes:
        wide[:, :px] = side(lin, takes[0], True)
        wide[:, -px:] = side(lin, takes[1], False)
    wide = np.pad(wide, ((py, py), (0, 0), (0, 0)), mode='symmetric')
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/{name}', lossless=True, quality=90, method=6)


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


def wide(v, sigma):
    f = int(sigma // 6)
    if f < 2:
        return ndi.gaussian_filter(v, sigma)
    h, w = v.shape
    small = Image.fromarray(v.astype(np.float32), 'F').resize((max(w // f, 1), max(h // f, 1)), Image.BOX)
    soft = ndi.gaussian_filter(np.asarray(small), sigma / f)
    return np.asarray(Image.fromarray(soft, 'F').resize((w, h), Image.BICUBIC))


def hold(hero, fill, glow, out, takes=None):
    fit = json.load(open('assets-src/jupiter/fit.json'))
    c = fit['circle']
    w, h = fit['imageSize']
    k = FULL[0] / w
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    d = np.hypot(xx - c['cx'] * k, yy - c['cy'] * k) / (c['r'] * k)
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    f = scene(fill, Image.LANCZOS, True)
    raw = a - g
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    share = lg / np.maximum(la, 1e-5)
    calm = 1 - step(share, 0.6, 0.85)
    quiet = 1 - step(share, QUIET[0], QUIET[1])
    own = ndi.gaussian_filter(step(d, RIM[0], RIM[1]) * calm, 2)
    trust = ndi.gaussian_filter(step(d, 1.03, 1.07) * quiet, 8)
    near = (trust > 0.98).astype(np.float32)
    low = lambda v: np.stack([ndi.gaussian_filter(np.minimum(v[..., i], ndi.gaussian_filter(v[..., i], 4)), 4) for i in range(3)], -1)
    ls, lf = low(raw), low(f)
    yf = luma(lf)
    ratio = None
    sure = None
    for sigma in SCALES:
        n = np.clip(wide(near, sigma), 0, 1)
        r = np.stack([np.maximum(wide(ls[..., i] * near, sigma), 0) / np.maximum(wide((yf * (1 - FILL_CHROMA) + lf[..., i] * FILL_CHROMA) * near, sigma), 1e-9) for i in range(3)], -1)
        m = step(n, 0.04, 0.3)[..., None] if sigma != SCALES[-1] else np.ones_like(n)[..., None]
        if ratio is None:
            ratio, sure = r, m
        else:
            ratio = ratio * sure + r * (1 - sure)
            sure = np.maximum(sure, m)
    ratio = np.clip(ratio, 0.2, 8)
    print('ratio at the disc centre', ratio[int(c['cy'] * k), int(c['cx'] * k)].round(3), 'trust share', float(trust.mean().round(3)), 'own share', float(own.mean().round(3)))
    fine = f - lf
    fine = luma(fine)[..., None] * (1 - FILL_CHROMA) + fine * FILL_CHROMA
    tone = yf[..., None] * (1 - FILL_CHROMA) + lf * FILL_CHROMA
    base = ls * trust[..., None] + tone * ratio * (1 - trust[..., None])
    detail = (raw - ls) * own[..., None] + fine * luma(ratio)[..., None] * (1 - own[..., None])
    lin = np.maximum(base + detail, 0)
    save(lin, 'sky-hold.webp', out, takes)


def terrain(close, glow, out, seen=None):
    cam = json.load(open('src/stops/mars/relief.json'))['camera']
    line = cam['horizonLineFull']
    apex = cam['horizonApexFull']
    k = FULL[0] / (cam['principalPointFull'][0] * 2)
    xs = np.array([line[0][0], apex[0], line[1][0]]) * k
    ys = np.array([line[0][1], apex[1], line[1][1]]) * k
    hy = np.polyval(np.polyfit(xs, ys, 2), np.arange(FULL[0]))[None, :]
    yy = np.arange(FULL[1], dtype=np.float32)[:, None]
    a = scene(close, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    sky = np.maximum(a - g, 0)
    edge = hy - 48
    own = step(edge - yy, 0, 34) * np.ones_like(hy)
    if seen:
        got = np.maximum(scene(seen, Image.BICUBIC) - g, 0)
        wide = lambda v: ndi.gaussian_filter(v * own, 28)
        through = np.clip(wide(luma(got)) / np.maximum(wide(luma(sky)), 1e-7), 0.25, 1)
        print('through', float(through[own > 0.9].min().round(3)), float(np.median(through[own > 0.9]).round(3)))
        sky = sky / through[..., None]
    rows = np.clip(np.rint(2 * edge - yy), 0, FULL[1] - 1).astype(np.int64)
    cols = np.broadcast_to(np.arange(FULL[0])[None, :], rows.shape)
    mirror = sky[rows, cols]
    print('own share', float(own.mean().round(3)))
    lin = sky * own[..., None] + mirror * (1 - own[..., None])
    save(lin, 'sky-terrain.webp', out)


if __name__ == '__main__':
    kind = sys.argv[1]
    if kind == 'hold':
        hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6:8] if len(sys.argv) > 7 else None)
    else:
        terrain(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else None)
