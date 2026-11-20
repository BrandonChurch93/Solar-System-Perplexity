import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from deblock import deblock

Image.MAX_IMAGE_PIXELS = None
FULL = (2816, 1584)
WEB = (1408, 792)
MARGIN = 0.125
RIM = (1.008, 1.02)


def save(lin, name, out):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((py, py), (px, px), (0, 0)), mode='symmetric')
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


def hold(hero, fill, glow, out, fix=None):
    fit = json.load(open('assets-src/mars/fit.json'))
    c = fit['circle']
    w, h = fit['imageSize']
    k = FULL[0] / w
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    d = np.hypot(xx - c['cx'] * k, yy - c['cy'] * k) / (c['r'] * k)
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    f = scene(fill, Image.LANCZOS, True)
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    own = step(d, 1.03, 1.07) * (1 - step(lg / np.maximum(la, 1e-5), 0.6, 0.85))
    own = ndi.gaussian_filter(own, 3)
    ring = (d > 1.1) & (d < 1.45) & (own > 0.98)
    gain = np.array([np.median(sky[..., i][ring]) / max(np.median(f[..., i][ring]), 1e-6) for i in range(3)])
    near = (own > 0.98).astype(np.float32)
    soft = lambda v: ndi.gaussian_filter(v, 48)
    local = np.stack([soft(np.minimum(sky[..., i], 0.2) * near) / np.maximum(soft(np.minimum(f[..., i], 0.2) * near), 1e-6) for i in range(3)], -1)
    reach = (soft(near) > 0.02)[..., None] * step(d, 0.72, 1.04)[..., None]
    scale = gain * (1 - reach) + np.clip(local, gain * 0.35, gain * 2.5) * reach
    print('fill gain', gain.round(3), 'own share', float(own.mean().round(3)))
    low = lambda v: np.stack([ndi.gaussian_filter(np.minimum(v[..., i], ndi.gaussian_filter(v[..., i], 4)), 4) for i in range(3)], -1)
    rim = step(d, RIM[0], RIM[1])[..., None]
    f = f * scale
    f = f * (1 - rim) + (low(f) + np.maximum(a - low(a), 0)) * rim
    lin = sky * own[..., None] + f * (1 - own[..., None])
    if fix:
        lin = np.maximum(lin + scene(fix[0], Image.LANCZOS) - scene(fix[1], Image.BICUBIC), 0) * own[..., None] + lin * (1 - own[..., None])
    save(lin, 'sky-hold.webp', out)


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
        hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    else:
        terrain(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else None)
