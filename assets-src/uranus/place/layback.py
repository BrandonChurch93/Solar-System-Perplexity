import json
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

sys.path.insert(0, 'assets-src/uranus')
import geo  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
PUB = 'public/assets/uranus/full/'
WORK = 'out/work/u/place/'
DECK = json.load(open('src/stops/uranus/deck.json'))
NEAR = json.load(open('src/stops/uranus/deck-near.json'))
PLATES = json.load(open('assets-src/uranus/place/plates.json'))

C = np.array(DECK['centre'])
R = DECK['radius']
UP = np.array(DECK['up'])
F0 = np.array(DECK['f0'])
R0 = np.array(DECK['r0'])
WIN = DECK['window']
LIMB = (0.02, 0.06)
EDGE = 0.05
INSET = (0.1, 0.2)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def frame():
    g = PLATES['aheadUnits'] / R
    n = UP * np.cos(g) + F0 * np.sin(g)
    u = -UP * np.sin(g) + F0 * np.cos(g)
    e = np.cross(u, n)
    return n, e, u


class Source:
    def __init__(self):
        self.color = np.asarray(Image.open(PUB + 'deck-color.jpg').convert('RGB'))
        self.far = np.asarray(Image.open(PUB + 'deck-far.jpg').convert('RGB'))
        self.near = np.asarray(Image.open(PUB + 'deck-near.jpg').convert('RGB'))
        nx, ny = DECK['lightSize']
        self.light = np.fromfile(PUB + 'deck-light.bin', np.float32).reshape(ny, nx, 4)[..., :3]

    @staticmethod
    def tex(img, u, v, wrap=False):
        h, w, _ = img.shape
        x = u * w - 0.5
        y = (1 - v) * h - 0.5
        out = np.empty(u.shape + (3,), np.float32)
        for c in range(3):
            out[..., c] = map_coordinates(img[..., c], [y, x], order=1, mode='nearest' if not wrap else 'grid-wrap', prefilter=False)
        return out / 255

    def deck_light(self, mu, psi):
        ny, nx, _ = self.light.shape
        m = np.clip(mu, 0, 1)
        y = np.sqrt(np.maximum(1 - np.sqrt(np.maximum(1 - m * m, 0)), 0)) * (ny - 1)
        x = np.clip(psi / DECK['psiMax'] * 0.5 + 0.5, 0, 1) * (nx - 1)
        out = np.empty(mu.shape + (3,), np.float32)
        for c in range(3):
            out[..., c] = map_coordinates(self.light[..., c], [y, x], order=1, mode='nearest', prefilter=False)
        return out

    def albedo(self, n):
        p = C + R * n
        dist = np.linalg.norm(p, axis=-1, keepdims=True)
        di = p / dist
        mu_i = -np.sum(n * di, -1)
        psi_i = np.arctan2(di @ R0, di @ F0)
        z = np.maximum(-p[..., 2], 1e-4)
        u = (p[..., 0] / z - WIN[0]) / (WIN[2] - WIN[0])
        v = (p[..., 1] / z - WIN[1]) / (WIN[3] - WIN[1])
        ex = np.minimum(u, 1 - u)
        ey = np.minimum(v, 1 - v)
        w_t = (p[..., 2] < 0) * smoothstep(0, EDGE, ey) * smoothstep(INSET[0], INSET[1], np.minimum(ex, v)) * smoothstep(LIMB[0], LIMB[1], mu_i)
        uc = np.clip(u, 0, 1)
        vc = np.clip(v, 0, 1)
        enc = self.tex(self.color, uc, vc)
        nw = NEAR['window']
        un = (u - nw[0]) / (nw[2] - nw[0])
        vn = (v - nw[1]) / (nw[3] - nw[1])
        w_n = smoothstep(0, NEAR['edge'], np.minimum(np.minimum(un, 1 - un), np.minimum(vn, 1 - vn)))
        fine = self.tex(self.near, np.clip(un, 0, 1), np.clip(vn, 0, 1))
        enc = enc + (fine - enc) * w_n[..., None]
        lin = geo.unfilm(geo.to_linear(enc))
        a_t = (lin + DECK['eps']) / (self.deck_light(mu_i, psi_i) + DECK['eps'])
        c = n @ UP
        t = n - UP * c[..., None]
        s = R * np.arctan2(np.linalg.norm(t, axis=-1), c)
        psi = np.arctan2(t @ R0, t @ F0)
        us = psi / DECK['psiMax'] * 0.5 + 0.5
        vs = np.clip(np.log(np.maximum(s, 1e-4) / DECK['s0']) / np.log(DECK['s1'] / DECK['s0']), 0.002, 0.998)
        far = self.tex(self.far, us, vs, wrap=True)
        a_s = far * far * DECK['aMax']
        stretch = 1 / np.maximum(mu_i, 1e-3)
        return a_s + (a_t - a_s) * w_t[..., None], w_t, stretch * dist[..., 0] / dist[..., 0].min()


