import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import mosaic as M

SPEC = json.loads((Path(__file__).parent / 'plates.json').read_text())
OLD = M.WORK / 'old'
OUT = M.WORK / 'plates'
PUBLIC = M.ROOT / 'public/assets/mercury'


def filmic(x):
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def unfilmic(y):
    y = np.clip(y, 0, 0.985)
    a = 2.51 - 2.43 * y
    b = 0.03 - 0.59 * y
    return (-b + np.sqrt(np.maximum(b * b + 4 * a * 0.14 * y, 0))) / (2 * a)


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def old_ground(n):
    return unfilmic(M.linear(np.asarray(Image.open(OLD / ('full-patch-%d.jpg' % n)).convert('RGB')))).astype(np.float32)


def mask_of(place):
    m = SPEC['mask']
    rgb, seen, elong, gsd = place.level((0, 0), m['widthDeg'], m['size'], None, 2)
    w = step(m['seen'][0], m['seen'][1], seen) * (1 - step(m['elong'][0], m['elong'][1], elong))
    return cv2.GaussianBlur(w.astype(np.float32), (0, 0), m['blurPx'])


def mask_at(mask, width_deg, size):
    m = SPEC['mask']
    gx, gy = M.grid((0, 0), width_deg, size)
    k = m['size'] / (2 * M.half(m['widthDeg']))
    return cv2.remap(mask, (gx * k + m['size'] / 2 - 0.5).astype(np.float32), (m['size'] / 2 - gy * k - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def lay(place, width_deg, size, ss, weight, rows=128):
    ys, xs = np.nonzero(weight > 1e-4)
    box = (max(xs.min() - 2, 0), max(ys.min() - 2, 0), min(xs.max() + 3, size), min(ys.max() + 3, size))
    rgb = np.zeros((size, size, 3), np.float32)
    elong = np.full((size, size), 1e3, np.float32)
    gsd = np.zeros((size, size), np.float32)
    for y in range(box[1], box[3], rows):
        y1 = min(y + rows, box[3])
        r, s, e, g = place.level((0, 0), width_deg, size, (box[0], y, box[2], y1), ss)
        rgb[y:y1, box[0]:box[2]] = r
        elong[y:y1, box[0]:box[2]] = e
        gsd[y:y1, box[0]:box[2]] = g
    return rgb, elong, gsd


def write(ground, name, folder):
    folder.mkdir(parents=True, exist_ok=True)
    y = filmic(ground)
    img = Image.fromarray((M.srgb(np.where(y >= 0.9849, 1, y)) * 255 + 0.5).astype(np.uint8))
    (folder / 'full').mkdir(exist_ok=True)
    (folder / 'web').mkdir(exist_ok=True)
    img.save(folder / 'full' / name, quality=SPEC['quality'], subsampling=0)
    img.resize((img.width // 2, img.height // 2), Image.LANCZOS).save(folder / 'web' / name, quality=SPEC['quality'], subsampling=0)


def lay_all(kind):
    place = M.Place(kind, border=SPEC['mask']['borderPx'])
    s = SPEC['sets'][kind]
    folder = OUT / kind
    folder.mkdir(parents=True, exist_ok=True)
    mask = mask_of(place)
    for level in SPEC['levels']:
        if level['n'] not in s['levels']:
            continue
        size = SPEC['size']
        w = mask_at(mask, level['widthDeg'], size)
        rgb, elong, gsd = lay(place, level['widthDeg'], size, level['ss'], w)
        np.save(folder / ('lay-%d.npy' % level['n']), np.dstack([rgb, w, elong, gsd]).astype(np.float16))
        print(kind, 'level', level['n'], 'laid, mask share', round(float((w > 0.99).mean()), 4), flush=True)


def plate(kind):
    import repaint as RP
    own = json.loads((M.ROOT / 'src/stops/mercury/own.json').read_text())
    s = SPEC['sets'][kind]
    size = SPEC['size']
    lift, knee, grey, tint = RP.carry()
    top = float(unfilmic(np.float32(0.985))) * own['gain']
    for level in SPEC['levels']:
        n = level['n']
        if n not in s['levels']:
            continue
        graded = np.load(RP.WORK / ('%s%d%s.npy' % (s['source'], n, s['suffix']))).astype(np.float32)
        bare = graded / np.maximum(lift - graded.max(-1, keepdims=True) * (lift - 1) * knee, 1e-3)
        peak = bare.max(-1, keepdims=True)
        over = float((peak > top).mean())
        bare = bare * np.minimum(1, top / np.maximum(peak, 1e-6))
        a = old_ground(n)
        gain, floor = RP.light(n, kind)
        gain = gain + 1e-6
        gx, gy = M.grid((0, 0), level['widthDeg'], size)
        m = (1 - step(math.tan(math.radians(own['deg'][0])), math.tan(math.radians(own['deg'][1])), np.hypot(gx, gy)))[..., None]
        tex = ((1 - m) * gain * a + m * bare) / ((1 - m) * gain + m * own['gain'])
        write(tex.astype(np.float32), 'patch-%d%s.jpg' % (n, s['suffix']), OUT / kind)
        print(kind, 'level', n, 'share over the top of the plate', round(over, 5), 'own light share', round(float((m > 0.999).mean()), 4), 'plate value 50 99 99.9 percentile', np.round(np.percentile(tex[::4, ::4], [50, 99, 99.9]), 3), flush=True)


def install(kind):
    s = SPEC['sets'][kind]
    for key in ('full', 'web'):
        for f in sorted((OUT / kind / key).iterdir()):
            (PUBLIC / key / f.name).write_bytes(f.read_bytes())
            print('installed', key, f.name, f.stat().st_size)


def first(kind):
    own = json.loads((M.ROOT / 'src/stops/mercury/own.json').read_text())
    f = SPEC['first']
    size = SPEC['size']
    two = next(lv['widthDeg'] for lv in SPEC['levels'] if lv['n'] == 2)
    old = np.asarray(Image.open(OLD / 'full-patch-1.jpg').convert('RGB'))
    a = old.astype(np.float32) / 255
    place = np.asarray(Image.open(PUBLIC / 'full/patch-2.jpg').convert('RGB')).astype(np.float32) / 255
    n = int(round(size * M.half(two) / M.half(f['widthDeg'])))
    small = cv2.resize(place, (n, n), interpolation=cv2.INTER_AREA)
    gx, gy = M.grid((0, 0), f['widthDeg'], size)
    b = np.clip(cv2.remap(small, ((gx / (2 * M.half(two)) + 0.5) * n - 0.5).astype(np.float32), ((0.5 - gy / (2 * M.half(two))) * n - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), 0, 1)
    sigma = math.radians(f['sigmaDeg']) / (2 * M.half(f['widthDeg'])) * size
    soft = lambda x: cv2.GaussianBlur(x, (0, 0), sigma)
    r = np.hypot(gx, gy)
    inner, outer = (math.tan(math.radians(v)) for v in own['deg'])
    fine = cv2.GaussianBlur(b.mean(axis=2), (0, 0), f['edgeDeg'] / f['sigmaDeg'] * sigma)
    mid = (f['lit'][0] + f['lit'][1]) / 2
    at = (np.abs(fine - mid) < (f['lit'][1] - f['lit'][0]) / 4) & (r < inner * f['inside'])
    pts = np.stack([gx[at], gy[at]], axis=1)
    c = pts.mean(axis=0)
    v = np.linalg.svd(pts - c, full_matrices=False)[2][0]
    nrm = np.array([-v[1], v[0]])
    lit = (fine > f['lit'][1]) & (r < inner * f['inside'])
    if ((np.stack([gx[lit], gy[lit]], axis=1) - c) @ nrm).mean() < 0:
        nrm = -nrm
    line = step(-math.radians(f['edgeDeg']), math.radians(f['edgeDeg']), (gx - c[0]) * nrm[0] + (gy - c[1]) * nrm[1])
    ring = step(inner * f['inside'] * f['inside'], inner * f['inside'], r)
    day = (step(f['lit'][0], f['lit'][1], fine) * (1 - ring) + line * ring).astype(np.float32)[..., None]
    under = soft(b * day) / np.maximum(soft(day)[..., None], 1e-3)
    calm = soft(a)
    near = lambda x: cv2.GaussianBlur(x, (0, 0), f['edgeDeg'] / f['sigmaDeg'] * sigma)
    rim = lambda x: cv2.GaussianBlur(x, (0, 0), f['rimDeg'] / f['sigmaDeg'] * sigma).mean(axis=2)
    q = np.clip(rim(b) / np.maximum(rim(a), 1e-3), 0, 1)[..., None]
    night = np.clip((f['night'] + (1 - f['night']) * q) * (calm + q * (a - calm)) + (1 - q) * f['faint'] * (b - near(b)), 0, 1)
    new = np.clip(day * calm * np.clip(b / np.maximum(under, f['floor']), 0, f['top']) + (1 - day) * night, 0, 1)
    m = (1 - step(math.tan(math.radians(own['hold'][0])), math.tan(math.radians(own['hold'][1])), r))[..., None].astype(np.float32)
    print('the place\'s own night edge: through', np.round(np.degrees(np.arctan(c)), 2), 'degrees east and north of the spot, lit side toward', np.round(nrm, 3), 'points', len(pts))
    m[m < 1 / 512] = 0
    full = np.where(m > 0, ((a * (1 - m) + new * m) * 255 + 0.5).astype(np.uint8), old)
    web = np.asarray(Image.open(OLD / 'web-patch-1.jpg').convert('RGB'))
    half = np.asarray(Image.fromarray(full).resize((size // 2, size // 2), Image.LANCZOS))
    web = np.where(cv2.resize(m[..., 0], (size // 2, size // 2), interpolation=cv2.INTER_AREA)[..., None] > 0, half, web)
    for key, pic in (('full', full), ('web', web)):
        (OUT / 'first' / key).mkdir(parents=True, exist_ok=True)
        Image.fromarray(pic).save(OUT / 'first' / key / 'patch-1.jpg', quality=SPEC['quality'], subsampling=0)
        (PUBLIC / key / 'patch-1.jpg').write_bytes((OUT / 'first' / key / 'patch-1.jpg').read_bytes())
        print('installed', key, 'patch-1.jpg', (PUBLIC / key / 'patch-1.jpg').stat().st_size, 'share of the plate that is the place', round(float((m > 0).mean()), 4), 'blur', round(sigma, 1), 'texels')


if __name__ == '__main__':
    {'lay': lay_all, 'plate': plate, 'install': install, 'first': first}[sys.argv[1]](sys.argv[2])
