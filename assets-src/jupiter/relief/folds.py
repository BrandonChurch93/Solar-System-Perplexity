import sys

import cv2
import numpy as np

WORK = 'out/work/jupiter/relief'
GEN = 'out/work/jupiter/gen'
W, H = 2816, 1584
WIN = {'left': (0, 1188), 'right': (2112, 1188)}
SIZE = (3520, 1980)
SIGMA = 18.0
GAIN = 0.85
LIFT = 6.0
OVERLAP = 1300
TOP = (1520, 1800)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def luma(a):
    return a @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def prep():
    core = np.load(f'{WORK}/core-final.npy')
    for name, (x, y) in WIN.items():
        tile = cv2.resize(core[y:y + SIZE[1], x:x + SIZE[0]], (W, H), interpolation=cv2.INTER_AREA)
        cv2.imwrite(f'{GEN}/folds_{name}_in.png', np.clip(np.round(tile[..., ::-1]), 0, 255).astype(np.uint8))
        cv2.imwrite(f'out/work/view/folds_{name}_in.jpg', cv2.resize(tile[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])


def shift(a, b):
    wa = cv2.createHanningWindow((a.shape[1], a.shape[0]), cv2.CV_32F)
    (dx, dy), peak = cv2.phaseCorrelate(a.astype(np.float32), b.astype(np.float32), wa)
    return dx, dy, peak


def fine(name, path):
    core = np.load(f'{WORK}/core-final.npy')
    x, y = WIN[name]
    old = core[y:y + SIZE[1], x:x + SIZE[0]]
    gen = cv2.imread(path)[..., ::-1].astype(np.float32)
    gen = cv2.resize(gen, SIZE, interpolation=cv2.INTER_LANCZOS4)
    lo, lg = luma(old), luma(gen)
    dx, dy, peak = shift(blur(lo, 6) - blur(lo, 40), blur(lg, 6) - blur(lg, 40))
    gen = cv2.warpAffine(gen, np.float32([[1, 0, -dx], [0, 1, -dy]]), SIZE, flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    for c in range(3):
        a, b = np.polyfit(gen[..., c].ravel()[::53], old[..., c].ravel()[::53], 1)
        gen[..., c] = gen[..., c] * a + b
    diff = np.abs(blur(gen, 20) - blur(old, 20)).mean()
    print(name, 'shift', round(dx, 2), round(dy, 2), 'peak', round(peak, 3), 'low pass mean abs difference', round(float(diff), 2))
    np.save(f'{WORK}/folds-{name}.npy', gen)


def merge():
    import os
    base = f'{WORK}/core-final.before-folds.npy'
    if not os.path.exists(base):
        np.save(base, np.load(f'{WORK}/core-final.npy'))
    core = np.load(base)
    lc = np.log(core + LIFT)
    extra = np.zeros_like(core)
    weight = np.zeros(core.shape[:2], np.float32)
    for name, (x, y) in WIN.items():
        lg = np.log(np.clip(np.load(f'{WORK}/folds-{name}.npy'), 0, 255) + LIFT)
        old = lc[y:y + SIZE[1], x:x + SIZE[0]]
        more = (lg - blur(lg, SIGMA)) - (old - blur(old, SIGMA))
        ramp = np.clip(np.arange(SIZE[0], dtype=np.float32) / OVERLAP, 0, 1)
        ramp = ramp * ramp * (3 - 2 * ramp)
        w = np.broadcast_to((ramp if name == 'right' else ramp[::-1])[None, :], SIZE[::-1]).astype(np.float32)
        extra[y:y + SIZE[1], x:x + SIZE[0]] += more * w[..., None]
        weight[y:y + SIZE[1], x:x + SIZE[0]] += w
    extra /= np.maximum(weight, 1e-3)[..., None]
    rows = np.clip((np.arange(core.shape[0], dtype=np.float32) - TOP[0]) / (TOP[1] - TOP[0]), 0, 1)
    mask = (rows * rows * (3 - 2 * rows))[:, None] * np.clip(weight, 0, 1)
    out = np.clip(np.exp(lc + GAIN * extra * mask[..., None]) - LIFT, 0, 255).astype(np.float32)
    np.save(f'{WORK}/core-final.npy', out)
    for tag, a in (('before', core), ('after', out)):
        cv2.imwrite(f'out/work/view/folds_{tag}.png', np.clip(np.round(cv2.resize(a[1188:, :, ::-1], (1920, 675), interpolation=cv2.INTER_AREA)), 0, 255).astype(np.uint8))
    print('mean abs change', round(float(np.abs(out - core).mean()), 3), 'in the mask', round(float(np.abs(out - core)[mask > 0.5].mean()), 3), 'low pass change', round(float(np.abs(blur(out, SIGMA) - blur(core, SIGMA))[mask > 0.5].mean()), 3))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'prep':
        prep()
    elif cmd == 'fine':
        fine(sys.argv[2], sys.argv[3])
    elif cmd == 'merge':
        merge()
