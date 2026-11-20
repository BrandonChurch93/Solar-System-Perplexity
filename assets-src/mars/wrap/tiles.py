import json
import sys

import cv2
import numpy as np

from faces import basis, render_face, splat
from geo import WORK

N = 2048
OUT = WORK / "s2"


def tile_list():
    t = {}
    for i in range(10):
        t[f"e{i}"] = (-180 + 36 * i + 18, 0, 50)
    for s, la in (("n", 40), ("s", -40)):
        for i in range(8):
            t[f"{s}{i}"] = (-180 + 45 * i + 22.5 * (s == "s"), la, 56)
        for i in range(5):
            t[f"{s}p{i}"] = (-180 + 72 * i + 36 * (s == "s"), la * 70 / 40, 60)
    t["np"] = (0, 90, 50)
    t["sp"] = (0, -90, 50)
    return t


def rows_for(la, fov, H):
    a = 0.75 * fov
    lo, hi = max(-90, la - a), min(90, la + a)
    if abs(la) + a > 80:
        lo, hi = (lo, 90) if la > 0 else (-90, hi)
    r0 = int(np.floor((90 - hi) / 180 * H))
    r1 = int(np.ceil((90 - lo) / 180 * H))
    return slice(max(0, r0), min(H, r1))


def render(src):
    m = np.load(WORK / src).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    for k, (lo, la, fov) in tile_list().items():
        f = render_face(m, basis(lo, la), fov, N)
        cv2.imwrite(str(OUT / f"in-{k}.jpg"), cv2.cvtColor((np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR),
                    [cv2.IMWRITE_JPEG_QUALITY, 95])
    json.dump(tile_list(), open(OUT / "tiles.json", "w"), indent=1)


if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else "stage1-4096.npy")
