import sys, json, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, gaussian_filter1d

ROWS = {'ground': 0, 'loops': 1, 'globe': 2, 'spare': 3}
OUT = 'out/work/sun/grade.npy'
CARD = {'knots': (0, 24, 48, 80, 112, 144, 176, 208, 232, 255), 'floor': 8, 'every': 5, 'smooth': 30, 'bounds': (0.6, 1.0), 'least': 0.002, 'box': (480, 150, 1440, 640), 'cells': (6, 5), 'depth': 4.0, 'tint': (0.94, 1.0), 'fade': (144, 232)}


def load(path, size=(1920, 1080)):
    im = Image.open(path).convert('RGB')
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    return np.asarray(im).astype(np.float64)


def lum(a):
    return a @ np.array([0.2126, 0.7152, 0.0722])


def region(name, approved):
    h, w = approved.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    if name == 'ground':
        return yy > 0.6 * h
    if name == 'loops':
        soft = gaussian_filter(lum(approved), 6)
        return (yy < 0.47 * h) & (soft > 14) & (xx > 0.12 * w) & (xx < 0.88 * w)
    if name == 'globe':
        cx, cy, r = [float(v) for v in os.environ['SUN_DISC'].split(',')]
        return (xx - cx) ** 2 + (yy - cy) ** 2 < (0.9 * r) ** 2
    raise SystemExit('unknown region ' + name)


def curve(film, approved, floor, limit):
    out = np.zeros((256, 3))
    qs = np.linspace(0, 1, 1025)
    for c in range(3):
        qf = np.quantile(film[:, c], qs)
        qa = np.quantile(approved[:, c], qs)
        qf = np.maximum.accumulate(qf + np.arange(qf.size) * 1e-6)
        v = np.interp(np.arange(256), qf, qa)
        lo, hi = np.quantile(film[:, c], [0.003, 0.997])
        d = v - np.arange(256)
        d = np.interp(np.arange(256), np.arange(256)[int(np.ceil(lo)):int(np.floor(hi)) + 1], d[int(np.ceil(lo)):int(np.floor(hi)) + 1])
        d = gaussian_filter1d(d, 4, mode='nearest')
        d = np.clip(d, -limit, limit)
        fade = np.clip((np.arange(256) - floor[0]) / max(floor[1] - floor[0], 1), 0, 1)
        out[:, c] = np.arange(256) + d * fade
    return out


def main():
    name, film_path, approved_path = sys.argv[1], sys.argv[2], sys.argv[3]
    lo = float(sys.argv[4]) if len(sys.argv) > 4 else 0
    hi = float(sys.argv[5]) if len(sys.argv) > 5 else 1
    limit = float(sys.argv[6]) if len(sys.argv) > 6 else 40
    film = load(film_path)
    approved = load(approved_path)
    m = region(name, approved)
    step = curve(film[m], approved[m], (lo, hi), limit)
    table = np.load(OUT) if os.path.exists(OUT) else np.tile(np.arange(256.0)[None, :, None], (4, 1, 3))
    row = ROWS[name]
    old = table[row].copy()
    new = np.zeros_like(old)
    for c in range(3):
        new[:, c] = np.interp(old[:, c], np.arange(256), step[:, c])
        new[:, c] = np.maximum.accumulate(np.clip(new[:, c], 0, 255))
    table[row] = new
    np.save(OUT, table)
    for v in [4, 8, 16, 24, 32, 48, 64, 96, 128, 160, 192, 224, 240, 250]:
        print(name, v, 'step', step[v].round(1), 'total', new[v].round(1))
    qs = [1, 5, 10, 25, 50, 75, 90, 95, 99]
    for c, ch in enumerate('rgb'):
        print(ch, 'approved', np.percentile(approved[m][:, c], qs).round(1))
        print(ch, 'film    ', np.percentile(film[m][:, c], qs).round(1))


