import sys, json, re
import numpy as np
from PIL import Image
# usage: measure.py HOLD_TABLE.md DIR frames...   finds two stars and the lit limb in draft stills, seeded by the table of hold.ts
table, folder = sys.argv[1], sys.argv[2]
frames = [int(f) for f in sys.argv[3:]]
rows = {}
for line in open(table):
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if c and re.fullmatch(r'\d+', c[0]):
        rows[int(c[0])] = [tuple(float(v) for v in x.split(',')) for x in c[1:6]]
def lum(f):
    a = np.asarray(Image.open(f'{folder}/f{f}-draft.png').convert('RGB')).astype(np.float64)
    return a @ np.array([0.2126, 0.7152, 0.0722])
def peak(a, x, y, reach):
    x0, y0 = int(round(x)), int(round(y))
    w = a[y0 - reach:y0 + reach + 1, x0 - reach:x0 + reach + 1]
    j, i = np.unravel_index(np.argmax(w), w.shape)
    px, py = x0 - reach + i, y0 - reach + j
    w = a[py - 3:py + 4, px - 3:px + 4]
    w = np.clip(w - np.median(a[py - 8:py + 9, px - 8:px + 9]), 0, None)
    ys, xs = np.mgrid[py - 3:py + 4, px - 3:px + 4]
    return (xs * w).sum() / w.sum(), (ys * w).sum() / w.sum(), a[py, px]
def edge(a, c, s):
    d = np.array(s) - np.array(c)
    d /= np.hypot(*d)
    r = np.arange(120.0, 300.0, 0.05)
    xs, ys = c[0] + d[0] * r, c[1] + d[1] * r
    x0, y0 = np.floor(xs).astype(int), np.floor(ys).astype(int)
    fx, fy = xs - x0, ys - y0
    v = a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy) + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy
    k = int(np.argmax(v))
    floor = np.median(v[-400:])
    half = floor + (v[k] - floor) / 2
    j = k + int(np.argmax(v[k:] < half))
    return c[0] + d[0] * r[j], c[1] + d[1] * r[j]
ref = lum(5235)
seeds = []
for n in range(2):
    x, y = rows[5235][n]
    best = None
    for yy in range(int(y) - 60, int(y) + 61, 6):
        for xx in range(int(x) - 60, int(x) + 61, 6):
            p = peak(ref, xx, yy, 6)
            if best is None or p[2] > best[2]:
                best = p
    seeds.append((best[0] - x, best[1] - y))
print('| frame | star upper left | star mid right | limb, outermost lit point |')
print('| --- | --- | --- | --- |')
for f in frames:
    a = lum(f)
    out = []
    for n in range(2):
        x, y = rows[f][n]
        p = peak(a, x + seeds[n][0], y + seeds[n][1], 5)
        out.append(f'{p[0]:.1f}, {p[1]:.1f}')
    e = edge(a, rows[f][4], rows[f][2])
    out.append(f'{e[0]:.1f}, {e[1]:.1f}')
    print(f'| {f} | ' + ' | '.join(out) + ' |')
