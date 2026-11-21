import sys

import cv2
import numpy as np

WORK = 'out/work/jupiter/relief'
GEN = 'out/work/jupiter/gen'
SRC = 'references/approved/jupiter-close.jpg'
W, H = 2816, 1584
CW, CH = 5632, 3168
OX, OY = 1408, 792
TILES = {'left': (0, 792), 'right': (2816, 792), 'bottom': (1408, 1584), 'bl': (0, 1584), 'br': (2816, 1584), 'tl': (0, 0), 'tr': (2816, 0)}
STATE = f'{WORK}/canvas.npy'
KNOWN = f'{WORK}/known.npy'


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def init():
    canvas = np.full((CH, CW, 3), 128, np.float32)
    known = np.zeros((CH, CW), np.float32)
    canvas[OY:OY + H, OX:OX + W] = cv2.imread(SRC)[..., ::-1].astype(np.float32)
    known[OY:OY + H, OX:OX + W] = 1
    np.save(STATE, canvas)
    np.save(KNOWN, known)


def prep(name):
    canvas = np.load(STATE)
    known = np.load(KNOWN)
    x, y = TILES[name]
    tile = canvas[y:y + H, x:x + W].copy()
    tile[known[y:y + H, x:x + W] < 0.999] = 128
    cv2.imwrite(f'{GEN}/deck_{name}_in.png', np.round(tile[..., ::-1]).astype(np.uint8))
    cv2.imwrite(f'out/work/view/deck_{name}_in.jpg', cv2.resize(tile[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])


def place(name, path):
    canvas = np.load(STATE)
    known = np.load(KNOWN)
    x, y = TILES[name]
    gen = cv2.imread(path)[..., ::-1].astype(np.float32)
    if gen.shape[:2] != (H, W):
        gen = cv2.resize(gen, (W, H), interpolation=cv2.INTER_LANCZOS4)
    old = canvas[y:y + H, x:x + W]
    kn = known[y:y + H, x:x + W]
    hard = (kn > 0.999).astype(np.float32)
    diff = np.abs(gen - old).mean(2)[hard > 0]
    print(name, 'mean abs difference on the finished part', round(float(diff.mean()), 2), 'p95', round(float(np.percentile(diff, 95)), 2))
    sel = hard > 0
    for c in range(3):
        a, b = np.polyfit(gen[..., c][sel][::7], old[..., c][sel][::7], 1)
        gen[..., c] = gen[..., c] * a + b
    near = np.clip(1 - cv2.distanceTransform((hard > 0.5).astype(np.uint8), cv2.DIST_L2, 5) / 500, 0, 1) * hard
    wsum = blur(near, 160)
    ratio = blur(old * near[..., None], 160) / np.maximum(blur(gen * near[..., None], 160), 1e-3)
    ratio = np.clip(ratio, 0.4, 2.5)
    whole = (old * near[..., None]).sum((0, 1)) / np.maximum((gen * near[..., None]).sum((0, 1)), 1e-3)
    w = np.clip(wsum / 0.2, 0, 1)[..., None]
    ratio = ratio * w + whole * (1 - w)
    gen = np.clip(gen * ratio, 0, 255)
    dist = cv2.distanceTransform((hard < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    inner = cv2.distanceTransform((hard > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    take = np.clip((24 - inner) / 24, 0, 1)
    take = np.where(hard > 0.5, take * take * (3 - 2 * take), 1.0)[..., None].astype(np.float32)
    canvas[y:y + H, x:x + W] = gen * take + old * (1 - take)
    known[y:y + H, x:x + W] = 1
    np.save(STATE, canvas)
    np.save(KNOWN, known)
    view = canvas.copy()
    cv2.imwrite('out/work/view/deck_canvas.jpg', cv2.resize(view[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'init':
        init()
    elif cmd == 'prep':
        for n in sys.argv[2:]:
            prep(n)
    elif cmd == 'place':
        place(sys.argv[2], sys.argv[3])
    elif cmd == 'clear':
        canvas = np.load(STATE)
        known = np.load(KNOWN)
        x0, y0, x1, y1 = [int(v) for v in sys.argv[2:6]]
        canvas[y0:y1, x0:x1] = 128
        known[y0:y1, x0:x1] = 0
        np.save(STATE, canvas)
        np.save(KNOWN, known)
