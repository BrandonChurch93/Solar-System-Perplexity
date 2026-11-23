import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import prep
from prep import GEN, PL, axes, display, resample, smooth


def ring(m):
    gx, gy = axes(m)
    X, Y = np.meshgrid(gx, gy)
    r0, r1 = PL['nest']
    c, k = PL['near']['centre'], PL['nestPower']
    r = (np.abs(X - c[0]) ** k + np.abs(Y - c[1]) ** k) ** (1 / k)
    return (1 - smooth((r - r0) / (r1 - r0))).astype(np.float32)[..., None]


def nest():
    near = np.load(os.path.join(GEN, 'near-plate.npy'))
    bare = np.load(os.path.join(GEN, 'mid_bare-plate.npy'))
    n, m = PL['near'], PL['mid']
    k = (m['size'][0] / m['pixels'][0]) / (n['size'][0] / n['pixels'][0])
    small = resample(cv2.GaussianBlur(near, (0, 0), k * 0.5), n, m, cv2.INTER_LINEAR)
    w = ring(m)
    mid = small * w + bare * (1 - w)
    up = resample(mid, m, n, cv2.INTER_CUBIC)
    w = ring(n)
    fine = near * w + np.maximum(up, 0) * (1 - w)
    return fine.astype(np.float32), mid.astype(np.float32)


if __name__ == '__main__':
    fine, mid = nest()
    far = prep.grade()
    for name, plate in (('near', fine), ('mid', mid)):
        np.save(os.path.join(GEN, name + '-nest.npy'), plate)
        cv2.imwrite(os.path.join(GEN, name + '-nest.png'), display(plate * far)[::-1, :, ::-1])
    fore = np.load(os.path.join(GEN, 'fore-plate.npy'))
    np.save(os.path.join(GEN, 'fore-nest.npy'), fore)
    cv2.imwrite(os.path.join(GEN, 'fore-nest.png'), display(fore * far)[::-1, :, ::-1])
    print('nested: near', fine.shape, 'mid', mid.shape, 'fore', fore.shape)
