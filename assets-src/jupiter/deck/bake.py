import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
import noise
import structure
from layback import ROOT, grid, linear_to_srgb

WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'deck')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUBLIC = os.path.join(ROOT, 'public', 'assets', 'jupiter')
CFG = json.load(open(os.path.join(STOP, 'deck.json')))
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def sunward(gx, gy):
    a = np.radians(CFG['light']['azimuthDeg'])
    return gx * np.cos(a) + gy * np.sin(a)


def fit_light():
    us, ys = [], []
    for name in ('near', 'mid'):
        m = CFG['maps'][name]
        rgb = np.load(os.path.join(WORK, name + '-rgb.npy'))
        trust = np.load(os.path.join(WORK, name + '-trust.npy'))
        gx, gy = grid(m['centre'][0], m['centre'][1], m['size'], m['pixels'])
        sel = trust > 0.5
        if name == 'mid':
            n = CFG['maps']['near']
            sel &= (np.abs(gx - n['centre'][0]) > n['size'] / 2) | (np.abs(gy - n['centre'][1]) > n['size'] / 2)
        us.append(sunward(gx, gy)[sel])
        ys.append(np.log(np.maximum(rgb[sel] @ LUMA, 1e-4)))
    u = np.concatenate(us)
    y = np.concatenate(ys)
    lo, hi = CFG['tool']['lightRange']
    knots = np.linspace(lo, hi, CFG['tool']['lightKnots'])
    half = (knots[1] - knots[0]) / 2
    med = np.array([np.median(y[np.abs(u - k) < half]) if (np.abs(u - k) < half).sum() > 200 else np.nan for k in knots])
    ok = np.isfinite(med)
    med = np.interp(knots, knots[ok], med[ok])
    med = np.convolve(np.pad(med, 2, mode='edge'), np.ones(5) / 5, mode='valid')
    return knots, np.exp(med)


def blur(x, sigma):
    return cv2.GaussianBlur(x, (0, 0), max(sigma, 0.3))


def compose(name, knots, light):
    m = CFG['maps'][name]
    t = CFG['tool']
    size, n = m['size'], m['pixels']
    step = size / n
    gx, gy = grid(m['centre'][0], m['centre'][1], size, n)
    gx = gx.astype(np.float32)
    gy = gy.astype(np.float32)
    psi = structure.stream(gx, gy, CFG['flow'])
    c2, s2 = structure.model_direction(psi)
    trust = np.zeros((n, n), np.float32)
    path = os.path.join(WORK, name + '-rgb.npy')
    has = os.path.exists(path)
    if has:
        img = np.load(path)
        ih = np.load(os.path.join(WORK, name + '-h.npy'))
        trust = blur(np.load(os.path.join(WORK, name + '-trust.npy')), t['trustFeather'] / step)
        ic2, is2, coh = structure.image_direction(img, trust, step, t['directionScale'])
        wi = np.clip(coh * t['directionGain'], 0, 1) * trust
        c2 = c2 * (1 - wi) + ic2 * wi
        s2 = s2 * (1 - wi) + is2 * wi
    dx, dy = structure.direction(c2, s2)
    st = structure.streaks(gx, gy, dx, dy, step, t['streakWaves'], t['streakStretch'], 301)
    cu = structure.cumulus(gx, gy, step, t['cumulusWave'], 5, 401)
    where = np.clip((noise.fbm(gx, gy, t['towerPatch'], 3, seed=41) - t['towerLevel']) * t['towerEdge'], 0, 1)
    swell = noise.fbm(gx, gy, 7.0, 3, seed=11) - 0.5
    base_h = t['swell'] * swell
    low = np.array(t['outsideLow'], np.float32)
    high = np.array(t['outsideHigh'], np.float32)
    base_rgb = np.broadcast_to(0.5 * (low + high) * (1 + 0.5 * swell[..., None]), (n, n, 3)).astype(np.float32)
    keep = np.zeros((n, n), np.float32)
    if has:
        e = np.interp(sunward(gx, gy), knots, light).astype(np.float32)
        alb = np.minimum(img * (t['albedoLevel'] / np.maximum(e, 1e-3))[..., None], t['albedoMax'])
        w = np.maximum(trust, 1e-3)
        coarse = blur(alb * w[..., None], t['coarseScale'] / step) / blur(w, t['coarseScale'] / step)[..., None]
        coarse_h = blur(ih * w, t['coarseScale'] / step) / blur(w, t['coarseScale'] / step)
        if t['mode'] == 'image':
            lum = np.maximum(alb @ LUMA, 1e-4)
            soft = np.maximum(blur(lum * w, t['lumaScale'] / step) / blur(w, t['lumaScale'] / step), 1e-4)
            alb = alb * ((soft / lum) ** (1 - t['bakedLight']))[..., None]
            keep = trust
            base_rgb = base_rgb + (alb - base_rgb) * trust[..., None]
            base_h = base_h + (ih - base_h) * trust
        else:
            rough = np.abs(ih - coarse_h)
            rough = blur(rough * w, 0.3 / step) / blur(w, 0.3 / step)
            where = where + (np.clip(rough / t['towerRough'], 0, 1) - where) * trust
            base_rgb = base_rgb + (coarse - base_rgb) * trust[..., None]
            base_h = base_h + (coarse_h - base_h) * trust
    x0, y0 = geom.to_chart(np.zeros(3))
    away = np.hypot(gx - x0, gy - y0)
    calm = 1 - np.clip((away - t['reliefFade'][0]) / (t['reliefFade'][1] - t['reliefFade'][0]), 0, 1)
    base_h = base_h * calm
    amount = (1 - keep * t['imageKeeps']) * calm
    h = base_h + amount * (t['streakHeight'] * st * (1 - where) + t['cumulusHeight'] * (cu - 0.45) * where)
    tone = 1 + amount * (t['streakTone'] * st * (1 - where) + t['cumulusTone'] * (cu - 0.45) * where)
    rgb = base_rgb * np.clip(tone, 0.2, 2.0)[..., None]
    return rgb.astype(np.float32), h.astype(np.float32), keep


