import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/sky')
import geo
from deblock import deblock

FULL = (2816, 1584)
MARGIN = 0.375
FADE = 0.6
BAND_DEG = 31.0
WIDE_LOW = 20
DETAIL = (0.3, 0.85)
SHIFT = 700
SEAM = 28
RING_ZONE = (1.9, 2.02)
RING_FILL = 0.0
RIM = (1.008, 1.02)
MOONS = [(671.7, 343.9, 29.06), (2425.5, 444.2, 24.0)]
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def scene(path, resample, blocks=False, shift=None):
    img = Image.open(path).convert('RGB')
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if shift is not None:
        a = np.stack([ndi.shift(a[..., i], (shift[1], shift[0]), order=1, mode='nearest') for i in range(3)], -1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], 'F').resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return geo.unfilm(geo.to_linear(a))


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def drift(hero, film):
    a = np.asarray(Image.open(hero).convert('L').resize((1920, 1080), Image.LANCZOS)).astype(np.float32) / 255
    b = np.asarray(Image.open(film).convert('L')).astype(np.float32) / 255
    hp = lambda v: v - ndi.gaussian_filter(v, 6)
    x0, y0, sz = 740, 330, 512
    win = cv2.createHanningWindow((sz, sz), cv2.CV_32F)
    (dx, dy), resp = cv2.phaseCorrelate(hp(a)[y0:y0 + sz, x0:x0 + sz], hp(b)[y0:y0 + sz, x0:x0 + sz], win)
    return dx, dy, resp


T, R0, R1, NR = 2700, 1.08, 1.84, 1520
SHEARS = np.arange(-0.8, 0.801, 0.1)
WIN = 21
THIN = 25
N0 = np.array([-0.1989, -0.6042, 0.7716])


def basis():
    n = N0 / np.linalg.norm(N0)
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return n, e1, np.cross(n, e1)


def along(img):
    n, e1, e2 = basis()
    th = (np.arange(T) + 0.5) / T * 2 * np.pi
    rr = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
    A, TH = np.meshgrid(rr, th, indexing='ij')
    P = A[..., None] * (np.cos(TH)[..., None] * e1 + np.sin(TH)[..., None] * e2)
    px, py = geo.project(P)
    px, py = px.astype(np.float32), py.astype(np.float32)
    lum = img @ LUMA
    planes = [cv2.remap(lum - ndi.median_filter(lum, size=7), px, py, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)]
    planes += [cv2.remap(np.ascontiguousarray(img[..., c]), px, py, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE) for c in range(3)]
    best = np.full(planes[0].shape, -1.0, np.float32)
    out = np.zeros(planes[0].shape + (3,), np.float32)
    half = WIN // 2
    for s in SHEARS:
        meds = []
        for v in planes:
            stack = np.empty((WIN,) + v.shape, np.float32)
            for i, k in enumerate(range(-half, half + 1)):
                dy = -s * k
                stack[i] = np.roll(ndi.shift(v, (dy, 0), order=1, mode='nearest') if abs(dy) > 1e-6 else v, -k, axis=1)
            meds.append(np.median(stack, 0))
        better = meds[0] > best
        best[better] = meds[0][better]
        for c in range(3):
            out[..., c][better] = meds[c + 1][better]
    thin = np.stack([out[..., c] - ndi.grey_opening(out[..., c], size=(THIN, 1)) for c in range(3)], -1)
    rays = geo.rays()
    t = -(geo.CAM @ n) / (rays @ n)
    Q = geo.CAM + rays * t[..., None]
    r = np.linalg.norm(Q, axis=-1)
    ang = np.mod(np.arctan2(Q @ e2, Q @ e1), 2 * np.pi)
    row = ((r - R0) / (R1 - R0) * NR - 0.5).astype(np.float32)
    col = (ang / (2 * np.pi) * T - 0.5 + 2).astype(np.float32)
    wrap = lambda v: np.concatenate([v[:, -2:], v, v[:, :2]], 1)
    back = cv2.remap(wrap(out), col, row, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    line = cv2.remap(wrap(thin), col, row, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    ok = (t > 0) & (r > R0) & (r < R1)
    line[~ok] = 0
    return back, np.maximum(line, 0), ok


def low(v):
    return np.stack([ndi.gaussian_filter(np.minimum(v[..., i], ndi.gaussian_filter(v[..., i], 4)), 4) for i in range(3)], -1)


def carry(v, px, py):
    h, w = v.shape[:2]
    yy, xx = np.mgrid[-py:h + py, -px:w + px].astype(np.float32)
    ux, uy = np.cos(np.radians(BAND_DEG)), np.sin(np.radians(BAND_DEG))
    tx = np.stack([(0 - xx) / ux, (w - 1 - xx) / ux])
    ty = np.stack([(0 - yy) / uy, (h - 1 - yy) / uy])
    t0 = np.maximum(tx.min(0), ty.min(0))
    t1 = np.minimum(tx.max(0), ty.max(0))
    t = np.where(t0 > 0, t0, np.where(t1 < 0, t1, 0))
    hit = t0 <= t1
    mx = np.where(hit, xx + t * ux, xx).astype(np.float32)
    my = np.where(hit, yy + t * uy, yy).astype(np.float32)
    return cv2.remap(np.ascontiguousarray(v), np.clip(mx, 0, w - 1), np.clip(my, 0, h - 1), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def one_sky(path, size):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    lin = geo.unfilm(geo.to_linear(a))
    lin = np.stack([ndi.gaussian_filter(ndi.median_filter(lin[..., i], size=11), 5) for i in range(3)], -1)
    return np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(lin[..., i]), 'F').resize(size, Image.BICUBIC)) for i in range(3)], -1)


