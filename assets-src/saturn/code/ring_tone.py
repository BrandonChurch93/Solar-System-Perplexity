"""ring_tone.py FILM OUT.json [EVERY] [REACH] [LAST] [one]: the broad tone of the rings by radius against the approved close image.

FILM is frame 3720 of the film at the final tier (1920 by 1080), drawn with the table that
src/stops/saturn/skim.json light.grade.radial holds now. The script looks for the factor on that table which
brings the frame nearest to the approved close image in the frame's own number (the mean absolute level of the
whole frame, of which the rings are a part), predicted from the film's scene light: where the plane is the first
thing on the view, from the inner rim outward, the scene light of the film times the factor, developed as the
film's chain develops it, against the approved image.

The factor is a broad curve and nothing else: one free value (red, green, blue) every EVERY knots of the table
(0.02 radii a knot, EVERY 3 by default, so 0.06 radii between the values), straight lines between them in the
logarithm, no free value inside the dark gap from 1.92 to 2.10 (its edges lie at other radii in the approved
image than in the model: the table carries the broad tone, never the place of an edge), the knots of the dust
inward of the inner rim (1.03 to 1.25, one factor) left as they are, the last knot left at 1. The gain is held between the bounds of ring_radial.py
(0.4 to 4.5, and 0.55 to 1.8 outward of radius 1.56 where the ice is dense). The values are found one at a time
with the others held, in SWEEPS sweeps over a grid of factors.

one (the word, after the other arguments): one free value for the three colours of a knot, so the table keeps
the ratio of red to green to blue it holds at every radius. The colour of the ring by radius is the ring's own
and was fitted at the first pose of the skim; at another pose the level by radius changes with the view and the
colour does not, so a refit there moves the level alone. The bounds then hold the largest and the smallest of
a knot's three numbers with their ratio kept. (Without the word each colour is clipped by itself, and a knot
that reaches a bound in all three loses its colour: the ring turns white there.)

ring_tone.py --write TABLE.json: puts the gain of TABLE.json into skim.json, the layout of the file kept (one
number a line, put_table.py), nothing else touched.
Run it from the repo's root. No pixel of the film is made here: this only measures."""
import sys, json
import numpy as np
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
ONE = 'one' in sys.argv[3:]
ARGV = [a for i, a in enumerate(sys.argv) if not (i >= 3 and a == 'one')]
sys.argv = ['x']
ROOT = HERE.parents[2]
SKIM = ROOT / 'src/stops/saturn/skim.json'
W, H = 1920, 1080
LOW, HIGH = 0.4, 4.5
DENSE, DENSE_LOW, DENSE_HIGH = 1.56, 0.55, 1.8
GAP = (1.92, 2.10)
RIM = 1.2458
DUST = 1.25  # the last knot of the one factor of the dust inward of the rim
SWEEPS = 3
REACH = float(ARGV[4]) if len(ARGV) > 4 and not ARGV[1] == '--write' else 0.6  # the largest step of the logarithm of the factor in one run
GRID = np.linspace(-REACH, REACH, 41 if REACH <= 0.6 else 81)


def write(table_file):
    import put_table
    print('written', put_table.put(['light', 'grade', 'radial', 'gain'], json.loads(Path(table_file).read_text())['gain']), 'knots')


