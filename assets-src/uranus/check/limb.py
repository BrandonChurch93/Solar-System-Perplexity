import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

CX, CY, R = 1460.3, 858.74, 528.64
RADII = (0.96, 0.97, 0.98, 0.985, 0.988, 0.99, 0.992, 0.994, 0.996, 0.998, 1.0, 1.002, 1.004, 1.006, 1.01, 1.015, 1.02, 1.03, 1.05, 1.1, 1.2)


def load(path, shift):
    im = Image.open(path).convert('RGB')
    if im.size != (2816, 1584):
        im = im.resize((2816, 1584), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    if shift:
        a = geo.undrift(a)
    return geo.scene(a)


def main():
    hero = load('references/approved/uranus-hero.png', False)
    film = load(sys.argv[1], True)
    angles = [float(a) for a in sys.argv[2:]] or [130, 150, 170, 200, 250, 300, 330, 30, 80]
    np.set_printoptions(precision=3, suppress=True, linewidth=220)
    for ang in angles:
        th = np.deg2rad(np.linspace(ang - 6, ang + 6, 241))
        print('angle', ang, '   hero | film')
        for rr in RADII:
            x = CX + R * rr * np.cos(th)
            y = CY - R * rr * np.sin(th)
            h = np.median(np.stack([ndi.map_coordinates(hero[..., c], [y, x], order=1) for c in range(3)], -1), 0)
            f = np.median(np.stack([ndi.map_coordinates(film[..., c], [y, x], order=1) for c in range(3)], -1), 0)
            print('  %.3f' % rr, h, '|', f)


main()
