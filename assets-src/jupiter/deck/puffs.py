import collections
import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, '..', '..', '..', 'src', 'stops', 'jupiter', 'deck.json')


def main():
    deck = json.load(open(PATH), object_pairs_hook=collections.OrderedDict)
    cloud = deck['look']['cloud']
    reach2 = cloud['cell']['reach'] ** 2
    free = cloud['cell']['jitter']
    rng = np.random.default_rng(3)
    n = 64
    fine = 16
    cx = np.arange(n)[None, :] + 0.5 - 0.5 * free + free * rng.random((n, n))
    cy = np.arange(n)[:, None] + 0.5 - 0.5 * free + free * rng.random((n, n))
    p = rng.random((n, n))
    alive = 16 * p * p * (1 - p) * (1 - p)
    ys, xs = np.mgrid[0:n * fine, 0:n * fine]
    qx = (xs + 0.5) / fine
    qy = (ys + 0.5) / fine
    b = np.zeros(qx.shape)
    gx = np.zeros(qx.shape)
    ix = np.floor(qx).astype(int)
    iy = np.floor(qy).astype(int)
    for j in (-1, 0, 1):
        for i in (-1, 0, 1):
            jx = (ix + i) % n
            jy = (iy + j) % n
            rx = cx[jy, jx] + ((ix + i) - jx) - qx
            ry = cy[jy, jx] + ((iy + j) - jy) - qy
            d = np.clip(1 - (rx * rx + ry * ry) / reach2, 0, None)
            a = alive[jy, jx]
            b += a * d ** 3
            gx += a * d * d * 6 / reach2 * rx
    cloud['field'] = collections.OrderedDict([('mean', round(float(b.mean()), 4)), ('variance', round(float(b.var()), 4)), ('slopeVariance', round(float(gx.var()), 4))])
    print('field', dict(cloud['field']), 'least', round(float(b.min()), 4), 'most', round(float(b.max()), 4))
    json.dump(deck, open(PATH, 'w'), indent=2)
    open(PATH, 'a').write('\n')


main()
