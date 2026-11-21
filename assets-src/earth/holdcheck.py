import sys

import cv2
import numpy as np

import geo


def main():
    still = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else str(geo.WORK / "view" / "holdcheck.jpg")
    film = geo.read(still)[..., :3].astype(np.float32)
    h, w = film.shape[:2]
    hero = cv2.resize(geo.hero(1)[..., :3].astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    g = geo.hero_geometry(1)
    small = lambda a: cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    hit, ndl, rt, cosv = small(g["hit"]), small(g["ndl"]), small(g["rt"]), small(g["cosv"])
    disc = hit > 0.999
    regions = {
        "day core": disc & (ndl > 0.25) & (cosv > 0.45),
        "day rim": disc & (ndl > 0.25) & (cosv <= 0.45),
        "terminator": disc & (ndl <= 0.25) & (ndl > -0.2),
        "night core": disc & (ndl <= -0.2) & (cosv > 0.45),
        "night rim": disc & (ndl <= -0.2) & (cosv <= 0.45),
        "glow 1.0 to 1.1": (hit < 0.001) & (rt < 1.1),
        "sky 1.1 to 1.5": (rt >= 1.1) & (rt < 1.5),
        "sky beyond": rt >= 1.5,
    }
    d = (film - hero) * 255
    low = cv2.GaussianBlur(d, (0, 0), 6.0)
    print("region               px     mean diff (r g b)      abs    abs low   (code values, film minus hero)")
    for name, m in regions.items():
        print("%-16s %8d   %6.2f %6.2f %6.2f   %6.2f   %6.2f" % (name, m.sum(), *d[m].mean(0), np.abs(d[m]).mean(), np.abs(low[m]).mean()))
    view = np.clip(0.5 + low / 255 * 4, 0, 1)
    geo.write(out, np.hstack([hero, film, view])[::1, ::1], 88)


if __name__ == "__main__":
    main()
