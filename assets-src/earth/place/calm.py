import json
import sys
from pathlib import Path

import cv2
import numpy as np

SPEC = json.loads((Path(__file__).resolve().parent / 'mend.json').read_text())['calm']


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def land_of(img, spec=SPEC, dot=1):
    b, g, r = img[..., 0], img[..., 1], img[..., 2]
    green = (g > r + spec['green']) & ((g > b + spec['green']) | ((g > b + spec.get('blue', spec['green'])) & (img.max(axis=2) < spec.get('top', 0))))
    pale = (r > b + spec['pale'][0]) & (g > b + spec['pale'][1])
    seed = (green | pale).astype(np.float32)
    k = 2 * spec['reachPx'] + 1
    near = cv2.dilate(cv2.GaussianBlur(seed, (0, 0), spec['sigmaPx']), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    warm = cv2.GaussianBlur(np.maximum(r, g) - b, (0, 0), spec['sigmaPx'])
    cloud = ((img.min(axis=2) > spec['cloud'][0]) & (r - b < spec['cloud'][1])).astype(np.uint8)
    cloud = cv2.morphologyEx(cloud, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dot + 1, 2 * dot + 1)))
    k = 2 * spec['cloudPx'] + 1
    cloud = cv2.GaussianBlur(cv2.dilate(cloud, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))).astype(np.float32), (0, 0), 1.5)
    return step(spec['share'][0], spec['share'][1], near) * step(spec['warm'][0], spec['warm'][1], warm) * (1 - cloud)


def calm(img, deg, spec=SPEC, keep=None):
    r = spec['dotPx'].get(str(deg))
    if not r:
        return img, np.zeros(img.shape[:2], np.float32)
    land = land_of(img, spec, r)
    if keep is not None:
        land = land * keep
    k = 2 * r + 1
    flat = cv2.morphologyEx(img, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    flat = cv2.medianBlur(np.clip(flat + 0.5, 0, 255).astype(np.uint8), 2 * (r * spec['median'] // 2) + 1).astype(np.float32)
    flat = cv2.GaussianBlur(np.minimum(flat, img), (0, 0), spec['softPx'])
    out = flat + (img - flat) * spec['keep']
    w = cv2.GaussianBlur(land, (0, 0), spec['edgePx'])[..., None]
    return img * (1 - w) + out * w, land


if __name__ == '__main__':
    from layback import WORK
    deg = int(sys.argv[1])
    img = cv2.imread(str(WORK / 'hold' / ('patch-%d.jpg' % deg))).astype(np.float32)
    out, land = calm(img, deg)
    ys, xs = np.nonzero(land > 0.5)
    h = np.histogram2d(ys, xs, bins=6, range=[[0, img.shape[0]], [0, img.shape[1]]])[0]
    j, i = np.unravel_index(h.argmax(), h.shape)
    y0, x0 = int(j * img.shape[0] / 6), int(i * img.shape[1] / 6)
    c = (slice(y0, y0 + 660), slice(x0, x0 + 660))
    cv2.imwrite(str(WORK / 'tmp' / ('calm-%d.jpg' % deg)), np.hstack([img[c], out[c]]).clip(0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('level', deg, 'land share', round(float((land > 0.5).mean()), 4), 'changed rms on land', round(float(np.sqrt((((out - img) ** 2).mean(axis=2))[land > 0.5].mean())), 2))
