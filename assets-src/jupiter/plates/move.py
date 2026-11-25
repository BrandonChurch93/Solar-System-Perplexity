import io
import json
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))


def globe_before():
    top = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
    stop = os.path.join(top, 'src', 'stops', 'jupiter')
    with open(os.path.join(stop, 'deck.json')) as f:
        up = json.load(f)['plates']['upward']
    with open(os.path.join(stop, 'patches.json')) as f:
        files = ['wrap-color.jpg'] + [level['file'] for level in json.load(f)['levels']]
    for name in ('full', 'web') if 'from' in up else ():
        for file in files:
            rel = '/'.join(['public', 'assets', 'jupiter', name, file])
            raw = subprocess.run(['git', 'show', up['from'] + ':' + rel], cwd=top, check=True, capture_output=True).stdout
            with open(os.path.join(top, rel), 'wb') as f:
                f.write(raw)


if __name__ == '__main__':
    globe_before()
import bake
import prep
from prep import PL, PLACE, ROOT, axes, display, globe_albedo, scene_of, smooth

MOVE = PL['move']
LIGHT = np.array(PLACE['solved']['light'], np.float32)
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'move')


def kept(name):
    raw = subprocess.run(['git', 'show', MOVE['from'] + ':public/assets/jupiter/full/plate-' + name + '.png'], cwd=ROOT, check=True, capture_output=True).stdout
    px = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_UNCHANGED)[::-1]
    return np.ascontiguousarray(px[..., 2::-1]), px[..., 3].astype(np.float32) / 255


def ground(name):
    alb = globe_albedo(PL[name])
    soften = PL['globeSoftenPx'].get(name, 0)
    if soften > 0:
        alb = cv2.GaussianBlur(alb, (0, 0), soften)
    return np.maximum(alb, 0) * LIGHT


def polar(m):
    gx, gy = axes(m)
    X, Y = np.meshgrid(gx, gy)
    dx = X - PLACE['vortex'][0]
    dy = Y - PLACE['vortex'][1]
    return np.hypot(dx, dy), (np.arctan2(dy, dx) / (2 * np.pi)) % 1.0


def shade_table():
    s = MOVE['shade']
    painted, _ = kept(s['plate'])
    under = ground(s['plate'])
    r, turn = polar(PL[s['plate']])
    ring = (r >= s['ring'][0]) & (r < s['ring'][1])
    n = s['sectors']
    b = np.minimum((turn[ring] * n).astype(np.int64), n - 1)
    paint = scene_of(painted)[ring]
    below = under[ring]
    table = np.ones((n, 3), np.float32)
    for c in range(3):
        table[:, c] = np.bincount(b, paint[:, c], n) / np.maximum(np.bincount(b, below[:, c], n), 1e-6)
    table = np.clip(table, s['least'], 1.0)
    wide = np.concatenate([table, table, table])
    wide = cv2.GaussianBlur(wide.reshape(1, 3 * n, 3), (0, 0), s['soften']).reshape(3 * n, 3)
    return wide[n:2 * n]


def shaded(name, under):
    s = MOVE['shade']
    table = shade_table()
    n = s['sectors']
    r, turn = polar(PL[name])
    at = turn * n - 0.5
    i0 = np.floor(at).astype(np.int64)
    f = (at - i0).astype(np.float32)[..., None]
    tone = table[i0 % n] * (1 - f) + table[(i0 + 1) % n] * f
    fall = (1 - smooth((r - s['reach'][0]) / (s['reach'][1] - s['reach'][0]))).astype(np.float32)[..., None]
    return under * (1 + (tone - 1) * fall)


def moved(name):
    m = PL[name]
    step = m['size'][0] / m['pixels'][0]
    under = shaded(name, ground(name))
    coded = display(under)
    rough = bake.rough_of(coded, step)
    if name in MOVE['keep']:
        painted, alpha = kept(name)
        gx, gy = axes(m)
        X, Y = np.meshgrid(gx, gy)
        r = np.hypot(X - PLACE['vortex'][0], Y - PLACE['vortex'][1])
        k = (1 - smooth((r - MOVE['keep'][name][0]) / (MOVE['keep'][name][1] - MOVE['keep'][name][0]))).astype(np.float32)
        coded = display(scene_of(painted) * k[..., None] + under * (1 - k)[..., None])
        rough = alpha * k + rough * (1 - k)
    return coded, rough


if __name__ == '__main__':
    os.makedirs(WORK, exist_ok=True)
    for name in MOVE['plates']:
        coded, rough = moved(name)
        bake.write_plate(name, coded, rough)
        cv2.imwrite(os.path.join(WORK, name + '.jpg'), cv2.resize(coded[::-1, :, ::-1], (1024, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 92])
        print('plate', name, coded.shape, 'mean', np.round(coded.reshape(-1, 3).mean(0), 2))
