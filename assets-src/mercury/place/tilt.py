import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import mosaic as M
import plates as P

SPEC = M.ROOT / 'src/stops/mercury/tilt.json'
OUT = M.WORK / 'tilt'
PUBLIC = M.ROOT / 'public/assets/mercury'
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def make(spec):
    import repaint as RP
    t = json.loads(Path(spec).read_text())
    own = json.loads((M.ROOT / 'src/stops/mercury/own.json').read_text())
    size = P.SPEC['size']
    px = size / (2 * M.half(t['widthDeg']))
    plate = P.unfilmic(M.linear(np.asarray(Image.open(PUBLIC / 'full/patch-2.jpg').convert('RGB')))).astype(np.float32)
    a = P.old_ground(2)
    gain = RP.light(2, 'dive')[0] + 1e-6
    gx, gy = M.grid((0, 0), t['widthDeg'], size)
    m = (1 - P.step(math.tan(math.radians(own['deg'][0])), math.tan(math.radians(own['deg'][1])), np.hypot(gx, gy))).astype(np.float32)
    part = (plate * ((1 - m[..., None]) * gain + m[..., None] * own['gain']) - (1 - m[..., None]) * gain * a) / own['gain']
    lum = np.maximum(part @ LUMA, 0).astype(np.float32)
    del plate, a, gain
    sigma = math.radians(t['sigmaDeg']) * px
    soft = lambda x, s=sigma: cv2.GaussianBlur(x, (0, 0), s)
    inside = m > t['least']
    own_lum = np.where(inside, lum / np.maximum(m, t['least']), 0).astype(np.float32)
    day = (P.step(t['lit'][0], t['lit'][1], soft(own_lum, sigma / 6)) * inside).astype(np.float32)
    low = soft(lum * day) / np.maximum(soft(m * day), 1e-4)
    seen = P.step(t['seen'][0], t['seen'][1], soft(day, math.radians(t['seenDeg']) * px) / np.maximum(soft(inside.astype(np.float32), math.radians(t['seenDeg']) * px), 1e-3))
    fine = math.radians(t['tone']['sigmaDeg']) * px if t.get('tone') else sigma
    tone = soft(part, fine) / np.maximum(soft(m, fine), 1e-4)[..., None]
    del part
    weight = (m * seen).astype(np.float32)
    ratio = np.where(inside, own_lum / np.maximum(low, 1e-4) - 1, 0).astype(np.float32)
    lo, hi = -t['zero'] * t['step'], (255 - t['zero']) * t['step']
    at = weight > 0.5
    print('ratio where the place gives craters: 1 percent %.2f, median %.2f, 99 percent %.2f; clipped low %.4f, high %.4f of it; share of the square %.4f' % (*np.percentile(ratio[at], [1, 50, 99]), float((ratio[at] < lo).mean()), float((ratio[at] > hi).mean()), float(at.mean())))
    lean = np.clip(ratio, lo, hi) * weight
    old = M.linear(np.asarray(Image.open(P.OLD / 'full-patch-2.jpg').convert('RGB')))
    for key in ('full', 'web'):
        (OUT / key).mkdir(parents=True, exist_ok=True)
        n = t['size'][key]
        code = np.clip(np.rint(cv2.resize(lean, (n, n), interpolation=cv2.INTER_AREA) / t['step'] + t['zero']), 0, 255).astype(np.uint8)
        Image.fromarray(code, 'L').save(OUT / key / t['file'], optimize=True)
        print(key, t['file'], n, (OUT / key / t['file']).stat().st_size)
    if t.get('tone'):
        n = t['tone']['size']
        coded = (M.srgb(P.filmic(cv2.resize(tone, (n, n), interpolation=cv2.INTER_AREA))) * 255 + 0.5).astype(np.uint8)
        for key in ('full', 'web'):
            Image.fromarray(coded).save(OUT / key / t['tone']['file'], optimize=True)
            print(key, t['tone']['file'], n, (OUT / key / t['tone']['file']).stat().st_size)
    view = np.clip((lean / t['step'] + t['zero']) / 255, 0, 1)
    Image.fromarray((cv2.resize(view, (1024, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), 'L').save(OUT / 'tilt-view.png')
    Image.fromarray((cv2.resize(weight, (1024, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), 'L').save(OUT / 'weight-view.png')
    ground = P.unfilmic(old)
    ndl = M.dirs(gx, gy) @ np.array(t['sun'])
    curve = np.array(json.loads((M.ROOT / 'src/stops/mercury/curve.json').read_text())['curve'])
    lit = M.srgb(P.filmic(ground * np.maximum(RP.lc.curve_at(curve, ndl) - curve[0], 0) * (1 + lean)[..., None] * t['viewGain']))
    Image.fromarray((cv2.resize(lit.astype(np.float32), (1024, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)).save(OUT / 'lit-view.jpg', quality=90)


def install(spec):
    t = json.loads(Path(spec).read_text())
    for key in ('full', 'web'):
        for name in [t['file']] + ([t['tone']['file']] if t.get('tone') else []):
            (PUBLIC / key / name).write_bytes((OUT / key / name).read_bytes())
            print('installed', key, name, (PUBLIC / key / name).stat().st_size)


if __name__ == '__main__':
    {'make': make, 'install': install}[sys.argv[1]](sys.argv[2] if len(sys.argv) > 2 else SPEC)
