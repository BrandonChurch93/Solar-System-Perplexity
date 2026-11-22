import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter

sys.path.insert(0, 'assets-src/uranus')
import geo

WORK = 'out/work/u/face/'
PUB = 'public/assets/uranus/'
FRAME = 4436
SIZE = 2048
MARGIN = 1.06
RIM = 5
KEEP = 48.0
INNER = 8.0
STEP = 4
RANGE = 2.0
LIMB = (0.1, 0.32)
DARK = (0.004, 0.03)
CHROMA = 0.85
OWN = (0.5, 1.2)
DIM = (0.8, 0.02, 0.1)
DOT = (0.5, 900, 2.6, 0.3)
CAP = 1.0


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def coded(a):
    return np.log2(geo.scene(a).astype(np.float32) + 0.01)


def source(still, grid):
    im = np.asarray(Image.open(still).convert('RGB'), np.float32)
    g = np.fromfile(grid, np.float32).reshape(-1, 3)
    g = g[g[:, 2] > 0.02]
    x0, x1, y0, y1 = g[:, 0].min(), g[:, 0].max(), g[:, 1].min(), g[:, 1].max()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = max(x1 - x0, y1 - y0) / 2 * MARGIN
    box = [int(round(cx - half)), int(round(cy - half)), int(round(cx + half)), int(round(cy + half))]
    hit = np.zeros(im.shape[:2], np.uint8)
    xi, yi = np.clip(g[:, 0].astype(int), 0, im.shape[1] - 1), np.clip(g[:, 1].astype(int), 0, im.shape[0] - 1)
    hit[yi, xi] = 255
    hit = cv2.morphologyEx(hit, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    hit = cv2.dilate(hit, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * RIM + 1, 2 * RIM + 1)))
    mask = cv2.GaussianBlur(hit.astype(np.float32) / 255, (0, 0), RIM / 3)
    im = Image.fromarray((im * mask[..., None] + 0.5).astype(np.uint8))
    im.crop(tuple(box)).resize((SIZE, SIZE), Image.LANCZOS).save(WORK + 'in-%d.png' % FRAME)
    json.dump({'box': box, 'still': still}, open(WORK + 'box.json', 'w'))
    print('box', box, 'disc', round(float(x1 - x0), 1), round(float(y1 - y0), 1))


def edges(a):
    light = cv2.GaussianBlur(np.log2(geo.to_linear(a).mean(-1).astype(np.float32) + 0.02), (0, 0), 3)
    mag = np.hypot(cv2.Sobel(light, cv2.CV_32F, 1, 0), cv2.Sobel(light, cv2.CV_32F, 0, 1))
    return cv2.GaussianBlur(np.minimum(mag, np.percentile(mag, 99.5)), (0, 0), 2)


