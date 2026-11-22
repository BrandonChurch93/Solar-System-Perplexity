import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/terrain')
import geo
import tgeo as T

Image.MAX_IMAGE_PIXELS = None
PLATE = 'out/work/u/t/plate/wide.png'
WORK = 'out/work/u/gen3/'
BOX = (1536, 448, 7168, 3616)
BASE = (2752, 1548)
TAKE = WORK + 'l0-take2.png'
KEEP = 8.0
LIMB = (0.035, 0.11)
RIM = 200
DARK = (0.02, 0.12, 0.45)
WINDOW = 1024
XS = (0, 576, 1152, 1728)
YS = (0, 524)
SCALE = 2
SKIP = 0.1
FINE = 12.0
BAND = (4.0, 12.0, 60.0)
GAIN = (0.3, 1.4)
OUT = 'out/work/u/t/plate/wide-fine.png'


def coded(a):
    return np.log(geo.to_linear(a).astype(np.float32) + 0.02)


def decoded(l):
    return geo.to_srgb(np.clip(np.exp(l) - 0.02, 0, 1))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def window():
    plate = Image.open(PLATE).convert('RGB')
    return plate, np.asarray(plate.crop(BOX).resize(BASE, Image.LANCZOS), np.float32) / 255


def mask():
    w, h = Image.open(PLATE).size
    k = 4
    d = T.rays_wide(w // k, h // k)
    _, _, mu, hit = T.ground(d)
    m = smooth(LIMB[0], LIMB[1], np.where(hit, mu, 0.0)).astype(np.float32)
    m = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)[BOX[1]:BOX[3], BOX[0]:BOX[2]]
    y, x = np.mgrid[0:m.shape[0], 0:m.shape[1]].astype(np.float32)
    rim = np.minimum(np.minimum(x, m.shape[1] - 1 - x), m.shape[0] - 1 - y)
    return m * smooth(0, RIM, rim)


def align(src, out):
    a = cv2.GaussianBlur(src.mean(-1), (0, 0), 3)
    b = cv2.GaussianBlur(out.mean(-1), (0, 0), 3)
    a = a - cv2.GaussianBlur(a, (0, 0), 30)
    b = b - cv2.GaussianBlur(b, (0, 0), 30)
    warp = np.eye(2, 3, dtype=np.float32)
    score, warp = cv2.findTransformECC(a, b, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-7), None, 5)
    return score, warp


