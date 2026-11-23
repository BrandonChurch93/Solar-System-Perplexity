import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
import cover
from view import Surface

WORK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'out', 'work', 'jupiter', 'deck')
W, H = 1920, 1080


def march(pos, d, surface, top, steps=260):
    oc = pos - geom.CENTRE
    b = d @ oc
    c = oc @ oc - (geom.R + top) ** 2
    disc = b * b - c
    t = np.where(disc > 0, np.maximum(-b - np.sqrt(np.maximum(disc, 0)), 0), np.inf)
    live = np.isfinite(t)
    hit = np.zeros(t.shape, bool)
    for i in range(steps):
        idx = np.nonzero(live)
        if len(idx[0]) == 0:
            break
        p = pos + d[idx] * t[idx][:, None]
        rel = p - geom.CENTRE
        h = np.linalg.norm(rel, axis=-1) - geom.R
        q = p - geom.S
        gap = h - surface.flat(q @ geom.EX, q @ geom.EY)
        done = gap < 0.0008 * t[idx]
        hit[idx] = done
        gone = h < -0.6
        step = np.maximum(gap * 0.45, 0.0015 * t[idx])
        tn = t[idx] + np.where(done, 0, step)
        t[idx] = tn
        lv = ~done & ~gone & (tn < 60)
        live[idx] = lv
    return t, hit


