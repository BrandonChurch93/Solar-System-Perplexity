import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/dive/'
PUB = 'public/assets/uranus/'
WRAP = 'out/work/u/wrap/wrap-albedo.npy'
LEVELS = [('patch-1.jpg', 76.0), ('patch-2.jpg', 42.0), ('patch-3.jpg', 22.0), ('patch-4.jpg', 11.0)]
SIZE = 4096
LAMBDA0 = 0.284
OCTAVES = 6
AMP = 0.05
FALL = 0.82
STRETCH = 7.0
DECK_ANGLE = np.radians(51.0)
TILE = 2048


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def noise_tile(seed, octave=5.0, n=TILE):
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((n, n)))
    kx = np.fft.fftfreq(n)[None, :] * n
    ky = np.fft.fftfreq(n)[:, None] * n
    k = np.hypot(kx, ky) * (1024.0 / n)
    band = np.exp(-((np.log2(np.maximum(k, 0.5)) - octave) ** 2) / (2 * 0.55 ** 2))
    t = np.real(np.fft.ifft2(f * band))
    return (t / t.std()).astype(np.float32)


def sample(tile, u, v):
    n = tile.shape[0]
    return cv2.remap(tile, np.mod(u, n).astype(np.float32), np.mod(v, n).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def detail(along, across, texel):
    out = np.zeros(along.shape, np.float32)
    for o in range(OCTAVES):
        lam = LAMBDA0 * 0.5 ** o
        w = float(smooth(1.8, 2.6, lam / texel))
        if w <= 0:
            continue
        turn = DECK_ANGLE * float(smooth(0.0, 1.0, (o - 1) / 3.0))
        a = along * np.cos(turn) + across * np.sin(turn)
        c = -along * np.sin(turn) + across * np.cos(turn)
        warp = 0.45 * lam * np.sin(a / (lam * 11.0) + 1.7 * o) + 0.3 * lam * np.sin(c / (lam * 5.0) + 0.9 * o)
        patch = sample(noise_tile(900 + o, 3.0), a / (lam * 40.0) * 32.0 + 13.0 * o, c / (lam * 24.0) * 32.0 + 7.0 * o)
        gain = 0.55 + 0.45 * np.tanh(patch * 1.2)
        streak = sample(noise_tile(500 + o), a / (lam * STRETCH) * 32.0 + 37.0 * o, (c + warp) / lam * 32.0 + 91.0 * o)
        billow = sample(noise_tile(700 + o), a / (lam * 2.2) * 32.0 + 53.0 * o, (c + warp) / (lam * 1.3) * 32.0 + 29.0 * o)
        out += AMP * FALL ** o * w * (0.5 + gain) * (streak + 0.45 * billow)
    return out


def main():
    spot = json.load(open('assets-src/uranus/dive/spot.json'))
    n = np.array(spot['spot'])
    lat0 = np.arcsin(n[1])
    lon0 = np.arctan2(n[0], n[2])
    east = np.cross([0.0, 1.0, 0.0], n)
    east /= np.linalg.norm(east)
    north = np.cross(n, east)
    unit = spot['unit']
    wrap = np.load(WRAP, mmap_mode='r')
    H, W = wrap.shape[:2]
    rows = []
    for name, width in LEVELS:
        half = np.tan(np.radians(width) / 2)
        g = ((np.arange(SIZE) + 0.5) / SIZE - 0.5) * 2 * half
        x, y = np.meshgrid(g.astype(np.float32), (-g).astype(np.float32))
        d = n[None, None, :] + x[..., None] * east + y[..., None] * north
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        lon = np.arctan2(d[..., 0], d[..., 2])
        lat = np.arcsin(np.clip(d[..., 1], -1, 1))
        del d
        col = (lon / (2 * np.pi) + 0.5) * W - 0.5
        row = (0.5 - lat / np.pi) * H - 0.5
        c0, c1 = int(np.floor(col.min())) - 4, int(np.ceil(col.max())) + 5
        r0, r1 = max(int(np.floor(row.min())) - 4, 0), min(int(np.ceil(row.max())) + 5, H)
        src = np.ascontiguousarray(np.take(wrap[r0:r1], np.arange(c0, c1) % W, axis=1)).astype(np.float32)
        base = cv2.remap(src, (col - c0).astype(np.float32), (row - r0).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        del src, col, row
        along = ((lon - lon0) * np.cos(lat) / unit).astype(np.float32)
        across = ((lat - lat0) / unit).astype(np.float32)
        del lon, lat
        texel = 2 * half / SIZE / unit
        dl = detail(along, across, texel)
        out = np.clip(base * np.exp(dl)[..., None], 0.1, 1.8)
        img = Image.fromarray((np.clip(geo.display(out), 0, 1) * 255 + 0.5).astype(np.uint8))
        img.save(PUB + 'full/' + name, quality=93, subsampling=0)
        img.resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(PUB + 'web/' + name, quality=92, subsampling=0)
        img.resize((1024, 1024), Image.LANCZOS).save(OUT + name.replace('.jpg', '-v.jpg'), quality=88)
        img.crop((SIZE // 2 - 512, SIZE // 2 - 512, SIZE // 2 + 512, SIZE // 2 + 512)).save(OUT + name.replace('.jpg', '-crop.png'))
        rows.append({'file': name, 'widthDeg': width})
        print(name, 'width', width, 'texel units', round(texel, 5), 'density over the wrap', round(SIZE / (2 * half) / (W / (2 * np.pi)), 2), 'detail rms', float(dl.std()), 'albedo median', np.median(base.reshape(-1, 3), 0).round(3))
    json.dump({'spot': spot['spot'], 'levels': rows, 'feather': 0.12, 'fade': [1.02, 1.5]}, open('src/stops/uranus/patches.json', 'w'), indent=1)


main()
