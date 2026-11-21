import json
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import flowcheck
import geo

Image.MAX_IMAGE_PIXELS = None
HERE = 'assets-src/mercury/patches'
WORK = 'out/work/mercury/patches'
CFG = json.load(open(HERE + '/patches.json'))
WRAP = 'public/assets/mercury/full/wrap-color.jpg'
SIZE = 4096
TILE = 2240
IN = 2048
LOCK = 26.0
SEAM = 128
EDGE = 200
CLEAN = 7
WIDTHS = [p['widthDeg'] for p in CFG['patches']]


def origins(level):
    c = CFG['patches'][level - 1].get('centre', [0.5, 0.5])
    far = SIZE - TILE
    cx = int(min(max(c[0] * SIZE - TILE / 2, 0), far))
    cy = int(min(max(c[1] * SIZE - TILE / 2, 0), far))
    return {'tl': (0, 0), 'tr': (far, 0), 'bl': (0, far), 'br': (far, far), 'c': (cx, cy)}


def run(*a):
    subprocess.run(['python3', HERE + '/resample.py'] + [str(x) for x in a], check=True, stdout=subprocess.DEVNULL)


def cut(level):
    parent = f'{WORK}/L{level}-parent.png'
    if level == 1:
        run('to-patch', '--map', WRAP, '--width-deg', WIDTHS[0], '--size', SIZE, '--config', HERE + '/patches.json', '--out', parent)
    else:
        run('subpatch', '--parent', f'{WORK}/L{level - 1}.png', '--parent-deg', WIDTHS[level - 2], '--child-deg', WIDTHS[level - 1], '--size', SIZE, '--out', parent)
    im = Image.open(parent).convert('RGB')
    if level == 1:
        im = Image.fromarray(cv2.medianBlur(np.asarray(im), CLEAN))
    for k, (x, y) in origins(level).items():
        im.crop((x, y, x + TILE, y + TILE)).resize((IN, IN), Image.LANCZOS).save(f'{WORK}/L{level}-in-{k}.jpg', quality=95, subsampling=0)
    print('cut', level, origins(level))


def lock_low(t, ref, sigma):
    lt, lr = np.log(np.maximum(t, 4e-3)), np.log(np.maximum(ref, 4e-3))
    return np.exp(lt - geo.blur(lt, sigma) + geo.blur(lr, sigma)).astype(np.float32)