def shifted(v, px, py):
    h, w = v.shape[:2]
    out = np.pad(v, ((py, py), (px, px), (0, 0)), mode='symmetric')
    yy, xx = np.mgrid[-py:h + py, -px:w + px]
    todo = (xx < 0) | (xx >= w) | (yy < 0) | (yy >= h)
    dx, dy = round(SHIFT * np.cos(np.radians(BAND_DEG))), round(SHIFT * np.sin(np.radians(BAND_DEG)))
    near = np.zeros(todo.shape, np.float32)
    for k in (-1, 1, -2, 2, -3, 3):
        sx, sy = xx + k * dx, yy + k * dy
        ok = todo & (sx >= 0) & (sx < w) & (sy >= 0) & (sy < h)
        near[ok] = 1
        todo &= ~ok
        out[ok] = v[sy[ok], sx[ok]]
    return out, ndi.gaussian_filter(near, 3)


def widen(lin, one):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    pad = lambda v: np.pad(v, ((py, py), (px, px), (0, 0)), mode='symmetric')
    broad = np.stack([ndi.gaussian_filter(low(lin)[..., i], WIDE_LOW) for i in range(3)], -1)
    far = carry(broad, px, py)
    far = np.stack([ndi.gaussian_filter(far[..., i], 6) for i in range(3)], -1)
    yy, xx = np.mgrid[-py:FULL[1] + py, -px:FULL[0] + px].astype(np.float32)
    ox = np.maximum(np.maximum(-xx, xx - (FULL[0] - 1)), 0)
    oy = np.maximum(np.maximum(-yy, yy - (FULL[1] - 1)), 0)
    m = np.hypot(ox / px, oy / py)
    w = step(m, 0, FADE)[..., None]
    sky = one_sky(one, (FULL[0] + 2 * px, FULL[1] + 2 * py))
    inside = ((ox == 0) & (oy == 0))[..., None]
    fine = lin - broad
    moved, got = shifted(fine, px, py)
    t = (step(np.hypot(ox, oy), 0, SEAM) * got)[..., None]
    detail = (pad(fine) * (1 - t) + moved * t) * (1 - step(m, DETAIL[0], DETAIL[1]))[..., None]
    held = np.where(inside, pad(broad), far)
    return np.maximum(detail + held * (1 - w) + sky * w, 0), w[..., 0], sky


