import json, sys
import numpy as np
import cv2
from common import WORK, read, write, step
from apron import weights

OUT = (5504, 1548)
TILE = 2752
AT = {'C': 1376, 'L': 0, 'R': 2752}
GREY_FROM = 0.4
MARGIN = 160
EDGE = 12
FEATHER = 3
CANVAS = f'{WORK}/apron2-canvas.png'
DONE = f'{WORK}/apron2-done.png'


def weight():
    w, _ = weights((OUT[0] // 2, OUT[1]))
    return cv2.resize(w[OUT[1] // 2:], OUT, interpolation=cv2.INTER_LINEAR)


def start():
    base = read(f'{WORK}/apron2-base-low-x.png')
    assert base.shape[1] == OUT[0] and base.shape[0] == OUT[1], base.shape
    write(CANVAS, base)
    write(DONE, np.zeros((OUT[1], OUT[0], 3), np.uint8))
    w = weight()
    print('grey share of the lower half', round(float((w >= GREY_FROM).mean()), 3))


def tile_input(name):
    x = AT[name]
    canvas = read(CANVAS)
    done = read(DONE)[..., 0] > 0
    grey = (weight() >= GREY_FROM) & ~done
    out = canvas.copy()
    out[grey] = 128
    write(f'{WORK}/apron2-input-{name}.png', out[:, x:x + TILE])
    write(f'{WORK}/apron2-grey-{name}.png', np.repeat((grey[:, x:x + TILE] * 255).astype(np.uint8)[..., None], 3, -1))
    print(name, 'grey share of the tile', round(float(grey[:, x:x + TILE].mean()), 3))


def place(name):
    x = AT[name]
    src = read(f'{WORK}/apron2-input-{name}.png')
    grey = read(f'{WORK}/apron2-grey-{name}.png')[..., 0] > 0
    take = read(f'{WORK}/apron2-take-{name}.png')
    h, w = src.shape[:2]
    take = cv2.resize(take, (w, h), interpolation=cv2.INTER_LANCZOS4)
    keep = cv2.erode((~grey).astype(np.uint8) * 255, np.ones((41, 41), np.uint8))
    k = 4
    small = lambda a, i: cv2.resize(a, (w // k, h // k), interpolation=i)
    g0 = small(cv2.cvtColor(src, cv2.COLOR_RGB2GRAY), cv2.INTER_AREA).astype(np.float32) / 255
    g1 = small(cv2.cvtColor(take, cv2.COLOR_RGB2GRAY), cv2.INTER_AREA).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), small(keep, cv2.INTER_NEAREST), 5)
    warp[:, 2] *= k
    moved = cv2.warpAffine(take, warp, (w, h), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT_101)
    m = keep > 0
    a = src[m].astype(np.float64).mean(0)
    b = moved[m].astype(np.float64).mean(0)
    diff = float(np.abs(src[m].astype(np.float64) - moved[m]).mean())
    o = moved.astype(np.float32)
    hot = step(o.max(axis=2), 170, 245)[..., None]
    moved = np.clip(o * ((a / b)[None, None, :] * (1 - hot) + hot), 0, 255)
    alpha = np.clip(cv2.GaussianBlur(grey.astype(np.float32), (0, 0), 8) * 2, 0, 1)[..., None]
    canvas = read(CANVAS)
    if name != 'C':
        alpha = alpha * cut(name, grey, canvas[:, x:x + w].astype(np.float32), moved)[..., None]
    canvas[:, x:x + w] = np.clip(canvas[:, x:x + w] * (1 - alpha) + moved * alpha, 0, 255).astype(np.uint8)
    write(CANVAS, canvas)
    done = read(DONE)
    inner = grey.copy()
    if name == 'C':
        inner[:, :MARGIN] = False
        inner[:, w - MARGIN:] = False
    done[:, x:x + w][inner] = 255
    write(DONE, done)
    json.dump({'matrix': warp.tolist(), 'cc': float(cc), 'means': [a.tolist(), b.tolist()], 'kept difference': diff}, open(f'{WORK}/apron2-place-{name}.json', 'w'))
    print(name, 'cc', round(float(cc), 4), 'matrix', warp.round(4).tolist(), 'kept ground: mean abs difference', round(diff, 2), 'means', a.round(1), b.round(1))


def mend(name, other, box):
    x0, y0, x1, y1 = box
    take = read(f'{WORK}/apron2-take-{name}.png')
    donor = read(f'{WORK}/apron2-take-{other}.png')
    h, w = take.shape[:2]
    patch = donor[y0:y1, w - x1:w - x0][:, ::-1].copy()
    pad = 48
    big = cv2.copyMakeBorder(take, pad, pad, pad, pad, cv2.BORDER_REFLECT_101)
    src = cv2.copyMakeBorder(patch, pad, pad, pad, pad, cv2.BORDER_REFLECT_101)
    mask = np.zeros(src.shape[:2], np.uint8)
    ph, pw = patch.shape[:2]
    yy, xx = np.mgrid[0:src.shape[0], 0:src.shape[1]].astype(np.float32)
    inside = ((xx - pad) / pw) ** 4 + ((ph + pad - yy) / ph) ** 4 < 0.82
    mask[inside] = 255
    mask[:8] = 0
    mask[:, -8:] = 0
    mask[-8:] = 0
    mask[:, :8] = 0
    centre = (x0 + pad + pw // 2, y0 + pad + ph // 2)
    ys, xs = np.nonzero(mask)
    cx, cy = (int(xs.min()) + int(xs.max())) // 2, (int(ys.min()) + int(ys.max())) // 2
    centre = (x0 + cx, y0 + cy)
    out = cv2.seamlessClone(cv2.cvtColor(src, cv2.COLOR_RGB2BGR), cv2.cvtColor(big, cv2.COLOR_RGB2BGR), mask, centre, cv2.NORMAL_CLONE)
    out = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)[pad:pad + h, pad:pad + w]
    write(f'{WORK}/apron2-take-{name}.png', out)
    print(name, 'mended from', other, box, 'changed share', round(float((np.abs(out.astype(np.int32) - take).sum(axis=2) > 6).mean()), 4))


def cut(name, grey, old, new):
    h, w = grey.shape
    lo, hi = (AT['C'] - AT[name], AT['C'] + MARGIN - AT[name]) if name == 'L' else (AT['C'] + TILE - MARGIN - AT[name], AT['C'] + TILE - AT[name])
    lo, hi = lo + EDGE, hi - EDGE
    rows = np.nonzero(grey[:, lo:hi].all(axis=1))[0]
    top, n = int(rows.min()), hi - lo
    cost = cv2.GaussianBlur(np.abs(old - new).sum(axis=2), (0, 0), 2)[top:, lo:hi].astype(np.float64)
    acc = cost.copy()
    for r in range(1, acc.shape[0]):
        prev = acc[r - 1]
        best = np.minimum(prev, np.minimum(np.concatenate(([np.inf], prev[:-1])), np.concatenate((prev[1:], [np.inf]))))
        acc[r] += best
    path = np.zeros(acc.shape[0], np.int32)
    path[-1] = int(np.argmin(acc[-1]))
    for r in range(acc.shape[0] - 2, -1, -1):
        c = path[r + 1]
        a, b = max(c - 1, 0), min(c + 2, n)
        path[r] = a + int(np.argmin(acc[r, a:b]))
    side = np.ones((h, w), np.float32)
    cols = np.arange(w)[None, :]
    line = (lo + path)[:, None]
    side[top:] = (cols < line) if name == 'L' else (cols >= line)
    print(name, 'cut: mean cost on the path', round(float(cost[np.arange(len(path)), path].mean()), 1), 'in the band', round(float(cost.mean()), 1), 'columns', int(path.min()) + lo, 'to', int(path.max()) + lo)
    return cv2.GaussianBlur(side, (0, 0), FEATHER)


def build():
    out = read(CANVAS)
    for name, size, q in (('full', OUT, 92), ('web', (OUT[0] // 2, OUT[1] // 2), 88)):
        write(f'public/assets/sun/{name}/apron.jpg', out if size == OUT else cv2.resize(out, size, interpolation=cv2.INTER_AREA), q)
    print('apron', OUT)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'start':
        start()
    if cmd == 'input':
        tile_input(sys.argv[2])
    if cmd == 'place':
        place(sys.argv[2])
    if cmd == 'mend':
        mend(sys.argv[2], sys.argv[3], [int(v) for v in sys.argv[4:8]])
    if cmd == 'build':
        build()
