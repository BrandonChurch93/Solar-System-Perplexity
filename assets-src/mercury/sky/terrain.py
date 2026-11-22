import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter

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
TAKES = ((1, 320), (1, -320), (0, 640), (0, -640), (1, 960), (1, -960), (0, 1280), (0, -1280))
SKIP = 2
CLIP = 5.0
GRAIN = ((35, 1), (52, 1.15), (70, 1.34), (95, 1.66), (130, 1.69), (175, 1.41), (228, 0.78))
STARS = ((30, 1), (42, 0.4), (110, 0.4), (150, 0.12), (200, 0))
HALO_TOP = 56
HALO_RAMP = 24
HALO_HOLD = 0
HALO_NEAR = 8
HALO_SEAM = 7
HALO_STAR = 14.0
HALO_CALM = 30
HALO_REF = 360
HALO_FADE = 40
HALO_DOWN = 520
HALO_LOW = 24
HALO_SIZE = (2048, 128)


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
    q = 4
    wq = cv2.resize(sky.astype(np.float32), (CW // q, ROWS // q), interpolation=cv2.INTER_AREA)
    rq = cv2.resize(resid, (CW // q, ROWS // q), interpolation=cv2.INTER_AREA)
    low = cv2.GaussianBlur(rq, (0, 0), 14) / np.maximum(cv2.GaussianBlur(wq, (0, 0), 14), 1e-3)[..., None]
    low = cv2.resize(low[top // q:2 * top // q], (CW, top), interpolation=cv2.INTER_CUBIC)
    band = slice(top, 2 * top)
    clear = geo.smooth(24 * S, 90 * S, (keep - yy)[band])[..., None]
    high = np.where(sky[band][..., None], resid[band] - low, 0) * clear
    del resid
    seen = sky[top + 4]
    cols = np.arange(CW)
    edge = np.stack([np.interp(cols, cols[seen], low[4, seen, c]) for c in range(3)], -1)
    edge = cv2.GaussianBlur(edge.reshape(1, CW, 3), (0, 0), 6 * S).reshape(1, CW, 3)
    fall = np.exp(-(top - yy[:top]) / (240.0 * S))[..., None]
    src = high[::-1]
    fill = src + (1 - clear[::-1]) * src[:, ::-1]
    img[:top] = np.clip(model[:top] + edge * fall + fill, 0, 1)
    del model, high, src, fill, low
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    calm = cv2.morphologyEx(img, cv2.MORPH_OPEN, k)
    m = ((yy < keep - 3 * S) & True).astype(np.float32)
    num = cv2.GaussianBlur(calm * m[..., None], (0, 0), 6)
    den = cv2.GaussianBlur(m, (0, 0), 6)
    calm = num / np.maximum(den, 1e-3)[..., None]
    ys = np.clip(np.floor(keep - 8).astype(int), 0, ROWS - 1)
    under = calm[ys, np.arange(CW)]
    under = cv2.GaussianBlur(under.reshape(1, CW, 3), (0, 0), 20).reshape(CW, 3)
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


def calm():
    path = WORK + 'terrain-fix.npy'
    f = np.load(path)
    h, w = f.shape[:2]
    lum = f @ geo.LUMA
    tint = np.clip(cv2.GaussianBlur(f / lum[..., None], (0, 0), 40), 0.9, 1.1)
    small = cv2.resize(lum.astype(np.float32), (w // 4, h // 4), interpolation=cv2.INTER_AREA)
    codes = np.clip(small * 100 + 0.5, 0, 255).astype(np.uint8)
    flat = cv2.medianBlur(codes, 21).astype(np.float32) / 100
    flat = cv2.GaussianBlur(cv2.resize(flat, (w, h), interpolation=cv2.INTER_CUBIC), (0, 0), 8)
    np.save(path, (flat[..., None] * tint).astype(np.float32))
    print('fix calmed: luminance p1 %.3f p50 %.3f p99 %.3f' % tuple(np.percentile(flat, [1, 50, 99])))


def top(out):
    im = np.asarray(Image.open(OUT + 'full/sky-terrain.webp').convert('RGB'))
    t = MT * S
    a = im[:2 * t].astype(np.float32)
    back = cv2.GaussianBlur(cv2.medianBlur(np.ascontiguousarray(im[:2 * t]), 31).astype(np.float32), (0, 0), 2)
    fine = a - back
    lum = back @ geo.LUMA
    yy = np.arange(2 * t, dtype=np.float32)[:, None] + 0.5
    clear = geo.smooth(24 * S, 90 * S, horizon2()[None, :] - (LIFT - 0.9) * S - yy)
    w = ((1 - geo.smooth(30, 45, lum)) * clear)[t:]
    w[:SKIP] = 0
    src = fine[t:] * w[..., None]
    acc = np.zeros((t, CW, 3), np.float32)
    left = np.ones((t, CW), np.float32)
    for flip, side in TAKES:
        s, ws = np.roll(src, side * S, axis=1), np.roll(w, side * S, axis=1)
        if flip:
            s, ws = np.roll(s, -SKIP, axis=0)[::-1], np.roll(ws, -SKIP, axis=0)[::-1]
        acc += s * left[..., None]
        left *= 1 - ws
    grain = CLIP * np.tanh(acc / CLIP)
    stars = acc - grain
    lm = lum[:t]
    new = back[:t] + grain * np.interp(lm, *zip(*GRAIN))[..., None].astype(np.float32) + stars * np.interp(lm, *zip(*STARS))[..., None].astype(np.float32)
    full = im.copy()
    full[:t] = (np.clip(new, 0, 255) + 0.5).astype(np.uint8)
    print('rows below the top border changed:', int((full[t:] != im[t:]).sum()), 'margin pixels changed:', int((full[:t] != im[:t]).any(-1).sum()), 'margin without a source: %.4f' % float((left > 0.5).mean()))
    res = Image.fromarray(full)
    for n in ('full', 'web'):
        os.makedirs(out + n, exist_ok=True)
    res.save(out + 'full/sky-terrain.webp', lossless=True, method=4)
    res.save(WORK + 'terrain-top.webp', lossless=True, method=2)
    res.resize((CW // 2, CH // 2), Image.BOX).save(out + 'web/sky-terrain.webp', lossless=True, method=4)
    for n in ('full', 'web'):
        print(n, os.path.getsize(out + n + '/sky-terrain.webp') / 1e6, 'MB')


def halo(out=OUT):
    im = np.asarray(Image.open(WORK + 'terrain-top.webp').convert('RGB'))
    edge = horizon2() - LIFT * S
    ei = np.floor(edge).astype(int)
    part = (edge - ei).astype(np.float32)[None, :, None]
    whole = lambda v: np.concatenate([v[:1], v[:-1]]) * part + v * (1 - part)
    up, down = HALO_DOWN + (HALO_SEAM + 8) * S, HALO_DOWN
    kref, hold = up - HALO_TOP * S, up - HALO_HOLD
    cols = np.arange(CW)
    rows = np.clip(ei[None, :] + np.arange(-up, down)[:, None], 0, CH - 1)
    strip = im[rows, cols[None, :]]
    back = strip * (1 - part) + im[np.minimum(rows + 1, CH - 1), cols[None, :]] * part
    back = cv2.GaussianBlur(median_filter(back, size=(1, HALO_CALM * S + 1, 1), mode='nearest'), (0, 0), sigmaX=2 * S, sigmaY=0.6)
    ref = median_filter(back[kref - 4 * S:kref + 4 * S].mean(0), size=(HALO_REF * S + 1, 1), mode='nearest')
    ref = cv2.GaussianBlur(ref.reshape(1, CW, 3), (0, 0), HALO_REF * S / 6).reshape(CW, 3)
    cx, cy = (SUN[0] + ML) * S, (SUN[1] + MT) * S
    r = np.hypot(cols[None, :] + 0.5 - cx, rows + 0.5 - cy) / S
    lum = back @ geo.LUMA
    bins = np.arange(0, 2400, 8.0)
    idx = np.digitize(r[:kref], bins)
    mids, meds = [], []
    for i in range(1, len(bins)):
        sel = idx == i
        if sel.sum() > 400:
            mids.append(bins[i] - 4)
            meds.append(float(np.median(lum[:kref][sel][::5])))
    meds = np.maximum.accumulate(np.array(meds)[::-1])[::-1]
    meds = np.convolve(np.pad(meds, 4, mode='edge'), np.ones(9) / 9, mode='valid')
    prof = lambda q: np.interp(q, mids, meds)
    ratio = np.clip(prof(r[kref:]) / prof(r[kref])[None, :], 0.2, 1.0).astype(np.float32)
    ratio = cv2.GaussianBlur(ratio, (0, 0), 3 * S)
    floor = np.percentile(lum[:kref], 5)
    bg = floor + (ref[None, :, :] - floor) * ratio[..., None]
    bg = np.maximum(bg, np.minimum(ref[None, :, :], floor))
    lin = lambda v: geo.unfilm(geo.to_linear(np.clip(v, 0, 255) / 255))
    glow = np.maximum(lin(back[kref:]) - lin(bg), 0)
    free = hold - kref - HALO_NEAR * S
    glow[:free] = np.minimum.accumulate(glow[:free][::-1], axis=0)[::-1]
    glow *= geo.smooth(0, HALO_RAMP * S, np.arange(len(glow), dtype=np.float32))[:, None, None]
    glow[hold - kref:] = glow[hold - kref - 1]
    glow = cv2.GaussianBlur(glow, (0, 0), sigmaX=S, sigmaY=0.01)
    shown = whole(glow)
    calm = whole(back)
    bg = whole(bg)
    last = geo.to_srgb(geo.film(lin(calm[hold - 1]) - shown[hold - kref - 1])) * 255 - bg[hold - kref]
    last = cv2.GaussianBlur(last.reshape(1, CW, 3), (0, 0), 4 * S).reshape(CW, 3)
    bg[hold - kref:] += last[None, :, :] * np.exp(-np.arange(up + down - hold, dtype=np.float32) / (HALO_FADE * S))[:, None, None]
    seam = hold - HALO_SEAM * S
    new = strip.astype(np.float32)
    new[kref:hold] = geo.to_srgb(geo.film(lin(new[kref:hold]) - shown[:hold - kref])) * 255
    flat = geo.to_srgb(geo.film(lin(calm[seam:hold]) - shown[seam - kref:hold - kref])) * 255
    fine = strip[:seam].astype(np.float32) - calm[:seam]
    w = 1 - geo.smooth(30, 45, lum[:seam])
    w[seam - SKIP:] = 0
    src = (fine * w[..., None])[::-1]
    ws = w[::-1]
    n = up + down - seam
    acc = np.zeros((n, CW, 3), np.float32)
    left = np.ones((n, CW), np.float32)
    for flip, side in TAKES:
        a, b = np.roll(src[:n], side * S, axis=1), np.roll(ws[:n], side * S, axis=1)
        if flip:
            a, b = a[:, ::-1], b[:, ::-1]
        acc += a * left[..., None]
        left *= 1 - b
    grain = CLIP * np.tanh(acc / CLIP)
    stars = acc - grain
    under = np.concatenate([flat, bg[hold - kref:]])
    lm = under @ geo.LUMA
    under = under + grain * np.interp(lm, *zip(*GRAIN))[..., None].astype(np.float32) + stars * np.interp(lm, *zip(*STARS))[..., None].astype(np.float32)
    t = geo.smooth(0, (HALO_SEAM - 2) * S, np.arange(n, dtype=np.float32))[:, None, None]
    lit = strip[seam:hold].astype(np.float32) - calm[seam:hold]
    under[:hold - seam] += lit * geo.smooth(HALO_STAR, HALO_STAR * 1.5, lit @ geo.LUMA)[..., None]
    new[seam:] = new[seam:] * (1 - t) + under * t
    full = im.copy()
    under = (np.clip(bg[-1], 0, 255) + 0.5).astype(np.uint8)
    yy = np.arange(CH)[:, None]
    full[:] = np.where((yy >= ei[None, :] + down)[..., None], under[None, :, :], full)
    inside = (ei[None, :] + np.arange(-up, down)[:, None] >= 0) & (ei[None, :] + np.arange(-up, down)[:, None] < CH)
    sel = inside & (np.arange(up + down)[:, None] >= kref)
    full[rows[sel], np.broadcast_to(cols[None, :], rows.shape)[sel]] = (np.clip(new, 0, 255) + 0.5).astype(np.uint8)[sel]
    print('halo: rows above the band changed: %d; sky floor %.1f codes; glow at the edge, median %.4f max %.4f (scene values); fill without a source %.4f' % (int((full[:max(ei.min() - HALO_TOP * S - 1, 0)] != im[:max(ei.min() - HALO_TOP * S - 1, 0)]).sum()), floor, float(np.median(glow[-1])), float(glow[-1].max()), float((left > 0.5).mean())))
    sys.path.insert(0, 'assets-src/mercury/relief')
    u = geom.UP / np.linalg.norm(geom.UP)
    ahead = np.array([0.0, 0.0, -1.0]) + u * u[2]
    ahead /= np.linalg.norm(ahead)
    side = np.cross(ahead, u)
    dip = np.arcsin(geom.R / (geom.R + 1))
    xs = np.array([-ML + 0.5, W + ML - 0.5])
    flat = lambda d: np.arctan2(d @ side, d @ ahead)
    span = []
    for x in xs:
        best = None
        for y in np.arange(0, H, 0.5):
            d = np.array([(x - W / 2) / geom.F, (H / 2 - y) / geom.F, -1.0])
            d /= np.linalg.norm(d)
            if np.arccos(np.clip(d @ -u, -1, 1)) <= dip:
                best = d
                break
        span.append(float(flat(best)))
    az0, az1 = span[0] - 0.02, span[1] + 0.02
    el0, el1 = -HALO_LOW / geom.F, (HALO_TOP + 2) / geom.F
    tw, th = HALO_SIZE
    az = az0 + (np.arange(tw) + 0.5) / tw * (az1 - az0)
    el = el1 - (np.arange(th) + 0.5) / th * (el1 - el0)
    phi = dip + el[:, None]
    d = -u[None, None, :] * np.cos(phi)[..., None] + (ahead[None, None, :] * np.cos(az)[None, :, None] + side[None, None, :] * np.sin(az)[None, :, None]) * np.sin(phi)[..., None]
    X = ((W / 2 + geom.F * d[..., 0] / -d[..., 2]) + ML) * S - 0.5
    Y = ((H / 2 - geom.F * d[..., 1] / -d[..., 2]) + MT) * S - 0.5
    xi = np.clip(np.rint(X).astype(int), 0, CW - 1)
    k = np.clip(Y - edge[xi] + up - kref, 0, len(glow) - 1.001)
    k0 = np.floor(k).astype(int)
    t = (k - k0)[..., None]
    tex = glow[k0, xi] * (1 - t) + glow[k0 + 1, xi] * t
    tex[(X < 0) | (X > CW - 1)] = 0
    rng = np.random.default_rng(7)
    code = np.clip(geo.to_srgb(geo.film(tex)) * 255 + rng.random(tex.shape[:2])[..., None] + rng.random(tex.shape[:2])[..., None] - 0.5, 0, 255).astype(np.uint8)
    code[tex.max(-1) <= 0] = 0
    res = Image.fromarray(full)
    for name in ('full', 'web'):
        os.makedirs(out + name, exist_ok=True)
    res.save(out + 'full/sky-terrain.webp', lossless=True, method=4)
    res.resize((CW // 2, CH // 2), Image.BOX).save(out + 'web/sky-terrain.webp', lossless=True, method=4)
    Image.fromarray(code).save(out + 'full/limb-halo.png', optimize=True)
    Image.fromarray(code).resize((tw // 2, th // 2), Image.BOX).save(out + 'web/limb-halo.png', optimize=True)
    import json
    json.dump({'file': 'limb-halo.png', 'az': [az0, az1], 'el': [el0, el1]}, open('src/stops/mercury/limb.json', 'w'), indent=1)
    for name in ('full', 'web'):
        print(name, os.path.getsize(out + name + '/sky-terrain.webp') / 1e6, 'MB', 'halo', os.path.getsize(out + name + '/limb-halo.png'), 'bytes')


if __name__ == '__main__':
    if sys.argv[1] == 'base':
        base()
    elif sys.argv[1] == 'write':
        write()
    elif sys.argv[1] == 'calm':
        calm()
    elif sys.argv[1] == 'halo':
        halo(sys.argv[2] if len(sys.argv) > 2 else OUT)
    elif sys.argv[1] == 'top':
        top(sys.argv[2] if len(sys.argv) > 2 else OUT)
    else:
        fix(sys.argv[2])
