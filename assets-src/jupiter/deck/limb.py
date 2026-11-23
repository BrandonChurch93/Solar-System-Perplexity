import json
import os
import sys

import cv2
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT, inverse_filmic, srgb_to_linear

STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
CFG = json.load(open(os.path.join(STOP, 'deck.json')))


def scene(path, size):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if (img.shape[1], img.shape[0]) != size:
        img = cv2.resize(img, size, interpolation=cv2.INTER_AREA)
    return inverse_filmic(srgb_to_linear(img[..., ::-1].astype(np.float64) / 255))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def sky_coords(w, h):
    k = geom.W / w
    ys, xs = np.mgrid[0:h, 0:w]
    d = geom.rays((xs + 0.5) * k - 0.5, (ys + 0.5) * k - 0.5)
    centre = geom.CENTRE
    b = -(d @ centre)
    high = centre @ centre - geom.R ** 2
    line = np.sqrt(np.maximum(high + geom.R ** 2 - b * b, 0)) - geom.R
    cam = high / (np.sqrt(geom.R ** 2 + high) + geom.R)
    rise = np.where(b < 0, line, cam + b * b / (2 * geom.R))
    sky = (b * b - high < 0) | (b > 0)
    up = -geom.NADIR
    flat = d - (d @ up)[..., None] * up
    flat /= np.linalg.norm(flat, axis=-1, keepdims=True)
    gx, gy = geom.to_chart(flat * np.sqrt(high))
    az = np.radians(CFG['light']['azimuthDeg'])
    return sky, rise, gx * np.cos(az) + gy * np.sin(az)


def build(off_path):
    c = CFG['limb']
    w, h = c['fitSize']
    appr = scene(os.path.join(ROOT, 'references', 'approved', 'jupiter-close.jpg'), (w, h))
    off = scene(off_path, (w, h))
    sky, rise, u = sky_coords(w, h)
    cover = 1 - smooth(c['cover'][0], c['cover'][1], rise)
    need = appr - (1 - cover[..., None]) * off
    first, step, count = c['knots']
    top, rows = c['top'], c['rows']
    ui = np.round((u - first) / step).astype(int)
    vi = np.round(np.sqrt(np.clip(rise / top, 0, 1)) * (rows - 1)).astype(int)
    table = np.full((rows, count, 3), np.nan)
    for a in range(count):
        for j in range(rows):
            sel = sky & (ui == a) & (vi == j) & (rise < top)
            if sel.sum() >= c['minPixels']:
                table[j, a] = np.percentile(need[sel], c['percentile'], axis=0)
    have = ~np.isnan(table[..., 0])
    for j in range(rows):
        idx = np.nonzero(have[j])[0]
        if len(idx) == 0:
            continue
        lo, hi = idx[0], idx[-1]
        for a in range(count):
            if a < lo:
                table[j, a] = table[j, lo] * max(1 - (lo - a) / c['darkKnots'], 0)
            elif a > hi:
                table[j, a] = table[j, hi]
            elif not have[j, a]:
                near = idx[np.argmin(np.abs(idx - a))]
                table[j, a] = table[j, near]
    full = [j for j in range(rows) if not np.isnan(table[j, 0, 0])]
    for j in range(rows):
        if np.isnan(table[j, 0, 0]):
            table[j] = table[min(full, key=lambda q: abs(q - j))]
    table = np.maximum(table, 0)
    table = ndi.gaussian_filter(table, (c['smoothRows'], c['smoothKnots'], 0), mode='nearest')
    fade = 1 - smooth(c['fadeFrom'], 1.0, np.sqrt(np.arange(rows) / (rows - 1)) ** 2)
    table *= fade[:, None, None]
    np.set_printoptions(precision=3, suppress=True, linewidth=220)
    print('blue channel, rows are tangent heights', np.round(top * (np.arange(rows) / (rows - 1)) ** 2, 3)[::3])
    print(table[::3, :, 2])
    pos_u = np.clip((u - first) / step, 0, count - 1)
    pos_v = np.sqrt(np.clip(rise / top, 0, 1)) * (rows - 1)
    model = np.stack([ndi.map_coordinates(table[..., ch], [pos_v, pos_u], order=1, mode='nearest') for ch in range(3)], -1)
    model = np.where((rise < top)[..., None], model, 0)
    res = (model - need)[sky & (rise < top)]
    print('residual of the table in the sky under the top: mean', res.mean(0).round(4), 'rms', np.sqrt((res ** 2).mean(0)).round(4))
    f_all = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    f_all['limb'] = {
        'knots': [first, step, count],
        'rows': rows,
        'top': top,
        'cover': c['cover'],
        'table': [[[round(float(x), 5) for x in cell] for cell in row] for row in table],
    }
    json.dump(f_all, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)


def clear():
    c = CFG['limb']
    f_all = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    f_all['limb'] = {'knots': c['knots'], 'rows': c['rows'], 'top': c['top'], 'cover': [-2, -1], 'table': [[[0, 0, 0]] * c['knots'][2]] * c['rows']}
    json.dump(f_all, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)


if __name__ == '__main__':
    if sys.argv[1] == 'clear':
        clear()
    else:
        build(sys.argv[1])
