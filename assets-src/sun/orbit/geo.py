import json
import numpy as np
import cv2
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = __file__.rsplit('/assets-src/', 1)[0]
WORK = ROOT + '/out/work/sun'
HERO = ROOT + '/references/approved/sun-hero.png'
HERO2 = WORK + '/hero-x2.png'
FIT = json.load(open(ROOT + '/assets-src/sun/fit.json'))
W, H = FIT['imageSize']
VFOV = np.radians(FIT['vfovDeg'])
TH = np.tan(VFOV / 2)
CAM = np.array(FIT['camera']['position'], dtype=np.float64)
DIST = float(np.linalg.norm(CAM))
CX, CY, RPX = FIT['circle']['cx'], FIT['circle']['cy'], FIT['circle']['r']
FOCAL = (H / 2) / TH


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


def scene(code):
    return unfilm(to_linear(code))


def code(lin):
    return to_srgb(film(lin))


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255


def save(a, path, quality=95):
    im = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
    if path.endswith('.jpg'):
        im.save(path, quality=quality, subsampling=0)
    else:
        im.save(path)


def luma(a):
    return a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def map_dirs(w, h):
    u = (np.arange(w) + 0.5) / w
    v = (np.arange(h) + 0.5) / h
    lon = (u - 0.5) * 2 * np.pi
    lat = (0.5 - v) * np.pi
    cl = np.cos(lat)[:, None]
    return np.stack([cl * np.sin(lon)[None, :], np.repeat(np.sin(lat)[:, None], w, 1), cl * np.cos(lon)[None, :]], -1)


def project(d, scale=1.0):
    rel = d - CAM
    z = -rel[..., 2]
    px = (rel[..., 0] / z * FOCAL + W / 2) * scale
    py = (-rel[..., 1] / z * FOCAL + H / 2) * scale
    view = -rel / np.linalg.norm(rel, axis=-1, keepdims=True)
    mu = (view * d).sum(-1)
    return px, py, mu


def sample(img, px, py, interp=cv2.INTER_LANCZOS4):
    return cv2.remap(img, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), interp, borderMode=cv2.BORDER_REFLECT)
