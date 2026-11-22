import sys
import cv2
import numpy as np

sys.path.insert(0, 'assets-src/neptune/terrain')
import cgeo

WORK = 'out/work/nep/terrain/'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
WW, WH = 4096, 2304
CW, CH = 5632, 3168
HW, HH = 2048, 1152
WHITE = 0.9
MARGIN = 0.07
CRISP = 1.0
CRISP_MAX = 0.6
SEAM_STRIP = 28
SEAM_REACH = 900
PLATE_EDGE = 16
KNIT_IN = 16
KNIT_OUT = 10
KNIT_STRIP = 6
KNIT_REACH = 700
KNIT_NEAR = 140
KNIT_ALONG = 24
KNIT_COARSE = 120
KNIT_FINE = 2
KNIT_FRINGE = 10
TAPER_MIN = 40
TAPER_MAX = 130
TAPER_STRIP = 40
TAPER_SEED = 11
TAPER_SLANT = 0.35
TAPER_MISS = 30
TAPER_BASE = 2.7
TAPER_ALONG = 32
LIMB_TOP, LIMB_FULL, LIMB_END = -24, 150, 320
LIMB_ALONG, LIMB_REACH, LIMB_IN = 50, 700, 14


def lin(img):
    x = img.astype(np.float32) / 255
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4).astype(np.float32)


def enc(x):
    x = np.clip(x, 0, 1)
    return np.clip(np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055) * 255 + 0.5, 0, 255).astype(np.uint8)


def blur(x, s):
    return cv2.GaussianBlur(x, (0, 0), s)


def ncblur(x, w, s):
    if x.ndim == 3:
        return blur(x * w[..., None], s) / np.maximum(blur(w, s), 1e-4)[..., None]
    return blur(x * w, s) / np.maximum(blur(w, s), 1e-4)


def lum(x):
    return x[..., 0] * 0.0722 + x[..., 1] * 0.7152 + x[..., 2] * 0.2126


def ratio(x):
    return x[..., 2] / np.maximum(x[..., 0], 0.004)


def alpha_of(app, clean):
    ra = ratio(blur(app, 0.8))
    rc = np.minimum(ratio(clean), 0.75)
    a = np.clip((ra - rc - MARGIN) / (WHITE - rc - MARGIN), 0, 1)
    a = a * np.clip((app[..., 0] - 0.004) / 0.01, 0, 1)
    return (a * a * (3 - 2 * a)).astype(np.float32)


x0, y0, x1, y1 = cgeo.approved_box(WW, WH)
bx, bw, bh = int(round(x0)), int(round(x1 - x0)), int(round(y1 - y0))
approved = cv2.imread(cgeo.CLOSE)
core = lin(cv2.imread(WORK + 'close2x.png'))
box = lin(cv2.resize(approved, (bw, bh), interpolation=cv2.INTER_AREA))
gen8 = cv2.resize(cv2.imread(WORK + 'canvas-t1-2x.png'), (WW, WH), interpolation=cv2.INTER_CUBIC)
box8 = cv2.resize(approved, (bw, bh), interpolation=cv2.INTER_AREA)
for c in range(3):
    src = np.cumsum(np.bincount(cv2.GaussianBlur(gen8[:bh, bx:bx + bw, c], (0, 0), 2).ravel(), minlength=256)).astype(np.float64)
    dst = np.cumsum(np.bincount(cv2.GaussianBlur(box8[..., c], (0, 0), 2).ravel(), minlength=256)).astype(np.float64)
    lut = np.interp(src / src[-1], dst / dst[-1], np.arange(256))
    lut = cv2.GaussianBlur(lut.reshape(-1, 1).astype(np.float32), (0, 0), 2).ravel()
    gen8[..., c] = np.clip(lut[gen8[..., c]] + 0.5, 0, 255).astype(np.uint8)
gen = lin(gen8)
del gen8, box8
genbox = gen[:bh, bx:bx + bw]
EPS = 0.002
diff = np.log(box + EPS) - np.log(genbox + EPS)
away = cv2.distanceTransform(np.pad(np.zeros((bh, bw), np.uint8), ((0, WH - bh), (bx, WW - bx - bw)), constant_values=1), cv2.DIST_L2, 5)
tone = None
for sig, lo, hi in ((8, 0, 60), (30, 60, 400), (90, 400, 4000)):
    pad = cv2.copyMakeBorder(np.clip(blur(diff, sig), -0.7, 0.7), 0, WH - bh, bx, WW - bx - bw, cv2.BORDER_REPLICATE)
    pad = blur(pad, sig)
    k = np.clip((away - lo * 0.5) / max(lo * 0.5, 1), 0, 1)[..., None]
    tone = pad if tone is None else tone * (1 - k) + pad * k