def bake(src, half_tan, size, ss, rows=256):
    n0, e0, u0 = frame()
    big = size * ss
    out = np.empty((size, size, 3), np.float32)
    seen = np.empty((size, size), np.float32)
    lean = np.empty((size, size), np.float32)
    xs = ((np.arange(big) + 0.5) / big - 0.5) * 2 * half_tan
    for r in range(0, big, rows * ss):
        ys = (0.5 - (np.arange(r, r + rows * ss) + 0.5) / big) * 2 * half_tan
        gx, gy = np.meshgrid(xs, ys)
        n = n0 + gx[..., None] * e0 + gy[..., None] * u0
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        a, w, st = src.albedo(n)
        k = r // ss
        out[k:k + rows] = a.reshape(rows, ss, size, ss, 3).mean((1, 3))
        seen[k:k + rows] = w.reshape(rows, ss, size, ss).mean((1, 3))
        lean[k:k + rows] = st.reshape(rows, ss, size, ss).mean((1, 3))
    return out, seen, lean


def encode(a):
    return (np.sqrt(np.clip(a / DECK['aMax'], 0, 1)) * 255 + 0.5).astype(np.uint8)


def main():
    os.makedirs(WORK, exist_ok=True)
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    size = int(args[0]) if len(args) > 0 else PLATES['size']
    ss = int(args[1]) if len(args) > 1 else 2
    src = Source()
    levels = []
    for i in range(PLATES['levels']):
        half = PLATES['halfTan'] / 2 ** i
        a, seen, lean = bake(src, half, size, ss)
        np.save(WORK + 'laid-%d.npy' % (i + 1), a)
        np.save(WORK + 'seen-%d.npy' % (i + 1), seen)
        np.save(WORK + 'lean-%d.npy' % (i + 1), lean)
        levels.append(a)
        Image.fromarray(encode(a)).save(WORK + 'laid-%d.png' % (i + 1))
        Image.fromarray((np.clip(seen, 0, 1) * 255).astype(np.uint8)).save(WORK + 'seen-%d.png' % (i + 1))
        Image.fromarray((np.clip(np.log2(np.maximum(lean, 1)) / 5, 0, 1) * 255).astype(np.uint8)).save(WORK + 'lean-%d.png' % (i + 1))
        print('level', i + 1, 'half tan', half, 'mean albedo', a.reshape(-1, 3).mean(0).round(3).tolist(), 'seen share', float((seen > 0.5).mean()))
    if '--write' in sys.argv:
        Image.MAX_IMAGE_PIXELS = None
        parent = geo.unfilm(geo.to_linear(np.asarray(Image.open(PUB + 'patch-4.jpg').convert('RGB')).astype(np.float32) / 255)).reshape(-1, 3).mean(0)
        match = parent / levels[1].reshape(-1, 3).mean(0)
        n0, e0, u0 = frame()
        for i, a in enumerate(levels):
            img = Image.fromarray(encode(a))
            img.save(PUB + 'place-%d.jpg' % (i + 1), quality=93, subsampling=0)
            img.resize((size // 2, size // 2), Image.LANCZOS).save(PUB.replace('/full/', '/web/') + 'place-%d.jpg' % (i + 1), quality=92, subsampling=0)
        json.dump({
            'n': n0.tolist(), 'e': e0.tolist(), 'u': u0.tolist(),
            'levels': [{'file': 'place-%d.jpg' % (i + 1), 'halfTan': PLATES['halfTan'] / 2 ** i} for i in range(len(levels))],
            'match': match.tolist(), 'aMax': DECK['aMax'], 'feather': PLATES['feather'],
        }, open('src/stops/uranus/plates.json', 'w'), indent=1)
    sheet = Image.new('RGB', (1024 * len(levels), 1024))
    for i, a in enumerate(levels):
        sheet.paste(Image.fromarray(encode(a)).resize((1024, 1024), Image.LANCZOS), (1024 * i, 0))
    sheet.save(WORK + 'laid-sheet.jpg', quality=90)


main()
