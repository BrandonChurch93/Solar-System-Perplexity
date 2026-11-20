import json

import cv2
import numpy as np
from PIL import Image

from geo import ROOT, WORK, map_lonlat

CACHE = ROOT / "references" / "cache" / "mars"


def warp_field(W):
    pts = json.loads((ROOT / "assets-src/mars/wrap/landmarks.json").read_text())["points"]
    LON, LAT = map_lonlat(W)
    P = np.array([p["painted"] for p in pts], float)
    D = np.array([np.subtract(p["painted"], p["real"]) for p in pts], float)
    def ang(lo1, la1, lo2, la2):
        a = np.radians
        c = np.sin(a(la1)) * np.sin(a(la2)) + np.cos(a(la1)) * np.cos(a(la2)) * np.cos(a(lo1 - lo2))
        return np.degrees(np.arccos(np.clip(c, -1, 1)))
    K = np.exp(-(ang(P[:, None, 0], P[:, None, 1], P[None, :, 0], P[None, :, 1]) / 12.0) ** 2)
    wts = np.linalg.solve(K + 0.05 * np.eye(len(P)), D)
    dl = np.zeros(LON.shape)
    db = np.zeros(LON.shape)
    for i in range(len(P)):
        k = np.exp(-(ang(LON, LAT, P[i, 0], P[i, 1]) / 12.0) ** 2)
        dl += k * wts[i, 0]
        db += k * wts[i, 1]
    return LON - dl, LAT - db


def sample_equirect(img, lon, lat):
    h, w = img.shape[:2]
    x = ((lon + 180) / 360 * w - 0.5) % w
    y = (90 - lat) / 180 * h - 0.5
    pad = np.concatenate([img[:, -8:], img, img[:, :8]], 1)
    return cv2.remap(pad, (x + 8).astype(np.float32), y.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def load_viking():
    return np.asarray(Image.open(CACHE / "viking-4096.png").convert("RGB")).astype(np.float32) / 255


def load_mola():
    a = np.fromfile(CACHE / "megt90n000eb.img", dtype=">i2").reshape(2880, 5760).astype(np.float32)
    return np.roll(a, 2880, axis=1)


def run(W=4096):
    lon_s, lat_s = warp_field(W)
    vk = sample_equirect(load_viking(), lon_s, lat_s)
    mo = sample_equirect(load_mola(), lon_s, lat_s)
    np.save(WORK / f"viking-warped-{W}.npy", vk.astype(np.float16))
    np.save(WORK / f"mola-warped-{W}.npy", mo.astype(np.float32))
    print("mola range", mo.min(), mo.max())


if __name__ == "__main__":
    run()
