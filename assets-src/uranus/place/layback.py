import io
import json
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

sys.path.insert(0, 'assets-src/uranus')
import geo  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
PUB = 'public/assets/uranus/full/'
WEB = 'public/assets/uranus/web/'
WORK = 'out/work/u/place/'
DECK = json.load(open('src/stops/uranus/deck.json'))
NEAR = json.load(open('src/stops/uranus/deck-near.json'))
PLATES = json.load(open('assets-src/uranus/place/plates.json'))
FRAME = json.load(open(WORK + 'frame.json'))
SPOT = json.load(open('assets-src/uranus/dive/spot.json'))

C = np.array(DECK['centre'])
R = DECK['radius']
UP = np.array(DECK['up'])
F0 = np.array(DECK['f0'])
R0 = np.array(DECK['r0'])
WIN = DECK['window']
LIMB = (0.02, 0.06)
EDGE = 0.05
INSET = (0.1, 0.2)
ROT = np.array(FRAME['rot'])
RATE = FRAME['bandRate']
REF = PLATES['clockRef']
PIXEL = 2 * np.tan(np.radians(DECK['vfovDeg']) / 2) / PLATES['masterRows']
DET = PLATES['detail']


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def frame():
    g = PLATES['aheadUnits'] / R
    n = UP * np.cos(g) + F0 * np.sin(g)
    u = -UP * np.sin(g) + F0 * np.cos(g)
    e = np.cross(u, n)
    return n, e, u


N0, E0, U0 = frame()


def spin_y(d, a):
    c, s = np.cos(a), np.sin(a)
    return np.stack([c * d[..., 0] - s * d[..., 2], d[..., 1], s * d[..., 0] + c * d[..., 2]], -1)


def rate(lat):
    return RATE[0] + RATE[1] * np.sin(RATE[2] * lat + RATE[3])


def tex(img, u, v, wrap=False):
    h, w = img.shape[:2]
    x = (u * w - 0.5).astype(np.float32)
    y = ((1 - v) * h - 0.5).astype(np.float32)
    if wrap:
        x = np.mod(x, w)
    out = cv2.remap(img, x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP if wrap else cv2.BORDER_REPLICATE)
    return out.astype(np.float32) / (255 if img.dtype == np.uint8 else 1)


class Source:
    def __init__(self):
        self.color = np.asarray(Image.open(PUB + 'deck-color.jpg').convert('RGB'))
        self.far = np.asarray(Image.open(PUB + 'deck-far.jpg').convert('RGB'))
        self.near = np.asarray(Image.open(PUB + 'deck-near.jpg').convert('RGB'))
        nx, ny = DECK['lightSize']
        self.light = np.fromfile(PUB + 'deck-light.bin', np.float32).reshape(ny, nx, 4)[..., :3]

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
        enc = tex(self.color, uc, vc)
        nw = NEAR['window']
        un = (u - nw[0]) / (nw[2] - nw[0])
        vn = (v - nw[1]) / (nw[3] - nw[1])
        w_n = smoothstep(0, NEAR['edge'], np.minimum(np.minimum(un, 1 - un), np.minimum(vn, 1 - vn)))
        fine = tex(self.near, np.clip(un, 0, 1), np.clip(vn, 0, 1))
        enc = enc + (fine - enc) * w_n[..., None]
        lin = geo.unfilm(geo.to_linear(enc))
        a_t = (lin + DECK['eps']) / (self.deck_light(mu_i, psi_i) + DECK['eps'])
        c = n @ UP
        t = n - UP * c[..., None]
        s = R * np.arctan2(np.linalg.norm(t, axis=-1), c)
        psi = np.arctan2(t @ R0, t @ F0)
        us = psi / DECK['psiMax'] * 0.5 + 0.5
        vs = np.clip(np.log(np.maximum(s, 1e-4) / DECK['s0']) / np.log(DECK['s1'] / DECK['s0']), 0.002, 0.998)
        far = tex(self.far, us, vs, wrap=True)
        a_s = far * far * DECK['aMax']
        return a_s + (a_t - a_s) * w_t[..., None], w_t


