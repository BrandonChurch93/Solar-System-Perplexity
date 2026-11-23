import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g

OUT = g.ROOT / 'out/work/earth/place'
CANVAS = g.ROOT / 'out/work/earth/relief/canvas-full-1x.png'
PATCH = g.ROOT / 'public/assets/earth/full/patch-24.jpg'


def land_mask(p24):
    hsv = cv2.cvtColor(p24, cv2.COLOR_BGR2HSV).astype(np.int32)
    b, gr, r = [p24[..., i].astype(np.int32) for i in range(3)]
    m = ((gr > b + 6) & (hsv[..., 1] > 60) & (hsv[..., 0] < 75)) | ((r > b + 10) & (gr > b))
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m > 0


def overlay(c, az, name, step=4):
    p24 = cv2.resize(cv2.imread(str(PATCH)), (1024, 1024), interpolation=cv2.INTER_AREA)
    land = land_mask(p24)
    img = cv2.imread(str(CANVAS))
    tb = g.to_body(c, az)
    hh, ww = img.shape[:2]
    ys, xs = np.mgrid[0:hh:step, 0:ww:step]
    p, hit = g.sea(g.ray(xs + g.BOX[0], ys + g.BOX[1]))
    d = g.unit((p - g.CENTRE) @ tb.T)
    s = g.G.T @ g.SPOT
    u, v = g.plate_xy(s, 24, d)
    ok = hit & (d @ s > 0) & (u >= 0) & (u < 1) & (v >= 0) & (v < 1)
    ui = np.clip((u * 1024).astype(int), 0, 1023)
    vi = np.clip((v * 1024).astype(int), 0, 1023)
    m = land[vi, ui] & ok
    small = img[::step, ::step].copy()
    out = small.copy()
    edge = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    out[m] = (0.65 * out[m] + 0.35 * np.array([0, 0, 255])).astype(np.uint8)
    out[edge] = (0, 0, 255)
    globe = small.copy()
    globe[ok] = p24[vi, ui][ok]
    for pic in (out, globe):
        for x in (-g.BOX[0], -g.BOX[0] + g.W):
            cv2.line(pic, (x // step, 0), (x // step, pic.shape[0]), (0, 255, 255), 1)
        cv2.line(pic, (0, g.H // step), (pic.shape[1], g.H // step), (0, 255, 255), 1)
    cv2.imwrite(str(OUT / (name + '.jpg')), np.vstack([out, globe]), [cv2.IMWRITE_JPEG_QUALITY, 88])


if __name__ == '__main__':
    east, north, az, name = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
    overlay(g.offset(g.G.T @ g.SPOT, east, north), az, name)
