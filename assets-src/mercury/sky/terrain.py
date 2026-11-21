import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
sys.path.insert(0, 'assets-src/mercury/wrap')
import build
import geo
import geom

Image.MAX_IMAGE_PIXELS = None
WORK = 'out/work/mercury/sky/'
EXT2 = 'out/work/mercury/relief/ext-2x.png'
OUT = 'public/assets/mercury/'
S = 2
ML, MT = geom.ML, 360
W, H = geom.W, geom.H
CW, CH = (W + 2 * ML) * S, (H + 2 * MT) * S
SUN = (745.0, -40.0)
LIFT = build.LIFT
ROWS = 2720


def horizon2():
    hy = geom.horizon_y() + build.horizon()
    x2 = (np.arange(CW) + 0.5) / S
    return np.interp(x2, np.arange(geom.CW) + 0.5, hy) * S + MT * S


def profile(img, sky, r):
    edges = np.concatenate([np.arange(0, 400, 2.0), 400 * np.exp(np.arange(0, 2.6, 0.01))])
    idx = np.digitize(r[sky][::3], edges)
    vals = img[sky][::3]
    mids, meds = [], []
    for i in range(1, len(edges)):
        sel = idx == i
        if sel.sum() > 40:
            mids.append(0.5 * (edges[i - 1] + edges[i]))
            meds.append(np.median(vals[sel], axis=0))
    meds = np.array(meds)
    meds = np.maximum.accumulate(meds[::-1], axis=0)[::-1]
    k = np.ones(5) / 5
    meds = np.stack([np.convolve(np.pad(meds[:, c], 2, mode='edge'), k, mode='valid') for c in range(3)], -1)
    return np.array(mids), meds


def base():
    os.makedirs(WORK, exist_ok=True)
    ext = np.asarray(Image.open(EXT2).convert('RGB').crop((0, 0, CW, ROWS - MT * S))).astype(np.float32) / 255
    img = np.zeros((ROWS, CW, 3), np.float32)
    img[MT * S:] = ext
    hy2 = horizon2()
    yy = np.arange(ROWS, dtype=np.float32)[:, None] + 0.5
    xx = np.arange(CW, dtype=np.float32)[None, :] + 0.5
    keep = hy2[None, :] - (LIFT - 0.9) * S
    sky = (yy < keep - 10 * S) & (yy > MT * S)
    cx, cy = (SUN[0] + ML) * S, (SUN[1] + MT) * S
    r = np.hypot(xx - cx, yy - cy) / S
    mids, meds = profile(img, sky, r)
    print('profile bins', len(mids), 'r', mids[0], mids[-1], 'core', meds[0])
    model = np.stack([np.interp(r, mids, meds[:, c]).astype(np.float32) for c in range(3)], -1)
    resid = np.where(sky[..., None], img - model, 0)
    top = MT * S
    src = resid[top:2 * top][::-1]
    ok = sky[top:2 * top][::-1]
    alt = src[:, ::-1]
    alt_ok = ok[:, ::-1]
    fill = np.where(ok[..., None], src, np.where(alt_ok[..., None], alt, 0))
    img[:top] = np.clip(model[:top] + fill, 0, 1)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    calm = cv2.morphologyEx(img, cv2.MORPH_OPEN, k)
    m = ((yy < keep - 3 * S) & True).astype(np.float32)
    num = cv2.GaussianBlur(calm * m[..., None], (0, 0), 6)
    den = cv2.GaussianBlur(m, (0, 0), 6)
    calm = num / np.maximum(den, 1e-3)[..., None]
    ys = np.clip(np.floor(keep - 8).astype(int), 0, ROWS - 1)
    under = calm[ys, np.arange(CW)]
    under = cv2.GaussianBlur(under.reshape(1, CW, 3), (0, 0), 8).reshape(CW, 3)
    t = geo.smooth(-8, -2, yy - keep)[..., None]
    img = img * (1 - t) + under[None, :, :] * t
    np.save(WORK + 'terrain-base.npy', img.astype(np.float16))
    np.save(WORK + 'terrain-under.npy', under.astype(np.float32))
    Image.fromarray((np.clip(img[::4, ::4], 0, 1) * 255 + 0.5).astype(np.uint8)).save(WORK + 'terrain-base-view.png')
    print('base', img.shape)