def grid(half, size, r0, r1):
    xs = ((np.arange(size) + 0.5) / size - 0.5) * 2 * half
    ys = (0.5 - (np.arange(r0, r1) + 0.5) / size) * 2 * half
    return np.meshgrid(xs, ys)


def dirs(gx, gy):
    n = N0 + gx[..., None] * E0 + gy[..., None] * U0
    return n / np.linalg.norm(n, axis=-1, keepdims=True)


def bake(src, half, size, ss, rows=256):
    big = size * ss
    out = np.empty((size, size, 3), np.float32)
    seen = np.empty((size, size), np.float32)
    for r in range(0, big, rows * ss):
        gx, gy = grid(half, big, r, r + rows * ss)
        a, w = src.albedo(dirs(gx, gy))
        k = r // ss
        out[k:k + rows] = a.reshape(rows, ss, size, ss, 3).mean((1, 3))
        seen[k:k + rows] = w.reshape(rows, ss, size, ss).mean((1, 3))
    return out, seen


TILES = {}


def noise_tile(seed, octave=5.0, wide=0.55, n=2048):
    key = (seed, octave, wide)
    if key in TILES:
        return TILES[key]
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((n, n)))
    kx = np.fft.fftfreq(n)[None, :] * n
    ky = np.fft.fftfreq(n)[:, None] * n
    k = np.hypot(kx, ky) * (1024.0 / n)
    band = np.exp(-((np.log2(np.maximum(k, 0.5)) - octave) ** 2) / (2 * wide ** 2))
    t = np.real(np.fft.ifft2(f * band))
    t = (t / t.std()).astype(np.float32)
    TILES[key] = t
    return t


