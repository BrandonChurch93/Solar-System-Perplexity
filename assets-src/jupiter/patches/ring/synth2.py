# synth2.py STAGE : the finish of the repainted centre (the mid level over its own base, the wrap) carried by example to the ring of the wide level
# stages: prep (plane pictures and the check that the two line up), xfer TAG KAPPA (three octaves, coarse to fine), lay TAG GAIN OUT (the trial asset)
import json, os, sys, time
import numpy as np
import cv2
from PIL import Image
from numpy.lib.stride_tricks import sliding_window_view as swv
Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
OUT = ROOT + '/out/work/jupiter/ring/'
os.makedirs(OUT, exist_ok=True)
spec = json.loads(open(ROOT + '/src/stops/jupiter/patches.json').read())
lon0, lat0 = np.radians(spec['centre']['lon']), np.radians(spec['centre']['lat'])
WIDE, MID = spec['levels'][0], spec['levels'][1]
HALF = np.tan(np.radians(WIDE['widthDeg']) / 2); HALFM = np.tan(np.radians(MID['widthDeg']) / 2)
S0 = 1400.0
RMAX = 2 * np.tan(np.arctan(HALF * np.sqrt(2)) / 2)
N = int(np.ceil(RMAX * S0 / 4) * 8)
nv = np.array([np.cos(lat0) * np.sin(lon0), np.sin(lat0), np.cos(lat0) * np.cos(lon0)])
ev = np.cross([0.0, 1.0, 0.0], nv); ev /= np.linalg.norm(ev)
uv = np.cross(nv, ev)
T0 = time.time()

def say(*a):
    print(*a, round(time.time() - T0, 1), 's', flush=True)

def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def g(a, s):
    return cv2.GaussianBlur(a, (0, 0), s, borderType=cv2.BORDER_REFLECT)

def plane():
    c = ((np.arange(N) + 0.5 - N / 2) / S0).astype(np.float64)
    X, Y = np.meshgrid(c, -c)
    r = np.sqrt(X * X + Y * Y)
    th = 2 * np.arctan(r / 2)
    k = np.where(r > 1e-9, np.sin(th) / np.maximum(r, 1e-9), 1.0)
    d = nv[None, None] * np.cos(th)[..., None] + (ev[None, None] * X[..., None] + uv[None, None] * Y[..., None]) * k[..., None]
    dn = d @ nv
    gx = d @ ev / np.maximum(dn, 1e-6); gy = d @ uv / np.maximum(dn, 1e-6)
    return d, gx, gy, dn

