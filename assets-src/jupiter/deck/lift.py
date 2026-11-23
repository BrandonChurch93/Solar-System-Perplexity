"""The air weight of the close side over time (deck.json air.lift), solved so the mean level of the body
changes as evenly as it can between the handover frame and the surface view.

  python3 assets-src/jupiter/deck/lift.py [--smooth=L] [--write]
  python3 assets-src/jupiter/deck/lift.py --add DIR     DIR holds steps-A-B.json of deck/steps.ts, rendered with the knots now in deck.json

It reads lift-measure.json (see its note). Per frame the level is taken as zero + gap * g, where zero is the level with
no weight, gap the level the full weight adds and g a share between 0 and 1. The share is one curve of the weight for
both kinds (fitted in logarithms from every render in the file). The solve asks for the smallest sum of squared level
steps plus L times the squared bends of the share, with the share never turning back. Where the ground itself darkens
faster than the mean step the share waits.
"""
import json
import math
import os
import sys

import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.optimize import minimize

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
MEASURE = os.path.join(HERE, 'lift-measure.json')
DECK = os.path.join(ROOT, 'src', 'stops', 'jupiter', 'deck.json')
SHOW = json.load(open(os.path.join(ROOT, 'config', 'showcase.json')))
FPS = SHOW['film']['fps']
MID = SHOW['film']['shutterDegrees'] / 720

args = [a for a in sys.argv[1:]]
opt = {a.split('=')[0]: (a.split('=')[1] if '=' in a else True) for a in args if a.startswith('--')}
smooth = float(opt.get('--smooth', 3000))
M = json.load(open(MEASURE))


