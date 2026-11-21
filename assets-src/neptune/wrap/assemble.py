import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.dirname(__file__))
import geo
import separate

Image.MAX_IMAGE_PIXELS = None
W, H = 8192, 4096
PX = W / 360.0
WORK = os.path.join(geo.ROOT, 'out/work/nep/wrap')
GEN = os.path.join(geo.ROOT, 'out/work/nep/gen')
OUT = os.path.join(geo.ROOT, 'public/assets/neptune')
CODE = 0.5
CLOUD_HEIGHT = 0.004
MID_W, MID_H = 160.0, 90.0
CAP_R = 55.0
DECK_MID = [('deck-m0-t1', 60.0), ('deck-m1b-t1', 180.0), ('deck-m2-t1', 300.0)]
DECK_CAPS = {'n': 'deck-n-t1', 's': 'deck-s-t1'}
CIRRUS = [
    ('cir-m3-t1', 118.0, -22.0, 112.0, False, 1.0), ('cir-m4-t1', 205.0, -24.0, 112.0, False, 1.0), ('cir-m5-t1', 292.0, -20.0, 112.0, True, 1.0),
    ('cir-m5-t1', 100.0, 24.0, 112.0, False, 1.0), ('cir-m3-t1', 190.0, 22.0, 112.0, True, 1.0), ('cir-m4-t1', 282.0, 26.0, 112.0, True, 1.0),
    ('cir-m1-t1', 150.0, 2.0, 84.0, False, 0.8), ('cir-m2-t1', 250.0, -2.0, 84.0, True, 0.8), ('cir-m0-t1', 20.0, 30.0, 84.0, False, 0.8),
]
CIRRUS_CAPS = {'n': ('cir-n-t1', 34.0, 0.7), 's': ('cir-s-t1', 34.0, 0.7)}


def read(name):
    return cv2.imread(os.path.join(GEN, name + '.png'), cv2.IMREAD_COLOR)[..., ::-1]


