import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune'
WORK = 'out/work/nep/eye/'
os.makedirs(WORK, exist_ok=True)
W, H = 2816, 1584
SEED = 4860
TENSOR = (1.5, 10.0, 30.0)
OCTAVES = ((22, 1.4, 0.5), (16, 3.0, 0.5), (10, 6.0, 0.45))
SKEW = 0.45
KEEP = 9.0
STORM = (1490, 722)
PIT = (10.0, 0.2, 14.0)
WALL = (70.0, 30.0, 0.45)
FIELD = (40.0, 110.0, 6.0)
EYE_GAIN = 0.11
RIBBON_BOX = (1960, 660, 2816, 1230)
RIBBON = (100, 0.12, 0.3, 6.0)
RIBBON_GAIN = 0.05
SOFT = 3.5
BORDER = 24
UNIT = 127.0 / 255.0


def step(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def blur(x, sigma):
    return cv2.GaussianBlur(x, (0, 0), sigma)


def lic(noise, vx, vy, steps):
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    acc = noise.copy()
    total = 1.0
    for sign in (1.0, -1.0):
        px, py = gx.copy(), gy.copy()
        lastx, lasty = vx, vy
        for k in range(steps):
            sx = cv2.remap(vx, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            sy = cv2.remap(vy, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            flip = np.where(sx * lastx + sy * lasty < 0, -1.0, 1.0).astype(np.float32)
            sx, sy = sx * flip, sy * flip
            lastx, lasty = sx, sy
            px = np.clip(px + sign * sx, 0, W - 1).astype(np.float32)
            py = np.clip(py + sign * sy, 0, H - 1).astype(np.float32)
            w = 0.5 + 0.5 * np.cos(np.pi * (k + 1) / (steps + 1))
            acc += w * cv2.remap(noise, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            total += w
    return acc / total


def box(b):
    m = np.zeros((H, W), np.float32)
    m[b[1]:b[3], b[0]:b[2]] = 1
    return blur(m, 30.0)


def main():
    deck = np.asarray(Image.open('public/assets/neptune/full/close-deck.webp').convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    lum = deck @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    g = blur(lum, TENSOR[0])
    ix = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)
    iy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    jxx, jxy, jyy = blur(ix * ix, TENSOR[1]), blur(ix * iy, TENSOR[1]), blur(iy * iy, TENSOR[1])
    c2, s2 = jyy - jxx, -2 * jxy
    c2, s2 = blur(c2, TENSOR[2]), blur(s2, TENSOR[2])
    mag = np.hypot(c2, s2) + 1e-12
    c2, s2 = c2 / mag, s2 / mag

    dark = (blur(lum, PIT[0]) < PIT[1]).astype(np.uint8)
    count, labels = cv2.connectedComponents(dark)
    hole = (labels == labels[STORM[1], STORM[0]]).astype(np.uint8)
    hole = cv2.morphologyEx(hole, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    signed = cv2.distanceTransform(hole, cv2.DIST_L2, 5) - cv2.distanceTransform(1 - hole, cv2.DIST_L2, 5)
    signed = blur(signed.astype(np.float32), PIT[2])
    nx = cv2.Sobel(signed, cv2.CV_32F, 1, 0, ksize=5)
    ny = cv2.Sobel(signed, cv2.CV_32F, 0, 1, ksize=5)
    rim = np.arctan2(nx, -ny) + np.radians(FIELD[2])
    near = 1 - step(-signed, FIELD[0], FIELD[1])
    c2 = near * np.cos(2 * rim) + (1 - near) * c2
    s2 = near * np.sin(2 * rim) + (1 - near) * s2
    c2, s2 = blur(c2, 8.0), blur(s2, 8.0)
    ang = 0.5 * np.arctan2(s2, c2)
    print('pit: %d px (%.4f of the frame), box x %d to %d, y %d to %d' % (hole.sum(), hole.mean(), np.where(hole.any(0))[0][0], np.where(hole.any(0))[0][-1], np.where(hole.any(1))[0][0], np.where(hole.any(1))[0][-1]))
    vx, vy = np.cos(ang).astype(np.float32), np.sin(ang).astype(np.float32)
    np.save(WORK + 'angle.npy', ang)

    rng = np.random.default_rng(SEED)
    detail = np.zeros((H, W), np.float32)
    for steps, cell, weight in OCTAVES:
        n = rng.random((int(H / cell) + 2, int(W / cell) + 2)).astype(np.float32)
        n = cv2.resize(n, (W, H), interpolation=cv2.INTER_CUBIC)
        part = lic(n - n.mean(), vx, vy, steps)
        part -= blur(part, KEEP)
        detail += weight * part / part.std()
    detail /= detail.std()
    detail = np.exp(SKEW * detail)
    detail = (detail - detail.mean()) / detail.std()
    detail -= blur(detail, KEEP)

    pit = step(signed, -WALL[1], 0.0)
    wall = 1 - step(signed, 0.0, WALL[0])
    eye = pit * (WALL[2] + (1 - WALL[2]) * wall)

    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (RIBBON[0], RIBBON[0]))
    closed = blur(cv2.morphologyEx(blur(lum, 2.0), cv2.MORPH_CLOSE, k), 8.0)
    dark = np.clip(1 - blur(lum, 1.2) / np.maximum(closed, 1e-3), 0, 1)
    region = box(RIBBON_BOX)
    body = (blur(dark, RIBBON[3]) * region > RIBBON[2]).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(body)
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    gate = blur(cv2.dilate((labels == largest).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))).astype(np.float32), 6.0)
    print('ribbon body: %d px, box x %d to %d, y %d to %d' % (stats[largest, cv2.CC_STAT_AREA], stats[largest, 0], stats[largest, 0] + stats[largest, 2], stats[largest, 1], stats[largest, 1] + stats[largest, 3]))
    shadow = dark * step(blur(dark, RIBBON[3]), RIBBON[1], RIBBON[2]) * gate
    ratio = 1 - shadow
    soft = blur(ratio, SOFT) / ratio
    ribbon = step(blur(shadow, 3.0), 0.15, 0.4)

    edge = np.minimum(np.minimum(np.arange(W)[None, :], W - 1 - np.arange(W)[None, :]), np.minimum(np.arange(H)[:, None], H - 1 - np.arange(H)[:, None]))
    inside = step(edge.astype(np.float32), 2, BORDER)
    fine = 1 + (EYE_GAIN * eye + RIBBON_GAIN * ribbon) * detail * inside
    soft = 1 + (soft - 1) * inside
    print('eye mask share %.4f mean weight in it %.2f; ribbon share %.4f' % ((eye > 0.05).mean(), eye[eye > 0.05].mean(), (ribbon > 0.5).mean()))
    print('fine factor in the eye: p1 %.3f p50 %.3f p99 %.3f; soft factor min %.3f max %.3f' % (np.percentile(fine[eye > 0.3], 1), np.percentile(fine[eye > 0.3], 50), np.percentile(fine[eye > 0.3], 99), soft.min(), soft.max()))
    np.save(WORK + 'fine.npy', fine)
    np.save(WORK + 'soft.npy', soft)
    np.save(WORK + 'eye.npy', eye)
    np.save(WORK + 'ribbon.npy', ribbon)
    img = np.stack([np.clip(fine * UNIT, 0, 1), np.clip(soft * UNIT, 0, 1), np.full((H, W), UNIT, np.float32)], -1)
    for name, size in (('full', (W, H)), ('web', (W // 2, H // 2))):
        im = Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'RGB')
        if size != (W, H):
            im = im.resize(size, Image.LANCZOS)
        path = os.path.join(OUT, name, 'close-fine.webp')
        im.save(path, lossless=True, method=6)
        print(path, size, os.path.getsize(path))


main()
