# body_pace.py: the knots of the one share of the light of the globe by the height of the lens
# (src/stops/saturn/skim.json light.body heights and share, read by grade.ts bodyShare).
#
# Run from the repo root: python3 assets-src/saturn/code/body_pace.py [FLOOR EASE KNOTS]
#
# Why a table and not a formula. Every number of the globe that differs between the two approved pictures is a
# straight line by the share, but the level on the screen is not: it goes through the tone curve, and the cut
# of the twilight works on light. Measured on the rise of the tree before this one (body_response.json), a bin
# of the twilight at 8 to 16 N made 41 percent of its 81 levels in the first 16 percent of the share, a bin at
# 26 to 40 N nearly none of it early. With the share an eased straight line in the logarithm of the height the
# same places of the body changed by up to 2.82 levels from one film frame to the next.
#
# What this does. It takes, at every state of the share, the largest slope of the level against the share over
# all measured bins (never under FLOOR times its mean, so no part of the way is passed in no time), and lays
# the share along the fastest passage of the lens through these heights, the rise, so that this largest slope
# is passed evenly, frame by frame, with eased ends (EASE of the way at either end). The result is still a
# function of the height alone: a step in the logarithm of the height with no slope at either end, the same on
# the way down and on the way up. It prints the knots and what it predicts for the dive, the skim and the rise.
import json, math, os, sys
import numpy as np

here = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(here, 'body_response.json')))
floor = float(sys.argv[1]) if len(sys.argv) > 1 else 0.6
ease = float(sys.argv[2]) if len(sys.argv) > 2 else 0.1
knots = int(sys.argv[3]) if len(sys.argv) > 3 else 33
LO, HI = 0.365, 2.2  # the heights of the skim's end and of the hold's end of the share (planet radii)
first = data['flight']['first']
H = {first + i: v for i, v in enumerate(data['flight']['height'])}


def eased(t, e):
    # a straight line from 0 to 1 whose slope comes in over the first part e and goes out over the last
    t = min(max(t, 0.0), 1.0)
    if e <= 0: return t
    if t < e: return t * t / (2 * e * (1 - e))
    if t > 1 - e: return 1 - (1 - t) * (1 - t) / (2 * e * (1 - e))
    return (t - e / 2) / (1 - e)


def measured_state(h):
    # the state the measured tree gave at a height: 0 at the skim's end, 1 at the hold's end
    return eased(math.log(max(h, 1e-6) / LO) / math.log(HI / LO), 0.1)


# the answer of every bin: level against the state, from the frames of the rise in which the share moves
frames = data['frames']; level = data['level']; edges = data['edges']; lats = data['lats']
x = np.array([measured_state(H[f]) for f in frames])
answer = {}
for li in range(len(lats)):
    for bi in range(len(edges) - 1):
        y = np.array([np.nan if level[i][li][bi] is None else level[i][li][bi] for i in range(len(frames))])
        ok = ~np.isnan(y) & (np.array(frames) >= 3790) & (np.array(frames) <= 3868)
        if ok.sum() < 20: continue
        xs = x[ok]; ys = y[ok]; order = np.argsort(xs, kind='stable'); xs = xs[order]; ys = ys[order]
        ux = np.unique(xs); uy = np.array([ys[xs == u].mean() for u in ux])
        answer[(li, bi)] = (ux, uy)

# the largest slope of the level against the state over all bins, on a grid of the state
grid = np.linspace(0, 1, 201); slope = np.zeros_like(grid)
for ux, uy in answer.values():
    L = np.interp(grid, ux, uy); k = 8
    pad = np.concatenate([np.full(k, L[0]), L, np.full(k, L[-1])])
    smooth = np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), 'valid')
    slope = np.maximum(slope, np.abs(np.gradient(smooth, grid)))
cost = np.maximum(slope, floor * slope.mean())
way = np.concatenate([[0], np.cumsum((cost[1:] + cost[:-1]) / 2 * np.diff(grid))]); total = way[-1]

# the rise: the frame at which the lens passes a height, from the lowest point of the skim on
rise = list(range(3760, 3890)); rise_log = np.log(np.array([H[f] for f in rise]))
def frame_at(h): return float(np.interp(math.log(h), rise_log, rise))
f_lo, f_hi = frame_at(LO), frame_at(HI); span = f_hi - f_lo
def state_at_frame(f): return float(np.interp(eased((f - f_lo) / span, ease) * total, way, grid))

fk = [f_lo + span * i / (knots - 1) for i in range(knots)]
hk = [math.exp(float(np.interp(f, rise, rise_log))) for f in fk]; hk[0] = LO; hk[-1] = HI
sk = [1 - state_at_frame(f) for f in fk]; sk[0] = 1.0; sk[-1] = 0.0
hk = [round(v, 4) for v in hk]; sk = [round(v, 4) for v in sk]


def share(h):
    # the share as grade.ts reads the knots: straight lines in the logarithm of the height
    h = min(max(h, LO), HI); i = 0
    while i < knots - 2 and h >= hk[i + 1]: i += 1
    return sk[i] + (sk[i + 1] - sk[i]) * math.log(h / hk[i]) / math.log(hk[i + 1] / hk[i])


def largest(state):
    out = []
    for name, fr in (('dive', range(3540, 3630)), ('skim', range(3629, 3811)), ('rise', range(3810, 3869))):
        worst = (0.0, None, None); fr = list(fr)
        for (li, bi), (ux, uy) in answer.items():
            d = np.diff(np.array([np.interp(state(H[f]), ux, uy) for f in fr])); i = int(np.argmax(np.abs(d)))
            if abs(d[i]) > abs(worst[0]): worst = (float(d[i]), (li, bi), fr[i])
        d, b, f = worst
        out.append('%s %.2f at %d (%d to %d N, cosine %.2f)' % (name, abs(d), f, lats[b[0]][0], lats[b[0]][1], edges[b[1]]))
    return '; '.join(out)


print('the rise passes %.3f at frame %.1f and %.1f at frame %.1f' % (LO, f_lo, HI, f_hi))
print('the largest slopes sum to %.1f levels: evenly over %.1f frames %.2f a frame, with the eased ends %.2f' % (total, span, total / span, total / span / (1 - ease)))
print('largest change of level a film frame by the measured answer:')
print('  the measured tree (eased line): ' + largest(measured_state))
print('  these knots:                    ' + largest(lambda h: 1 - share(h)))
print('"heights": ' + json.dumps(hk) + ',')
print('"share": ' + json.dumps(sk))
print('share at frames: ' + '; '.join('%d %.4f' % (f, share(H[f])) for f in (3567, 3589, 3601, 3629, 3660, 3700, 3720, 3760, 3800, 3809, 3819, 3830, 3838, 3850, 3866)))
