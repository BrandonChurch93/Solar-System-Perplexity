import sys, json, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, gaussian_filter1d

ROWS = {'ground': 0, 'loops': 1, 'globe': 2, 'spare': 3}
OUT = 'out/work/sun/grade.npy'


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
    else:
        main()
