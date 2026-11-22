import json
import sys

import cv2
import numpy as np

import geo

OUT = geo.ROOT / "src" / "stops" / "earth" / "trim.json"
LIMIT = (0.8, 1.2)
FIRST = 17
BLUR = 12
PASSES = 8
STEP = 1.6


def main():
    still = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else OUT
    film = geo.read(still)[..., :3].astype(np.float32)
    h, w = film.shape[:2]
    small = lambda a: cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    hero = small(geo.hero(1)[..., :3])
    g = geo.hero_geometry(1)
    hit, ndl, cosv = small(g["hit"]), small(g["ndl"]), small(g["cosv"])
    use = ((hit > 0.999) & (cosv > 0.35)).astype(np.float32)
    x = (ndl + 1) * 16
    knots = [np.clip(1 - np.abs(x - k), 0, 1) for k in range(33)]
    soft = lambda a: cv2.GaussianBlur(a, (0, 0), BLUR)
    want = soft(hero)
    light = geo.decode(film)

    def graded(m):
        gain = np.zeros_like(film)
        for k in range(33):
            gain += knots[k][..., None] * m[k]
        return geo.encode(light * np.where(hit[..., None] > 0.5, gain, 1)).astype(np.float32)

    m = np.ones((33, 3), np.float32)
    good = [k for k in range(FIRST, 33) if (knots[k] * use).sum() >= 400]
    for _ in range(PASSES):
        have = soft(graded(m))
        for k in good:
            wk = (knots[k] * use)[..., None]
            m[k] *= ((want * wk).sum((0, 1)) / (have * wk).sum((0, 1))) ** STEP
        for k in range(FIRST, 33):
            if k not in good:
                m[k] = m[min(good, key=lambda q: abs(q - k))]
    fit = m.copy()
    for k in range(FIRST + 1, 32):
        fit[k] = 0.25 * m[k - 1] + 0.5 * m[k] + 0.25 * m[k + 1]
    old = json.loads(OUT.read_text())["curve"]
    new = np.clip(np.asarray(old) * fit, *LIMIT)
    with open(out, "w") as f:
        f.write(json.dumps({"curve": [[round(float(v), 4) for v in row] for row in new]}) + "\n")
    luma = lambda a: a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    bright, dark = luma(want) * 255 > 60, luma(want) * 255 < 20
    now, then = (soft(film) - want) * 255, (soft(graded(fit)) - want) * 255
    print("over luma 60: film minus hero %s, predicted %s" % (now[bright].mean(0).round(2), then[bright].mean(0).round(2)))
    print("under luma 20: film minus hero %s, predicted %s" % (now[dark].mean(0).round(2), then[dark].mean(0).round(2)))
    for k in range(FIRST, 33, 2):
        print("ndl %+.3f  fit %s  trim %s" % (k / 16 - 1, fit[k].round(3), new[k].round(3)))


if __name__ == "__main__":
    main()
