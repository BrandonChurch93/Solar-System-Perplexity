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


wide = seam(wide, box)
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

alpha = alpha_of(wide, cleanN) * below
alpha = np.where(blur(alpha, 6) > 0.03, alpha, 0).astype(np.float32)
near = np.clip(blur(cv2.dilate((alpha > 0.3).astype(np.float32), np.ones((3, 3), np.uint8), iterations=1), 110) * 6, 0, 1)
clear = (alpha < 0.03).astype(np.float32)
raw = np.clip(lum(wide) / np.maximum(lum(cleanN), 1e-4), 0.2, 1)
s = ncblur(raw, clear, 7)
s = np.where(clear > 0, s, ncblur(raw, clear, 40))
s = blur(s.astype(np.float32), 5)
dead = 0.1
s = 1 - np.clip((1 - s) - dead, 0, 1) / (1 - dead) * 1.0
s = 1 - (1 - s) * near
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
check = deckW * s[..., None] * (1 - alpha[..., None]) + cloudW * alpha[..., None]
err = np.abs(enc(check).astype(np.int32) - enc(wide).astype(np.int32))[below]
print('wide recomposite error mean %.2f p99 %.0f' % (err.mean(), np.percentile(err, 99)))

cleanC = cv2.resize(cleanN[:bh, bx:bx + bw], (CW, CH), interpolation=cv2.INTER_CUBIC)
sC = cv2.resize(s[:bh, bx:bx + bw], (CW, CH), interpolation=cv2.INTER_LINEAR)
belowC = cv2.resize(below[:bh, bx:bx + bw].astype(np.float32), (CW, CH), interpolation=cv2.INTER_LINEAR)
alphaC = alpha_of(core, cleanC) * belowC
alphaC = np.where(cv2.resize(blur(alpha, 6)[:bh, bx:bx + bw], (CW, CH), interpolation=cv2.INTER_LINEAR) > 0.03, alphaC, 0).astype(np.float32)
deckC, cloudC = split(core, cleanC, alphaC, sC)
check = deckC * sC[..., None] * (1 - alphaC[..., None]) + cloudC * alphaC[..., None]
err = np.abs(enc(check).astype(np.int32) - enc(core).astype(np.int32))[belowC > 0.5]
print('core recomposite error mean %.2f p99 %.0f' % (err.mean(), np.percentile(err, 99)))

body = lum(cloudW) * alpha
height = blur((alpha * (0.3 + 0.7 * np.clip(lum(cloudW) / 0.6, 0, 1))).astype(np.float32), 6)
height = np.clip(height / np.percentile(height[alpha > 0.5], 97), 0, 1)
hmap = np.zeros((HH, HW, 3), np.uint8)
hmap[..., 2] = np.clip(cv2.resize(height, (HW, HH), interpolation=cv2.INTER_AREA) * 255 + 0.5, 0, 255)
hmap[..., 1] = np.clip(cv2.resize(s, (HW, HH), interpolation=cv2.INTER_AREA) * 255 + 0.5, 0, 255)

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


def save(name, rgb, a, size_web, texels, k):
    img = crisp(enc(rgb)[:, :, ::-1], texels, k)
    if a is not None:
        img = np.dstack([img, crisp(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8), texels, k * (a > 0.02))])
    im = Image.fromarray(img)
    kw = dict(quality=95, method=4)
    if a is not None:
        kw['exact'] = True
    im.save(OUT + '/full/' + name, **kw)
    im.resize(size_web, Image.LANCZOS).save(OUT + '/web/' + name, **kw)


kC = reach(CW, CH, True)
kW = reach(WW, WH, None)
save('close-deck.webp', deckC, None, (CW // 2, CH // 2), CW / 1920, kC)
save('close-cloud.webp', cloudC, alphaC, (CW // 2, CH // 2), CW / 1920, kC)
save('close-deck-wide.webp', deckW, None, (WW // 2, WH // 2), bw / 1920, kW)
save('close-cloud-wide.webp', cloudW, alpha, (WW // 2, WH // 2), bw / 1920, kW)
cv2.imwrite(OUT + '/full/close-height.png', hmap)
cv2.imwrite(OUT + '/web/close-height.png', cv2.resize(hmap, (HW // 2, HH // 2), interpolation=cv2.INTER_AREA))
cv2.imwrite(WORK + 'wide.png', enc(wide))
prev = lambda x: cv2.resize(x, (1024, 576), interpolation=cv2.INTER_AREA)
sheet = np.concatenate([np.concatenate([prev(enc(wide)), prev(enc(deckW))], 1), np.concatenate([prev(enc(cloudW * alpha[..., None])), prev(cv2.cvtColor(hmap, cv2.COLOR_BGR2RGB)[:, :, ::-1])], 1)], 0)
cv2.imwrite(WORK + 'layers-sheet.jpg', sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
