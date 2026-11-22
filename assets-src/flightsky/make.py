import argparse, json, struct, sys, time
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
P = argparse.ArgumentParser()
P.add_argument('--out', default=str(ROOT / 'public/assets/shared'))
P.add_argument('--work', default='/tmp/fs')
P.add_argument('--thr', type=float, default=0.004)
P.add_argument('--extra', type=int, default=0)
P.add_argument('--blur', type=float, default=1.5)
P.add_argument('--vivid', type=float, default=1.6)
P.add_argument('--warm', type=float, default=0.5)
P.add_argument('--faint', type=float, nargs=2, default=[0.02, 0.1])
P.add_argument('--fill', type=float, nargs=3, default=[0.5, 6.0, 0.04])
P.add_argument('--checks', action='store_true')
A = P.parse_args()
CFG = json.loads((ROOT / 'config/showcase.json').read_text())
SEED = CFG['seed']
W3 = np.array([0.2, 0.5, 0.3], np.float32)


def dec(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4).astype(np.float32)


def enc(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055).astype(np.float32)


def invfilmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return ((-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))).astype(np.float32)


def filmic(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1).astype(np.float32)


def starless(im):
    m13 = cv2.medianBlur(im, 13)
    m31 = cv2.medianBlur(im, 31)
    d = (im.astype(np.int16) - m13).max(axis=2)
    big = np.clip(cv2.GaussianBlur((d > 40).astype(np.float32), (0, 0), 5) * 30, 0, 1)[..., None]
    bg = m13.astype(np.float32) * (1 - big) + m31.astype(np.float32) * big
    pad = 64
    bg = np.concatenate([bg[:, -pad:], bg, bg[:, :pad]], 1)
    bg = cv2.GaussianBlur(bg, (0, 0), A.blur)[:, pad:-pad]
    return bg


