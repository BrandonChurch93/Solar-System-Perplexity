import json, os, sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from scipy import sparse
from scipy.sparse.linalg import splu
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))
import geom
import geo

W, H = 2816, 1584
ML, MB, TAKE = 640, 396, 704
CW, CH = W + 2 * ML, H + MB
WORK = 'out/work/earth/relief'
PUB = 'public/assets/earth'
STOP = 'src/stops/earth'


def read(path):
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        raise SystemExit('missing ' + path)
    return im


def canvas2():
    out = np.zeros((CH * 2, CW * 2, 3), np.uint8)
    close = read('out/work/earth/up/close-x2.png')
    left = read(f'{WORK}/strip-left-x2.png')
    right = read(f'{WORK}/strip-right-x2.png')
    bottom = read(f'{WORK}/strip-bottom-x2.png')
    k = (TAKE - ML) * 2
    out[0:H * 2, 0:ML * 2] = left[:, k:k + ML * 2]
    out[0:H * 2, (ML + W) * 2:CW * 2] = right[:, 192:192 + ML * 2]
    out[H * 2:CH * 2, ML * 2:(ML + W) * 2] = bottom[192:192 + MB * 2]
    for name, x_in, x_can in (('left', 0.0, TAKE - ML), ('right', 2282.0, TAKE + W)):
        c = read(f'{WORK}/corner-{name}-x2.png')
        hh, ww = MB * 2, ML * 2
        X, Y = np.meshgrid(np.arange(ww, dtype=np.float32), np.arange(hh, dtype=np.float32))
        px = (x_can + (X + 0.5) / 2) * (2.0 / 3.0) - x_in
        py = (H + (Y + 0.5) / 2 + MB) * (2.0 / 3.0) - 1256.0
        fill = cv2.remap(c, px * 2 - 0.5, py * 2 - 0.5, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        x0 = 0 if name == 'left' else (ML + W) * 2
        out[H * 2:CH * 2, x0:x0 + ww] = fill
    out[0:H * 2, ML * 2:(ML + W) * 2] = close
    return out


def horizon(can1):
    r = cv2.GaussianBlur(can1[..., 2].astype(np.float32), (0, 0), 3)
    xs = np.arange(8, CW - 8, 8)
    rows = []
    for x in xs:
        col = r[:, x]
        base = np.median(col[60:140])
        top = int(geom.horizon_row(np.array([x - ML + 0.5]), W, H)[0])
        lo, hi = max(top - 60, 100), min(top + 60, CH - 1)
        seg = col[lo:hi]
        grad = np.gradient(cv2.GaussianBlur(seg.reshape(-1, 1), (0, 0), 2).ravel())
        rows.append(lo + int(np.argmax(grad)))
    rows = np.array(rows, np.float64)
    fit = geom.horizon_row(xs - ML + 0.5, W, H)
    dev = rows - fit
    print('horizon: steepest rise minus fitted sphere, px: image mean %.2f rms %.2f max %.2f; margins mean %.2f max %.2f' % (
        dev[(xs >= ML) & (xs < ML + W)].mean(), dev[(xs >= ML) & (xs < ML + W)].std(), np.abs(dev[(xs >= ML) & (xs < ML + W)]).max(),
        dev[(xs < ML) | (xs >= ML + W)].mean(), np.abs(dev[(xs < ML) | (xs >= ML + W)]).max()))
    u = (xs - CW / 2) / (CW / 2)
    c = np.polynomial.polynomial.polyfit(u, rows, 8)
    res = rows - np.polynomial.polynomial.polyval(u, c)
    print('horizon polynomial residual rms %.2f max %.2f' % (res.std(), np.abs(res).max()))
    return c, xs, rows


PLATE = 'plate-t1'
MATTE = 'matte-t1'
LIFT_SHARE = 0.5
LIFT_CAP = 0.085
LAND = [(1480, 640), (3500, 560), (3500, 1650), (2816, 1500), (2300, 1330), (1800, 1150), (1470, 1010), (1560, 820)]
DRIFT_NEAR = 1.8
FILL_IN, FILL_OUT = 6.0, 10.0


def dec(a):
    return geo.decode(a.astype(np.float32) / 255).astype(np.float32)


def enc(lin):
    return np.clip(geo.encode(lin) * 255 + 0.5, 0, 255).astype(np.uint8)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def membrane(diff, region):
    out = np.zeros_like(diff)
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(region.astype(np.uint8), connectivity=4)
    for i in range(1, n):
        x, y, w, h, _ = stats[i]
        x0, y0, x1, y1 = max(x - 1, 0), max(y - 1, 0), min(x + w + 1, diff.shape[1]), min(y + h + 1, diff.shape[0])
        inside = lbl[y0:y1, x0:x1] == i
        d = diff[y0:y1, x0:x1]
        idx = -np.ones(inside.shape, np.int64)
        k = int(inside.sum())
        idx[inside] = np.arange(k)
        ys, xs = np.nonzero(inside)
        rows, cols, vals = [np.arange(k)], [np.arange(k)], [np.full(k, 4.0)]
        rhs = np.zeros((k, 3))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = ys + dy, xs + dx
            j = idx[yy, xx]
            own = j >= 0
            rows.append(np.arange(k)[own]); cols.append(j[own]); vals.append(np.full(int(own.sum()), -1.0))
            rhs[~own] += d[yy[~own], xx[~own]]
        A = sparse.csc_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(k, k))
        lu = splu(A)
        sol = np.stack([lu.solve(rhs[:, c]) for c in range(3)], -1)
        out[y0:y1, x0:x1][inside] = sol
    return out


