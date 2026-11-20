import json
import sys

import cv2
import numpy as np

from faces import basis, render_face
from geo import WORK

FACES = {"n": (0, 90), "s": (0, -90), "w": (-90, 0), "c": (0, 0), "e": (90, 0), "b": (180, 0)}
FOV = 100
N = 2048


def main(src="c0-4096.npy", prefix="in"):
    c0 = np.load(WORK / src).astype(np.float32)
    out = WORK / "s1"
    out.mkdir(exist_ok=True)
    for k, (lo, la) in FACES.items():
        f = render_face(c0, basis(lo, la), FOV, N)
        f8 = cv2.cvtColor((np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
        cv2.imwrite(str(out / f"{prefix}-{k}.png"), f8)
        cv2.imwrite(str(out / f"{prefix}-{k}.jpg"), f8, [cv2.IMWRITE_JPEG_QUALITY, 95])


if __name__ == "__main__":
    main(*sys.argv[1:])