def main():
    import pose_fit as pf
    import geom
    skim = json.loads(SKIM.read_text())
    pose = skim['pose']
    radial = skim['light']['grade']['radial']
    first, step = radial['first'], radial['step']
    old = np.array(radial['gain'], float)
    count = len(old)
    knots = first + step * np.arange(count)
    every = int(ARGV[3]) if len(ARGV) > 3 else 3
    p = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
    pos, rot, sun, f = pf.camera(p)
    yy, xx = np.mgrid[0:H, 0:W]
    pts = np.stack([xx.ravel() + 0.5, yy.ravel() + 0.5], 1).astype(float)
    dr = pf.rays(pts, rot, f)
    dr /= np.linalg.norm(dr, axis=1)[:, None]
    down = dr[:, 1] < -1e-6
    k = -pos[1] / np.where(down, dr[:, 1], -1e-6)
    hit = pos[None, :] + dr * k[:, None]
    rad = np.where(down, np.hypot(hit[:, 0], hit[:, 2]), 99.0)
    sq = np.array([1.0, 1.0 / geom.POLAR, 1.0])
    ds = dr * sq
    ds /= np.linalg.norm(ds, axis=1)[:, None]
    ps = pos * sq
    b = ds @ ps
    disc = b * b - (ps @ ps - 1)
    reach = (-b - np.sqrt(np.maximum(disc, 0))) / np.linalg.norm(dr * sq, axis=1)
    # the plane is the first thing on the view: no globe at all, or the globe behind the plane's point
    front = down & ((disc <= 0) | (reach <= 0) | (k < reach))
    m = front & (rad >= RIM) & (rad < knots[-1])
    m &= (np.arange(m.size) % 3 == 0)  # every third pixel: enough for a broad tone
    approved = np.asarray(Image.open(ROOT / 'references/approved/saturn-close.jpg').convert('RGB').resize((W, H), Image.LANCZOS))
    film = np.asarray(Image.open(ARGV[1]).convert('RGB'))
    A = approved.reshape(-1, 3).astype(float)[m]
    F = film.reshape(-1, 3).astype(float)[m]
    Fs = geom.scene_of(film).reshape(-1, 3)[m]
    rr = rad[m]
    scale = 3.0 / (W * H) / 3
    q = (rr - first) / step
    i0 = np.clip(np.floor(q).astype(int), 0, count - 2)
    w = q - i0
    first_knot = int(np.nonzero(knots > DUST + 1e-9)[0][0])
    free = [i for i in range(first_knot, count - 1, every) if not (GAP[0] < knots[i] < GAP[1])]
    if free[-1] < count - 2:
        free.append(count - 2)
    # LAST: no free value outward of that radius; the factor falls to 1 over the next EVERY knots and the
    # knots beyond keep their numbers (at a pose where the approved image has its dark gap at other radii
    # than the model, the table must not paint that gap)
    last = float(ARGV[5]) if len(ARGV) > 5 else None
    anchor = None
    if last is not None:
        free = [i for i in free if knots[i] <= last + 1e-9]
        anchor = min(free[-1] + every, count - 1)
    free = np.array(free)

    def fine(v):
        x = np.zeros((count, 3))
        for c in range(3):
            x[:, c] = np.interp(knots, knots[free], v[:, c]) if anchor is None else np.interp(knots, np.append(knots[free], knots[anchor]), np.append(v[:, c], 0.0))
        x[:first_knot] = 0
        x[-1] = 0
        return x

    def bounded(x):
        g = old * np.exp(x)
        dense = knots >= DENSE
        if ONE:
            # the ratio of the three colours kept: the largest of the three under the upper bound, the smallest over the lower
            g = g * np.minimum(1.0, np.where(dense, DENSE_HIGH, HIGH) / g.max(1))[:, None]
            g = g * np.maximum(1.0, np.where(dense, DENSE_LOW, LOW) / g.min(1))[:, None]
        else:
            g = np.where(dense[:, None], np.clip(g, DENSE_LOW, DENSE_HIGH), np.clip(g, LOW, HIGH))
        g[:first_knot] = old[:first_knot]
        g[-1] = old[-1]
        return g

    def predict(g):
        x = np.log(g / old)
        fac = np.exp(x[i0] * (1 - w)[:, None] + x[i0 + 1] * w[:, None])
        return geom.display_of(Fs * fac) * 255

    def score(v):
        return np.abs(predict(bounded(fine(v))) - A).sum() * scale

    v = np.zeros((len(free), 3))
    print('free values %d at radii %s' % (len(free), ' '.join('%.2f' % knots[i] for i in free)))
    print('ring pixels %.4f of the frame; their part of the frame\'s number now %.4f' % (m.mean() * 3, np.abs(F - A).sum() * scale))
    print('the same from the scene light developed again (the error of the prediction is the difference): %.4f' % score(v))
    for sweep in range(SWEEPS):
        for j in range(len(free)):
            for c in ([slice(None)] if ONE else range(3)):
                errs = []
                for g in GRID:
                    v[j, c] = g
                    errs.append(score(v))
                v[j, c] = GRID[int(np.argmin(errs))]
        print('sweep %d: %.4f' % (sweep, score(v)))
    g = bounded(fine(v))
    P = predict(g)
    for lo, hi in ((RIM, 1.53), (1.53, 1.95), (1.95, 2.03), (2.03, 2.27), (2.27, 2.45)):
        s = (rr >= lo) & (rr < hi)
        print('  radii %.2f to %.2f: now %.4f, predicted %.4f; level now %.1f, predicted %.1f, approved %.1f' % (lo, hi, np.abs(F[s] - A[s]).sum() * scale, np.abs(P[s] - A[s]).sum() * scale, F[s].mean(), P[s].mean(), A[s].mean()))
    # a knot the factor leaves alone keeps its numbers as they stand in the file
    table = [[float(x) for x in old[i]] if np.array_equal(g[i], old[i]) else [round(float(x), 3) for x in g[i]] for i in range(count)]
    json.dump({'first': first, 'step': step, 'gain': table, 'predicted': score(v), 'free': [float(knots[i]) for i in free], 'factor': np.exp(v).tolist()}, open(ARGV[2], 'w'))
    print('factor on the old gain at the free radii: ' + ' '.join('%.2f:%.2f/%.2f/%.2f' % (knots[i], *np.exp(v[j])) for j, i in enumerate(free)))


if len(ARGV) > 2 and ARGV[1] == '--write':
    write(ARGV[2])
else:
    main()
