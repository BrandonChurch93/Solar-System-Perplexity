import sys

import cv2
import numpy as np

from compose0 import lab
from geo import WORK, map_lonlat
from seamless import blur_wrap
from stage1c import ang_from, ss

W = 2048
CENTER = (-85.5, 9.8)
R_IN, R_OUT = 10.0, 24.0


def main(color="final-4096.npy"):
    C = cv2.resize(np.load(WORK / color).astype(np.float32), (W, W // 2), interpolation=cv2.INTER_AREA)
    LON, LAT = map_lonlat(W)
    A = ang_from(LON, LAT, *CENTER)
    Lab = lab(C)
    chroma = blur_wrap(np.hypot(Lab[..., 1], Lab[..., 2]), 3)
    ref = blur_wrap(chroma, 40)
    hazy = np.clip((ref - chroma + 2) / 8, 0, 1)
    radial = 1 - ss(R_IN, R_OUT, A)
    m = np.maximum(radial * (0.35 + 0.65 * hazy), 1 - ss(2, R_IN, A))
    m = cv2.GaussianBlur(m, (0, 0), 6) * radial
    m = np.clip(m / m.max(), 0, 1)
    np.save(WORK / "storm-2048.npy", m.astype(np.float32))
    cv2.imwrite(str(WORK / "wrap-storm-2048.png"), np.round(m * 255).astype(np.uint8))
    cv2.imwrite(str(WORK / "wrap-storm-1024.png"), np.round(cv2.resize(m, (1024, 512), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8))
    print("max", m.max(), "area>0.5 deg2-ish px", int((m > 0.5).sum()))


if __name__ == "__main__":
    main(*sys.argv[1:])
