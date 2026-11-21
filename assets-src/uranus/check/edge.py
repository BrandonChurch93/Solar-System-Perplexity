import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

CX, CY = 1458.86, 860.13
A, B, ROT = 519.81, 530.77, -2.75


def load(path, shift):
    im = Image.open(path).convert('RGB')
    if im.size != (2816, 1584):
        im = im.resize((2816, 1584), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    if shift:
        a = geo.undrift(a)
    return np.log(geo.scene(a) @ np.array([0.2126, 0.7152, 0.0722]) + 0.004)


def edge(img, ang):
    t = np.deg2rad(ang + np.linspace(-4, 4, 33))
    r = np.deg2rad(ROT)
    ex, ey = A * np.cos(t), B * np.sin(t)
    px = CX + ex * np.cos(r) - ey * np.sin(r)
    py = CY - (ex * np.sin(r) + ey * np.cos(r))
    nx, ny = np.cos(t) / A, np.sin(t) / B
    gx, gy = nx * np.cos(r) - ny * np.sin(r), -(nx * np.sin(r) + ny * np.cos(r))
    g = np.hypot(gx, gy)
    gx, gy = gx / g, gy / g
    s = np.arange(-8, 8.01, 0.25)
    prof = np.median(ndi.map_coordinates(img, [py[:, None] + gy[:, None] * s, px[:, None] + gx[:, None] * s], order=3), 0)
    grad = ndi.gaussian_filter1d(prof, 3, order=1)
    k = int(np.argmin(grad))
    if 0 < k < len(s) - 1:
        den = grad[k - 1] - 2 * grad[k] + grad[k + 1]
        off = 0.5 * (grad[k - 1] - grad[k + 1]) / den if den != 0 else 0
    else:
        off = 0
    return s[k] + off * 0.25, -grad[k]


def main():
    hero = load('references/approved/uranus-hero.png', False)
    film = load(sys.argv[1], True)
    rows = []
    for ang in range(0, 360, 15):
        h, hs = edge(hero, ang)
        f, fs = edge(film, ang)
        rows.append((ang, h, f, f - h))
        print('angle %3d  hero edge %+5.2f px (step %.2f)  film edge %+5.2f px (step %.2f)  film - hero %+5.2f' % (ang, h, hs, f, fs, f - h))
    d = np.array([r[3] for r in rows])
    a = np.deg2rad([r[0] for r in rows])
    m = np.stack([np.ones_like(a), np.cos(a), np.sin(a), np.cos(2 * a), np.sin(2 * a)], 1)
    c = np.linalg.lstsq(m, d, rcond=None)[0]
    print('film - hero fit: mean %+.2f  cos %+.2f  sin %+.2f  cos2 %+.2f  sin2 %+.2f  residual rms %.2f' % (*c, (d - m @ c).std()))


main()
