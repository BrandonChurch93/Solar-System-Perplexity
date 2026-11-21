import json, os, sys
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

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


def main():
    can2 = canvas2()
    can1 = cv2.resize(can2, (CW, CH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(f'{WORK}/canvas-full-1x.png', can1)
    coef, xs, rows = horizon(can1)
    u = (np.arange(CW) + 0.5 - CW / 2) / (CW / 2)
    hrow = np.polynomial.polynomial.polyval(u, coef)
    Y = np.arange(CH)[:, None] + 0.5
    above = Y < hrow[None, :] + 3
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    clean = cv2.morphologyEx(can1, cv2.MORPH_OPEN, ker)
    clean = cv2.GaussianBlur(clean, (0, 0), 1.2)
    w = np.clip((hrow[None, :] - 2 - Y) / 6.0, 0, 1)[..., None]
    glow1 = (can1 * (1 - w) + clean * w).astype(np.float32)
    w2 = cv2.resize(w[..., 0], (CW * 2, CH * 2), interpolation=cv2.INTER_LINEAR)[..., None]
    glow2 = cv2.resize(clean, (CW * 2, CH * 2), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    full = np.clip(can2 * (1 - w2) + glow2 * w2 + 0.5, 0, 255).astype(np.uint8)
    web = np.clip(glow1 + 0.5, 0, 255).astype(np.uint8)
    os.makedirs(f'{PUB}/full', exist_ok=True)
    Image.fromarray(full[..., ::-1]).save(f'{PUB}/full/relief-ground.webp', lossless=True, quality=70, method=4)
    Image.fromarray(web[..., ::-1]).save(f'{PUB}/web/relief-ground.webp', quality=93, method=6)
    np.save(f'{WORK}/ground-1x.npy', web)
    fit = geom.FIT
    out = {
        'imageSize': [W, H], 'vfovDeg': fit['vfovDeg'], 'nadir': fit['nadir'], 'radius': fit['radius'],
        'ground': {'file': 'relief-ground.webp', 'box': [-ML, 0, CW, CH], 'top': 420, 'fade': 150,
                   'horizon': [round(float(v), 4) for v in coef], 'horizonSpan': [W / 2, CW / 2]},
    }
    path = f'{STOP}/relief.json'
    old = json.load(open(path)) if os.path.exists(path) else {}
    old.update(out)
    json.dump(old, open(path, 'w'), indent=1)
    for s in ('full', 'web'):
        p = f'{PUB}/{s}/relief-ground.webp'
        print(p, Image.open(p).size, round(os.path.getsize(p) / 1e6, 2), 'MB')
    v = cv2.resize(web, (1408, int(1408 * CH / CW)), interpolation=cv2.INTER_AREA)
    for x, r in zip(xs[::6], rows[::6]):
        cv2.circle(v, (int(x * 1408 / CW), int(r * 1408 / CW)), 1, (0, 0, 255), -1)
    cv2.imwrite('out/work/earth/view/relief-ground.jpg', v, [cv2.IMWRITE_JPEG_QUALITY, 88])


main()
