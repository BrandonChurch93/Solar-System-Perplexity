import json, sys
import numpy as np
import cv2

APPROVED = 'references/approved/sun-close.jpg'
WORK = 'out/work/sun'


def gray(path, width=None):
    im = cv2.imread(path)
    if width and im.shape[1] != width:
        im = cv2.resize(im, (width, round(im.shape[0] * width / im.shape[1])), interpolation=cv2.INTER_AREA)
    return cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255


def fit(name, scale, offset):
    take = gray(f'{WORK}/{name}.png')
    ref = gray(APPROVED)
    k = take.shape[1] / ref.shape[1]
    warp = np.array([[scale * k, 0, offset[0] * take.shape[1]], [0, scale * k, offset[1] * take.shape[0]]], dtype=np.float32)
    mask = np.zeros(take.shape, np.uint8)
    h, w = take.shape
    mask[int(h * (offset[1] + scale * 0.62)):int(h * (offset[1] + scale * 0.99)), int(w * (offset[0] + scale * 0.01)):int(w * (offset[0] + scale * 0.99))] = 255
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7)
    cc, warp = cv2.findTransformECC(ref, take, warp, cv2.MOTION_AFFINE, crit, mask, 5)
    print(name, 'cc', round(float(cc), 4), warp.round(5).tolist())
    return {'cc': float(cc), 'matrix': warp.tolist(), 'takeSize': [take.shape[1], take.shape[0]]}


out = {'clean': fit('close-clean-take1', 1.0, (0, 0)), 'wide': fit('close-wide-take1', 2 / 3, (1 / 6, 1 / 6))}
json.dump(out, open(f'{WORK}/register.json', 'w'), indent=1)
