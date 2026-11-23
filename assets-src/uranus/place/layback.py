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
STORM = PLATES['storm']


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


def pyramid(img, n=8):
    out = [img]
    for _ in range(n):
        out.append(cv2.pyrDown(out[-1], borderType=cv2.BORDER_REFLECT))
    return out


def sample_lod(pyr, x, y, lod, wrap=False):
    lod = np.clip(lod, 0, len(pyr) - 1.001)
    l0 = np.floor(lod).astype(np.int32)
    f = (lod - l0).astype(np.float32)
    out = np.zeros(x.shape + (3,), np.float32)
    scale = 255.0 if pyr[0].dtype == np.uint8 else 1.0
    for l in range(len(pyr)):
        for sel, wgt in ((l0 == l, 1 - f), (l0 + 1 == l, f)):
            if sel.any():
                s = 2.0 ** l
                v = cv2.remap(pyr[l], ((x + 0.5) / s - 0.5).astype(np.float32), ((y + 0.5) / s - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP if wrap else cv2.BORDER_REPLICATE)
                out += v * (sel * wgt / scale)[..., None]
    return out


def tex_lod(pyr, u, v, lod, wrap=False):
    h, w = pyr[0].shape[:2]
    return sample_lod(pyr, u * w - 0.5, (1 - v) * h - 0.5, lod, wrap)


class Source:
    def __init__(self):
        self.color = pyramid(np.asarray(Image.open(PUB + 'deck-color.jpg').convert('RGB')))
        self.far = pyramid(np.asarray(Image.open(PUB + 'deck-far.jpg').convert('RGB')))
        self.near = pyramid(np.asarray(Image.open(PUB + 'deck-near.jpg').convert('RGB')))
        self.pixel = (WIN[2] - WIN[0]) / self.color[0].shape[1]
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

    def image(self, n, texel):
        p = C + R * n
        dist = np.linalg.norm(p, axis=-1, keepdims=True)
        raw = np.log2(np.maximum(texel / (dist[..., 0] * self.pixel), 1e-3))
        lod = np.maximum(raw, 0)
        di = p / dist
        mu_i = -np.sum(n * di, -1)
        psi_i = np.arctan2(di @ R0, di @ F0)
        z = np.maximum(-p[..., 2], 1e-4)
        u = np.clip((p[..., 0] / z - WIN[0]) / (WIN[2] - WIN[0]), 0, 1)
        v = np.clip((p[..., 1] / z - WIN[1]) / (WIN[3] - WIN[1]), 0, 1)
        enc = tex_lod(self.color, u, v, lod)
        nw = NEAR['window']
        un = (u - nw[0]) / (nw[2] - nw[0])
        vn = (v - nw[1]) / (nw[3] - nw[1])
        w_n = smoothstep(0, NEAR['edge'], np.minimum(np.minimum(un, 1 - un), np.minimum(vn, 1 - vn)))
        fine = tex_lod(self.near, np.clip(un, 0, 1), np.clip(vn, 0, 1), np.maximum(raw + np.log2(self.near[0].shape[1] / ((nw[2] - nw[0]) * self.color[0].shape[1])), 0))
        enc = enc + (fine - enc) * w_n[..., None]
        return (geo.unfilm(geo.to_linear(enc)) + DECK['eps']) / (self.deck_light(mu_i, psi_i) + DECK['eps'])

    def albedo(self, n, texel):
        p = C + R * n
        dist = np.linalg.norm(p, axis=-1, keepdims=True)
        raw = np.log2(np.maximum(texel / (dist[..., 0] * self.pixel), 1e-3))
        lod = np.maximum(raw, 0)
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
        enc = tex_lod(self.color, uc, vc, lod)
        nw = NEAR['window']
        un = (u - nw[0]) / (nw[2] - nw[0])
        vn = (v - nw[1]) / (nw[3] - nw[1])
        w_n = smoothstep(0, NEAR['edge'], np.minimum(np.minimum(un, 1 - un), np.minimum(vn, 1 - vn)))
        fine = tex_lod(self.near, np.clip(un, 0, 1), np.clip(vn, 0, 1), np.maximum(raw + np.log2(self.near[0].shape[1] / ((nw[2] - nw[0]) * self.color[0].shape[1])), 0))
        enc = enc + (fine - enc) * w_n[..., None]
        lin = geo.unfilm(geo.to_linear(enc))
        a_t = (lin + DECK['eps']) / (self.deck_light(mu_i, psi_i) + DECK['eps'])
        c = n @ UP
        t = n - UP * c[..., None]
        s = R * np.arctan2(np.linalg.norm(t, axis=-1), c)
        psi = np.arctan2(t @ R0, t @ F0)
        us = psi / DECK['psiMax'] * 0.5 + 0.5
        vs = np.clip(np.log(np.maximum(s, 1e-4) / DECK['s0']) / np.log(DECK['s1'] / DECK['s0']), 0.002, 0.998)
        fh, fw = self.far[0].shape[:2]
        far = tex_lod(self.far, us, vs, np.log2(np.maximum(texel / (np.maximum(s, 1e-3) * min(2 * DECK['psiMax'] / fw, np.log(DECK['s1'] / DECK['s0']) / fh)), 1.0)), wrap=True)
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
        a, w = src.albedo(dirs(gx, gy), 2 * half / big * R)
        k = r // ss
        out[k:k + rows] = a.reshape(rows, ss, size, ss, 3).mean((1, 3))
        seen[k:k + rows] = w.reshape(rows, ss, size, ss).mean((1, 3))
    return out, seen


def polar_of(n):
    c = n @ UP
    t = n - UP * c[..., None]
    return np.arctan2(t @ R0, t @ F0), R * np.arctan2(np.linalg.norm(t, axis=-1), c)


def polar_dirs(th, r):
    g = r / R
    return UP * np.cos(g)[..., None] + np.sin(g)[..., None] * (F0 * np.cos(th)[..., None] + R0 * np.sin(th)[..., None])


def tri01(x):
    return 1 - np.abs(np.mod(x, 2) - 1)


def fan(src):
    cache = WORK + 'fan.npz'
    if '--reuse' in sys.argv and os.path.exists(cache):
        return np.load(cache)['f']
    nt, nr = STORM['size']
    tf = np.radians(STORM['fanDeg'])
    r0, r1 = STORM['r']
    th = ((np.arange(nt) + 0.5) / nt * 2 - 1) * tf
    lr = np.log(r0) + (np.arange(nr) + 0.5) / nr * np.log(r1 / r0)
    out = np.empty((nr, nt, 3), np.float32)
    for k in range(0, nr, 256):
        t, l = np.meshgrid(th, lr[k:k + 256])
        out[k:k + 256] = src.image(polar_dirs(t, np.exp(l)), np.exp(l) * 2 * tf / nt)
    np.savez(cache, f=out)
    return out


def storm(pyr, th, r, texel):
    nr, nt = pyr[0].shape[:2]
    tf = np.radians(STORM['fanDeg'])
    r0, r1 = STORM['r']
    span = np.log(r1 / r0)
    rs = np.maximum(r, 1e-3)
    x = rs * np.sin(th)
    y = rs * np.cos(th)
    lin = np.log(rs / r0) / span
    wob = sample(noise_tile(STORM['seed'], 3.0), x / STORM['wobbleUnits'] * 128.0 + 11.0, y / STORM['wobbleUnits'] * 128.0 + 47.0)
    b = lin * STORM['bands'] + STORM['wobble'] * wob + 64.0
    k = np.floor(b).astype(np.int32)
    f = b - k
    rng = np.random.default_rng(STORM['seed'])
    table = rng.uniform(0, 2, 256)
    lod = np.log2(np.maximum(texel / (rs * min(np.pi / 2 / nt, span / nr)), 1.0))
    row = tri01(lin) * nr - 0.5
    out = np.zeros(th.shape + (3,), np.float32)
    s = smoothstep(1 - STORM['blend'], 1, f).astype(np.float32)
    cut = sample(noise_tile(STORM['seed'] + 1, 3.0), x / STORM['cutUnits'] * 128.0 + 31.0, y / STORM['cutUnits'] * 128.0 + 83.0)
    e = STORM['cutBlend']
    for step, wgt in ((0, 1 - s), (1, s)):
        a = th * 2 / np.pi + 0.5 + table[(k + step) % 256]
        b = a + STORM['cutWobble'] * cut - 0.5
        j = np.floor(b)
        c = smoothstep(0.5 - e, 0.5 + e, b - j).astype(np.float32)
        for dj, w2 in ((0, 1 - c), (1, c)):
            col = tri01(a - j - dj) * nt - 0.5
            out += sample_lod(pyr, col, row, lod) * (wgt * w2)[..., None]
    return out


def source_blur(r):
    r0, r1 = STORM['r']
    span = np.log(r1 / r0)
    rs = np.maximum(r, 1e-3)
    rp = r0 * np.exp(tri01(np.log(rs / r0) / span) * span)
    g = rp / R
    h = PLATES['aheadUnits']
    d = np.sqrt((R * np.sin(g)) ** 2 + (R + h - R * np.cos(g)) ** 2)
    mu = np.maximum(((R + h) * np.cos(g) - R) / d, 1e-3)
    return PIXEL * d / mu * rs / rp


def keep_of(seen, th, r):
    k = STORM['keep']
    x = r * np.sin(th)
    y = r * np.cos(th)
    n1 = sample(noise_tile(STORM['seed'] + 3, 3.0), x / k['noiseUnits'] * 128.0 + 5.0, y / k['noiseUnits'] * 128.0 + 71.0)
    n2 = sample(noise_tile(STORM['seed'] + 4, 3.0), x / (k['noiseUnits'] * 0.3) * 128.0 + 15.0, y / (k['noiseUnits'] * 0.3) * 128.0 + 21.0)
    n = n1 + 0.5 * n2
    w_fan = smoothstep(k['seen'][0], k['seen'][1], seen + k['noise'] * n) * (1 - smoothstep(k['far'][0], k['far'][1], r * (1 + k['farNoise'] * n)))
    w_core = 1 - smoothstep(k['core'][0], k['core'][1], r * (1 + k['coreNoise'] * n))
    return np.maximum(w_fan, w_core).astype(np.float32), w_core.astype(np.float32)


TILES = {}


def noise_tile(seed, octave=5.0, wide=0.55, n=2048):
    key = (seed % 3, octave, wide)
    if key not in TILES:
        rng = np.random.default_rng(key[0] * 7919 + int(octave * 16) * 31 + int(wide * 100))
        f = np.fft.fft2(rng.standard_normal((n, n)))
        kx = np.fft.fftfreq(n)[None, :] * n
        ky = np.fft.fftfreq(n)[:, None] * n
        k = np.hypot(kx, ky) * (1024.0 / n)
        band = np.exp(-((np.log2(np.maximum(k, 0.5)) - octave) ** 2) / (2 * wide ** 2))
        t = np.real(np.fft.ifft2(f * band))
        TILES[key] = (t / t.std()).astype(np.float32)
    t = TILES[key]
    h = (seed * 2654435761) % (2 ** 32)
    t = np.roll(t, ((h >> 4) % n, (h >> 16) % n), axis=(0, 1))
    if h & 1:
        t = t.T
    if h & 2:
        t = t[::-1]
    return np.ascontiguousarray(t)


def sample(tile, u, v):
    n = tile.shape[0]
    return cv2.remap(tile, np.mod(u, n).astype(np.float32), np.mod(v, n).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def footprint(half, size, angle, coarse=512):
    gx, gy = grid(half, coarse, 0, coarse)
    n = dirs(gx, gy)
    p = C + R * n
    if angle is None:
        k = n - UP * (n @ UP)[..., None]
        k /= np.maximum(np.linalg.norm(k, axis=-1, keepdims=True), 1e-9)
    else:
        k = -np.sin(angle) * E0 + np.cos(angle) * U0
    out = None
    for name in PLATES['handoverCameras']:
        v = p - np.array(FRAME[name]['position'])
        slant = np.linalg.norm(v, axis=-1)
        d = v / slant[..., None]
        mu = np.maximum(-np.sum(d * n, -1), 1e-3)
        t = d + mu[..., None] * n
        t /= np.maximum(np.linalg.norm(t, axis=-1, keepdims=True), 1e-9)
        kr = np.sum(t * k, -1) ** 2
        fp = PIXEL * slant * np.sqrt(kr / mu ** 2 + (1 - kr))
        out = fp if out is None else np.minimum(out, fp)
    return cv2.resize(out.astype(np.float32), (size, size), interpolation=cv2.INTER_LINEAR)


def streaks(along, across, texel, base, blur):
    out = np.zeros(along.shape, np.float32)
    wisp = np.zeros(along.shape, np.float32)
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


def repaint(a, seen, half, size, pyr):
    texel = 2 * half / size * R
    gx, gy = grid(half, size, 0, size)
    th, r = polar_of(dirs(gx, gy))
    th = th.astype(np.float32)
    r = r.astype(np.float32)
    keep, core = keep_of(seen, th, r)
    a = a * keep[..., None] + storm(pyr, th, r, texel) * (1 - keep)[..., None]
    blur_cam = footprint(half, size, None)
    blur = blur_cam * keep + source_blur(r) * (1 - keep)
    back = np.mod(th, 2 * np.pi) - np.pi
    front = smoothstep(np.radians(120), np.radians(60), np.abs(th)).astype(np.float32)
    d_a, w_a = streaks(th * r, r, texel, 1000, blur)
    d_b, w_b = streaks(back * r + 400.0, r + 90.0, texel, 3000, blur)
    d_arc = d_b + (d_a - d_b) * front
    w_arc = w_b + (w_a - w_b) * front
    fa = DECK['flowAngle']
    x = (gx * R).astype(np.float32)
    y = (gy * R).astype(np.float32)
    d_f, w_f = streaks(x * np.cos(fa) + y * np.sin(fa), -x * np.sin(fa) + y * np.cos(fa), texel, 2000, footprint(half, size, fa))
    inside = cv2.GaussianBlur(seen, (0, 0), max(DET['zoneUnits'] / texel, 0.5))
    flow = core * (1 - inside)
    d = d_arc + (d_f - d_arc) * flow
    wisp = w_arc + (w_f - w_arc) * flow
    out = a * np.exp(d + DET['wisp'] * wisp)[..., None] * (1 + (np.array(DET['wispTint'], np.float32) - 1) * np.clip(wisp, 0, 1)[..., None])
    return np.clip(out, 0, DECK['aMax']), d, keep


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
    pyr = pyramid(fan(src))
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
        fixed, d, keep = repaint(a, seen, half, size, pyr)
        levels.append(fixed)
        print('level', i + 1, 'half tan', half, 'texel units', round(2 * half / size * R, 5), 'mean albedo', fixed.reshape(-1, 3).mean(0).round(3).tolist(), 'seen share', round(float((seen > 0.5).mean()), 3), 'detail rms', round(float(d.std()), 4), flush=True)
        del a, seen, d

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
        'aMax': DECK['aMax'], 'feather': PLATES['feather'], 'field': {'file': 'place-field.bin', 'size': fs}, 'clockRef': REF, 'aimUnits': PLATES['aimUnits'] - PLATES['aheadUnits'],
    }, open('src/stops/uranus/plates.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
