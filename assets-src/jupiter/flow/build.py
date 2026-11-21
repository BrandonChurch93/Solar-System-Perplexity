import json
import sys

import cv2
import numpy as np

sys.path.insert(0, 'assets-src/jupiter/wrap')
from common import WORK, decode, save

KNOTS = 129
SEED = 20261121


def jets():
    prof = np.load(f'{WORK}/profile_coded.npy')
    lum = decode(prof[None].clip(0, 255))[0] @ np.array([0.2126, 0.7152, 0.0722])
    rows = len(lum)
    px = rows / 180
    blur = lambda a, deg: cv2.GaussianBlur(a.reshape(-1, 1).astype(np.float32), (0, 0), deg * px).ravel()
    band = blur(lum, 0.8) - blur(lum, 5.0)
    band = band / (np.percentile(np.abs(band), 90) + 1e-6)
    jet = np.tanh(band * 2.2)
    lat = 90 - (np.arange(rows) + 0.5) / rows * 180
    jet *= np.clip((62 - np.abs(lat)) / 10, 0, 1)
    knots = np.linspace(-90, 90, KNOTS)
    out = np.interp(knots, lat[::-1], jet[::-1])
    return [round(float(v), 4) for v in out]


def noise(h, w, beta, ax, ay, rng, lo=0.0):
    ky = np.fft.fftfreq(h)[:, None] * h
    kx = np.fft.rfftfreq(w)[None, :] * w
    k = np.sqrt((kx * ax) ** 2 + (ky * ay) ** 2)
    amp = np.where(k > lo, 1 / np.maximum(k, 1e-6) ** beta, 0)
    spec = amp * np.exp(2j * np.pi * rng.random(amp.shape))
    n = np.fft.irfft2(spec, s=(h, w))
    return (n / n.std()).astype(np.float32)


def warp(img, dx, dy):
    h, w = img.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    return cv2.remap(img, (xx + dx) % w, (yy + dy) % h, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def wisp(h, w):
    rng = np.random.default_rng(SEED)
    out = []
    for scale, beta in [(1.0, 1.7), (2.4, 1.45)]:
        base = noise(h, w, beta, 1.0 / scale, 0.22 / scale, rng, lo=7.0 / scale)
        pot = noise(h, w, 2.4, 0.8 / scale, 0.36 / scale, rng, lo=4.0 / scale)
        gy, gx = np.gradient(pot)
        k = 0.018 * w / scale / (np.abs(gx).max() + np.abs(gy).max())
        cx, cy = gy * k, -gx * k
        n = warp(base, cx, cy)
        ridge = 1 - 1.6 * np.abs(warp(noise(h, w, 1.6, 1.0 / scale, 0.19 / scale, rng, lo=9.0 / scale), cx * 1.4, cy * 1.4))
        v = 0.55 * n + 0.75 * np.clip(ridge, -1.2, 1) * np.clip(n * 0.45 + 0.7, 0.1, 1.2)
        v = (v - v.mean()) / v.std()
        v = np.tanh(v * 0.7)
        v -= v.mean()
        out.append(0.5 + 0.45 * v / np.abs(v).max())
    img = np.stack([out[0], out[1], np.zeros_like(out[0]) + 0.5], -1)
    return np.round(np.clip(img, 0, 1) * 255).astype(np.uint8)


if __name__ == '__main__':
    j = jets()
    json.dump({'jet': j}, open('src/stops/jupiter/flow.json', 'w'))
    full = wisp(2048, 2048)
    save('public/assets/jupiter/full/wisp.png', full)
    save('public/assets/jupiter/web/wisp.png', cv2.resize(full, (1024, 1024), interpolation=cv2.INTER_AREA))
    print('jet', min(j), max(j), 'wisp mean', full[..., 0].mean() / 255, full[..., 1].mean() / 255, 'std', full[..., 0].std() / 255)
    cv2.imwrite('out/work/view/wisp.jpg', np.hstack([full[:1024, :1024, 0], full[:1024, :1024, 1]]))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.figure(figsize=(8, 3)); plt.plot(np.linspace(-90, 90, KNOTS), j); plt.grid(); plt.savefig('out/work/view/jet.png', dpi=80)
