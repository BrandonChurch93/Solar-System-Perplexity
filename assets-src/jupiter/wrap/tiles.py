import os
import sys

import cv2
import numpy as np

from common import WORK, blur, load, save, smooth

W, H = 8192, 4096
TW, TH = 3200, 1800
GW, GH = 2816, 1584
Y0 = (H - TH) // 2
TILES = {'t1': 490, 't3': 3860, 't2': 6271}
CAP_DEG = 60.0
CAP_N = 2048
STATE = f'{WORK}/far-canvas.npy'
KNOWN = f'{WORK}/far-known.npy'
GEN = f'{WORK}/gen'


def stripes():
    prof = np.load(f'{WORK}/profile_coded.npy')
    return cv2.resize(np.repeat(prof[:, None, :], 8, 1), (W, H), interpolation=cv2.INTER_LINEAR)


def init():
    col = load(f'{WORK}/eq8k-color.png').astype(np.float32)
    wgt = load(f'{WORK}/eq8k-weight.png')[..., 0].astype(np.float32) / 255
    base = stripes()
    canvas = base * (1 - wgt[..., None]) + col * wgt[..., None]
    np.save(STATE, canvas)
    np.save(KNOWN, wgt)


def xs(x0):
    return np.arange(x0, x0 + TW) % W


def cap_maps(sign):
    c = (CAP_N - 1) / 2
    py, px = np.mgrid[0:CAP_N, 0:CAP_N].astype(np.float32)
    dx, dy = (px - c) / (CAP_N / 2), (py - c) / (CAP_N / 2)
    colat = np.sqrt(dx * dx + dy * dy) * CAP_DEG
    lon = np.degrees(np.arctan2(dx, dy * sign))
    lat = sign * (90 - colat)
    mx = ((lon / 360 + 0.5) * W - 0.5) % W
    my = (0.5 - lat / 180) * H - 0.5
    return mx.astype(np.float32), np.clip(my, 0, H - 1).astype(np.float32), colat


def wrap_pad(img, pad=8):
    return np.concatenate([img[:, -pad:], img, img[:, :pad]], 1)


def prep(name):
    canvas = np.load(STATE)
    if name in TILES:
        tile = canvas[Y0:Y0 + TH][:, xs(TILES[name])]
        out = cv2.resize(tile, (GW, GH), interpolation=cv2.INTER_AREA)
    else:
        sign = 1 if name == 'n' else -1
        mx, my, _ = cap_maps(sign)
        out = cv2.remap(wrap_pad(canvas), mx + 8, my, cv2.INTER_LINEAR)
    save(f'{GEN}/{name}_in.jpg', np.round(np.clip(out, 0, 255)).astype(np.uint8), 95)
    cv2.imwrite(f'out/work/view/{name}_in.jpg', cv2.resize(out[..., ::-1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])


def lock(new, guide, amount):
    low = lambda a: cv2.GaussianBlur(a, (0, 0), sigmaX=300, sigmaY=28)
    return new - amount * (low(new) - low(guide))


def place(name, path):
    canvas = np.load(STATE)
    known = np.load(KNOWN)
    base = stripes()
    gen = load(path).astype(np.float32)
    if name in TILES:
        cx = xs(TILES[name])
        new = cv2.resize(gen, (TW, TH), interpolation=cv2.INTER_LANCZOS4)
        old = canvas[Y0:Y0 + TH][:, cx]
        kn = known[Y0:Y0 + TH][:, cx]
        new = lock(new, old, 0.85)
        ramp = np.minimum(np.arange(TW), TW - 1 - np.arange(TW)).astype(np.float32)
        add = smooth(40, 400, ramp)[None, :] * (1 - kn)
        canvas[Y0:Y0 + TH, cx] = old + (new - base[Y0:Y0 + TH][:, cx]) * add[..., None]
        known[Y0:Y0 + TH, cx] = kn + add
    else:
        sign = 1 if name == 'n' else -1
        gen = cv2.resize(gen, (CAP_N, CAP_N), interpolation=cv2.INTER_LANCZOS4)
        mx, my, cl = cap_maps(sign)
        guide = cv2.remap(wrap_pad(canvas), mx + 8, my, cv2.INTER_LINEAR)
        low = lambda a: cv2.GaussianBlur(a, (0, 0), 50)
        gen = gen - (0.85 * smooth(18, 34, cl))[..., None] * (low(gen) - low(guide))
        rows = int(H * (90 - 28) / 180)
        ys = np.arange(rows) if sign > 0 else np.arange(H - rows, H)
        lat = 90 - (ys + 0.5) / H * 180
        lon = ((np.arange(W) + 0.5) / W - 0.5) * 360
        lo, la = np.meshgrid(np.radians(lon), lat)
        colat = (90 - sign * la) / CAP_DEG
        c = (CAP_N - 1) / 2
        px = (c + colat * np.sin(lo) * CAP_N / 2).astype(np.float32)
        py = (c + sign * colat * np.cos(lo) * CAP_N / 2).astype(np.float32)
        new = cv2.remap(gen, px, py, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        old = canvas[ys]
        kn = known[ys]
        take = smooth(31.5, 37.5, np.abs(la)) * (1 - smooth(0.5, 0.98, kn))
        take = np.where(np.abs(la) > 39.5, np.maximum(take, 1 - smooth(0.5, 0.98, kn)), take)[..., None]
        canvas[ys] = new * take + old * (1 - take)
        known[ys] = np.maximum(kn, take[..., 0])
    np.save(STATE, canvas)
    np.save(KNOWN, known)
    cv2.imwrite('out/work/view/far-canvas.jpg', cv2.resize(canvas[..., ::-1], (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'init':
        init()
    elif cmd == 'prep':
        for n in sys.argv[2:]:
            prep(n)
    elif cmd == 'place':
        place(sys.argv[2], sys.argv[3])