def broad(a):
    small = cv2.resize(a, (SIZE // STEP, SIZE // STEP), interpolation=cv2.INTER_AREA).reshape(SIZE // STEP, SIZE // STEP, -1)
    window = 2 * int(round(KEEP / STEP)) + 1
    wide = np.stack([median_filter(small[..., c], size=window, mode='nearest') for c in range(small.shape[-1])], -1)
    return cv2.GaussianBlur(cv2.resize(wide, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC), (0, 0), STEP).reshape(a.shape)


def dots(grey):
    hit = np.zeros(grey.shape, np.float32)
    for sign in (1, -1):
        count, labels, stats, _ = cv2.connectedComponentsWithStats((sign * grey > DOT[0]).astype(np.uint8), connectivity=8)
        w, h, area = stats[:, cv2.CC_STAT_WIDTH], stats[:, cv2.CC_STAT_HEIGHT], stats[:, cv2.CC_STAT_AREA]
        small = (area < DOT[1]) & (np.maximum(w, h) < DOT[2] * np.minimum(w, h))
        small[0] = False
        print('dots damped', int(small.sum()), 'of', count - 1, 'sign', sign)
        hit = np.maximum(hit, small[labels].astype(np.float32))
    hit = cv2.dilate(hit, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    return 1 - (1 - DOT[3]) * cv2.GaussianBlur(hit, (0, 0), 1.5)


def detail(take):
    src = np.asarray(Image.open(WORK + 'in-%d.png' % FRAME).convert('RGB'), np.float32) / 255
    out = np.asarray(Image.open(take).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS), np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    score, warp = cv2.findTransformECC(edges(src), edges(out), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), None, 5)
    print('ecc', round(float(score), 4), 'warp', np.round(warp, 4).tolist())
    out = cv2.warpAffine(out, warp, (SIZE, SIZE), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    diff = coded(out) - coded(src)
    own = coded(src).mean(-1, keepdims=True)
    own = smooth(OWN[0], OWN[1], cv2.GaussianBlur(own - broad(own), (0, 0), 3))[..., None]
    fine = (1 - own) * (diff - broad(diff)) + own * (diff - cv2.GaussianBlur(diff, (0, 0), INNER))
    grey = fine.mean(-1, keepdims=True)
    fine = grey + CHROMA * (fine - grey)
    fine = np.where(fine > 0, CAP * np.tanh(fine / CAP), fine) * dots(fine.mean(-1))[..., None]
    level = cv2.GaussianBlur(geo.to_linear(src).mean(-1), (0, 0), 6)
    return fine * (smooth(DARK[0], DARK[1], level) * (1 + DIM[0] * (1 - smooth(DIM[1], DIM[2], level))))[..., None], out, src


def build(take, grid):
    fine, out, src = detail(take)
    box = json.load(open(WORK + 'box.json'))['box']
    g = np.fromfile(grid, np.float32)
    n = int(round((g.size / 3) ** 0.5))
    g = g.reshape(n, n, 3)
    scale = SIZE / (box[2] - box[0])
    mx = ((g[..., 0] - box[0]) * scale - 0.5).astype(np.float32)
    my = ((g[..., 1] - box[1]) * scale - 0.5).astype(np.float32)
    w = smooth(LIMB[0], LIMB[1], g[..., 2])
    w *= (mx > 4) & (mx < SIZE - 5) & (my > 4) & (my < SIZE - 5)
    mid = slice(n // 2 - 8, n // 2 + 8)
    per = float(np.median(np.hypot(np.diff(mx, axis=1)[mid, mid], np.diff(my, axis=1)[mid, mid])))
    print('take pixels per face texel at the centre', round(per, 3))
    d = cv2.remap(cv2.GaussianBlur(fine, (0, 0), per * 0.5) if per > 1.2 else fine, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0) * w[..., None]
    print('detail in stops: rms', round(float(np.sqrt((d ** 2).mean())), 4), 'p99', round(float(np.percentile(np.abs(d), 99)), 3), 'max', round(float(np.abs(d).max()), 3), 'clipped share', round(float((np.abs(d) > RANGE).mean()), 5))
    code = np.clip(128 / 255 + d / (2 * RANGE), 0, 1)
    full = Image.fromarray((code * 255 + 0.5).astype(np.uint8))
    full.save(PUB + 'full/face.jpg', quality=92, subsampling=0)
    full.resize((n // 2, n // 2), Image.LANCZOS).save(PUB + 'web/face.jpg', quality=90, subsampling=0)
    Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(WORK + 'take-aligned.png')
    lit = geo.display(geo.scene(src) * np.exp2(fine))
    Image.fromarray((np.clip(lit, 0, 1) * 255 + 0.5).astype(np.uint8)).save(WORK + 'preview.png')


def flat():
    code = np.full((SIZE, SIZE, 3), 128, np.uint8)
    Image.fromarray(code).save(PUB + 'full/face.jpg', quality=92, subsampling=0)
    Image.fromarray(code[:SIZE // 2, :SIZE // 2]).save(PUB + 'web/face.jpg', quality=90, subsampling=0)


if sys.argv[1] == 'input':
    source(sys.argv[2], sys.argv[3])
elif sys.argv[1] == 'flat':
    flat()
else:
    build(sys.argv[2], sys.argv[3])
