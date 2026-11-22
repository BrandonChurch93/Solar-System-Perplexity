import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
import geom
import wgeom

Image.MAX_IMAGE_PIXELS = None
WORK = 'out/work/mercury/wide/'
OUT = 'public/assets/mercury/'
MESH = 640
W, H = wgeom.W, wgeom.H
MAGENTA = np.array([255, 0, 255], np.uint8)
CAM = wgeom.CAM
GAIN = float(os.environ.get('WIDE_GAIN', '2.6'))
HP = 200
CLIP = 0.4
FADE = (4.5, 8.0)
JOIN = (6.0, 60.0)
PUSH = 0.0
LIP = 2.0
RIM = (4.0, 24.0)
ALPHA_SCALE = 0.25
FAR = (20.0, 6.0, 8.0, 14.0, 3.0)
SINK = 0.12
CROPS = ((0, 0, 2304, 1296), (1792, 0, 2304, 1296))
BORDER = (30.0, 320.0)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main_surface(scale):
    cw, ch = geom.CW * 2, geom.CH * 2
    dw, dh = cw // 4, ch // 4
    dist = np.fromfile(OUT + 'full/relief-dist.bin', '<f4').reshape(dh, dw)
    nx, ny = MESH, int(round(MESH * ch / cw))
    gx = np.arange(nx + 1) / nx
    gy = np.arange(ny + 1) / ny
    mx, my = np.meshgrid((gx * dw - 0.5).clip(0, dw - 1).astype(np.float32), (gy * dh - 0.5).clip(0, dh - 1).astype(np.float32))
    dv = cv2.remap(dist, mx, my, cv2.INTER_LINEAR)
    px = gx * geom.CW - geom.ML
    py = gy * geom.CH
    xx, yy = np.meshgrid(px, py)
    d = np.stack([(xx - geom.W / 2) / geom.F, (geom.H / 2 - yy) / geom.F, -np.ones_like(xx)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    verts = (d * dv[..., None]).astype(np.float32)
    n, m = int(round(cw * scale)), int(round(ch * scale))
    ux, uy = np.meshgrid(((np.arange(n) + 0.5) / n * nx).astype(np.float32), ((np.arange(m) + 0.5) / m * ny).astype(np.float32))
    return cv2.remap(verts, ux, uy, cv2.INTER_LINEAR)


def warp():
    scale = float(os.environ.get('WIDE_SRC', '1.0'))
    pos = main_surface(scale)
    m, n = pos.shape[:2]
    color = np.asarray(Image.open(OUT + 'full/relief-color.jpg').convert('RGB').resize((n, m), Image.LANCZOS))
    alpha = np.asarray(Image.open(OUT + 'full/relief-alpha.png').convert('L').resize((n, m), Image.BILINEAR))
    u, v, z = wgeom.project(pos.reshape(-1, 3).astype(np.float64))
    ok = (alpha.reshape(-1) > 250) & (z > 0.05) & (u >= 0) & (u < W) & (v >= 0) & (v < H)
    idx = (v[ok].astype(np.int64) * W + u[ok].astype(np.int64))
    rng = np.linalg.norm(pos.reshape(-1, 3)[ok] - wgeom.P, axis=-1).astype(np.float32)
    order = np.lexsort((-rng, idx))
    idx, rng = idx[order], rng[order]
    col = color.reshape(-1, 3)[ok][order]
    src = np.flatnonzero(ok)[order]
    out = np.zeros((H * W, 3), np.uint8)
    dist = np.zeros(H * W, np.float32)
    from_y = np.full(H * W, -1, np.float32)
    out[idx] = col
    dist[idx] = rng
    from_y[idx] = (src // n).astype(np.float32) / m
    hit = np.zeros(H * W, bool)
    hit[idx] = True
    hit = hit.reshape(H, W)
    out = out.reshape(H, W, 3)
    dist = dist.reshape(H, W)
    holes = (~hit).astype(np.uint8)
    closed = cv2.morphologyEx(hit.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
    small = closed & ~hit
    filled = cv2.inpaint(out, small.astype(np.uint8), 2, cv2.INPAINT_TELEA)
    out[small] = filled[small]
    dfill = cv2.inpaint(dist, small.astype(np.uint8), 2, cv2.INPAINT_TELEA)
    dist[small] = dfill[small]
    known = closed
    Image.fromarray(out).save(WORK + 'warp-color.png')
    np.save(WORK + 'warp-splat.npy', np.where(known, dist, 0).astype(np.float32))
    Image.fromarray((known * 255).astype(np.uint8)).save(WORK + 'warp-splat-known.png')
    exact()


def exact():
    splat = np.load(WORK + 'warp-splat.npy')
    known = np.asarray(Image.open(WORK + 'warp-splat-known.png')) > 128
    cw, ch = geom.CW * 2, geom.CH * 2
    dw, dh = cw // 4, ch // 4
    main = np.fromfile(OUT + 'full/relief-dist.bin', '<f4').reshape(dh, dw)
    nx, ny = MESH, int(round(MESH * ch / cw))
    mx, my = np.meshgrid((np.arange(nx + 1) / nx * dw - 0.5).clip(0, dw - 1).astype(np.float32), (np.arange(ny + 1) / ny * dh - 0.5).clip(0, dh - 1).astype(np.float32))
    grid = cv2.remap(main, mx, my, cv2.INTER_LINEAR)
    d = wgeom.rays().astype(np.float32)
    p0 = wgeom.P.astype(np.float32)

    def miss(s):
        x = p0 + d * s[..., None]
        z = np.minimum(x[..., 2], -1e-3)
        gx = (geom.W / 2 + geom.F * x[..., 0] / -z + geom.ML) / geom.CW * nx
        gy = (geom.H / 2 - geom.F * x[..., 1] / -z) / geom.CH * ny
        inside = (gx >= 0) & (gx <= nx) & (gy >= 0) & (gy <= ny) & (x[..., 2] < -1e-3)
        return np.linalg.norm(x, axis=-1) - cv2.remap(grid, gx.astype(np.float32), gy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), inside

    s0 = cv2.medianBlur(np.where(known, splat, 1).astype(np.float32), 5)
    s1 = s0 * 1.003
    f0, _ = miss(s0)
    for _ in range(8):
        f1, inside = miss(s1)
        slope = np.where(np.abs(f1 - f0) > 1e-7, f1 - f0, 1)
        step = np.where(np.abs(f1 - f0) > 1e-7, f1 * (s1 - s0) / slope, 0)
        step = np.clip(step, -0.05 * s1, 0.05 * s1)
        s0, f0 = s1, f1
        s1 = (s1 - step).astype(np.float32)
    f1, inside = miss(s1)
    start = cv2.medianBlur(np.where(known, splat, 1).astype(np.float32), 5)
    good = known & inside & (np.abs(f1) < 2e-3 * s1) & (np.abs(s1 / start - 1) < 0.04)
    good = cv2.morphologyEx(good.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    print('exact: known %.4f of the splat %.4f, rms miss %.5f, median change against the splat %.5f' % (good.mean(), known.mean(), float(np.sqrt(np.mean(f1[good] ** 2))), float(np.median(np.abs(s1 / start - 1)[good]))))
    dist, known = s1, good
    np.save(WORK + 'warp-dist.npy', np.where(known, dist, 0).astype(np.float32))
    Image.fromarray((known * 255).astype(np.uint8)).save(WORK + 'warp-known.png')


def prep():
    color = np.asarray(Image.open(WORK + 'warp-color.png').convert('RGB')).copy()
    known = np.asarray(Image.open(WORK + 'warp-known.png')) > 128
    known = cv2.erode(known.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    _, hit = wgeom.sphere(wgeom.P, wgeom.rays())
    color[~known] = MAGENTA
    color[~hit] = 0
    Image.fromarray(color).save(WORK + 'paint-in.jpg', quality=95, subsampling=0)
    Image.fromarray(((~known & hit) * 255).astype(np.uint8)).save(WORK + 'paint-mask.png')
    print('prep', color.shape, 'to paint %.3f' % (~known & hit).mean(), 'sky %.3f' % (~hit).mean())


def norm_blur(x, w, sigma):
    return cv2.GaussianBlur(x * w, (0, 0), sigma) / np.maximum(cv2.GaussianBlur(w, (0, 0), sigma), 1e-4)


def register(warp, take, inner):
    h, w = warp.shape[:2]
    a = cv2.resize(cv2.cvtColor(warp, cv2.COLOR_RGB2GRAY), (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    b = cv2.resize(cv2.cvtColor(take, cv2.COLOR_RGB2GRAY), (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    f = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 5, 25, 5, 7, 1.5, 0) * 2
    k = cv2.resize(inner.astype(np.float32), (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    mag = np.hypot(f[..., 0], f[..., 1])[k > 0.99]
    stats = (float(np.median(mag)), float(np.percentile(mag, 90)), float(np.percentile(mag, 99)))
    near = np.clip(cv2.GaussianBlur(k, (0, 0), 40) * 4, 0, 1)
    out = []
    for c in range(2):
        fine = norm_blur(f[..., c], k, 40)
        far = norm_blur(f[..., c], k, 400)
        out.append(cv2.resize(fine * near + far * (1 - near), (w, h), interpolation=cv2.INTER_LINEAR))
    return out[0], out[1], stats


def main_color(scale, y0, y1, dist, color):
    d = wgeom.rays(scale, y0, y1)
    x = wgeom.P + d * dist[..., None]
    z = np.minimum(x[..., 2], -1e-3)
    u = (geom.W / 2 + geom.F * x[..., 0] / -z + geom.ML) * 2 - 0.5
    v = (geom.H / 2 - geom.F * x[..., 1] / -z) * 2 - 0.5
    return cv2.remap(color, u.astype(np.float32), v.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def comp(take, take2x):
    S = 2
    warp = np.asarray(Image.open(WORK + 'warp-color.png').convert('RGB'))
    known = np.asarray(Image.open(WORK + 'warp-known.png')) > 128
    t = np.asarray(Image.open(take).convert('RGB').resize((W, H), Image.LANCZOS))
    inner = cv2.erode(known.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
    fx, fy, st = register(warp, t, inner)
    print(take, 'flow in the known part: median %.2f p90 %.2f p99 %.2f px of %d' % (st + (W,)))
    xx, yy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    fit = cv2.remap(t, xx + fx, yy + fy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    _, _, st = register(warp, fit, inner)
    print('after the fit: median %.2f p90 %.2f p99 %.2f px' % st)
    kf = inner.astype(np.float32)
    near = np.clip(cv2.GaussianBlur(kf, (0, 0), 90) * 3, 0, 1)
    gains = []
    for ch in range(3):
        gain = (norm_blur(warp[..., ch].astype(np.float32), kf, 60) + 4) / (norm_blur(fit[..., ch].astype(np.float32), kf, 60) + 4)
        print('level of the take against the known part, channel %d: median gain %.3f' % (ch, float(np.median(gain[inner]))))
        gains.append(1 + (np.clip(gain, 0.7, 1.4) - 1) * near)
    keep = cv2.GaussianBlur(cv2.erode(known.astype(np.uint8), np.ones((41, 41), np.uint8)).astype(np.float32), (0, 0), 10)
    dist = np.load(WORK + 'warp-dist.npy')
    color = np.asarray(Image.open(OUT + 'full/relief-color.jpg').convert('RGB'))
    big = np.asarray(Image.open(take2x).convert('RGB').resize((W * S, H * S), Image.LANCZOS))
    out = np.empty((H * S, W * S, 3), np.uint8)
    step = 256
    for y in range(0, H, step):
        y1 = min(y + step, H)
        rows, cols = (y1 - y) * S, W * S
        gy, gx = np.meshgrid((np.arange(rows, dtype=np.float32) + 0.5) / S + y - 0.5, (np.arange(cols, dtype=np.float32) + 0.5) / S - 0.5, indexing='ij')
        up = lambda a: cv2.remap(a, gx, gy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        X, Y = np.meshgrid(np.arange(cols, dtype=np.float32), np.arange(y * S, y1 * S, dtype=np.float32))
        tk = cv2.remap(big, X + S * up(fx), Y + S * up(fy), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
        tk *= np.stack([up(g) for g in gains], -1)
        k = up(keep)[..., None]
        dd = up(np.where(dist > 0, dist, 1).astype(np.float32))
        mc = main_color(S, y * S, y1 * S, dd, color).astype(np.float32)
        out[y * S:y1 * S] = np.clip(mc * k + tk * (1 - k) + 0.5, 0, 255).astype(np.uint8)
    del big, color
    _, hit = wgeom.sphere(wgeom.P, wgeom.rays())
    land = cv2.erode(hit.astype(np.uint8), np.ones((9, 9), np.uint8))
    small = cv2.resize(out, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    spread = cv2.inpaint(small, cv2.resize(1 - land, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST), 6, cv2.INPAINT_TELEA)
    soft = cv2.resize(cv2.GaussianBlur(land.astype(np.float32), (0, 0), 2), (W * S, H * S), interpolation=cv2.INTER_LINEAR)[..., None]
    sky = soft[..., 0] < 0.999
    spread = cv2.resize(spread, (W * S, H * S), interpolation=cv2.INTER_LINEAR)
    out[sky] = np.clip(out[sky] * soft[sky] + spread[sky] * (1 - soft[sky]) + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(WORK + 'comp-full.png')
    Image.fromarray(out).resize((W, H), Image.BOX).save(WORK + 'comp-web.png')
    print('comp', out.shape)


def band():
    d = wgeom.rays()
    c = wgeom.CENTRE - wgeom.P
    bb = d @ c
    below = (bb - float(np.sqrt(c @ c - geom.R ** 2))) / geom.R * wgeom.F
    r2 = geom.R - SINK
    below2 = (bb - float(np.sqrt(c @ c - r2 * r2))) / r2 * wgeom.F
    known = np.asarray(Image.open(WORK + 'warp-known.png')) > 128
    web = np.asarray(Image.open(WORK + 'comp-web.png').convert('RGB'))
    lum = cv2.GaussianBlur(web.astype(np.float32).mean(-1), (0, 0), 1.5)
    top = np.argmax((known | (lum > FAR[0])) & (below > -LIP), axis=0).astype(np.float32)
    top = cv2.GaussianBlur(cv2.medianBlur(top.reshape(1, W), 5).astype(np.float32), (0, 0), 2.0).reshape(W) + FAR[1]
    first = np.argmax(below2 > 0, axis=0)
    cols = np.arange(W)
    b1, b0 = below2[first, cols], below2[np.maximum(first - 1, 0), cols]
    rim = (first + 0.5 - b1 / np.maximum(b1 - b0, 1e-6)).astype(np.float32)
    return web, top, rim


def farprep():
    web, top, rim = band()
    y = np.arange(H, dtype=np.float32)[:, None] + 0.5
    miss = (y > rim[None, :] - FAR[2]) & (y < top[None, :])
    out = web.copy()
    out[y <= rim[None, :] - FAR[2] + np.zeros((1, W), np.float32)] = 0
    held = cv2.blur(web[np.clip(top.astype(int) + 3, 0, H - 1), np.arange(W)].reshape(1, W, 3), (15, 1))
    smear = out.copy()
    out[miss] = MAGENTA
    smear[miss] = np.broadcast_to(held, smear.shape)[miss]
    print('farprep: band rows median %.1f max %.1f' % (float(np.median(top - rim)), float((top - rim).max())))
    for i, (x0, y0, cw, ch) in enumerate(CROPS):
        Image.fromarray(out[y0:y0 + ch, x0:x0 + cw]).save(WORK + 'far-in-%d.jpg' % i, quality=95, subsampling=0)
        Image.fromarray(smear[y0:y0 + ch, x0:x0 + cw]).save(WORK + 'far-smear-%d.jpg' % i, quality=95, subsampling=0)


def farcomp(*takes):
    web, top, rim = band()
    y = np.arange(H, dtype=np.float32)[:, None] + 0.5
    use = 1 - smooth(0.0, FAR[3], y - top[None, :])
    soft = cv2.GaussianBlur(web, (0, 0), sigmaX=0.6, sigmaY=FAR[4] * 0.4)
    sy = np.maximum(top[None, :] + 3 + (y - rim[None, :]) * FAR[4], top[None, :] + 3) - 0.5
    sx = np.broadcast_to(np.arange(W, dtype=np.float32)[None, :], sy.shape)
    held = cv2.remap(soft, np.ascontiguousarray(sx), sy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    acc = cv2.resize(held, (W * 2, H * 2), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    del soft, held
    for i in range(0, len(takes), 2):
        x0, y0, cw, ch = CROPS[int(takes[i])]
        take = takes[i + 1]
        ref = web[y0:y0 + ch, x0:x0 + cw]
        t = np.asarray(Image.open(take).convert('RGB').resize((cw, ch), Image.LANCZOS))
        inner = (y[y0:y0 + ch] > top[None, x0:x0 + cw] + 12) & (ref.mean(-1) > FAR[0])
        fx, fy, st = register(ref, t, inner)
        sx, sy = float(np.median(fx[inner])), float(np.median(fy[inner]))
        print(take, 'flow in the ground under the band: median %.2f p90 %.2f p99 %.2f px of %d; shift used %.2f %.2f' % (st + (cw, sx, sy)))
        kf = inner.astype(np.float32)
        gains = [float(np.median(((norm_blur(ref[..., c].astype(np.float32), kf, 60) + 4) / (norm_blur(t[..., c].astype(np.float32), kf, 60) + 4))[inner])) for c in range(3)]
        print('level of the take against the ground, gains %.3f %.3f %.3f' % tuple(gains))
        big = np.asarray(Image.open(take).convert('RGB').resize((cw * 2, ch * 2), Image.LANCZOS))
        X, Y = np.meshgrid(np.arange(cw * 2, dtype=np.float32), np.arange(ch * 2, dtype=np.float32))
        tk = cv2.remap(big, X + 2 * sx, Y + 2 * sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32) * np.array(gains, np.float32)
        side = smooth(0.0, 400.0, np.minimum(np.arange(cw) + 0.5 + (0 if x0 else 1e6), cw - 0.5 - np.arange(cw) + (0 if x0 + cw < W else 1e6))).astype(np.float32)
        lit = cv2.GaussianBlur(cv2.remap(t, X[::2, ::2] / 2 + sx, Y[::2, ::2] / 2 + sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32).mean(-1), (0, 0), 1.5) > FAR[0]
        start = cv2.medianBlur(np.argmax(lit, axis=0).astype(np.float32).reshape(1, cw), 5).reshape(cw)
        print('take reaches the lowered horizon within rows: median %.1f p95 %.1f' % (float(np.median(start + y0 - rim[x0:x0 + cw])), float(np.percentile(start + y0 - rim[x0:x0 + cw], 95))))
        rows = smooth(1.0, 5.0, np.arange(ch, dtype=np.float32)[:, None] + 0.5 - start[None, :])
        wgt = cv2.resize((rows * side[None, :]).astype(np.float32), (cw * 2, ch * 2), interpolation=cv2.INTER_LINEAR)[..., None]
        part = acc[y0 * 2:(y0 + ch) * 2, x0 * 2:(x0 + cw) * 2]
        part *= 1 - wgt
        part += tk * wgt
        del big, tk
    full = np.asarray(Image.open(WORK + 'comp-full.png').convert('RGB'))
    k = cv2.resize(use.astype(np.float32), (W * 2, H * 2), interpolation=cv2.INTER_LINEAR)[..., None]
    out = np.clip(full * (1 - k) + acc * k + 0.5, 0, 255).astype(np.uint8)
    del full, acc
    small = np.asarray(Image.fromarray(out).resize((W, H), Image.BOX))
    inb = (y > rim[None, :] + 2) & (y < top[None, :])
    print('band: dark share %.4f' % float((small.mean(-1) < FAR[0])[inb].mean()))
    Image.fromarray(out).save(WORK + 'comp-far.png')
    Image.fromarray(small).save(WORK + 'comp-far-web.jpg', quality=92)


def build():
    depth = np.fromfile(WORK + 'comp-depth.raw', np.float32).reshape(H, W)
    d = wgeom.rays()
    c = wgeom.CENTRE - wgeom.P
    root = float(np.sqrt(c @ c - geom.R ** 2))
    bb = d @ c
    disc = bb * bb - root * root
    hit = (disc > 0) & (bb > 0)
    t = np.where(hit, bb - np.sqrt(np.maximum(disc, 0)), root)
    below = (bb - root) / geom.R * wgeom.F
    land = hit & (below > 6)
    b = 1 / root
    ok = land & (depth > 0.02) & (t < 0.8 * root)
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
    low = norm_blur(detail, wt, HP)
    ground = wgeom.P + d * t[..., None]
    fade = 1 - smooth(FADE[0], FADE[1], np.linalg.norm(ground, axis=-1))
    inner = np.minimum(np.minimum(np.arange(W)[None, :] + 0.5, W - 0.5 - np.arange(W)[None, :]), H - 0.5 - np.arange(H)[:, None])
    relief = np.clip((detail - low) * GAIN, -CLIP, CLIP) * fade * wt * smooth(BORDER[0], BORDER[1], inner)
    relief = cv2.GaussianBlur(relief.astype(np.float32), (0, 0), 3.0)
    known = np.asarray(Image.open(WORK + 'warp-known.png')) > 128
    dm = np.load(WORK + 'warp-dist.npy')
    inside = cv2.distanceTransform(known.astype(np.uint8), cv2.DIST_L2, 5)
    wm = smooth(JOIN[0], JOIN[1], inside).astype(np.float32)
    rr = geom.R - SINK * (1 - fade)
    gone = c @ c - rr * rr
    sunk = np.where(bb * bb > gone, bb - np.sqrt(np.maximum(bb * bb - gone, 0)), np.sqrt(np.maximum(gone, 0)))
    r2 = geom.R - SINK
    below2 = (bb - float(np.sqrt(c @ c - r2 * r2))) / r2 * wgeom.F
    dist = np.exp(np.log(np.where(known, np.maximum(dm, 1e-3), 1)) * wm + (np.log(sunk) + relief) * (1 - wm)) * (1 + PUSH * wm)
    print('fit a %.5f g %.5f b %.5f; residual rms %.3f; relief p1 %.3f p99 %.3f; main against sphere in the overlap: median %.4f' % (a, g, b, float(np.std(r[keep])), float(np.percentile(relief[land], 1)), float(np.percentile(relief[land], 99)), float(np.median((dm / t)[known & land]))))
    np.save(WORK + 'wide-relief.npy', relief)
    Image.fromarray((np.clip(0.5 + relief / 0.5, 0, 1) * 255).astype(np.uint8)).save(WORK + 'wide-relief.png')
    edge = 1 - np.maximum(smooth(RIM[1], RIM[0], np.minimum(np.arange(W)[None, :] + 0.5, W - 0.5 - np.arange(W)[None, :])), smooth(RIM[1], RIM[0], H - 0.5 - np.arange(H)[:, None]))
    alpha = smooth(-1.0, 1.0, below2 + LIP) * edge
    color = Image.open(WORK + 'comp-far.png').convert('RGB')
    assert color.size == (W * 2, H * 2), color.size
    for name, s in (('full', 1.0), ('web', 0.5)):
        cw, ch = int(W * 2 * s), int(H * 2 * s)
        (color if s == 1 else color.resize((cw, ch), Image.BOX)).save(OUT + name + '/wide-color.jpg', quality=92 if s == 1 else 90, subsampling=0)
        dw, dh = int(cw * 0.25), int(ch * 0.25)
        np.exp(cv2.resize(np.log(dist), (dw, dh), interpolation=cv2.INTER_AREA)).astype('<f4').tofile(OUT + name + '/wide-dist.bin')
        aw, ah = int(cw * ALPHA_SCALE), int(ch * ALPHA_SCALE)
        Image.fromarray((cv2.resize(alpha.astype(np.float32), (aw, ah), interpolation=cv2.INTER_AREA) * 255 + 0.5).astype(np.uint8)).save(OUT + name + '/wide-alpha.png', optimize=True)
        print(name, 'color', (cw, ch), 'dist', (dw, dh), 'alpha', (aw, ah))
    half = np.radians(CAM['pitchDeg']) / 2
    cx, cy = CAM['centre']
    out = {
        'imageSize': {'full': [W * 2, H * 2], 'web': [W, H]},
        'vfovDeg': float(np.degrees(2 * np.arctan(H / 2 / wgeom.F))),
        'box': {'full': [W - 2 * cx, H - 2 * cy, W * 2, H * 2], 'web': [W / 2 - cx, H / 2 - cy, W, H]},
        'distSize': {'full': [W // 2, H // 2], 'web': [W // 4, H // 4]},
        'files': {'color': 'wide-color.jpg', 'alpha': 'wide-alpha.png', 'dist': 'wide-dist.bin', 'masks': 'relief-masks.png'},
        'position': [float(v) for v in wgeom.P],
        'quaternion': [float(-np.sin(half)), 0.0, 0.0, float(np.cos(half))],
    }
    json.dump(out, open('src/stops/mercury/wide.json', 'w'), indent=1)


if __name__ == '__main__':
    os.makedirs(WORK, exist_ok=True)
    globals()[sys.argv[1]](*sys.argv[2:])