def main():
    t0 = time.time()
    src = ROOT / 'public/assets/shared/full/skyband.jpg'
    im = cv2.imread(str(src))
    H, W = im.shape[:2]
    pad = 64
    wrap = np.concatenate([im[:, -pad:], im, im[:, :pad]], 1)
    bg = starless(wrap)[:, pad:-pad]
    print('starless', round(time.time() - t0, 1), 's')
    B = invfilmic(dec(im[..., ::-1].astype(np.float32) / 255))
    Bbg = invfilmic(dec(bg[..., ::-1] / 255))
    R = B - Bbg
    Rl = np.maximum(R @ np.array([0.3, 0.5, 0.2], np.float32), 0)
    Rs = cv2.GaussianBlur(Rl, (0, 0), 0.8)
    peak = (Rs >= cv2.dilate(Rs, np.ones((3, 3), np.uint8))) & (Rs > A.thr)
    peak[:2] = False
    peak[-2:] = False
    ys, xs = np.nonzero(peak)
    Rp = np.maximum(R, 0)
    s5 = cv2.boxFilter(Rp, -1, (5, 5), normalize=False)
    s9 = cv2.boxFilter(Rp, -1, (9, 9), normalize=False)
    pk = Rs[ys, xs]
    wide = np.clip((pk - 0.15) / 0.25, 0, 1)[:, None]
    flux3 = s5[ys, xs] * (1 - wide) + s9[ys, xs] * wide
    flux = flux3 @ np.array([0.3, 0.5, 0.2], np.float32)
    own = flux3 / np.maximum(flux[:, None], 1e-9)
    under = Bbg[ys, xs] / np.maximum(Bbg[ys, xs] @ np.array([0.3, 0.5, 0.2], np.float32), 1e-9)[:, None]
    col = np.clip(1 + (own * (1 - A.warm) + under * A.warm - 1) * A.vivid, 0.05, 4)
    col /= (col @ np.array([0.3, 0.5, 0.2], np.float32))[:, None]
    gx = cv2.boxFilter(Rl * np.arange(W, dtype=np.float32)[None, :], -1, (3, 3), normalize=False)
    gy = cv2.boxFilter(Rl * np.arange(H, dtype=np.float32)[:, None], -1, (3, 3), normalize=False)
    g0 = cv2.boxFilter(Rl, -1, (3, 3), normalize=False)
    cx = np.where(g0[ys, xs] > 1e-9, gx[ys, xs] / np.maximum(g0[ys, xs], 1e-9), xs)
    cy = np.where(g0[ys, xs] > 1e-9, gy[ys, xs] / np.maximum(g0[ys, xs], 1e-9), ys)
    rng = np.random.default_rng(SEED)
    cx = np.clip(cx, xs - 1, xs + 1) + rng.uniform(-0.25, 0.25, len(xs))
    cy = np.clip(cy, ys - 1, ys + 1) + rng.uniform(-0.25, 0.25, len(xs))
    bgl = (Bbg @ np.array([0.3, 0.5, 0.2], np.float32))[ys, xs]
    print('stars', len(xs), 'flux pct', np.percentile(flux, [1, 10, 50, 90, 99, 99.9]).round(4), 'bg pct', np.percentile(bgl, [1, 50, 99]).round(4))
    if A.extra > 0:
        dens = cv2.GaussianBlur(Bbg @ np.array([0.3, 0.5, 0.2], np.float32), (0, 0), 1.0) ** 1.5
        dens[: H // 5] = 0
        dens[-H // 5:] = 0
        cdf = np.cumsum(dens.ravel().astype(np.float64))
        idx = np.searchsorted(cdf, rng.uniform(0, cdf[-1], A.extra))
        ey, ex = np.divmod(idx, W)
        lo, hi = A.faint
        ef = lo * (hi / lo) ** (rng.uniform(0, 1, A.extra) ** 2.0)
        base = Bbg[ey, ex]
        ecol = base / np.maximum(base @ np.array([0.3, 0.5, 0.2], np.float32), 1e-9)[:, None]
        tint = rng.normal(0, 0.3, (A.extra, 1)) * np.array([1.0, 0.1, -1.0], np.float32)[None, :]
        ecol = np.clip(ecol + tint, 0.05, 4)
        cx = np.concatenate([cx, ex + rng.uniform(0, 1, A.extra)])
        cy = np.concatenate([cy, ey + rng.uniform(0, 1, A.extra)])
        flux = np.concatenate([flux, ef])
        col = np.concatenate([col, ecol])
        bgl = np.concatenate([bgl, (base @ np.array([0.3, 0.5, 0.2], np.float32))])
        print('extra', A.extra)
    n = len(cx)
    u = np.clip(np.round((cx + 0.5) / W * 65536), 0, 65535).astype(np.uint16)
    v = np.clip(np.round((1 - (cy + 0.5) / H) * 65535), 0, 65535).astype(np.uint16)
    f = np.clip(np.round((np.log2(np.maximum(flux, 1e-6)) + 16) * 2048), 0, 65535).astype(np.uint16)
    c8 = np.clip(np.round(np.clip(col, 0.02, 4) * 63.75), 1, 255).astype(np.uint8)
    b8 = np.clip(np.round((np.log2(np.maximum(bgl, 1e-6)) + 16) * 16), 0, 255).astype(np.uint8)
    rec = np.zeros(n, dtype=[('u', '<u2'), ('v', '<u2'), ('f', '<u2'), ('c', 'u1', 3), ('b', 'u1')])
    rec['u'], rec['v'], rec['f'], rec['c'], rec['b'] = u, v, f, c8, b8
    order = rng.permutation(n)
    blob = struct.pack('<4sII', b'BSTR', 1, n) + rec[order].tobytes()
    pad = 64
    Rc = Rp * np.minimum(1, A.fill[2] / np.maximum(Rp @ np.array([0.3, 0.5, 0.2], np.float32), 1e-9))[..., None]
    Rw = np.concatenate([Rc[:, -pad:], Rc, Rc[:, :pad]], 1)
    fill = cv2.GaussianBlur(Rw, (0, 0), A.fill[1])[:, pad:-pad]
    s = np.sqrt(filmic(Bbg + A.fill[0] * fill))
    for name, w in (('full', 4096), ('web', 2048)):
        h = w // 4
        small = cv2.resize(s, (w, h), interpolation=cv2.INTER_AREA)
        out8 = np.clip(np.round(enc(small) * 255), 0, 255).astype(np.uint8)
        d = Path(A.out) / name
        Image.fromarray(out8).save(d / 'skybandglow.png', optimize=True)
        (d / 'skybandstars.bin').write_bytes(blob)
        back = np.asarray(Image.open(d / 'skybandglow.png')).astype(np.float32)
        print(name, 'glow', (d / 'skybandglow.png').stat().st_size, 'bytes, max err', float(np.abs(back - enc(small) * 255).max().round(2)), 'stars', len(blob), 'bytes')
    if A.checks:
        work = Path(A.work)
        work.mkdir(parents=True, exist_ok=True)
        np.save(work / 'bg.npy', bg)
        y0, x0 = 900, 2400
        a = im[y0:y0 + 300, x0:x0 + 400]
        b = np.clip(bg[y0:y0 + 300, x0:x0 + 400], 0, 255).astype(np.uint8)
        cv2.imwrite(str(work / 'starless-x3.png'), cv2.resize(np.concatenate([a, b], 1), None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC))
        cv2.imwrite(str(work / 'starless-over.jpg'), cv2.resize(np.clip(bg, 0, 255).astype(np.uint8), (1400, 350), interpolation=cv2.INTER_AREA))
    print('done', round(time.time() - t0, 1), 's')


main()
