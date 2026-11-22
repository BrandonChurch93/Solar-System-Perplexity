import json
import sys
import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/venus/relief')
sys.path.insert(0, 'assets-src/venus/sky')
from cam import *

OUT = 'public/assets/venus/'
AZ, EL, POWER = 80.0, 80.0, 0.5
SIZE = (1024, 512)
CUT = (0.015, 0.2, 0.92)
MARGIN = 0.125
MIRROR = 260.0
BAND = (-6, 70)
LINE = 25
SEAM = 1.0
CLEAN = (30, 390, 100, 1300)
DONOR = 0.7
LANE = (0.0, 8.0)
SHIFT = (300, 137)
AMP = 1.4
LUMA = np.array([0.3, 0.5, 0.2])
PALE = (0.12, 0.35)
OVER = (30.0, 2.0, 5.0, 1.0, 3.0)


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
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(path):
    a = cv2.imread(path)
    if a.shape[1] != AW:
        a = cv2.resize(a, (AW, AH), interpolation=cv2.INTER_CUBIC if a.shape[1] < AW else cv2.INTER_AREA)
    return unfilm(to_linear(a[..., ::-1].astype(np.float32) / 255))


def calm(v, size=9, blur=2.5):
    return cv2.GaussianBlur(cv2.morphologyEx(v.astype(np.float32), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))), (0, 0), blur)