def base():
    _, src = window()
    out = np.asarray(Image.open(TAKE).convert('RGB').resize(BASE, Image.LANCZOS), np.float32) / 255
    score, warp = align(src, out)
    print('level 0 against the plate window: ECC', round(float(score), 4), 'affine', np.round(warp, 5).tolist())
    out = cv2.warpAffine(out, warp, BASE, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    a, b = coded(np.clip(src, 0, 1)), coded(np.clip(out, 0, 1))
    m = cv2.resize(mask(), BASE, interpolation=cv2.INTER_AREA)[..., None]
    low = cv2.GaussianBlur(a, (0, 0), KEEP)
    lit = geo.to_linear(np.clip(src, 0, 1)).mean(-1)
    gain = DARK[2] + (1 - DARK[2]) * smooth(DARK[0], DARK[1], cv2.GaussianBlur(lit, (0, 0), KEEP))
    fine = (b - cv2.GaussianBlur(b, (0, 0), KEEP)).mean(-1, keepdims=True) * gain[..., None]
    l = a + m * (low + fine - a)
    Image.fromarray((decoded(l) * 255 + 0.5).astype(np.uint8)).save(WORK + 'c0.png')
    Image.fromarray((m[..., 0] * 255).astype(np.uint8)).save(WORK + 'c0-mask.png')
    print('wrote', WORK + 'c0.png')


def tiles():
    c0 = Image.open(WORK + 'c0.png').convert('RGB')
    m = np.asarray(Image.open(WORK + 'c0-mask.png'), np.float32) / 255
    for j, y in enumerate(YS):
        for i, x in enumerate(XS):
            share = float(m[y:y + WINDOW, x:x + WINDOW].mean())
            if share < SKIP:
                print('tile', i, j, 'skipped, deck share', round(share, 3))
                continue
            c0.crop((x, y, x + WINDOW, y + WINDOW)).resize((WINDOW * SCALE, WINDOW * SCALE), Image.LANCZOS).save(WORK + 'f-in-%d%d.png' % (i, j))
            print('tile', i, j, 'at', x, y, 'deck share', round(share, 3))


def shift(a, b):
    ga = cv2.GaussianBlur(a.mean(-1), (0, 0), 4)
    gb = cv2.GaussianBlur(b.mean(-1), (0, 0), 4)
    ga = ga - cv2.GaussianBlur(ga, (0, 0), 40)
    gb = gb - cv2.GaussianBlur(gb, (0, 0), 40)
    (dx, dy), peak = cv2.phaseCorrelate(ga.astype(np.float32), gb.astype(np.float32), cv2.createHanningWindow(ga.shape[::-1], cv2.CV_32F))
    return dx, dy, peak


def ramp(n, lap, first, last):
    w = np.ones(n, np.float32)
    t = (np.arange(lap) + 0.5) / lap
    edge = (0.5 - 0.5 * np.cos(np.pi * t)).astype(np.float32)
    if not first:
        w[:lap] = edge
    if not last:
        w[n - lap:] = edge[::-1]
    return w


def join():
    n = WINDOW * SCALE
    width, height = BASE[0] * SCALE, BASE[1] * SCALE
    acc = np.zeros((height, width, 3), np.float32)
    weight = np.zeros((height, width, 1), np.float32)
    lapx = (WINDOW - (XS[1] - XS[0])) * SCALE
    lapy = (WINDOW - (YS[1] - YS[0])) * SCALE
    c0 = np.asarray(Image.open(WORK + 'c0.png').convert('RGB').resize((width, height), Image.LANCZOS), np.float32) / 255
    base = coded(np.clip(c0, 0, 1))
    del c0
    import os
    for j, y in enumerate(YS):
        for i, x in enumerate(XS):
            name = WORK + 'f1-%d%d.png' % (i, j)
            wy = ramp(n, lapy, j == 0, j == len(YS) - 1)
            wx = ramp(n, lapx, i == 0, i == len(XS) - 1)
            w = (wy[:, None] * wx[None, :])[..., None]
            a = base[y * SCALE:y * SCALE + n, x * SCALE:x * SCALE + n]
            if not os.path.exists(name):
                acc[y * SCALE:y * SCALE + n, x * SCALE:x * SCALE + n] += a * w
                weight[y * SCALE:y * SCALE + n, x * SCALE:x * SCALE + n] += w
                continue
            b = coded(np.asarray(Image.open(name).convert('RGB').resize((n, n), Image.LANCZOS), np.float32) / 255)
            dx, dy, peak = shift(a, b)
            if abs(dx) > 0.3 or abs(dy) > 0.3:
                b = cv2.warpAffine(b, np.float32([[1, 0, -dx], [0, 1, -dy]]), (n, n), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
            band = lambda v: (cv2.GaussianBlur(v, (0, 0), BAND[0]) - cv2.GaussianBlur(v, (0, 0), BAND[1])).mean(-1)
            ea = np.sqrt(cv2.GaussianBlur(band(a) ** 2, (0, 0), BAND[2]))
            eb = np.sqrt(cv2.GaussianBlur(band(b) ** 2, (0, 0), BAND[2]))
            gain = np.clip(ea / np.maximum(eb, 1e-4), GAIN[0], GAIN[1])
            fine = (b - cv2.GaussianBlur(b, (0, 0), FINE)).mean(-1) * gain
            out = cv2.GaussianBlur(a, (0, 0), FINE) + fine[..., None]
            acc[y * SCALE:y * SCALE + n, x * SCALE:x * SCALE + n] += out * w
            weight[y * SCALE:y * SCALE + n, x * SCALE:x * SCALE + n] += w
            print('tile', i, j, 'shift', round(dx, 2), round(dy, 2), 'peak', round(peak, 3), 'gain median', round(float(np.median(gain)), 3))
    l = acc / np.maximum(weight, 1e-6)
    del acc, weight, base
    Image.fromarray((decoded(l) * 255 + 0.5).astype(np.uint8)).save(WORK + 'c1.png')
    plate = Image.open(PLATE).convert('RGB')
    w, h = BOX[2] - BOX[0], BOX[3] - BOX[1]
    old = coded(np.asarray(plate.crop(BOX), np.float32) / 255)
    new = cv2.resize(l, (w, h), interpolation=cv2.INTER_AREA)
    m = mask()[..., None]
    res = decoded(old + m * (new - old))
    plate.paste(Image.fromarray((res * 255 + 0.5).astype(np.uint8)), (BOX[0], BOX[1]))
    plate.save(OUT)
    print('wrote', OUT)


if __name__ == '__main__':
    {'base': base, 'tiles': tiles, 'join': join}[sys.argv[1]]()
