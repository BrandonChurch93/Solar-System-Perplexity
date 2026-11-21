import sys

import cv2
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

from common import WORK, blur, load, save

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 11
W, H = 8192, 4096
PW, PH = 400, 208
NX = 28
SY = 136
Y_FIRST, ROWS = 712, 19
Q = 4
OW, OH = PW - W // NX, PH - SY

col = load(f'{WORK}/eq8k-color.png').astype(np.float32)
wgt = load(f'{WORK}/eq8k-weight.png')[..., 0].astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W]
grs = (((xx - 3696) / 370) ** 2 + ((yy - 2284) / 235) ** 2) < 1
ok = (wgt > 0.9) & ~grs
okl = (wgt > 0.6) & ~grs
del xx, yy
src4 = cv2.resize(col, (W // Q, H // Q), interpolation=cv2.INTER_AREA)
okf = ok.astype(np.float32)
oklf = okl.astype(np.float32)
ok_int = cv2.integral(okf)
okl_int = cv2.integral(oklf)
hero_int = cv2.integral((wgt > 0.97).astype(np.float32))


def frac(integral, x, y, w, h):
    return (integral[y + h, x + w] - integral[y, x + w] - integral[y + h, x] + integral[y, x]) / (w * h)


def seam(e):
    h, w = e.shape
    c = e.copy()
    for y in range(1, h):
        p = c[y - 1]
        left = np.concatenate([[np.inf], p[:-1]])
        right = np.concatenate([p[1:], [np.inf]])
        c[y] += np.minimum(p, np.minimum(left, right))
    path = np.zeros(h, np.int32)
    path[-1] = int(np.argmin(c[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]
        lo, hi = max(0, x - 1), min(w, x + 2)
        path[y] = lo + int(np.argmin(c[y, lo:hi]))
    return path


def cols(x):
    return np.arange(x, x + PW) % W


canvas = np.zeros((H, W, 3), np.float32)
known = np.zeros((H, W), bool)
canvas4 = np.zeros((H // Q, W // Q, 3), np.float32)
known4 = np.zeros((H // Q, W // Q), bool)
rng = np.random.default_rng(SEED)
slots_x = [round(i * W / NX) for i in range(NX)]
used = {}
plan = []
for j in range(ROWS):
    y0 = Y_FIRST + j * SY
    ident = [i for i in range(NX) if slots_x[i] + PW <= W and frac(hero_int, slots_x[i], y0, PW, PH) > 0.995]
    for i in ident:
        x = slots_x[i]
        canvas[y0:y0 + PH, x:x + PW] = col[y0:y0 + PH, x:x + PW]
        known[y0:y0 + PH, x:x + PW] = True
        used[(j, i)] = x
    start = (max(ident) + 1) % NX if ident else 0
    order = [(start + k) % NX for k in range(NX)]
    plan.append((j, y0, [i for i in order if i not in ident]))
canvas4 = cv2.resize(canvas, (W // Q, H // Q), interpolation=cv2.INTER_AREA)
known4 = cv2.resize(known.astype(np.uint8), (W // Q, H // Q), interpolation=cv2.INTER_NEAREST) > 0

for j, y0, free in plan:
    xs = [x for x in range(0, W - PW, Q) if frac(ok_int, x, y0, PW, PH) > 0.995]
    if len(xs) < 40:
        xs = [x for x in range(0, W - PW, Q) if frac(okl_int, x, y0, PW, PH) > 0.99]
    if len(xs) < 8:
        print('row', j, y0, 'no source')
        continue
    xs = np.array(xs)
    y4, ph4, pw4 = y0 // Q, PH // Q, PW // Q
    strip = src4[y4:y4 + ph4]
    wins = sliding_window_view(strip, (ph4, pw4), axis=(0, 1))[0]
    wins = np.moveaxis(wins, 1, -1)[xs // Q]
    for i in free:
        x = slots_x[i]
        c4 = cols(x)[::Q] // Q
        tgt = canvas4[y4:y4 + ph4][:, c4]
        m = known4[y4:y4 + ph4][:, c4].astype(np.float32)
        n = m.sum()
        cost = (((wins - tgt[None]) ** 2).sum(-1) * m[None]).sum((1, 2)) / max(n, 1)
        pen = np.zeros(len(xs), np.float32)
        for (jj, ii), ux in used.items():
            di = min((ii - i) % NX, (i - ii) % NX)
            if abs(jj - j) <= 2 and di <= 5:
                pen += np.exp(-(((xs - ux) / (PW * 0.9)) ** 2)) * (1.0 if jj == j else 0.5)
        base = np.median(cost) if n > 0 else 1.0
        total = cost + pen * base * 0.6 + rng.uniform(0, 0.04, len(xs)) * base
        pick = int(xs[int(np.argmin(total))])
        used[(j, i)] = pick
        new = col[y0:y0 + PH, pick:pick + PW]
        cx = cols(x)
        old = canvas[y0:y0 + PH][:, cx]
        kn = known[y0:y0 + PH][:, cx]
        e = ((new - old) ** 2).sum(-1) * kn + 1.0
        mask = np.ones((PH, PW), bool)
        if kn[:, :OW].mean() > 0.3:
            s = seam(e[:, :OW])
            mask[:, :OW] &= np.arange(OW)[None, :] >= s[:, None]
        if kn[:, -OW:].mean() > 0.3:
            s = seam(e[:, -OW:])
            mask[:, -OW:] &= np.arange(OW)[None, :] < s[:, None]
        if kn[:OH].mean() > 0.3:
            s = seam(e[:OH].T.copy())
            mask[:OH] &= np.arange(OH)[:, None] >= s[None, :]
        if kn[-OH:].mean() > 0.3:
            s = seam(e[-OH:].T.copy())
            mask[-OH:] &= np.arange(OH)[:, None] < s[None, :]
        mask |= ~kn
        soft = blur(mask.astype(np.float32), 2.5)
        soft = np.where(kn, soft, 1.0)[..., None]
        out = new * soft + old * (1 - soft)
        canvas[y0:y0 + PH, cx] = out
        known[y0:y0 + PH, cx] = True
        canvas4[y4:y4 + ph4, c4] = cv2.resize(out, (pw4, ph4), interpolation=cv2.INTER_AREA)
        known4[y4:y4 + ph4, c4] = True
    print('row', j, y0, 'candidates', len(xs), 'free', len(free), flush=True)

prof = np.load(f'{WORK}/profile_coded.npy')
stripes = cv2.resize(np.repeat(prof[:, None, :], 8, 1), (W, H), interpolation=cv2.INTER_LINEAR)
kf = known.astype(np.float32)
soft = blur(kf, 30)
lowq = blur(canvas, 110) / np.maximum(blur(kf, 110), 1e-3)[..., None]
lows = blur(stripes, 110)
canvas = np.where(known[..., None], canvas - lowq + lows, stripes)
edge = np.clip((soft - 0.5) * 2, 0, 1)[..., None]
canvas = canvas * edge + stripes * (1 - edge)
w3 = wgt[..., None]
canvas = canvas * (1 - w3) + col * w3
save(f'{WORK}/quilt-{SEED}.png', np.round(np.clip(canvas, 0, 255)).astype(np.uint8))
cv2.imwrite(f'out/work/view/quilt-{SEED}.jpg', cv2.resize(canvas[..., ::-1], (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
