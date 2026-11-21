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
    moved = cv2.warpAffine(take, warp, (w, h), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    m = keep > 0
    a = src[m].astype(np.float64).mean(0)
    b = moved[m].astype(np.float64).mean(0)
    diff = float(np.abs(src[m].astype(np.float64) - moved[m]).mean())
    o = moved.astype(np.float32)
    hot = step(o.max(axis=2), 170, 245)[..., None]
    moved = np.clip(o * ((a / b)[None, None, :] * (1 - hot) + hot), 0, 255)
    alpha = np.clip(cv2.GaussianBlur(grey.astype(np.float32), (0, 0), 8) * 2, 0, 1)[..., None]
    canvas = read(CANVAS)
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
    if cmd == 'build':
        build()
