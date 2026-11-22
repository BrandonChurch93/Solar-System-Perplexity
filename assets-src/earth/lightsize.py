import sys

import cv2
import numpy as np

import geo

W = np.array([0.2126, 0.7152, 0.0722], np.float32)


def blobs(img, m, name):
    lum = img @ W
    base = cv2.medianBlur((np.clip(lum, 0, 1) * 255).astype(np.uint8), 15).astype(np.float32) / 255
    e = np.maximum(lum - base, 0) * m
    pk = (e == cv2.dilate(e, np.ones((5, 5), np.uint8))) & (e > 0.12)
    h, w = e.shape
    rows = []
    for y, x in zip(*np.nonzero(pk)):
        if y < 6 or x < 6 or y > h - 7 or x > w - 7:
            continue
        win = e[y - 4:y + 5, x - 4:x + 5]
        rows.append((e[y, x], (win > 0.5 * e[y, x]).sum(), *img[y, x]))
    r = np.array(rows)
    top = r[np.argsort(-r[:, 0])[:15]]
    print("%-5s lights %d, excess over 0.3: %d px, over 0.5: %d px, over 0.8: %d px; 15 brightest: colour %s, pixels over half of the peak %.1f; all: %.1f" % (
        name, len(r), (e > 0.3).sum(), (e > 0.5).sum(), (e > 0.8).sum(), (top[:, 2:5].mean(0) * 255).round(0), top[:, 1].mean(), r[:, 1].mean()))


def main():
    film = geo.read(sys.argv[1])[..., :3].astype(np.float32)
    h, w = film.shape[:2]
    small = lambda a: cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    hero = small(geo.hero(1)[..., :3])
    g = geo.hero_geometry(1)
    m = (small(g["hit"]) > 0.999) & (small(g["ndl"]) < -0.22) & (small(g["cosv"]) > 0.3)
    blobs(hero, m, "hero")
    blobs(film, m, "film")


if __name__ == "__main__":
    main()
