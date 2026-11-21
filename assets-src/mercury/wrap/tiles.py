import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

Image.MAX_IMAGE_PIXELS = None
N = 2048
WORK = 'out/work/mercury/tiles'
SIG = 6.0


def tile_list():
    t = {}
    for i in range(10):
        t[f'e{i}'] = (-180 + 36 * i + 18, 0, 50)
    for s, la in (('n', 40), ('s', -40)):
        for i in range(8):
            t[f'{s}{i}'] = (-180 + 45 * i + 22.5 * (s == 's'), la, 56)
        for i in range(5):
            t[f'{s}p{i}'] = (-180 + 72 * i + 36 * (s == 's'), la * 70 / 40, 60)
    t['np'] = (0, 90, 50)
    t['sp'] = (0, -90, 50)
    return t


def at(lon, lat):
    lo, la = np.radians(lon), np.radians(lat)
    return np.array([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)])


def basis(lon, lat):
    c = at(lon, lat)
    up = np.array([0.0, 1.0, 0.0]) if abs(lat) < 80 else at(lon, 0.0) * -np.sign(lat)
    r = np.cross(up, c)
    r /= np.linalg.norm(r)
    u = np.cross(c, r)
    return c, r, u


def face_dirs(b, fov, n):
    c, r, u = b
    t = np.tan(np.radians(fov) / 2)
    s = ((np.arange(n) + 0.5) / n * 2 - 1) * t
    x, y = np.meshgrid(s, -s)
    d = c[None, None] + x[..., None] * r + y[..., None] * u
    return (d / np.linalg.norm(d, axis=-1, keepdims=True)).astype(np.float32)


def rows_for(la, fov, h):
    a = 0.75 * fov
    lo, hi = max(-90, la - a), min(90, la + a)
    if abs(la) + a > 80:
        lo, hi = (lo, 90) if la > 0 else (-90, hi)
    return slice(max(0, int(np.floor((90 - hi) / 180 * h))), min(h, int(np.ceil((90 - lo) / 180 * h))))


def splat(face, b, fov, w, rows, inner):
    n = face.shape[0]
    d = geo.directions(w, w // 2, np.arange(rows.start, rows.stop))
    c, r, u = [v.astype(np.float32) for v in b]
    z = d @ c
    t = np.tan(np.radians(fov) / 2)
    zz = np.where(z > 0.05, z, 1)
    x = (d @ r) / zz / t
    y = (d @ u) / zz / t
    ok = (z > 0.05) & (np.abs(x) < 1) & (np.abs(y) < 1)
    fx = np.where(ok, (x + 1) / 2 * n - 0.5, 0).astype(np.float32)
    fy = np.where(ok, (1 - y) / 2 * n - 0.5, 0).astype(np.float32)
    val = cv2.remap(face, fx, fy, cv2.INTER_AREA if n > 1500 else cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    k = np.clip((1 - np.maximum(np.abs(x), np.abs(y))) / (1 - inner), 0, 1)
    return val, (k * k * (3 - 2 * k) * ok).astype(np.float32)


def cut(src):
    os.makedirs(WORK, exist_ok=True)
    m = np.asarray(Image.open(src).convert('RGB'))
    for k, (lo, la, fov) in tile_list().items():
        f = geo.sample_map(m, face_dirs(basis(lo, la), fov, N), cv2.INTER_CUBIC)
        Image.fromarray(f).save(f'{WORK}/in-{k}.jpg', quality=95, subsampling=0)
    json.dump(tile_list(), open(f'{WORK}/tiles.json', 'w'), indent=1)


def lock_low(t, ref):
    lt, lr = np.log(np.maximum(t, 4e-3)), np.log(np.maximum(ref, 4e-3))
    return np.exp(lt - geo.blur(lt, SIG * 4) + geo.blur(lr, SIG * 4)).astype(np.float32)


def build(src, out, takes_file=None):
    takes = json.load(open(takes_file)) if takes_file else {}
    m = np.asarray(Image.open(src).convert('RGB'))
    h, w = m.shape[:2]
    acc = np.zeros((h, w, 3), np.float32)
    wacc = np.zeros((h, w), np.float32)
    for k, (lo, la, fov) in tile_list().items():
        tk = takes.get(k, 't1')
        if tk == 'none':
            continue
        t = np.asarray(Image.open(f'{WORK}/{tk}-{k}.png').convert('RGB').resize((N, N), Image.LANCZOS))
        ref = np.asarray(Image.open(f'{WORK}/in-{k}.jpg').convert('RGB'))
        t = lock_low(geo.decoded(t), geo.decoded(ref))
        rows = rows_for(la, fov, h)
        val, wt = splat(t, basis(lo, la), fov, w, rows, 0.6)
        acc[rows] += val * wt[..., None]
        wacc[rows] += wt
    base = geo.decoded(m)
    e = 1e-3
    res = (acc + base * e) / (wacc + e)[..., None]
    print('min weight', float(wacc.min()), 'px with weight under 0.05', int((wacc < 0.05).sum()))
    Image.fromarray(geo.coded(res)).save(out)
    Image.fromarray(geo.coded(res)).resize((2048, 1024), Image.LANCZOS).save(out.replace('.png', '-small.jpg'), quality=90)


if __name__ == '__main__':
    if sys.argv[1] == 'cut':
        cut(sys.argv[2])
    else:
        build(*sys.argv[2:])
