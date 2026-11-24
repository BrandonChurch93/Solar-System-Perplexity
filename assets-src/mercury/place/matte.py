import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SPEC = json.loads((ROOT / 'assets-src/mercury/place/plates.json').read_text())['matte']
WORK = ROOT / 'out/work/mercury/place'


def mosaic(folder, frame):
    w, h = SPEC['window']
    out = np.zeros((h * 3, w * 3), np.float32)
    for j in range(3):
        for i in range(3):
            tile = np.asarray(Image.open(Path(folder) / ('%d-%d' % (i * w, j * h)) / ('f%d.png' % frame)).convert('L'), np.float32) / 255
            out[j * h:(j + 1) * h, i * w:(i + 1) * w] = tile
    return out


def edge(kind, folder):
    w, h = SPEC['picture'][kind]
    alpha = mosaic(folder, SPEC['frame'][kind])[:h, :w]
    count, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > SPEC['solid']).astype(np.uint8), connectivity=4)
    solid = labels == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    top = np.where(solid.any(axis=0), solid.argmax(axis=0), h).astype(np.float32)
    k = SPEC['reachPx'] * 2 + 1
    low = cv2.dilate(top.reshape(1, -1), np.ones((1, k), np.uint8))
    low = cv2.GaussianBlur(low, (0, 0), SPEC['reachPx'], borderType=cv2.BORDER_REPLICATE).reshape(-1)
    n = SPEC['columns']
    at = (np.arange(n) + 0.5) / n * w - 0.5
    share = np.interp(at, np.arange(w), low) / h
    Image.fromarray(np.round(cv2.resize(alpha, (w // 4, h // 4), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), 'L').save(WORK / 'plates' / ('alpha-%s.png' % kind))
    print(kind, 'ground edge rows', int(top.min()), 'to', int(top.max()), 'of', h, 'smoothed', round(float(low.min()), 1), 'to', round(float(low.max()), 1))
    return [round(float(v), 5) for v in share]


if __name__ == '__main__':
    out = {'columns': SPEC['columns'], 'dive': edge('dive', sys.argv[1]), 'rise': edge('rise', sys.argv[2])}
    (ROOT / SPEC['out']).write_text(json.dumps(out) + '\n')
