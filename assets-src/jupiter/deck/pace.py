"""The pace of the far part of the dive and of the rise (place.json "pace").

The engine flies the far part of a handover on one schedule (a trapeze). On it the lit face fills the frame, or the night side
swings into it, within a dozen frames, and the mean level of the body steps by more than the handover report allows. This script
re-times the same path: it finds, for each film frame, the time on the engine's path the camera is at, so that the body's mean
level changes by at most LIMIT a frame, the camera never goes back, and the height never changes faster than RATE a frame.

  python3 assets-src/jupiter/deck/pace.py BASE.json DENSE.json dive|rise LIMIT RATE [EASE] [--smooth=FRAMES] [--nudge=FILM:BY,...] [--set=FILM:PATH,...] [--write]

BASE.json: rows of deck/steps.ts on the unpaced path (frame, bodyLevel). DENSE.json: the unpaced heights every eighth of a frame.
Prints the knots (film seconds after the segment start, path seconds after the segment start) and the steps it expects.

The inputs of the knots in place.json are kept in assets-src/jupiter/deck/pace: base-dive.json and base-rise.json (deck/steps.ts on
every frame of the dive and of the rise at the draft tier, before the pace existed; the same comes out with the knots
[[0, 0], [1, 1]] for both kinds) and dense.json (npx tsx assets-src/jupiter/deck/dense.ts, the engine's own path). The knots were
written by, with P = assets-src/jupiter/deck/pace:

  python3 assets-src/jupiter/deck/pace.py P/base-dive.json P/dense.json dive 3.8 0.11 --smooth=2 --write
  python3 assets-src/jupiter/deck/pace.py P/base-rise.json P/dense.json rise 4.5 0.185 0.35 --smooth=2 --set=$(cat P/set-rise.txt) --write
"""
import json
import sys

import numpy as np

base, dense, kind, limit, rate = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
ease = float(sys.argv[6]) if len(sys.argv) > 6 and not sys.argv[6].startswith('--') else 0.3
FPS = 30
rows = sorted(json.load(open(base)), key=lambda r: r['frame'])
frames = np.array([r['frame'] + 0.25 for r in rows])
level = np.array([r['bodyLevel'] for r in rows])
k = np.array([1, 2, 3, 2, 1.0])
smooth = np.convolve(np.pad(level, 2, mode='edge'), k / k.sum(), mode='valid')
d = np.array(json.load(open(dense))[kind])
ds, dh = d[:, 0], np.log(d[:, 1])
first, end = ds[0], ds[-1]
T = {'dive': 3024.0, 'rise': 3270.0}[kind]
far = first if kind == 'dive' else end
sign = 1.0 if kind == 'dive' else -1.0


def L(s, table=smooth):
    return np.interp(s, frames, table)


def slope(s):
    return abs(L(s + 0.5) - L(s - 0.5))


def speed(s):
    return abs(np.interp(s + 0.0625, ds, dh) - np.interp(s - 0.0625, ds, dh)) / 0.125


# u: film frames from the far end toward T, v: path frames from the far end toward T.
span = abs(T - far)
step = 0.125
u, v = 0.0, 0.0
us, vs = [0.0], [0.0]
while u < span - 1e-9:
    s = far + sign * v
    behind = u - v
    cap = min(rate / max(speed(s), 1e-6), 1 + ease * max(span - u, 0)) if behind > 1e-3 else 1.0
    by = min(cap, limit / max(slope(s), 1e-6))
    by = min(by, (behind + step) / step) if behind > 1e-3 else min(by, 1.0)
    v += by * step
    u += step
    us.append(u)
    vs.append(min(v, u))
us, vs = np.array(us), np.array(vs)
soft = [float(a.split('=')[1]) for a in sys.argv if a.startswith('--smooth=')]
if soft and soft[0] > 0:
    # The lag behind the engine's path, averaged over SMOOTH frames each way, so the camera's speed has no kink.
    n = int(round(soft[0] / step))
    kern = np.concatenate([np.arange(1, n + 1), np.arange(n - 1, 0, -1)]).astype(float)
    lag = np.convolve(np.pad(us - vs, n - 1), kern / kern.sum(), mode='valid')
    near = np.clip((span - 0.5 - us) / 1.5, 0, 1)
    start = np.clip(us / 1.5, 0, 1)
    vs = us - lag * near * near * (3 - 2 * near) * start * start * (3 - 2 * start)
met = us[np.argmax((us - vs < 1e-3) & (us > us[np.argmax(us - vs)]))] if (us - vs).max() > 1e-3 else 0.0
print('largest lag %.2f frames at %.1f frames from the far end, back on the path %.1f frames from the far end (T is %.0f)' % ((us - vs).max(), us[np.argmax(us - vs)], met, span))
if vs[-1] < span - 0.02:
    print('NOT back on the path at T: short by %.2f frames. Raise LIMIT or RATE.' % (span - vs[-1]))

