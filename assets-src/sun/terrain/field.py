import json
import sys
import numpy as np
import cv2
from common import WORK, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, TX, TY, FEET, read, write, step, scene, display

OUT = 'public/assets/sun'
DIR = f'{WORK}/field'
SCALE = 320
SUPER = 3
BOX = (-4.6, 4.6, -3.2, 3.8)
TILE = 4096
STEP = 128
LAP = 64
BLOCK = STEP + LAP
TOLERANCE = 0.12
CROWD = 3.0
FLATTEN = (220, 0.75)
REF_MU = 0.25
SOURCES = ('apron',)
SPOT_CLEAR = 1.35
FOOT_CLEAR = 0.7
RING = (0.75, 3.15)
PHI = 0.78
SEED = 20261121

T = json.load(open('src/stops/sun/terrain.json'))
A = json.load(open('src/stops/sun/apron.json'))
DOWN = np.array(T['down'], dtype=np.float64)
DOWN /= np.linalg.norm(DOWN)
RADIUS = T['radius']
CENTRE = DOWN * (RADIUS + 1)
FWD = np.array([0, 0, -1.0]) + DOWN * DOWN[2]
FWD /= np.linalg.norm(FWD)
RIGHT = np.cross(FWD, -DOWN)
RIGHT /= np.linalg.norm(RIGHT)


def limb(mu):
    m = np.maximum(mu, 0.1) - 0.1
    return 0.15 + 0.12 * np.exp(-m / 0.35) + 0.25 * np.exp(-m / 0.05)


