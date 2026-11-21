import json
import os
import struct
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/rings2/'
LONG = 25.0
SHORT = 6.0
FLOOR = 0.3
HOT = 0.3


def basis(n):
    n = n / np.linalg.norm(n)
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return n, e1, np.cross(n, e1)


def tilt(n0, e1, e2, a, b):
    n = n0 + a * e1 + b * e2
    return n / np.linalg.norm(n)


def onplane(d, n):
    t = -(geo.CAM @ n) / (d @ n)
    return geo.CAM + d * t[:, None]


def polar(p, n):
    n, e1, e2 = basis(n)
    return np.arctan2(p @ e2, p @ e1), np.linalg.norm(p, axis=1)


def main():
    d = json.load(open(OUT + 'tracks.json'))
    T, R0, R1, NR = d['T'], d['R0'], d['R1'], d['NR']
    n0, e1, e2 = basis(np.array(d['normal']))
    items = []
    cal = json.load(open('assets-src/uranus/rings/gain.json')) if os.path.exists('assets-src/uranus/rings/gain.json') else None
    for t in d['tracks']:
        j = np.array(t['j'])
        r = R0 + (np.array(t['r']) + 0.5) / NR * (R1 - R0)
        a = np.array(t['a'])
        th = (j + 0.5) / T * 2 * np.pi
        span = (j[-1] - j[0]) / T * 360
        if span < SHORT:
            continue
        rs = ndi.gaussian_filter1d(r, 4)
        rough = float(np.sqrt(np.mean((r - rs) ** 2))) / ((R1 - R0) / NR)
        fillf = len(j) / (j[-1] - j[0] + 1)
        if rough > 0.75 or fillf < 0.85 or np.median(t['a']) < 0.003:
            continue
        p = rs[:, None] * (np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2)
        ray = p - geo.CAM
        ray /= np.linalg.norm(ray, axis=1, keepdims=True)
        a = ndi.gaussian_filter1d(a, 3)
        if cal:
            g = np.array(cal['gain'])
            ti = np.mod(th / (2 * np.pi) * cal['nt'] - 0.5, cal['nt'])
            ri = np.clip((rs - cal['r0']) / (cal['r1'] - cal['r0']) * cal['nr'] - 0.5, 0, cal['nr'] - 1)
            a = a * ndi.map_coordinates(np.concatenate([g, g[:1]], 0), [ti, ri], order=1, mode='nearest')
        a = np.where(a > HOT, HOT + (a - HOT) * 0.5, a)
        items.append({'span': span, 'ray': ray, 'a': a, 'p0': p})
    items.sort(key=lambda t: -t['span'])
    print(len(items), 'tracks kept', [round(t['span']) for t in items[:30]])
    longs = [t for t in items if t['span'] >= LONG]
    for t in longs:
        def res(x):
            n = tilt(n0, e1, e2, x[0], x[1])
            rr = np.linalg.norm(onplane(t['ray'], n), axis=1)
            return np.concatenate([(rr - rr.mean()) / 0.01, np.array(x) * np.sqrt(len(rr)) * 0.35])
        best = None
        for seed in [(0, 0), (0.2, 0), (-0.2, 0), (0, 0.2), (0, -0.2)]:
            s = least_squares(res, seed)
            if best is None or s.cost < best.cost:
                best = s
        t['n'] = tilt(n0, e1, e2, best.x[0], best.x[1])
        rr = np.linalg.norm(onplane(t['ray'], t['n']), axis=1)
        print('long', round(t['span']), 'n', t['n'].round(4), 'tilt deg', round(float(np.degrees(np.arccos(np.clip(t['n'] @ n0, -1, 1)))), 1), 'r', rr.mean().round(4), 'spread', (rr.max() - rr.min()).round(4), 'amp', np.median(t['a']).round(4))
    x0, y0 = [], []
    for t in longs:
        x, y = geo.project(t['p0'])
        t['xy'] = np.stack([x, y], 1)
    rings = []
    for t in items:
        if 'n' not in t:
            x, y = geo.project(t['p0'])
            mid = np.array([x[len(x) // 2], y[len(y) // 2]])
            dist = [np.min(np.linalg.norm(q['xy'] - mid, axis=1)) for q in longs]
            k = int(np.argmin(dist))
            if dist[k] > 70:
                continue
            t['n'] = longs[k]['n']
        th, rr = polar(onplane(t['ray'], t['n']), t['n'])
        th = np.unwrap(th)
        if th[-1] < th[0]:
            th, rr, aa = th[::-1], rr[::-1], t['a'][::-1]
        else:
            aa = t['a']
        closed = t['span'] >= LONG
        if closed:
            m = 720
            grid = th[0] + np.arange(m) / m * 2 * np.pi
            seen = grid <= th[-1]
            rmean = float(np.mean(rr))
            base = float(np.median(aa))
            rg = np.interp(grid, th, rr)
            ag = np.interp(grid, th, aa)
            gap = (grid - th[-1]) / (th[0] + 2 * np.pi - th[-1])
            w = np.where(seen, 1.0, np.clip(1 - np.minimum(gap, 1 - gap) * 2 * np.pi / np.radians(35) * (th[0] + 2 * np.pi - th[-1]) / (2 * np.pi), 0, 1))
            w = w * w * (3 - 2 * w)
            edge = np.where(gap < 0.5, rr[-1], rr[0])
            aedge = np.where(gap < 0.5, aa[-1], aa[0])
            rg = np.where(seen, rg, rmean + (edge - rmean) * w)
            ag = np.where(seen, np.maximum(ag, FLOOR * base), FLOOR * base + (np.maximum(aedge, FLOOR * base) - FLOOR * base) * w)
            rings.append({'n': t['n'], 'closed': 1, 'th0': float(th[0]), 'dth': 2 * np.pi / m, 'r': rg, 'a': ag})
        else:
            step = np.radians(0.25)
            m = max(int((th[-1] - th[0]) / step) + 1, 4)
            grid = th[0] + np.arange(m) * step
            rg = np.interp(grid, th, rr)
            ag = np.interp(grid, th, aa)
            ramp = np.clip(np.minimum(np.arange(m), m - 1 - np.arange(m)) / 8.0, 0, 1)
            rings.append({'n': t['n'], 'closed': 0, 'th0': float(th[0]), 'dth': step, 'r': rg, 'a': ag * ramp})
    buf = [struct.pack('<f', len(rings))]
    total = 0
    for r in rings:
        buf.append(struct.pack('<7f', *r['n'], r['closed'], r['th0'], r['dth'], len(r['r'])))
        buf.append(np.asarray(r['r'], '<f4').tobytes())
        buf.append(np.asarray(r['a'], '<f4').tobytes())
        total += len(r['r'])
    data = b''.join(buf)
    for s in ['full', 'web']:
        open(f'public/assets/uranus/{s}/rings.bin', 'wb').write(data)
    print(len(rings), 'rings', sum(r['closed'] for r in rings), 'closed', total, 'samples', len(data), 'bytes')
    json.dump({'color': d['color']}, open(OUT + 'rings-meta.json', 'w'))
    im = Image.open('references/approved/uranus-hero.png').convert('RGB')
    arr = np.asarray(im).astype(np.float32) / 255
    over = Image.fromarray((np.clip(arr * 2.2, 0, 1) * 255).astype(np.uint8))
    dr = ImageDraw.Draw(over)
    rng = np.random.RandomState(5)
    for r in rings:
        n, u1, u2 = basis(r['n'])
        th = r['th0'] + np.arange(len(r['r'])) * r['dth']
        p = r['r'][:, None] * (np.cos(th)[:, None] * u1 + np.sin(th)[:, None] * u2)
        x, y = geo.project(p)
        v = p - geo.CAM
        dist = np.linalg.norm(v, axis=1)
        dd = v / dist[:, None]
        b = -(dd @ geo.CAM)
        hid = (np.sqrt(np.maximum(geo.CAM @ geo.CAM - b * b, 0)) < 1) & (dist > b)
        c = tuple(int(v) for v in rng.randint(120, 255, 3))
        for i in range(len(x) - 1 + r['closed']):
            k = (i + 1) % len(x)
            if hid[i] or hid[k]:
                continue
            if r['a'][i] > 0.0015:
                dr.line([(x[i], y[i]), (x[k], y[k])], fill=c if r['closed'] else (255, 120, 60), width=1)
    half = Image.new('RGB', (2816, 1584 * 2))
    half.paste(Image.fromarray((np.clip(arr * 2.2, 0, 1) * 255).astype(np.uint8)), (0, 0))
    half.paste(over, (0, 1584))
    half.crop((300, 0, 2700, 3168)).resize((1200, 1584), Image.LANCZOS).save(OUT + 'overlay.jpg', quality=90)
    over.crop((500, 100, 1700, 1000)).save(OUT + 'overlay-ul.jpg', quality=90)


main()
