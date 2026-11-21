import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/rings/'
STEPS = 1440
OFFS = np.arange(-7, 7.01, 0.5)
LUMA = np.array([0.2126, 0.7152, 0.0722])


def basis(n):
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return e1, np.cross(n, e1)


def fill(a, known):
    idx = np.flatnonzero(known)
    if len(idx) == 0:
        return np.zeros_like(a)
    x = np.arange(len(a))
    ext = np.concatenate([idx - len(a), idx, idx + len(a)])
    val = np.concatenate([a[idx]] * 3)
    return np.interp(x, ext, val)


def main():
    fit = json.load(open(OUT + 'rings-fit.json'))
    meta = json.load(open('out/work/u/wrap/curve.json'))
    sun = np.array(meta['sun'])
    im = np.asarray(Image.open('references/approved/uranus-hero.png').convert('RGB')).astype(np.float32) / 255
    lin = geo.scene(im).astype(np.float32)
    th = (np.arange(STEPS) + 0.5) / STEPS * 2 * np.pi
    rows = []
    out = []
    colors = []
    for i, r in enumerate(fit):
        n = np.array(r['normal'])
        u1, u2 = basis(n)
        dirs = np.cos(th)[:, None] * u1 + np.sin(th)[:, None] * u2
        p = r['radius'] * dirs
        x0, y0 = geo.project(p)
        x1, y1 = geo.project(p * (1 + 0.002))
        nx, ny = x1 - x0, y1 - y0
        ln = np.hypot(nx, ny)
        nx, ny = nx / ln, ny / ln
        mx = (x0[:, None] + nx[:, None] * OFFS[None]).astype(np.float32)
        my = (y0[:, None] + ny[:, None] * OFFS[None]).astype(np.float32)
        strip = cv2.remap(lin, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        lum = strip @ LUMA.astype(np.float32)
        med = ndi.median_filter(lum, size=(21, 1), mode='wrap')
        c = len(OFFS) // 2
        peak = med[:, c - 3:c + 4].max(1)
        side = np.concatenate([med[:, :7], med[:, -7:]], 1)
        bg = np.median(side, 1)
        amp = np.maximum(peak - bg, 0)
        to = p - geo.CAM
        dist = np.linalg.norm(to, axis=1)
        dd = to / dist[:, None]
        b = -(dd @ geo.CAM)
        closest = np.sqrt(np.maximum(geo.CAM @ geo.CAM - b * b, 0))
        hidden = (closest < 1.0) & (dist > b)
        glare = (closest < 1.05) | (bg > 0.25)
        inside = (x0 > 8) & (x0 < geo.W - 8) & (y0 > 8) & (y0 < geo.H - 8)
        ps = p @ sun
        perp = np.linalg.norm(p - ps[:, None] * sun, axis=1)
        shadow = (ps < 0) & (perp < 1.03)
        known = inside & ~hidden & ~glare & ~shadow
        a = ndi.gaussian_filter1d(fill(amp, known), 10, mode='wrap')
        base = float(np.median(amp[known])) if known.sum() > 20 else 0.0
        seen = float(known.mean())
        cm = known & (amp > np.percentile(amp[known], 60)) if known.sum() > 20 else known
        if cm.sum() > 5:
            sc = ndi.median_filter(strip, size=(21, 1, 1), mode='wrap')
            pk = sc[:, c - 1:c + 2].mean(1)
            bgc = np.median(np.concatenate([sc[:, :7], sc[:, -7:]], 1), 1)
            colors.append(np.median((pk - bgc)[cm], 0))
        out.append({'normal': [round(float(v), 5) for v in n], 'radius': round(r['radius'], 5), 'amp': [round(float(v), 5) for v in a[::4]], 'seen': round(seen, 3), 'base': round(base, 5)})
        print(i, 'r', round(r['radius'], 4), 'seen', round(seen, 2), 'median amp', round(base, 4), 'max', round(float(a.max()), 4))
        show = np.clip((med - bg[:, None]) * 12, 0, 1)
        show[~known] *= 0.35
        rows.append(cv2.resize(show.T, (1440, 58), interpolation=cv2.INTER_LINEAR))
        rows.append(np.ones((4, 1440), np.float32) * 0.5)
    col = np.median(np.array(colors), 0)
    col = col / (col @ LUMA)
    print('line colour', col.round(3))
    json.dump({'color': [round(float(v), 4) for v in col], 'rings': out}, open(OUT + 'rings-measured.json', 'w'))
    Image.fromarray((np.concatenate(rows, 0) * 255).astype(np.uint8)).save(OUT + 'strips.png')


main()
