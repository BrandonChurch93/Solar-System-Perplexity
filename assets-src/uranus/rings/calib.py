import json
import struct
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/rings2/'
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
W, H = 1920, 1080
DRIFT = (-1.79, 2.21)


def basis(n):
    n = n / np.linalg.norm(n)
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return n, e1, np.cross(n, e1)


def resid(path):
    im = Image.open(path).convert('RGB')
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    lum = geo.scene(np.asarray(im).astype(np.float32) / 255).astype(np.float32) @ LUMA
    return lum - ndi.median_filter(lum, size=9)


def peak(img, x, y, nx, ny):
    acc = np.zeros(len(x), np.float32)
    for o in (-0.5, 0.0, 0.5):
        acc += cv2.remap(img, (x + nx * o).astype(np.float32), (y + ny * o).astype(np.float32), cv2.INTER_LINEAR)[:, 0]
    return acc / 3


def main():
    film = sys.argv[1] if len(sys.argv) > 1 else 'out/work/stills/f04035-16x9-draft-full.png'
    f = np.frombuffer(open('public/assets/uranus/full/rings.bin', 'rb').read(), '<f4')
    hero = resid('references/approved/uranus-hero.png')
    mine = resid(film)
    at = 1
    gains = []
    num = den = 0.0
    for i in range(int(f[0])):
        n = f[at:at + 3].astype(float)
        closed, th0, dth, m = f[at + 3], float(f[at + 4]), float(f[at + 5]), int(f[at + 6])
        r = f[at + 7:at + 7 + m].astype(float)
        a = f[at + 7 + m:at + 7 + 2 * m].astype(float)
        at += 7 + 2 * m
        n, u1, u2 = basis(n)
        th = th0 + np.arange(m) * dth
        p = r[:, None] * (np.cos(th)[:, None] * u1 + np.sin(th)[:, None] * u2)
        x, y = geo.project(p, W, H)
        x2, y2 = geo.project(p * 1.003, W, H)
        nx, ny = x2 - x, y2 - y
        ln = np.hypot(nx, ny) + 1e-9
        nx, ny = nx / ln, ny / ln
        v = p - geo.CAM
        dist = np.linalg.norm(v, axis=1)
        dd = v / dist[:, None]
        b = -(dd @ geo.CAM)
        closest = np.sqrt(np.maximum(geo.CAM @ geo.CAM - b * b, 0))
        ok = (closest > 1.05) & (x > 4) & (x < W - 5) & (y > 4) & (y < H - 5) & (a > max(0.008, 1.6 * a.min()))
        if ok.sum() < 8:
            gains.append(1.0)
            continue
        hp = ndi.median_filter(peak(hero, x, y, nx, ny), 9)[ok]
        fp = ndi.median_filter(peak(mine, x + DRIFT[0], y + DRIFT[1], nx, ny), 9)[ok]
        g = float(np.median(hp) / max(np.median(fp), 1e-6))
        num += float(np.median(hp)) * ok.sum()
        den += float(np.median(fp)) * ok.sum()
        gains.append(g)
        if closed > 0.5:
            print(i, 'r', round(float(r.mean()), 3), 'hero', round(float(np.median(hp)), 4), 'film', round(float(np.median(fp)), 4), 'ratio', round(g, 2))
    print('global ratio', round(num / den, 3), 'median of rings', round(float(np.median(gains)), 3))
    json.dump({'gains': gains, 'global': num / den}, open(OUT + 'calib.json', 'w'))


main()
