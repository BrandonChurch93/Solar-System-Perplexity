import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'patches'))
import patch as P

BAK = 'out/work/venus/r6/bak'
OUT = 'public/assets/venus'
WIDTH_DEG = 90.0
LOCK = 12.0
FLOOR = 0.002
EDGE = (0.72, 0.98)
FRONT = (0.3, 0.45)
CHUNK = 256
Q = [cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def main():
    wrap8 = cv2.imread(BAK + '/wrap-color-full.jpg')
    h, w = wrap8.shape[:2]
    a = to_linear(cv2.imread(OUT + '/full/patch-a.jpg').astype(np.float32) / 255).astype(np.float32)
    n = a.shape[0]
    pw = to_linear(P.to_patch(wrap8, WIDTH_DEG, n).astype(np.float32) / 255).astype(np.float32)
    blur = lambda v: cv2.GaussianBlur(v, (0, 0), LOCK)
    fine = (a * (blur(pw) + FLOOR) / (blur(a) + FLOOR)).astype(np.float32)
    print('patch a against the map through the lock, mean and p99 of 255', float(np.abs(to_srgb(fine) - to_srgb(a)).mean() * 255), float(np.percentile(np.abs(to_srgb(fine) - to_srgb(a)), 99) * 255))
    out = wrap8.copy()
    t = P.half_tan(WIDTH_DEG)
    share = 0.0
    for r0 in range(0, h // 2, CHUNK):
        rows = (np.arange(2 * r0, 2 * (r0 + CHUNK)) + 0.5) / (2 * h)
        cols = (np.arange(2 * w) + 0.5) / (2 * w)
        lat = (0.5 - rows) * np.pi
        lon = (cols - 0.5) * 2 * np.pi
        d = np.stack([np.cos(lat)[:, None] * np.sin(lon)[None, :], np.repeat(np.sin(lat)[:, None], 2 * w, 1), np.cos(lat)[:, None] * np.cos(lon)[None, :]], -1)
        dn = d @ P.N
        k = 1 / np.maximum(dn, 0.05)
        gx = (d @ P.E) * k / t
        gy = (d @ P.U) * k / t
        m = (1 - P.smooth(EDGE[0], EDGE[1], np.maximum(np.abs(gx), np.abs(gy)))) * P.smooth(FRONT[0], FRONT[1], dn)
        if m.max() <= 0:
            continue
        mx = ((gx * 0.5 + 0.5) * n - 0.5).astype(np.float32)
        my = ((0.5 - gy * 0.5) * n - 0.5).astype(np.float32)
        s = cv2.remap(fine, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        s = cv2.resize(s, (w, CHUNK), interpolation=cv2.INTER_AREA)
        m = cv2.resize(m.astype(np.float32), (w, CHUNK), interpolation=cv2.INTER_AREA)[..., None]
        base = to_linear(wrap8[r0:r0 + CHUNK].astype(np.float32) / 255)
        res = base * (1 - m) + s * m
        out[r0:r0 + CHUNK] = (to_srgb(res) * 255 + 0.5).astype(np.uint8)
        share += float(m.sum())
    print('share of the map changed', share / (w * h))
    d8 = np.abs(out.astype(np.float32) - wrap8.astype(np.float32))
    print('mean change of 255', float(d8.mean()), 'max', float(d8.max()))
    cv2.imwrite(OUT + '/full/wrap-color.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 96] + Q)
    cv2.imwrite(OUT + '/web/wrap-color.jpg', cv2.resize(out, (w // 2, h // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 96] + Q)
    low = lambda v: cv2.resize(v, (512, 256), interpolation=cv2.INTER_AREA).astype(np.float32)
    print('change at the hold base level (512 wide), mean and max of 255', float(np.abs(low(out) - low(wrap8)).mean()), float(np.abs(low(out) - low(wrap8)).max()))


main()
