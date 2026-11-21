import json
import sys
sys.path.insert(0, 'assets-src/venus/wrap')
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
from geo import *

HUE = dict(bright=(0.5, 0.7), view=(0.1, 0.25), gain=(1.0, 1.0), soft=1.2)
RING = dict(inner=(0.26, 0.44), outer=(-0.2, -0.02), keep=0.15, wrapSigmaDeg=1.0, bak=WORK + '/r2/bak')
SPOT = json.load(open('assets-src/venus/patches/spot.json'))['spot']
N, E, U = (np.array(SPOT[k]) for k in ('direction', 'east', 'north'))
Q = [cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]


def hue_gain():
    from albedo import curve_at
    hero = cv2.imread('references/approved/venus-hero.png')[..., ::-1].astype(np.float32) / 255
    wrap = cv2.imread(RING['bak'] + '/wrap-color-full.jpg')[..., ::-1]
    lift = cv2.imread('public/assets/venus/full/wrap-flow.jpg')[..., 1]
    hh, hw = hero.shape[:2]
    ys, xs = np.mgrid[0:hh, 0:hw]
    ok, p = hit(rays(hw, hh, xs + 0.5, ys + 0.5))
    n = p / np.linalg.norm(p, axis=-1, keepdims=True)
    v = CAM[None, None] - p
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    mu = np.where(ok, (n * v).sum(-1), 0)
    lon, lat = dir_lonlat(body(n))
    h, w = wrap.shape[:2]
    mx = ((lon / 360 + 0.5) * w - 0.5).astype(np.float32)
    my = ((0.5 - lat / 180) * h - 0.5).astype(np.float32)
    st = cv2.remap(wrap, mx, my, cv2.INTER_LINEAR).astype(np.float32) / 255
    g = cv2.remap(lift, mx / 2, my / 2, cv2.INTER_LINEAR).astype(np.float32) / 255
    lin = to_linear(st)
    alb = 24 * lin ** 2 * np.exp2(np.maximum(g - 0.012, 0) * 3 * smoothstep(0.4, 0.8, lin.max(-1)))[..., None]
    shown = np.clip(encode(alb * curve_at(n @ SUN)), 0, 1)
    a, b = np.maximum(scene(shown), 1e-4), np.maximum(scene(cv2.GaussianBlur(hero, (0, 0), 0.8)), 1e-4)
    ratio = np.clip((b[..., 1:] / b[..., :1]) / (a[..., 1:] / a[..., :1]), HUE['gain'][0], HUE['gain'][1])
    m = smoothstep(HUE['bright'][0], HUE['bright'][1], shown.max(-1)) * smoothstep(HUE['view'][0], HUE['view'][1], mu) * ok
    gain = np.exp(cv2.GaussianBlur((np.log(ratio) * m[..., None]).astype(np.float32), (0, 0), HUE['soft']))
    print('hue gain: share of hero pixels over 1.1', float((gain[..., 0] > 1.1).mean()), 'most', float(gain.max()), 'least', float(gain.min()))
    cv2.imwrite(WORK + '/wrap/hue-gain.png', (np.clip((gain[..., 0] - 0.5) / 4.5, 0, 1) * 255).astype(np.uint8))
    return gain.astype(np.float32)


def view(d):
    p = world(d)
    v = CAM[None, None] - p
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    mu = (p * v).sum(-1)
    px, py = project(p)
    return mu, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32)


def weight(mu):
    return ((1 - smoothstep(RING['inner'][0], RING['inner'][1], mu)) * smoothstep(RING['outer'][0], RING['outer'][1], mu)).astype(np.float32)


def rehue(img, mu, px, py):
    g = cv2.remap(GAIN, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(1, 1))
    g = 1 + (g - 1) * smoothstep(HUE['view'][0], HUE['view'][1], mu)[..., None]
    if np.abs(g - 1).max() < 0.02:
        return img, 0.0
    alb = 24 * to_linear(img[..., ::-1].astype(np.float32) / 255) ** 2
    alb[..., 1:] *= g
    alb *= np.minimum(1, 24 / np.maximum(alb.max(-1, keepdims=True), 1e-6))
    return (to_srgb(np.sqrt(alb / 24)) * 255 + 0.5).astype(np.uint8)[..., ::-1], float((np.abs(g - 1).max(-1) > 0.1).mean())