# Knots every two frames while off the path, one on the path at each end.
off = np.where(us - vs > 1e-3)[0]
lo = max(us[off[0]] - 2, 0.0)
hi = min(us[off[-1]] + 2, span - 0.5)
ku = np.unique(np.concatenate([[lo], np.arange(np.ceil(lo / 2) * 2 + 2, hi - 1, 2), [hi]]))
kv = np.interp(ku, us, vs)
kv[0], kv[-1] = ku[0], ku[-1]
for arg in sys.argv:
    if arg.startswith('--nudge='):
        # FILM_FRAME:PATH_FRAMES moves the knot at that film frame along the path, a correction taken from the stills of the paced path.
        for part in arg.split('=')[1].split(','):
            at, by = part.split(':')
            kv[int(np.argmin(np.abs(far + sign * ku - float(at))))] += sign * float(by)
    if arg.startswith('--set='):
        # FILM_FRAME:PATH_FRAME,... takes the place of the knots between the first and the last film frame given, from the same stills.
        given = sorted((sign * (float(f) - far), sign * (float(q) - far)) for f, q in (part.split(':') for part in arg.split('=')[1].split(',')))
        keep = (ku < given[0][0] - 1e-6) | (ku > given[-1][0] + 1e-6)
        ku2 = np.concatenate([ku[keep], [g[0] for g in given]])
        kv2 = np.concatenate([kv[keep], [g[1] for g in given]])
        ku, kv = ku2[np.argsort(ku2)], kv2[np.argsort(ku2)]


def pchip(x, xs, ys):
    h = np.diff(xs)
    dlt = np.diff(ys) / h
    m = np.zeros(len(xs))
    m[0], m[-1] = 1.0, 1.0
    for i in range(1, len(xs) - 1):
        m[i] = 0.0 if dlt[i - 1] * dlt[i] <= 0 else 2 * dlt[i - 1] * dlt[i] / (dlt[i - 1] + dlt[i])
    for i in range(len(h)):
        if dlt[i] == 0:
            continue
        a, b = m[i] / dlt[i], m[i + 1] / dlt[i]
        n = a * a + b * b
        if n > 9:
            m[i], m[i + 1] = 3 * a / np.sqrt(n) * dlt[i], 3 * b / np.sqrt(n) * dlt[i]
    x = np.asarray(x, dtype=float)
    out = x.copy()
    inside = (x > xs[0]) & (x < xs[-1])
    i = np.clip(np.searchsorted(xs, x[inside]) - 1, 0, len(h) - 1)
    t = (x[inside] - xs[i]) / h[i]
    out[inside] = (2 * t**3 - 3 * t**2 + 1) * ys[i] + (t**3 - 2 * t**2 + t) * h[i] * m[i] + (-2 * t**3 + 3 * t**2) * ys[i + 1] + (t**3 - t**2) * h[i] * m[i + 1]
    return out


# In film time: seconds after the segment start.
film = (far + sign * ku - first) / FPS
path = (far + sign * kv - first) / FPS
order = np.argsort(film)
knots = [[round(float(a), 4), round(float(b), 4)] for a, b in zip(film[order], path[order])]
print(json.dumps(knots))
fr = np.arange(np.ceil(min(far, T)), np.floor(max(far, T)) + 1)
if kind == 'rise':
    fr = fr[fr < end]
sm = first + pchip((fr + 0.25 - first) / FPS, np.array([a for a, _ in knots]), np.array([b for _, b in knots])) * FPS
for name, table in (('smoothed', smooth), ('as measured', level)):
    lv = L(sm, table)
    st = np.abs(np.diff(lv))
    print('%s: largest step %.2f into %d, top six %s, over 5: %d' % (name, st.max(), fr[1 + st.argmax()], np.round(np.sort(st)[-6:], 2), (st > 5).sum()))
hh = np.interp(sm, ds, dh)
rt = np.abs(np.diff(hh))
mean = abs(hh[0] - hh[-1]) / (len(hh) - 1)
print('fastest %.4f a frame into %d, %.2f times the mean %.4f' % (rt.max(), fr[1 + rt.argmax()], rt.max() / mean, mean))
print('frame:path:height:rate:level  ' + ' '.join('%d:%.2f:%.3f:%.3f:%.0f' % (f, s, np.exp(h), r, l) for f, s, h, r, l in zip(fr[1:], sm[1:], hh[1:], rt, L(sm[1:]))))
if '--write' in sys.argv:
    p = 'src/stops/jupiter/place.json'
    j = json.load(open(p))
    j.setdefault('pace', {})[kind] = knots
    open(p, 'w').write(json.dumps(j, indent=2) + '\n')
    print('written to', p)
