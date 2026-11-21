import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = ROOT + '/out/work/venus/hold'
SIZE = {'full': 1536, 'web': 768}
MARGIN = 1.016
STOPS = 4.0
INSIDE = 0.994
FLOOR = 1e-3
QUALITY = 95


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def scene(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(img)).astype(np.float32)


def hero_radius(geom, th):
    cx, cy, ra, rb = geom['hero']
    dev = np.array(geom['dev'])
    r0 = 1 / np.hypot(np.cos(th) / ra, np.sin(th) / rb)
    n = len(dev)
    f = ((th + np.pi) / (2 * np.pi) * n) % n
    i = np.floor(f).astype(int)
    return r0 + dev[i % n] * (1 - (f - i)) + dev[(i + 1) % n] * (f - i)


def film_limb(fit, w, h):
    cam = np.array(fit['camera']['position'])
    d = np.linalg.norm(cam)
    a = -cam / d
    e1 = np.cross([0.0, 1.0, 0.0], a)
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(a, e1)
    t = np.linspace(-np.pi, np.pi, 2880, endpoint=False)
    sb = 1 / d
    r = np.sqrt(1 - sb * sb) * a[None] + sb * (np.cos(t)[:, None] * e1[None] + np.sin(t)[:, None] * e2[None])
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    x = (r[:, 0] / -r[:, 2] / (th * w / h) + 1) * w / 2
    y = (1 - r[:, 1] / -r[:, 2] / th) * h / 2
    cx, cy = (x.max() + x.min()) / 2, (y.max() + y.min()) / 2
    az = np.arctan2(-(y - cy), x - cx)
    rr = np.hypot(x - cx, y - cy)
    o = np.argsort(az)
    return cx, cy, az[o], rr[o]


def grid(n, fit, w, h):
    cam = np.array(fit['camera']['position'])
    cx, cy = -cam[0] / cam[2], -cam[1] / cam[2]
    half = MARGIN / np.sqrt(cam @ cam - 1)
    j, i = np.meshgrid(np.arange(n) + 0.5, np.arange(n) + 0.5)
    tx = cx + (2 * j / n - 1) * half
    ty = cy + (1 - 2 * i / n) * half
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    return (tx / (th * w / h) + 1) * w / 2, (1 - ty / th) * h / 2


def places(n, fit, geom, w, h):
    xf, yf = grid(n, fit, w, h)
    cx, cy, az, rr = film_limb(fit, w, h)
    th = np.arctan2(-(yf - cy), xf - cx)
    rf = np.interp(th, az, rr, period=2 * np.pi)
    rho = np.hypot(xf - cx, yf - cy) / rf
    inside = np.minimum(rho, INSIDE)
    fx = cx + rf * inside * np.cos(th)
    fy = cy - rf * inside * np.sin(th)
    rh = hero_radius(geom, th)
    hx = geom['hero'][0] + rh * inside * np.cos(th)
    hy = geom['hero'][1] - rh * inside * np.sin(th)
    return (fx, fy), (hx, hy), rho


def sample(img, xy, k=1.0):
    return cv2.remap(img, (xy[0] * k - 0.5).astype(np.float32), (xy[1] * k - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def write(logq):
    np.save(WORK + '/logq.npy', logq.astype(np.float32))
    for key, n in SIZE.items():
        q = logq if n == logq.shape[0] else cv2.resize(logq, (n, n), interpolation=cv2.INTER_AREA)
        b = np.clip(np.round(128 + q * 255 / STOPS), 0, 255).astype(np.uint8)
        Image.fromarray(b).save(ROOT + '/public/assets/venus/' + key + '/hold-detail.jpg', quality=QUALITY, subsampling=0)
    print('log2 gain: mean %.3f, rms %.3f, share at the clamp %.4f' % (logq.mean(), np.sqrt((logq ** 2).mean()), (np.abs(logq) > STOPS / 2 - 0.02).mean()))


if __name__ == '__main__':
    os.makedirs(WORK, exist_ok=True)
    mode = sys.argv[1]
    n = SIZE['full']
    if mode == 'neutral':
        write(np.zeros((n, n, 3), np.float32))
        sys.exit()
    fit = json.load(open(ROOT + '/src/stops/venus/fit.json'))
    geom = json.load(open(os.path.dirname(__file__) + '/hero-disc.json'))
    film = scene(sys.argv[2])
    h, w = film.shape[:2]
    f_at, h_at, rho = places(n, fit, geom, w, h)
    hero_path = ROOT + '/references/approved/venus-hero.png'
    if mode == 'build':
        hero = scene(hero_path)
        logq = np.log2((sample(hero, h_at) + FLOOR) / (sample(film, f_at, 1.0) + FLOOR))
    elif mode == 'refine':
        gain = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
        small = cv2.resize(cv2.imread(hero_path, cv2.IMREAD_COLOR), (w, h), interpolation=cv2.INTER_AREA)[..., ::-1].astype(np.float32) / 255
        hero = inverse_filmic(srgb_to_linear(small)).astype(np.float32)
        logq = np.load(WORK + '/logq.npy') + gain * np.log2((sample(hero, h_at, w / 2816) + FLOOR) / (sample(film, f_at) + FLOOR))
    else:
        raise SystemExit('mode: neutral, build FILM, refine FILM [gain]')
    logq = np.clip(logq, -STOPS / 2, STOPS / 2) * (rho < 1.03)[..., None]
    write(logq)
