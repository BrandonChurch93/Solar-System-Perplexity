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


def save(lin, name, out, ext=None):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((py, py), (px, px), (0, 0)), mode='symmetric')
    if ext:
        size = (FULL[0] + 2 * px, FULL[1] + 2 * py)
        e = np.asarray(Image.open(ext).convert('RGB').resize(size, Image.LANCZOS)).astype(np.float32) / 255
        e = unfilm(to_linear(e))
        core = np.zeros(wide.shape[:2], np.float32)
        core[py:-py, px:-px] = 1
        import cv2
        small = lambda v: cv2.resize(cv2.GaussianBlur(np.minimum(luma(v), 0.2).astype(np.float32), (0, 0), 8), None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)
        warp = np.eye(2, 3, dtype=np.float32)
        mask = (cv2.resize(core, None, fx=0.25, fy=0.25) > 0.99).astype(np.uint8)
        cc, warp = cv2.findTransformECC(small(wide), small(e), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), mask, 5)
        print('margin fit', round(float(cc), 4), warp.round(4).tolist())
        warp[:, 2] *= 4
        e = cv2.warpAffine(e.astype(np.float32), warp, size, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
        band = ndi.gaussian_filter(core, 60)
        edge = (band > 0.05) & (band < 0.95)
        inner = edge & (core > 0.5)
        outer = edge & (core < 0.5)
        gain = float(np.median(luma(wide)[inner]) / max(np.median(luma(e)[outer]), 1e-6))
        print('margin gain', round(gain, 3))
        w = ndi.gaussian_filter(core, 14)[..., None]
        w = np.clip((w - 0.5) * 2, 0, 1)
        wide = wide * w + e * gain * (1 - w)
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


def hold(hero, fill, glow, out, ext=None):
    geom = json.load(open('out/work/venus/limb-geom.json'))
    cx, cy, ra, rb = geom['hero'][:4]
    dev = np.array(geom['dev'])
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    th = np.arctan2(cy - yy - 0.5, xx + 0.5 - cx)
    r0 = 1 / np.hypot(np.cos(th) / ra, np.sin(th) / rb)
    f = (th + np.pi) / (2 * np.pi) * len(dev)
    i = np.floor(f).astype(int)
    edge = r0 + dev[i % len(dev)] * (1 - (f - i)) + dev[(i + 1) % len(dev)] * (f - i)
    d = np.hypot(xx + 0.5 - cx, yy + 0.5 - cy) / edge
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    f = scene(fill, Image.LANCZOS, True)
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    own = step(d, 1.03, 1.07) * (1 - step(lg / np.maximum(la, 1e-5), 0.6, 0.85))
    own = ndi.gaussian_filter(own, 3)
    valid = ndi.gaussian_filter(own, 40)
    low = np.stack([ndi.gaussian_filter(np.minimum(sky[..., i], 0.25) * own, 40) / np.maximum(valid, 1e-4) for i in range(3)], -1)
    ok = valid > 0.6
    target = low.copy()
    cols = np.arange(FULL[0])
    for y in range(FULL[1]):
        k = ok[y]
        if k.all() or k.sum() < 8:
            continue
        for i in range(3):
            target[y, :, i] = np.interp(cols, cols[k], low[y, k, i])
    hole = (~ok).astype(np.float32)
    mix = ndi.gaussian_filter(hole, 6)[..., None]
    target = target * (1 - mix) + np.stack([ndi.gaussian_filter(target[..., i], (10, 3)) for i in range(3)], -1) * mix
    flat = np.stack([ndi.gaussian_filter(np.minimum(f[..., i], 0.25), 40) for i in range(3)], -1)
    f = f / np.maximum(flat, 1e-5) * target
    print('own share', float(own.mean().round(3)))
    smooth = lambda v: np.stack([ndi.gaussian_filter(np.minimum(v[..., i], ndi.gaussian_filter(v[..., i], 4)), 4) for i in range(3)], -1)
    rim = step(d, RIM[0], RIM[1])[..., None] * (1 - step(d, 1.06, 1.1)[..., None])
    f = f * (1 - rim) + (smooth(f) + np.maximum(a - smooth(a), 0)) * rim
    lin = sky * own[..., None] + f * (1 - own[..., None])
    core = Image.fromarray((to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8))
    core.save('out/work/venus/sky-core.png')
    wide = (round(FULL[0] * (1 + 2 * MARGIN)), round(FULL[1] * (1 + 2 * MARGIN)))
    canvas = Image.new('RGB', wide, (255, 0, 255))
    canvas.paste(core, (round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)))
    canvas.resize((3072, 1728), Image.LANCZOS).save('out/work/venus/sky-ext-in.jpg', quality=96)
    save(lin, 'sky-hold.webp', out, ext)


def terrain(close, glow, out, seen=None):
    pts = np.load('out/work/venus/close-horizon-pts.npy')
    hy = np.polyval(np.polyfit(pts[:, 0], pts[:, 1], 2), np.arange(FULL[0]) + 0.5)[None, :]
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
        hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6] if len(sys.argv) > 6 else None)
    else:
        terrain(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else None)