def quat(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


def ground(gx, gy):
    y = np.sqrt(np.maximum(RADIUS * RADIUS - gx * gx - gy * gy, 0)) - RADIUS
    return DOWN[None, None, :] * (1 - y)[..., None] + RIGHT[None, None, :] * gx[..., None] + FWD[None, None, :] * gy[..., None]


def on_image(ax, ay):
    d = np.array([(ax - 0.5) * 2 * TX, (0.5 - ay) * 2 * TY, -1.0])
    d /= np.linalg.norm(d)
    b = d @ CENTRE
    t = b - np.sqrt(b * b - (CENTRE @ CENTRE - RADIUS * RADIUS))
    p = d * t - DOWN
    return np.array([p @ RIGHT, p @ FWD])


def grade_row(row):
    g = cv2.imread(f'{OUT}/full/grade.png', cv2.IMREAD_UNCHANGED)
    g = cv2.cvtColor(g, cv2.COLOR_BGRA2RGBA if g.shape[2] == 4 else cv2.COLOR_BGR2RGB)
    return g[row, :, :3].astype(np.float32) / 255


def graded(img, table):
    out = np.empty(img.shape, dtype=np.float32)
    for c in range(3):
        out[..., c] = table[:, c][img[..., c]]
    return out


def ortho():
    plate = read(f'{OUT}/full/plate.jpg')
    apron = read(f'{OUT}/full/apron.jpg')
    table = grade_row(0)
    s = SCALE * SUPER
    w = int(round((BOX[1] - BOX[0]) * s))
    h = int(round((BOX[3] - BOX[2]) * s))
    spot = on_image(*T['spot'])
    feet = [on_image(*f) for f in T['feet']]
    eye = np.array(A['position'], dtype=np.float64)
    q = A['quaternion']
    right = quat(q, np.array([1.0, 0, 0]))
    up = quat(q, np.array([0, 1.0, 0]))
    back = quat(q, np.array([0, 0, 1.0]))
    rel = eye - DOWN
    nadir = np.array([rel @ RIGHT, rel @ FWD])
    outs = {k: np.zeros((h // SUPER, w // SUPER, 3), np.float32) for k in ('plate', 'apron')}
    masks = {k: np.zeros((h // SUPER, w // SUPER), np.float32) for k in ('plate', 'apron')}
    band = 64 * SUPER
    for y0 in range(0, h, band):
        y1 = min(y0 + band, h)
        gx, gy = np.meshgrid(BOX[0] + (np.arange(w) + 0.5) / s, BOX[3] - (np.arange(y0, y1) + 0.5) / s)
        p = ground(gx, gy)
        normal = (p - CENTRE) / RADIUS
        clear = (np.hypot(gx - spot[0], gy - spot[1]) > SPOT_CLEAR)
        for f in feet:
            clear &= np.hypot(gx - f[0], gy - f[1]) > FOOT_CLEAR
        dist = np.linalg.norm(p, axis=-1)
        ax = p[..., 0] / np.maximum(-p[..., 2], 0.02) / (2 * TX) + 0.5
        ay = 0.5 - p[..., 1] / np.maximum(-p[..., 2], 0.02) / (2 * TY)
        px = (ax - LEFT) / SPAN * CANVAS[0] - 0.5
        py = (ay - TOP) / SPAN * CANVAS[1] - PLATE_TOP - 0.5
        graze = np.clip(-(normal * p).sum(-1) / dist, 0, 1)
        col = scene(graded(cv2.remap(plate, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT), table))
        col *= (limb(REF_MU) / limb(graze))[..., None]
        ring = np.hypot(gx, gy)
        phi = np.arctan2(gx - 0.0234, gy + 0.3764)
        ok = clear & (ring > RING[0]) & (ring < RING[1]) & (np.abs(phi) < PHI) & (-p[..., 2] > 0.3) & (ax > 0.02) & (ax < 0.98) & (ay < 0.98)
        outs['plate'][y0 // SUPER:y1 // SUPER] = cv2.resize(col, (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
        masks['plate'][y0 // SUPER:y1 // SUPER] = cv2.resize(ok.astype(np.float32), (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
        r = p - eye
        z = np.maximum(-(r @ back), 0.02)
        bx = (r @ right) / z / (2 * TX) + 0.5
        by = 0.5 - (r @ up) / z / (2 * TY)
        qx = bx * apron.shape[1] - 0.5
        qy = (by - A['top']) / (1 - A['top']) * apron.shape[0] - 0.5
        away = np.linalg.norm(r, axis=-1)
        seen = np.clip(-(normal * r).sum(-1) / away, 0, 1)
        col = scene(graded(cv2.remap(apron, qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT), table))
        col *= (limb(REF_MU) / limb(seen))[..., None]
        near = np.hypot(gx - nadir[0], gy - nadir[1])
        ok = clear & (bx > 0.03) & (bx < 0.97) & (by > A['top'] + 0.03) & (by < 0.97) & (near < A['near'][0]) & (-(r @ back) > 0.3)
        outs['apron'][y0 // SUPER:y1 // SUPER] = cv2.resize(col, (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
        masks['apron'][y0 // SUPER:y1 // SUPER] = cv2.resize(ok.astype(np.float32), (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
    for k in outs:
        np.save(f'{DIR}/ortho-{k}.npy', outs[k])
        np.save(f'{DIR}/mask-{k}.npy', masks[k])
        show = display(outs[k]) * (0.35 + 0.65 * masks[k][..., None])
        write(f'{DIR}/ortho-{k}.jpg', show, 90)
    print('ortho', outs['plate'].shape, 'valid plate', float(masks['plate'].mean()), 'apron', float(masks['apron'].mean()))


def sources():
    out = []
    for k in SOURCES:
        img = display(np.load(f'{DIR}/ortho-{k}.npy'))
        ok = (np.load(f'{DIR}/mask-{k}.npy') > 0.995).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(ok)
        for i in range(1, n):
            x, y, w, h, area = st[i]
            if area < BLOCK * BLOCK * 2:
                continue
            part = np.ascontiguousarray(img[y:y + h, x:x + w])
            good = (lab[y:y + h, x:x + w] == i).astype(np.float32)
            full = cv2.matchTemplate(good, np.ones((BLOCK, BLOCK), np.float32), cv2.TM_CCORR) > BLOCK * BLOCK - 0.5
            if full.sum() < 50:
                continue
            small = cv2.resize(part, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
            fits = np.zeros((small.shape[0] - BLOCK // 2 + 1, small.shape[1] - BLOCK // 2 + 1), bool)
            sub = full[::2, ::2]
            fits[:min(sub.shape[0], fits.shape[0]), :min(sub.shape[1], fits.shape[1])] = sub[:fits.shape[0], :fits.shape[1]]
            out.append({'name': f'{k}{i}', 'img': part, 'small': small, 'sq': small * small, 'fits': fits, 'used': np.zeros(fits.shape, np.float32)})
            print('source', k, i, part.shape, 'places', int(fits.sum()))
    return out


def path(e):
    cost = e.copy()
    for r in range(1, e.shape[0]):
        prev = cost[r - 1]
        best = np.minimum(prev, np.minimum(np.concatenate(([np.inf], prev[:-1])), np.concatenate((prev[1:], [np.inf]))))
        cost[r] += best
    out = np.zeros(e.shape[0], np.int64)
    c = int(np.argmin(cost[-1]))
    for r in range(e.shape[0] - 1, -1, -1):
        out[r] = c
        if r:
            lo = max(c - 1, 0)
            c = lo + int(np.argmin(cost[r - 1, lo:min(c + 2, e.shape[1])]))
    return out


def quilt():
    rng = np.random.default_rng(SEED)
    src = sources()
    n = TILE // STEP
    canvas = np.zeros((TILE, TILE, 3), np.float32)
    filled = np.zeros((TILE, TILE), np.float32)
    half = BLOCK // 2
    ones = np.ones((half, half, 3), np.float32)
    bump = cv2.getGaussianKernel(half + 1, half / 4)
    bump = (bump @ bump.T) / (bump.max() ** 2)
    log = []
    for i in range(n):
        for j in range(n):
            ys = (i * STEP + np.arange(BLOCK)) % TILE
            xs = (j * STEP + np.arange(BLOCK)) % TILE
            t = canvas[np.ix_(ys, xs)]
            m = filled[np.ix_(ys, xs)]
            ts = cv2.resize(t, (half, half), interpolation=cv2.INTER_AREA)
            ms = cv2.resize(m, (half, half), interpolation=cv2.INTER_AREA)
            m3 = np.repeat(ms[..., None], 3, axis=2)
            best = []
            for k, s in enumerate(src):
                if ms.max() > 0:
                    err = cv2.matchTemplate(s['sq'], m3, cv2.TM_CCORR) - 2 * cv2.matchTemplate(s['small'], m3 * ts, cv2.TM_CCORR) + float((m3 * ts * ts).sum())
                    err = np.maximum(err, 0) / max(float(m3.sum()), 1)
                else:
                    err = np.full(s['fits'].shape, 0.01, np.float32)
                cost = (err + 2e-4) * (1 + CROWD * s['used'])
                cost[~s['fits']] = np.inf
                best.append(cost)
            low = min(float(c.min()) for c in best)
            picks = []
            for k, c in enumerate(best):
                yy, xx = np.where(c <= low * (1 + TOLERANCE))
                picks += [(k, int(a), int(b)) for a, b in zip(yy, xx)]
            k, y, x = picks[int(rng.integers(len(picks)))]
            s = src[k]
            u = s['used']
            y0, y1 = max(y - half // 2, 0), min(y + half // 2 + 1, u.shape[0])
            x0, x1 = max(x - half // 2, 0), min(x + half // 2 + 1, u.shape[1])
            u[y0:y1, x0:x1] += bump[y0 - y + half // 2:y1 - y + half // 2, x0 - x + half // 2:x1 - x + half // 2]
            p = s['img'][2 * y:2 * y + BLOCK, 2 * x:2 * x + BLOCK]
            e = ((p - t) ** 2).sum(-1)
            new = np.ones((BLOCK, BLOCK), np.float32)
            if j > 0:
                c = path(e[:, :LAP])
                new *= (np.arange(BLOCK)[None, :] >= c[:, None]).astype(np.float32)
            if i > 0:
                c = path(e[:LAP, :].T.copy())
                new *= (np.arange(BLOCK)[:, None] >= c[None, :]).astype(np.float32)
            if j == n - 1:
                c = path(e[:, STEP:])
                new *= (np.arange(BLOCK)[None, :] <= STEP + c[:, None]).astype(np.float32)
            if i == n - 1:
                c = path(e[STEP:, :].T.copy())
                new *= (np.arange(BLOCK)[:, None] <= STEP + c[None, :]).astype(np.float32)
            soft = cv2.GaussianBlur(new, (0, 0), 1.2)
            soft = np.where(m > 0, soft, 1.0)[..., None]
            canvas[np.ix_(ys, xs)] = soft * p + (1 - soft) * t
            filled[np.ix_(ys, xs)] = 1
            log.append((s['name'], y, x, low))
        print('row', i, flush=True)
    np.save(f'{DIR}/quilt.npy', canvas)
    names = sorted(set(l[0] for l in log))
    print('blocks by source', {a: sum(1 for l in log if l[0] == a) for a in names}, 'mean match error', float(np.mean([l[3] for l in log])))
    write(f'{DIR}/quilt.jpg', canvas, 90)


def finish():
    tile = np.load(f'{DIR}/quilt.npy')
    lum = np.log(np.maximum(tile @ np.array([0.3, 0.5, 0.2], np.float32), 0.02))
    pad = FLATTEN[0] * 3
    wide = cv2.GaussianBlur(np.pad(lum, pad, mode='wrap'), (0, 0), FLATTEN[0])[pad:-pad, pad:-pad]
    gain = np.exp(-(wide - wide.mean()) * FLATTEN[1])
    lin = np.clip(tile, 0, 1) ** 2.2 * gain[..., None]
    tile = np.clip(lin, 0, 1) ** (1 / 2.2)
    print('flatten gain', float(gain.min()), float(gain.max()), 'mean', tile.reshape(-1, 3).mean(0))
    for name, size in (('full', TILE), ('web', TILE // 2)):
        out = tile if size == TILE else cv2.resize(tile, (size, size), interpolation=cv2.INTER_AREA)
        write(f'{OUT}/{name}/field.jpg', out, 90)
    json.dump({'size': TILE / SCALE, 'tone': REF_MU}, open('src/stops/sun/field.json', 'w'), indent=2)


if __name__ == '__main__':
    {'ortho': ortho, 'quilt': quilt, 'finish': finish}[sys.argv[1]]()
