import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
import geom

WORK = 'out/work/mercury/relief/'
OUT = 'public/assets/mercury/'
GAIN = float(os.environ.get('RELIEF_GAIN', '2.6'))
WIDE = 300
NEAR, FARFADE = 3.5, 7.0
LIFT = 2.5
DIST_SCALE = 0.25
SPECK = (5.0, 8.0)
GLINT = 0.7
EDGE = (8.0, 10.0)
FEATHER = (320.0, 170.0, 24.0)
RIM = (16, 4, 10.0, 2.0, 160)
GLOW = (14, 2, 1024, 2048, 31, 6.0)
W, H, ML, MB, CW, CH = geom.W, geom.H, geom.ML, geom.MB, geom.CW, geom.CH


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def horizon():
    im = np.asarray(Image.open(WORK + 'ext-2816.png').convert('RGB')).astype(np.float32).mean(2)
    gy = cv2.Sobel(cv2.GaussianBlur(im, (0, 0), 1.5), cv2.CV_32F, 0, 1, ksize=3)
    model = geom.horizon_y()
    off = np.zeros(CW)
    for x in range(CW):
        y0 = int(model[x])
        a, b = max(0, y0 - 40), min(CH - 1, y0 + 40)
        off[x] = a + int(np.argmax(gy[a:b, x])) - y0
    off = cv2.medianBlur(off.astype(np.float32).reshape(1, -1), 5).ravel()
    k = 151
    med = np.array([np.median(off[max(0, i - k // 2):i + k // 2 + 1]) for i in range(CW)])
    med = cv2.GaussianBlur(med.reshape(1, -1), (0, 0), 24).ravel()
    xs = np.arange(CW)
    inside = smooth(ML - 96, ML, xs) * (1 - smooth(ML + W, ML + W + 96, xs))
    return np.maximum(med * (1 - inside), 0)


def calm(t, edge, drop):
    b = geom.FAR * (1 + edge)
    b0 = geom.FAR + geom.R * (EDGE[0] + drop[None, :]) / geom.F
    root = np.sqrt(b0 * b0 - geom.FAR ** 2)
    line = b0 - root + (1 - b0 / root) * (np.maximum(b, geom.FAR - geom.R * EDGE[1] / geom.F) - b0)
    return np.where(b < b0, line, t)


def distances(dist):
    for name, s in (('full', 1.0), ('web', 0.5)):
        dw, dh = int(int(CW * 2 * s) * DIST_SCALE), int(int(CH * 2 * s) * DIST_SCALE)
        dm = np.exp(cv2.resize(np.log(dist), (dw, dh), interpolation=cv2.INTER_AREA)).astype('<f4')
        dm.tofile(OUT + name + '/relief-dist.bin')
        print(name, 'dist', (dw, dh))


def rim(color, drop):
    lum = cv2.GaussianBlur(np.asarray(color).astype(np.float32).mean(2), (0, 0), 1.0)
    n = CW * 2
    hy2 = np.interp((np.arange(n) + 0.5) / 2, np.arange(CW) + 0.5, geom.horizon_y() + drop) * 2
    cols = np.arange(n)
    reach, half, least, sigma, _ = RIM
    rows = np.clip(np.round(hy2).astype(int)[None, :] + np.arange(-reach, reach + 1)[:, None], 2, CH * 2 - 3)
    step = lum[rows + 2, cols[None, :]] - lum[rows - 2, cols[None, :]]
    best = rows[np.argmax(step, axis=0), cols]
    seen = step.max(axis=0) > least
    near = np.clip(best[None, :] + np.arange(-half, half + 1)[:, None], 0, CH * 2 - 2)
    g = np.maximum(lum[near + 1, cols[None, :]] - lum[near, cols[None, :]], 0)
    edge = (g * (near + 1)).sum(0) / np.maximum(g.sum(0), 1e-3)
    edge = np.interp(cols, cols[seen], edge[seen]).astype(np.float32)
    edge = cv2.GaussianBlur(cv2.medianBlur(edge.reshape(1, n), 5), (0, 0), sigma).reshape(n)
    off = edge - hy2
    print('rim: seen %.4f of the columns; true edge under the model horizon, rows of %d: median %.2f p1 %.2f p99 %.2f' % (float(seen.mean()), CH * 2, float(np.median(off)), float(np.percentile(off, 1)), float(np.percentile(off, 99))))
    return edge


def bleed(color, edge):
    img = np.asarray(color).copy()
    n = img.shape[1]
    cols = np.arange(n)
    src = np.clip(np.ceil(edge).astype(int) + 3, 0, img.shape[0] - 1)
    held = img[src, cols]
    for k in range(-RIM[4], 3):
        r = np.clip(src - 3 + k, 0, img.shape[0] - 1)
        img[r, cols] = held
    return Image.fromarray(img)


def alphas(edge):
    y2 = np.arange(CH * 2)[:, None] + 0.5
    x2 = (np.arange(CW * 2)[None, :] + 0.5) / 2
    slope = np.gradient(edge)
    alpha = smooth(-1.0, 1.0, (y2 - edge[None, :]) / np.sqrt(1 + slope[None, :] ** 2))
    side, low, rim = FEATHER
    alpha = alpha * smooth(rim, side, x2) * smooth(rim, side, CW - x2) * smooth(rim, low, CH - y2 / 2)
    alpha8 = (alpha * 255 + 0.5).astype(np.uint8)
    for name, s in (('full', 1.0), ('web', 0.5)):
        cw, ch = int(CW * 2 * s), int(CH * 2 * s)
        al = Image.fromarray(alpha8)
        (al if s == 1 else al.resize((cw, ch), Image.BOX)).save(OUT + name + '/relief-alpha.png', optimize=True)
        print(name, 'alpha', (cw, ch))


def fringe(color, edge, drop, dist):
    sys.path.insert(0, 'assets-src/mercury/wrap')
    import geo
    from scipy.ndimage import median_filter
    img = np.asarray(color).astype(np.float32)
    n = CW * 2
    cols = np.arange(n)
    up, down, segs, tw, calm, soft = GLOW
    cut = np.interp((cols + 0.5) / 2, np.arange(CW) + 0.5, geom.horizon_y() + drop) * 2 - 2 * LIFT
    lin = lambda v: geo.unfilm(geo.to_linear(np.clip(v, 0, 255) / 255))
    above = np.clip(np.round(cut).astype(int)[None, :] + np.arange(-8, -2)[:, None], 0, CH * 2 - 1)
    sky = np.median(img[above, cols[None, :]], axis=0)
    sky = cv2.GaussianBlur(median_filter(sky, size=(calm, 1), mode='nearest').reshape(1, n, 3), (0, 0), soft).reshape(n, 3)
    y = (edge - up)[None, :] + np.arange(up + down, dtype=np.float32)[:, None] + 0.5
    strip = cv2.remap(img, np.broadcast_to(cols.astype(np.float32)[None, :], y.shape).copy(), (y - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    was = smooth(-1.8, 1.8, y - cut[None, :])
    now = smooth(-1.0, 1.0, y - edge[None, :])
    glow = np.maximum(lin(strip) - lin(sky)[None, :, :], 0) * was[..., None]
    free = now < 0.02
    last = np.maximum(free.shape[0] - 1 - np.argmax(free[::-1], axis=0), 0)
    glow = np.where(free[..., None], glow, glow[last, cols][None, :, :])
    glow = cv2.GaussianBlur(median_filter(glow, size=(1, 15, 1), mode='nearest'), (0, 0), sigmaX=4, sigmaY=0.01)
    small = cv2.resize(glow, (tw, up + down), interpolation=cv2.INTER_AREA)
    rng = np.random.default_rng(11)
    code = np.clip(geo.to_srgb(geo.film(small)) * 255 + rng.random(small.shape[:2])[..., None] + rng.random(small.shape[:2])[..., None] - 0.5, 0, 255).astype(np.uint8)
    code[small.max(-1) <= 0] = 0
    xs = np.arange(segs + 1) * n / segs
    ex = np.interp(xs, cols + 0.5, edge)
    ix = np.clip(xs / 2, 0, CW - 1).astype(np.float32)
    iy = np.clip((ex + 2) / 2, 0, CH - 1).astype(np.float32)
    d = cv2.remap(dist, (ix - 0.5).reshape(1, -1), (iy - 0.5).reshape(1, -1), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).ravel()
    pos = np.empty((segs + 1, 2, 3), np.float32)
    for k, off in enumerate((-up, down)):
        r = np.stack([(xs / 2 - ML - W / 2) / geom.F, (H / 2 - (ex + off) / 2) / geom.F, -np.ones_like(xs)], -1)
        pos[:, k] = r / np.linalg.norm(r, axis=-1, keepdims=True) * d[:, None]
    for name in ('full', 'web'):
        Image.fromarray(code).save(OUT + name + '/relief-rim.png', optimize=True)
        pos.astype('<f4').tofile(OUT + name + '/relief-rim.bin')
    json.dump({'file': 'relief-rim.png', 'mesh': 'relief-rim.bin', 'columns': segs + 1}, open('src/stops/mercury/rim.json', 'w'), indent=1)
    peak = code.reshape(-1, 3).max(0)
    print('fringe: sky under the cut, median code %.1f; glow rows %d, peak codes %d %d %d, median of the row above the edge %.1f %.1f %.1f' % ((float(np.median(sky)), up + down) + tuple(int(v) for v in peak) + tuple(float(v) for v in np.median(code[up - 2], axis=0))))


def only():
    d = geom.rays()
    t, _, edge = geom.ground(d)
    distances((calm(t, edge, horizon()) * np.exp(np.load(WORK + 'relief-detail.npy'))).astype(np.float32))


def lens(color, fix):
    sys.path.insert(0, 'assets-src/mercury/wrap')
    import geo
    fh, fw = fix.shape[:2]
    px, py = int(round(ML * fw / W)), int(round(MB * fh / H))
    wide = np.pad(fix, ((0, py), (px, px), (0, 0)), mode='edge')
    soft = cv2.GaussianBlur(wide, (0, 0), 30.0 * fw / 1920)
    xs = (np.arange(wide.shape[1]) + 0.5 - px) / fw
    ys = (np.arange(wide.shape[0]) + 0.5) / fh
    out = np.maximum(np.maximum(-xs, xs - 1)[None, :], (ys - 1)[:, None])
    t = smooth(0.0, 0.04, out)[..., None]
    wide = wide * (1 - t) + soft * t
    img = np.asarray(color)
    res = np.empty_like(img)
    step = 256
    for y in range(0, img.shape[0], step):
        y0, y1 = y / img.shape[0] * wide.shape[0], min(y + step, img.shape[0]) / img.shape[0] * wide.shape[0]
        rows = np.linspace(y0, y1, min(y + step, img.shape[0]) - y, endpoint=False) + 0.5 * wide.shape[0] / img.shape[0] - 0.5
        cols = (np.arange(img.shape[1]) + 0.5) * wide.shape[1] / img.shape[1] - 0.5
        mx, my = np.meshgrid(cols.astype(np.float32), rows.astype(np.float32))
        f = cv2.remap(wide, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        lin = geo.unfilm(geo.to_linear(img[y:y + step].astype(np.float32) / 255)) * f
        res[y:y + step] = (np.clip(geo.to_srgb(geo.film(lin)), 0, 1) * 255 + 0.5).astype(np.uint8)
    print('lens fix applied')
    return Image.fromarray(res)


def specks(color):
    img = np.asarray(color)
    med = cv2.medianBlur(img, 21)
    a = cv2.cvtColor(img, cv2.COLOR_RGB2YCrCb).astype(np.float32)
    m = cv2.cvtColor(med, cv2.COLOR_RGB2YCrCb).astype(np.float32)
    d = np.hypot(a[..., 1] - m[..., 1], a[..., 2] - m[..., 2])
    tint = cv2.dilate(smooth(SPECK[0], SPECK[1], d).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    n = 15
    y = a[..., 0]
    op = None
    for k in (np.ones((1, n), np.uint8), np.ones((n, 1), np.uint8), np.eye(n, dtype=np.uint8), np.eye(n, dtype=np.uint8)[::-1].copy()):
        o = cv2.morphologyEx(y, cv2.MORPH_OPEN, k)
        op = o if op is None else np.maximum(op, o)
    wc = cv2.GaussianBlur(tint, (0, 0), 1.2)
    print('specks: %.3f percent of the color' % (100 * float((tint > 0.5).mean())))
    a[..., 0] = y - wc * GLINT * (y - op)
    a[..., 1] += wc * (m[..., 1] - a[..., 1])
    a[..., 2] += wc * (m[..., 2] - a[..., 2])
    return Image.fromarray(cv2.cvtColor(np.clip(a + 0.5, 0, 255).astype(np.uint8), cv2.COLOR_YCrCb2RGB))


def main():
    drop = horizon()
    print('horizon drop in the margins, px at 2816: left max %.1f right max %.1f' % (drop[:ML].max(), drop[ML + W:].max()))
    depth = np.fromfile(WORK + 'ext-depth.raw', np.float32).reshape(CH, CW)
    d = geom.rays()
    t, hit, edge = geom.ground(d)
    yy = np.arange(CH)[:, None] + 0.5
    hy = geom.horizon_y()[None, :] + drop[None, :]
    land = hit & (yy > hy + 2)
    b = 1 / geom.FAR
    ok = land & (depth > 0.02) & (t < 0.8 * geom.FAR)
    x = np.log(depth[ok])
    y = np.log(1 / t[ok] - b)
    keep = np.ones(x.shape, bool)
    for _ in range(4):
        g, la = np.polyfit(x[keep], y[keep], 1)
        r = y - (g * x + la)
        keep = np.abs(r) < 2.0 * np.std(r[keep])
    a = float(np.exp(la))
    fit = 1 / (a * np.power(np.maximum(depth, 1e-3), g) + b)
    detail = np.where(land, np.log(fit) - np.log(t), 0).astype(np.float32)
    lt = np.log(t)
    edges = np.linspace(lt[land].min(), lt[land].max() + 1e-6, 49)
    mids, meds = [], []
    for i in range(48):
        sel = land & (lt >= edges[i]) & (lt < edges[i + 1])
        if sel.sum() > 200:
            mids.append((edges[i] + edges[i + 1]) / 2)
            meds.append(float(np.median(detail[sel])))
    detail = np.where(land, detail - np.interp(lt, mids, meds), 0).astype(np.float32)
    wt = land.astype(np.float32)
    low = cv2.GaussianBlur(detail * wt, (0, 0), WIDE) / np.maximum(cv2.GaussianBlur(wt, (0, 0), WIDE), 1e-3)
    fade = 1 - smooth(NEAR, FARFADE, t)
    relief = np.clip((detail - low) * GAIN, -0.4, 0.4) * fade * wt
    relief = cv2.GaussianBlur(relief.astype(np.float32), (0, 0), 2.0)
    dist = (calm(t, edge, drop) * np.exp(relief)).astype(np.float32)
    print('fit a %.5f g %.5f b %.5f; residual rms %.3f; relief p1 %.3f p99 %.3f' % (a, g, b, float(np.std(r[keep])), float(np.percentile(relief[land], 1)), float(np.percentile(relief[land], 99))))
    json.dump({'a': a, 'g': float(g), 'b': b, 'gain': GAIN, 'wide': WIDE}, open('assets-src/mercury/relief/depth-curve.json', 'w'), indent=1)
    np.save(WORK + 'relief-detail.npy', relief)
    vis = np.clip(0.5 + relief / 0.5, 0, 1)
    Image.fromarray((vis * 255).astype(np.uint8)).save(WORK + 'relief-detail.png')
    color = Image.open(WORK + 'ext-2x.png').convert('RGB')
    assert color.size == (CW * 2, CH * 2), color.size
    if os.path.exists(WORK + 'walls-2x.png') and os.environ.get('RELIEF_WALLS', '1') == '1':
        import walls
        color = walls.paint(color)
    color = specks(color)
    if os.path.exists(WORK + 'lens-fix.npy'):
        color = lens(color, np.load(WORK + 'lens-fix.npy'))
    edge = rim(color, drop)
    fringe(color, edge, drop, dist)
    color = bleed(color, edge)
    for name, s in (('full', 1.0), ('web', 0.5)):
        os.makedirs(OUT + name, exist_ok=True)
        cw, ch = int(CW * 2 * s), int(CH * 2 * s)
        c = color if s == 1 else color.resize((cw, ch), Image.BOX)
        c.save(OUT + name + '/relief-color.jpg', quality=93 if s == 1 else 90, subsampling=0)
        Image.new('RGB', (16, 16), (0, 0, 0)).save(OUT + name + '/relief-masks.png')
        print(name, 'color', (cw, ch))
    alphas(edge)
    distances(dist)
    dw, dh = int(CW * 2 * DIST_SCALE), int(CH * 2 * DIST_SCALE)
    out = {
        'imageSize': {'full': [W * 2, H * 2], 'web': [W, H]},
        'vfovDeg': 60,
        'box': {'full': [-ML * 2, 0, CW * 2, CH * 2], 'web': [-ML, 0, CW, CH]},
        'distSize': {'full': [dw, dh], 'web': [dw // 2, dh // 2]},
        'files': {'color': 'relief-color.jpg', 'alpha': 'relief-alpha.png', 'dist': 'relief-dist.bin', 'masks': 'relief-masks.png'},
        'camera': {'pitchDownDeg': abs(geom.FIT['pitchDownDeg']), 'rollDeg': abs(geom.FIT['rollDeg']), 'dipDeg': geom.FIT['dipDeg'], 'up': geom.FIT['up'], 'planetRadius': geom.R, 'horizonDistance': geom.FAR},
    }
    json.dump(out, open('src/stops/mercury/relief.json', 'w'), indent=1)


if __name__ == '__main__':
    if sys.argv[1:] == ['dist']:
        only()
    else:
        main()