def sample(tile, u, v):
    n = tile.shape[0]
    return cv2.remap(tile, np.mod(u, n).astype(np.float32), np.mod(v, n).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def footprint(half, size, angle, coarse=512):
    gx, gy = grid(half, coarse, 0, coarse)
    n = dirs(gx, gy)
    p = C + R * n
    k = -np.sin(angle) * E0 + np.cos(angle) * U0
    out = None
    for name in PLATES['handoverCameras']:
        v = p - np.array(FRAME[name]['position'])
        slant = np.linalg.norm(v, axis=-1)
        d = v / slant[..., None]
        mu = np.maximum(-np.sum(d * n, -1), 1e-3)
        t = d + mu[..., None] * n
        t /= np.maximum(np.linalg.norm(t, axis=-1, keepdims=True), 1e-9)
        kr = (t @ k) ** 2
        fp = PIXEL * slant * np.sqrt(kr / mu ** 2 + (1 - kr))
        out = fp if out is None else np.minimum(out, fp)
    return cv2.resize(out.astype(np.float32), (size, size), interpolation=cv2.INTER_LINEAR)


def streaks(x, y, angle, texel, base, blur):
    ca, sa = np.cos(angle), np.sin(angle)
    along = x * ca + y * sa
    across = -x * sa + y * ca
    out = np.zeros(x.shape, np.float32)
    wisp = np.zeros(x.shape, np.float32)
    lam0 = DET['lambda0']
    bend = DET['bend'] * lam0 * sample(noise_tile(base + 1, 3.0), along / (lam0 * 30.0) * 128.0 + 5.0, across / (lam0 * 8.0) * 128.0 + 9.0)
    for o in range(DET['octaves']):
        lam = lam0 * 0.5 ** o
        w = float(smoothstep(1.8, 2.6, lam / texel))
        if w <= 0:
            continue
        gate = w * smoothstep(DET['gate'][0], DET['gate'][1], blur / lam)
        if float(gate.max()) <= 0:
            continue
        c = across + bend
        curl = sample(noise_tile(base + 10 + o, 4.0), along / (lam * 14.0) * 64.0 + 3.0 * o, c / (lam * 5.0) * 64.0 + 17.0 * o)
        c = c + DET['curl'] * lam * curl
        patch = sample(noise_tile(base + 20 + o, 3.0), along / (lam * 40.0) * 128.0 + 13.0 * o, c / (lam * 16.0) * 128.0 + 7.0 * o)
        gain = 0.6 + 0.4 * np.tanh(patch * 1.2)
        streak = sample(noise_tile(base + 30 + o, 5.0, 1.0), along / (lam * DET['stretch']) * 32.0 + 37.0 * o, c / lam * 32.0 + 91.0 * o)
        billow = sample(noise_tile(base + 40 + o, 5.0, 1.0), along / (lam * 2.4) * 32.0 + 53.0 * o, c / (lam * 1.2) * 32.0 + 29.0 * o)
        gate = gate * np.clip(lam * DET['gate'][1] / np.maximum(blur, 1e-6), 0, 1) ** DET['slope']
        out += DET['amp'] * gate * (0.4 + gain) * (0.85 * streak + 0.4 * billow)
        fil = sample(noise_tile(base + 50 + o, 5.0, 0.8), along / (lam * 10.0) * 32.0 + 71.0 * o, c / (lam * 1.3) * 32.0 + 23.0 * o)
        wisp += gate * np.clip(0.8 * (fil - 0.9), 0, 1) * np.clip(patch * 0.8 - 0.1, 0, 1)
    return out, wisp


def repaint(a, seen, half, size):
    texel = 2 * half / size * R
    gx, gy = grid(half, size, 0, size)
    x = (gx * R).astype(np.float32)
    y = (gy * R).astype(np.float32)
    inside = cv2.GaussianBlur(seen, (0, 0), max(DET['zoneUnits'] / texel, 0.5))
    d_e, w_e = streaks(x, y, 0.0, texel, 1000, footprint(half, size, 0.0))
    d_f, w_f = streaks(x, y, DECK['flowAngle'], texel, 2000, footprint(half, size, DECK['flowAngle']))
    d = d_f + (d_e - d_f) * inside
    wisp = w_f + (w_e - w_f) * inside
    out = a * np.exp(d + DET['wisp'] * wisp)[..., None] * (1 + (np.array(DET['wispTint'], np.float32) - 1) * np.clip(wisp, 0, 1)[..., None])
    return np.clip(out, 0, DECK['aMax']), d


class Globe:
    def __init__(self):
        self.wrap = np.asarray(Image.open(PUB + 'wrap-color.jpg').convert('RGB'))
        patches = json.load(open('src/stops/uranus/patches.json'))
        self.feather = patches['feather']
        self.levels = []
        for name, width in PLATES['patchSource']:
            raw = subprocess.check_output(['git', 'show', PLATES['patchCommit'] + ':' + PUB + name])
            self.levels.append((np.asarray(Image.open(io.BytesIO(raw)).convert('RGB')), 1 / (2 * np.tan(np.radians(width) / 2))))
        n = np.array(SPOT['spot'], float)
        self.n = n / np.linalg.norm(n)
        self.e = np.cross([0.0, 1.0, 0.0], self.n)
        self.e /= np.linalg.norm(self.e)
        self.u = np.cross(self.n, self.e)

    def band(self, deck_dir):
        body = deck_dir @ ROT
        return spin_y(body, REF * rate(np.arcsin(np.clip(body[..., 1], -1, 1))))

    def deck(self, band_dir):
        body = spin_y(band_dir, -REF * rate(np.arcsin(np.clip(band_dir[..., 1], -1, 1))))
        return body @ ROT.T

    def albedo(self, d, count):
        u = np.arctan2(d[..., 0], d[..., 2]) / (2 * np.pi) + 0.5
        v = np.arcsin(np.clip(d[..., 1], -1, 1)) / np.pi + 0.5
        enc = tex(self.wrap, u, v, wrap=True)
        dn = np.maximum(d @ self.n, 0.05)
        gx = (d @ self.e) / dn
        gy = (d @ self.u) / dn
        for img, scale in self.levels[:count]:
            qx, qy = gx * scale, gy * scale
            w = smoothstep(0.5, 0.5 - self.feather, np.maximum(np.abs(qx), np.abs(qy))) * (d @ self.n > 0.3)
            s = tex(img, np.clip(qx + 0.5, 0, 1), np.clip(qy + 0.5, 0, 1))
            enc = enc + (s - enc) * w[..., None]
        return geo.unfilm(geo.to_linear(enc))


def mask_of(gx, gy):
    r = np.degrees(np.arctan(np.hypot(gx, gy)))
    th = np.arctan2(gy, gx)
    m = PLATES['mask']
    lobes = sum(a * np.sin(k * th + ph) for k, a, ph in m['lobes'])
    fine = sample(noise_tile(77, 3.0), gx * R / m['noiseUnits'] * 128.0 + 31.0, gy * R / m['noiseUnits'] * 128.0 + 57.0)
    return (1 - smoothstep(m['deg'][0], m['deg'][1], r * (1 + lobes + m['noise'] * fine))).astype(np.float32)


def encode(a):
    return (np.sqrt(np.clip(a / DECK['aMax'], 0, 1)) * 255 + 0.5).astype(np.uint8)


def main():
    os.makedirs(WORK, exist_ok=True)
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    size = int(args[0]) if len(args) > 0 else PLATES['size']
    ss = int(args[1]) if len(args) > 1 else 2
    write = '--write' in sys.argv
    src = Source()
    globe = Globe()
    half0 = PLATES['halfTan']
    levels = []
    for i in range(PLATES['levels']):
        half = half0 / 2 ** i
        cache = WORK + 'laid-%d-%d.npz' % (i + 1, size)
        if '--reuse' in sys.argv and os.path.exists(cache):
            z = np.load(cache)
            a, seen = z['a'], z['seen']
        else:
            a, seen = bake(src, half, size, PLATES['supersample'][i] if ss == 0 else ss)
            np.savez(cache, a=a, seen=seen)
        fixed, d = repaint(a, seen, half, size)
        levels.append(fixed)
        del a, seen
        print('level', i + 1, 'half tan', half, 'texel units', round(2 * half / size * R, 5), 'mean albedo', fixed.reshape(-1, 3).mean(0).round(3).tolist(), 'seen share', round(float((seen > 0.5).mean()), 3), 'detail rms', round(float(d.std()), 4), flush=True)

    q = np.abs((np.arange(size // 2) + 0.5) / (size // 2) - 0.5)
    inner = smoothstep(0.5, 0.5 - PLATES['feather'], np.maximum(q[None, :], q[:, None]))[..., None].astype(np.float32)
    for i in range(len(levels) - 1, 0, -1):
        lo = size // 4
        small = cv2.resize(levels[i], (size // 2, size // 2), interpolation=cv2.INTER_AREA)
        levels[i - 1][lo:lo + size // 2, lo:lo + size // 2] += (small - levels[i - 1][lo:lo + size // 2, lo:lo + size // 2]) * inner

    fs = PLATES['fieldSize']
    gx, gy = grid(half0, fs, 0, fs)
    b = globe.albedo(globe.band(dirs(gx, gy)), len(globe.levels))
    a1 = cv2.resize(levels[0], (fs, fs), interpolation=cv2.INTER_AREA)
    sigma = np.tan(np.radians(PLATES['fieldSigmaDeg'])) / (2 * half0 / fs)
    match = cv2.GaussianBlur(b, (0, 0), sigma, borderType=cv2.BORDER_REFLECT) / np.maximum(cv2.GaussianBlur(a1, (0, 0), sigma, borderType=cv2.BORDER_REFLECT), 1e-4)
    mask = mask_of(gx, gy)
    field = np.concatenate([match, mask[..., None]], -1).astype(np.float32)
    print('match mean', match.reshape(-1, 3).mean(0).round(4).tolist(), 'min', match.reshape(-1, 3).min(0).round(4).tolist(), 'max', match.reshape(-1, 3).max(0).round(4).tolist(), 'mask share', round(float(mask.mean()), 3), flush=True)

    def far_look(a, half):
        n = a.shape[0]
        gx, gy = grid(half, n, 0, n)
        fx = ((gx / (2 * half0) + 0.5) * fs - 0.5).astype(np.float32)
        fy = ((0.5 - gy / (2 * half0)) * fs - 0.5).astype(np.float32)
        f = cv2.remap(field, fx, fy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return a * f[..., :3], f[..., 3]

    sheet = Image.new('RGB', (1024 * len(levels), 2048))
    for i, a in enumerate(levels):
        sheet.paste(Image.fromarray(encode(a)).resize((1024, 1024), Image.LANCZOS), (1024 * i, 0))
        small = cv2.resize(a, (1024, 1024), interpolation=cv2.INTER_AREA)
        lit, m = far_look(small, half0 / 2 ** i)
        gx, gy = grid(half0 / 2 ** i, 1024, 0, 1024)
        under = globe.albedo(globe.band(dirs(gx, gy)), len(globe.levels))
        both = under + (lit - under) * m[..., None]
        sheet.paste(Image.fromarray((np.clip(geo.display(both * PLATES['previewGain']), 0, 1) * 255 + 0.5).astype(np.uint8)), (1024 * i, 1024))
    sheet.save(WORK + 'laid-sheet.jpg', quality=90)

    if not write:
        return
    for i, a in enumerate(levels):
        img = Image.fromarray(encode(a))
        img.save(PUB + 'place-%d.jpg' % (i + 1), quality=93, subsampling=0)
        img.resize((size // 2, size // 2), Image.LANCZOS).save(WEB + 'place-%d.jpg' % (i + 1), quality=92, subsampling=0)
    field[::-1].tofile(PUB + 'place-field.bin')
    field[::-1].tofile(WEB + 'place-field.bin')

    kept = []
    for k in range(PLATES['patchKeep']):
        name, width = PLATES['patchSource'][k]
        old, scale = globe.levels[k]
        n = old.shape[0]
        halfp = 0.5 / scale
        ratio = (2 * halfp / n) / (2 * half0 / size)
        soft = cv2.GaussianBlur(levels[0], (0, 0), max(0.5 * ratio, 0.3))
        out = np.empty((n, n, 3), np.uint8)
        for r in range(0, n, 512):
            g = ((np.arange(n) + 0.5) / n - 0.5) * 2 * halfp
            x, y = np.meshgrid(g, -g[r:r + 512])
            d = globe.n + x[..., None] * globe.e + y[..., None] * globe.u
            d /= np.linalg.norm(d, axis=-1, keepdims=True)
            nd = globe.deck(d)
            pn = nd @ N0
            px = (nd @ E0) / np.maximum(pn, 0.05)
            py = (nd @ U0) / np.maximum(pn, 0.05)
            inside = (pn > 0.5) & (np.maximum(np.abs(px), np.abs(py)) < half0)
            a = cv2.remap(soft, ((px / (2 * half0) + 0.5) * size - 0.5).astype(np.float32), ((0.5 - py / (2 * half0)) * size - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            f = cv2.remap(field, ((px / (2 * half0) + 0.5) * fs - 0.5).astype(np.float32), ((0.5 - py / (2 * half0)) * fs - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            w = (f[..., 3] * inside)[..., None]
            lin = geo.unfilm(geo.to_linear(old[r:r + 512].astype(np.float32) / 255))
            out[r:r + 512] = (np.clip(geo.display(lin + (a * f[..., :3] - lin) * w), 0, 1) * 255 + 0.5).astype(np.uint8)
        img = Image.fromarray(out)
        img.save(PUB + name, quality=93, subsampling=0)
        img.resize((n // 2, n // 2), Image.LANCZOS).save(WEB + name, quality=92, subsampling=0)
        img.resize((1024, 1024), Image.LANCZOS).save(WORK + name.replace('.jpg', '-v.jpg'), quality=88)
        kept.append({'file': name, 'widthDeg': width})
        print('patch', name, 'ratio to plate 1', round(ratio, 3), flush=True)
    patches = json.load(open('src/stops/uranus/patches.json'))
    patches['levels'] = kept
    json.dump(patches, open('src/stops/uranus/patches.json', 'w'), indent=1)
    json.dump({
        'n': N0.tolist(), 'e': E0.tolist(), 'u': U0.tolist(),
        'levels': [{'file': 'place-%d.jpg' % (i + 1), 'halfTan': half0 / 2 ** i} for i in range(len(levels))],
        'aMax': DECK['aMax'], 'feather': PLATES['feather'], 'field': {'file': 'place-field.bin', 'size': fs}, 'clockRef': REF,
    }, open('src/stops/uranus/plates.json', 'w'), indent=1)


main()
