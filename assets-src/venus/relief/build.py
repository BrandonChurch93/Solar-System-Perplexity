import json
import os
import sys
import cv2
import numpy as np
from scipy import ndimage as ndi
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/venus/relief')
from cam import *

SLOPE = 0.0015
OUT = 'public/assets/venus/'
K = 2
VIEW = lambda pts: [(1300 + x / 1.7, 740 + y / 1.7) for x, y in pts]
TOWERS = [
    {
        'outline': VIEW([(40, 345), (130, 265), (170, 215), (205, 195), (240, 212), (255, 245), (300, 200), (350, 175), (405, 140), (435, 92), (462, 90), (482, 115), (510, 100), (545, 95), (572, 105), (600, 100), (645, 125), (670, 160), (668, 195), (640, 215), (615, 265), (600, 300), (588, 335), (565, 372), (520, 390), (440, 380), (350, 345), (250, 335), (150, 340)]),
        'base': VIEW([(40, 345), (150, 340), (250, 335), (350, 345), (440, 380), (520, 390), (565, 372)]),
        'fade': 34,
    },
    {
        'outline': VIEW([(765, 445), (800, 400), (830, 368), (878, 300), (900, 278), (932, 208), (975, 188), (1012, 198), (1050, 203), (1090, 188), (1108, 215), (1102, 258), (1130, 248), (1160, 253), (1200, 238), (1218, 262), (1212, 300), (1196, 332), (1192, 390), (1185, 440), (1170, 480), (1000, 500), (850, 490)]),
        'base': VIEW([(765, 445), (850, 490), (1000, 500), (1170, 480), (1220, 470)]),
        'fade': 46,
    },
]
TOWER_VIEW = (1300, 740, 2100, 1100)
L1_BOX = (1310, 760, 770, 290)
SUN = (2103.6, 503.2)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def canvas2x():
    ext = cv2.imread(W + 'ext-3520.png')
    big = cv2.resize(ext, (CW * K, CH * K), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    l = cv2.imread(W + 'strip-l-2x.png')
    r = cv2.imread(W + 'strip-r-2x.png')
    b = cv2.imread(W + 'strip-b-2x.png')
    big[0:AH * K, 0:l.shape[1]] = l
    big[0:AH * K, CW * K - r.shape[1]:] = r
    y0 = CH * K - b.shape[0]
    ramp = np.clip((np.arange(b.shape[0]) - 16) / 96, 0, 1)[:, None, None]
    big[y0:] = big[y0:] * (1 - ramp) + b * ramp
    core = cv2.imread('out/work/venus/close-5632.png')
    w = cv2.resize(cv2.imread(W + 'ext-weight.png', 0), (CW * K, CH * K), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
    ww = w[0:AH * K, MX * K:(MX + AW) * K, None]
    big[0:AH * K, MX * K:(MX + AW) * K] = core * ww + big[0:AH * K, MX * K:(MX + AW) * K] * (1 - ww)
    return big


def grade(big):
    y0 = AH * K
    x0 = MX * K
    x1 = (MX + AW) * K
    sig = 70 * K
    img = big / 255
    core = cv2.GaussianBlur(img[:y0, x0:x1], (0, 0), sig, borderType=cv2.BORDER_REFLECT)
    yy = np.clip(np.arange(img.shape[0]), 0, y0 - 1)
    xx = np.clip(np.arange(img.shape[1]), x0, x1 - 1) - x0
    target = core[yy][:, xx]
    own = cv2.GaussianBlur(img, (0, 0), sig, borderType=cv2.BORDER_REFLECT)
    ratio = np.clip((target + 0.01) / (own + 0.01), 0.15, 1.6)
    rows = np.arange(img.shape[0], dtype=np.float32)[:, None]
    cols = np.arange(img.shape[1], dtype=np.float32)[None, :]
    out = np.maximum(np.maximum(x0 - cols, cols - x1), rows - y0)
    w = smooth(0, 40 * K, out) * smooth(y0 - 700 * K, y0 - 450 * K, rows)
    big[:] = np.clip(img * ratio ** w[..., None], 0, 1) * 255


def save_color(img, name, q=(94, 90)):
    cv2.imwrite(f'{OUT}full/{name}', np.clip(img + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, q[0]])
    half = cv2.resize(img, (img.shape[1] // 2, img.shape[0] // 2), interpolation=cv2.INTER_AREA)
    cv2.imwrite(f'{OUT}web/{name}', np.clip(half + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, q[1]])
    return [img.shape[1], img.shape[0]], [half.shape[1], half.shape[0]]


def save_gray(a, name, full, web):
    for key, size in (('full', full), ('web', web)):
        cv2.imwrite(f'{OUT}{key}/{name}', np.clip(cv2.resize(a, tuple(size), interpolation=cv2.INTER_AREA) * 255 + 0.5, 0, 255).astype(np.uint8))


def save_dist(D, name, full, web):
    for key, size in (('full', full), ('web', web)):
        cv2.resize(D.astype(np.float32), tuple(size), interpolation=cv2.INTER_AREA).astype('<f4').tofile(f'{OUT}{key}/{name}')


def scene(bgr):
    v = np.clip(bgr / 255, 0, 1)
    y = np.clip(np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4), 0, 0.985)
    kk = 0.59 * y - 0.03
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


def display(x):
    y = np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)
    return np.where(y <= 0.0031308, y * 12.92, 1.055 * y ** (1 / 2.4) - 0.055) * 255


def towers(big):
    vx0, vy0, vx1, vy1 = TOWER_VIEW
    crop = np.clip(big[vy0 * K:vy1 * K, (MX + vx0) * K:(MX + vx1) * K], 0, 255).astype(np.uint8)
    hh, ww = crop.shape[:2]
    T2 = np.zeros((CH * K, CW * K), np.float32)
    CUR = np.full((CH, CW), HORIZON, np.float32)
    u = up()
    level = lambda d: np.sqrt(np.maximum(1 - (d @ u) ** 2, 1e-6))
    ell = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    gy, gx = np.mgrid[0:hh, 0:ww].astype(np.float32)
    for tw in TOWERS:
        pts = np.round((np.array(tw['outline']) - (vx0, vy0)) * K).astype(np.int32)
        inside = np.zeros((hh, ww), np.uint8)
        cv2.fillPoly(inside, [pts], 1)
        sure = cv2.erode(inside, ell(14 * K))
        maybe = cv2.dilate(inside, ell(10 * K))
        gc = np.full((hh, ww), cv2.GC_BGD, np.uint8)
        gc[maybe > 0] = cv2.GC_PR_BGD
        gc[inside > 0] = cv2.GC_PR_FGD
        gc[sure > 0] = cv2.GC_FGD
        cv2.grabCut(crop, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
        m = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, ell(2 * K))
        n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
        m = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
        m = ndi.binary_fill_holes(cv2.morphologyEx(m, cv2.MORPH_CLOSE, ell(3 * K))).astype(np.float32)
        base = np.array(sorted(tw['base']))
        yb = np.interp(gx / K + vx0, base[:, 0], base[:, 1])
        m *= smooth(0, tw['fade'], yb - (gy / K + vy0))
        m = cv2.GaussianBlur(m, (0, 0), 1.0)
        sl = (slice(vy0 * K, vy1 * K), slice((MX + vx0) * K, (MX + vx1) * K))
        T2[sl] = np.maximum(T2[sl], m)
        cols = np.flatnonzero(m.max(0) > 0.02) / K + vx0
        x0c, x1c = int(cols.min()) + MX, int(cols.max()) + MX + 1
        bx = np.arange(x0c, x1c, dtype=np.float32)
        by = np.interp(bx - MX, base[:, 0], base[:, 1]).astype(np.float32)
        db = rays(bx + 0.5, by + 0.5)
        sb, _ = sphere(db)
        reach = float(np.median(sb * level(db)))
        yy2, xx2 = np.mgrid[0:CH, x0c - 40:x1c + 40].astype(np.float32)
        CUR[:, x0c - 40:x1c + 40] = np.minimum(CUR[:, x0c - 40:x1c + 40], reach / level(rays(xx2 + 0.5, yy2 + 0.5)))
        print('tower reach', reach)
    T = cv2.resize(T2, (CW, CH), interpolation=cv2.INTER_AREA)
    return T2, T, CUR



def spread(D, inside):
    idx = ndi.distance_transform_edt(~inside, return_distances=False, return_indices=True)
    return D[idx[0], idx[1]]


def main():
    os.makedirs(OUT + 'full', exist_ok=True)
    os.makedirs(OUT + 'web', exist_ok=True)
    dep = np.fromfile(W + 'ext-depth.raw', dtype='<f4').reshape(CH, CW)
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    d = rays(xx + 0.5, yy + 0.5)
    S, hit = sphere(d)
    el = elevation(d)
    del d
    core = np.zeros((CH, CW), bool)
    core[:AH, MX:MX + AW] = True
    k = hit & (el < -0.4) & core
    idx = np.flatnonzero(k.ravel())[::97]
    dv, sv = dep.ravel()[idx], S.ravel()[idx]
    b = 1 / HORIZON
    fit = least_squares(lambda p: np.log(1 / (p[0] * np.maximum(dv, 1e-4) ** p[1] + b)) - np.log(sv), [1.0, 1.0], loss='soft_l1', f_scale=0.1)
    a, g = fit.x
    print('depth fit', a, g, b, 'median abs log error', float(np.median(np.abs(fit.fun))))
    Ss = np.where(hit, S, HORIZON)

    def dist(v):
        D = 1 / (a * np.maximum(v, 1e-4) ** g + b)
        wh = smooth(-3.0, -0.8, el)
        D = np.exp(np.log(D) * (1 - wh) + np.log(Ss) * wh)
        return np.where(hit & (el < -0.03), D, HORIZON)

    big = canvas2x()
    grade(big)
    cv2.imwrite(W + 'canvas-1x.png', np.clip(cv2.resize(big, (CW, CH), interpolation=cv2.INTER_AREA) + 0.5, 0, 255).astype(np.uint8))
    T2, T, CUR = towers(big)
    Td = np.clip(cv2.GaussianBlur(cv2.dilate((T > 0.02).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))), (0, 0), 4) * 1.3, 0, 1)

    dep0 = dep.copy()
    opw = np.zeros_like(dep)
    opw[:AH, MX:MX + AW] = cv2.GaussianBlur(cv2.morphologyEx(dep[:AH, MX:MX + AW], cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (420, 300))), (0, 0), 8)
    dep0 = dep0 * (1 - Td) + opw * Td
    D0 = dist(dep0)
    rho0 = np.where(hit, D0 / Ss, 1)
    rho0 = 1 - (1 - rho0) * (1 - 0.8 * smooth(AH - 24, AH + 276, yy))
    q = 8
    small = cv2.resize(np.log(rho0).astype(np.float32), (CW // q, CH // q), interpolation=cv2.INTER_AREA)
    r = int(np.ceil(0.8 / (SLOPE * q)))
    ky, kx = np.mgrid[-r:r + 1, -r:r + 1]
    cone = ndi.grey_erosion(small, structure=-(SLOPE * q) * np.hypot(ky, kx), mode='nearest')
    lim = np.minimum(np.log(rho0), cv2.resize(cone, (CW, CH), interpolation=cv2.INTER_CUBIC))
    print('slope limit mean abs change of log ratio', float(np.abs(lim - np.log(rho0)).mean()), 'share changed over 0.03', float((np.log(rho0) - lim > 0.03).mean()))
    rho0 = np.exp(lim)
    D0 = np.exp(cv2.GaussianBlur(np.log(Ss * rho0), (0, 0), 6))
    D0 = np.where(hit & (el < -0.03), D0, HORIZON)
    np.save(W + 'd0.npy', D0.astype(np.float32))

    cv2.imwrite(W + 'canvas-preview.jpg', cv2.resize(big, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])

    up2 = lambda m: cv2.resize(m, (CW * K, CH * K), interpolation=cv2.INTER_LINEAR)
    Y0 = int(np.floor(np.load('out/work/venus/close-horizon-pts.npy')[:, 1].min() - 30))
    report = {}

    clean = cv2.resize(cv2.imread(W + 'clean-2816.png'), (AW * K, AH * K), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    c2 = cv2.imread(W + 'strip-c-2x.png')
    clean[700 * K:700 * K + c2.shape[0], 1250 * K:1250 * K + c2.shape[1]] = c2
    x, y, w, h = L1_BOX
    cx = MX + x
    box = (slice(y * K, (y + h) * K), slice(cx * K, (cx + w) * K))
    ta = T2[box]
    wc = smooth(0.6, 0.95, ta)[..., None]
    orig = big[box].copy()
    under = orig * (1 - wc) + clean[y * K:(y + h) * K, x * K:(x + w) * K] * wc
    t3 = ta[..., None]
    tower = np.where(t3 > 0.05, (scene(orig) - (1 - t3) * scene(under)) / np.maximum(t3, 0.05), scene(orig))
    lost = np.maximum(-tower, 0) * t3
    print('tower rebuild clipped, scene units, max', float(lost.max()), 'share over 0.01', float((lost.max(-1) > 0.01).mean()))
    tower = display(np.maximum(tower, 0))
    full, web = save_color(tower, 'relief-L1-color.jpg', (96, 92))
    save_gray(ta, 'relief-L1-alpha.png', full, web)
    D1 = cv2.GaussianBlur(np.minimum(CUR, 0.97 * D0)[y:y + h, cx:cx + w], (0, 0), 3)
    save_dist(D1, 'relief-L1-dist.bin', [w, h], [w // 2, h // 2])
    report['L1'] = {'box': [x * K, y * K, w * K, h * K], 'distSize': {'full': [w, h], 'web': [w // 2, h // 2]}, 'alpha': True, 'dist': [float(D1.min()), float(D1.max())]}

    big[box] = under
    del clean
    h0 = CH - Y0
    full, web = save_color(big[Y0 * K:], 'relief-L0-color.jpg')
    save_dist(D0[Y0:], 'relief-L0-dist.bin', [CW // 2, h0 // 2], [CW // 4, h0 // 4])
    report['L0'] = {'box': [-MX * K, Y0 * K, CW * K, h0 * K], 'distSize': {'full': [CW // 2, h0 // 2], 'web': [CW // 4, h0 // 4]}, 'alpha': False, 'dist': [float(D0[Y0:].min()), float(D0[Y0:].max())]}
    cv2.imwrite(W + 'l0-preview.jpg', cv2.resize(big, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])

    A = cv2.imread('references/approved/venus-close.jpg').astype(np.float32) / 255
    lum = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY)
    busy = cv2.GaussianBlur(np.abs(lum - cv2.GaussianBlur(lum, (0, 0), 6)), (0, 0), 10)
    ax, ay = np.meshgrid(np.arange(AW, dtype=np.float32), np.arange(AH, dtype=np.float32))
    basin = np.exp(-(((ax - 1700) / 620) ** 2 + ((ay - 930) / 260) ** 2) ** 2)
    haze = basin * (1 - smooth(0.012, 0.03, busy)) * smooth(0.12, 0.3, lum)
    ang = np.degrees(np.arctan2(ay - SUN[1], ax - SUN[0]))
    rad = np.hypot(ax - SUN[0], ay - SUN[1])
    shaft = smooth(96, 106, ang) * (1 - smooth(150, 161, ang)) * smooth(430, 560, rad) * (1 - smooth(1000, 1350, rad))
    tc = T[:AH, MX:MX + AW]
    tdc = Td[:AH, MX:MX + AW]
    masks = np.zeros((CH, CW, 3), np.float32)
    masks[:AH, MX:MX + AW, 2] = np.clip(cv2.GaussianBlur(haze * (1 - tdc), (0, 0), 40) * 1.6, 0, 1)
    masks[:AH, MX:MX + AW, 1] = cv2.GaussianBlur(shaft * (1 - tdc), (0, 0), 10)
    m = masks[Y0:]
    for key, size in (('full', (CW // 2, h0 // 2)), ('web', (CW // 4, h0 // 4))):
        cv2.imwrite(f'{OUT}{key}/relief-masks.png', np.clip(cv2.resize(m, size, interpolation=cv2.INTER_AREA) * 255 + 0.5, 0, 255).astype(np.uint8))
    prev = (A * 0.6 + np.stack([masks[:AH, MX:MX + AW, 2] * 0, masks[:AH, MX:MX + AW, 1], masks[:AH, MX:MX + AW, 2]], -1) * 0.6 + np.stack([tc * 0.5, tc * 0, tc * 0], -1))
    cv2.imwrite(W + 'masks-preview.jpg', cv2.resize(np.clip(prev * 255, 0, 255).astype(np.uint8), (AW // 2, AH // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    vis = np.clip(np.log(np.stack([D0, D0, np.where(T > 0.5, CUR, D0)], -1)) / np.log(HORIZON), 0, 1)
    cv2.imwrite(W + 'dist-preview.jpg', cv2.resize((vis * 255).astype(np.uint8), (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])

    u = up()
    json.dump({
        'source': 'references/approved/venus-close.jpg',
        'imageSize': {'full': [AW * K, AH * K], 'web': [AW, AH]},
        'boxUnits': 'full-set pixels, origin top-left of the close image',
        'camera': {'vfovDeg': VFOV, 'pitchDeg': PITCH, 'rollDeg': ROLL, 'up': [float(v) for v in u], 'dipDeg': DIP, 'radius': R, 'horizonDistance': HORIZON, 'sun': [SUN[0] / AW, SUN[1] / AH]},
        'depthFit': {'a': float(a), 'g': float(g), 'b': float(b)},
        'drawOrder': ['L0', 'L1'],
        'layers': report,
        'masks': {'box': report['L0']['box'], 'channels': {'g': 'light shafts, sway about the Sun', 'r': 'haze between the towers, drifts'}},
    }, open('src/stops/venus/relief.json', 'w'), indent=1)
    print(json.dumps(report))


main()
