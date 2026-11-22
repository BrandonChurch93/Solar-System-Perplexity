import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'patches'))
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))
import cap as C
import geo
import patch as P

BAK = 'out/work/venus/r6/bak'
OUT = 'public/assets/venus'
WIDTH_DEG = 90.0
LOCK = 12.0
FLOOR = 0.002
EDGE = (0.72, 0.98)
FRONT = (0.3, 0.45)
HERO = (0.2, 0.42)
PICK = 32.0
REACH = 1.2
FIRST = 1.5
HELD = 512
GAIN = 0.3
CAP = 2.5
SPECK = 0.6
HELD_PASSES = 3
CHUNK = 256
Q = [cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
LUMA = np.array([0.114, 0.587, 0.299], np.float32)


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def locked(img8, canvas8):
    a = to_linear(img8.astype(np.float32) / 255).astype(np.float32)
    pw = to_linear(canvas8.astype(np.float32) / 255).astype(np.float32)
    blur = lambda v: cv2.GaussianBlur(v, (0, 0), LOCK)
    return (a * (blur(pw) + FLOOR) / (blur(a) + FLOOR)).astype(np.float32)


def main(names):
    wrap8 = cv2.imread(BAK + '/wrap-color-full.jpg')
    h, w = wrap8.shape[:2]
    a8 = cv2.imread(OUT + '/full/patch-a.jpg')
    n = a8.shape[0]
    layers = [(locked(a8, P.to_patch(wrap8, WIDTH_DEG, n)), (P.N, P.E, P.U), False)]
    for name in names:
        img = cv2.imread(f'{C.WORK}/{name}-4096.png')
        layers.append((locked(img, C.project(wrap8, name, n)), C.basis(*C.CANVASES[name]), True))
    view = geo.R.T @ (geo.CAM / np.linalg.norm(geo.CAM))
    clean = to_linear(wrap8.astype(np.float32) / 255).astype(np.float32)
    calm = cv2.medianBlur(wrap8, 5)
    speck = (wrap8.astype(np.float32) @ LUMA) < SPECK * (calm.astype(np.float32) @ LUMA)
    clean[speck] = to_linear(calm[speck].astype(np.float32) / 255)
    print('dark specks of the map closed', int(speck.sum()))
    del calm
    out = wrap8.copy()
    t = P.half_tan(WIDTH_DEG)
    share = 0.0
    for r0 in range(0, h // 2, CHUNK):
        rows = (np.arange(2 * r0, 2 * (r0 + CHUNK)) + 0.5) / (2 * h)
        cols = (np.arange(2 * w) + 0.5) / (2 * w)
        lat = (0.5 - rows) * np.pi
        lon = (cols - 0.5) * 2 * np.pi
        d = np.stack([np.cos(lat)[:, None] * np.sin(lon)[None, :], np.repeat(np.sin(lat)[:, None], 2 * w, 1), np.cos(lat)[:, None] * np.cos(lon)[None, :]], -1)
        hero = P.smooth(HERO[0], HERO[1], d @ view)
        keep = np.ones(d.shape[:2], np.float32)
        total = np.zeros(d.shape[:2], np.float64)
        acc = np.zeros(d.shape, np.float64)
        for fine, (bn, be, bu), inside in layers:
            dn = d @ bn
            k = 1 / np.maximum(dn, 0.05)
            gx = (d @ be) * k / t
            gy = (d @ bu) * k / t
            m = ((1 - P.smooth(EDGE[0], EDGE[1], np.maximum(np.abs(gx), np.abs(gy)))) * P.smooth(FRONT[0], FRONT[1], dn)).astype(np.float32)
            if inside:
                m = (m * hero).astype(np.float32)
            if m.max() <= 0:
                continue
            mx = ((gx * 0.5 + 0.5) * n - 0.5).astype(np.float32)
            my = ((0.5 - gy * 0.5) * n - 0.5).astype(np.float32)
            s = cv2.remap(fine, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            p = (m.astype(np.float64) * (REACH - np.minimum(np.maximum(np.abs(gx), np.abs(gy)), 1)) * (1 if inside else FIRST)) ** PICK
            acc += s * p[..., None]
            total += p
            keep *= 1 - m
        if total.max() <= 0:
            continue
        s = (acc / np.maximum(total, 1e-300)[..., None]).astype(np.float32)
        m = 1 - keep
        s = cv2.resize(s, (w, CHUNK), interpolation=cv2.INTER_AREA)
        m = cv2.resize(m, (w, CHUNK), interpolation=cv2.INTER_AREA)[..., None]
        base = clean[r0:r0 + CHUNK]
        step = np.clip((s + FLOOR) / (base + FLOOR), 1 / CAP, CAP) ** GAIN
        res = base * (1 - m) + ((base + FLOOR) * step - FLOOR) * m
        out[r0:r0 + CHUNK] = (to_srgb(res) * 255 + 0.5).astype(np.uint8)
        share += float(m.sum())
    print('share of the map changed', share / (w * h))
    lin = to_linear(out.astype(np.float32) / 255).astype(np.float32)
    was = to_linear(wrap8.astype(np.float32) / 255).astype(np.float32)
    low = lambda v: cv2.resize(v, (HELD, HELD * h // w), interpolation=cv2.INTER_AREA)
    goal = low(was)
    del was
    for _ in range(HELD_PASSES):
        ratio = (goal + FLOOR) / (low(lin) + FLOOR)
        wide = cv2.copyMakeBorder(ratio, 1, 1, 1, 1, cv2.BORDER_REPLICATE)
        wide[:, 0] = wide[:, -2]
        wide[:, -1] = wide[:, 1]
        step = w // HELD
        up = cv2.resize(wide, ((HELD + 2) * step, (HELD * h // w + 2) * step), interpolation=cv2.INTER_LINEAR)[step:-step, step:-step]
        lin *= up
    print('held level (%d wide) against the map before, linear light, rms of the ratio minus one' % HELD, float(np.sqrt((((low(lin) + FLOOR) / (goal + FLOOR) - 1) ** 2).mean())))
    out = (to_srgb(lin) * 255 + 0.5).astype(np.uint8)
    del lin
    d8 = np.abs(out.astype(np.float32) - wrap8.astype(np.float32))
    print('mean change of 255', float(d8.mean()), 'max', float(d8.max()))
    cv2.imwrite(OUT + '/full/wrap-color.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 96] + Q)
    cv2.imwrite(OUT + '/web/wrap-color.jpg', cv2.resize(out, (w // 2, h // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 96] + Q)
    low8 = lambda v: cv2.resize(v, (512, 256), interpolation=cv2.INTER_AREA).astype(np.float32)
    print('change at the hold base level (512 wide), mean and max of 255', float(np.abs(low8(out) - low8(wrap8)).mean()), float(np.abs(low8(out) - low8(wrap8)).max()))


main(sys.argv[1:])
