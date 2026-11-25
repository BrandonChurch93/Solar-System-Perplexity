import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT, inverse_filmic, srgb_to_linear
from view import view_grid, psi_of

STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUBLIC = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'deck')
CFG = json.load(open(os.path.join(STOP, 'deck.json')))


def scene(path):
    px = cv2.imread(path, cv2.IMREAD_UNCHANGED)[::-1]
    rgb = px[..., [2, 1, 0]].astype(np.float64) / 255
    return inverse_filmic(srgb_to_linear(rgb)).astype(np.float32), px[..., 3]


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def plates_at(f, gx, gy):
    j0, j1 = CFG['look']['join']
    out = np.zeros(gx.shape + (3,), np.float32)
    left = np.ones(gx.shape, np.float32)
    for name in ('fore', 'near', 'mid', 'far'):
        m = f['plates'][name]
        img, _ = scene(os.path.join(PUBLIC, 'plate-' + name + '.png'))
        ny, nx = img.shape[:2]
        u = (gx - m['centre'][0]) / m['size'][0] + 0.5
        v = (gy - m['centre'][1]) / m['size'][1] + 0.5
        edge = np.maximum(np.abs(u - 0.5), np.abs(v - 0.5)) * 2
        w = left * (1 - step(j0, j1, edge)) if name != 'far' else left
        k = max(int(round((m['size'][0] / nx) ** -1 * 0.05)), 1)
        soft = cv2.blur(img, (k, k)) if k > 1 else img
        c = cv2.remap(soft, (u * nx - 0.5).astype(np.float32), (v * ny - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        out += c * w[..., None]
        left = left - w
    return out


def build():
    a = CFG['air']
    f = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    v = f['view']
    nt, npsi = v['pixels']['full']
    img, alpha = scene(os.path.join(PUBLIC, 'deck-view-color.png'))
    gx, gy = view_grid(nt, npsi, v['theta'], v['psi'])
    p = geom.from_chart(gx, gy, 0.0)
    d = p / np.linalg.norm(p, axis=-1, keepdims=True)
    up = (p - geom.CENTRE) / geom.R
    s = -np.einsum('...k,...k->...', d, up)
    dc = np.stack([d @ geom.EX, d @ geom.EY], -1)
    dc /= np.linalg.norm(dc, axis=-1, keepdims=True)
    az = np.radians(CFG['light']['azimuthDeg'])
    turn = np.arccos(np.clip(dc[..., 0] * np.cos(az) + dc[..., 1] * np.sin(az), -1, 1))
    plate = plates_at(f, gx, gy)
    ok = alpha > 8
    ns, nd = a['knots']
    s0, s1 = a['sinRange']
    si = np.clip(np.log(np.maximum(s, 1e-6) / s0) / np.log(s1 / s0), 0, 1) * (ns - 1)
    di = turn / np.pi * (nd - 1)
    sb = np.clip(np.round(si).astype(int), 0, ns - 1)
    db = np.clip(np.round(di).astype(int), 0, nd - 1)
    cell = (sb * nd + db)[ok]
    n = np.bincount(cell, minlength=ns * nd).reshape(ns, nd).astype(np.float64)
    mi = np.stack([np.bincount(cell, weights=img[..., c][ok], minlength=ns * nd).reshape(ns, nd) for c in range(3)], -1) / np.maximum(n, 1)[..., None]
    mp = np.stack([np.bincount(cell, weights=plate[..., c][ok], minlength=ns * nd).reshape(ns, nd) for c in range(3)], -1) / np.maximum(n, 1)[..., None]
    have = n >= a['minTexels']
    for arr in (mi, mp):
        for i in range(ns):
            cols = np.nonzero(have[i])[0]
            if len(cols) == 0:
                continue
            for c in range(3):
                arr[i, :, c] = np.interp(np.arange(nd), cols, arr[i, cols, c])
        rows = np.nonzero(have.any(1))[0]
        for i in range(ns):
            if not have[i].any():
                arr[i] = arr[rows[np.argmin(np.abs(rows - i))]]
    far = mi[0]
    num = ((mi - far[None]) * (mp - far[None])).sum(1)
    den = ((mp - far[None]) ** 2).sum(1)
    measured = np.clip(num / np.maximum(den, 1e-9), 0, 1)
    measured[0] = 0
    measured = np.maximum.accumulate(measured, axis=0)
    sines = np.exp(np.linspace(np.log(s0), np.log(s1), ns))
    lay = a['layer']
    thick = float(v['eye'][2])
    path = -geom.R * sines + np.sqrt((geom.R * sines) ** 2 + 2 * geom.R * thick + thick * thick)
    t = np.repeat(np.exp(-lay['per'] * path)[:, None], 3, 1)
    one = np.clip(np.log(sines / a['clear'][0]) / np.log(a['clear'][1] / a['clear'][0]), 0, 1)
    t = t * (1 - one[:, None]) + one[:, None]
    add = np.maximum(mi - t[:, None, :] * mp, 0) * (1 - one[:, None, None])
    add = cv2.GaussianBlur(add, (0, 0), a['smooth'], borderType=cv2.BORDER_REPLICATE)
    low = int(np.argmax(sines >= lay['flat']))
    add[:low] = add[low]
    t[:low] = t[low]
    print('layer: thickness', round(thick, 4), 'path through it at the knots', np.round(path, 2))
    print('share that comes through as measured on the approved view, green', np.round(measured[:, 1], 3))
    resid = np.abs(mi - (t[:, None, :] * mp + add))[have].mean(0)
    print('air table', ns, 'x', nd, 'cells with data', int(have.sum()), 'mean abs residual of the cell means', np.round(resid, 4))
    np.set_printoptions(linewidth=220, precision=3, suppress=True)
    print('sin of the grazing angle at the knots', np.exp(np.linspace(np.log(s0), np.log(s1), ns)))
    print('transmittance, green', t[:, 1])
    print('added light, green, toward the Sun', add[:, 0, 1])
    print('added light, green, away from the Sun', add[:, min(nd - 1, int(round(110 / 180 * (nd - 1)))), 1])
    f['air'] = {'sinRange': a['sinRange'], 'knots': a['knots'], 'through': [[round(float(x), 5) for x in row] for row in t], 'added': [[[round(float(x), 5) for x in cellv] for cellv in row] for row in add]}
    json.dump(f, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)


if __name__ == '__main__':
    build()
