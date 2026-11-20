import argparse
import math

import cv2
import numpy as np

from common import Body, body_from_fit, camera_from_fit, load_fit, load_hero, save_rgb, work_dir
from fit import silhouette_points


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stop", required=True)
    ap.add_argument("--size", type=int, default=110)
    ap.add_argument("--zoom", type=int, default=3)
    a = ap.parse_args()
    fit = load_fit(a.stop)
    cam = camera_from_fit(fit)
    img = load_hero(a.stop)
    h, w = img.shape[:2]
    body = body_from_fit(fit) if "globe" in fit else Body()
    sp = silhouette_points(cam, body, 1)[::4]
    sx, sy = sp[:, 0], sp[:, 1]
    c = fit["circle"]
    tiles = []
    for deg in range(0, 360, 30):
        t = math.radians(deg)
        px, py = c["cx"] + c["r"] * math.cos(t), c["cy"] + c["r"] * math.sin(t)
        x0, y0 = int(px - a.size / 2), int(py - a.size / 2)
        tile = np.zeros((a.size, a.size, 3), np.float32)
        xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + a.size, w), min(y0 + a.size, h)
        if xb > xa and yb > ya:
            tile[ya - y0:yb - y0, xa - x0:xb - x0] = img[ya:yb, xa:xb]
        tile = np.clip(tile, 0, 1) ** 0.6
        z = cv2.resize(tile, None, fx=a.zoom, fy=a.zoom, interpolation=cv2.INTER_NEAREST)
        sel = (sx > x0 - 2) & (sx < x0 + a.size + 2) & (sy > y0 - 2) & (sy < y0 + a.size + 2)
        for X, Y in zip(sx[sel], sy[sel]):
            zx, zy = int((X - x0) * a.zoom), int((Y - y0) * a.zoom)
            if 0 <= zx < z.shape[1] and 0 <= zy < z.shape[0]:
                z[max(zy - 1, 0):zy + 1, max(zx - 1, 0):zx + 1] = (1, 0, 1)
        tiles.append(z)
    rows = [np.concatenate(tiles[i:i + 4], 1) for i in range(0, 12, 4)]
    sheet = np.concatenate(rows, 0)
    out = work_dir(a.stop) / "limb-check.jpg"
    save_rgb(out, sheet)
    print(out)


if __name__ == "__main__":
    main()
