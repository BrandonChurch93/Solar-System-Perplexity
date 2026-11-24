import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import craters as CR
import mosaic as M
import plates as P

F = P.SPEC['fine']
WORK = M.WORK / 'fine'
PUBLIC = M.ROOT / 'public/assets/mercury'
OUT = M.ROOT / 'src/stops/mercury/fine.json'


def sun():
    s = np.array(json.loads((M.WORK / 'tiles/cameras.json').read_text())['dive']['sun'])
    a = np.array([M.E @ s, -(M.U @ s)])
    return float(M.N @ s), a / np.linalg.norm(a)


def noise(rng, size, waves):
    f = np.hypot(np.fft.fftfreq(size)[None, :], np.fft.fftfreq(size)[:, None])
    out = np.zeros((size, size), np.float32)
    for wave, slope in waves:
        band = np.exp(-0.5 * ((f - 1 / wave) / (F['bandShare'] / wave)) ** 2)
        n = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((size, size))) * band)).astype(np.float32)
        gy, gx = np.gradient(n)
        out += n * (slope / np.sqrt(float((gx * gx + gy * gy).mean())))
    return out


def tile():
    WORK.mkdir(parents=True, exist_ok=True)
    ss, size, pad = F['ss'], F['period'] * F['ss'], F['pad'] * F['ss']
    rng = np.random.default_rng(F['seed'])
    height, a = sun()
    t0 = float(CR.slope(np.float32(height)))
    h = noise(rng, size, [[w * ss, s] for w, s in F['rough']]) * t0
    h = np.pad(h, pad, mode='wrap')
    sin = np.full(h.shape, height, np.float32)
    lo, hi = F['radiusPx'][0] * ss, F['radiusPx'][1] * ss
    n = int(F['cover'] * size * size / (2 * np.pi * lo * lo))
    u = rng.random(n)
    r = lo * (1 - u * (1 - (lo / hi) ** 2)) ** -0.5
    x, y = rng.random(n) * size, rng.random(n) * size
    stamps = 0
    for k in rng.permutation(n):
        m = r[k] * (CR.C['reach'] + 0.5) + 2
        for dx in (-size, 0, size):
            for dy in (-size, 0, size):
                cx, cy = x[k] + pad + dx, y[k] + pad + dy
                if cx + m < 0 or cy + m < 0 or cx - m > h.shape[1] or cy - m > h.shape[0]:
                    continue
                CR.stamp(h, sin, cx, cy, r[k], np.random.default_rng([F['seed'], int(k)]))
                stamps += 1
    out = CR.shade(h, sin, a)[pad:pad + size, pad:pad + size]
    out = cv2.resize(out, (F['period'], F['period']), interpolation=cv2.INTER_AREA)
    mean = float(out.mean())
    out /= mean
    seam = float(np.abs(out[:, 0] - out[:, -1]).mean()), float(np.abs(out[:, 1] - out[:, 0]).mean()), float(np.abs(out[0] - out[-1]).mean()), float(np.abs(out[1] - out[0]).mean())
    print('craters', n, 'stamps', stamps, 'sun height deg', round(float(np.degrees(np.arcsin(height))), 2), 'toward', np.round(a, 3), 'mean before', round(mean, 4), 'share under 0.3', round(float((out < 0.3).mean()), 4), 'share over the top', round(float((out > F['top']).mean()), 5), 'percentiles 1 50 99', np.round(np.percentile(out, [1, 50, 99]), 3), flush=True)
    print('step across the wrap against the step beside it: columns', round(seam[0], 4), round(seam[1], 4), 'rows', round(seam[2], 4), round(seam[3], 4), flush=True)
    np.save(WORK / 'tile.npy', out.astype(np.float32))
    Image.fromarray((np.clip(np.tile(out, (2, 2))[::2, ::2] / F['top'], 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)).save(WORK / 'tile-view.jpg', quality=90)


def write():
    out = np.load(WORK / 'tile.npy')
    sizes = {}
    for key, period in (('full', F['period']), ('web', F['period'] // 2)):
        t = out if period == out.shape[0] else cv2.resize(out, (period, period), interpolation=cv2.INTER_AREA)
        g = int(period * F['guardShare'])
        img = np.concatenate([t[-g:], t, t[:g]], 0)
        Image.fromarray((np.clip(img / F['top'], 0, 1) * 255 + 0.5).astype(np.uint8), 'L').save(PUBLIC / key / F['file'], optimize=True)
        sizes[key] = [period, period + 2 * g]
        print(key, F['file'], img.shape, (PUBLIC / key / F['file']).stat().st_size, 'mean', round(float(t.mean()), 4))
    OUT.write_text(json.dumps({'file': F['file'], 'top': F['top'], 'guardShare': F['guardShare'], 'size': sizes}, indent=1) + '\n')


if __name__ == '__main__':
    {'tile': tile, 'write': write}[sys.argv[1]]()