def write(name, rgb, h, trust):
    m = CFG['maps'][name]
    n = m['pixels']
    lo, hi = CFG['tool']['heightRange']
    scale = CFG['tool']['albedoMax']
    for kind, shrink in (('full', 1), ('web', 2)):
        out = os.path.join(PUBLIC, kind)
        os.makedirs(out, exist_ok=True)
        k = n // shrink
        c = cv2.resize(rgb, (k, k), interpolation=cv2.INTER_AREA) if shrink > 1 else rgb
        hh = cv2.resize(h, (k, k), interpolation=cv2.INTER_AREA) if shrink > 1 else h
        tt = cv2.resize(trust, (k, k), interpolation=cv2.INTER_AREA) if shrink > 1 else trust
        px = np.concatenate([linear_to_srgb(c / scale), tt[..., None]], -1)
        px = np.round(np.clip(px, 0, 1) * 255).astype(np.uint8)
        cv2.imwrite(os.path.join(out, 'deck-' + name + '-color.png'), np.ascontiguousarray(px[::-1, :, [2, 1, 0, 3]]))
        q = np.round(np.clip((hh - lo) / (hi - lo), 0, 1) * 65535).astype('<u2')
        q.tofile(os.path.join(out, 'deck-' + name + '-height.bin'))
    cv2.imwrite(os.path.join(WORK, name + '-albedo.png'), np.round(np.clip(linear_to_srgb(rgb / scale), 0, 1) * 255).astype(np.uint8)[::-1, :, ::-1])
    cv2.imwrite(os.path.join(WORK, name + '-height.png'), np.round(np.clip((h - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)[::-1])


if __name__ == '__main__':
    knots, light = fit_light()
    fields = {
        'note': 'Written by assets-src/jupiter/deck/bake.py. Do not edit by hand.',
        'chart': {'origin': [float(v) for v in geom.S], 'ex': [float(v) for v in geom.EX], 'ey': [float(v) for v in geom.EY], 'en': [float(v) for v in geom.EN], 'radius': float(geom.R)},
        'heightRange': CFG['tool']['heightRange'],
        'albedoScale': CFG['tool']['albedoMax'],
        'light': {'knots': [float(k) for k in knots], 'level': [float(v) for v in light]},
        'maps': {},
    }
    for name in CFG['maps']:
        rgb, h, trust = compose(name, knots, light)
        write(name, rgb, h, trust)
        m = CFG['maps'][name]
        fields['maps'][name] = {'centre': m['centre'], 'size': m['size'], 'pixels': {'full': m['pixels'], 'web': m['pixels'] // 2}}
        print(name, 'albedo pcts', np.round(np.percentile(rgb @ LUMA, [1, 50, 99]), 3), 'height pcts', np.round(np.percentile(h, [0.1, 1, 50, 99, 99.9]), 3))
    json.dump(fields, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)
