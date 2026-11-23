import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, centre

SPEC = json.loads((Path(__file__).resolve().parent / 'mend.json').read_text())['ring']


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mask(take, hold, spec=SPEC):
    size = take.shape[0]
    per = size / spec['widthDeg']
    cloud = step(spec['cloud'][0], spec['cloud'][1], cv2.GaussianBlur(take.min(axis=2), (0, 0), spec['cloudSigmaDeg'] * per))
    moved = np.abs(cv2.GaussianBlur(take, (0, 0), spec['movedSigmaDeg'] * per) - cv2.GaussianBlur(hold, (0, 0), spec['movedSigmaDeg'] * per)).max(axis=2)
    moved = step(spec['moved'][0], spec['moved'][1], moved)
    nadir = g.direction(g.GLOBE['lon'], g.GLOBE['lat'])
    dist = np.degrees(np.arccos(np.clip(g.plate_dirs(centre(), spec['widthDeg'], size) @ nadir, -1, 1))).astype(np.float32)
    far = step(spec['fromDeg'][0], spec['fromDeg'][1], dist)
    t = np.abs((np.arange(size) + 0.5) / size - 0.5)
    tone = take.mean(axis=2)
    cells = cv2.GaussianBlur(tone, (0, 0), spec['cells'][0] * per) - cv2.GaussianBlur(tone, (0, 0), spec['cells'][1] * per)
    cells = np.clip(cells / (2.5 * cells.std()), -1, 1)
    edge = step(0.0, 1.0, (0.5 - np.maximum.outer(t, t)) / spec['edge'] - 0.15 + spec['lean'] * cells).astype(np.float32)
    return (cloud * moved * far * edge).astype(np.float32)


if __name__ == '__main__':
    from levels import hold_level, reproject, P, SPOT
    size = int(sys.argv[1]) if len(sys.argv) > 1 else 1024
    take = np.minimum(cv2.imread(str(WORK / SPEC['take'] if len(sys.argv) < 3 else sys.argv[2])).astype(np.float32) * np.array(SPEC['tint'], np.float32), 255)
    take = cv2.resize(take, (size, size), interpolation=cv2.INTER_AREA)
    hold, _ = reproject(hold_level(48), SPOT, 48, P, SPEC['widthDeg'], size)
    m = mask(take, hold)
    out = hold * (1 - m[..., None]) + take * m[..., None]
    cv2.imwrite(str(WORK / 'ring-look.jpg'), np.hstack([np.clip(out, 0, 255).astype(np.uint8), cv2.cvtColor((m * 255).astype(np.uint8), cv2.COLOR_GRAY2BGR)]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('ring share', round(float(m.mean()), 4))
