import io
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import mosaic as M
import plates as P

SPEC = P.SPEC
R = SPEC['relay']
TILES = json.loads((Path(__file__).parent / 'tiles.json').read_text())
OUT = M.WORK / 'relay'
PASSES = ['', '-dim', '-matte', '-sky']


def carry():
    line = re.search(r'export const carry = \{(.*)\}', (M.ROOT / 'src/stops/mercury/look.ts').read_text()).group(1)
    return [float(re.search(name + r': ([-\d.]+)', line).group(1)) for name in ('lift', 'knee')]


def base(name):
    data = subprocess.run(['git', 'show', '%s:public/assets/mercury/full/%s' % (R['old'], name)], cwd=M.ROOT, check=True, capture_output=True).stdout
    return P.unfilmic(M.linear(np.asarray(Image.open(io.BytesIO(data)).convert('RGB')))).astype(np.float32)


def ring_of(level):
    close = json.loads((M.WORK / 'tiles/cameras.json').read_text())['close']
    o = np.array(close['origin'])
    o = o / np.linalg.norm(o)
    gx, gy = M.grid((0, 0), level['widthDeg'], SPEC['size'])
    deg = np.degrees(np.arccos(np.clip(M.dirs(gx, gy) @ o, -1, 1)))
    return (1 - P.step(R['ringDeg'][0], R['ringDeg'][1], deg)).astype(np.float32), deg.astype(np.float32)


def lay(kind):
    s = SPEC['sets'][kind]
    levels = [lv for lv in SPEC['levels'] if lv['n'] in s['levels']]
    folder = OUT / kind
    folder.mkdir(parents=True, exist_ok=True)
    for name in PASSES:
        place = M.Place(kind, folder=M.WORK / 'tiles' / (R['tiles'] + kind + name), feather=R['featherPx'])
        for lv in levels:
            ring, deg = ring_of(lv)
            rgb, elong, gsd = P.lay(place, lv['widthDeg'], SPEC['size'], lv['ss'], ring)
            np.save(folder / ('lay-%d%s.npy' % (lv['n'], name)), rgb.astype(np.float16))
            print(kind, 'level', lv['n'], 'pass', name or 'colour', 'laid', flush=True)
        del place


def blend(kind):
    own = json.loads((M.ROOT / 'src/stops/mercury/own.json').read_text())
    lift, knee = carry()
    top = float(P.unfilmic(np.float32(0.985))) * own['gain']
    s = SPEC['sets'][kind]
    folder = OUT / kind
    for lv in SPEC['levels']:
        n = lv['n']
        if n not in s['levels']:
            continue
        c, d, m, k = (np.load(folder / ('lay-%d%s.npy' % (n, name))).astype(np.float32) for name in PASSES)
        ring, deg = ring_of(lv)
        a = np.clip((m - k).mean(-1) / np.maximum((TILES['matte'] - k).mean(-1), 1e-3), 0, 1)
        cover = np.maximum(a, 1e-3)[..., None]
        one = np.maximum(c - (1 - a[..., None]) * k, 0) / cover
        dim = np.maximum(d - (1 - a[..., None]) * k, 0) / cover / TILES['dim']
        t = P.step(R['clip'][0], R['clip'][1], one.max(-1))[..., None]
        seen = one * (1 - t) + dim * t
        peak = seen.max(-1, keepdims=True)
        bare = seen / np.maximum(lift - peak * (lift - 1) * knee, R['floor'])
        high = bare.max(-1, keepdims=True)
        over = float(((high > top) & (a[..., None] > 0.5) & (ring[..., None] > 0.5)).mean())
        bare = bare * np.minimum(1, top / np.maximum(high, 1e-6))
        new = bare / own['gain']
        name = 'patch-%d%s.jpg' % (n, s['suffix'])
        old = base('patch-%d%s.jpg' % (n, R['base']))
        w = (P.step(R['alpha'][0], R['alpha'][1], a) * ring)[..., None]
        tex = w * new + (1 - w) * old
        P.write(tex.astype(np.float32), name, folder)
        code = lambda x: M.srgb(P.filmic(x)) * 255
        diff = np.abs(code(new) - code(old)).mean(-1)
        rows = []
        for r0, r1 in ((0, 1), (1, 2), (2, 3), (3, 4.5)):
            at = (deg >= r0) & (deg < r1) & (w[..., 0] > 0.99)
            rows.append('%g to %g deg: %.1f codes over %.3f of the ring' % (r0, r1, float(diff[at].mean()) if at.any() else 0, float(at.sum() / max(((deg >= r0) & (deg < r1)).sum(), 1))))
        print(kind, 'level', n, 'share of the plate from the set', round(float((w > 0.99).mean()), 4), 'share over the top', round(over, 5), 'from the dim pass', round(float(((t[..., 0] > 0.5) & (w[..., 0] > 0.5)).mean()), 5), flush=True)
        print('  set against the plate before, mean difference in codes: ' + '; '.join(rows), flush=True)
        np.save(folder / ('weight-%d.npy' % n), w[..., 0].astype(np.float16))


def install(kind):
    for key in ('full', 'web'):
        for f in sorted((OUT / kind / key).iterdir()):
            (P.PUBLIC / key / f.name).write_bytes(f.read_bytes())
            print('installed', key, f.name, f.stat().st_size)
    eye = json.loads((M.WORK / 'tiles/cameras.json').read_text())[kind]
    path = Path(__file__).parent / 'lay.json'
    lays = json.loads(path.read_text()) if path.exists() else {}
    lays[kind] = {k: eye[k] for k in ('atFrame', 'position', 'heightRadii', 'nadir')}
    path.write_text(json.dumps(lays, indent=1) + '\n')
    print('recorded the eye of the lay in', path.name)


if __name__ == '__main__':
    {'lay': lay, 'blend': blend, 'install': install}[sys.argv[1]](sys.argv[2])
