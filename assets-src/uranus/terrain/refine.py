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
TINT = (0.03, 0.15)
RETOUCH = ((300, 805, 500, 872),)
FEATHER = 14
SMALL = 'out/work/u/t/plate/wide-canvas.png'
PUB = 'public/assets/uranus/'
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


def patched(m):
    y, x = np.mgrid[0:m.shape[0], 0:m.shape[1]].astype(np.float32)
    for x0, y0, x1, y1 in RETOUCH:
        d = np.maximum(np.maximum(x0 - x, x - x1), np.maximum(y0 - y, y - y1))
        m = m * smooth(0, FEATHER, d)
    return m


def change():
    _, src = window()
    out = np.asarray(Image.open(TAKE).convert('RGB').resize(BASE, Image.LANCZOS), np.float32) / 255
    score, warp = align(src, out)
    print('level 0 against the plate window: ECC', round(float(score), 4), 'affine', np.round(warp, 5).tolist())
    out = cv2.warpAffine(out, warp, BASE, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    a, b = coded(np.clip(src, 0, 1)), coded(np.clip(out, 0, 1))
    m = patched(cv2.resize(mask(), BASE, interpolation=cv2.INTER_AREA))[..., None]
    lit = cv2.GaussianBlur(geo.to_linear(np.clip(src, 0, 1)).mean(-1), (0, 0), KEEP)
    gain = DARK[2] + (1 - DARK[2]) * smooth(DARK[0], DARK[1], lit)
    fine = b - cv2.GaussianBlur(b, (0, 0), KEEP)
    grey = fine.mean(-1, keepdims=True)
    tint = smooth(TINT[0], TINT[1], lit)[..., None]
    fine = (grey + tint * (fine - grey)) * gain[..., None]
    return m * (fine - (a - cv2.GaussianBlur(a, (0, 0), KEEP)))


def base():
    plate = Image.open(PLATE).convert('RGB')
    w, h = BOX[2] - BOX[0], BOX[3] - BOX[1]
    delta = cv2.resize(change(), (w, h), interpolation=cv2.INTER_CUBIC)
    old = coded(np.asarray(plate.crop(BOX), np.float32) / 255)
    res = decoded(old + delta)
    plate.paste(Image.fromarray((res * 255 + 0.5).astype(np.uint8)), (BOX[0], BOX[1]))
    plate.save(OUT)
    print('wrote', OUT)


def ship():
    from scipy import ndimage as ndi
    small = Image.open(SMALL)
    aw, ah = small.size
    _, _, _, hit = T.ground(T.rays_wide(aw, ah))
    fill = np.asarray(Image.open(OUT).convert('RGB')).copy()
    k = fill.shape[1] / aw
    solid = ndi.binary_erosion(hit, iterations=4)
    idx = ndi.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    size = (fill.shape[1], fill.shape[0])
    need = cv2.resize((~solid).astype(np.uint8), size, interpolation=cv2.INTER_NEAREST) > 0
    sy = cv2.resize(idx[0].astype(np.float32), size, interpolation=cv2.INTER_LINEAR)
    sx = cv2.resize(idx[1].astype(np.float32), size, interpolation=cv2.INTER_LINEAR)
    moved = cv2.remap(fill, (sx + 0.5) * k - 0.5, (sy + 0.5) * k - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    fill[need] = moved[need]
    full = Image.fromarray(fill)
    full.save(PUB + 'full/deck-color.jpg', quality=93, subsampling=0)
    full.resize((size[0] // 2, size[1] // 2), Image.LANCZOS).save(PUB + 'web/deck-color.jpg', quality=91, subsampling=0)
    print('wrote', PUB + 'full/deck-color.jpg', 'and web')


if __name__ == '__main__':
    {'base': base, 'ship': ship}[sys.argv[1]]()
