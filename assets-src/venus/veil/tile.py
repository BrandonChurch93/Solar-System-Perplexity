"""Cloud tile for the cover veil: the finest dive patch made periodic.

python3 assets-src/venus/veil/tile.py

Reads public/assets/venus/full/patch-d.jpg, evens out its large scale brightness, and closes it on
itself along x and then along y: the last fifth of the tile is laid over the first fifth and the two
are joined along the path where they differ least, with a short feather. Nothing is cross faded, so no
cloud appears twice. The engine's loader repeats a texture along u only, so the file carries the tile
with PAD of itself repeated above and below (v of the tile from -PAD to 1 + PAD) and the shader wraps v
itself. Highlights above KNEE (linear luma) are rolled off toward CEIL, so the few burnt out cloud tops
of the patch do not show as flat pale shapes when a sheet is close. Writes public/assets/venus/full/veil-clouds.jpg (2048) and public/assets/venus/web/veil-clouds.jpg
(1024), and src/stops/venus/veil.json with the pad, the mean of the linear texel values and the 95 percent
quantile of their luma, which veil.ts reads.
"""
import json
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

SIZE = 2048
LAP = 0.2
FEATHER = 6
KNEE = 0.35
CEIL = 0.6
PAD = 0.125


def lin(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def enc(x):
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.clip(x, 0, None) ** (1 / 2.4) - 0.055)


def periodic(a, axis):
    if axis == 0:
        return periodic(a.transpose(1, 0, 2), 1).transpose(1, 0, 2)
    h, w, _ = a.shape
    lap = int(w * LAP)
    first = a[:, :lap]
    last = a[:, w - lap:]
    cost = gaussian_filter(np.abs(first - last).sum(axis=2), 2) + 1e-4
    total = cost.copy()
    for y in range(1, h):
        prev = total[y - 1]
        best = np.minimum(prev, np.minimum(np.roll(prev, 1), np.roll(prev, -1)))
        best[0] = min(prev[0], prev[1])
        best[-1] = min(prev[-1], prev[-2])
        total[y] += best
    path = np.zeros(h, dtype=int)
    path[-1] = int(np.argmin(total[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]
        lo = max(x - 1, 0)
        path[y] = lo + int(np.argmin(total[y, lo:min(x + 2, lap)]))
    mask = (np.arange(lap)[None, :] >= path[:, None]).astype(np.float64)
    mask = gaussian_filter(mask, FEATHER)[..., None]
    joined = last * (1 - mask) + first * mask
    return np.concatenate([a[:, lap:w - lap], joined], axis=1)


src = Image.open('public/assets/venus/full/patch-d.jpg').convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
a = lin(np.asarray(src, dtype=np.float64) / 255)
low = np.stack([gaussian_filter(a[..., c], SIZE / 5, mode='reflect') for c in range(3)], axis=-1)
a = a / low * a.mean(axis=(0, 1), keepdims=True)
a = np.clip(periodic(periodic(a, 1), 0), 0, 1)
lum = a @ np.array([0.2126, 0.7152, 0.0722])
over = np.clip(lum - KNEE, 0, None)
a = a * ((KNEE + over / (1 + over / (CEIL - KNEE))) / np.maximum(lum, 1e-6) * (lum > KNEE) + (lum <= KNEE))[..., None]
mean = [round(float(v), 4) for v in a.mean(axis=(0, 1))]
lum = a @ np.array([0.2126, 0.7152, 0.0722])
top = round(float(np.quantile(lum, 0.95)), 4)
print('tile', a.shape, 'mean linear', mean, 'luma 95 percent', top)
tile = Image.fromarray((enc(a) * 255 + 0.5).astype(np.uint8))
n = tile.size[0]
pad = int(round(n * PAD))
tall = Image.new('RGB', (n, n + 2 * pad))
for y in (pad - n, pad, pad + n):
    tall.paste(tile, (0, y))
out = tall.resize((SIZE, SIZE), Image.LANCZOS)
out.save('public/assets/venus/full/veil-clouds.jpg', quality=90)
out.resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save('public/assets/venus/web/veil-clouds.jpg', quality=90)
with open('src/stops/venus/veil.json', 'w') as f:
    json.dump({'file': 'veil-clouds.jpg', 'pad': pad / n, 'mean': mean, 'top': top}, f, indent=2)
    f.write('\n')
half = tile.resize((512, 512), Image.LANCZOS)
tiled = Image.new('RGB', (1024, 1024))
for x in (0, 1):
    for y in (0, 1):
        tiled.paste(half, (x * 512, y * 512))
tiled.save('out/work/venus/veil-tiled.jpg', quality=88)