def card(film_path=None):
    sys.path.insert(0, 'assets-src/sun/terrain')
    import cv2
    from scipy.optimize import least_squares
    from common import LOOPS_BOX, read, scene, display, step
    x0, y0, x1, y1 = LOOPS_BOX
    r0, r1, c0, c1 = round(y0 * 3168), round(y1 * 3168), round(x0 * 5632), round(x1 * 5632)
    a = read('out/work/sun/close-x2.png')[r0:r1:2, c0:c1:2].astype(np.float64) / 255
    base = read('assets-src/sun/terrain/base90.jpg')
    b = cv2.resize(base, (5632, 3168), interpolation=cv2.INTER_CUBIC)[r0:r1:2, c0:c1:2].astype(np.float32) / 255
    full = read('public/assets/sun/full/loops.webp')
    layer = full[::2, ::2].astype(np.float64) / 255
    ys, xs = np.nonzero(layer.max(2) > CARD['floor'] / 255)
    ys, xs = ys[::CARD['every']], xs[::CARD['every']]
    cv, bv, av = layer[ys, xs], scene(b)[ys, xs].astype(np.float64), a[ys, xs]
    knots = np.array(CARD['knots'], dtype=np.float64) / 255

    def model(g):
        return display(bv + scene((cv * np.interp(cv, knots, g)).astype(np.float32))) * 255

    def resid(g):
        return np.concatenate([((model(g) - av * 255) / np.sqrt(av.size)).ravel(), np.diff(g, 2) * CARD['smooth']])

    g = least_squares(resid, np.full(len(knots), 0.98), bounds=(np.full(len(knots), CARD['bounds'][0]), np.full(len(knots), CARD['bounds'][1])), diff_step=0.01).x
    print('pixels in the fit', len(ys), 'gain at knots', CARD['knots'], g.round(3).tolist())
    for name, gg in (('identity', np.ones(len(knots))), ('fit', g)):
        err = model(gg) - av * 255
        print(name, 'mean error', err.mean(0).round(2).tolist(), 'mean abs', np.abs(err).mean(0).round(2).tolist())
    table = np.load(OUT) if os.path.exists(OUT) else np.tile(np.arange(256.0)[None, :, None], (4, 1, 3))
    v = np.arange(256.0)
    depth, tint = 1.0, np.ones(3)
    if film_path:
        w, h = 1920, 1080
        film, appr = load(film_path) / 255, load('references/approved/sun-close.jpg') / 255
        px, py, pw, ph = round(x0 * w), round(y0 * h), round((x1 - x0) * w), round((y1 - y0) * h)
        lay = np.zeros((h, w, 3))
        lay[py:py + ph, px:px + pw] = cv2.resize(full, (pw, ph), interpolation=cv2.INTER_AREA).astype(np.float64) / 255
        cur = np.stack([np.interp(lay[..., c] * 255, v, table[ROWS['loops']][:, c]) / 255 for c in range(3)], 2)
        sb = scene((base.astype(np.float32) / 255)).astype(np.float64)
        light = (scene(film.astype(np.float32)).astype(np.float64) - sb) / (scene(cur.astype(np.float32)).astype(np.float64) + CARD['least'])
        bx0, by0, bx1, by1 = CARD['box']
        nx, ny = CARD['cells']

        def cells(p):
            new = lay * (1 - p[0] * (1 - np.interp(lay, knots, g))) * (1 - (1 - np.array(p[1:4])) * (1 - step(lay * 255, *CARD['fade'])))
            err = (display((sb + light * (scene(new.astype(np.float32)).astype(np.float64) + CARD['least'])).astype(np.float32)).astype(np.float64) - appr)[by0:by1, bx0:bx1] * 255
            return err[:err.shape[0] // ny * ny, :err.shape[1] // nx * nx].reshape(ny, err.shape[0] // ny, nx, err.shape[1] // nx, 3).mean((1, 3))

        fit = least_squares(lambda p: cells(p).ravel(), [1.0, 0.99, 0.99, 0.99], bounds=([0] + [CARD['tint'][0]] * 3, [CARD['depth']] + [CARD['tint'][1]] * 3), diff_step=0.01)
        depth, tint = float(fit.x[0]), np.array(fit.x[1:4])
        was = (film - appr)[by0:by1, bx0:bx1].reshape(-1, 3).mean(0) * 255
        print('film as rendered minus approved in the box', was.round(2).tolist(), 'predicted after', cells(fit.x).mean((0, 1)).round(2).tolist(), 'depth', round(depth, 3), 'tint', tint.round(4).tolist())
        for row in cells(fit.x):
            print('   ' + ' | '.join('%+4.1f %+4.1f %+4.1f' % tuple(c) for c in row))
    row = v[:, None] * (1 - depth * (1 - np.interp(v / 255, knots, g)))[:, None] * (1 - (1 - tint[None, :]) * (1 - step(v, *CARD['fade']))[:, None])
    table[ROWS['loops']] = np.maximum.accumulate(np.clip(row, 0, 255), 0)
    np.save(OUT, table)


def export():
    table = np.load(OUT)
    img = np.clip(np.round(table), 0, 255).astype(np.uint8)
    for s in ['full', 'web']:
        Image.fromarray(img, 'RGB').save('public/assets/sun/%s/grade.png' % s)
    print('grade.png written', img.shape)


def reset():
    np.save(OUT, np.tile(np.arange(256.0)[None, :, None], (4, 1, 3)))
    export()


if __name__ == '__main__':
    if sys.argv[1] == 'export':
        export()
    elif sys.argv[1] == 'reset':
        reset()
    elif sys.argv[1] == 'card':
        card(sys.argv[2] if len(sys.argv) > 2 else None)
    else:
        main()