def calm(img, w, sigma):
    a = np.maximum(img.astype(np.float32) / 255, 1 / 255)
    pad = int(sigma * 3) + 1
    wide = np.concatenate([a[:, -pad:], a, a[:, :pad]], 1)
    base = np.exp(cv2.GaussianBlur(np.log(wide), (0, 0), sigma))[:, pad:-pad]
    k = 1 - (1 - RING['keep']) * w[..., None]
    return (np.clip(base * (a / base) ** k, 0, 1) * 255 + 0.5).astype(np.uint8)


def wrap(key):
    src = cv2.imread(RING['bak'] + '/wrap-color-' + key + '.jpg')
    h, w = src.shape[:2]
    out = src.copy()
    rows = 512
    sigma = RING['wrapSigmaDeg'] * w / 360
    pad = int(sigma * 3) + 1
    total = 0.0
    hued = 0.0
    for y0 in range(0, h, rows):
        a0, a1 = max(y0 - pad, 0), min(y0 + rows + pad, h)
        ys, xs = np.mgrid[a0:a1, 0:w]
        mu, px, py = view(lonlat_dir((xs + 0.5) / w * 360 - 180, 90 - (ys + 0.5) / h * 180))
        wt = weight(mu)
        band, share = rehue(src[a0:a1], mu, px, py)
        hued += share * (a1 - a0) / h
        if wt.max() > 0:
            band = calm(band, wt, sigma)
        out[y0:y0 + rows] = band[y0 - a0:y0 - a0 + rows]
        total += float(wt[y0 - a0:y0 - a0 + rows].sum())
    cv2.imwrite('public/assets/venus/' + key + '/wrap-color.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 96] + Q)
    print('wrap', key, 'share calmed', total / (w * h), 'share rehued about', hued, 'mean change', float(np.abs(out.astype(np.float32) - src).mean()))
    return out


def patch(tag, width_deg, key):
    src = cv2.imread(RING['bak'] + '/patch-' + tag + '-' + key + '.jpg')
    n = src.shape[0]
    t = float(np.tan(np.radians(width_deg) / 2))
    a = ((np.arange(n) + 0.5) / n * 2 - 1) * t
    x, y = np.meshgrid(a, -a)
    d = N[None, None] + x[..., None] * E[None, None] + y[..., None] * U[None, None]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    mu, px, py = view(d)
    wt = weight(mu)
    res, share = rehue(src, mu, px, py)
    if wt.mean() < 1e-3 and share < 1e-6:
        print('patch', tag, key, 'untouched')
        return
    if wt.mean() >= 1e-3:
        sigma = RING['wrapSigmaDeg'] * n / width_deg * 1.3
        pad = int(sigma * 3) + 1
        b = cv2.copyMakeBorder(res, pad, pad, 0, 0, cv2.BORDER_REFLECT)
        wb = cv2.copyMakeBorder(wt, pad, pad, 0, 0, cv2.BORDER_REFLECT)
        res = calm(b, wb, sigma)[pad:-pad]
    cv2.imwrite('public/assets/venus/' + key + '/patch-' + tag + '.jpg', res, [cv2.IMWRITE_JPEG_QUALITY, 94] + Q)
    print('patch', tag, key, 'share calmed', float(wt.mean()), 'share rehued', share, 'mean change', float(np.abs(res.astype(np.float32) - src).mean()))


GAIN = hue_gain()
for key in ('full', 'web'):
    out = wrap(key)
    if key == 'full':
        cv2.imwrite(WORK + '/wrap/calm-view.jpg', cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA))
    for tag, deg in (('a', 90.0), ('b', 53.13010235), ('c', 28.07248694), ('d', 14.25003270)):
        patch(tag, deg, key)
