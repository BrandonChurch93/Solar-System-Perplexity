import sys

import cv2
import numpy as np

import geo


def energy(img, m):
    lum = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    base = cv2.medianBlur((np.clip(lum, 0, 1) * 255).astype(np.uint8), 15).astype(np.float32) / 255
    warm = (img[..., 0] - img[..., 2]) > 0.06
    e = np.maximum(lum - base, 0) * m * warm
    return e, img


def main():
    film = geo.read(sys.argv[1])[..., :3].astype(np.float32)
    h, w = film.shape[:2]
    small = lambda a: cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    hero = small(geo.hero(1)[..., :3])
    g = geo.hero_geometry(1)
    hit, ndl, cosv = small(g["hit"]), small(g["ndl"]), small(g["cosv"])
    m = (hit > 0.999) & (ndl < -0.22) & (cosv > 0.3)
    eh, _ = energy(hero, m)
    ef, _ = energy(film, m)
    print("lights energy (code sum): hero %.1f film %.1f ratio %.3f" % (eh.sum(), ef.sum(), ef.sum() / eh.sum()))
    for name, e, img in (("hero", eh, hero), ("film", ef, film)):
        k = e > 0.08
        print(name, "pixels over 0.08:", int(k.sum()), "mean colour of those", (img[k].mean(0) * 255).round(1), "p99 lum", np.percentile(e[m], 99.9).round(3))


if __name__ == "__main__":
    main()
