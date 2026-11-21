import json
import os
import sys

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.dirname(__file__))
import curves
import geo
import separate
import unproject

WORK = os.path.join(geo.ROOT, 'out/work/nep/wrap')
CLOUD_KNOTS = np.array([-1, -0.2, -0.08, -0.03, 0.0, 0.03, 0.06, 0.125, 0.19, 0.25, 0.31, 0.375, 0.44, 0.5, 0.56, 0.69, 1.0])
CLOUD_VALUES = np.array([0.02, 0.02, 0.025, 0.095, 0.08, 0.085, 0.165, 0.40, 0.92, 1.58, 2.1, 2.5, 2.9, 3.1, 3.4, 3.75, 4.0])
TINT_KNOTS = np.array([-1, -0.03, 0.015, 0.06, 0.105, 0.14, 0.18, 0.225, 0.3, 0.6, 1.0])
TINT = np.array([[0.9, 0.97, 1], [0.9, 0.97, 1], [0.68, 0.83, 1], [0.68, 0.83, 1], [0.62, 0.75, 1], [0.52, 0.66, 1], [0.48, 0.62, 1], [0.36, 0.49, 1], [0.30, 0.43, 1], [0.30, 0.48, 1], [0.30, 0.50, 1]])
CURVE = os.path.join(geo.ROOT, 'src/stops/neptune/curve.json')
FIT = np.array([0.5, 0.5, 0.0], np.float32)


def cloud_curve():
    k = np.linspace(-1, 1, 33)
    level = np.interp(k, CLOUD_KNOTS, CLOUD_VALUES)
    return np.stack([level * np.interp(k, TINT_KNOTS, TINT[:, c]) for c in range(3)], -1)


def shade_of(ndl, deck):
    x = np.clip(ndl * 0.5 + 0.5, 0, 1) * 32
    return np.stack([np.interp(x, np.arange(33), deck[:, c]) for c in range(3)], -1).astype(np.float32)


def directional_fill(a, hole, sx=(6, 16, 40, 100, 240), ratio=5.0):
    w = (~hole).astype(np.float32)
    out = np.zeros_like(a)
    got = np.zeros(a.shape[:2], np.float32)
    for s in sx:
        k = (int(s * 3) | 1, int(s * 3 / ratio) | 1)
        den = cv2.GaussianBlur(w, k, s, sigmaY=s / ratio)
        num = cv2.GaussianBlur(a * w[..., None], k, s, sigmaY=s / ratio)
        take = np.clip(den / 0.25, 0, 1) * (1 - got)
        out += num / np.maximum(den, 1e-4)[..., None] * take[..., None]
        got += take
    out += a * (1 - got)[..., None] * 0
    return out, got


