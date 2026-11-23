import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'plates'))
import geom
from layback import ROOT, grid
import prep

WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'deck')
GEN = prep.GEN
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUBLIC = os.path.join(ROOT, 'public', 'assets', 'jupiter')
CFG = json.load(open(os.path.join(STOP, 'deck.json')))
PL = CFG['plates']
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
ORDER = ['fore', 'near', 'mid', 'far']


def blur(x, sigma):
    return cv2.GaussianBlur(x, (0, 0), max(sigma, 0.3))


def rough_of(coded, step):
    t = CFG['tool']
    y = (coded.astype(np.float32) / 255) @ LUMA
    a, b = t['roughBand']
    band = blur(y, max(a / step, 0.6)) - blur(y, max(b / step, 1.4))
    e = np.sqrt(blur(band * band, max(t['roughSpread'] / step, 2.0)))
    return np.clip(e / t['roughLevel'], 0, 1)


def plate(name):
    far = prep.grade()
    if name == 'far':
        scene = prep.globe_albedo(PL['far'])
    else:
        scene = np.load(os.path.join(GEN, name + '-nest.npy'))
    return prep.display(np.maximum(scene, 0) * far)


def heights(name):
    t = CFG['tool']
    m = CFG['maps'][name]
    size, n = m['size'], m['pixels']
    step = size / n
    ih = np.load(os.path.join(WORK, name + '-h.npy'))
    trust = blur(np.load(os.path.join(WORK, name + '-trust.npy')), t['trustFeather'] / step)
    out = np.zeros((n, n), np.float32)
    gx, gy = grid(m['centre'][0], m['centre'][1], size, n)
    if name == 'near':
        d = np.fromfile(os.path.join(GEN, 'near-depth.raw'), dtype='<f4').reshape(n, n)[::-1].astype(np.float32)
        out = t['plateRelief'] * (d - blur(d, t['plateReliefScale'] / step))
    x0, y0 = geom.to_chart(np.zeros(3))
    away = np.hypot(gx - x0, gy - y0)
    calm = 1 - np.clip((away - t['reliefFade'][0]) / (t['reliefFade'][1] - t['reliefFade'][0]), 0, 1)
    if name == 'fore':
        wide = CFG['maps']['near']
        under = heights('near')
        u = ((gx - wide['centre'][0]) / wide['size'] + 0.5) * wide['pixels'] - 0.5
        v = ((gy - wide['centre'][1]) / wide['size'] + 0.5) * wide['pixels'] - 0.5
        under = cv2.remap(under, u.astype(np.float32), v.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return (ih * trust * calm + under * (1 - trust)).astype(np.float32)
    h = ih * trust + out * (1 - trust)
    edge = np.maximum(np.abs(gx - m['centre'][0]), np.abs(gy - m['centre'][1])) / (size / 2)
    rim = 1 - np.clip((edge - CFG['look']['blend'][0]) / (CFG['look']['blend'][1] - CFG['look']['blend'][0]), 0, 1) if name == 'mid' else 1.0
    return (h * calm * rim).astype(np.float32)


def limit_slope(h, step, most):
    n = h.shape[1]
    c = np.float32(most * step)
    d = np.float32(most * step * np.sqrt(2))
    ramp = (np.arange(n) * c).astype(np.float32)

    def along(v):
        f = np.maximum.accumulate(v + ramp) - ramp
        b = np.maximum.accumulate((v - ramp)[::-1])[::-1] + ramp
        return np.maximum(f, b)

    out = h.astype(np.float32).copy()
    for rows, back in ((range(0, n), -1), (range(n - 1, -1, -1), 1)):
        for i in rows:
            v = out[i]
            if 0 <= i + back < n:
                u = out[i + back]
                side = np.maximum(np.concatenate([u[1:], u[-1:]]), np.concatenate([u[:1], u[:-1]]))
                v = np.maximum(v, np.maximum(u - c, side - d))
            out[i] = along(v)
    return out


def write_plate(name, coded, rough):
    px = np.concatenate([coded, np.round(rough * 255).astype(np.uint8)[..., None]], -1)
    for kind, shrink in (('full', 1), ('web', 2)):
        out = os.path.join(PUBLIC, kind)
        os.makedirs(out, exist_ok=True)
        o = px if shrink == 1 else cv2.resize(px, (px.shape[1] // shrink, px.shape[0] // shrink), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(out, 'plate-' + name + '.png'), np.ascontiguousarray(o[::-1, :, [2, 1, 0, 3]]))
    cv2.imwrite(os.path.join(WORK, 'plate-' + name + '-rough.png'), np.round(rough[::-1] * 255).astype(np.uint8))


def write_height(name, h):
    n = CFG['maps'][name]['pixels']
    lo, hi = CFG['tool']['heightRange']
    for kind, shrink in (('full', 1), ('web', 2)):
        out = os.path.join(PUBLIC, kind)
        k = n // shrink
        hh = cv2.resize(h, (k, k), interpolation=cv2.INTER_AREA) if shrink > 1 else h
        q = np.round(np.clip((hh - lo) / (hi - lo), 0, 1) * 65535).astype('<u2')
        q.tofile(os.path.join(out, 'deck-' + name + '-height.bin'))
    cv2.imwrite(os.path.join(WORK, name + '-height.png'), np.round(np.clip((h - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)[::-1])


if __name__ == '__main__':
    fields = {
        'note': 'Written by assets-src/jupiter/deck/bake.py. Do not edit by hand.',
        'chart': {'origin': [float(v) for v in geom.S], 'ex': [float(v) for v in geom.EX], 'ey': [float(v) for v in geom.EY], 'en': [float(v) for v in geom.EN], 'radius': float(geom.R)},
        'heightRange': CFG['tool']['heightRange'],
        'grade': [float(v) for v in prep.grade()],
        'maps': {},
        'plates': {},
    }
    for name in ORDER:
        m = PL[name]
        coded = plate(name)
        step = m['size'][0] / m['pixels'][0]
        rough = rough_of(coded, step)
        write_plate(name, coded, rough)
        fields['plates'][name] = {'centre': m['centre'], 'size': m['size'], 'pixels': {'full': m['pixels'], 'web': [m['pixels'][0] // 2, m['pixels'][1] // 2]}}
        print('plate', name, coded.shape, 'roughness pcts', np.round(np.percentile(rough, [5, 50, 95]), 3))
    for name in CFG['maps']:
        m = CFG['maps'][name]
        raw = heights(name)
        h = limit_slope(raw, m['size'] / m['pixels'], CFG['tool']['slopeMax'])
        print('slope limit', name, 'raised share', round(float((h > raw + 1e-4).mean()), 4), 'most', round(float((h - raw).max()), 3))
        write_height(name, h)
        fields['maps'][name] = {'centre': m['centre'], 'size': m['size'], 'pixels': {'full': m['pixels'], 'web': m['pixels'] // 2}}
        print('height', name, 'pcts', np.round(np.percentile(h, [0.1, 1, 50, 99, 99.9]), 3))
    path = os.path.join(STOP, 'deck-fields.json')
    if os.path.exists(path):
        old = json.load(open(path))
        for key in ('view', 'limb', 'air', 'image'):
            if key in old:
                fields[key] = old[key]
    json.dump(fields, open(path, 'w'), indent=1)
