import json
import sys

import cv2
import numpy as np

from compose0 import lab
from geo import WORK, map_lonlat
from seamless import blur_wrap
from stage1c import ang_from, ss

W = 4096
K_DETAIL = 45.0
CANYON = 3500.0


def main(color="final-4096.npy", storm="storm-2048.npy"):
    C = np.load(WORK / color).astype(np.float32)
    M = np.load(WORK / "mola-warped-4096.npy").astype(np.float32)
    S = cv2.resize(np.load(WORK / storm).astype(np.float32), (W, W // 2), interpolation=cv2.INTER_LINEAR)
    LON, LAT = map_lonlat(W)
    Lab = lab(C)
    L = Lab[..., 0]
    box = (ss(-112, -104, LON) * (1 - ss(-38, -30, LON)) * ss(-24, -18, LAT) * (1 - ss(0, 5, LAT)))
    lo_fine = blur_wrap(M, 10)
    lo_wide = blur_wrap(M, 40)
    base = lo_fine * (1 - box) + lo_wide * box
    band = blur_wrap(L, 1.5) - blur_wrap(L, 14)
    pale = np.clip((L - 70) / 15, 0, 1) * np.clip((12 - np.hypot(Lab[..., 1], Lab[..., 2]) + 12) / 12, 0, 1)
    mute = np.clip(1 - S - pale, 0, 1)
    detail = K_DETAIL * np.clip(band, -40, 40) * mute
    dark = np.clip((blur_wrap(L, 30) - L - 4) / 14, 0, 1)
    dark = cv2.GaussianBlur(dark, (0, 0), 2.0) * box * mute
    h = base + detail - CANYON * dark
    h = blur_wrap(h, 0.8)
    lo, hi = float(h.min()), float(h.max())
    q = np.round((h - lo) / (hi - lo) * 65535).astype("<u2")
    np.save(WORK / "height-4096.npy", h.astype(np.float32))
    q.tofile(WORK / "wrap-height-4096.bin")
    w = cv2.resize(h, (2048, 1024), interpolation=cv2.INTER_AREA)
    qw = np.round((w - lo) / (hi - lo) * 65535).astype("<u2")
    qw.tofile(WORK / "wrap-height-2048.bin")
    json.dump({"min_m": lo, "max_m": hi}, open(WORK / "height-range.json", "w"))
    cv2.imwrite(str(WORK / "v_height.jpg"), (cv2.resize(q, (2048, 1024), interpolation=cv2.INTER_AREA) / 257).astype(np.uint8))
    print("range m", lo, hi)


if __name__ == "__main__":
    main(*sys.argv[1:])
