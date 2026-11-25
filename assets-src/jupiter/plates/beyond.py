import gc
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))
import geom
from layback import filmic, inverse_filmic, linear_to_srgb, srgb_to_linear

ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUB = os.path.join(ROOT, 'public', 'assets', 'jupiter')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'beyond')
deck = json.load(open(os.path.join(STOP, 'deck.json')))
fields = json.load(open(os.path.join(STOP, 'deck-fields.json')))
B = deck['plates']['beyond']
X0, X1, Y0, Y1 = B['box']
STEP = fields['plates']['fore']['size'][0] / fields['plates']['fore']['pixels']['full'][0]
S = 1 / STEP
EPS = B['floor']
CHANGED = ('plate-fore.png', 'plate-near.png', 'deck-fore-height.bin', 'deck-near-height.bin')
def before(kind, file):
    if file not in CHANGED:
        return os.path.join(PUB, kind, file)
    rel = '/'.join(['public', 'assets', 'jupiter', kind, file])
    raw = subprocess.run(['git', 'show', B['from'] + ':' + rel], cwd=ROOT, check=True, capture_output=True).stdout
    kept = os.path.join(tempfile.gettempdir(), 'beyond-' + kind + '-' + file)
    with open(kept, 'wb') as f:
        f.write(raw)
    return kept


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def scene(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(im)).astype(np.float32)


def grid():
    nx, ny = int(round((X1 - X0) * S)), int(round((Y1 - Y0) * S))
    return np.meshgrid(X0 + (np.arange(nx) + 0.5) / S, Y1 - (np.arange(ny) + 0.5) / S)