wide = (gen + EPS) * np.exp(tone) - EPS
wide = np.maximum(wide, 0)
del away, pad, diff


def seam(wide, box):
    full = wide.copy()
    full[:bh, bx:bx + bw] = box
    inside = np.zeros((WH, WW), np.float32)
    inside[:bh, bx:bx + bw] = 1
    wi = np.maximum(blur(inside, SEAM_STRIP), 1e-4)
    li = np.log(full + EPS)
    m_in = blur(li * inside[..., None], SEAM_STRIP) / wi[..., None]
    v_in = blur((lum(li) - lum(m_in)) ** 2 * inside, SEAM_STRIP) / wi
    wo = np.maximum(blur(1 - inside, SEAM_STRIP), 1e-4)
    lo = np.log(wide + EPS)
    m_out = blur(lo * (1 - inside[..., None]), SEAM_STRIP) / wo[..., None]
    v_out = blur((lum(lo) - lum(m_out)) ** 2 * (1 - inside), SEAM_STRIP) / wo
    step = np.clip(m_in - m_out, -0.9, 0.9)
    spread = np.clip(np.sqrt(np.maximum(v_in, 1e-6) / np.maximum(v_out, 1e-6)), 0.75, 1.7)
    yy, xx = np.mgrid[0:WH, 0:WW]
    ny = np.clip(yy, 0, bh - 1)
    nx = np.clip(xx, bx, bx + bw - 1)
    step = blur(step[ny, nx], 24)
    spread = blur(spread[ny, nx], 24)
    dist = np.hypot(yy - ny, xx - nx).astype(np.float32)
    w = np.exp(-dist / SEAM_REACH)[..., None]
    local = blur(lo, SEAM_STRIP)
    fixed = local + (lo - local) * (1 + (spread[..., None] - 1) * w) + step * w
    print('seam step p5 p50 p95 %.3f %.3f %.3f, spread p5 p95 %.2f %.2f' % (*np.percentile(step[dist > 0], [5, 50, 95]), *np.percentile(spread[dist > 0], [5, 95])))
    return np.maximum(np.exp(fixed) - EPS, 0).astype(np.float32)




