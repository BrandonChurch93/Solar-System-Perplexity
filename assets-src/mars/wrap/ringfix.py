import cv2
import numpy as np

from compose0 import lab, rgb
from geo import WORK, map_lonlat
from seamless import blur_wrap
from stage1b_build import save
from stage1c import SUB, ang_from, ss

W = 4096
DIVE = (-81.86, -4.54)
CAP = (-72.0, 48.0)


def ring_weight(LON, LAT):
    A = ang_from(LON, LAT, *SUB)
    rw = ss(50, 58, A) * (1 - ss(80, 92, A))
    rw *= ss(30, 36, ang_from(LON, LAT, *DIVE))
    rw *= ss(9, 14, ang_from(LON, LAT, *CAP))
    cl = ss(-142, -136, LON) * (1 - ss(-110, -104, LON)) * ss(-44, -38, LAT) * (1 - ss(-12, -6, LAT))
    rw *= 1 - cl
    return rw


def main():
    S = np.load(WORK / "stage1c-4096.npy").astype(np.float32)
    G = np.load(WORK / "guide-4096.npy").astype(np.float32)
    LON, LAT = map_lonlat(W)
    rw = ring_weight(LON, LAT)
    Ls, Lg = lab(S), lab(G)
    sig = 14
    hs = Ls - blur_wrap(Ls, sig)
    hg = Lg - blur_wrap(Lg, sig)
    far = ang_from(LON, LAT, *SUB) > 95
    g = np.sqrt((hs[..., 0][far] ** 2).mean() / (hg[..., 0][far] ** 2).mean())
    hp = hs * (1 - rw[..., None]) + hg * g * rw[..., None]
    out = rgb(blur_wrap(Ls, sig) + hp)
    np.save(WORK / "ringfix-4096.npy", out.astype(np.float16))
    np.save(WORK / "ring-weight-4096.npy", rw.astype(np.float16))
    save(WORK / "v_ringfix.jpg", cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA), 90)
    print("guide hp gain", g)


if __name__ == "__main__":
    main()
