import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'out/work/jupiter/patches'
GEN = ROOT / 'out/work/jupiter/gen'
SPEC = json.loads((ROOT / 'src/stops/jupiter/patches.json').read_text())
CENTRE = SPEC['centre']
LEVELS = SPEC['levels']
TILE = 2240
STEP = 4096 - TILE


def frame():
    lon, lat = np.radians(CENTRE['lon']), np.radians(CENTRE['lat'])
    n = np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])
    east = np.cross([0.0, 1.0, 0.0], n)
    east /= np.linalg.norm(east)
    north = np.cross(n, east)
    return n, east, north


def load(path):
    return np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)


def save(arr, path, quality=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8))
    if quality:
        img.save(path, quality=quality, subsampling=0)
    else:
        img.save(path)


def resize(arr, size):
    return np.asarray(Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8)).resize((size, size), Image.LANCZOS), dtype=np.float32)


def blur(arr, sigma):
    return ndimage.gaussian_filter(arr, (sigma, sigma, 0), mode='nearest')


def from_wrap(width_deg, size):
    wrap = load(ROOT / 'public/assets/jupiter/full/wrap-color.jpg')
    h, w = wrap.shape[:2]
    n, east, north = frame()
    half = np.tan(np.radians(width_deg) / 2)
    c = (np.arange(size) + 0.5) / size
    x = (c[None, :] - 0.5) * 2 * half
    y = (0.5 - c[:, None]) * 2 * half
    d = n[None, None, :] + x[..., None] * east[None, None, :] + y[..., None] * north[None, None, :]
    d /= np.linalg.norm(d, axis=2, keepdims=True)
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    u = (lon / (2 * np.pi) + 0.5) * w - 0.5
    v = (0.5 - lat / np.pi) * h - 0.5
    out = np.empty((size, size, 3), np.float32)
    for k in range(3):
        out[..., k] = ndimage.map_coordinates(wrap[..., k], [v, u], order=3, mode='grid-wrap')
    return out


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def tile_origins():
    return [(0, 0), (STEP, 0), (0, STEP), (STEP, STEP)]


def base(level):
    i = LEVELS.index(next(l for l in LEVELS if l['id'] == level))
    parent = load(WORK / (LEVELS[i - 1]['id'] + '.png'))
    size = parent.shape[0]
    ratio = np.tan(np.radians(LEVELS[i]['widthDeg']) / 2) / np.tan(np.radians(LEVELS[i - 1]['widthDeg']) / 2)
    crop = int(round(size * ratio / 2)) * 2
    a = (size - crop) // 2
    out = resize(parent[a:a + crop, a:a + crop], 4096)
    save(out, WORK / (level + '-base.png'))
    save(resize(out, 2048), GEN / ('patch_' + level + '_global_in.png'))
    print(level, 'base from', LEVELS[i - 1]['id'], 'crop', crop, 'ratio', round(ratio, 4))


def lock(level, name, sigma=6.0, gain=1.0):
    b = load(WORK / (level + '-base.png'))
    g = load(GEN / name)
    if g.shape[0] != 2048:
        g = resize(g, 2048)
    small = resize(b, 2048)
    g = (g - blur(g, sigma)) * gain + blur(small, sigma)
    out = resize(g, 4096)
    save(out, WORK / (level + '-global.png'))
    hp = lambda a: float((a - blur(a, 2)).std())
    print(level, 'global locked; fine detail std at 2048: base', round(hp(small), 3), 'painted', round(hp(g), 3))
    for k, (x, y) in enumerate(tile_origins()):
        save(resize(out[y:y + TILE, x:x + TILE], 2048), GEN / ('patch_' + level + '_t' + str(k) + '_in.png'))


