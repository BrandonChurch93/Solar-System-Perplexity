# lensrows.py PATH.json [STEP]: for both moves, by film frame: distance, lens, disc, the disc's rate, the lens's rate and the path's own speed
# (all rates in percent a film frame: of the disc's radius, of the tangent of half the field of view, of the root of the distance squared less one)
import json, sys, numpy as np
r = np.array([row[:4] for row in json.load(open(sys.argv[1]))], dtype=float)
step = int(sys.argv[2]) if len(sys.argv) > 2 else 5
fr, d, lens = r[:, 0], r[:, 1], r[:, 3]
u = 0.5 * np.log(d * d - 1); v = np.log(np.tan(np.radians(lens) / 2)); lnD = np.log(540) - v - u
def at(f): return int(np.nonzero(fr == f)[0][0])
for label, a, b, sign in (('DIVE', 3540, 3630, 1), ('RISE', 3810, 3884, -1)):
    i0, i1 = at(a), at(b)
    dl = np.diff(lens[i0:i1 + 1]) * sign
    print('%s %d to %d: steps of the lens at half frames that turn back: %d of %d (largest %.5f degrees)' % (label, a, b, (dl < -1e-9).sum(), len(dl), max(0, (-dl).max())))
    print('  frame   d       lens     disc    disc rate  lens rate  path speed  share of the path that reaches the disc')
    for f in list(range(a, b + 1, step)) + ([b] if (b - a) % step else []):
        j = at(f)
        dr = 100 * (lnD[j + 1] - lnD[j - 1]); lr = 100 * (v[j + 1] - v[j - 1]); pr = -100 * (u[j + 1] - u[j - 1])
        print('  %d  %.4f  %6.3f  %6.1f  %+8.4f  %+8.4f  %+8.4f   %.3f' % (f, d[j], lens[j], np.exp(lnD[j]), dr, lr, pr, dr / pr if abs(pr) > 1e-9 else float('nan')))
