import json
import numpy as np
import cv2

WORK = 'out/work/sun'
APPROVED = 'references/approved/sun-close.jpg'
VFOV = 55.0
TY = float(np.tan(np.radians(VFOV) / 2))
TX = TY * 16 / 9
LEFT, TOP, SPAN = -0.25, -0.205, 1.5
CANVAS = (8192, 4608)
PLATE_TOP = 1728
LOOPS_BOX = (0.22, 0.08, 0.86, 0.66)
FEET = ((0.3757, 0.5139), (0.7141, 0.5455))
LIT = (24, 12.0, -0.25, 0.25)


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    ca, cb, cc, cd, ce = 2.51, 0.03, 2.43, 0.59, 0.14
    kk = cd * y - cb
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (cc * y - ca) * ce * y, 0))) / (2 * (cc * y - ca))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(a):
    return unfilm(to_linear(a)).astype(np.float32)


def display(s):
    return to_srgb(film(s)).astype(np.float32)


def read(path):
    return cv2.cvtColor(cv2.imread(path, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)


def write(path, a, quality=92):
    a = np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8) if a.dtype != np.uint8 else a
    bgr = cv2.cvtColor(a, cv2.COLOR_RGBA2BGRA if a.shape[2] == 4 else cv2.COLOR_RGB2BGR)
    if path.endswith('.jpg'):
        cv2.imwrite(path, bgr, [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    elif path.endswith('.webp'):
        cv2.imwrite(path, bgr, [cv2.IMWRITE_WEBP_QUALITY, quality])
    else:
        cv2.imwrite(path, bgr)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def registration():
    return json.load(open(f'{WORK}/register.json'))


def fit():
    return json.load(open('assets-src/sun/terrain/fit.json'))


def take_to_grid(name, upscaled, size, origin, scale):
    reg = registration()[name]
    m = np.array(reg['matrix'], dtype=np.float64)
    k = upscaled.shape[1] / reg['takeSize'][0]
    a = np.array([[scale, 0, origin[0]], [0, scale, origin[1]], [0, 0, 1]])
    full = np.vstack([m, [0, 0, 1]]) @ a
    full[:2] *= k
    full[:2, 2] += (k - 1) / 2
    return cv2.warpAffine(upscaled, full[:2], size, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
