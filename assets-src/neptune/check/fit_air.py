import json
import sys

import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/neptune')
sys.path.insert(0, 'assets-src/neptune/check')
import geo
import profiles

THETAS = [float(t) for t in range(-15, 170, 5)]
R1, R2 = 1.003, 1.0065


def geometry(thetas, mid):
    c = geo.CAM / np.linalg.norm(geo.CAM)
    up = np.array([0, 1.0, 0]) - c[1] * c
    up /= np.linalg.norm(up)
    right = np.cross(up, c)
    dist = np.linalg.norm(geo.CAM)
    at = np.zeros((len(thetas), len(mid), 3))
    for i, t in enumerate(np.radians(thetas)):
        f = np.cos(t) * right + np.sin(t) * up
        for j, rt in enumerate(mid):
            sa = min(rt / dist, 1)
            at[i, j] = np.sqrt(1 - sa * sa) * f + sa * c
    return at


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def unpack(p):
    layers = []
    k = 0
    for _ in range(3):
        layers.append(dict(H=p[k], depth=p[k + 1] / (2 * np.sqrt(1.5707963 / p[k])), day=p[k + 2:k + 5], frm=p[k + 5], to=p[k + 6], aim=np.array([p[k + 7], p[k + 8], 0.0])))
        k += 9
    line = dict(density=p[k], day=p[k + 1:k + 4], frm=p[k + 4], to=p[k + 5], night=p[k + 6:k + 9], aim=np.array([p[k + 9], p[k + 10], 0.0]))
    return layers, line


def model(p, at, mid):
    layers, line = unpack(p)
    out = np.zeros(at.shape)
    x = np.maximum(mid - 1, 0)
    for l in layers:
        sun = geo.SUN + l['aim']
        sun = sun / np.linalg.norm(sun)
        s = smooth(l['frm'], l['to'], at @ sun)
        tau = l['depth'] * 2 * np.sqrt(1.5707963 / l['H']) * np.exp(-x / l['H'])
        out += (s * s * (1 - np.exp(-tau))[None, :])[..., None] * l['day'][None, None, :]
    sun = geo.SUN + line['aim']
    sun = sun / np.linalg.norm(sun)
    s = smooth(line['frm'], line['to'], at @ sun)
    path = 2 * (np.sqrt(np.maximum(R2 * R2 - mid * mid, 0)) - np.sqrt(np.maximum(R1 * R1 - mid * mid, 0)))
    w = 1 - np.exp(-line['density'] * path)
    out += w[None, :, None] * ((s * s)[..., None] * line['day'][None, None, :] + line['night'][None, None, :])
    return out


def main():
    tab = profiles.table(profiles.HERO, THETAS, 4.0)
    mid = 0.5 * (profiles.EDGES[:-1] + profiles.EDGES[1:])
    hero = np.stack([tab[t] for t in THETAS])
    far = (mid > 1.12)
    bg = np.nanmedian(hero[:, far], axis=1)
    target = hero - bg[:, None, :]
    use = (mid > 1.0015) & (mid < 1.1)
    at = geometry(THETAS, mid)
    near = np.where(mid[use] < 1.012, 2.0, 1.0)
    ok = ~np.isnan(target[:, use]).any(axis=2)
    p0 = np.array([
        0.006, 0.6, 0.7, 1.7, 4.6, 0.3, 1.1, 0, 0,
        0.028, 0.5, 0.5, 0.93, 1.7, 0.45, 1.05, 0, 0,
        0.012, 0.4, 0.05, 0.15, 0.4, -0.5, 0.9, 0, 0,
        3.0, 0.1, 0.4, 0.9, -0.3, 0.8, 0.0005, 0.002, 0.006, 0, 0,
    ])
    lo = np.array([
        0.003, 0.05, 0, 0, 0, -0.2, 0.9, -0.5, -0.5,
        0.015, 0.05, 0, 0, 0, -0.2, 0.9, -0.5, -0.5,
        0.004, 0.05, 0, 0, 0, -0.6, 0.6, -0.5, -0.5,
        0.2, 0, 0, 0, -1, 0.2, 0, 0, 0, -0.6, -0.6,
    ])
    hi = np.array([
        0.009, 0.8, 8, 12, 16, 0.8, 1.3, 0.5, 0.5,
        0.06, 0.8, 6, 8, 10, 0.8, 1.3, 0.5, 0.5,
        0.03, 0.8, 3, 3, 4, 0.2, 1.3, 0.5, 0.5,
        20, 3, 3, 4, 0.5, 1.6, 0.02, 0.03, 0.05, 0.6, 0.6,
    ])

    def resid(p):
        m = model(p, at, mid)[:, use]
        t = target[:, use]
        r = (m - t) / (np.abs(t) + 0.015)
        r = np.where(ok[..., None], r, 0) * near[None, :, None]
        return r.ravel()

    s = least_squares(resid, p0, bounds=(lo, hi), loss='soft_l1', f_scale=0.5, max_nfev=400)
    layers, line = unpack(s.x)
    print('cost', s.cost, 'rms', np.sqrt((resid(s.x) ** 2).mean()))
    names = ['thin', 'wide', 'broad']
    out = {'layers': [], 'line': None}
    for n, l in zip(names, layers):
        print(n, 'H %.4f depth %.4f day %s from %.3f to %.3f aim %s' % (l['H'], l['depth'], np.round(l['day'], 3).tolist(), l['frm'], l['to'], np.round(l['aim'], 3).tolist()))
        out['layers'].append({'scaleHeight': round(float(l['H']), 5), 'depth': round(float(l['depth']), 5), 'day': np.round(l['day'], 4).tolist(), 'dayFrom': round(float(l['frm']), 4), 'dayTo': round(float(l['to']), 4), 'aim': np.round(l['aim'], 4).tolist()})
    print('line density %.3f day %s from %.3f to %.3f night %s aim %s' % (line['density'], np.round(line['day'], 3).tolist(), line['frm'], line['to'], np.round(line['night'], 4).tolist(), np.round(line['aim'], 3).tolist()))
    out['line'] = {'inner': R1, 'outer': R2, 'density': round(float(line['density']), 4), 'day': np.round(line['day'], 4).tolist(), 'night': np.round(line['night'], 5).tolist(), 'dayFrom': round(float(line['frm']), 4), 'dayTo': round(float(line['to']), 4), 'aim': np.round(line['aim'], 4).tolist()}
    json.dump(out, open('out/work/nep/air-fit.json', 'w'), indent=1)
    np.save('out/work/nep/air-bg.npy', bg)
    m = model(s.x, at, mid)
    sel = [i for i, v in enumerate(mid) if v > 1.0015 and v < 1.1][::3]
    print('rt', ' '.join('%6.3f' % mid[j] for j in sel))
    for i, t in enumerate(THETAS):
        if t % 15:
            continue
        print('theta %4g hero B' % t, ' '.join('%6.3f' % target[i, j, 2] for j in sel))
        print('          model B', ' '.join('%6.3f' % m[i, j, 2] for j in sel))
        print('           hero R', ' '.join('%6.3f' % target[i, j, 0] for j in sel))
        print('          model R', ' '.join('%6.3f' % m[i, j, 0] for j in sel))


main()