def smoothstep(a, b, x):
    t = min(max((x - a) / (b - a), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def out_seconds(kind, f):
    a, b = M[kind]['frames']
    return (b + 1 - (f + MID)) / FPS if kind == 'dive' else (f + MID - a) / FPS


def frames(kind):
    a, b = M[kind]['frames']
    return list(range(a, b + 1))


def heights(kind):
    return [h * M['radius'] for h in M[kind]['height']]


def first_weights(kind):
    return [smoothstep(M['was'][0], M['was'][1], h) for h in heights(kind)]


def gap_by_height():
    pts = []
    for kind in ('dive', 'rise'):
        a = M[kind]['frames'][0]
        zero = dict((r[0], r[1]) for r in M[kind]['zero'])
        for f, v in M[kind]['one']:
            pts.append((math.log(heights(kind)[f - a]), v - zero[f]))
    pts.sort()
    x = np.array([p[0] for p in pts])
    y = np.array([p[1] for p in pts])
    keep = np.concatenate(([True], np.diff(x) > 1e-6))
    p = PchipInterpolator(x[keep], y[keep])
    low = (y[keep][1] - y[keep][0]) / (x[keep][1] - x[keep][0])

    def at(h):
        lx = math.log(h)
        if lx < x[0]:
            return float(y[0] + 0.5 * low * (lx - x[0]))
        return float(p(min(lx, x[-1])))
    return at


GAP = gap_by_height()


def base(kind):
    fr = frames(kind)
    a = fr[0]
    level = np.array(M[kind]['level'])
    w0 = first_weights(kind)
    zero = dict((r[0], r[1]) for r in M[kind]['zero'])
    one = dict((r[0], r[1]) for r in M[kind]['one'])
    kf, kd = [], []
    for i, f in enumerate(fr):
        if f in zero:
            kf.append(f)
            kd.append(level[i] - zero[f])
        elif w0[i] == 0:
            kf.append(f)
            kd.append(0.0)
    d0 = PchipInterpolator(kf, kd)(fr)
    zeros = level - d0
    h = heights(kind)
    gf, gv = [], []
    for i, f in enumerate(fr):
        if f in one:
            gf.append(f)
            gv.append(one[f] - zero[f])
        elif not (min(one) <= f <= max(one)):
            gf.append(f)
            gv.append(GAP(h[i]))
    gap = PchipInterpolator(gf, gv)(fr)
    return fr, level, np.array(w0), zeros, gap


def share_curve():
    pts = []
    for kind in ('dive', 'rise'):
        fr, level, w0, zeros, gap = base(kind)
        zero = dict((r[0], r[1]) for r in M[kind]['zero'])
        for i, f in enumerate(fr):
            if f in zero and 1e-4 < w0[i] < 0.999:
                pts.append((w0[i], (level[i] - zeros[i]) / gap[i]))
        for run in M[kind]['runs']:
            for i, f in enumerate(fr):
                w = run['weight'][i]
                if 1e-4 < w < 0.999:
                    pts.append((w, (run['level'][i] - zeros[i]) / gap[i]))
    pts = [(math.log(w), math.log(min(max(g, 1e-4), 1.0))) for w, g in pts]
    pts.sort()
    edges = np.linspace(pts[0][0], 0, 15)
    bx, by = [], []
    for lo, hi in zip(edges[:-1], edges[1:]):
        inside = [p for p in pts if lo <= p[0] < hi]
        if inside:
            bx.append(sum(p[0] for p in inside) / len(inside))
            by.append(sum(p[1] for p in inside) / len(inside))
    by = list(np.maximum.accumulate(by))
    for i in range(1, len(by)):
        if by[i] <= by[i - 1]:
            by[i] = by[i - 1] + 1e-6
    bx.append(0.0)
    by.append(max(0.0, by[-1] + 1e-6))
    by[-1] = 0.0 if by[-2] < 0 else by[-1]
    p = PchipInterpolator(bx, by)
    slope = by[0] / bx[0]

    def g_of(w):
        if w <= 0:
            return 0.0
        if w >= 1:
            return 1.0
        lx = math.log(w)
        return math.exp(slope * lx) if lx < bx[0] else min(math.exp(float(p(lx))), 1.0)
    grid = np.linspace(-14, 0, 1401)
    table = np.array([g_of(math.exp(v)) for v in grid])

    def w_of(g):
        if g <= 0:
            return 0.0
        if g >= 1:
            return 1.0
        return float(math.exp(np.interp(g, table, grid)))
    return g_of, w_of, list(zip(bx, by))


def solve(kind, g_of, w_of):
    fr, level, w0, zeros, gap = base(kind)
    if kind == 'rise':
        fr, level, w0, zeros, gap = fr[::-1], level[::-1], w0[::-1], zeros[::-1], gap[::-1]
    n = len(fr)
    edge = zeros[-1] + (zeros[-1] - zeros[-2])

    def shares(d):
        return 1 - np.cumsum(d)

    def levels(d):
        g = np.concatenate(([1.0], shares(d)))
        return np.concatenate((zeros + gap * g[:-1], [edge]))

    def cost(d):
        g = np.concatenate(([1.0, 1.0], shares(d), [0.0]))
        bend = np.diff(g, 2)
        return float(np.sum(np.diff(levels(d)) ** 2) + smooth * np.sum(bend ** 2))
    start = np.full(n, 1.0 / n)
    res = minimize(cost, start, method='SLSQP', bounds=[(0, 1)] * n, constraints=[{'type': 'eq', 'fun': lambda d: np.sum(d) - 1}], options={'maxiter': 800, 'ftol': 1e-10})
    g = np.clip(np.concatenate(([1.0], shares(res.x)))[:-1], 0, 1)
    lv = zeros + gap * g
    order = list(range(n)) if kind == 'dive' else list(range(n - 1, -1, -1))
    film_now = [lv[i] for i in order]
    film_was = [level[i] for i in order]
    if kind == 'dive':
        film_now, film_was = film_now + [edge], film_was + [edge]
        into = lambda v, k: v[k] - v[k - 1] if k > 0 else 0.0
    else:
        film_now, film_was = [edge] + film_now, [edge] + film_was
        into = lambda v, k: v[k + 1] - v[k]
    rows = []
    for k, i in enumerate(order):
        rows.append((fr[i], out_seconds(kind, fr[i]), float(g[i]), w_of(float(g[i])), float(lv[i]), float(into(film_now, k)), float(into(film_was, k)), float(zeros[i]), float(gap[i])))
    if kind == 'dive':
        rows.append((fr[-1] + 1, 0.0, 0.0, 0.0, float(edge), float(edge - film_now[-2]), float(edge - film_was[-2]), float(edge), 0.0))
    return rows


def knots(kind, rows):
    a, b = M[kind]['frames']
    top = (b + 1 - (a + 2 * MID)) / FPS if kind == 'dive' else (b - a) / FPS
    pts = [[0.0, 0.0]]
    for f, out, g, w, *_ in sorted(rows, key=lambda r: r[1]):
        if 0 < out < top - 1e-9:
            pts.append([round(out, 5), round(w, 5)])
    pts.append([round(top, 5), 1.0])
    for i in range(1, len(pts)):
        pts[i][1] = max(pts[i][1], pts[i - 1][1])
    return pts


def add(folder):
    lift = json.load(open(DECK))['air']['lift']
    for kind in ('dive', 'rise'):
        a, b = M[kind]['frames']
        got = {}
        for name in sorted(os.listdir(folder)):
            if name.startswith('steps-') and name.endswith('.json'):
                for r in json.load(open(os.path.join(folder, name))):
                    got[r['frame']] = r['bodyLevel']
        if not all(f in got for f in range(a, b + 1)):
            print(kind, 'frames missing in', folder)
            continue
        by = dict((round(k[0], 5), k[1]) for k in lift[kind])
        weight = []
        for f in range(a, b + 1):
            o = round(out_seconds(kind, f), 5)
            weight.append(by.get(o, 1.0 if o >= lift[kind][-1][0] else 0.0))
        M[kind]['runs'].append({'from': os.path.relpath(folder, ROOT), 'weight': weight, 'level': [round(got[f], 2) for f in range(a, b + 1)]})
        print(kind, 'added', len(weight), 'frames')
    open(MEASURE, 'w').write(json.dumps(M, indent=1) + '\n')


if '--add' in opt:
    add(args[args.index('--add') + 1])
    sys.exit(0)

g_of, w_of, curve = share_curve()
print('share by weight (ln w, ln g):', ' '.join('%.2f:%.2f' % c for c in curve))
result = {}
for kind in ('dive', 'rise'):
    rows = solve(kind, g_of, w_of)
    print(kind, 'smooth', smooth)
    print('frame   out    share  weight   level   step  (was)   zero    gap')
    for r in sorted(rows):
        print('%d  %.4f  %.3f  %.5f  %7.2f  %5.2f  %5.2f  %6.2f  %5.2f' % r)
    print(kind, 'widest step %.2f (was %.2f)' % (max(abs(r[5]) for r in rows), max(abs(r[6]) for r in rows)))
    result[kind] = knots(kind, rows)
if '--write' in opt:
    deck = json.load(open(DECK))
    deck['air']['lift'] = result
    open(DECK, 'w').write(json.dumps(deck, indent=2) + '\n')
    print('written', DECK)