def height_at(gx, gy):
    lo, hi = fields['heightRange']
    blend = deck['look']['blend']
    left = np.ones(gx.shape, np.float32)
    total = np.zeros(gx.shape, np.float32)
    for name in ('fore', 'near', 'mid'):
        m = fields['maps'][name]
        n = m['pixels']['full']
        raw = np.fromfile(before('full', 'deck-' + name + '-height.bin'), dtype=np.uint16).reshape(n, n).astype(np.float32) / 65535
        u = ((gx - m['centre'][0]) / m['size'] + 0.5) * n - 0.5
        v = ((gy - m['centre'][1]) / m['size'] + 0.5) * n - 0.5
        h = cv2.remap(raw, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        reach = np.maximum(np.abs(gx - m['centre'][0]), np.abs(gy - m['centre'][1])) * 2 / m['size']
        w = left * (1 - smoothstep(blend[0], blend[1], reach))
        total += w * (lo + h * (hi - lo))
        left = left - w
    return total


def plates_at(gx, gy, at):
    join = deck['look']['join']
    total = np.zeros(gx.shape + (3,), np.float32)
    left = np.ones(gx.shape, np.float32)
    for name in ('fore', 'near', 'mid', 'far'):
        pl = fields['plates'][name]
        im = scene(at('full', 'plate-' + name + '.png'))
        texel = pl['size'][0] / im.shape[1]
        if STEP > texel:
            im = cv2.GaussianBlur(im, (0, 0), 0.5 * STEP / texel)
        u = ((gx - pl['centre'][0]) / pl['size'][0] + 0.5) * im.shape[1] - 0.5
        v = (0.5 - (gy - pl['centre'][1]) / pl['size'][1]) * im.shape[0] - 0.5
        col = cv2.remap(im, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        reach = np.maximum(np.abs(gx - pl['centre'][0]) * 2 / pl['size'][0], np.abs(gy - pl['centre'][1]) * 2 / pl['size'][1])
        w = left * (1 - smoothstep(join[0], join[1], reach)) if name != 'far' else left
        for c in range(3):
            total[..., c] += col[..., c] * w
        left = left - w
    return total


def field_at(gx, gy, key):
    cfg = deck[key]
    n = cfg['pixels']
    raw = np.fromfile(os.path.join(PUB, 'full', 'deck-' + key + '.bin'), dtype=np.uint16).reshape(3, n, n).astype(np.float32) / 65535 * cfg['scale']
    u = ((gx - cfg['centre'][0]) / cfg['size'] + 0.5) * n - 0.5
    v = (0.5 - (gy - cfg['centre'][1]) / cfg['size']) * n - 0.5
    return np.stack([cv2.remap(raw[i], u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for i in range(3)], -1)


def canvas_at(gx, gy, h):
    image = scene(os.path.join(PUB, 'full', 'deck-image-wide.jpg'))
    lay = np.zeros(gx.shape + (3,), np.float32)
    px = np.zeros(gx.shape, np.float32)
    py = np.zeros(gx.shape, np.float32)
    inside = np.zeros(gx.shape, bool)
    for r in range(0, gx.shape[0], 256):
        sl = slice(r, r + 256)
        p = geom.from_chart(gx[sl], gy[sl], h[sl])
        qx = geom.W / 2 + geom.F * p[..., 0] / np.maximum(-p[..., 2], 1e-3)
        qy = geom.H / 2 - geom.F * p[..., 1] / np.maximum(-p[..., 2], 1e-3)
        inside[sl] = (-p[..., 2] > 1e-3) & (qx > 0) & (qx < geom.W - 1) & (qy > 0) & (qy < geom.H - 1)
        px[sl] = qx
        py[sl] = qy
        lay[sl] = cv2.remap(image, px[sl], py[sl], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return lay, inside, np.minimum(np.minimum(px, geom.W - 1 - px), np.minimum(py, geom.H - 1 - py))


def chart_at(gx, gy):
    img = cv2.imread(os.path.join(PUB, 'full', 'deck-view-color.png'), cv2.IMREAD_UNCHANGED)
    ox, oy = fields['view']['origin']
    dx, dy = gx - ox, gy - oy
    d = np.sqrt(dx * dx + dy * dy)
    az = np.arctan2(dx, dy)
    psi = np.arctan2(1 + d * d / (2 * geom.R), d)
    t0, t1 = fields['view']['theta']
    p0, p1 = fields['view']['psi']
    mx = ((az - t0) / (t1 - t0) * img.shape[1] - 0.5).astype(np.float32)
    my = ((1 - (psi - p0) / (p1 - p0)) * img.shape[0] - 0.5).astype(np.float32)
    c = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return inverse_filmic(srgb_to_linear(c[..., 2::-1].astype(np.float32) / 255)).astype(np.float32), c[..., 3]


def show(x):
    return (np.clip(x * B['preview']['exposure'], 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)[..., ::-1]


def ground():
    gx, gy = grid()
    h = height_at(gx, gy)
    lay, inside, inset = canvas_at(gx, gy, h)
    ch, alpha = chart_at(gx, gy)
    K = inside & (alpha > 0) & (inset >= B['insetPx'])
    K = cv2.morphologyEx(K.astype(np.uint8), cv2.MORPH_OPEN, np.ones((B['openPx'], B['openPx']), np.uint8)) > 0
    count, lab, stats, _ = cv2.connectedComponentsWithStats(K.astype(np.uint8), 8)
    K = lab == (1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    del lab, alpha
    dout = cv2.distanceTransformWithLabels((~K).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)[0] / S
    tone = field_at(gx, gy, 'tone')
    calm = field_at(gx, gy, 'calm')
    O = plates_at(gx, gy, before) * tone * calm
    np.savez(os.path.join(WORK, 'ground.npz'), K=K, dout=dout.astype(np.float32), inset=inset.astype(np.float32), h=h.astype(np.float32), ch=ch.astype(np.float16), O=O.astype(np.float16), tc=(tone * calm).astype(np.float16), inside=inside & (inset >= 0), lay=lay.astype(np.float16))
    print('ground read', K.shape, flush=True)


def carry_rows(val, known, arc, floor):
    rows, cols = known.shape
    j = np.arange(cols, dtype=np.int32)[None, :]
    left = np.maximum.accumulate(np.where(known, j, -1), axis=1)
    right = cols - 1 - np.maximum.accumulate(np.where(known[:, ::-1], j, -1), axis=1)[:, ::-1]
    okl = left >= 0
    okr = right <= cols - 1
    left = np.clip(left, 0, cols - 1)
    right = np.clip(right, 0, cols - 1)
    w1 = (okl / ((j - left) * arc + floor)).astype(np.float32)
    w2 = (okr / ((right - j) * arc + floor)).astype(np.float32)
    ws = np.maximum(w1 + w2, 1e-6)
    r = np.arange(rows)[:, None]
    out = np.empty_like(val)
    for c in range(val.shape[2]):
        out[..., c] = (val[..., c][r, left] * w1 + val[..., c][r, right] * w2) / ws
    return np.where(known[..., None], val, out), (okl | okr)


def vote_at(Sf, T, hole, ty, tx, s, rows, cols, offs):
    sy, sx = s // cols, s % cols
    acc = np.zeros((rows * cols, 4), np.float32)
    cnt = np.zeros(rows * cols, np.float32)
    for dy, dx in offs:
        ti = np.clip(ty + dy, 0, rows - 1) * cols + np.clip(tx + dx, 0, cols - 1)
        v = Sf[np.clip(sy + dy, 0, rows - 1) * cols + np.clip(sx + dx, 0, cols - 1)]
        for c in range(4):
            acc[:, c] += np.bincount(ti, v[:, c], rows * cols).astype(np.float32)
        cnt += np.bincount(ti, None, rows * cols).astype(np.float32)
    out = T.reshape(-1, 4).copy()
    m = hole.reshape(-1)
    out[m] = acc[m] / np.maximum(cnt[m], 1)[:, None]
    return out.reshape(rows, cols, 4)


def fill():
    P = np.load(os.path.join(WORK, 'ground.npz'))
    K = P['K']
    dout = P['dout']
    inset = P['inset']
    h = P['h']
    ch = P['ch'].astype(np.float32)
    gx, gy = grid()
    gx = gx.astype(np.float32)
    gy = gy.astype(np.float32)
    x00 = float(gx[0, 0])
    xs = float(gx[0, 1] - gx[0, 0])
    y00 = float(gy[0, 0])
    ys = float(gy[1, 0] - gy[0, 0])
    cx, cy = deck['life']['storm']['centre']
    ex, ey = fields['view']['origin']
    dap = np.hypot(gx - ex, gy - ey)
    dv = np.hypot(gx - cx, gy - cy)
    zn = B['zone']
    n = ((1 - smoothstep(zn['borderUnits'][0], zn['borderUnits'][1], dout)) * (1 - smoothstep(zn['reachUnits'][0], zn['reachUnits'][1], dap)) * (~K)).astype(np.float32)
    Kf = K.astype(np.float32)

    src = B['source']
    din = cv2.distanceTransform(K.astype(np.uint8), cv2.DIST_L2, 5) / S
    lum = ch.mean(-1)
    A0 = K & (din > src['borderUnits']) & (inset > src['insetPx']) & (dap > src['nearUnits'][0]) & (dap < src['nearUnits'][1]) & (dv > src['stormUnits'])
    glint = A0 & (ch[..., 2] > src['glint'][0] * ch[..., 0]) & (lum > np.percentile(lum[A0], src['glint'][1]))
    tall = h - cv2.GaussianBlur(h * Kf, (0, 0), src['towerUnits'] * S) / np.maximum(cv2.GaussianBlur(Kf, (0, 0), src['towerUnits'] * S), 1e-4)
    tower = A0 & (tall > np.percentile(tall[A0], src['towerShare']))
    tower = cv2.morphologyEx(tower.astype(np.uint8), cv2.MORPH_OPEN, np.ones((src['openPx'], src['openPx']), np.uint8)) > 0
    bad = cv2.dilate((glint | tower).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (src['marginPx'], src['marginPx']))) > 0
    A = A0 & ~bad
    del din, lum, tall, tower, glint, bad, A0, dv
    print('source %.2f square units, zone %.2f square units' % (A.sum() / S / S, (n > 0).sum() / S / S), flush=True)

    pc = B['pieces']
    sig = pc['flatUnits'] * S
    hw = pc['heightWeight']
    wK = cv2.GaussianBlur(Kf, (0, 0), sig) + 1e-6
    LC = np.log(np.maximum(ch, 0) + EPS) * Kf[..., None]
    low = cv2.GaussianBlur(LC, (0, 0), sig) / wK[..., None]
    hlow = cv2.GaussianBlur(h * Kf, (0, 0), sig) / wK
    F0 = np.dstack([(LC - low) * Kf[..., None], ((h - hlow) * Kf * hw)[..., None], low, hlow[..., None], Kf[..., None], A.astype(np.float32)[..., None], n[..., None]]).astype(np.float32)
    del LC, low, hlow, wK, ch

    # the frame of the flow: log polar about the storm's centre, where a shift is a turn about the storm and a scale
    fl = B['flow']
    NT, NR = fl['turns'], fl['rings']
    DL = 2 * np.pi / NT
    RHO0 = np.log(fl['innerUnits'])
    AX = np.radians(fl['axisDeg'])
    rho = RHO0 + (np.arange(NR, dtype=np.float32) + 0.5) * DL
    tt = -np.pi + (np.arange(NT, dtype=np.float32) + 0.5) * DL
    rr = np.exp(rho)[:, None]
    px = (cx + rr * np.cos(tt[None, :] + AX)).astype(np.float32)
    py = (cy + rr * np.sin(tt[None, :] + AX)).astype(np.float32)
    mc = (px - x00) / xs
    mr = (py - y00) / ys
    L0 = np.empty((NR, NT, F0.shape[2]), np.float32)
    for c in range(F0.shape[2]):
        L0[..., c] = cv2.remap(F0[..., c], mc, mr, cv2.INTER_LINEAR if c >= 4 else cv2.INTER_CUBIC, borderValue=0)
    del F0, mc, mr

    def down(a):
        return cv2.resize(a, (a.shape[1] // 2, a.shape[0] // 2), interpolation=cv2.INTER_AREA)

    top, last = pc['levels']
    pyr = [L0]
    PX = [px]
    PY = [py]
    for l in range(top):
        pyr.append(down(pyr[-1]))
        PX.append(down(PX[-1]))
        PY.append(down(PY[-1]))
    rng = np.random.default_rng(pc['seed'])
    R = pc['radius']
    offs = [(dy, dx) for dy in range(-R, R + 1) for dx in range(-R, R + 1)]
    nnf = None
    for l in range(top, last - 1, -1):
        Lv = pyr[l]
        rows, cols = Lv.shape[:2]
        known = Lv[..., 8] > 0.999
        hole = (Lv[..., 10] > 0) & ~known
        srcok = cv2.erode((Lv[..., 9] > 0.999).astype(np.uint8), np.ones((2 * R + 3, 2 * R + 3), np.uint8)) > 0
        srcok[:R + 1] = False
        srcok[-R - 1:] = False
        srcok[:, :R + 1] = False
        srcok[:, -R - 1:] = False
        arc = (np.exp(RHO0 + (np.arange(rows) + 0.5) * DL * 2 ** l) * DL * 2 ** l)[:, None]
        G, okc = carry_rows(Lv[..., 4:8], known, arc, pc['arcFloor'])
        hole &= okc
        Sf = np.ascontiguousarray(Lv[..., :4]).reshape(-1, 4)
        Gs = Lv[..., 4:7].reshape(-1, 3)
        ty, tx = np.nonzero(hole)
        N = len(ty)
        tflat = ty * cols + tx
        sv = np.flatnonzero(srcok)
        sok = srcok.reshape(-1)
        Xl = PX[l].reshape(-1)
        Yl = PY[l].reshape(-1)
        Gt = G[..., :3].reshape(-1, 3)[tflat]
        T = Lv[..., :4].copy()
        T[~known] = 0
        wt = (known | hole).astype(np.float32).reshape(-1)
        tidx = [np.clip(ty + dy, 0, rows - 1) * cols + np.clip(tx + dx, 0, cols - 1) for dy, dx in offs]
        hole_id = np.full(rows * cols, -1, np.int64)
        hole_id[tflat] = np.arange(N)
        if nnf is None:
            s = sv[rng.integers(0, len(sv), N)]
        else:
            pid = prev_id[(ty // 2) * prev_w + tx // 2]
            ok = pid >= 0
            s = np.where(ok, 2 * (nnf[np.maximum(pid, 0)] // prev_w) + (ty % 2), 0) * cols + np.where(ok, 2 * (nnf[np.maximum(pid, 0)] % prev_w) + (tx % 2), 0)
            s = np.clip(s, 0, rows * cols - 1)
            lost = ~ok | ~sok[s]
            s[lost] = sv[rng.integers(0, len(sv), int(lost.sum()))]

        def dist(s, Tp, wp, wsum, occ):
            sy, sx = s // cols, s % cols
            D = np.zeros(N, np.float32)
            for k, (dy, dx) in enumerate(offs):
                d = Sf[(sy + dy) * cols + (sx + dx)] - Tp[k]
                D += wp[k] * (d * d).sum(-1)
            D /= wsum
            g = Gs[s] - Gt
            D += pc['toneWeight'] * (g * g).mean(-1)
            D += pc['scaleWeight'] * ((sy - ty) * DL * 2 ** l) ** 2
            D += pc['useWeight'] * occ[s]
            far = (Xl[s] - Xl[tflat]) ** 2 + (Yl[s] - Yl[tflat]) ** 2
            D[(far < pc['gapUnits'] ** 2) | ~sok[s]] = 1e9
            return D

        nbr = []
        for qy, qx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ny, nx = ty + qy, tx + qx
            inb = (ny >= 0) & (ny < rows) & (nx >= 0) & (nx < cols)
            nbr.append(np.where(inb, hole_id[np.clip(ny, 0, rows - 1) * cols + np.clip(nx, 0, cols - 1)], -1))

        def together(c):
            sh = c - tflat
            k = np.zeros(N, np.float32)
            for nb in nbr:
                j = np.maximum(nb, 0)
                k += (nb >= 0) & ((s[j] - tflat[j]) == sh)
            return k * (pc['together'] / 4)

        T = vote_at(Sf, T, hole, ty, tx, s, rows, cols, offs)
        for it in range(pc['passes'][str(l)]):
            Tf = T.reshape(-1, 4)
            Tp = [Tf[ti] for ti in tidx]
            wp = [wt[ti] for ti in tidx]
            wsum = np.maximum(sum(wp), 1e-6)
            occ = np.bincount(s, None, rows * cols).astype(np.float32).reshape(rows, cols)
            occ = (cv2.blur(occ, (2 * R + 1, 2 * R + 1)) / (N / max(len(sv), 1))).reshape(-1)
            D = dist(s, Tp, wp, wsum, occ) - together(s)
            cands = []
            for step in pc['steps']:
                for qy, qx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                    ny, nx = ty - qy * step, tx - qx * step
                    inb = (ny >= 0) & (ny < rows) & (nx >= 0) & (nx < cols)
                    qid = np.where(inb, hole_id[np.clip(ny, 0, rows - 1) * cols + np.clip(nx, 0, cols - 1)], -1)
                    cands.append(np.where(qid >= 0, s[np.maximum(qid, 0)] + (qy * cols + qx) * step, s))
            wide = l >= pc['wideFrom']
            for reach in ([max(rows, cols) // d for d in pc['reachShare']] + pc['reachPx'] if wide else pc['reachFinePx']):
                cands.append(np.clip(s // cols + rng.integers(-reach, reach + 1, N), 0, rows - 1) * cols + np.clip(s % cols + rng.integers(-reach, reach + 1, N), 0, cols - 1))
            if wide:
                cands.append(sv[rng.integers(0, len(sv), N)])
            moved = 0
            for c in cands:
                c = np.clip(c, 0, rows * cols - 1)
                c = np.where(sok[c], c, s)
                Dc = dist(c, Tp, wp, wsum, occ) - together(c)
                m = Dc < D
                s[m] = c[m]
                D[m] = Dc[m]
                moved += int(m.sum())
            T = vote_at(Sf, T, hole, ty, tx, s, rows, cols, offs)
            print('level %d of %d by %d, %d to fill, pass %d: mean distance %.4f, moved %d, not set %d' % (l, rows, cols, N, it, float(D[D < 1e8].mean()), moved, int((D >= 1e8).sum())), flush=True)
        nnf = s
        prev_id = hole_id
        prev_w = cols
        del Tp, wp

    lv = last
    res = T
    holeL = hole
    GL = G
    sL = nnf
    idL = prev_id
    wL = prev_w
    for l in range(last - 1, -1, -1):
        Lv = pyr[l]
        rows, cols = Lv.shape[:2]
        known = Lv[..., 8] > 0.999
        hole = (Lv[..., 10] > 0) & ~known
        ty, tx = np.nonzero(hole)
        pid = idL[(ty // 2) * wL + (tx // 2)]
        ok = pid >= 0
        sy = np.clip(2 * (sL[np.maximum(pid, 0)] // wL) + (ty % 2), 0, rows - 1)
        sx = np.clip(2 * (sL[np.maximum(pid, 0)] % wL) + (tx % 2), 0, cols - 1)
        res = Lv[..., :4].copy()
        res[~known] = 0
        holeL = np.zeros((rows, cols), bool)
        holeL[ty[ok], tx[ok]] = True
        res = vote_at(np.ascontiguousarray(Lv[..., :4]).reshape(-1, 4), res, holeL, ty[ok], tx[ok], sy[ok] * cols + sx[ok], rows, cols, offs)
        sL = sy[ok] * cols + sx[ok]
        idL = np.full(rows * cols, -1, np.int64)
        idL[ty[ok] * cols + tx[ok]] = np.arange(int(ok.sum()))
        wL = cols
        arc = (np.exp(RHO0 + (np.arange(rows) + 0.5) * DL * 2 ** l) * DL * 2 ** l)[:, None]
        GL, _ = carry_rows(Lv[..., 4:8], known, arc, pc['arcFloor'])
        lv = l

    # the pieces: the pixels that read the view with one shift, joined
    rows, cols = res.shape[:2]
    shift = np.full(rows * cols, -1, np.int64)
    tflat = np.flatnonzero(holeL.reshape(-1))
    shift[tflat] = sL - tflat
    shift = shift.reshape(rows, cols)
    edge = np.zeros((rows, cols), bool)
    edge[:, 1:] |= shift[:, 1:] != shift[:, :-1]
    edge[1:] |= shift[1:] != shift[:-1]
    edge &= holeL
    known0 = pyr[lv][..., 8] > 0.999
    count, lab = cv2.connectedComponents((holeL & ~edge).astype(np.uint8), connectivity=4)
    area = np.repeat((np.exp(RHO0 + (np.arange(rows) + 0.5) * DL * 2 ** lv) * DL * 2 ** lv) ** 2, cols)
    areas = np.bincount(lab.reshape(-1), area)[1:]
    big = B['preview']['pieceUnits2']
    print('pieces %d, largest %.4f square units, median %.5f, share of the fill in pieces over %.2f square units %.3f' % (len(areas), float(areas.max()), float(np.median(areas)), big, float(areas[areas > big].sum() / max(areas.sum(), 1e-9))), flush=True)
    del pyr, PX, PY, L0, Lv, Sf, Gs, T, tidx, hole_id, prev_id, idL, Xl, Yl, Gt, G, lab, shift, px, py, area
    gc.collect()

    sc = 2 ** lv
    rad = np.hypot(gx - cx, gy - cy)
    ax, ay = np.cos(AX), np.sin(AX)
    ang = np.arctan2(ax * (gy - cy) - ay * (gx - cx), ax * (gx - cx) + ay * (gy - cy))
    mr = ((np.log(np.maximum(rad, 1e-3)) - RHO0) / (DL * sc) - 0.5).astype(np.float32)
    mc = ((ang + np.pi) / (DL * sc) - 0.5).astype(np.float32)
    del rad, ang
    made = np.empty(K.shape + (4,), np.float32)
    Gc = np.empty(K.shape + (4,), np.float32)
    for c in range(4):
        made[..., c] = cv2.remap(np.ascontiguousarray(res[..., c]), mc, mr, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        Gc[..., c] = cv2.remap(np.ascontiguousarray(GL[..., c]), mc, mr, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    got = cv2.remap((holeL | known0).astype(np.float32), mc, mr, cv2.INTER_LINEAR, borderValue=0)
    edges = cv2.remap(edge.astype(np.float32), mc, mr, cv2.INTER_LINEAR, borderValue=0) > B['preview']['edgeShare']
    del mr, mc, res, GL
    gc.collect()
    n = n * smoothstep(zn['filled'][0], zn['filled'][1], got)
    split = B['splitUnits'] * S
    O = P['O'].astype(np.float32)
    ch = P['ch'].astype(np.float32)
    LO = np.log(O + EPS)
    LO_low = cv2.GaussianBlur(LO, (0, 0), split)
    n3 = n[..., None]
    new = np.exp(LO_low + n3 * (Gc[..., :3] - LO_low) + (LO - LO_low) * (1 - n3) + n3 * made[..., :3]) - EPS
    del LO, LO_low, O
    inside = P['inside']
    canvas = np.where(K[..., None], ch, cv2.GaussianBlur(P['lay'].astype(np.float32), (0, 0), B['edge']['layBlurPx']))
    kin = ((1 - smoothstep(B['edge']['insidePx'][0], B['edge']['insidePx'][1], inset)) * inside * (1 - smoothstep(zn['reachUnits'][0], zn['reachUnits'][1], dap))).astype(np.float32)
    new = np.maximum(new * (1 - kin[..., None]) + canvas * kin[..., None], 0)
    h_low = cv2.GaussianBlur(h, (0, 0), split)
    hN = h_low + n * (Gc[..., 3] - h_low) + (h - h_low) * (1 - n) + n * made[..., 3] / hw
    hN = np.where(inside, h, hN)
    np.savez(os.path.join(WORK, 'fill.npz'), N=new.astype(np.float16), hN=hN.astype(np.float32), n=n.astype(np.float16), kin=kin.astype(np.float16), edges=edges, A=A)


def write(out):
    P = np.load(os.path.join(WORK, 'ground.npz'))
    Z = np.load(os.path.join(WORK, 'fill.npz'))
    tc = P['tc'].astype(np.float32)
    h = P['h']
    K = P['K']
    N = Z['N'].astype(np.float32)
    n = Z['n'].astype(np.float32)
    kin = Z['kin'].astype(np.float32)
    M = ((n > 0) | (kin > 0)).astype(np.float32)
    wanted = N / np.maximum(tc, 1e-4)
    dh = ((Z['hN'] - h) * (n > 0)).astype(np.float32)
    code = lambda x: np.round(np.clip(linear_to_srgb(filmic(np.maximum(x, 0).astype(np.float64))), 0, 1) * 255).astype(np.uint8)
    lo, hi = fields['heightRange']
    for kind in ('full', 'web'):
        os.makedirs(os.path.join(out, kind), exist_ok=True)
    finer = None
    for name in ('fore', 'near'):
        pl = fields['plates'][name]
        old = cv2.imread(before('full', 'plate-%s.png' % name), cv2.IMREAD_UNCHANGED)
        H, Wd = old.shape[:2]
        texel = pl['size'][0] / Wd
        x = pl['centre'][0] + ((np.arange(Wd) + 0.5) / Wd - 0.5) * pl['size'][0]
        y = pl['centre'][1] + (0.5 - (np.arange(H) + 0.5) / H) * pl['size'][1]
        mx, my = np.meshgrid(((x - X0) * S - 0.5).astype(np.float32), ((Y1 - y) * S - 0.5).astype(np.float32))
        coarse = texel * S > 1.01
        a = cv2.GaussianBlur(wanted * M[..., None], (0, 0), 0.5 * texel * S) if coarse else wanted * M[..., None]
        m = cv2.GaussianBlur(M, (0, 0), 0.5 * texel * S) if coarse else M
        interp = cv2.INTER_LINEAR if coarse else cv2.INTER_NEAREST
        a = cv2.remap(a, mx, my, interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        m = cv2.remap(m, mx, my, interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        new = inverse_filmic(srgb_to_linear(old[..., 2::-1].astype(np.float64) / 255)).astype(np.float32) * (1 - m[..., None]) + a
        if finer is not None:
            fp, fine = finer
            fine = cv2.GaussianBlur(fine, (0, 0), 0.5 * texel / (fp['size'][0] / fine.shape[1]))
            gx, gy = np.meshgrid(x, y)
            u = ((gx - fp['centre'][0]) / fp['size'][0] + 0.5) * fine.shape[1] - 0.5
            v = (0.5 - (gy - fp['centre'][1]) / fp['size'][1]) * fine.shape[0] - 0.5
            reach = np.maximum(np.abs(gx - fp['centre'][0]) * 2 / fp['size'][0], np.abs(gy - fp['centre'][1]) * 2 / fp['size'][1])
            w = (1 - smoothstep(B['under'][0], B['under'][1], reach)).astype(np.float32)
            new = new * (1 - w[..., None]) + cv2.remap(fine, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) * w[..., None]
            m = np.maximum(m, w)
            print(name, 'plate under the finer one: %d pixels are the finer plate filtered' % int((w > 0).sum()), flush=True)
        res = old.copy()
        res[..., 2::-1][m > 0] = code(new)[m > 0]
        finer = (pl, inverse_filmic(srgb_to_linear(res[..., 2::-1].astype(np.float64) / 255)).astype(np.float32))
        cv2.imwrite(os.path.join(out, 'full', 'plate-%s.png' % name), res)
        cv2.imwrite(os.path.join(out, 'web', 'plate-%s.png' % name), cv2.resize(res, (Wd // 2, H // 2), interpolation=cv2.INTER_AREA))
        print(name, 'plate: %d of %d pixels changed' % (int((m > 0).sum()), H * Wd), flush=True)
    for name in ('fore', 'near'):
        mp = fields['maps'][name]
        k = mp['pixels']['full']
        q = np.fromfile(before('full', 'deck-%s-height.bin' % name), dtype='<u2').reshape(k, k)
        texel = mp['size'] / k
        x = mp['centre'][0] + ((np.arange(k) + 0.5) / k - 0.5) * mp['size']
        y = mp['centre'][1] + ((np.arange(k) + 0.5) / k - 0.5) * mp['size']
        mx, my = np.meshgrid(((x - X0) * S - 0.5).astype(np.float32), ((Y1 - y) * S - 0.5).astype(np.float32))
        d = cv2.GaussianBlur(dh, (0, 0), 0.5 * texel * S) if texel * S > 1.01 else dh
        d = cv2.remap(d, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        new = np.clip(np.round(q.astype(np.float64) + d / (hi - lo) * 65535), 0, 65535).astype('<u2')
        new.tofile(os.path.join(out, 'full', 'deck-%s-height.bin' % name))
        qw = np.fromfile(before('web', 'deck-%s-height.bin' % name), dtype='<u2').reshape(k // 2, k // 2).copy()
        dec = lambda v: lo + v.astype(np.float32) / 65535 * (hi - lo)
        halved = np.round(np.clip((cv2.resize(dec(new), (k // 2, k // 2), interpolation=cv2.INTER_AREA) - lo) / (hi - lo), 0, 1) * 65535).astype('<u2')
        touched = cv2.resize((new != q).astype(np.float32), (k // 2, k // 2), interpolation=cv2.INTER_AREA) > 0
        qw[touched] = halved[touched]
        qw.tofile(os.path.join(out, 'web', 'deck-%s-height.bin' % name))
        print(name, 'heights: %d of %d texels changed' % (int((new != q).sum()), k * k), flush=True)
    del wanted, dh, M, kin

    pv = B['preview']
    gx, gy = grid()
    ch = P['ch'].astype(np.float32)
    got = plates_at(gx, gy, lambda kind, file: os.path.join(out if file in CHANGED else PUB, kind, file)) * tc
    err = np.abs(np.log(got + 0.01) - np.log(N + 0.01))[n > 0.05]
    print('written ground against the wanted one in the zone: log error mean %.4f, 95 in 100 under %.4f' % (float(err.mean()), float(np.percentile(err, 95))), flush=True)
    now = show(np.where(K[..., None], ch, got))
    was = show(np.where(K[..., None], ch, P['O'].astype(np.float32)))
    lines = now.copy()
    lines[Z['edges']] = (0, 220, 255)
    lines[cv2.morphologyEx(Z['A'].astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((5, 5), np.uint8)) > 0] = (60, 255, 60)
    save = [cv2.IMWRITE_JPEG_QUALITY, 90]

    def crop(a, bx, zoom):
        q = a[int((Y1 - bx[3]) * S):int((Y1 - bx[2]) * S), int((bx[0] - X0) * S):int((bx[1] - X0) * S)]
        return cv2.resize(q, None, fx=zoom, fy=zoom, interpolation=cv2.INTER_AREA) if zoom != 1 else q

    cv2.imwrite(os.path.join(WORK, 'before.jpg'), crop(was, pv['box'], pv['zoom']), save)
    cv2.imwrite(os.path.join(WORK, 'after.jpg'), crop(now, pv['box'], pv['zoom']), save)
    cv2.imwrite(os.path.join(WORK, 'pieces.jpg'), crop(lines, pv['box'], pv['piecesZoom']), save)
    for i, bx in enumerate(pv['close']):
        cv2.imwrite(os.path.join(WORK, 'before-close-%d.jpg' % (i + 1)), crop(was, bx, 1), save)
        cv2.imwrite(os.path.join(WORK, 'after-close-%d.jpg' % (i + 1)), crop(now, bx, 1), save)
        cv2.imwrite(os.path.join(WORK, 'pieces-close-%d.jpg' % (i + 1)), crop(lines, bx, 1), save)


def main():
    os.makedirs(WORK, exist_ok=True)
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else PUB
    step = sys.argv[sys.argv.index('--step') + 1] if '--step' in sys.argv else None
    if step == 'ground':
        ground()
    elif step == 'fill':
        fill()
    elif step == 'write':
        write(out)
    else:
        for name in ('ground', 'fill', 'write'):
            subprocess.run([sys.executable, os.path.abspath(__file__), '--step', name, '--out', out], check=True)
        for name in ('ground.npz', 'fill.npz'):
            os.remove(os.path.join(WORK, name))


if __name__ == '__main__':
    main()
