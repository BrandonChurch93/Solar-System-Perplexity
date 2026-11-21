import json
import sys

import cv2
import numpy as np

import geo

OFFS = np.arange(-10.0, 5.0, 1.0)
PAS = np.arange(200.0, 341.0, 1.0)


def profile(img, cx, cy, r):
    out = np.zeros((len(PAS), len(OFFS), 3))
    for i, pa in enumerate(PAS):
        a = np.radians(pa)
        for j, o in enumerate(OFFS):
            out[i, j] = cv2.getRectSubPix(img, (1, 1), (cx + np.sin(a) * (r + o), cy - np.cos(a) * (r + o)))[0, 0]
    return out


def main():
    hero = cv2.imread(str(geo.HERO))
    c = json.loads((geo.ROOT / "assets-src" / "earth" / "fit.json").read_text())["circle"]
    for still in sys.argv[1:]:
        film = cv2.imread(still)
        s = film.shape[1] / hero.shape[1]
        h = cv2.resize(hero, (film.shape[1], film.shape[0]), interpolation=cv2.INTER_LANCZOS4)[..., ::-1].astype(np.float32)
        f = film[..., ::-1].astype(np.float32)
        ph = profile(h, c["cx"] * s, c["cy"] * s, c["r"] * s)
        pf = profile(f, c["cx"] * s, c["cy"] * s, c["r"] * s)
        d = pf - ph
        print(still)
        print("  offset   mean film minus hero (R G B)   mean abs")
        for j, o in enumerate(OFFS):
            print("  %5.0f   %6.1f %6.1f %6.1f   %5.1f" % (o, *d[:, j].mean(0), np.abs(d[:, j]).mean()))
        inner = (OFFS >= -8) & (OFFS <= 3)
        print("  mean abs over offsets -8 to 3: %.2f, red only %.2f" % (np.abs(d[:, inner]).mean(), np.abs(d[:, inner, 0]).mean()))
        step = np.abs(np.diff(pf[..., 0], axis=1)).max(1).mean() , np.abs(np.diff(ph[..., 0], axis=1)).max(1).mean()
        print("  largest red step between neighbour offsets, mean over the arc: film %.1f hero %.1f" % step)


if __name__ == "__main__":
    main()
