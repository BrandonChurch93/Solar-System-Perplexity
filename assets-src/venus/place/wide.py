"""The wide ring about the place (level v): the cloud of the place seen from above, carried on from level w out to 45 deg of arc
from the plate centre. The plate holds forms only (one channel): the film draws them over the globe's own colour.

  python3 assets-src/venus/place/wide.py sun      the direction of the shadows in the picture of level w (prints it)
  python3 assets-src/venus/place/wide.py start    the plate with its middle only, and the list of windows empty
  python3 assets-src/venus/place/wide.py plan     the next windows to paint: writes their inputs, prints their numbers
  python3 assets-src/venus/place/wide.py lay N:T ...   lays take T of window N into the plate (several at once); a take with a
                                                       straight line in it is not laid unless it is named N:T+
  python3 assets-src/venus/place/wide.py undo N ...    takes the kept takes of these windows out and lays the plate again
  python3 assets-src/venus/place/wide.py cut N ...     writes the inputs of windows that are planned and not laid again
  python3 assets-src/venus/place/wide.py void N ...    gives a planned window up (no take of it is good); the plan then goes round it
  python3 assets-src/venus/place/wide.py again    the plate from its middle, every kept take laid again in the order of the list
  python3 assets-src/venus/place/wide.py drop N ...    takes windows that were planned and not laid out of the list
  python3 assets-src/venus/place/wide.py export   public/assets/venus/{full,web}/<file of level v>
  python3 assets-src/venus/place/wide.py check    tone, fine detail and direction of the shadows by distance from the middle

The picture of w is first made flat in tone: its light over its own light blurred at flatDeg, at the level `level`. The middle of
the plate is that picture at the scale of the plate. Round it the plate is painted window by window at the scale of the plate
(one plate pixel is one pixel of a take): a window is a square of the plate of which at least `context` is already there. Its
input shows that picture, ending along a soft wandering line, and in the rest a layout by code (sketch): three flat tones that
say where a tower stands and where its shadow falls. The model paints the photograph on over that layout (prompt `wideSketch`
of prompts.json). A window whose new part lies above or below its picture is shown turned (rows for columns), so the new part
lies beside the picture, and its take is turned back before it is laid: shown upright such a window came back as a copy of the
picture it already had. Of a take only the new part goes into the plate, cut in along the line of least difference to what was
there, after its tone is locked to what was there. A window never paints up to picture it has not seen: cells nearer than `gap`
to picture outside the window stay empty for a later window that sees both sides. The plan takes first the windows whose new
cells are held by picture on two sides.

Values: assets-src/venus/place/wide.json. Work files live in out/work/venus/place/v/. The recipe is in assets-src/venus/RECIPE.md,
section "Wide ring".
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import lay  # noqa: E402

ROOT = lay.ROOT
WORK = lay.WORK
SPEC = lay.SPEC
WIDE = json.loads((HERE / 'wide.json').read_text())
V = SPEC['wide']
OUT = WORK / 'v'
CHILD = next(l for l in SPEC['levels'] if l['tag'] == WIDE['child'])
SIZE = V['size']
# Plate pixels of v for one pixel of the child at the centre.
K0 = (SIZE / np.tan(np.radians(V['widthDeg']) / 2)) / (SPEC['size'] / np.tan(np.radians(CHILD['widthDeg']) / 2))
WIN = WIDE['window']
N = WIN['size']
C = WIN['cell']
GREY = 0.5


def child_light():
    img = cv2.imread(str(WORK / WIDE['child'] / 'plate-4096.png'), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit('missing the plate of level ' + WIDE['child'])
    return (lay.to_light(img.astype(np.float32) / 255) * lay.LUMA).sum(-1)


def flat():
    """The picture of the child, flat in tone: light over its own light at flatDeg, at `level` (light)."""
    light = child_light()
    per_deg = SPEC['size'] / (2 * np.tan(np.radians(CHILD['widthDeg']) / 2)) * np.pi / 180
    low = cv2.GaussianBlur(light, (0, 0), WIDE['flatDeg'] * per_deg)
    return (light / np.maximum(low, 1e-5) * WIDE['level']).astype(np.float32)


def sun(f=None):
    """The direction of the shadows in the plate (x to the right, y down): where the dark parts lie from the bright tops, from the
    correlation of the two at a sixteenth of the size."""
    f = flat() if f is None else f
    s = cv2.resize(f, (256, 256), interpolation=cv2.INTER_AREA) / WIDE['level']
    top = (s > WIDE['sun']['top']).astype(np.float32)
    dark = (s < WIDE['sun']['dark']).astype(np.float32)
    corr = np.fft.fftshift(np.real(np.fft.ifft2(np.conj(np.fft.fft2(top - top.mean())) * np.fft.fft2(dark - dark.mean()))))
    yy, xx = np.mgrid[0:256, 0:256].astype(np.float32) - 128
    r = np.hypot(xx, yy)
    w = np.maximum(corr, 0) * ((r >= WIDE['sun']['reach'][0]) & (r <= WIDE['sun']['reach'][1]))
    d = np.array([(w * xx).sum(), (w * yy).sum()])
    return d / np.linalg.norm(d)


def middle():
    """The flat picture of the child at the scale of the plate, cut to whole cells: (picture in display values, offset)."""
    f = flat()
    size = int(round(f.shape[0] * K0))
    keep = size // (2 * C) * (2 * C)
    pic = lay.to_value(cv2.resize(f, (size, size), interpolation=cv2.INTER_AREA))
    o = (size - keep) // 2
    return pic[o:o + keep, o:o + keep], (SIZE - keep) // 2


def load():
    return np.load(OUT / 'canvas.npy'), np.load(OUT / 'known.npy'), json.loads((OUT / 'windows.json').read_text())


def save(canvas, known, wins):
    np.save(OUT / 'canvas.npy', canvas)
    np.save(OUT / 'known.npy', known)
    (OUT / 'windows.json').write_text(json.dumps(wins, indent=1))


def start(wins=()):
    (OUT / 'win').mkdir(parents=True, exist_ok=True)
    mid, at = middle()
    canvas = np.zeros((SIZE, SIZE), np.uint16)
    canvas[at:at + mid.shape[0], at:at + mid.shape[0]] = np.clip(mid * 65535 + 0.5, 0, 65535).astype(np.uint16)
    known = np.zeros((SIZE // C, SIZE // C), bool)
    known[at // C:(at + mid.shape[0]) // C, at // C:(at + mid.shape[0]) // C] = True
    save(canvas, known, list(wins))
    print('plate', SIZE, 'middle', mid.shape[0], 'at', at, 'cells known', int(known.sum()), 'of', known.size)


def grown(mask, cells):
    k = 2 * cells + 1
    return cv2.dilate(mask.astype(np.uint8), np.ones((k, k), np.uint8)) > 0


def laid_cells(known, taken, x, y):
    """The cells of the window at cell (x, y) that a take may fill: empty, within `reach` of picture inside the window, and
    not within `gap` of picture the window does not show: picture outside it, and cells another window of the wave fills."""
    w = N // C
    g = WIN['gap'] // C
    n = known.shape[0]
    y0, y1, x0, x1 = max(y - g, 0), min(y + w + g, n), max(x - g, 0), min(x + w + g, n)
    unseen = known[y0:y1, x0:x1].copy()
    unseen[y - y0:y - y0 + w, x - x0:x - x0 + w] = False
    unseen |= taken[y0:y1, x0:x1]
    near = grown(unseen, g)[y - y0:y - y0 + w, x - x0:x - x0 + w]
    k = known[y:y + w, x:x + w]
    far = cv2.distanceTransform((~k).astype(np.uint8), cv2.DIST_L2, 5) * C > WIN['reach']
    return ~k & ~near & ~far


_SKETCH = []


def sketch():
    """The layout of the new picture as a flat sketch in three tones over the whole plate, from a seed: a pale blob where a
    tower stands, a dark streak where its shadow falls (along the direction of the shadows of the child), plain grey for the
    deck. Towers stand scattered, more of them where a slow wave is high, and some in rows. Only the windows' inputs show it;
    it tells a take where its towers go, so a take cannot fill its empty part with a copy of the part that is there."""
    if _SKETCH:
        return _SKETCH[0]
    K = WIDE['sketch']
    rng = np.random.default_rng(K['seed'])
    d = sun()
    small = SIZE // 16
    z = cv2.GaussianBlur(rng.standard_normal((small, small)).astype(np.float32), (0, 0), K['wave'] / 16)
    z = cv2.resize(z / z.std(), (SIZE, SIZE), interpolation=cv2.INTER_LINEAR)
    lo, hi = K['share']
    share = lo + (hi - lo) / (1 + np.exp(-1.6 * z))
    towers = []
    grid = {}
    apart = K['apart']

    def free(x, y):
        gx, gy = int(x // apart), int(y // apart)
        for yy in range(gy - 1, gy + 2):
            for xx in range(gx - 1, gx + 2):
                for (px, py) in grid.get((xx, yy), ()):
                    if (px - x) ** 2 + (py - y) ** 2 < apart * apart:
                        return False
        return True

    def put(x, y, r):
        if not (0 <= x < SIZE and 0 <= y < SIZE) or not free(x, y):
            return False
        grid.setdefault((int(x // apart), int(y // apart)), []).append((x, y))
        towers.append((x, y, r))
        return True

    def radius():
        m, spread, least, most = K['radius']
        return float(np.clip(m * np.exp(spread * rng.standard_normal()), least, most))

    area = SIZE * SIZE / 1e6
    for _ in range(int(K['rows']['perMpx'] * area)):
        x, y = rng.uniform(0, SIZE, 2)
        a = rng.uniform(0, 2 * np.pi)
        bend = rng.uniform(-K['rows']['bend'], K['rows']['bend'])
        r = radius()
        for _ in range(int(rng.integers(K['rows']['count'][0], K['rows']['count'][1] + 1))):
            put(x, y, r * float(rng.uniform(0.8, 1.25)))
            step = r * rng.uniform(*K['rows']['step'])
            a += bend
            x, y = x + step * np.cos(a), y + step * np.sin(a)
    for _ in range(int(K['perMpx'] * area * hi / (0.5 * (lo + hi)))):
        x, y = rng.uniform(0, SIZE, 2)
        if rng.uniform() < share[int(y), int(x)] / hi:
            put(x, y, radius())
    shade = np.zeros((SIZE, SIZE), np.float32)
    top = np.zeros((SIZE, SIZE), np.float32)
    blobs = []
    for (x, y, r) in towers:
        lobes = [(x, y, r)]
        for _ in range(K['lobes']):
            a, q = rng.uniform(0, 2 * np.pi), rng.uniform(0.45, 0.85)
            lobes.append((x + q * r * np.cos(a), y + q * r * np.sin(a), r * rng.uniform(0.45, 0.7)))
        blobs.append(lobes)
        reach = r * rng.uniform(*K['shadow'])
        for (lx, ly, lr) in lobes:
            for t in np.linspace(0, 1, 16):
                cv2.circle(shade, (int(lx + d[0] * reach * t), int(ly + d[1] * reach * t)), max(int(lr * (1 - K['taper'] * t)), 2), 1.0, -1, cv2.LINE_AA)
    for lobes in blobs:
        for (lx, ly, lr) in lobes:
            cv2.circle(top, (int(lx), int(ly)), int(lr), 1.0, -1, cv2.LINE_AA)
    shade = cv2.GaussianBlur(shade, (0, 0), K['soft'][1])
    top = cv2.GaussianBlur(top, (0, 0), K['soft'][0])
    img = K['tones']['deck'] + (K['tones']['shadow'] - K['tones']['deck']) * shade
    _SKETCH.append((img + (K['tones']['tower'] - img) * top).astype(np.float32))
    return _SKETCH[0]


def upright(there, new):
    """True when the new cells of a window lie above or below its picture rather than beside it. Such a window is shown to the
    take turned about its falling diagonal (rows for columns), so its picture stands beside the empty part: takes fill an
    empty part above or below a picture with a copy of the picture far more often. The shadows fall along that diagonal
    within a degree, so the turned window is lit as the plate is; the take is turned back before it is laid."""
    if not new.any() or not there.any():
        return False
    yy, xx = np.mgrid[0:there.shape[0], 0:there.shape[1]]
    return bool(abs(yy[new].mean() - yy[there].mean()) > abs(xx[new].mean() - xx[there].mean()))


def write_input(i, canvas, there, x, y, turn=False):
    """The input of window i: the picture that is there, the rest the sketch of the layout. The picture ends in the sketch along
    a soft line that wanders and never reaches the border of the cells, so the take shows no border where it begins."""
    k = np.kron(there, np.ones((C, C), bool))
    pic = canvas[y:y + N, x:x + N].astype(np.float32) / 65535
    rng = np.random.default_rng(WIDE['edge']['seed'] + i)
    d = cv2.distanceTransform(k.astype(np.uint8), cv2.DIST_L2, 5) / N
    wave = np.zeros((N, N), np.float32)
    for amount, sigma in WIDE['edge']['wander']:
        z = cv2.GaussianBlur(rng.standard_normal((N, N)).astype(np.float32), (0, 0), sigma)
        wave += amount * z / z.std()
    bound = WIDE['edge']['bound']
    t = np.clip((d - bound + np.clip(wave, -bound, bound)) / WIDE['edge']['fade'], 0, 1) * k
    m = t * t * (3 - 2 * t)
    g = sketch()[y:y + N, x:x + N] * (1 - m) + pic * m
    g = np.ascontiguousarray(g.T) if turn else g
    cv2.imwrite(str(OUT / 'win' / ('%02d-in.png' % i)), cv2.cvtColor(np.clip(g * 255 + 0.5, 0, 255).astype(np.uint8), cv2.COLOR_GRAY2BGR))


def straight(g):
    """The strongest straight line of a picture along its rows and its columns: the mean step from one row (column) to the
    next, over its median along the picture; (ratio, row), (ratio, column)."""
    out = []
    for axis in (0, 1):
        d = np.abs(np.diff(g, axis=axis)).mean(axis=1 - axis)[8:-8]
        med = np.array([np.median(d[max(j - 15, 0):j + 16]) for j in range(d.size)])
        r = d / np.maximum(med, 1e-6)
        j = int(np.argmax(r))
        out.append((round(float(r[j]), 2), j + 8))
    return out


def twice(g):
    """How far a picture holds the same forms twice: the highest value of its own correlation at a shift of more than 320
    pixels (forms under 96 pixels, at a quarter of the size), and that shift in pixels."""
    n = g.shape[0] // 4
    s = cv2.resize(g, (n, n), interpolation=cv2.INTER_AREA)
    h = s - cv2.GaussianBlur(s, (0, 0), 12)
    h = h - h.mean()
    f = np.fft.fft2(h)
    ac = np.fft.fftshift(np.real(np.fft.ifft2(f * np.conj(f)))) / float((h * h).sum())
    yy, xx = np.mgrid[0:n, 0:n] - n // 2
    ac[np.hypot(xx, yy) < 80] = 0
    k = np.unravel_index(int(np.argmax(ac)), ac.shape)
    return round(float(ac[k]), 3), [int(xx[k]) * 4, int(yy[k]) * 4]


def plan():
    canvas, known, wins = load()
    n = known.shape[0]
    w = N // C
    wave = 1 + max([q['wave'] for q in wins], default=0)
    taken = np.zeros((n, n), bool)
    for q in wins:
        # A window that is planned and not laid yet keeps its cells.
        if q['take'] is None:
            taken[q['y'] // C:q['y'] // C + w, q['x'] // C:q['x'] // C + w] |= np.load(OUT / 'win' / ('%02d-new.npy' % q['id']))
    picks = []
    # First the windows whose new cells are held from two sides: picture in their row and picture in their column inside the
    # window. A take of such a window cannot fill its empty part with a shifted copy. Then windows with picture on one side.
    for held in (True, False):
        while len(picks) < WIN['most']:
            best = None
            for y in range(n - w + 1):
                for x in range(n - w + 1):
                    k = known[y:y + w, x:x + w]
                    share = float(k.mean())
                    if share < WIN['context'] or share == 1 or any(max(abs(x * C - q['x']), abs(y * C - q['y'])) < WIN['shun'] for q in wins if q['take'] == 0):
                        continue
                    new = laid_cells(known, taken, x, y)
                    if held:
                        new = new & k.any(axis=1)[:, None] & k.any(axis=0)[None, :]
                    # Most new picture first; of equals the window nearest the middle.
                    score = float(new.sum()) - 0.02 * np.hypot(x + w / 2 - n / 2, y + w / 2 - n / 2)
                    if new.any() and (best is None or score > best[0]):
                        best = (score, x, y, new)
            if best is None or ((picks or held) and best[3].sum() < WIN['least'] * w * w):
                break
            _, x, y, new = best
            picks.append((x, y, new))
            taken[y:y + w, x:x + w] |= new
    if not picks:
        print('nothing left to paint; cells empty:', int((~known).sum()))
        return
    for x, y, new in picks:
        i = len(wins)
        turn = upright(known[y:y + w, x:x + w], new)
        write_input(i, canvas, known[y:y + w, x:x + w], x * C, y * C, turn)
        np.save(OUT / 'win' / ('%02d-new.npy' % i), new)
        np.save(OUT / 'win' / ('%02d-there.npy' % i), known[y:y + w, x:x + w])
        wins.append({'id': i, 'wave': wave, 'x': x * C, 'y': y * C, 'there': round(float(known[y:y + w, x:x + w].mean()), 3), 'new': int(new.sum()) * C * C, 'turn': turn, 'take': None})
        print('window', i, 'wave', wave, 'at', x * C, y * C, 'there', wins[-1]['there'], 'new', round(wins[-1]['new'] / 1e6, 2), 'Mpx', 'turned' if turn else '')
    save(canvas, known, wins)
    print('cells empty after this wave:', int((~known & ~taken).sum()), 'of', known.size)


def least_cut(diff, there, new):
    """Over the picture that is there, within `band` of the new part: 1 where the take is used. The line between the two sides
    is the cut of least summed difference (a least cut of the grid, at one in `step` pixels)."""
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import breadth_first_order, maximum_flow
    step = WIDE['cut']['step']
    n = N // step
    d = cv2.resize(cv2.GaussianBlur(diff, (0, 0), WIDE['cut']['smooth']), (n, n), interpolation=cv2.INTER_AREA)
    ks = cv2.resize(there.astype(np.float32), (n, n), interpolation=cv2.INTER_AREA) > 0.5
    ns = cv2.resize(new.astype(np.float32), (n, n), interpolation=cv2.INTER_AREA) > 0.5
    reach = cv2.distanceTransform((~ns).astype(np.uint8), cv2.DIST_L2, 5)
    band = ks & (reach <= WIDE['cut']['band'] / step)
    out = np.zeros((n, n), np.float32)
    count = int(band.sum())
    if count == 0:
        return cv2.resize(out, (N, N)), 0
    idx = np.full((n, n), -1, np.int64)
    idx[band] = np.arange(count)
    cross = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]], np.uint8)
    rim = np.zeros((n, n), bool)
    rim[0, :] = rim[-1, :] = rim[:, 0] = rim[:, -1] = True
    to_old = band & ((cv2.dilate((ks & ~band).astype(np.uint8), cross) > 0) | rim)
    to_new = band & (cv2.dilate(ns.astype(np.uint8), cross) > 0) & ~to_old
    rows, cols, caps = [], [], []
    for dy, dx in ((0, 1), (1, 0)):
        a = band[:n - dy, :n - dx] & band[dy:, dx:]
        i, j = idx[:n - dy, :n - dx][a], idx[dy:, dx:][a]
        cap = ((d[:n - dy, :n - dx][a] + d[dy:, dx:][a]) * 1000).astype(np.int64) + 1
        rows += [i, j]
        cols += [j, i]
        caps += [cap, cap]
    src, snk = count, count + 1
    big = 10 ** 8
    rows += [np.full(int(to_new.sum()), src), idx[to_old]]
    cols += [idx[to_new], np.full(int(to_old.sum()), snk)]
    caps += [np.full(int(to_new.sum()), big), np.full(int(to_old.sum()), big)]
    graph = csr_matrix((np.concatenate(caps).astype(np.int32), (np.concatenate(rows), np.concatenate(cols))), shape=(count + 2, count + 2))
    side = np.zeros(count + 2, bool)
    if to_old.any() and to_new.any():
        res = maximum_flow(graph, src, snk)
        left = (graph - res.flow).tocsr()
        left.data = np.where(left.data > 0, 1, 0).astype(np.int32)
        left.eliminate_zeros()
        side[breadth_first_order(left, src, directed=True, return_predecessors=False)] = True
        cost = int(res.flow_value)
    else:
        side[:] = not to_old.any()
        cost = 0
    out[band] = side[:count]
    return cv2.resize(out, (N, N), interpolation=cv2.INTER_NEAREST), cost


def high(x, sigma):
    return x - cv2.GaussianBlur(x, (0, 0), sigma)


def lay_takes(specs, state=None):
    canvas, known, wins = state or load()
    w = N // C
    (OUT / 'view').mkdir(exist_ok=True)
    for spec in specs:
        force = spec.endswith('+')
        i, take = (int(v) for v in spec.rstrip('+').split(':'))
        win = wins[i]
        if win['take'] is not None and state is None:
            raise SystemExit('window %d is laid' % i)
        x, y = win['x'], win['y']
        img = cv2.imread(str(OUT / 'win' / ('%02d-take-%d.png' % (i, take))), cv2.IMREAD_COLOR)
        if img is None:
            raise SystemExit('missing take %d of window %d' % (take, i))
        if img.shape[0] != N or img.shape[1] != N:
            raise SystemExit('take %d of window %d is %d x %d, not %d' % (take, i, img.shape[1], img.shape[0], N))
        if win.get('turn'):
            img = np.ascontiguousarray(img.transpose(1, 0, 2))
        tint = float(np.abs(img.astype(np.float32) - img.astype(np.float32).mean(-1, keepdims=True)).mean())
        gen = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
        lines = straight(gen)
        copy = twice(gen)
        if (max(lines[0][0], lines[1][0]) > WIDE['judge']['line'] or copy[0] > WIDE['judge']['twice']) and not force and state is None:
            print('window', i, 'take', take, 'NOT LAID: straight line, rows', lines[0], 'columns', lines[1], '; the same forms twice', copy)
            continue
        old = canvas[y:y + N, x:x + N].astype(np.float32) / 65535
        # What the take was shown: the picture that was there when the window was planned.
        there = np.kron(np.load(OUT / 'win' / ('%02d-there.npy' % i)), np.ones((C, C), bool))
        new = np.kron(np.load(OUT / 'win' / ('%02d-new.npy' % i)), np.ones((C, C), bool))
        # Tone: the take's low frequencies are locked to the picture that is there; away from it, to the ratio of the whole.
        m = there.astype(np.float32)
        s = WIDE['lock']['sigma']
        whole = float((old * m).sum() / max(float((gen * m).sum()), 1e-6))
        f = WIDE['lock']['floor']
        ratio = (cv2.GaussianBlur(old * m, (0, 0), s) + f * whole) / (cv2.GaussianBlur(gen * m, (0, 0), s) + f)
        gen = np.clip(gen * np.clip(ratio, 1 / WIDE['lock']['most'], WIDE['lock']['most']), 0, 1)
        side, cost = least_cut(np.abs(gen - old) * m, there, new)
        a = np.where(there, cv2.GaussianBlur(np.maximum(side, new.astype(np.float32)), (0, 0), WIDE['cut']['feather']), 0)
        a = np.where(new, 1.0, a).astype(np.float32)
        out = np.where(there | new, old * (1 - a) + gen * a, old)
        canvas[y:y + N, x:x + N] = np.clip(out * 65535 + 0.5, 0, 65535).astype(np.uint16)
        known[y // C:y // C + w, x // C:x // C + w] |= np.load(OUT / 'win' / ('%02d-new.npy' % i))
        # Measures: the take against what was there (forms kept in place), and the new part against the old in fine detail.
        deep = there & (cv2.distanceTransform(there.astype(np.uint8), cv2.DIST_L2, 5) > 2 * WIDE['edge']['fade'] * N)
        kept = float(np.corrcoef(high(gen, 8)[deep], high(old, 8)[deep])[0, 1]) if deep.sum() > 1000 else float('nan')
        fine = [float(high(gen, q)[new].std() / max(float(high(old, q)[deep].std()), 1e-6)) if deep.sum() > 1000 else float('nan') for q in (1, 3, 8)]
        win.update({'take': take, 'whole': round(whole, 4), 'kept': round(kept, 3), 'fine': [round(v, 3) for v in fine], 'cut': cost, 'tint': round(tint, 2), 'lines': [lines[0][0], lines[1][0]], 'twice': copy[0]})
        print('window', i, 'take', take, 'tone ratio', win['whole'], 'forms kept (corr at 8 px)', win['kept'], 'fine detail new over there at 1, 3, 8 px', win['fine'], 'cut', cost, 'tint', win['tint'], 'straight line, rows and columns', win['lines'], 'twice', win['twice'])
        shown = cv2.imread(str(OUT / 'win' / ('%02d-in.png' % i)), cv2.IMREAD_GRAYSCALE)
        show = np.hstack([shown.T if win.get('turn') else shown, np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)])
        cv2.imwrite(str(OUT / 'view' / ('%02d.jpg' % i)), cv2.resize(show, (2000, 1000), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])
    save(canvas, known, wins)
    cv2.imwrite(str(OUT / 'view' / 'plate.jpg'), cv2.resize((canvas >> 8).astype(np.uint8), (1536, 1536), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])
    print('cells empty:', int((~known).sum()), 'of', known.size)


def again():
    """The plate from its middle, with the kept take of every window laid in the order of the list."""
    _, _, wins = load()
    start(wins)
    canvas, known, _ = load()
    lay_takes(['%d:%d' % (q['id'], q['take']) for q in wins if q['take']], (canvas, known, wins))


def undo(ids):
    """Takes the kept takes of these windows out again; the plate is then laid again from its middle."""
    canvas, known, wins = load()
    for i in ids:
        wins[int(i)]['take'] = None
    save(canvas, known, wins)
    again()


def cut_again(ids):
    """Writes the inputs of windows that are planned and not laid again, from the plate as it is."""
    canvas, known, wins = load()
    for i in (int(v) for v in ids):
        if wins[i]['take'] is not None:
            raise SystemExit('window %d is laid' % i)
        there = np.load(OUT / 'win' / ('%02d-there.npy' % i))
        wins[i]['turn'] = upright(there, np.load(OUT / 'win' / ('%02d-new.npy' % i)))
        write_input(i, canvas, there, wins[i]['x'], wins[i]['y'], wins[i]['turn'])
        print('input of window', i, 'written', 'turned' if wins[i]['turn'] else '')
    save(canvas, known, wins)


def give_up(ids):
    """A window that is planned and not laid is given up: no take of it is kept, and the next plan keeps `shun` pixels from it."""
    canvas, known, wins = load()
    for i in (int(v) for v in ids):
        if wins[i]['take'] is not None:
            raise SystemExit('window %d is laid or given up' % i)
        wins[i]['take'] = 0
    save(canvas, known, wins)


def drop(ids):
    canvas, known, wins = load()
    for i in sorted((int(v) for v in ids), reverse=True):
        if wins[i]['take'] is not None or i != len(wins) - 1:
            raise SystemExit('window %d is laid or is not the last of the list' % i)
        wins.pop()
    save(canvas, known, wins)


def export():
    canvas, known, _ = load()
    if not known.all():
        raise SystemExit('the plate is not whole: %d cells empty' % int((~known).sum()))
    plate = (canvas.astype(np.float32) / 257 + 0.5).astype(np.uint8)
    cv2.imwrite(str(OUT / 'plate.png'), plate)
    for folder, size in (('full', SIZE), ('web', SIZE // 2)):
        out = plate if size == SIZE else cv2.resize(plate, (size, size), interpolation=cv2.INTER_AREA)
        path = ROOT / 'public/assets/venus' / folder / V['file']
        cv2.imwrite(str(path), out, [cv2.IMWRITE_JPEG_QUALITY, WIDE['quality']])
        print(path.relative_to(ROOT), size, round(path.stat().st_size / 1e6, 2), 'MB')


def check():
    """By distance from the middle: tone, fine detail against the middle, and the direction of the shadows by quarter."""
    canvas, known, wins = load()
    plate = canvas.astype(np.float32) / 65535
    mid, at = middle()
    diff = np.abs(plate[at:at + mid.shape[0], at:at + mid.shape[0]] - mid) * 255
    yy, xx = np.mgrid[0:mid.shape[0], 0:mid.shape[0]].astype(np.float32)
    inside = np.hypot(xx - mid.shape[0] / 2, yy - mid.shape[0] / 2) < 0.8 * mid.shape[0] / 2
    print('middle against the child inside 0.8 of its half width (display values of 255): mean', round(float(diff[inside].mean()), 3), 'most', round(float(diff[inside].max()), 1))
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    r = np.maximum(np.abs(xx - SIZE / 2), np.abs(yy - SIZE / 2)) / (SIZE / 2)
    del yy, xx
    h1, h3, h8 = (np.abs(high(plate, q)) for q in (1, 3, 8))
    base = None
    for a, b in ((0.0, 0.3), (0.36, 0.5), (0.5, 0.65), (0.65, 0.8), (0.8, 0.9), (0.9, 1.0)):
        m = (r >= a) & (r < b)
        row = [float(plate[m].mean()), float(plate[m].std()), float(h1[m].mean()), float(h3[m].mean()), float(h8[m].mean())]
        base = base or row
        print('square ring', a, 'to', b, 'of the half width: mean', round(row[0] * 255, 1), 'spread', round(row[1] * 255, 1), 'fine detail over the middle at 1, 3, 8 px', [round(row[i] / base[i], 3) for i in (2, 3, 4)])
    for name, (y0, x0) in (('upper left', (0, 0)), ('upper right', (0, SIZE // 2)), ('lower left', (SIZE // 2, 0)), ('lower right', (SIZE // 2, SIZE // 2)), ('middle', (SIZE // 4, SIZE // 4))):
        part = lay.to_light(plate[y0:y0 + SIZE // 2, x0:x0 + SIZE // 2])
        d = sun(np.ascontiguousarray(part) / max(float(np.median(part)), 1e-6) * WIDE['level'])
        print('shadows,', name, 'quarter: along', np.round(d, 3), 'turn', round(float(np.degrees(np.arctan2(d[1], d[0]))), 1), 'deg')
    takes = [w['take'] for w in wins]
    print('windows', len(wins), 'laid', sum(bool(t) for t in takes), 'given up', takes.count(0), 'takes kept by number', {t: takes.count(t) for t in sorted(set(t for t in takes if t))})


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'sun':
        print(np.round(sun(), 4))
    elif cmd == 'start':
        start()
    elif cmd == 'plan':
        plan()
    elif cmd == 'lay':
        lay_takes(sys.argv[2:])
    elif cmd == 'again':
        again()
    elif cmd == 'undo':
        undo(sys.argv[2:])
    elif cmd == 'cut':
        cut_again(sys.argv[2:])
    elif cmd == 'void':
        give_up(sys.argv[2:])
    elif cmd == 'drop':
        drop(sys.argv[2:])
    elif cmd == 'export':
        export()
    elif cmd == 'check':
        check()
    else:
        raise SystemExit(__doc__)
