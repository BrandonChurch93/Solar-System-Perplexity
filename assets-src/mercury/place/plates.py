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


if __name__ == '__main__':
    {'lay': lay_all, 'plate': plate, 'install': install}[sys.argv[1]](sys.argv[2])
