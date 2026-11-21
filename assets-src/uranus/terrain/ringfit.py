import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/terrain')
import geo
import tgeo as T

RHO = 60.0
OUTER = np.array([(100, 247), (200, 150), (330, 85), (450, 52), (560, 42), (700, 52), (850, 90), (1000, 160), (1100, 235), (1200, 340), (1280, 450), (1340, 568)], float) * 2
INNER = np.array([(222, 262), (300, 200), (400, 152), (520, 128), (640, 128), (780, 150), (900, 195), (1000, 250), (1100, 330), (1180, 420), (1236, 520)], float) * 2


def dirs(px):
    d = np.stack([(px[:, 0] - T.W / 2) / T.F, (T.H / 2 - px[:, 1]) / T.F, -np.ones(len(px))], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def unit(a, b):
    return np.array([np.cos(b) * np.sin(a), np.sin(b), -np.cos(b) * np.cos(a)])


def resid(x, d, radius):
    c = unit(x[0], x[1]) * RHO
    n = unit(x[2], x[3])
    t = (c @ n) / (d @ n)
    p = d * t[:, None]
    return (np.linalg.norm(p - c, axis=-1) - radius) / np.abs(t) * T.F + np.where(t < 1, 500.0, 0.0)


def project(c, n, radius, k=720):
    e1 = np.cross(n, [0.0, 0.0, 1.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(n, e1)
    th = np.linspace(0, 2 * np.pi, k, endpoint=False)
    p = c + radius * (np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2)
    x, y, ok = T.project(p)
    return x, y, ok, p


def refine(lum, x, y, ok, reach=14):
    pts = []
    for i in range(0, len(x), 4):
        if not ok[i]:
            continue
        j = (i + 4) % len(x)
        tx, ty = x[j] - x[i], y[j] - y[i]
        l = np.hypot(tx, ty)
        if l < 1e-6 or not (4 < x[i] < T.W - 4 and 4 < y[i] < T.H - 4):
            continue
        nx, ny = -ty / l, tx / l
        s = np.arange(-reach, reach + 0.01, 0.5)
        v = cv2.remap(lum, (x[i] + nx * s).astype(np.float32)[None], (y[i] + ny * s).astype(np.float32)[None], cv2.INTER_LINEAR)[0]
        k = int(np.argmax(v))
        if 0 < k < len(s) - 1 and v[k] > np.median(v) * 1.5 + 0.002:
            pts.append((x[i] + nx * s[k], y[i] + ny * s[k]))
    return np.array(pts)


def main():
    im = np.asarray(Image.open('references/approved/uranus-close.jpg').convert('RGB')).astype(np.float32) / 255
    lin = geo.scene(im).mean(-1).astype(np.float32)
    lum = ndi.gaussian_filter(lin, 1.2)
    _, _, _, hit = T.ground(T.rays())
    sky = ndi.binary_erosion(~hit, iterations=10)
    lum = np.where(sky, lum, 0)
    d = dirs(OUTER)
    best = None
    for a in np.radians(np.arange(-150, 151, 30)):
        for b in np.radians(np.arange(-60, 61, 30)):
            for r0 in (15.0, 30.0, 60.0):
                def f(x):
                    return resid(x[:4], d, x[4])
                s = least_squares(f, [0.0, 0.3, a, b, r0], x_scale=[0.05, 0.05, 0.05, 0.05, 2.0])
                key = np.sqrt(np.mean(s.fun ** 2))
                if best is None or key < best[0] - 1e-6:
                    best = (key, s.x.copy())
                if abs(key - 0) < 12:
                    print('start', np.degrees(a).round(), np.degrees(b).round(), r0, 'rms px', key.round(2), 'normal', unit(s.x[2], s.x[3]).round(3).tolist(), 'radius', s.x[4].round(2), 'centre dir', unit(s.x[0], s.x[1]).round(3).tolist())
    x = best[1]
    for it in range(3):
        c = unit(x[0], x[1]) * RHO
        n = unit(x[2], x[3])
        px, py, ok, _ = project(c, n, x[4])
        pts = refine(lum, px, py, ok, reach=14 if it == 0 else 6)
        d = dirs(pts)
        s = least_squares(lambda q: resid(q[:4], d, q[4]), x, x_scale=[0.05, 0.05, 0.05, 0.05, 2.0], loss='soft_l1', f_scale=1.5)
        x = s.x
        print('refine', it, len(pts), 'rms px', np.sqrt(np.mean(s.fun ** 2)).round(2), 'median abs', np.median(np.abs(s.fun)).round(2))
    c = unit(x[0], x[1]) * RHO
    n = unit(x[2], x[3])
    print('centre', c.round(4).tolist(), 'normal', n.round(5).tolist(), 'radius', x[4])
    json.dump({'centre': c.tolist(), 'normal': n.tolist(), 'radius': float(x[4]), 'rho': RHO}, open('assets-src/uranus/terrain/ringfit.json', 'w'), indent=1)

    e1 = np.cross(n, [0.0, 0.0, 1.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(n, e1)
    nt, nr = 4096, 700
    r0, r1 = 0.78, 1.04
    th = (np.arange(nt) + 0.5) / nt * 2 * np.pi
    rr = r0 + (np.arange(nr) + 0.5) / nr * (r1 - r0)
    p = c + x[4] * rr[:, None, None] * (np.cos(th)[None, :, None] * e1 + np.sin(th)[None, :, None] * e2)
    ux, uy, ok = T.project(p)
    full = geo.scene(im).astype(np.float32)
    un = cv2.remap(full, (ux - 0.5).astype(np.float32), (uy - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    inside = ok & (ux > 2) & (ux < T.W - 2) & (uy > 2) & (uy < T.H - 2)
    skyu = cv2.remap(sky.astype(np.float32), (ux - 0.5).astype(np.float32), (uy - 0.5).astype(np.float32), cv2.INTER_LINEAR) > 0.99
    valid = inside & skyu
    cols = np.where(valid.mean(0) > 0.5)[0]
    print('theta columns valid', cols.min(), cols.max(), 'of', nt)
    np.savez('out/work/u/t/ring-unwrap.npz', un=un, valid=valid, r0=r0, r1=r1)
    view = un[:, cols.min():cols.max() + 1]
    Image.fromarray((np.clip(geo.to_srgb(geo.film(view * 2.0)), 0, 1) * 255).astype(np.uint8)[::-1]).resize((1600, 700), Image.LANCZOS).save('out/work/u/t/ring-unwrap.jpg', quality=90)


main()
