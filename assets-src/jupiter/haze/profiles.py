import json
import sys

import cv2
import numpy as np

HERO = 'references/approved/jupiter-hero.png'
CX, CY, R = 1406.6, 789.0, 706.1
RADII = [0.9, 0.94, 0.97, 0.985, 0.995, 1.0, 1.004, 1.008, 1.015, 1.025, 1.04, 1.06, 1.09, 1.13, 1.2]


def scene(path):
    a = cv2.imread(path)[..., ::-1].astype(np.float32) / 255
    if a.shape[1] != 2816:
        a = cv2.resize(a, (2816, 1584), interpolation=cv2.INTER_CUBIC)
    a = np.where(a <= 0.04045, a / 12.92, ((np.clip(a, 0, 1) + 0.055) / 1.055) ** 2.4)
    y = np.clip(a, 0, 0.985)
    kk = 0.59 * y - 0.03
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


def profile(img, angle, radii, half=5, n=41):
    out = []
    for r in radii:
        a = np.radians(angle + np.linspace(-half, half, n))
        x = (CX + np.cos(a) * r * R).astype(np.float32)[None]
        y = (CY - np.sin(a) * r * R).astype(np.float32)[None]
        px = cv2.remap(img, x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[0]
        out.append(np.percentile(px, 35, axis=0) if r > 1.0 else np.median(px, axis=0))
    return np.array(out)


if __name__ == '__main__':
    film = scene(sys.argv[1])
    hero = scene(HERO)
    angles = [float(a) for a in sys.argv[2].split(',')] if len(sys.argv) > 2 else [180, 150, 120, 90, 60, 30, 0, -30, -60, -90, -120, -150]
    res = {}
    for ang in angles:
        h = profile(hero, ang, RADII)
        f = profile(film, ang, RADII)
        res[ang] = {'hero': h.tolist(), 'film': f.tolist()}
        print(f'angle {ang:6.0f}')
        for r, a, b in zip(RADII, h, f):
            print(f'  r {r:5.3f}  hero {a[0]:7.4f} {a[1]:7.4f} {a[2]:7.4f}   film {b[0]:7.4f} {b[1]:7.4f} {b[2]:7.4f}')
    json.dump(res, open('out/work/jupiter/limb-profiles.json', 'w'))