def prep():
    d, gx, gy, dn = plane()
    wrap = np.asarray(Image.open(ROOT + '/public/assets/jupiter/full/wrap-color.jpg').convert('RGB'), dtype=np.float32)
    h, w = wrap.shape[:2]
    lon = np.arctan2(d[..., 0], d[..., 2]); lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    u = ((lon / (2 * np.pi) + 0.5) * w - 0.5).astype(np.float32); v = ((0.5 - lat / np.pi) * h - 0.5).astype(np.float32)
    B = cv2.remap(wrap, u, v, cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)
    del wrap, d, lon, lat, u, v
    q = np.maximum(np.abs(gx), np.abs(gy)) / (2 * HALF); q[dn <= 0.05] = 9
    qm = np.maximum(np.abs(gx), np.abs(gy)) / (2 * HALFM); qm[dn <= 0.05] = 9
    np.save(OUT + 'q.npy', q.astype(np.float32)); np.save(OUT + 'qm.npy', qm.astype(np.float32)); np.save(OUT + 'B.npy', B)
    mid = np.asarray(Image.open(ROOT + '/public/assets/jupiter/full/' + MID['file']).convert('RGB'), dtype=np.float32)
    size = mid.shape[0]
    per = size / (2 * HALFM)
    small = int(round(size * S0 / per))
    ms = cv2.resize(mid, (small, small), interpolation=cv2.INTER_AREA)
    del mid
    col = ((gx / (2 * HALFM) + 0.5) * small - 0.5).astype(np.float32); row = ((0.5 - gy / (2 * HALFM)) * small - 0.5).astype(np.float32)
    A2 = cv2.remap(ms, col, row, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    np.save(OUT + 'A2.npy', A2)
    inside = qm < 0.47
    LB, LA2 = lum(B), lum(A2)
    ys, xs = np.nonzero(inside); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a, b = LB[y0:y1, x0:x1], LA2[y0:y1, x0:x1]
    for s in (4.0, 8.0, 16.0):
        fa, fb = g(a, s) - g(a, 2 * s), g(b, s) - g(b, 2 * s)
        (dx, dy), resp = cv2.phaseCorrelate(fa.astype(np.float64), fb.astype(np.float64))
        say('band', s, 'to', 2 * s, 'px: correlation of the mid level with the wrap', round(float(np.corrcoef(fa.ravel(), fb.ravel())[0, 1]), 4), 'shift', round(dx, 2), round(dy, 2), 'response', round(resp, 3))
    D = (A2 - B)[y0:y1, x0:x1]
    for s in (1.0, 2.0, 4.0, 8.0, 16.0, 32.0):
        say('  the change the repaint made, std of what lies over sigma', s, ':', round(float(g(lum(D), s).std()), 3), 'of all', round(float(lum(D).std()), 3))
    def bands(L, m):
        out = []; prev = L
        for s in (0.7, 1.4, 2.8, 5.6, 11.2):
            bb = g(L, s); out.append(round(float((prev - bb)[m].std()), 3)); prev = bb
        return out
    ring = (q > 0.27) & (q < 0.48)
    say('size', N, 'scale', S0, 'dictionary pixels', int(inside.sum()), 'ring pixels', int(ring.sum()))
    say('bands under 0.7, to 1.4, to 2.8, to 5.6, to 11.2 px: the wrap inside the mid level', bands(LB, inside), '| the mid level', bands(LA2, inside), '| the wrap in the ring', bands(LB, ring))
    Image.fromarray(np.clip(np.concatenate([B[y0:y1, x0:x1], A2[y0:y1, x0:x1]], 1)[::2, ::2] + 0.5, 0, 255).astype(np.uint8)).save(OUT + 'prep-pair.jpg', quality=90)

def pyr(a, n):
    out = [a]
    for _ in range(n): out.append(cv2.pyrDown(out[-1]))
    return out

def up(a, shape):
    return cv2.pyrUp(a, dstsize=(shape[1], shape[0]))

P, STRIDE, DIMS = 7, 4, 16
WIN = np.array([0.02, 0.3, 1, 1, 1, 0.3, 0.02], np.float32)

def level(tag, lv, FA, FB, CA, CB, DA, okA, want, kappa, wc):
    R = P // 2
    WA, WB = swv(FA, (P, P)), swv(FB, (P, P))
    WCA, WCB = (swv(CA, (P, P)), swv(CB, (P, P))) if CA is not None else (None, None)
    ok = okA[R:-R, R:-R]
    ya, xa = np.nonzero(ok)
    amap = -np.ones(ok.shape, np.int64); amap[ya, xa] = np.arange(len(ya))
    def feats(W, WC, y, x, eps):
        f = W[y, x].reshape(len(y), -1).astype(np.float32)
        n = np.linalg.norm(f, axis=1)
        f = f / (n[:, None] + eps)
        if WC is not None:
            c = WC[y, x].reshape(len(y), -1).astype(np.float32) * wc / (n[:, None] + eps)
            f = np.concatenate([f, c], 1)
        return f, n
    rng = np.random.default_rng(7)
    pick = rng.choice(len(ya), min(200000, len(ya)), replace=False)
    n0 = np.linalg.norm(WA[ya[pick], xa[pick]].reshape(len(pick), -1), axis=1)
    eps = float(np.median(n0)) * 0.3
    sub, _ = feats(WA, WCA, ya[pick], xa[pick], eps)
    mean = sub.mean(0)
    w, v = np.linalg.eigh(np.cov((sub - mean).T))
    V = np.ascontiguousarray(v[:, ::-1][:, :DIMS]).astype(np.float32)
    PA = np.zeros((len(ya), DIMS), np.float32); nA = np.zeros(len(ya), np.float32)
    CH = 250000
    for a in range(0, len(ya), CH):
        f, n = feats(WA, WCA, ya[a:a + CH], xa[a:a + CH], eps)
        PA[a:a + CH] = (f - mean) @ V; nA[a:a + CH] = n
    say('level', lv, 'dictionary', len(ya), 'variance kept', round(float(w[::-1][:DIMS].sum() / w.sum()), 3))
    index = cv2.flann_Index(PA, dict(algorithm=1, trees=4))
    gy = np.arange(R, FB.shape[0] - R, STRIDE); gx = np.arange(R, FB.shape[1] - R, STRIDE)
    vq = want[gy][:, gx]
    iy, ix = np.nonzero(vq)
    ty, tx = gy[iy] - R, gx[ix] - R
    PBg = np.zeros(vq.shape + (DIMS,), np.float32); nBg = np.zeros(vq.shape, np.float32)
    sy0 = np.zeros(vq.shape, np.int64); sx0 = np.zeros(vq.shape, np.int64); d0 = np.full(vq.shape, np.inf, np.float32)
    for a in range(0, len(ty), CH):
        f, n = feats(WB, WCB, ty[a:a + CH], tx[a:a + CH], eps)
        PB = np.ascontiguousarray((f - mean) @ V)
        idx, _ = index.knnSearch(PB, 1, params=dict(checks=64))
        idx = idx[:, 0]
        PBg[iy[a:a + CH], ix[a:a + CH]] = PB; nBg[iy[a:a + CH], ix[a:a + CH]] = n
        sy0[iy[a:a + CH], ix[a:a + CH]] = ya[idx]; sx0[iy[a:a + CH], ix[a:a + CH]] = xa[idx]
        d0[iy[a:a + CH], ix[a:a + CH]] = ((PB - PA[idx]) ** 2).sum(1)
    say('level', lv, 'queries', len(ty), 'first match, median distance', round(float(np.median(d0[vq])), 4))
    sy, sx = sy0.copy(), sx0.copy()
    nyq, nxq = vq.shape
    ha, wa = ok.shape
    if kappa > 0:
        for i in range(nyq):
            if not vq[i].any(): continue
            cost = d0[i] / (1 + kappa); csy = sy0[i].copy(); csx = sx0[i].copy()
            if i > 0:
                for e in (-1, 0, 1):
                    ny_ = np.roll(sy[i - 1], -e) + STRIDE; nx_ = np.roll(sx[i - 1], -e) - STRIDE * e
                    nv_ = np.roll(vq[i - 1], -e)
                    if e == 1: nv_[-1] = False
                    if e == -1: nv_[0] = False
                    inside = (ny_ >= 0) & (ny_ < ha) & (nx_ >= 0) & (nx_ < wa)
                    ai = amap[np.clip(ny_, 0, ha - 1), np.clip(nx_, 0, wa - 1)]
                    okc = vq[i] & nv_ & inside & (ai >= 0)
                    dd = np.full(nxq, np.inf, np.float32)
                    dd[okc] = ((PBg[i][okc] - PA[ai[okc]]) ** 2).sum(1) / (1 + kappa) ** 2
                    better = dd < cost
                    cost[better] = dd[better]; csy[better] = ny_[better]; csx[better] = nx_[better]
            PBi = PBg[i]
            cl = cost.tolist(); yl = csy.tolist(); xl = csx.tolist(); vl = vq[i].tolist()
            k2 = (1 + kappa) ** 2
            for j in range(1, nxq):
                if not (vl[j] and vl[j - 1]): continue
                s_y = yl[j - 1]; s_x = xl[j - 1] + STRIDE
                if s_x >= wa: continue
                ai = amap[s_y, s_x]
                if ai < 0: continue
                df = PBi[j] - PA[ai]
                dd = float(df @ df) / k2
                if dd < cl[j]:
                    cl[j] = dd; yl[j] = s_y; xl[j] = s_x
            sy[i] = yl; sx[i] = xl
    win = np.outer(WIN, WIN)
    acc = np.zeros(FB.shape + (3,), np.float32); wsum = np.zeros(FB.shape, np.float32)
    ssy, ssx = sy[iy, ix], sx[iy, ix]
    scale = np.clip((nBg[iy, ix] + eps) / (nA[amap[ssy, ssx]] + eps), 0.5, 1.6)
    WD = swv(DA, (P, P), axis=(0, 1))
    for a in range(0, len(ty), CH):
        y, x = ty[a:a + CH], tx[a:a + CH]
        vals = WD[ssy[a:a + CH], ssx[a:a + CH]] * scale[a:a + CH, None, None, None]
        for dy in range(P):
            for dx in range(P):
                acc[y + dy, x + dx] += vals[:, :, dy, dx] * win[dy, dx]
                wsum[y + dy, x + dx] += win[dy, dx]
    H = acc / np.maximum(wsum, 1e-6)[..., None]
    H[wsum < 1e-6] = 0
    key = (sy - gy[:, None]).astype(np.int64) * 16384 + (sx - gx[None, :]).astype(np.int64)
    wall = np.zeros(vq.shape, np.uint8); wall[:, 1:] |= (key[:, 1:] != key[:, :-1]).astype(np.uint8); wall[1:, :] |= (key[1:, :] != key[:-1, :]).astype(np.uint8)
    n, lab, stats, cent = cv2.connectedComponentsWithStats(((wall == 0) & vq).astype(np.uint8), connectivity=4)
    areas = np.sort(stats[1:, cv2.CC_STAT_AREA])[::-1]
    say('level', lv, 'pieces that continue one source, in cells of', STRIDE, 'px: largest', areas[:6].tolist(), 'share of cells in pieces over 20 cells', round(float(areas[areas > 20].sum() / max(vq.sum(), 1)), 3), 'scale median', round(float(np.median(scale)), 3))
    return H

def xfer(tag, kappa, wc):
    B = np.load(OUT + 'B.npy'); A2 = np.load(OUT + 'A2.npy'); q = np.load(OUT + 'q.npy'); qm = np.load(OUT + 'qm.npy')
    D = A2 - B
    D[qm >= 0.5] = 0
    D = D - g(D, 12.0)
    LB = lum(B)
    del A2
    NL = 3
    pB = pyr(LB, NL - 1); pD = pyr(D, NL - 1)
    bandD = [pD[i] - up(pD[i + 1], pD[i].shape) for i in range(NL - 1)] + [pD[NL - 1]]
    pq = [q[::2 ** i, ::2 ** i] for i in range(NL)]; pqm = [qm[::2 ** i, ::2 ** i] for i in range(NL)]
    Hs = [None] * NL
    for lv in range(NL - 1, -1, -1):
        F = pB[lv] - g(pB[lv], 3.0)
        okA = pqm[lv] < 0.47
        want = (pq[lv] > 0.17) & (pq[lv] < 0.54)
        if lv < NL - 1:
            trueC = lum(sum(up_to(bandD[k], lv, k) for k in range(lv + 1, NL)))
            synC = lum(sum(up_to(Hs[k], lv, k) for k in range(lv + 1, NL)))
        else:
            trueC = synC = None
        Hs[lv] = level(tag, lv, F, F, trueC, synC, bandD[lv], okA, want, kappa, wc)
    H = sum(up_to(Hs[k], 0, k) for k in range(NL))
    np.save(OUT + 'H-' + tag + '.npy', H.astype(np.float32))
    def bands(L, m):
        out = []; prev = L
        for s in (0.7, 1.4, 2.8, 5.6, 11.2):
            bb = g(L, s); out.append(round(float((prev - bb)[m].std()), 3)); prev = bb
        return out
    ring = (q > 0.27) & (q < 0.48); inside = qm < 0.47
    say('bands under 0.7, to 1.4, to 2.8, to 5.6, to 11.2 px: the mid level', bands(lum(B + D), inside), '| the wrap there', bands(LB, inside), '| the ring before', bands(LB, ring), '| the ring after', bands(LB + lum(H), ring))

def up_to(a, lv, k):
    for i in range(k - 1, lv - 1, -1):
        shape = (N // 2 ** i, N // 2 ** i)
        a = up(a, shape)
    return a

def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)

def lay(tag, gain, out):
    H = np.load(OUT + 'H-' + tag + '.npy')
    W = np.asarray(Image.open(ROOT + '/public/assets/jupiter/full/' + WIDE['file']).convert('RGB'), dtype=np.float32)
    size = W.shape[0]
    c = (np.arange(size, dtype=np.float32) + 0.5) / size
    x = (c[None, :] - 0.5) * 2 * HALF; y = (0.5 - c[:, None]) * 2 * HALF
    cs = 1 / np.sqrt(1 + x * x + y * y)
    k = 2 * cs / (1 + cs)
    col = (x * k * S0 + N / 2 - 0.5).astype(np.float32); row = (-y * k * S0 + N / 2 - 0.5).astype(np.float32)
    Hw = cv2.remap(H, col, row, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    ratio = HALFM / HALF
    m = np.maximum(np.abs(c[None, :] - 0.5), np.abs(c[:, None] - 0.5)) / ratio
    nest = smoothstep((0.5 - m) / 0.1)
    Wn = np.clip(W + gain * Hw * (1 - nest)[..., None] + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(Wn).save(out, quality=93, subsampling=0)
    say('laid', out, os.path.getsize(out), 'bytes; the shipped file', os.path.getsize(ROOT + '/public/assets/jupiter/full/' + WIDE['file']), 'bytes; mean abs change', round(float(np.abs(Wn.astype(np.float32) - W).mean()), 3))


def lay2(tag, gain, out, c0, c1):
    H = np.load(OUT + 'H-' + tag + '.npy'); B = np.load(OUT + 'B.npy'); q = np.load(OUT + 'q.npy')
    LB = lum(B)
    F = LB - g(LB, 3.0)
    act = np.sqrt(g(F * F, 3.0))
    ring = (q > 0.27) & (q < 0.48)
    pc = np.percentile(act[ring], [10, 25, 50, 75, 90])
    say('activity of the wrap in the ring (rms of what lies under sigma 3, over sigma 3), percentiles 10 25 50 75 90:', [round(float(v), 3) for v in pc])
    gate = smoothstep((act - c0) / (c1 - c0))
    gate = g(gate, 1.5)
    H = H * gate[..., None]
    def bands(L, m):
        o = []; prev = L
        for s_ in (0.7, 1.4, 2.8, 5.6, 11.2):
            bb = g(L, s_); o.append(round(float((prev - bb)[m].std()), 3)); prev = bb
        return o
    say('gate mean in the ring', round(float(gate[ring].mean()), 3), 'bands of the ring before', bands(LB, ring), 'after', bands(LB + gain * lum(H), ring))
    np.save(OUT + 'H-' + tag + '-g.npy', H.astype(np.float32))
    W = np.asarray(Image.open(ROOT + '/public/assets/jupiter/full/' + WIDE['file']).convert('RGB'), dtype=np.float32)
    size = W.shape[0]
    c = (np.arange(size, dtype=np.float32) + 0.5) / size
    x = (c[None, :] - 0.5) * 2 * HALF; y = (0.5 - c[:, None]) * 2 * HALF
    cs = 1 / np.sqrt(1 + x * x + y * y)
    k = 2 * cs / (1 + cs)
    col = (x * k * S0 + N / 2 - 0.5).astype(np.float32); row = (-y * k * S0 + N / 2 - 0.5).astype(np.float32)
    Hw = cv2.remap(H, col, row, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    ratio = HALFM / HALF
    m = np.maximum(np.abs(c[None, :] - 0.5), np.abs(c[:, None] - 0.5)) / ratio
    nest = smoothstep((0.5 - m) / 0.1)
    Wn = np.clip(W + gain * Hw * (1 - nest)[..., None] + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(Wn).save(out, quality=93, subsampling=0)
    say('laid', out, os.path.getsize(out), 'bytes; the shipped file', os.path.getsize(ROOT + '/public/assets/jupiter/full/' + WIDE['file']), 'bytes; mean abs change', round(float(np.abs(Wn.astype(np.float32) - W).mean()), 3))

if sys.argv[1] == 'prep': prep()
if sys.argv[1] == 'xfer': xfer(sys.argv[2], float(sys.argv[3]), float(sys.argv[4]) if len(sys.argv) > 4 else 1.0)
if sys.argv[1] == 'lay': lay(sys.argv[2], float(sys.argv[3]), sys.argv[4])
if sys.argv[1] == 'lay2': lay2(sys.argv[2], float(sys.argv[3]), sys.argv[4], float(sys.argv[5]), float(sys.argv[6]))
