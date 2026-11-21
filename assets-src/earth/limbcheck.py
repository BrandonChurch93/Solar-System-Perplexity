import sys

import cv2
import numpy as np

import geo

OFFS = [-40, -20, -10, -5, -3, -2, -1, 0, 1, 2, 3, 5, 10, 20, 40, 80, 150]


def profiles(img, hit, cx, cy, pas):
    out = {}
    for pa in pas:
        a = np.radians(pa)
        ux, uy = np.sin(a), -np.cos(a)
        rad = np.arange(600.0, 760.0, 0.25)
        inside = hit[np.clip((cy + uy * rad).astype(int), 0, hit.shape[0] - 1), np.clip((cx + ux * rad).astype(int), 0, hit.shape[1] - 1)]
        rl = rad[np.nonzero(inside)[0][-1]] + 0.25
        rows = []
        for o in OFFS:
            acc = []
            for da in np.radians(np.arange(-1.5, 1.6, 0.5)):
                x = cx + np.sin(a + da) * (rl + o)
                y = cy - np.cos(a + da) * (rl + o)
                if 1 <= x < img.shape[1] - 1 and 1 <= y < img.shape[0] - 1:
                    acc.append(img[int(y), int(x)])
            rows.append(np.median(acc, axis=0) if acc else np.full(3, np.nan))
        out[pa] = (rl, np.asarray(rows))
    return out


def main():
    still = sys.argv[1]
    pas = [int(v) for v in sys.argv[2:]] or list(range(0, 360, 30))
    hero = geo.decode(geo.hero(1)[..., :3].astype(np.float64))
    film = geo.read(still)[..., :3]
    film = cv2.resize(film, (hero.shape[1], hero.shape[0]), interpolation=cv2.INTER_CUBIC if film.shape[1] < hero.shape[1] else cv2.INTER_AREA)
    film = geo.decode(film.astype(np.float64))
    g = geo.hero_geometry(1)
    hit = g["hit"]
    c = geo.FIT["circle"] if "circle" in geo.FIT else None
    cx, cy = (c["cx"], c["cy"]) if c else (1470.13, 793.37)
    ph = profiles(hero, hit, cx, cy, pas)
    pf = profiles(film, hit, cx, cy, pas)
    for pa in pas:
        print(f"pa {pa} limb r {ph[pa][0]:.1f}")
        for i, o in enumerate(OFFS):
            h, f = ph[pa][1][i], pf[pa][1][i]
            print(f"  {o:5d}  hero {h[0]:7.4f} {h[1]:7.4f} {h[2]:7.4f}   film {f[0]:7.4f} {f[1]:7.4f} {f[2]:7.4f}")


if __name__ == "__main__":
    main()
