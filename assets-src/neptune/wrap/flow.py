import os
import sys

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
WORK = 'out/work/nep/flow/'
W, H = 4096, 2048
SEED = 4707
TENSOR = (2.0, 14.0)
ZONAL = 0.35
MEANDER = (0.25, 90.0)
STORM = (-0.25, -18.8, 10.0, 22.0)
ACROSS = (18.0, 38.0)
OCTAVES = ((30, 1.0, 0.42), (20, 2.4, 0.5), (12, 6.0, 0.55))
CALM = (140.0, 0.2, 0.3, 0.7)
SKEW = 0.6
STD = 0.17


def wrap_blur(img, sigma):
    pad = int(4 * sigma) + 1
    ext = np.concatenate([img[:, -pad:], img, img[:, :pad]], 1)
    return cv2.GaussianBlur(ext, (0, 0), sigma)[:, pad:-pad]


def step(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def rows_noise(rng, scale):
    lat = (np.arange(H) + 0.5) / H * np.pi - np.pi / 2
    out = np.zeros((H, W), np.float32)
    x = (np.arange(W) + 0.5) / W
    for j in range(H):
        n = max(8, int(round(W * np.cos(lat[j]) / scale)))
        r = rng.random(n + 1).astype(np.float32)
        r[-1] = r[0]
        out[j] = np.interp(x * n, np.arange(n + 1), r)
    if scale > 1:
        out = cv2.GaussianBlur(out, (1, 0), sigmaX=0.01, sigmaY=scale * 0.5)
    return out - out.mean()


def lic(noise, vx, vy, steps):
    lat = (np.arange(H, dtype=np.float32) + 0.5) / H * np.pi - np.pi / 2
    stretch = (1 / np.maximum(np.cos(lat), 0.05))[:, None]
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    acc = noise.copy()
    total = 1.0
    for sign in (1.0, -1.0):
        px, py = gx.copy(), gy.copy()
        for k in range(steps):
            sx = cv2.remap(vx, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
            sy = cv2.remap(vy, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
            flip = np.where(sx * (vx if k == 0 else lastx) + sy * (vy if k == 0 else lasty) < 0, -1.0, 1.0).astype(np.float32)
            sx, sy = sx * flip, sy * flip
            lastx, lasty = sx, sy
            px = np.mod(px + sign * sx * stretch, W).astype(np.float32)
            py = np.clip(py + sign * sy, 0, H - 1).astype(np.float32)
            w = 0.5 + 0.5 * np.cos(np.pi * (k + 1) / (steps + 1))
            acc += w * cv2.remap(noise, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
            total += w
    return acc / total


def main():
    wrap = np.asarray(Image.open('public/assets/neptune/full/wrap.webp').convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    lum = wrap @ np.array([0.3, 0.5, 0.2], np.float32)
    lum = wrap_blur(lum, TENSOR[0])
    ix = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3)
    iy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3)
    lat = (np.arange(H, dtype=np.float32) + 0.5) / H * np.pi - np.pi / 2
    ix *= (1 / np.maximum(np.cos(lat), 0.05))[:, None]
    jxx, jxy, jyy = wrap_blur(ix * ix, TENSOR[1]), wrap_blur(ix * iy, TENSOR[1]), wrap_blur(iy * iy, TENSOR[1])
    c2, s2 = jyy - jxx, -2 * jxy
    mag = np.hypot(c2, s2)
    coh = mag / (jxx + jyy + 1e-9)
    lon = ((np.arange(W, dtype=np.float32) + 0.5) / W - 0.5) * 2 * np.pi
    slon, slat = np.radians(STORM[0]), -np.radians(STORM[1])
    away = np.degrees(np.arccos(np.clip(np.sin(lat)[:, None] * np.sin(slat) + np.cos(lat)[:, None] * np.cos(slat) * np.cos(lon[None, :] - slon), -1, 1)))
    across = np.abs(np.degrees(0.5 * np.arctan2(s2, c2)))
    keep = np.maximum(1 - step(away, STORM[2], STORM[3]), 1 - step(across, ACROSS[0], ACROSS[1])).astype(np.float32)
    print('measured direction kept on %.2f of the map' % keep.mean())
    c2 = keep * coh * c2 / (mag + 1e-12) + ZONAL
    s2 = keep * coh * s2 / (mag + 1e-12)
    c2, s2 = wrap_blur(c2, 6.0), wrap_blur(s2, 6.0)
    ang = 0.5 * np.arctan2(s2, c2)
    print('coherence median %.3f p90 %.3f; flow within 10 deg of zonal on %.2f of the map' % (np.median(coh), np.percentile(coh, 90), (np.abs(np.degrees(ang)) < 10).mean()))
    rng = np.random.default_rng(SEED)
    bend = wrap_blur(rows_noise(rng, MEANDER[1] / 3), MEANDER[1] / 3)
    ang = ang + MEANDER[0] * bend / bend.std() * np.cos(lat)[:, None]
    vx, vy = np.cos(ang).astype(np.float32), np.sin(ang).astype(np.float32)
    out = np.zeros((H, W), np.float32)
    for steps, scale, weight in OCTAVES:
        part = lic(rows_noise(rng, scale), vx, vy, steps)
        part -= wrap_blur(part, 24.0)
        out += weight * part / part.std()
    out /= out.std()
    out = np.exp(SKEW * out)
    out = (out - out.mean()) / out.std()
    calm = lic(wrap_blur(rows_noise(rng, CALM[0] / 4), CALM[0] / 4), vx, vy, 40)
    calm = (calm - calm.mean()) / calm.std()
    env = CALM[1] + (1 - CALM[1]) * np.clip((calm - (-CALM[2])) / (CALM[3] + CALM[2]), 0, 1) ** 1.5
    out = out * env
    out = out / out.std() * STD
    out -= wrap_blur(out, 32.0)
    np.save(WORK + 'flow.npy', out)
    img = np.clip(0.5 + out, 0, 1)
    print('detail std %.3f clipped share %.4f' % (out.std(), ((out < -0.5) | (out > 0.5)).mean()))
    for name, size in (('full', (W, H)), ('web', (W // 2, H // 2))):
        im = Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'L')
        if size != (W, H):
            im = im.resize(size, Image.LANCZOS)
        path = os.path.join(OUT, name, 'flow.webp')
        im.save(path, quality=90, method=6)
        print(path, size, os.path.getsize(path))


main()