def assemble(level, sigma=5.0, gain=1.0, takes=None):
    b = load(WORK / (level + '-global.png'))
    acc = np.zeros_like(b)
    wsum = np.zeros(b.shape[:2], np.float32)
    ramp = np.ones(TILE, np.float32)
    lap = TILE - STEP
    edge = smooth((np.arange(lap) + 0.5) / lap)
    for k, (x, y) in enumerate(tile_origins()):
        name = (takes or {}).get(str(k), 'patch_' + level + '_t' + str(k) + '_sd5.png')
        g = load(GEN / name)
        if g.shape[0] != TILE:
            g = resize(g, TILE)
        ref = b[y:y + TILE, x:x + TILE]
        g = (g - blur(g, sigma * TILE / 2048)) * gain + blur(ref, sigma * TILE / 2048)
        wx = ramp.copy()
        wy = ramp.copy()
        if x > 0:
            wx[:lap] = edge
        else:
            wx[-lap:] = edge[::-1]
        if y > 0:
            wy[:lap] = edge
        else:
            wy[-lap:] = edge[::-1]
        wgt = wy[:, None] * wx[None, :]
        acc[y:y + TILE, x:x + TILE] += g * wgt[..., None]
        wsum[y:y + TILE, x:x + TILE] += wgt
    out = acc / np.maximum(wsum, 1e-6)[..., None]
    save(out, WORK / (level + '.png'))
    hp = lambda a: float((a - blur(a, 2)).std())
    print(level, 'assembled; fine detail std base', round(hp(b), 3), 'painted', round(hp(out), 3))


def nest():
    for i in range(len(LEVELS) - 1, 0, -1):
        child = load(WORK / (LEVELS[i]['id'] + ('-nested.png' if i < len(LEVELS) - 1 else '.png')))
        if i == len(LEVELS) - 1:
            save(child, WORK / (LEVELS[i]['id'] + '-nested.png'))
        parent = load(WORK / (LEVELS[i - 1]['id'] + '.png'))
        size = parent.shape[0]
        ratio = np.tan(np.radians(LEVELS[i]['widthDeg']) / 2) / np.tan(np.radians(LEVELS[i - 1]['widthDeg']) / 2)
        crop = int(round(size * ratio / 2)) * 2
        a = (size - crop) // 2
        small = resize(child, crop)
        c = (np.arange(crop) + 0.5) / crop
        m = np.maximum(np.abs(c[None, :] - 0.5), np.abs(c[:, None] - 0.5))
        wgt = smooth((0.5 - m) / 0.1)[..., None]
        parent[a:a + crop, a:a + crop] = parent[a:a + crop, a:a + crop] * (1 - wgt) + small * wgt
        save(parent, WORK / (LEVELS[i - 1]['id'] + '-nested.png'))
        print('nested', LEVELS[i]['id'], 'into', LEVELS[i - 1]['id'])


def write():
    for l in LEVELS:
        img = load(WORK / (l['id'] + '-nested.png'))
        if img.shape[0] != l['size']:
            img = resize(img, l['size'])
        save(img, ROOT / 'public/assets/jupiter/full' / l['file'], 93)
        save(resize(img, l['size'] // 2), ROOT / 'public/assets/jupiter/web' / l['file'], 90)
        print(l['file'], img.shape)


if __name__ == '__main__':
    cmd = sys.argv[1]
    WORK.mkdir(parents=True, exist_ok=True)
    if cmd == 'wide':
        l = LEVELS[0]
        save(from_wrap(l['widthDeg'], l['size'] // 2), WORK / (l['id'] + '-half.png'))
        save(from_wrap(l['widthDeg'], l['size']), WORK / (l['id'] + '-direct.png'))
    elif cmd == 'base':
        base(sys.argv[2])
    elif cmd == 'lock':
        lock(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 6.0, float(sys.argv[5]) if len(sys.argv) > 5 else 1.0)
    elif cmd == 'assemble':
        takes = dict(a.split('=') for a in sys.argv[5:])
        assemble(sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 5.0, float(sys.argv[4]) if len(sys.argv) > 4 else 1.0, takes)
    elif cmd == 'nest':
        nest()
    elif cmd == 'write':
        write()