def save(wide, name, out):
    img = Image.fromarray((geo.to_srgb(geo.film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/{name}', lossless=True, quality=90, method=6)


def rim(one, out):
    lin = np.load('out/work/u/sky/hold-lin.npy')
    wide, w, sky = widen(lin, one)
    save(wide, 'sky-hold.webp', out)
    show = lambda v: Image.fromarray((geo.to_srgb(geo.film(v)) * 255 + 0.5).astype(np.uint8)).resize((1232, 693), Image.LANCZOS)
    show(wide).save('out/work/u/sky/sky-hold-wide.jpg', quality=90)
    show(sky).save('out/work/u/sky/sky-one-low.jpg', quality=90)
    print('wide', wide.shape, 'one sky mean', sky.mean((0, 1)).round(4), 'hero low mean', low(lin).mean((0, 1)).round(4))


def hold(hero, fill, glow, out):
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    d = geo.graze(geo.rays(FULL[0], FULL[1]))[0]
    dx, dy, resp = drift(hero, glow)
    print('film drift px at 1920', round(dx, 2), round(dy, 2), 'response', round(resp, 3))
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC, False, (-dx, -dy))
    f = scene(fill, Image.LANCZOS, True)
    sky = np.maximum(a - g, 0).astype(np.float32)
    luma = lambda v: v @ LUMA
    cache = 'out/work/u/sky/along.npz'
    if os.path.exists(cache):
        z = np.load(cache)
        back, line, ok = z['back'], z['line'], z['ok']
    else:
        back, line, ok = along(sky)
        np.savez(cache, back=back, line=line, ok=ok)
    stars = np.maximum(sky - np.where(ok[..., None], np.maximum(back, low(sky)), low(sky)), 0)
    floor = np.minimum(sky, np.maximum(back - line, 0))
    hot = step(ndi.maximum_filter(luma(line), 5), 0.02, 0.06)[..., None]
    clean = np.maximum(sky - line, floor)
    sky = np.where(ok[..., None], clean * (1 - hot) + np.minimum(clean, np.maximum(back - line, 0)) * hot, sky)
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    own = step(d, 1.03, 1.07) * (1 - step(lg / np.maximum(la, 1e-5), 0.6, 0.85))
    moon = np.ones_like(own)
    for mx, my, mr in MOONS:
        moon *= step(np.hypot(xx - mx, yy - my), mr + 5, mr + 12)
    own = ndi.gaussian_filter(own * moon, 3)
    ring = (d > 1.1) & (d < 1.9) & (own > 0.98)
    gain = np.array([np.minimum(sky[..., i], 0.2)[ring].mean() / max(np.minimum(f[..., i], 0.2)[ring].mean(), 1e-6) for i in range(3)])
    near = (own > 0.98).astype(np.float32)
    soft = lambda v: ndi.gaussian_filter(v, 48)
    local = np.stack([soft(np.minimum(sky[..., i], 0.2) * near) / np.maximum(soft(np.minimum(f[..., i], 0.2) * near), 1e-6) for i in range(3)], -1)
    reach = (soft(near) > 0.02)[..., None] * step(d, 0.72, 1.04)[..., None]
    scale = gain * (1 - reach) + np.clip(local, gain * 0.35, gain * 2.5) * reach
    print('fill gain', gain.round(3), 'own share', float(own.mean().round(3)), 'film over hero share', float(((g - a).max(-1) > 0.004)[d > 1.03].mean().round(4)))
    rim = (step(d, RIM[0], RIM[1]) * ndi.gaussian_filter(moon, 2))[..., None]
    f = f * scale
    f = f * (1 - rim) + (low(f) + stars) * rim
    n, e1, e2 = basis()
    rays = geo.rays()
    t = -(geo.CAM @ n) / (rays @ n)
    inring = ((1 - step(np.linalg.norm(geo.CAM + rays * t[..., None], axis=-1), RING_ZONE[0], RING_ZONE[1])) * (t > 0) * RING_FILL)[..., None].astype(np.float32)
    bare = np.minimum(f, low(f)) + stars
    lin = (sky * (1 - inring) + bare * inring) * own[..., None] + f * (1 - own[..., None])
    np.save('out/work/u/sky/hold-lin.npy', lin)
    prev = Image.fromarray((geo.to_srgb(geo.film(lin)) * 255 + 0.5).astype(np.uint8))
    prev.resize((1408, 792), Image.LANCZOS).save('out/work/u/sky/sky-hold-preview.jpg', quality=90)
    Image.fromarray((np.clip(lin[450:1050, 650:1250] * 4, 0, 1) ** 0.4545 * 255).astype(np.uint8)).save('out/work/u/sky/crop-left.jpg', quality=92)
    Image.fromarray((np.clip(lin[60:560, 1100:1900] * 4, 0, 1) ** 0.4545 * 255).astype(np.uint8)).save('out/work/u/sky/crop-top.jpg', quality=92)
    Image.fromarray((np.clip(own, 0, 1) * 255).astype(np.uint8)).resize((1408, 792)).save('out/work/u/sky/own.jpg', quality=85)


if __name__ == '__main__':
    if sys.argv[1] == 'hold':
        hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[-1])
    rim(sys.argv[-2], sys.argv[-1])
