import json
import sys

import cv2
import numpy as np

import geo

OUT = geo.ROOT / "src" / "stops" / "earth" / "trim.json"
LIMIT = (0.8, 1.2)
NIGHT = 13


def main():
    still = sys.argv[1]
    film = geo.read(still)[..., :3].astype(np.float32)
    h, w = film.shape[:2]
    small = lambda a: cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    hero = small(geo.hero(1)[..., :3])
    g = geo.hero_geometry(1)
    hit, ndl, cosv = small(g["hit"]), small(g["ndl"]), small(g["cosv"])
    use = (hit > 0.999) & (cosv > 0.35)
    fl, hl = geo.decode(film), geo.decode(hero)
    old = json.loads(OUT.read_text())["curve"] if OUT.exists() and "reset" not in sys.argv else [[1, 1, 1]] * 33
    x = (ndl + 1) * 16
    ratio = np.ones((33, 3))
    count = np.zeros(33)
    for k in range(33):
        wgt = np.clip(1 - np.abs(x - k), 0, 1) * use
        count[k] = wgt.sum()
        if count[k] > 400 and k >= NIGHT:
            ratio[k] = (hl * wgt[..., None]).sum((0, 1)) / np.maximum((fl * wgt[..., None]).sum((0, 1)), 1e-9)
        elif count[k] > 400:
            sel = wgt > 0.5
            ratio[k] = np.median(hl[sel], 0) / np.maximum(np.median(fl[sel], 0), 1e-9)
    good = np.where(count > 400)[0]
    for k in range(33):
        if count[k] <= 400:
            ratio[k] = ratio[good[np.argmin(np.abs(good - k))]]
    smooth = ratio.copy()
    for k in range(1, 32):
        smooth[k] = 0.25 * ratio[k - 1] + 0.5 * ratio[k] + 0.25 * ratio[k + 1]
    new = np.clip(np.asarray(old) * smooth, *LIMIT)
    OUT.write_text(json.dumps({"curve": [[round(float(v), 4) for v in row] for row in new]}) + "\n")
    for k in range(0, 33, 2):
        print("ndl %+.3f  n %7d  ratio %s  trim %s" % (k / 16 - 1, count[k], ratio[k].round(3), new[k].round(3)))


if __name__ == "__main__":
    main()
