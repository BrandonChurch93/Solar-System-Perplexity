import json
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
KNOTS = 33


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def main():
    fit_path, hero_path, wrap_path, out_path = sys.argv[1:5]
    mask = json.loads(sys.argv[5]) if len(sys.argv) > 5 else []
    fit = json.load(open(fit_path))
    hero = np.asarray(Image.open(hero_path).convert('RGB')).astype(np.float32) / 255
    wrap = np.asarray(Image.open(wrap_path).convert('RGB')).astype(np.float32) / 255
    h, w, _ = hero.shape
    wh, ww, _ = wrap.shape
    step = 3
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    ys, xs = np.mgrid[0:h:step, 0:w:step]
    d = np.stack([(2 * (xs + 0.5) / w - 1) * th * w / h, (1 - 2 * (ys + 0.5) / h) * th, -np.ones(xs.shape)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    cam = np.array(fit['camera']['position'])
    b = -(d @ cam)
    disc = b * b - (cam @ cam - 1)
    hit = disc > 0
    p = cam + d * (b - np.sqrt(np.maximum(disc, 0)))[..., None]
    sun = np.array(fit['sunDir'])
    sun /= np.linalg.norm(sun)
    ndl = p @ sun
    mu = -(p * d).sum(-1)
    x, y, z, q = fit['globe']['quaternion']
    r = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * q), 2 * (x * z + y * q)], [2 * (x * y + z * q), 1 - 2 * (x * x + z * z), 2 * (y * z - x * q)], [2 * (x * z - y * q), 2 * (y * z + x * q), 1 - 2 * (x * x + y * y)]])
    pb = p @ r
    lon = np.arctan2(pb[..., 0], pb[..., 2])
    lat = np.arcsin(np.clip(pb[..., 1], -1, 1))
    u = ((lon / (2 * np.pi) + 0.5) * ww).astype(int) % ww
    v = np.clip(((0.5 - lat / np.pi) * wh).astype(int), 0, wh - 1)
    albedo = inverse_filmic(srgb_to_linear(wrap[v, u]))
    seen = inverse_filmic(srgb_to_linear(hero[::step, ::step]))
    use = hit & (mu > 0.45)
    for cx, cy, cr in mask:
        use &= (xs - cx) ** 2 + (ys - cy) ** 2 > cr * cr
    ratio = seen / np.maximum(albedo, 1e-3)
    knots = np.linspace(-1, 1, KNOTS)
    curve = np.full((KNOTS, 3), np.nan)
    half = 1.5 / (KNOTS - 1)
    for i, k in enumerate(knots):
        s = use & (np.abs(ndl - k) < half)
        if s.sum() >= 400:
            curve[i] = np.median(ratio[s], axis=0)
    good = np.where(~np.isnan(curve[:, 0]))[0]
    for c in range(3):
        curve[:, c] = np.interp(np.arange(KNOTS), good, curve[good, c])
        curve[:, c] = np.maximum.accumulate(curve[:, c])
        sm = curve[:, c].copy()
        sm[1:-1] = 0.25 * curve[:-2, c] + 0.5 * curve[1:-1, c] + 0.25 * curve[2:, c]
        curve[:, c] = sm
    top = good[-1]
    lum = curve @ np.array([0.2126, 0.7152, 0.0722])
    tint = curve[top - 2] / lum[top - 2]
    for i in range(top - 1, KNOTS):
        curve[i] = tint * max(lum[min(i, top)], lum[top - 2])
    json.dump({'knots': KNOTS, 'from': -1, 'to': 1, 'curve': [[round(float(x), 4) for x in row] for row in curve], 'samples': int(use.sum())}, open(out_path, 'w'))
    for k, row in zip(knots, curve):
        print(f'{k:+.3f}  {row[0]:.3f} {row[1]:.3f} {row[2]:.3f}')


main()
