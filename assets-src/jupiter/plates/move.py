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


def moved(name):
    m = PL[name]
    step = m['size'][0] / m['pixels'][0]
    under = ground(name)
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
