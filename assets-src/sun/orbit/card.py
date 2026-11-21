import os
import sys
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi
from geo import *
from polar import *

N = 4096
HALF = 1.56
PLANE = 1 / DIST
CW, CH = 8192, 1024
CALM = (0.03, 0.12)
LEVEL = ROOT + '/assets-src/sun/orbit/level.npy'


def write(a, path, mode):
    im = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8), mode)
    if path.endswith('.webp'):
        im.save(path, lossless=True, quality=80, method=4, exact=True)
    else:
        im.save(path, optimize=True)


def corona(out):
    cor = np.load(WORK + '/polar-corona.npy').astype(np.float32)
    cor = cv2.resize(cor, (CW, CH), interpolation=cv2.INTER_AREA)
    if os.path.exists(LEVEL):
        cor *= cv2.resize(np.load(LEVEL).astype(np.float32), (CW, CH), interpolation=cv2.INTER_LINEAR)
    img = code(cor)[::-1]
    write(img, out + '/full/corona.webp', 'RGB')
    write(cv2.resize(img, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA), out + '/web/corona.webp', 'RGB')
    cv2.imwrite(WORK + '/corona-preview.jpg', cv2.cvtColor((cv2.resize(img, (2048, 512), interpolation=cv2.INTER_AREA) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR))


def card(out):
    pol = np.load(WORK + '/polar-prom.npy').astype(np.float32)
    ax = (np.arange(N) + 0.5) / N * 2 * HALF - HALF
    x, y = np.meshgrid(ax, -ax)
    p = np.stack([x, y, np.full_like(x, PLANE)], -1)
    theta, b = polar_of(p)
    rgba = sample_polar(pol, theta, b)
    rgba[b < 1.0005] = 0
    rgba[b > B1 * 0.98] = 0
    img = np.concatenate([code(rgba[..., :3]), np.clip(rgba[..., 3:], 0, 1)], -1).astype(np.float32)
    write(img, out + '/full/prominence.png', 'RGBA')
    half = cv2.resize(img, (N // 2, N // 2), interpolation=cv2.INTER_AREA)
    write(half, out + '/web/prominence.png', 'RGBA')
    np.save(WORK + '/card.npy', half.astype(np.float16))
    show = np.clip(half[..., :3] + 0.25 * half[..., 3:], 0, 1)
    cv2.imwrite(WORK + '/card-preview.jpg', cv2.cvtColor((cv2.resize(show, (1536, 1536), interpolation=cv2.INTER_AREA) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR))


def flow(out):
    half = np.load(WORK + '/card.npy').astype(np.float32)
    n = half.shape[0]
    lum = luma(half[..., :3]) + 0.5 * half[..., 3]
    gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3)
    s = 5.0
    jxx = cv2.GaussianBlur(gx * gx, (0, 0), s)
    jyy = cv2.GaussianBlur(gy * gy, (0, 0), s)
    jxy = cv2.GaussianBlur(gx * gy, (0, 0), s)
    ang = 0.5 * np.arctan2(2 * jxy, jxx - jyy) + np.pi / 2
    tx, ty = np.cos(ang), -np.sin(ang)
    coh = np.sqrt((jxx - jyy) ** 2 + 4 * jxy ** 2) / (jxx + jyy + 1e-6)
    present = cv2.GaussianBlur(np.clip(lum * 6, 0, 1), (0, 0), 3)
    mask = present > 0.08
    lab, count = ndi.label(ndi.binary_dilation(mask, iterations=6))
    ax = (np.arange(n) + 0.5) / n * 2 * HALF - HALF
    x, y = np.meshgrid(ax, -ax)
    vx = np.zeros_like(lum)
    vy = np.zeros_like(lum)
    along = np.full_like(lum, 0.5)
    quiet = np.zeros_like(lum)
    rim = np.sqrt(1 - PLANE ** 2)
    for i in range(1, count + 1):
        m = lab == i
        if m.sum() < 200:
            continue
        w = lum[m] + 1e-4
        cx, cy = (x[m] * w).sum() / w.sum(), (y[m] * w).sum() / w.sum()
        k = rim / max(np.hypot(cx, cy), 1e-6)
        cx, cy = cx * k, cy * k
        rx, ry = x[m] - cx, y[m] - cy
        sign = 1.0 if i % 2 else -1.0
        cxn, cyn = -ry * sign, rx * sign
        ln = np.hypot(cxn, cyn) + 1e-6
        cxn, cyn = cxn / ln, cyn / ln
        dot = tx[m] * cxn + ty[m] * cyn
        sx = np.where(dot >= 0, tx[m], -tx[m])
        sy = np.where(dot >= 0, ty[m], -ty[m])
        c = np.clip(coh[m] * 1.5, 0, 1) * np.clip(np.abs(dot) * 2.5, 0, 1)
        fx = sx * c + cxn * (1 - c)
        fy = sy * c + cyn * (1 - c)
        ln = np.hypot(fx, fy) + 1e-6
        vx[m], vy[m] = fx / ln, fy / ln
        ox, oy = cx / rim, cy / rim
        along[m] = 0.5 + sign * np.arctan2(ox * ry - oy * rx, ox * rx + oy * ry) / (2 * np.pi)
        quiet[m] = step(np.hypot(rx, ry), CALM[0], CALM[1])
    vx = cv2.GaussianBlur(vx, (0, 0), 3)
    vy = cv2.GaussianBlur(vy, (0, 0), 3)
    strength = np.clip(present * 3, 0, 1)
    tex = np.stack([0.5 + 0.5 * vx * strength, 0.5 + 0.5 * vy * strength, strength * quiet, along], -1)
    tex = cv2.resize(tex, (1024, 1024), interpolation=cv2.INTER_AREA)
    write(tex, out + '/full/prominence-flow.png', 'RGBA')
    write(cv2.resize(tex, (512, 512), interpolation=cv2.INTER_AREA), out + '/web/prominence-flow.png', 'RGBA')
    cv2.imwrite(WORK + '/flow-preview.jpg', cv2.cvtColor((tex[..., :3] * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR))


if __name__ == '__main__':
    out = sys.argv[1]
    for what in sys.argv[2:]:
        {'corona': corona, 'card': card, 'flow': flow}[what](out)