def main():
    img = cv2.imread(os.path.join(WORK, 'hero-map.png'), cv2.IMREAD_COLOR)[..., ::-1]
    g = np.load(os.path.join(WORK, 'hero-map-geo.npz'))
    mu, ndl = g['mu'], g['ndl']
    cv_ = json.load(open(os.path.join(WORK, 'curves-measured.json')))
    deckc = np.array(cv_['deck'])
    shade = shade_of(ndl, deckc)
    sc = geo.decode(img).astype(np.float32)
    limb = json.load(open(os.path.join(geo.ROOT, 'src/stops/neptune/haze.json')))['limb']
    vs = limb['veilSun']
    aim = geo.SUN + np.array(limb['veilAim'])
    aim /= np.linalg.norm(aim)
    x0, y0, x1, y1 = g['window']
    q = np.zeros_like(mu)
    for ya in range(y0, y1, 256):
        yb = min(ya + 256, y1)
        lon, lat = unproject.grid(x0, ya, x1, yb)
        q[ya - y0:yb - y0] = geo.lonlat_to_world(lon, lat) @ aim
    w = limb['veilAmount'] * (1 - separate.smoothstep(limb['veilMu'][0], limb['veilMu'][1], mu)) * separate.smoothstep(vs[0], vs[1], q) ** vs[2]
    sc = np.maximum((sc - np.array(limb['veil'], np.float32) * w[..., None]) / (1 - w[..., None]), sc * 0.3).astype(np.float32)
    valid = (mu > 0.22) & (ndl > 0.06)
    seen = (mu > 0.22) & (ndl > -0.06)
    alb = np.where(seen[..., None], sc / shade, curves.A0).astype(np.float32)
    del sc
    cloud = cloud_curve()
    look = json.load(open(CURVE))
    look['cloud'] = np.round(cloud, 4).tolist()
    json.dump(look, open(CURVE, 'w'))
    wc = shade_of(ndl, cloud) / shade
    white = wc[..., 2]
    a = alb
    floor = np.stack([separate.local_floor(np.ascontiguousarray(a[..., c]), 8, 25, 25, 5) for c in range(3)], -1)
    hue = floor / np.maximum(floor[..., 2:3], 1e-4)
    p, q = separate.unmix(a, hue)
    a0 = np.clip(q / np.maximum(white, 1e-4), 0, 1)
    z = np.maximum(a0, gaussian_filter(a0, 2.5) * 1.8)
    m = separate.smoothstep(0.02, 0.10, z)
    hole = (m > 0.02) | ~valid
    fill, got = directional_fill(a, hole)
    rel = a @ separate.LUM
    lo = gaussian_filter(rel, 3.0)
    grain = np.where(hole, 0, rel / np.maximum(lo, 1e-4) - 1)
    gs = float(np.std(grain[~hole]))
    clean = cv2.boxFilter((~hole).astype(np.float32), -1, (384, 384))
    y, x = np.unravel_index(np.argmax(clean), clean.shape)
    y0, x0 = int(np.clip(y - 192, 0, a.shape[0] - 384)), int(np.clip(x - 192, 0, a.shape[1] - 384))
    t = np.clip(grain[y0:y0 + 384, x0:x0 + 384], -3 * gs, 3 * gs)
    tile = np.block([[t, t[:, ::-1]], [t[::-1], t[::-1, ::-1]]])
    tex = np.tile(tile, (a.shape[0] // 768 + 1, a.shape[1] // 768 + 1))[:a.shape[0], :a.shape[1]]
    fill = fill * (1 + tex)[..., None]
    deck = a * (1 - m[..., None]) + fill * m[..., None]
    rise = wc - deck
    alpha = np.clip((((a - deck) * rise) @ FIT) / np.maximum((rise * rise) @ FIT, 1e-6), 0, 1)
    alpha *= separate.smoothstep(0.0, 0.5, m)
    alpha = np.where(seen, alpha, 0)
    weight = separate.smoothstep(0.22, 0.42, mu) * separate.smoothstep(0.06, 0.2, ndl)
    aweight = separate.smoothstep(0.22, 0.42, mu) * separate.smoothstep(-0.06, -0.02, ndl)
    gweight = separate.smoothstep(0.08, 0.26, mu) * separate.smoothstep(-0.1, -0.04, ndl)
    np.savez(os.path.join(WORK, 'hero-layers.npz'), deck=deck.astype(np.float32), alpha=alpha.astype(np.float32), weight=weight.astype(np.float32), aweight=aweight.astype(np.float32), gweight=gweight.astype(np.float32), window=g['window'])
    comp = deck * (1 - alpha[..., None]) + alpha[..., None] * wc
    err = np.abs(geo.encode(comp * shade).astype(int) - img.astype(int))
    v = weight > 0.99
    print('recomposite err mean %.2f p99 %.0f p999 %.0f' % (err[v].mean(), np.percentile(err[v], 99), np.percentile(err[v], 99.9)))
    print('grain std', gs, 'tile from', x0, y0, 'deck median', np.median(deck[v], 0))
    show = geo.encode(deck * 0.8)
    show = np.where(weight[..., None] > 0.02, show, 30)
    row = np.concatenate([img, show, np.repeat((alpha * 255).astype(np.uint8)[..., None], 3, 2)], 1)
    cv2.imwrite(os.path.join(WORK, 'sepmap-all.jpg'), cv2.resize(row, (row.shape[1] // 6, row.shape[0] // 6), interpolation=cv2.INTER_AREA)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 88])
    x0, y0 = 1900, 2050
    crop = row[y0:y0 + 800, :]
    c3 = np.concatenate([crop[:, x0:x0 + 1100], crop[:, 4552 + x0:4552 + x0 + 1100], crop[:, 9104 + x0:9104 + x0 + 1100]], 1)
    cv2.imwrite(os.path.join(WORK, 'sepmap-storm.jpg'), cv2.resize(c3, (c3.shape[1] // 2, c3.shape[0] // 2), interpolation=cv2.INTER_AREA)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main()