def calm_limb(v, hz):
    wide = calm(v)
    n = BAND[1] - BAND[0]
    xs = np.tile(np.arange(AW, dtype=np.float32), (n, 1))
    ks = np.arange(BAND[0], BAND[1], dtype=np.float32)[:, None]
    strip = cv2.remap(v.astype(np.float32), xs, (hz[None, :] - ks).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    strip = cv2.morphologyEx(strip, cv2.MORPH_OPEN, np.ones((1, LINE), np.uint8))
    strip = cv2.GaussianBlur(strip, (0, 0), sigmaX=3, sigmaY=0.6)
    yy, xx = np.mgrid[0:AH, 0:AW].astype(np.float32)
    k = hz[None, :] - yy
    back = cv2.remap(strip, xx, k - BAND[0], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    w = ((k > BAND[0] + 1) * (1 - smooth(BAND[1] - 26, BAND[1] - 4, k)))[..., None]
    return wide * (1 - w) + back * w


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main(base=None, seen=None):
    A = scene('references/approved/venus-close.jpg')
    yy, xx = np.mgrid[0:AH, 0:AW].astype(np.float32)
    el = elevation(rays(xx + 0.5 + MX, yy + 0.5))
    last = np.maximum((el > 0.08).sum(0) - 1, 0)
    rows = np.minimum(yy.astype(np.int64), last[None, :])
    cols = xx.astype(np.int64)
    n = (el > 0).sum(0)
    i0 = np.clip(n - 1, 0, AH - 2)
    e0, e1 = el[i0, np.arange(AW)], el[i0 + 1, np.arange(AW)]
    hz = (i0 + e0 / np.maximum(e0 - e1, 1e-6)).astype(np.float32)
    A_sky = A[rows, cols]
    As = calm_limb(A_sky, hz)
    B = np.zeros_like(A)
    if base:
        raw = scene(base)
        deck = (el < -1.5).astype(np.float32)
        g = lambda v: (cv2.GaussianBlur(film(v).mean(-1).astype(np.float32), (0, 0), 1.5) * deck)[500:1500, 300:2500]
        (dx, dy), score = cv2.phaseCorrelate(g(A), g(raw))
        print('film offset px', round(dx, 2), round(dy, 2), 'score', round(score, 3))
        raw = cv2.warpAffine(raw.astype(np.float32), np.float32([[1, 0, -dx], [0, 1, -dy]]), (AW, AH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        B = calm_limb(raw[rows, cols], hz)
    air = np.maximum(As - B, 0)
    if seen:
        got = cv2.warpAffine(scene(seen).astype(np.float32), np.float32([[1, 0, -dx], [0, 1, -dy]]), (AW, AH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        level = lambda v: to_srgb(film(v)) * 255
        low = lambda v: cv2.GaussianBlur(v.astype(np.float32), (0, 0), OVER[0])
        over = low(np.clip(level(got[rows, cols]) - level(A_sky), -OVER[4], OVER[4]))
        w = ((1 - smooth(CUT[0], 2 * CUT[0], air @ LUMA)) * smooth(OVER[1], OVER[2], el))[..., None]
        goal = unfilm(to_linear(np.clip(level(As) - OVER[3] * over, 0, 255) / 255))
        air = np.maximum(air - (As - goal) * w, 0)
        box = (slice(0, AH * 260 // 1080), slice(0, AW * 600 // 1920))
        print('film over the approved in the dim sky, levels, top left box mean', (over * w)[box].mean((0, 1)).tolist(), 'weight', float(w[box].mean()))
    u = up()
    fwd = np.array([0.0, 0.0, -1.0]) + u * u[2]
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, u)
    gu, gv = np.meshgrid((np.arange(SIZE[0]) + 0.5) / SIZE[0], 1 - (np.arange(SIZE[1]) + 0.5) / SIZE[1])
    az = np.radians((gu - 0.5) * 2 * AZ)
    e = np.radians(EL * gv ** (1 / POWER) - DIP)
    d = np.sin(e)[..., None] * u + np.cos(e)[..., None] * (np.cos(az)[..., None] * fwd + np.sin(az)[..., None] * right)
    ok = d[..., 2] < -0.05
    px = np.where(ok, d[..., 0] / -d[..., 2] * F + AW / 2, -9).astype(np.float32)
    py = np.where(ok, AH / 2 - d[..., 1] / -d[..., 2] * F, -9).astype(np.float32)
    ok &= (px > 1) & (px < AW - 2) & (py > 1) & (py < AH - 2)
    tex = cv2.remap(air.astype(np.float32), px - 0.5, py - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    from scipy import ndimage as ndi
    idx = ndi.distance_transform_edt(~ok, return_distances=False, return_indices=True)
    filled = tex[idx[0], idx[1]]
    soft = cv2.GaussianBlur(filled, (0, 0), 6)
    w = cv2.GaussianBlur(ok.astype(np.float32), (0, 0), 3)[..., None]
    w = np.clip(w * 2 - 1, 0, 1)
    tex = tex * w + soft * (1 - w)
    tex[-3:] = cv2.GaussianBlur(tex[-3:], (0, 0), sigmaX=5, sigmaY=0.01)
    img = (to_srgb(film(tex)) * 255 + 0.5).astype(np.uint8)
    for key, k in (('full', 1), ('web', 1)):
        cv2.imwrite(f'{OUT}{key}/relief-air.png', img[..., ::-1])
    cv2.imwrite(W + 'air-preview.png', img[..., ::-1])

    lum = air @ LUMA
    cut = CUT[2] * smooth(CUT[0], CUT[1], lum)
    raw = np.maximum(A - As, 0)
    gate = (1 - smooth(0.55, 0.9, cut / CUT[2]))[..., None]
    y0, y1, x0, x1 = CLEAN
    print('clean region cut max', float(cut[y0:y1, x0:x1].max()))
    tile = raw[y0:y1, x0:x1]
    tile = np.concatenate([tile, tile[:, ::-1]], 1)
    tile = np.concatenate([tile[::-1], tile], 0)
    donor = np.tile(tile, (AH // tile.shape[0] + 2, AW // tile.shape[1] + 2, 1))[70:70 + AH, 500:500 + AW]
    tint = raw[y0:y1, x0:x1].mean((0, 1))
    tint = tint / (tint @ LUMA)
    pale = smooth(PALE[0], PALE[1], cut)[..., None]
    raw = raw * (1 - pale) + (raw @ LUMA)[..., None] * tint * pale
    stars = raw * np.minimum(1 / (1 - cut), AMP)[..., None] * gate + donor * (1 - gate) * DONOR
    line = np.maximum((el > SEAM).sum(0) - 1, 0)[None, :]
    under = yy.astype(np.int64) - line
    depth = under.astype(np.float32)
    moved = stars[np.abs(yy.astype(np.int64) - SHIFT[0]), np.abs(cols - SHIFT[1])]
    lane = np.maximum(smooth(LANE[0], LANE[1], depth)[..., None], 1 - gate)
    stars = (stars * (1 - lane) + moved * lane) * (1 - smooth(MIRROR * 0.5, MIRROR, depth))[..., None]
    px_, py_ = round(AW * MARGIN), round(AH * MARGIN)
    wide = np.pad(stars, ((py_, py_), (px_, px_), (0, 0)), mode='symmetric')
    im = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    im.save('assets-src/venus/sky/uncorrected/sky-terrain.webp', lossless=True, quality=90, method=6)
    recon = film(air + stars * (el > 0)[..., None] * (1 - cut[..., None]) + B)
    cv2.imwrite(W + 'stars-preview.jpg', cv2.resize((to_srgb(film(stars * 10 * 0.4))[..., ::-1] * 255).astype(np.uint8), (AW // 2, AH // 2), interpolation=cv2.INTER_AREA))
    cv2.imwrite(W + 'air-recon.jpg', cv2.resize((to_srgb(recon)[..., ::-1] * 255).astype(np.uint8), (AW // 2, AH // 2), interpolation=cv2.INTER_AREA))
    print('air max', float(air.max()), 'stars share', float((stars.sum(-1) > 0.01).mean()))


main(sys.argv[1] if len(sys.argv) > 1 else None, sys.argv[2] if len(sys.argv) > 2 else None)