def lowpass(t, sx, sy, wrap=False):
    k = 8
    h, w = t.shape[:2]
    small = cv2.resize(t, (max(w // k, 4), max(h // k, 4)), interpolation=cv2.INTER_AREA)
    if wrap:
        pad = small.shape[1] // 2
        small = np.concatenate([small[:, -pad:], small, small[:, :pad]], 1)
    small = cv2.GaussianBlur(small, (0, 0), sx / k, sigmaY=sy / k, borderType=cv2.BORDER_REFLECT)
    if wrap:
        small = small[:, pad:-pad]
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)


def detail(t, wrap=False):
    lo = lowpass(t, 12 * PX, 2.5 * PX, wrap)
    return np.log(np.maximum(t, 1e-4) / np.maximum(lo, 1e-4))


def zonal(layers):
    deck, weight = layers['deck'], layers['weight']
    x0, y0, x1, y1 = [int(v) for v in layers['window']]
    z = np.full((H, 3), np.nan, np.float32)
    for y in range(deck.shape[0]):
        m = weight[y] > 0.7
        if m.sum() > 400:
            z[y0 + y] = np.median(deck[y][m], 0)
    ok = ~np.isnan(z[:, 0])
    ys = np.where(ok)[0]
    top, bottom = ys.min(), ys.max()
    edge = int(5 * PX)
    z[:top] = np.nanmean(z[top:top + edge], 0)
    z[bottom + 1:] = np.nanmean(z[bottom - edge:bottom + 1], 0)
    for c in range(3):
        z[:, c] = np.interp(np.arange(H), np.where(~np.isnan(z[:, c]))[0], z[~np.isnan(z[:, c]), c])
    z = np.stack([np.convolve(np.pad(z[:, c], 200, mode='edge'), gauss(1.2 * PX, 200), 'valid') for c in range(3)], 1)
    lat = 90 - (np.arange(H) + 0.5) / H * 180
    south = separate.smoothstep(-50, -80, lat)[:, None]
    z = z * (1 - 0.25 * south) 
    return z.astype(np.float32), (top, bottom)


def gauss(sigma, half):
    x = np.arange(-half, half + 1)
    g = np.exp(-x * x / (2 * sigma * sigma))
    return g / g.sum()


def hero_stats(layers):
    deck, weight = layers['deck'], layers['weight']
    d = detail(np.ascontiguousarray(deck))
    m = weight > 0.95
    return float(np.std(d[m][:, 2])), float(np.std(d[m][:, 0]))


def mid_tile(name):
    t = geo.decode(read(name)).astype(np.float32)
    w, h = int(round(MID_W * PX)), int(round(MID_H * PX))
    t = cv2.resize(t, (w, h), interpolation=cv2.INTER_LANCZOS4)
    return detail(np.maximum(t, 1e-4))


def cap_rows(name, north):
    img = geo.decode(read(name)).astype(np.float32)
    return polar_to_rows(img, north, CAP_R)


def polar_to_rows(img, north, radius_deg):
    size = img.shape[0]
    rows = int(round(radius_deg * PX))
    lon = ((np.arange(W) + 0.5) / W - 0.5) * 2 * np.pi
    colat = (np.arange(rows) + 0.5) / PX
    if not north:
        colat = colat[::-1]
    r = colat[:, None] / radius_deg * (size / 2)
    sgn = 1.0 if north else -1.0
    mx = (size / 2 + r * np.sin(lon)[None, :] * sgn - 0.5).astype(np.float32)
    my = (size / 2 - r * np.cos(lon)[None, :] - 0.5).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)


def matte(img, lo=0.07, hi=0.82, gamma=1.15):
    l = img.max(-1).astype(np.float32) / 255
    return np.clip((l - lo) / (hi - lo), 0, 1) ** gamma


def feather(h, w, frac=0.08, across=0.24):
    fy = separate.smoothstep(0, frac, np.minimum(np.arange(h) + 0.5, h - np.arange(h) - 0.5) / h)
    fx = separate.smoothstep(0, across, np.minimum(np.arange(w) + 0.5, w - np.arange(w) - 0.5) / w)
    return (fy[:, None] * fx[None, :]).astype(np.float32)


def paste_max(dst, src, lon_c, lat_c):
    h, w = src.shape
    x0 = int(round((lon_c / 360 + 0.5) * W - w / 2))
    y0 = int(round((0.5 - lat_c / 180) * H - h / 2))
    ya, yb = max(y0, 0), min(y0 + h, H)
    xs = (np.arange(w) + x0) % W
    block = dst[ya:yb][:, xs]
    dst[ya:yb, xs] = np.maximum(block, src[ya - y0:yb - y0])


def shell_shift(layers, height):
    x0, y0, x1, y1 = [int(v) for v in layers['window']]
    alpha, weight = layers['alpha'], layers['weight']
    out_a = np.zeros_like(alpha)
    out_w = np.zeros_like(weight)
    step = 512
    for ya in range(0, alpha.shape[0], step):
        yb = min(ya + step, alpha.shape[0])
        lon = ((np.arange(x0, x1) + 0.5) / W - 0.5) * 2 * np.pi
        lat = (0.5 - (np.arange(y0 + ya, y0 + yb) + 0.5) / H) * np.pi
        lon, lat = np.meshgrid(lon, lat)
        p = geo.lonlat_to_world(lon, lat) * (1 + height)
        d = p - geo.CAM
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        q, hit = geo.hit_sphere(d)
        facing = (p * (geo.CAM - p)).sum(-1) > 0
        ql, qb = geo.world_to_lonlat(q)
        mx = ((ql / (2 * np.pi) + 0.5) * W - 0.5 - x0).astype(np.float32)
        my = ((0.5 - qb / np.pi) * H - 0.5 - y0).astype(np.float32)
        ok = (hit & facing).astype(np.float32)
        out_a[ya:yb] = cv2.remap(alpha, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * ok
        out_w[ya:yb] = cv2.remap(weight, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * ok
    return out_a, out_w


def main():
    layers = np.load(os.path.join(WORK, 'hero-layers.npz'))
    x0, y0, x1, y1 = [int(v) for v in layers['window']]
    z, (top, bottom) = zonal(layers)
    sb, sr = hero_stats(layers)
    print('hero detail std blue %.4f red %.4f, zonal rows %d..%d' % (sb, sr, top, bottom))
    lat = 90 - (np.arange(H) + 0.5) / H * 180
    lon = (np.arange(W) + 0.5) / W * 360 - 180

    acc = np.zeros((H, W, 3), np.float32)
    q = np.zeros((H, W), np.float32)
    mh = int(round(MID_H * PX))
    my0 = (H - mh) // 2
    for name, centre in DECK_MID:
        d = mid_tile(name)
        s = float(np.std(d[..., 2]))
        g = float(np.clip(sb / s * 1.15, 0.45, 1.0))
        print(name, 'detail std %.4f gain %.3f' % (s, g))
        w = d.shape[1]
        dl = (np.arange(w) + 0.5) / PX - MID_W / 2
        wx = (1 - separate.smoothstep(MID_W / 2 - 40, MID_W / 2, np.abs(dl))).astype(np.float32)
        xs = (np.arange(w) + int(round((centre / 360 + 0.5) * W - w / 2))) % W
        acc[my0:my0 + mh, xs] += d * g * wx[None, :, None]
        q[my0:my0 + mh, xs] += (wx * wx)[None, :]
        del d
    acc[my0:my0 + mh] /= np.sqrt(np.maximum(q[my0:my0 + mh], 1e-6))[..., None]
    del q
    cap_n = int(round(CAP_R * PX))
    for key, north in (('n', True), ('s', False)):
        rows = cap_rows(DECK_CAPS[key], north)
        d = detail(np.maximum(rows, 1e-4), wrap=True)
        s = float(np.std(d[..., 2]))
        g = float(np.clip(sb / s * 1.15, 0.45, 1.0))
        print(DECK_CAPS[key], 'detail std %.4f gain %.3f' % (s, g))
        sl = slice(0, cap_n) if north else slice(H - cap_n, H)
        wc = separate.smoothstep(35, 45, np.abs(lat[sl])).astype(np.float32)[:, None, None]
        acc[sl] = ((1 - wc) * acc[sl] + wc * d * g) / np.sqrt((1 - wc) ** 2 + wc ** 2)
        del d, rows
    np.exp(acc, out=acc)
    acc *= z[:, None, :]

    alpha = np.zeros((H, W), np.float32)
    for name, lon_c, lat_c, width, flip, gain in CIRRUS:
        img = read(name)
        if flip:
            img = img[:, ::-1]
        w = int(round(width * PX))
        h = int(round(w * img.shape[0] / img.shape[1]))
        a = cv2.resize(matte(img), (w, h), interpolation=cv2.INTER_AREA if w < img.shape[1] else cv2.INTER_LANCZOS4)
        paste_max(alpha, np.clip(a, 0, 1) * feather(h, w) * gain, lon_c, lat_c)
    for key, north in (('n', True), ('s', False)):
        name, radius, gain = CIRRUS_CAPS[key]
        rows = polar_to_rows(matte(read(name)), north, radius)
        n = rows.shape[0]
        sl = slice(0, n) if north else slice(H - n, H)
        fade = separate.smoothstep(90 - radius, 90 - radius + 8, np.abs(lat[sl])).astype(np.float32)[:, None]
        alpha[sl] = np.maximum(alpha[sl], np.clip(rows, 0, 1) * fade * gain)

    ha, hw = shell_shift(layers, CLOUD_HEIGHT)
    wd = layers['weight'][..., None]
    acc[y0:y1, x0:x1] = acc[y0:y1, x0:x1] * (1 - wd) + layers['deck'] * wd
    alpha[y0:y1, x0:x1] = alpha[y0:y1, x0:x1] * (1 - hw) + ha * hw

    rgb = (geo.linear_to_srgb(np.clip(acc * CODE, 0, 1)) * 255 + 0.5).astype(np.uint8)
    a8 = (np.clip(alpha, 0, 1) * 255 + 0.5).astype(np.uint8)
    rgba = np.dstack([rgb, a8])
    full = Image.fromarray(rgba, 'RGBA')
    full.save(os.path.join(OUT, 'full/wrap.webp'), quality=92, method=4, exact=True)
    web = Image.fromarray(cv2.resize(rgba, (W // 2, H // 2), interpolation=cv2.INTER_AREA), 'RGBA')
    web.save(os.path.join(OUT, 'web/wrap.webp'), quality=88, method=4, exact=True)
    np.save(os.path.join(WORK, 'zonal.npy'), z)
    white = np.array([0.30, 0.39, 1.0]) * 2.4
    comp = acc * (1 - alpha[..., None]) + alpha[..., None] * white
    prev = geo.encode(cv2.resize(comp, (2048, 1024), interpolation=cv2.INTER_AREA) * 0.8)
    cv2.imwrite(os.path.join(WORK, 'wrap-preview.jpg'), prev[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 88])
    for f in ('full/wrap.webp', 'web/wrap.webp'):
        print(f, os.path.getsize(os.path.join(OUT, f)) / 1e6, 'MB')


if __name__ == '__main__':
    main()