def limb(wide, box):
    full = wide.copy()
    full[:bh, bx:bx + bw] = box
    t = cgeo.tangent(cgeo.canvas_rays(WW, WH)).astype(np.float32)
    first = np.argmax(t < 1, axis=0)
    cols = np.arange(WW)
    ta, tb = t[np.maximum(first - 1, 0), cols], t[first, cols]
    yh = (first - 1 + (ta - 1) / np.maximum(ta - tb, 1e-9)).astype(np.float32)
    del t
    d = np.arange(LIMB_TOP, LIMB_END, dtype=np.float32)
    mapx = np.repeat(cols[None, :].astype(np.float32), len(d), 0)
    mapy = yh[None, :] + d[:, None]
    sh = cv2.remap(np.log(full + EPS), mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    del full
    ins = np.zeros((len(d), WW), np.float32)
    ins[:, bx:bx + bw] = 1
    along = lambda x: cv2.GaussianBlur(x, (0, 0), sigmaX=LIMB_ALONG, sigmaY=1.0)
    m_in = along(sh * ins[..., None]) / np.maximum(along(ins), 1e-4)[..., None]
    m_out = along(sh * (1 - ins[..., None])) / np.maximum(along(1 - ins), 1e-4)[..., None]
    wd = np.clip((d - LIMB_TOP) / 12, 0, 1) * (0.5 + 0.5 * np.cos(np.pi * np.clip((d - LIMB_FULL) / (LIMB_END - LIMB_FULL), 0, 1)))
    corr = np.zeros_like(sh)
    for edge, side in ((bx, slice(0, bx + LIMB_IN)), (bx + bw - 1, slice(bx + bw - LIMB_IN, WW))):
        wx = np.exp(-np.maximum(np.abs(cols[side] - edge) - LIMB_IN, 0) / LIMB_REACH)
        corr[:, side] = (m_in[:, edge][:, None, :] - m_out[:, side]) * wx[None, :, None] * wd[:, None, None]
    print('limb correction p5 p50 p95 %.3f %.3f %.3f' % tuple(np.percentile(corr[:, np.r_[bx - 300:bx, bx + bw:bx + bw + 300]], [5, 50, 95])))
    yy, xx = np.mgrid[0:WH, 0:WW].astype(np.float32)
    back = cv2.remap(corr, xx, yy - yh[None, :] - LIMB_TOP, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    del yy, xx
    return np.maximum(np.exp(np.log(wide + EPS) + back) - EPS, 0).astype(np.float32)


wide = seam(wide, box)
wide = limb(wide, box)
mask = np.zeros((WH, WW), np.float32)
mask[:bh - 6, bx + 6:bx + bw - 6] = 1
mask = blur(mask, 3)
mask[:bh - 14, bx + 14:bx + bw - 14] = 1
wide[:bh, bx:bx + bw] = wide[:bh, bx:bx + bw] * (1 - mask[:bh, bx:bx + bw, None]) + box * mask[:bh, bx:bx + bw, None]
del gen

rays = cgeo.canvas_rays(WW, WH)
below = (cgeo.tangent(rays) < 1) & (rays @ cgeo.NADIR > 0)
del rays

clean = lin(cv2.resize(cv2.imread(WORK + 'clean-canvas-t1.png'), (WW, WH), interpolation=cv2.INTER_CUBIC))
rough = (ratio(blur(wide, 2)) > 0.55).astype(np.float32)
free = (1 - np.clip(blur(cv2.dilate(rough, np.ones((61, 61), np.uint8)), 8) * 2, 0, 1)) * below
for _ in range(2):
    gain = np.clip(ncblur(wide, free, 70) / np.maximum(ncblur(clean, free, 70), 1e-4), 0.3, 3)
    cleanN = clean * gain
    a0 = alpha_of(wide, cleanN)
    shade = np.clip(lum(wide) / np.maximum(lum(cleanN), 1e-4), 0, 1)
    free = ((a0 < 0.02) & (shade > 0.85) & below).astype(np.float32)
    free = 1 - np.clip(blur(cv2.dilate(1 - free, np.ones((15, 15), np.uint8)), 4) * 2, 0, 1)


def level(x, weight, strip=SEAM_STRIP, along=24, reach=SEAM_REACH, lo=0.2, hi=1.0, tag='shade'):
    inside = np.zeros((WH, WW), np.float32)
    inside[:bh, bx:bx + bw] = 1
    lx = np.log(np.maximum(x, 1e-4))
    m_in = blur(lx * inside * weight, strip) / np.maximum(blur(inside * weight, strip), 1e-3)
    m_out = blur(lx * (1 - inside) * weight, strip) / np.maximum(blur((1 - inside) * weight, strip), 1e-3)
    yy, xx = np.mgrid[0:WH, 0:WW]
    ny = np.clip(yy, 0, bh - 1)
    nx = np.clip(xx, bx, bx + bw - 1)
    step = blur(np.clip(m_in - m_out, -1, 1)[ny, nx], along)
    dist = np.hypot(yy - ny, xx - nx).astype(np.float32)
    print('%s step p5 p50 p95 %.3f %.3f %.3f' % (tag, *np.percentile(step[(dist > 0) & (dist < 40)], [5, 50, 95])))
    return np.clip(np.exp(lx + step * np.exp(-dist / reach) * (dist > 0)), lo, hi).astype(np.float32)


cleanN[:bh, bx:bx + PLATE_EDGE] = cleanN[:bh, bx + PLATE_EDGE:bx + PLATE_EDGE + 1]
cleanN[:bh, bx + bw - PLATE_EDGE:bx + bw] = cleanN[:bh, bx + bw - PLATE_EDGE - 1:bx + bw - PLATE_EDGE]
cleanN[bh - PLATE_EDGE:bh, bx:bx + bw] = cleanN[bh - PLATE_EDGE - 1:bh - PLATE_EDGE, bx:bx + bw]
belowf = below.astype(np.float32)
cleanN = np.dstack([level(cleanN[..., c], belowf, 3, 3, 160, 0.0, 4.0, 'plate knit %d' % c) for c in range(3)])
alpha = alpha_of(wide, cleanN) * below
alpha = np.where(blur(alpha, 6) > 0.03, alpha, 0).astype(np.float32)
near = np.clip(blur(cv2.dilate((alpha > 0.3).astype(np.float32), np.ones((3, 3), np.uint8), iterations=1), 110) * 6, 0, 1)
clear = (alpha < 0.03).astype(np.float32)
raw = np.clip(lum(wide) / np.maximum(lum(cleanN), 1e-4), 0.2, 1)
raw = level(raw, clear * below)
s = ncblur(raw, clear, 7)
s = np.where(clear > 0, s, ncblur(raw, clear, 40))
s = blur(s.astype(np.float32), 5)
dead = 0.1
s = 1 - np.clip((1 - s) - dead, 0, 1) / (1 - dead) * 1.0
s = 1 - (1 - s) * near
s = level(s, belowf, 6, 4, 90, 0.2, 1.0, 'shade knit')
s = np.clip(s, 0.25, 1).astype(np.float32) * below + (1 - below)


def split(app, clean_n, a, sh):
    under = np.clip(blur(a, 2.5) * 4, 0, 1)[..., None]
    deck = app / sh[..., None] * (1 - under) + clean_n * under
    cloud = (app - (1 - a[..., None]) * deck * sh[..., None]) / np.maximum(a[..., None], 0.02)
    cloud = np.clip(cloud, 0, 1)
    wgt = np.clip(a * 2, 0, 1) ** 2
    fill = ncblur(cloud, wgt, 12)
    cloud = cloud * wgt[..., None] + fill * (1 - wgt[..., None])
    return np.clip(deck, 0, 1), cloud


deckW, cloudW = split(wide, cleanN, alpha, s)


cleanC = cv2.resize(cleanN[:bh, bx:bx + bw], (CW, CH), interpolation=cv2.INTER_CUBIC)
sC = cv2.resize(s[:bh, bx:bx + bw], (CW, CH), interpolation=cv2.INTER_LINEAR)
belowC = cv2.resize(below[:bh, bx:bx + bw].astype(np.float32), (CW, CH), interpolation=cv2.INTER_LINEAR)
alphaC = alpha_of(core, cleanC) * belowC
alphaC = np.where(cv2.resize(blur(alpha, 6)[:bh, bx:bx + bw], (CW, CH), interpolation=cv2.INTER_LINEAR) > 0.03, alphaC, 0).astype(np.float32)
deckC, cloudC = split(core, cleanC, alphaC, sC)


def defringe(deck, cloud, app, a, sh):
    f = CW / bw
    n = int(round(KNIT_IN * f))
    m = 3 * n
    t = np.clip((np.arange(n) / n - 0.6) / 0.4, 0, 1)
    w = (1 - t * t * (3 - 2 * t)).astype(np.float32)
    seen = []
    for name in ('left', 'right', 'base'):
        turn = (lambda x: x) if name == 'left' else (lambda x: x[:, ::-1]) if name == 'right' else (lambda x: np.swapaxes(x, 0, 1)[:, ::-1])
        d = np.ascontiguousarray(turn(deck)[:, :m])
        al = np.ascontiguousarray(turn(a)[:, :m])
        L = np.log(np.maximum(d, 1e-3))
        side = cv2.GaussianBlur(L, (0, 0), sigmaX=KNIT_FINE * f, sigmaY=KNIT_ALONG * f)
        under = np.clip(blur(al, 2.5) * 4, 0, 1)[..., None]
        g = np.zeros_like(L)
        g[:, :n] = np.clip(side[:, n:n + 1] - side[:, :n], -1.2, 1.2) * w[None, :, None]
        if name == 'base':
            edge = np.ones(d.shape[0], np.float32)
            edge[:n] = 1 - w
            edge[-n:] = 1 - w[::-1]
            g *= edge[:, None, None]
        d2 = np.clip(d * np.exp(g * under), 0, 1)
        c2 = np.clip((np.ascontiguousarray(turn(app)[:, :m]) - (1 - al[..., None]) * d2 * np.ascontiguousarray(turn(sh)[:, :m])[..., None]) / np.maximum(al[..., None], 0.02), 0, 1)
        wgt = np.clip(al * 2, 0, 1) ** 2
        c2 = c2 * wgt[..., None] + ncblur(c2, wgt, 12) * (1 - wgt[..., None])
        seen.append((g * under)[:, :n // 2, 1][under[:, :n // 2, 0] > 0.5])
        turn(deck)[:, :n] = d2[:, :n]
        turn(cloud)[:, :n] = c2[:, :n]
    print('core fringe p5 p50 p95 %.3f %.3f %.3f' % tuple(np.percentile(np.concatenate(seen), [5, 50, 95])))


defringe(deckC, cloudC, core, alphaC, sC)
check = deckC * sC[..., None] * (1 - alphaC[..., None]) + cloudC * alphaC[..., None]
err = np.abs(enc(check).astype(np.int32) - enc(core).astype(np.int32))[belowC > 0.5]
print('core recomposite error mean %.2f p99 %.0f' % (err.mean(), np.percentile(err, 99)))
del check, err, cleanC

body = lum(cloudW) * alpha
height = blur((alpha * (0.3 + 0.7 * np.clip(lum(cloudW) / 0.6, 0, 1))).astype(np.float32), 6)
height = np.clip(height / np.percentile(height[alpha > 0.5], 97), 0, 1)
hmap = np.zeros((HH, HW, 3), np.uint8)
hmap[..., 2] = np.clip(cv2.resize(height, (HW, HH), interpolation=cv2.INTER_AREA) * 255 + 0.5, 0, 255)
hmap[..., 1] = np.clip(cv2.resize(s, (HW, HH), interpolation=cv2.INTER_AREA) * 255 + 0.5, 0, 255)



def place(x):
    full = np.zeros((WH, WW) + x.shape[2:], np.float32)
    full[:bh, bx:bx + bw] = cv2.resize(x, (bw, bh), interpolation=cv2.INTER_AREA)
    return full


def knit(deck, a, cloud):
    inside = np.zeros((WH, WW), np.float32)
    inside[:bh, bx:bx + bw] = 1
    outside = 1 - inside
    yy, xx = np.mgrid[0:WH, 0:WW].astype(np.int32)
    ny = np.clip(yy, 0, bh - 1)
    nx = np.clip(xx, bx, bx + bw - 1)
    dist = np.hypot(yy - ny, xx - nx).astype(np.float32)
    iy = np.clip(yy, 0, bh - 1 - KNIT_IN)
    ix = np.clip(xx, bx + KNIT_IN, bx + bw - 1 - KNIT_IN)
    oy = np.clip(np.where(yy > bh - 1, bh - 1 + KNIT_OUT, iy), 0, WH - 1)
    ox = np.clip(np.where(xx < bx, bx - KNIT_OUT, np.where(xx > bx + bw - 1, bx + bw - 1 + KNIT_OUT, ix)), 0, WW - 1)
    under_box = yy > bh - 1
    del yy, xx, ny, nx
    far = np.exp(-dist / KNIT_REACH) * (dist > 0)
    close = np.exp(-dist / KNIT_NEAR) * (dist > 0)
    fringe = np.exp(-dist / KNIT_FRINGE) * (dist > 0)

    def strips(ref, x, w_in, w_out):
        m_in = blur(ref * w_in, KNIT_STRIP) / np.maximum(blur(w_in, KNIT_STRIP), 1e-3)
        m_out = blur(x * w_out, KNIT_STRIP) / np.maximum(blur(w_out, KNIT_STRIP), 1e-3)
        return m_in[iy, ix], m_out[oy, ox]

    def along(x, w):
        side = cv2.GaussianBlur(x * w, (0, 0), sigmaX=KNIT_FINE, sigmaY=KNIT_ALONG) / np.maximum(cv2.GaussianBlur(w, (0, 0), sigmaX=KNIT_FINE, sigmaY=KNIT_ALONG), 1e-3)
        base = cv2.GaussianBlur(x * w, (0, 0), sigmaX=KNIT_ALONG, sigmaY=KNIT_FINE) / np.maximum(cv2.GaussianBlur(w, (0, 0), sigmaX=KNIT_ALONG, sigmaY=KNIT_FINE), 1e-3)
        return np.where(under_box, base, side)

    refD, refC, refA = place(deckC), place(cloudC), place(alphaC)
    deck = deck.copy()
    cloud = cloud.copy()
    wo = outside * belowf
    for c in range(3):
        lx = np.log(np.maximum(deck[..., c], 1e-3))
        m_in, m_out = strips(np.log(np.maximum(refD[..., c], 1e-3)), lx, inside * belowf, wo)
        goal = ncblur(m_in, outside, KNIT_ALONG)
        d = ncblur(np.clip(m_in - m_out, -1.2, 1.2), outside, KNIT_ALONG)
        coarse = ncblur(d, outside, KNIT_COARSE)
        edge = np.clip(goal - along(lx, wo), -1.2, 1.2)
        deck[..., c] *= np.exp((edge * fringe + (coarse * far + (d - coarse) * close) * (1 - fringe)) * (dist > 0))
        if c == 1:
            print('deck knit step p5 p50 p95 %.3f %.3f %.3f' % tuple(np.percentile(d[(dist > 0) & (dist < 40) & below], [5, 50, 95])))
    m_in, m_out = strips(refA, a, inside * belowf, wo)
    da = ncblur(np.clip(m_in - m_out, -1, 1), outside, KNIT_ALONG)
    print('alpha knit step p5 p50 p95 %.3f %.3f %.3f' % tuple(np.percentile(da[(dist > 0) & (dist < 40) & below], [5, 50, 95])))
    a2 = np.where(a > 0.03, np.clip(a + da * close, 0, 1), a).astype(np.float32)
    w_in = inside * refA
    w_out = outside * a
    sure = np.clip(np.minimum(blur(w_in, KNIT_STRIP)[iy, ix], blur(w_out, KNIT_STRIP)[oy, ox]) / 0.08, 0, 1)
    for c in range(3):
        m_in, m_out = strips(np.log(np.maximum(refC[..., c], 1e-3)), np.log(np.maximum(cloud[..., c], 1e-3)), w_in, w_out)
        d = ncblur(np.clip(m_in - m_out, -0.7, 0.7) * sure, outside, KNIT_ALONG)
        cloud[..., c] *= np.exp(d * close)
    m = inside[..., None]
    deck = deck * (1 - m) + refD * m
    cloud = cloud * (1 - m) + refC * m
    a2 = a2 * (1 - inside) + refA * inside
    return np.clip(deck, 0, 1).astype(np.float32), np.clip(cloud, 0, 1).astype(np.float32), a2.astype(np.float32)


deckW, cloudK, alphaW = knit(deckW, alpha, cloudW)


def taper(deck, cloud, a, sh):
    ease = lambda x: np.clip(x, 0, 1) ** 2 * (3 - 2 * np.clip(x, 0, 1))
    xl, xr, yb = bx, bx + bw - 1, bh - 1
    L = np.log(np.maximum(lum(deck * sh[..., None] * (1 - a[..., None]) + cloud * a[..., None]), 1e-3)).astype(np.float32)
    gx = cv2.Sobel(L, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(L, cv2.CV_32F, 0, 1, ksize=3)
    inside = np.zeros(L.shape, np.float32)
    inside[:bh, bx:bx + bw] = 1
    jxx, jyy, jxy = (cv2.GaussianBlur(j * inside, (0, 0), 16) for j in (gx * gx, gy * gy, gx * gy))
    th = 0.5 * np.arctan2(2 * jxy, jxx - jyy) + np.pi / 2
    coh = np.sqrt((jxx - jyy) ** 2 + 4 * jxy ** 2) / np.maximum(jxx + jyy, 1e-12)
    slope = (np.clip(np.tan(th), -0.8, 0.8) * ease((np.abs(np.cos(th)) - 0.3) / 0.15)).astype(np.float32)
    y0, y1, x0, x1 = 0, bh + TAPER_MAX + 1, bx - TAPER_MAX - 1, bx + bw + TAPER_MAX + 1
    Y, X = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx = np.maximum(np.maximum(xl - X, X - xr), 0)
    dy = np.maximum(Y - yb, 0)
    dist = np.hypot(dx, dy)
    zone = (dist > 0) & (dist <= TAPER_MAX)
    n = cv2.GaussianBlur(np.random.RandomState(TAPER_SEED).rand(y1 - y0, x1 - x0).astype(np.float32), (0, 0), 22)
    n = np.clip((n - n[zone].min()) / (n[zone].max() - n[zone].min()), 0, 1)
    reach = TAPER_MIN + (TAPER_MAX - TAPER_MIN) * n
    half = TAPER_STRIP // 2
    g1 = lambda x, sig: cv2.GaussianBlur(np.ascontiguousarray(x, np.float32).reshape(-1, 1), (0, 0), sigmaX=0.01, sigmaY=sig, borderType=cv2.BORDER_REPLICATE).ravel()
    along = lambda i, sig=TAPER_ALONG: g1(slope[i] * coh[i], sig) / np.maximum(g1(coh[i], sig), 1e-6)
    ml, mr = along(np.s_[:bh, xl + half]), along(np.s_[:bh, xr - half])
    base = np.s_[yb - half, xl:xr + 1]
    mb = along(base, TAPER_ALONG / TAPER_SLANT ** 2)
    sgn = 1.0 if (mb * coh[base]).sum() >= 0 else -1.0
    mb = sgn * np.maximum(sgn * mb, TAPER_SLANT)
    Yi = np.clip(Y, 0, yb).astype(np.int32)
    ms = np.where(X > xr, mr[Yi], ml[Yi])
    mB = mb[np.clip(X, xl, xr).astype(np.int32) - xl]
    foot = ease((Y - (yb - TAPER_MAX)) / TAPER_MAX)
    m = np.where(dy > 0, mB, np.where(dx > 0, ms * (1 - foot) + mB * foot, ms)).astype(np.float32)
    side = np.where(X > xr, 1.0, -1.0).astype(np.float32)
    yh = Y - side * m * dx
    xh = X - dy / np.where(dy > 0, m, 1)
    hits = (dx > 0) & (yh <= yb)
    v = np.where(hits, 1.0, 1 - ease(np.maximum(np.maximum(xl - xh, xh - xr), 0) / TAPER_MISS))
    v = np.where((dx > 0) & (dy == 0), 1 - ease(np.maximum(yh - yb, 0) / TAPER_MISS), v)
    w = ((1 - ease(dist / reach)) * v * zone).astype(np.float32)
    ld = np.log(np.maximum(deck, 1e-6))
    pm = cloud * a[..., None]
    lines = lambda x, sig: cv2.GaussianBlur(np.ascontiguousarray(x, np.float32).reshape(len(x), 1, -1), (0, 0), sigmaX=0.01, sigmaY=sig).reshape(len(x), -1)

    def carried(img, sig):
        img = img.reshape(img.shape[0], img.shape[1], -1)
        el = lines(img[:bh, xl:xl + 4].mean(1), sig)
        er = lines(img[:bh, xr - 3:xr + 1].mean(1), sig)
        eb = lines(img[yb - 3:yb + 1, xl:xr + 1].mean(0), sig * TAPER_BASE)
        ys = np.clip(yh, 0, yb)
        r0 = np.floor(ys).astype(np.int32)
        r1 = np.minimum(r0 + 1, yb)
        fr = (ys - r0)[..., None]
        xs = np.clip(xh, xl, xr) - xl
        c0 = np.floor(xs).astype(np.int32)
        c1 = np.minimum(c0 + 1, bw - 1)
        fc = (xs - c0)[..., None]
        sides = np.where(side[..., None] > 0, er[r0] * (1 - fr) + er[r1] * fr, el[r0] * (1 - fr) + el[r1] * fr)
        return np.where((hits | (dy == 0))[..., None], sides, eb[c0] * (1 - fc) + eb[c1] * fc)

    d2, c2, a2 = deck.copy(), cloud.copy(), a.copy()
    sel = w > 0
    wz = w[..., None]
    dv = np.exp(carried(ld, 1.5) * wz + ld[y0:y1, x0:x1] * (1 - wz))
    av = carried(a, 1.0)[..., 0] * w + a[y0:y1, x0:x1] * (1 - w)
    pv = carried(pm, 1.0) * wz + pm[y0:y1, x0:x1] * (1 - wz)
    d2[y0:y1, x0:x1][sel] = dv[sel]
    a2[y0:y1, x0:x1][sel] = av[sel]
    ok = sel & (av > 0.004)
    c2[y0:y1, x0:x1][ok] = (pv / np.maximum(av, 0.004)[..., None])[ok]
    src = np.where(hits | (dy == 0), np.clip(yh, 0, yb), np.clip(xh, xl, xr))
    for name, pick, ax in (('left', (dy == 0) & (X < xl), 0), ('right', (dy == 0) & (X > xr), 0), ('base', (dy > 0) & (dx == 0), 1)):
        print('taper %s: %d texels carried, slope p10 p50 p90 %.2f %.2f %.2f' % (name, (sel & pick).sum(), *np.percentile(m[sel & pick], [10, 50, 90])))
        cut = lambda q, i: q[1:] if (ax, i) == (0, 0) else q[:-1] if ax == 0 else q[:, 1:] if i == 0 else q[:, :-1]
        both = cut(pick, 0) & cut(pick, 1) & (np.minimum(cut(w, 0), cut(w, 1)) > 0.1)
        step = np.abs(np.diff(src, axis=ax))[both]
        print('taper %s: foot of the line between neighbours along the border, largest step %.1f texels, %d over 3' % (name, step.max(), (step > 3).sum()))
    print('taper base: lines slant %s, share at the least slant %.2f' % ('right' if sgn > 0 else 'left', (np.abs(mb) <= TAPER_SLANT + 1e-6).mean()))
    for name, i0, o0 in (('left', bx + 1, bx - 4), ('right', bx + bw - 4, bx + bw + 1)):
        st = np.abs(a[:bh, i0:i0 + 3].mean(1) - a[:bh, o0:o0 + 3].mean(1))
        st2 = np.abs(a2[:bh, i0:i0 + 3].mean(1) - a2[:bh, o0:o0 + 3].mean(1))
        print('taper %s: rows with an alpha step over 0.2 at the border %d before, %d after; largest %.2f before, %.2f after' % (name, (st > 0.2).sum(), (st2 > 0.2).sum(), st.max(), st2.max()))
    for name, x in (('deck before', deck), ('deck after', d2)):
        e = enc(x)
        gs = np.abs(e[:bh, bx + bw - 4:bx + bw - 1].astype(np.int32).mean((1, 2)) - e[:bh, bx + bw + 1:bx + bw + 4].astype(np.int32).mean((1, 2)))
        gb = np.abs(e[bh - 4:bh - 1, bx:bx + bw].astype(np.int32).mean((0, 2)) - e[bh + 1:bh + 4, bx:bx + bw].astype(np.int32).mean((0, 2)))
        print('taper %s: step across the right border mean %.2f p95 %.1f, across the base mean %.2f p95 %.1f' % (name, gs.mean(), np.percentile(gs, 95), gb.mean(), np.percentile(gb, 95)))
    return np.clip(d2, 0, 1).astype(np.float32), np.clip(c2, 0, 1).astype(np.float32), np.clip(a2, 0, 1).astype(np.float32)


deckT, cloudT, alphaT = taper(deckW, cloudK, alphaW, s)
comp = deckT * s[..., None] * (1 - alphaT[..., None]) + cloudT * alphaT[..., None]
for name, i0, o0 in (('left', bx + 2, bx - 10), ('right', bx + bw - 10, bx + bw + 2)):
    gap = np.abs(enc(blur(comp[:bh, i0:i0 + 8], 4)).astype(np.int32).mean(1) - enc(blur(comp[:bh, o0:o0 + 8], 4)).astype(np.int32).mean(1))[below[:bh, bx + 4]]
    print('%s border composite step mean %.2f p95 %.1f' % (name, gap.mean(), np.percentile(gap, 95)))
del comp

from PIL import Image


def crisp(img8, texels, k):
    f = img8.astype(np.float32)
    band = blur(f, 0.6 * texels) - blur(f, 2.0 * texels)
    return np.clip(f + band * (k[..., None] if f.ndim == 3 else k) + 0.5, 0, 255).astype(np.uint8)


def reach(w, h, box):
    d = cgeo.canvas_rays(WW, WH) if box is None else cgeo.canvas_rays(WW, WH)[:bh, bx:bx + bw]
    ok, t = cgeo.hit(d)
    k = np.where(ok, np.clip(CRISP / np.maximum(t, 0.5), 0, CRISP_MAX), 0).astype(np.float32)
    return cv2.resize(k, (w, h), interpolation=cv2.INTER_LINEAR)


def pixels(rgb, a, texels, k):
    img = crisp(enc(rgb)[:, :, ::-1], texels, k)
    if a is not None:
        img = np.dstack([img, crisp(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8), texels, k * (a > 0.02))])
    return img


def save(name, rgb, a, size_web, texels, k):
    im = Image.fromarray(pixels(rgb, a, texels, k))
    kw = dict(quality=95, method=4)
    if a is not None:
        kw['exact'] = True
    im.save(OUT + '/full/' + name, **kw)
    im.resize(size_web, Image.LANCZOS).save(OUT + '/web/' + name, **kw)


def resave(name, rgb, a, rgb2, a2, size_web, texels, k):
    p0, p1 = pixels(rgb, a, texels, k), pixels(rgb2, a2, texels, k)
    keep = np.zeros((WH, WW), np.uint8)
    keep[:bh, bx:bx + bw] = 255
    for sub, size in (('/full/', None), ('/web/', size_web)):
        q0, q1, kp = (p0, p1, keep) if size is None else (np.array(Image.fromarray(x).resize(size, Image.LANCZOS)) for x in (p0, p1, keep))
        q1 = np.where(kp[..., None] > 0, q0, q1)
        old = np.array(Image.open(OUT + sub + name)).astype(np.int32)
        new = np.clip(old + q1.astype(np.int32) - q0.astype(np.int32), 0, 255).astype(np.uint8)
        Image.fromarray(new).save(OUT + sub + name, lossless=True, quality=80, method=4, exact=True)
        ch = np.abs(new.astype(np.int32) - old).max(2) > 0
        ys, xs = np.where(ch)
        print('%s%s taper: %d texels changed, x %d to %d, y %d to %d' % (sub, name, ch.sum(), xs.min(), xs.max(), ys.min(), ys.max()))


kC = reach(CW, CH, True)
kW = reach(WW, WH, None)
save('close-deck.webp', deckC, None, (CW // 2, CH // 2), CW / 1920, kC)
save('close-cloud.webp', cloudC, alphaC, (CW // 2, CH // 2), CW / 1920, kC)
save('close-deck-wide.webp', deckW, None, (WW // 2, WH // 2), bw / 1920, kW)
save('close-cloud-wide.webp', cloudK, alphaW, (WW // 2, WH // 2), bw / 1920, kW)
resave('close-deck-wide.webp', deckW, None, deckT, None, (WW // 2, WH // 2), bw / 1920, kW)
resave('close-cloud-wide.webp', cloudK, alphaW, cloudT, alphaT, (WW // 2, WH // 2), bw / 1920, kW)
cv2.imwrite(OUT + '/full/close-height.png', hmap)
cv2.imwrite(OUT + '/web/close-height.png', cv2.resize(hmap, (HW // 2, HH // 2), interpolation=cv2.INTER_AREA))
cv2.imwrite(WORK + 'wide.png', enc(wide))
prev = lambda x: cv2.resize(x, (1024, 576), interpolation=cv2.INTER_AREA)
sheet = np.concatenate([np.concatenate([prev(enc(wide)), prev(enc(deckW))], 1), np.concatenate([prev(enc(cloudW * alpha[..., None])), prev(cv2.cvtColor(hmap, cv2.COLOR_BGR2RGB)[:, :, ::-1])], 1)], 0)
cv2.imwrite(WORK + 'layers-sheet.jpg', sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