def register(take, ref_path, take_path):
    f, _, st = flowcheck.flow_stats(ref_path, take_path, 1024)
    n = take.shape[0]
    f = cv2.GaussianBlur(f, (0, 0), 24)
    f = cv2.resize(f, (n, n), interpolation=cv2.INTER_CUBIC) * (n / 1024)
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    out = cv2.remap(take, xx + f[..., 0], yy + f[..., 1], cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    return out, st


def ramp(n, lo, hi):
    t = np.clip((np.arange(n) - lo) / max(hi - lo, 1), 0, 1)
    return t * t * (3 - 2 * t)


def build(level, takes):
    parent = geo.to_linear(np.asarray(Image.open(f'{WORK}/L{level}-parent.png').convert('RGB'), np.float32) / 255)
    org = origins(level)
    acc = np.zeros((SIZE, SIZE, 3), np.float32)
    wacc = np.zeros((SIZE, SIZE), np.float32)
    mid = SIZE // 2
    up = ramp(SIZE, mid - SEAM // 2, mid + SEAM // 2)
    centre = None
    for k, (x, y) in org.items():
        tk = takes.get(k)
        if not tk:
            continue
        tk, _, src = tk.partition('@')
        src = f'{WORK}/L{level}-{src or "in"}-{k}.jpg'
        t = np.asarray(Image.open(f'{WORK}/L{level}-{tk}-{k}.png').convert('RGB').resize((TILE, TILE), Image.LANCZOS), np.float32) / 255
        t, st = register(t, src, f'{WORK}/L{level}-{tk}-{k}.png')
        print(f'  {k} {tk}: flow before registration median {st[0]:.2f} p99 {st[2]:.2f} px at 1024')
        ref = parent[y:y + TILE, x:x + TILE]
        if not src.endswith(f'-in-{k}.jpg'):
            ref = geo.to_linear(np.asarray(Image.open(src).convert('RGB').resize((TILE, TILE), Image.LANCZOS), np.float32) / 255)
        t = lock_low(geo.to_linear(np.clip(t, 0, 1)), ref, LOCK)
        if k == 'c':
            e = ramp(TILE, 0, EDGE) * ramp(TILE, 0, EDGE)[::-1]
            centre = (t, np.outer(e, e).astype(np.float32), x, y)
            continue
        wx = (1 - up) if x == 0 else up
        wy = (1 - up) if y == 0 else up
        w = np.outer(wy[y:y + TILE], wx[x:x + TILE]).astype(np.float32)
        acc[y:y + TILE, x:x + TILE] += t * w[..., None]
        wacc[y:y + TILE, x:x + TILE] += w
    res = np.where(wacc[..., None] > 1e-4, acc / np.maximum(wacc, 1e-4)[..., None], parent)
    if centre is not None:
        t, w, x, y = centre
        res[y:y + TILE, x:x + TILE] = res[y:y + TILE, x:x + TILE] * (1 - w[..., None]) + t * w[..., None]
    out = (geo.to_srgb(res) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(out).save(f'{WORK}/L{level}.png')
    Image.fromarray(out).resize((1024, 1024), Image.LANCZOS).save(f'{WORK}/L{level}-view.jpg', quality=90)
    print('built', level, takes)


def crater(level):
    c = CFG['crater'][str(level)]
    src = cv2.GaussianBlur(cv2.imread(f'{WORK}/L{level}-{c["take"]}-c.png').astype(np.float32), (0, 0), 0.9)
    dst = cv2.imread(f'{WORK}/L{level}-in-c.jpg').astype(np.float32)
    (sx, sy, sa, sb), (dx, dy, da, db) = c['from'], c['to']
    yy, xx = np.mgrid[0:IN, 0:IN].astype(np.float32)
    u, v = (xx - dx) / da, (yy - dy) / db
    warp = cv2.remap(src, sx + u * sa, sy + v * sb, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    m = np.clip((1.32 - np.sqrt(u * u + v * v)) / 0.3, 0, 1)
    m = (m * m * (3 - 2 * m))[..., None]
    cv2.imwrite(f'{WORK}/L{level}-in2-c.jpg', np.clip(dst * (1 - m) + warp * m, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    print('crater', level, c)


def flow(level, take, src='in'):
    for k in origins(level):
        f = f'{WORK}/L{level}-{take}-{k}.png'
        if os.path.exists(f):
            _, _, s = flowcheck.flow_stats(f'{WORK}/L{level}-{src}-{k}.jpg', f, 1024)
            print(f'L{level} {take} {k}: flow median {s[0]:.2f} p90 {s[1]:.2f} p99 {s[2]:.2f} px at 1024')


def finish():
    n = len(WIDTHS)
    cur = f'{WORK}/L{n}.png'
    outs = {n: cur}
    for level in range(n - 1, 0, -1):
        out = f'{WORK}/L{level}-nested.png'
        run('nest', '--parent', f'{WORK}/L{level}.png', '--parent-deg', WIDTHS[level - 1], '--child', cur, '--child-deg', WIDTHS[level], '--feather', CFG['featherFraction'], '--out', out)
        outs[level] = out
        cur = out
    for level, src in outs.items():
        im = Image.open(src).convert('RGB')
        p = CFG['patches'][level - 1]
        im.save('public/assets/' + p['files']['full'], quality=94, subsampling=0)
        im.resize((2048, 2048), Image.LANCZOS).save('public/assets/' + p['files']['web'], quality=94, subsampling=0)
        print('wrote', p['files']['full'], os.path.getsize('public/assets/' + p['files']['full']) // 1024, 'kB', p['files']['web'], os.path.getsize('public/assets/' + p['files']['web']) // 1024, 'kB')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'cut':
        cut(int(sys.argv[2]))
    elif cmd == 'build':
        build(int(sys.argv[2]), json.loads(sys.argv[3]))
    elif cmd == 'flow':
        flow(int(sys.argv[2]), *sys.argv[3:5])
    elif cmd == 'crater':
        crater(int(sys.argv[2]))
    else:
        finish()
