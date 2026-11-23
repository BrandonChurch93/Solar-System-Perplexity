import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import canvas_display, core_display
from view import CFG, PUBLIC, STOP, WORK, Surface


def fit_range(surface, shrink):
    c = CFG['image']
    slack, least, close, steps = c['march']
    w, h = geom.W // shrink, geom.H // shrink
    xs = (np.arange(w) + 0.5) * shrink - 0.5
    ys = (np.arange(h) + 0.5) * shrink - 0.5
    X, Y = np.meshgrid(xs, ys)
    d = geom.rays(X, Y).reshape(-1, 3)
    pix = shrink / geom.F
    top = CFG['look']['shell'][1]
    b = d @ -geom.CENTRE
    disc = b * b - (geom.CENTRE @ geom.CENTRE - (geom.R + top) ** 2)
    enters = disc > 0
    t = np.where(enters, -b - np.sqrt(np.maximum(disc, 0)), np.inf)
    smooth = geom.hit(d)
    out = smooth.copy()
    x0, y0 = geom.to_chart(np.zeros(3))
    live = enters & (t > 0)
    for i in range(int(steps)):
        idx = np.nonzero(live)[0]
        if len(idx) == 0:
            break
        ti = t[idx]
        p = d[idx] * ti[:, None]
        rel = p - geom.CENTRE
        rad = np.linalg.norm(rel, axis=-1)
        q = p - geom.S
        gx, gy = q @ geom.EX, q @ geom.EY
        gap = rad - geom.R - surface.flat(gx.astype(np.float32), gy.astype(np.float32))
        fall = np.maximum(-np.einsum('ij,ij->i', d[idx], rel) / rad, 0)
        hit = gap < close * ti * pix
        away = np.hypot(gx - x0, gy - y0) > c['reach']
        out[idx[hit]] = ti[hit]
        t[idx] = ti + np.maximum(gap / (fall + slack), least * ti * pix)
        live[idx] = ~hit & ~away
        if i % 50 == 0:
            print('  step', i, 'rays left', int(live.sum()), flush=True)
    print('shrink', shrink, 'rays not finished', int(live.sum()), 'hit share', round(float(np.isfinite(out).mean()), 3))
    return out.reshape(h, w)


def code(rng):
    lo, hi = CFG['image']['rangeLog2']
    v = np.round(np.clip((np.log2(np.maximum(rng, 1e-6)) - lo) / (hi - lo), 0, 1) * 65534)
    return np.where(np.isfinite(rng), v, 65535).astype('<u2')


def build():
    c = CFG['image']
    surface = Surface('full')
    fields = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    pixels = {}
    for kind in ('full', 'web'):
        shrink = c['rangeShrink'][kind]
        rng = fit_range(surface, shrink)
        np.save(os.path.join(WORK, 'image-range-' + kind + '.npy'), rng.astype(np.float32))
        code(rng)[::-1].tofile(os.path.join(PUBLIC, kind, 'deck-image-range.bin'))
        pixels[kind] = [rng.shape[1], rng.shape[0]]
    save = [cv2.IMWRITE_JPEG_QUALITY, c['quality'], cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
    for name, picture in (('wide', canvas_display()), ('core', core_display())):
        px = np.round(np.clip(picture[..., ::-1], 0, 1) * 255).astype(np.uint8)
        cv2.imwrite(os.path.join(PUBLIC, 'full', 'deck-image-' + name + '.jpg'), px, save)
        cv2.imwrite(os.path.join(PUBLIC, 'web', 'deck-image-' + name + '.jpg'), cv2.resize(px, (px.shape[1] // 2, px.shape[0] // 2), interpolation=cv2.INTER_AREA), save)
        print('picture', name, px.shape)
    core = CFG['tool']['canvas']['core']
    fields['image'] = {
        'size': [geom.W, geom.H],
        'window': [geom.W0, geom.H0],
        'feather': core['feather'],
        'range': {'pixels': pixels, 'shrink': c['rangeShrink'], 'log2': c['rangeLog2']},
    }
    json.dump(fields, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)


if __name__ == '__main__':
    build()
