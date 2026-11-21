import json
import os
import sys

import numpy as np
from scipy import ndimage as ndi
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/rings/'
N0 = np.array([-0.1989, -0.6042, 0.7716])
CX, CY, RPX = 1460.0, 859.0, 529.0
T, R0, R1, NR = 2160, 0.95, 2.1, 900
RBIN, RLO, RHI = 0.004, 1.15, 1.8
ABINS = 120


def basis(n):
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return e1, np.cross(n, e1)


def hit(n, d):
    t = -(n @ geo.CAM) / (d @ n)
    return geo.CAM + d * t[:, None]


def main():
    os.makedirs(OUT, exist_ok=True)
    n0 = N0 / np.linalg.norm(N0)
    e1, e2 = basis(n0)
    rd = np.load('out/work/u/ridge.npy')
    sm = ndi.gaussian_filter(rd, (1.2, 6), mode=('nearest', 'wrap'))
    mx = (sm >= ndi.maximum_filter(sm, size=(7, 1))) & (sm > 0.005)
    ys, xs = np.nonzero(mx)
    rho = R0 + ys / (NR - 1) * (R1 - R0)
    keep = (rho > 1.02) & (rho < 1.8)
    ys, xs, rho = ys[keep], xs[keep], rho[keep]
    th = xs / T * 2 * np.pi
    px = CX + rho * RPX * np.cos(th)
    py = CY - rho * RPX * np.sin(th)
    f = 792 / np.tan(np.radians(15))
    d = np.stack([(px - 1408) / f, (792 - py) / f, -np.ones_like(px)], 1)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    wgt = sm[ys, xs]
    alive = np.ones(len(d), bool)
    print('ridge points', len(d))
    grid = np.arange(-0.34, 0.341, 0.0125)
    rings = []
    nr = int((RHI - RLO) / RBIN)
    for it in range(16):
        best = (0, None, None)
        dd = d[alive]
        for a in grid:
            for b in grid:
                n = n0 + a * e1 + b * e2
                n /= np.linalg.norm(n)
                x = hit(n, dd)
                rad = np.linalg.norm(x, axis=1)
                u1, u2 = basis(n)
                az = np.arctan2(x @ u2, x @ u1)
                ri = ((rad - RLO) / RBIN).astype(int)
                ok = (ri >= 0) & (ri < nr)
                ai = ((az[ok] + np.pi) / (2 * np.pi) * ABINS).astype(int) % ABINS
                h = np.zeros((nr, ABINS), bool)
                h[ri[ok], ai] = True
                cov = h.sum(1)
                k = int(np.argmax(cov))
                if cov[k] > best[0]:
                    best = (int(cov[k]), n, RLO + (k + 0.5) * RBIN)
        cov, n, r = best
        if cov < 28:
            break

        def resid(p, pts):
            m = n + p[0] * e1 + p[1] * e2
            m /= np.linalg.norm(m)
            return np.linalg.norm(hit(m, pts), axis=1) - p[2]

        for tol in (0.006, 0.004):
            m = n
            rad = np.linalg.norm(hit(m, d), axis=1)
            sup = alive & (np.abs(rad - r) < tol)
            s = least_squares(resid, [0, 0, r], args=(d[sup],), loss='soft_l1', f_scale=0.002)
            n = n + s.x[0] * e1 + s.x[1] * e2
            n /= np.linalg.norm(n)
            r = float(s.x[2])
        rad = np.linalg.norm(hit(n, d), axis=1)
        sup = alive & (np.abs(rad - r) < 0.006)
        alive &= ~sup
        tilt = float(np.degrees(np.arccos(np.clip(n @ n0, -1, 1))))
        rings.append({'normal': n.tolist(), 'radius': r, 'coverage': cov, 'support': int(sup.sum()), 'weight': float(wgt[sup].mean()), 'tilt': tilt})
        print(it, 'cov', cov, 'r', round(r, 4), 'tilt', round(tilt, 2), 'n', np.round(n, 4), 'support', int(sup.sum()), 'w', round(float(wgt[sup].mean()), 4), flush=True)
    json.dump(rings, open(OUT + 'rings-fit.json', 'w'), indent=1)


main()