def towers():
    m = cv2.imread(f'{WORK}/{MATTE}-aligned.png', cv2.IMREAD_GRAYSCALE)
    b = (m > 127).astype(np.uint8)
    b = ndi.binary_fill_holes(b).astype(np.uint8)
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(b)
    keep = np.zeros_like(b)
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a >= 300 and x > 8 and y > 8 and x + w < W - 8 and y + h < H - 8:
            keep[lbl == i] = 1
    grown = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    n, groups = cv2.connectedComponents(grown)
    X, Y = geom.grid(0, 0, W, H, W, H)
    t, hit, _ = geom.ground(geom.rays(X, Y, W, H))
    reach = np.sqrt(np.maximum(t * t - 1, 1e-6)).astype(np.float32)
    slope = np.zeros(n, np.float32)
    offset = np.zeros(n, np.float32)
    for g in range(1, n):
        ys, xs = np.nonzero((groups == g) & (keep > 0))
        cols = np.unique(xs)
        bottom = np.array([ys[xs == c].max() for c in cols], np.float64)
        if len(cols) > 12:
            k = np.polyfit(cols, bottom, 1)
            k[0] = np.clip(k[0], -0.35, 0.35)
            res = bottom - (k[0] * cols)
            slope[g], offset[g] = k[0], np.percentile(res, 90)
        else:
            slope[g], offset[g] = 0, bottom.max()
    _, idx = ndi.distance_transform_edt(groups == 0, return_indices=True)
    near = groups[idx[0], idx[1]]
    base = slope[near] * X.astype(np.float32) + offset[near]
    reach_base = cv2.remap(reach, X.astype(np.float32) - 0.5, np.clip(base, 0, H - 1).astype(np.float32) - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    lift = np.where(Y < base, LIFT_SHARE * (1 - reach_base / np.maximum(reach, 1e-6)), 0)
    lift = cv2.GaussianBlur(np.clip(lift, 0, LIFT_CAP).astype(np.float32), (0, 0), 3)
    solid = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    alpha = cv2.GaussianBlur(solid.astype(np.float32), (0, 0), 1.2)
    alpha[alpha < 0.01] = 0
    ys, xs = np.nonzero(alpha > 0)
    box = [max(int(xs.min()) - 24, 0), max(int(ys.min()) - 24, 0), min(int(xs.max()) + 25, W), min(int(ys.max()) + 25, H)]
    box[2] -= (box[2] - box[0]) % 4
    box[3] -= (box[3] - box[1]) % 4
    sizes = sorted(((int((groups == g).sum()), float(lift[(groups == g) & (keep > 0)].max()), g) for g in range(1, n)), reverse=True)
    print('towers: %d groups, matte share %.4f, box' % (n - 1, keep.mean()), box)
    print('  largest groups (px, top lift):', [(a, round(z, 3)) for a, z, _ in sizes[:10]])
    away = ndi.distance_transform_edt(keep == 0).astype(np.float32)
    return alpha, lift, box, away


def masks(plate1, hrow_can):
    s = 4
    w, h = CW // s, CH // s
    X = (np.arange(w) + 0.5) * s - ML
    Y = (np.arange(h) + 0.5) * s
    XX, YY = np.meshgrid(X, Y)
    t, hit, _ = geom.ground(geom.rays(XX, YY, W, H))
    t = np.where(hit, t, 99.0)
    land = np.zeros((h, w), np.uint8)
    cv2.fillPoly(land, [np.array([[(x + ML) / s, y / s] for x, y in LAND], np.int32)], 1)
    land = cv2.GaussianBlur(land.astype(np.float32), (0, 0), 70 / s)
    hr = hrow_can[(np.arange(w) * s + s // 2)]
    far = step(YY - hr[None, :], 40, 260)
    drift = (1 - step(land, 0.02, 0.6)) * far * np.minimum(1, DRIFT_NEAR / t)
    lum = cv2.cvtColor(plate1, cv2.COLOR_BGR2GRAY).astype(np.float32)
    lum = cv2.GaussianBlur(lum, (0, 0), 14)
    full = np.zeros((CH, CW), np.float32)
    full[0:H, ML:ML + W] = lum
    glint = step(cv2.resize(full, (w, h), interpolation=cv2.INTER_AREA), 105, 190)
    xin = step(XX, 0, 160) * (1 - step(XX, W - 160, W)) * (1 - step(YY, H - 160, H))
    glint = cv2.GaussianBlur(glint * xin * (1 - step(land, 0.05, 0.5)) * step(YY - hr[None, :], 30, 160), (0, 0), 3)
    out = np.zeros((h, w, 3), np.uint8)
    out[..., 0] = np.clip(glint * 255 + 0.5, 0, 255)
    out[..., 1] = np.clip(drift * 255 + 0.5, 0, 255)
    return out


def main():
    can2 = canvas2()
    can1 = cv2.resize(can2, (CW, CH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(f'{WORK}/canvas-full-1x.png', can1)
    coef, xs, rows = horizon(can1)
    u = (np.arange(CW) + 0.5 - CW / 2) / (CW / 2)
    hrow = np.polynomial.polynomial.polyval(u, coef)

    alpha, lift, tbox, away = towers()
    plate1 = cv2.imread(f'{WORK}/{PLATE}-aligned.png')
    plate2 = cv2.imread(f'{WORK}/{PLATE}-x2.png')
    im1 = can1[0:H, ML:ML + W]
    image1 = im1.copy()
    soft = lambda a: cv2.GaussianBlur(a.astype(np.float32), (0, 0), 2.5)
    fill = membrane(soft(image1) - soft(plate1), away < FILL_OUT)
    cover = 1 - step(away, FILL_IN, FILL_OUT)
    x0, y0, x1, y1 = tbox
    size2 = ((x1 - x0) * 2, (y1 - y0) * 2)
    a2 = np.clip(cv2.resize(alpha[y0:y1, x0:x1], size2, interpolation=cv2.INTER_CUBIC), 0, 1)
    c2 = np.clip(cv2.resize(cover[y0:y1, x0:x1], size2, interpolation=cv2.INTER_CUBIC), 0, 1)[..., None]
    f2 = cv2.resize(fill[y0:y1, x0:x1], size2, interpolation=cv2.INTER_CUBIC)
    sx, sy = (ML + x0) * 2, y0 * 2
    view2 = can2[sy:sy + (y1 - y0) * 2, sx:sx + (x1 - x0) * 2]
    image2 = view2.copy()
    under2 = np.clip(view2 * (1 - c2) + (plate2[y0 * 2:y1 * 2, x0 * 2:x1 * 2] + f2) * c2 + 0.5, 0, 255).astype(np.uint8)
    del f2
    under2 = enc(np.minimum(dec(under2), dec(image2) / np.maximum(1 - a2[..., None], 1e-3)))
    lin = dec(image2) - (1 - a2[..., None]) * dec(under2)
    print('towers: premultiplied colour below zero in %.5f of covered texels' % float((lin.min(-1) < -0.002)[a2 > 0.01].mean()))
    back = enc(np.maximum(lin, 0) + (1 - a2[..., None]) * dec(under2)).astype(np.float32) - image2
    print('towers: layers put together against the image, code values: mean abs %.3f p99 %.2f max %.0f' % (np.abs(back).mean(), np.percentile(np.abs(back), 99), np.abs(back).max()))
    del back
    rgba2 = np.dstack([enc(np.maximum(lin, 0) * (a2[..., None] > 0.004)), np.clip(a2 * 255 + 0.5, 0, 255).astype(np.uint8)])
    view2[:] = under2
    c1 = cover[..., None]
    under1 = np.clip(im1 * (1 - c1) + (plate1 + fill) * c1 + 0.5, 0, 255).astype(np.uint8)
    under1 = enc(np.minimum(dec(under1), dec(image1) / np.maximum(1 - alpha[..., None], 1e-3)))
    lin1 = dec(image1[y0:y1, x0:x1]) - (1 - alpha[y0:y1, x0:x1, None]) * dec(under1[y0:y1, x0:x1])
    rgba1 = np.dstack([enc(np.maximum(lin1, 0) * (alpha[y0:y1, x0:x1, None] > 0.004)), np.clip(alpha[y0:y1, x0:x1] * 255 + 0.5, 0, 255).astype(np.uint8)])
    im1[:] = under1

    Y = np.arange(CH)[:, None] + 0.5
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    clean = cv2.GaussianBlur(cv2.morphologyEx(can1, cv2.MORPH_OPEN, ker), (0, 0), 1.2)
    w = np.clip((hrow[None, :] - 2 - Y) / 6.0, 0, 1)[..., None]
    top = int(hrow.max()) + 12
    air1 = dec((can1[:top] * (1 - w[:top]) + clean[:top] * w[:top]))
    sky1 = np.minimum.accumulate(cv2.GaussianBlur(air1, (0, 0), 8), axis=0)
    np.save(f'{WORK}/sky-target-1x.npy', sky1[:, ML:ML + W])
    open1 = 1 - step(Y[:top] - hrow[None, :], -1, 1)[..., None]
    web = can1.copy()
    web[:top] = enc(np.maximum(air1 - open1 * sky1, 0))
    Y2 = (np.arange(top * 2)[:, None] + 0.5) / 2
    h2 = np.polynomial.polynomial.polyval(((np.arange(CW * 2) + 0.5) / 2 - CW / 2) / (CW / 2), coef)
    w2 = np.clip((h2[None, :] - 2 - Y2) / 6.0, 0, 1)[..., None]
    clean2 = cv2.resize(clean[:top], (CW * 2, top * 2), interpolation=cv2.INTER_CUBIC)
    air2 = dec(can2[:top * 2] * (1 - w2) + clean2 * w2)
    sky2 = cv2.resize(sky1, (CW * 2, top * 2), interpolation=cv2.INTER_LINEAR)
    open2 = 1 - step(Y2 - h2[None, :], -1, 1)[..., None]
    full = can2
    full[:top * 2] = enc(np.maximum(air2 - open2 * sky2, 0))
    del air2, sky2, clean2

    mk = masks(plate1, hrow)
    s = 2
    dist = cv2.resize(lift[y0:y1, x0:x1], ((x1 - x0) // s, (y1 - y0) // s), interpolation=cv2.INTER_AREA).astype('<f4')
    for key in ('full', 'web'):
        os.makedirs(f'{PUB}/{key}', exist_ok=True)
        dist.tofile(f'{PUB}/{key}/relief-lift.bin')
        cv2.imwrite(f'{PUB}/{key}/relief-masks.png', mk[..., ::-1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
    Image.fromarray(full[..., ::-1]).save(f'{PUB}/full/relief-ground.webp', lossless=True, quality=70, method=4)
    Image.fromarray(web[..., ::-1]).save(f'{PUB}/web/relief-ground.webp', quality=93, method=6)
    Image.fromarray(np.dstack([rgba2[..., 2], rgba2[..., 1], rgba2[..., 0], rgba2[..., 3]]), 'RGBA').save(f'{PUB}/full/relief-towers.webp', lossless=True, quality=70, method=4, exact=True)
    Image.fromarray(np.dstack([rgba1[..., 2], rgba1[..., 1], rgba1[..., 0], rgba1[..., 3]]), 'RGBA').save(f'{PUB}/web/relief-towers.webp', quality=92, alpha_quality=100, method=6, exact=True)
    fit = geom.FIT
    out = {
        'imageSize': [W, H], 'vfovDeg': fit['vfovDeg'], 'nadir': fit['nadir'], 'radius': fit['radius'],
        'ground': {'file': 'relief-ground.webp', 'box': [-ML, 0, CW, CH], 'top': 420, 'fade': 150, 'under': 140, 'skip': 24,
                   'horizon': [round(float(v), 4) for v in coef], 'horizonSpan': [W / 2, CW / 2]},
        'towers': {'file': 'relief-towers.webp', 'dist': 'relief-lift.bin', 'box': [x0, y0, x1 - x0, y1 - y0], 'distSize': [int(dist.shape[1]), int(dist.shape[0])]},
        'masks': {'file': 'relief-masks.png', 'box': [-ML, 0, CW, CH]},
    }
    json.dump(out, open(f'{STOP}/relief.json', 'w'), indent=1)
    for key in ('full', 'web'):
        for name in ('relief-ground.webp', 'relief-towers.webp', 'relief-lift.bin', 'relief-masks.png'):
            p = f'{PUB}/{key}/{name}'
            print(p, Image.open(p).size if not name.endswith('.bin') else dist.shape[::-1], round(os.path.getsize(p) / 1e6, 2), 'MB')
    q = [cv2.IMWRITE_JPEG_QUALITY, 88]
    cv2.imwrite('out/work/earth/view/relief-ground.jpg', cv2.resize(web, (1408, int(1408 * CH / CW)), interpolation=cv2.INTER_AREA), q)
    cv2.imwrite('out/work/earth/view/relief-masks.jpg', cv2.resize(mk[..., ::-1], (1408, int(1408 * CH / CW)), interpolation=cv2.INTER_AREA), q)
    lv = np.clip(lift / LIFT_CAP * 255, 0, 255).astype(np.uint8)
    tv = cv2.addWeighted(image1, 0.55, cv2.applyColorMap(lv, cv2.COLORMAP_INFERNO), 0.45, 0)
    tv[alpha < 0.5] = image1[alpha < 0.5] // 2 + under1[alpha < 0.5] // 2
    cv2.imwrite('out/work/earth/view/relief-lift.jpg', cv2.resize(tv, (1408, 792), interpolation=cv2.INTER_AREA), q)
    cv2.imwrite('out/work/earth/view/relief-under.jpg', cv2.resize(under1, (1408, 792), interpolation=cv2.INTER_AREA), q)


main()
