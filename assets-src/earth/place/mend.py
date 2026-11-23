import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from layback import WORK

SPEC = json.loads((Path(__file__).resolve().parent / 'mend.json').read_text())


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def far_mask(spec, take, size):
    import geom as g
    from layback import centre
    deg = g.PLACE['plates']['levels'][0]['widthDeg']
    per = size / deg
    nadir = g.direction(g.GLOBE['lon'], g.GLOBE['lat'])
    dist = np.degrees(np.arccos(np.clip(g.plate_dirs(centre(), deg, size) @ nadir, -1, 1))).astype(np.float32)
    inside = (np.load(WORK / 'q12-inside.npy') > 0.99).astype(np.float32)
    e = cv2.GaussianBlur(inside, (0, 0), spec['edgeDeg'] * per)
    c = step(spec['cloud'][0], spec['cloud'][1], cv2.GaussianBlur(take.min(axis=2), (0, 0), 0.012 * per))
    a = (dist - spec['fromDeg'][0]) / (spec['fromDeg'][1] - spec['fromDeg'][0])
    arc = step(0.0, 1.0, a + spec['lean'][0] * (c - 0.6))
    edge = step(0.5, 0.9, e + spec['lean'][1] * (c - 1) * np.clip(4 * e * (1 - e), 0, 1))
    return arc * edge


def main():
    name, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    spec = SPEC[name]
    base = cv2.imread(str(WORK / src)).astype(np.float32)
    size = base.shape[0]
    take = cv2.imread(str(WORK / spec['take'])).astype(np.float32)
    if take.shape[0] != size:
        take = cv2.resize(take, (size, size), interpolation=cv2.INTER_LANCZOS4)
    if 'fromDeg' in spec:
        mask = far_mask(spec, take, size)
        out = base * (1 - mask[..., None]) + take * mask[..., None]
        cv2.imwrite(str(WORK / dst), np.clip(out + 0.5, 0, 255).astype(np.uint8))
        cv2.imwrite(str(WORK / (dst.rsplit('.', 1)[0] + '-look.jpg')), cv2.resize(np.clip(out, 0, 255).astype(np.uint8), (1024, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
        print(name, 'share of the plate taken from the take', round(float(mask.mean()), 4), flush=True)
        return
    k = size / spec['of']
    mask = np.zeros((size, size), np.float32)
    cv2.fillPoly(mask, [np.round(np.array(spec['polygon'], np.float32) * k).astype(np.int32)], 1.0)
    mask = cv2.GaussianBlur(mask, (0, 0), spec['featherPx'] * k)
    mask = np.clip((mask - 0.5) * 2, 0, 1)
    mask = mask * mask * (3 - 2 * mask)
    if spec.get('keepCanvas'):
        inside = np.load(WORK / 'q12-inside.npy').astype(np.float32)
        if inside.shape[0] != size:
            inside = cv2.resize(inside, (size, size), interpolation=cv2.INTER_LINEAR)
        mask = mask * (1 - np.clip(cv2.GaussianBlur(inside, (0, 0), spec['featherPx'] * k) * 2, 0, 1))
    out = base * (1 - mask[..., None]) + take * mask[..., None]
    cv2.imwrite(str(WORK / dst), np.clip(out + 0.5, 0, 255).astype(np.uint8))
    cv2.imwrite(str(WORK / (dst.rsplit('.', 1)[0] + '-look.jpg')), cv2.resize(np.clip(out, 0, 255).astype(np.uint8), (1024, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(name, 'share of the plate taken from the take', round(float(mask.mean()), 4), flush=True)


if __name__ == '__main__':
    main()