def measure(seconds, k=4, save=None):
    pos, rot, along, back = cover.pose(seconds)
    f = geom.F * W / geom.W0
    xs = np.arange(k / 2, W, k)
    ys = np.arange(k / 2, H, k)
    X, Y = np.meshgrid(xs, ys)
    d = np.stack([X - W / 2, -(Y - H / 2), -f * np.ones_like(X)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    d = d @ rot.T
    surface = Surface('full')
    t, hit = march(pos, d.reshape(-1, 3), surface, surface.hi)
    t = t.reshape(X.shape)
    hit = hit.reshape(X.shape)
    p = pos + d * np.where(hit, t, 1.0)[..., None]
    cx, cy = geom.project(p)
    jxx = np.gradient(cx, axis=1) / k
    jxy = np.gradient(cx, axis=0) / k
    jyx = np.gradient(cy, axis=1) / k
    jyy = np.gradient(cy, axis=0) / k
    a = jxx * jxx + jyx * jyx
    c = jxy * jxy + jyy * jyy
    b = jxx * jxy + jyx * jyy
    mean = 0.5 * (a + c)
    diff = np.sqrt(np.maximum(0.25 * (a - c) ** 2 + b * b, 0))
    s1 = np.sqrt(mean + diff)
    s2 = np.sqrt(np.maximum(mean - diff, 1e-12))
    jump = np.maximum(np.abs(np.gradient(t, axis=0)), np.abs(np.gradient(t, axis=1))) / np.maximum(t, 1e-6)
    ok = hit & (jump < 0.03) & (p[..., 2] < 0)
    ok &= cv2.erode(ok.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    long = np.where(ok, 1 / s2, np.nan)
    short = np.where(ok, 1 / s1, np.nan)
    if save:
        show = np.zeros(X.shape + (3,), np.uint8)
        v = np.nan_to_num(long, nan=0)
        show[..., 2] = np.clip((v - 1) / 4, 0, 1) * 255
        show[..., 1] = np.clip(np.nan_to_num(short, nan=0) / 2, 0, 1) * 255
        show[..., 0] = np.where(ok, 60, 0)
        cv2.imwrite(save, show)
    return along, back, long, short, ok


def report(frames, save=False):
    FL = cover.FL
    for fr in frames:
        seconds = (fr - 3060) / cover.FPS - FL['seconds'] / 2
        along, back, long, short, ok = measure(seconds, save=os.path.join(WORK, 'stretch-%d.png' % fr) if save else None)
        rows = long.shape[0]
        parts = {'all': long[ok], 'low third': long[rows * 2 // 3:][ok[rows * 2 // 3:]], 'low left': long[rows // 2:, :long.shape[1] // 2][ok[rows // 2:, :long.shape[1] // 2]]}
        line = 'frame %d ahead %.3f' % (fr, along)
        for name, v in parts.items():
            if len(v) == 0:
                continue
            line += ' | %s: px per canvas px along the worst axis p50 %.2f p90 %.2f p99 %.2f, share over 2: %.3f over 3: %.3f' % (name, np.percentile(v, 50), np.percentile(v, 90), np.percentile(v, 99), float((v > 2).mean()), float((v > 3).mean()))
        s = short[ok]
        line += ' | best axis p50 %.2f' % np.percentile(s, 50)
        print(line, flush=True)


def canvas_map(frames, shrink=8):
    FL = cover.FL
    acc = np.zeros((geom.H // shrink, geom.W // shrink), np.float32)
    best = np.zeros_like(acc)
    for fr in frames:
        seconds = (fr - 3060) / cover.FPS - FL['seconds'] / 2
        pos, rot, along, back = cover.pose(seconds)
        f = geom.F * W / geom.W0
        k = 4
        xs = np.arange(k / 2, W, k)
        ys = np.arange(k / 2, H, k)
        X, Y = np.meshgrid(xs, ys)
        d = np.stack([X - W / 2, -(Y - H / 2), -f * np.ones_like(X)], -1)
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        d = d @ rot.T
        surface = Surface('full')
        t, hit = march(pos, d.reshape(-1, 3), surface, surface.hi)
        t = t.reshape(X.shape)
        hit = hit.reshape(X.shape)
        p = pos + d * np.where(hit, t, 1.0)[..., None]
        cx, cy = geom.project(p)
        jxx = np.gradient(cx, axis=1) / k
        jxy = np.gradient(cx, axis=0) / k
        jyx = np.gradient(cy, axis=1) / k
        jyy = np.gradient(cy, axis=0) / k
        a = jxx * jxx + jyx * jyx
        c = jxy * jxy + jyy * jyy
        b = jxx * jxy + jyx * jyy
        mean = 0.5 * (a + c)
        diff = np.sqrt(np.maximum(0.25 * (a - c) ** 2 + b * b, 0))
        s2 = np.sqrt(np.maximum(mean - diff, 1e-12))
        s1 = np.sqrt(mean + diff)
        jump = np.maximum(np.abs(np.gradient(t, axis=0)), np.abs(np.gradient(t, axis=1))) / np.maximum(t, 1e-6)
        ok = hit & (jump < 0.03) & (p[..., 2] < 0) & np.isfinite(cx) & np.isfinite(cy)
        ix = np.clip((cx[ok] / shrink).astype(int), 0, acc.shape[1] - 1)
        iy = np.clip((cy[ok] / shrink).astype(int), 0, acc.shape[0] - 1)
        np.maximum.at(acc, (iy, ix), (1 / s2[ok]).astype(np.float32))
        np.maximum.at(best, (iy, ix), (1 / s1[ok]).astype(np.float32))
    np.save(os.path.join(WORK, 'stretch-canvas.npy'), acc)
    np.save(os.path.join(WORK, 'stretch-canvas-best.npy'), best)
    for lim in (1.0, 1.2, 1.5, 2.0, 3.0):
        m = acc > lim
        if m.any():
            ys, xs = np.nonzero(m)
            print('worst axis over %.1f: share of canvas %.4f, columns %d to %d, rows %d to %d (canvas px), p5 to p95 columns %d to %d rows %d to %d' % (lim, float(m.mean()), xs.min() * shrink, xs.max() * shrink, ys.min() * shrink, ys.max() * shrink, np.percentile(xs, 2) * shrink, np.percentile(xs, 98) * shrink, np.percentile(ys, 2) * shrink, np.percentile(ys, 98) * shrink))
    for lim in (1.0, 1.2, 1.5):
        m = best > lim
        if m.any():
            ys, xs = np.nonzero(m)
            print('best axis over %.1f: share of canvas %.4f, columns %d to %d, rows %d to %d' % (lim, float(m.mean()), xs.min() * shrink, xs.max() * shrink, ys.min() * shrink, ys.max() * shrink))
    show = cv2.imread(os.path.join(geom.HERE, '..', 'relief', 'canvas-wide.jpg'))
    show = cv2.resize(show, (acc.shape[1], acc.shape[0]), interpolation=cv2.INTER_AREA).astype(np.float32)
    heat = np.clip((acc - 1) / 2, 0, 1)[..., None]
    show = show * (1 - 0.6 * heat) + 0.6 * heat * np.array([0, 0, 255], np.float32)
    for lim, col in ((1.2, (0, 255, 0)), (2.0, (255, 255, 0))):
        m = (acc > lim).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(show, cs, -1, col, 1)
    cv2.rectangle(show, (geom.OX // shrink, geom.OY // shrink), ((geom.OX + geom.W0) // shrink, (geom.OY + geom.H0) // shrink), (255, 255, 255), 1)
    cv2.imwrite(os.path.join(WORK, 'stretch-canvas.jpg'), show.astype(np.uint8))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for a in sys.argv[1:]:
        if a.startswith('--') and '=' in a:
            key, val = a[2:].split('=')
            cover.FL[key] = float(val)
    if '--canvas' in sys.argv:
        canvas_map(list(range(3150, 3240, 3)))
    else:
        report([int(a) for a in args] or [3060, 3105, 3150, 3180, 3210, 3239], save='--save' in sys.argv)
