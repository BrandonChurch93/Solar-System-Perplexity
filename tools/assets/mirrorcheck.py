#!/usr/bin/env python3
import sys
import numpy as np
from PIL import Image, ImageFilter

W = 48
SKIP = 3
CLIP = 4.0
WHOLE = 0.5
HALF = 0.35
SHORT = 0.9


def corr(a, b):
    a = a.ravel()
    b = b.ravel()
    if a.std() < 1e-6 or b.std() < 1e-6:
        return 0.0
    return float(np.corrcoef(a, b)[0, 1])


def clipped(v):
    s = 1.4826 * float(np.median(np.abs(v - np.median(v)))) + 0.5
    return np.clip(v, -CLIP * s, CLIP * s)


def judge(a, b, axis):
    a = clipped(a)
    b = clipped(b)
    c = corr(a, b)
    if c <= WHOLE:
        return None
    n = a.shape[axis] // 2
    if axis == 0:
        halves = (corr(a[:n], b[:n]), corr(a[n:], b[n:]))
    else:
        halves = (corr(a[:, :n], b[:, :n]), corr(a[:, n:], b[:, n:]))
    if min(halves) <= HALF and max(halves) <= SHORT:
        return None
    return c


def scan(path):
    g = Image.open(path).convert('L')
    raw = np.asarray(g, dtype=np.float32)
    im = raw - np.asarray(g.filter(ImageFilter.GaussianBlur(4)), dtype=np.float32)
    h, w = im.shape
    out = []
    for x0 in range(W, w - W, 2):
        for y0 in range(0, h - 216 + 1, 108):
            a = im[y0:y0 + 216, x0 - W:x0 - SKIP][:, ::-1]
            b = im[y0:y0 + 216, x0 + SKIP:x0 + W]
            if a.std() < 1.5 or b.std() < 1.5 or raw[y0:y0 + 216, x0 - W:x0 + W].mean() > 70:
                continue
            c = judge(a, b, 0)
            if c is not None:
                out.append(('vertical seam at x', x0, 'rows from', y0, round(c, 2)))
    for y0 in range(W, h - W, 2):
        for x0 in range(0, w - 384 + 1, 192):
            a = im[y0 - W:y0 - SKIP, x0:x0 + 384][::-1, :]
            b = im[y0 + SKIP:y0 + W, x0:x0 + 384]
            if a.std() < 1.5 or b.std() < 1.5 or raw[y0 - W:y0 + W, x0:x0 + 384].mean() > 70:
                continue
            c = judge(a, b, 1)
            if c is not None:
                out.append(('horizontal seam at y', y0, 'columns from', x0, round(c, 2)))
    best = {}
    for k, pos, k2, off, c in out:
        key = (k, pos // 8)
        if key not in best or c > best[key][4]:
            best[key] = (k, pos, k2, off, c)
    return sorted(best.values(), key=lambda t: -t[4])


bad = 0
for p in sys.argv[1:]:
    r = scan(p)
    bad += len(r)
    print(p, 'clean' if not r else '; '.join('%s %d, %s %d, correlation %.2f' % t for t in r[:6]))
sys.exit(1 if bad else 0)
