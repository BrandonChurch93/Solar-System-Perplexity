import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = ROOT + '/out/work/venus/hold'
SIZE = {'full': 2048, 'web': 1024}
MARGIN = 1.016
STOPS = 4.0
INSIDE = 0.998
OUTSIDE = 1.002
RIM = (0.95, 1.08)
RIM_ROWS = (40, 56)
RIM_COLS = 512
RIM_IN = (0.95, 0.97)
FADE = (1.05, 1.07)
EDGE_PX = 0.5
ARC_PX = 15
RING_STEP_PX = 0.25
TURN = 4096
FLOOR = 1e-3
QUALITY = 95
DOTS = 9
DOT_GAIN = 1.5
DOT_SIGMA = 3.0


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def scene(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255
    return inverse_filmic(srgb_to_linear(img)).astype(np.float32)


def film_limb(fit, w, h):
    cam = np.array(fit['camera']['position'])
    d = np.linalg.norm(cam)
    a = -cam / d
    e1 = np.cross([0.0, 1.0, 0.0], a)
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(a, e1)
    t = np.linspace(-np.pi, np.pi, 2880, endpoint=False)
    sb = 1 / d
    r = np.sqrt(1 - sb * sb) * a[None] + sb * (np.cos(t)[:, None] * e1[None] + np.sin(t)[:, None] * e2[None])
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    x = (r[:, 0] / -r[:, 2] / (th * w / h) + 1) * w / 2
    y = (1 - r[:, 1] / -r[:, 2] / th) * h / 2
    cx, cy = (x.max() + x.min()) / 2, (y.max() + y.min()) / 2
    az = np.arctan2(-(y - cy), x - cx)
    rr = np.hypot(x - cx, y - cy)
    o = np.argsort(az)
    return cx, cy, az[o], rr[o]


def grid(n, fit, w, h):
    cam = np.array(fit['camera']['position'])
    cx, cy = -cam[0] / cam[2], -cam[1] / cam[2]
    half = MARGIN / np.sqrt(cam @ cam - 1)
    j, i = np.meshgrid(np.arange(n) + 0.5, np.arange(n) + 0.5)
    tx = cx + (2 * j / n - 1) * half
    ty = cy + (1 - 2 * i / n) * half
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    return (tx / (th * w / h) + 1) * w / 2, (1 - ty / th) * h / 2


def frame():
    path = os.path.dirname(__file__) + '/frame.json'
    return np.array(json.load(open(path))['affine']) if os.path.exists(path) else np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def places(n, fit, w, h):
    xm, ym = grid(n, fit, w, h)
    a = frame()
    k = w / 1920
    xf = a[0, 0] * xm + a[0, 1] * ym + a[0, 2] * k
    yf = a[1, 0] * xm + a[1, 1] * ym + a[1, 2] * k
    cx, cy, az, rr = film_limb(fit, w, h)
    cx, cy = a[0, 0] * cx + a[0, 1] * cy + a[0, 2] * k, a[1, 0] * cx + a[1, 1] * cy + a[1, 2] * k
    radius = rr.mean() * np.sqrt(abs(np.linalg.det(a[:, :2])))
    th = np.arctan2(-(yf - cy), xf - cx)
    rho = np.hypot(xf - cx, yf - cy) / radius
    return rho, th, (cx, cy, radius)


def at(limb, rho, th):
    cx, cy, radius = limb
    return cx + radius * rho * np.cos(th), cy - radius * rho * np.sin(th)


def rings(limb):
    rows = int(np.ceil((RIM[1] - RIM[0]) * limb[2] / RING_STEP_PX)) + 1
    rho = RIM[0] + np.arange(rows) * RING_STEP_PX / limb[2]
    th = -np.pi + 2 * np.pi * np.arange(TURN) / TURN
    return rho, th


def ratios(hero, hero_k, level, film, limb, rho, th, first):
    inner = rho < 1
    held = np.where(inner, np.minimum(rho, INSIDE), np.maximum(rho, OUTSIDE if first else 1.0))
    if first:
        top = sample(hero, at(limb, np.where(inner, rho, held), th), hero_k)
    else:
        top = np.where(inner[..., None], sample(level, at(limb, held, th)), sample(hero, at(limb, held, th), hero_k))
    return np.log2((top + FLOOR) / (sample(film, at(limb, held, th)) + FLOOR))


def calm(hero, hero_k, level, film, limb, first):
    rho, th = rings(limb)
    got = ratios(hero, hero_k, level, film, limb, rho[:, None] + 0 * th[None], th[None] + 0 * rho[:, None], first)
    width = int(round(ARC_PX / (2 * np.pi * limb[2] / TURN))) | 1
    got = median_filter(got, size=(1, width, 1), mode='wrap')
    split = int(np.searchsorted(rho, 1.0))
    if not first:
        edge = split + int(np.ceil(EDGE_PX / RING_STEP_PX))
        got[split:edge] = got[split]
    weight = np.where(rho < 1, smooth(rho, *RIM_IN), 1 - smooth(rho, *FADE))
    return got * weight[:, None, None]


def lookup(ring, limb, rho, th, inner):
    rows, _ = rings(limb)
    split = int(np.searchsorted(rows, 1.0))
    row = (rho - RIM[0]) * limb[2] / RING_STEP_PX
    row = np.clip(row, 0, split - 1) if inner else np.clip(row, split, len(rows) - 1)
    wide = np.concatenate([ring, ring[:, :1]], 1).astype(np.float32)
    col = (th + np.pi) / (2 * np.pi) * TURN
    return cv2.remap(wide, col.astype(np.float32), row.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def dots(n):
    q = np.zeros((n, n, 3), np.float32)
    at = []
    for i in range(DOTS):
        for j in range(DOTS):
            x, y = (j + 0.5) / DOTS * n, (i + 0.5) / DOTS * n
            if np.hypot(x - n / 2, y - n / 2) > 0.42 * n:
                continue
            yy, xx = np.mgrid[0:n, 0:n]
            q += (DOT_GAIN * np.exp(-((xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2) / (2 * DOT_SIGMA ** 2)))[..., None]
            at.append((x, y))
    return q, np.array(at)


def measure(fit, flat_path, dot_path):
    flat = cv2.imread(flat_path).astype(np.float32).sum(-1)
    lit = cv2.imread(dot_path).astype(np.float32).sum(-1)
    h, w = flat.shape
    n = SIZE['full']
    _, at = dots(DOTS * 8)
    at = at / (DOTS * 8) * n
    cam = np.array(fit['camera']['position'])
    half = MARGIN / np.sqrt(cam @ cam - 1)
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    tx = -cam[0] / cam[2] + (2 * at[:, 0] / n - 1) * half
    ty = -cam[1] / cam[2] + (1 - 2 * at[:, 1] / n) * half
    model = np.stack([(tx / (th * w / h) + 1) * w / 2, (1 - ty / th) * h / 2], 1)
    seen = []
    gain = np.maximum(lit - flat, 0)
    for mx, my in model:
        x0, y0 = int(round(mx)) - 9, int(round(my)) - 9
        win = gain[y0:y0 + 19, x0:x0 + 19]
        yy, xx = np.mgrid[y0:y0 + 19, x0:x0 + 19]
        seen.append(((win * (xx + 0.5)).sum() / win.sum(), (win * (yy + 0.5)).sum() / win.sum()))
    seen = np.array(seen)
    design = np.concatenate([model, np.ones((len(model), 1))], 1)
    affine = np.linalg.lstsq(design, seen, rcond=None)[0].T
    rest = seen - design @ affine.T
    print('dots %d, mean shift %.3f %.3f px, rest after the affine fit rms %.3f px' % (len(model), *(seen - model).mean(0), np.sqrt((rest ** 2).sum(1).mean())))
    print(np.round(affine, 6))
    json.dump({'affine': affine.round(7).tolist(), 'size': [w, h]}, open(os.path.dirname(__file__) + '/frame.json', 'w'))


def sample(img, xy, k=1.0):
    return cv2.remap(img, (xy[0] * k - 0.5).astype(np.float32), (xy[1] * k - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def strip(ring, limb):
    rows, _ = rings(limb)
    split = int(np.searchsorted(rows, 1.0))
    step = TURN // RIM_COLS
    cols = np.roll(ring, step // 2, 1).reshape(ring.shape[0], RIM_COLS, step, 3).mean(2)
    out = []
    for inner, count, lo, hi in ((True, RIM_ROWS[0], RIM[0], 1.0), (False, RIM_ROWS[1], 1.0, RIM[1])):
        rho = lo + (np.arange(count) + 0.5) / count * (hi - lo)
        row = (rho - RIM[0]) * limb[2] / RING_STEP_PX
        row = np.clip(row, 0, split - 1) if inner else np.clip(row, split, len(rows) - 1)
        low = np.floor(row).astype(int)
        high = np.minimum(low + 1, (split - 1) if inner else (len(rows) - 1))
        f = (row - low)[:, None, None]
        out.append(cols[low] * (1 - f) + cols[high] * f)
    out = np.concatenate(out, 0)
    out[0] = 0
    out[-1] = 0
    out = np.concatenate([out, out[:, :1]], 1)
    return np.concatenate([out, np.ones(out.shape[:2] + (1,))], 2).astype(np.float32)


def write(logq, ring, fit, limb):
    np.save(WORK + '/logq.npy', logq.astype(np.float32))
    np.save(WORK + '/rim.npy', ring.astype(np.float32))
    table = strip(ring, limb)
    for key, n in SIZE.items():
        q = logq if n == logq.shape[0] else cv2.resize(logq, (n, n), interpolation=cv2.INTER_AREA)
        b = np.clip(np.round(128 + q * 255 / STOPS), 0, 255).astype(np.uint8)
        Image.fromarray(b).save(ROOT + '/public/assets/venus/' + key + '/hold-detail.jpg', quality=QUALITY, subsampling=0)
        table.tofile(ROOT + '/public/assets/venus/' + key + '/hold-rim.bin')
    w, h = 1920, 1080
    cx, cy, az, rr = film_limb(fit, w, h)
    th = np.tan(np.radians(fit['vfovDeg']) / 2)
    rim = {'file': 'hold-rim.bin', 'cols': RIM_COLS, 'inside': RIM_ROWS[0], 'outside': RIM_ROWS[1], 'from': RIM[0], 'to': RIM[1], 'centre': [round((cx / (w / 2) - 1) * th * w / h, 7), round((1 - cy / (h / 2)) * th, 7)], 'radius': round(rr.mean() / (h / 2) * th, 7)}
    json.dump({'file': 'hold-detail.jpg', 'margin': MARGIN, 'stops': STOPS, 'rim': rim}, open(ROOT + '/src/stops/venus/hold.json', 'w'))
    print('detail log2 gain: mean %.3f, rms %.3f, share at the clamp %.4f; rim log2 gain: min %.2f, max %.2f' % (logq.mean(), np.sqrt((logq ** 2).mean()), (np.abs(logq) > STOPS / 2 - 0.02).mean(), ring.min(), ring.max()))


if __name__ == '__main__':
    os.makedirs(WORK, exist_ok=True)
    mode = sys.argv[1]
    n = SIZE['full']
    fit = json.load(open(ROOT + '/src/stops/venus/fit.json'))
    w, h = 1920, 1080
    rho, th, limb = places(n, fit, w, h)
    blank = np.zeros((len(rings(limb)[0]), TURN, 3), np.float32)
    if mode == 'neutral':
        write(np.zeros((n, n, 3), np.float32), blank, fit, limb)
        sys.exit()
    if mode == 'dots':
        write(dots(n)[0], blank, fit, limb)
        sys.exit()
    if mode == 'measure':
        measure(fit, sys.argv[2], sys.argv[3])
        sys.exit()
    if mode not in ('build', 'refine'):
        raise SystemExit('mode: neutral, dots, measure FLAT DOTTED, build FLAT, refine FILM [gain]')
    film = scene(sys.argv[2])
    if film.shape[:2] != (h, w):
        raise SystemExit('the still must be %d by %d' % (w, h))
    hero_path = ROOT + '/references/approved/venus-hero.png'
    hero = scene(hero_path)
    hero_k = hero.shape[1] / w
    small = cv2.resize(cv2.imread(hero_path, cv2.IMREAD_COLOR), (w, h), interpolation=cv2.INTER_AREA)[..., ::-1].astype(np.float32) / 255
    level = inverse_filmic(srgb_to_linear(small)).astype(np.float32)
    first = mode == 'build'
    gain = 1.0 if first else (float(sys.argv[3]) if len(sys.argv) > 3 else 1.0)
    was = np.zeros((n, n, 3), np.float32) if first else np.load(WORK + '/logq.npy')
    ring = blank if first else np.load(WORK + '/rim.npy')
    inside = np.minimum(rho, 1 - 1e-6)
    step = calm(hero, hero_k, level, film, limb, first)
    fine = ratios(hero, hero_k, level, film, limb, inside, th, first) - lookup(step, limb, inside, th, True)
    write(np.clip(was + gain * fine, -STOPS / 2, STOPS / 2), np.clip(ring + gain * step, -STOPS / 2, STOPS / 2), fit, limb)