def write():
    img = np.load(WORK + 'terrain-base.npy').astype(np.float32)
    under = np.load(WORK + 'terrain-under.npy')
    fix = WORK + 'terrain-fix.npy'
    if os.path.exists(fix):
        f = np.load(fix)
        f = cv2.resize(f, (CW, CH), interpolation=cv2.INTER_CUBIC)[:ROWS]
        lin = geo.unfilm(geo.to_linear(img)) * f
        img = geo.to_srgb(geo.film(lin))
        fu = cv2.resize(np.load(fix), (CW, CH), interpolation=cv2.INTER_CUBIC)[ROWS - 1]
        under = geo.to_srgb(geo.film(geo.unfilm(geo.to_linear(under)) * fu))
        print('fix applied')
    full = np.empty((CH, CW, 3), np.uint8)
    full[:ROWS] = (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
    full[ROWS:] = (np.clip(under, 0, 1) * 255 + 0.5).astype(np.uint8)[None, :, :]
    im = Image.fromarray(full)
    im.save(OUT + 'full/sky-terrain.webp', lossless=True, method=4)
    im.resize((CW // 2, CH // 2), Image.BOX).save(OUT + 'web/sky-terrain.webp', lossless=True, method=4)
    for n in ('full', 'web'):
        print(n, os.path.getsize(OUT + n + '/sky-terrain.webp') / 1e6, 'MB')


def fix(film_path):
    film = np.asarray(Image.open(film_path).convert('RGB')).astype(np.float32) / 255
    fh, fw = film.shape[:2]
    ref = np.asarray(Image.open('out/work/mercury/close-db.png').convert('RGB')).astype(np.float32) / 255
    ref = cv2.resize(ref, (fw, fh), interpolation=cv2.INTER_AREA)
    a = geo.unfilm(geo.to_linear(ref))
    b = geo.unfilm(geo.to_linear(film))
    hy = (geom.horizon_y()[ML:ML + W] - LIFT - 4) * fh / H
    x = (np.arange(fw) + 0.5) * W / fw
    hy = np.interp(x, np.arange(W) + 0.5, hy)
    sky = ((np.arange(fh)[:, None] + 0.5) < hy[None, :]).astype(np.float32)
    s = 5.0 * fw / 1920
    num = np.stack([cv2.GaussianBlur(a[..., c] * sky, (0, 0), s) for c in range(3)], -1)
    den = np.stack([cv2.GaussianBlur(b[..., c] * sky, (0, 0), s) for c in range(3)], -1)
    ratio = np.clip((num + 2e-4) / (den + 2e-4), 0.25, 4.0)
    valid = (cv2.GaussianBlur(sky, (0, 0), s) > 0.5).astype(np.uint8)
    _, labels = cv2.distanceTransformWithLabels(1 - valid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    idx = np.zeros(labels.max() + 1, np.int64)
    flat = np.flatnonzero(valid)
    idx[labels.ravel()[flat]] = flat
    ratio = ratio.reshape(-1, 3)[idx[labels].ravel()].reshape(fh, fw, 3)
    wide = np.ones((int(round(fh * CH / (H * S))), int(round(fw * CW / (W * S))), 3), np.float32)
    oy, ox = (wide.shape[0] - fh) // 2, (wide.shape[1] - fw) // 2
    wide[oy:oy + fh, ox:ox + fw] = ratio
    wide = np.pad(ratio, ((oy, wide.shape[0] - fh - oy), (ox, wide.shape[1] - fw - ox), (0, 0)), mode='edge')
    prev = WORK + 'terrain-fix.npy'
    if os.path.exists(prev):
        wide = wide * cv2.resize(np.load(prev), (wide.shape[1], wide.shape[0]), interpolation=cv2.INTER_CUBIC)
    np.save(prev, wide.astype(np.float32))
    lum = lambda v: v @ geo.LUMA
    print('sky ratio approved/film before this fix: median %.3f p10 %.3f p90 %.3f' % tuple(np.percentile(lum(ratio)[sky > 0.5], [50, 10, 90])))


if __name__ == '__main__':
    if sys.argv[1] == 'base':
        base()
    elif sys.argv[1] == 'write':
        write()
    else:
        fix(sys.argv[2])
