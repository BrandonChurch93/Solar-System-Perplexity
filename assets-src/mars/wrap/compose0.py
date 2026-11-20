import cv2
import numpy as np

from geo import WORK, map_lonlat


def lab(x):
    return cv2.cvtColor(np.clip(x, 0, 1).astype(np.float32), cv2.COLOR_RGB2LAB)


def rgb(x):
    return np.clip(cv2.cvtColor(x.astype(np.float32), cv2.COLOR_LAB2RGB), 0, 1)


def match_lab(src, ref, m_src, m_ref, step=4):
    a, b = lab(src[::step, ::step]), lab(ref[::step, ::step])
    full = lab(src)
    out = full.copy()
    q = np.linspace(0, 100, 201)
    for c in range(3):
        out[..., c] = np.interp(full[..., c], np.percentile(a[..., c][m_src[::step, ::step]], q),
                                np.percentile(b[..., c][m_ref[::step, ::step]], q))
    return rgb(out)


def suppress_frost(rec, W):
    LON, LAT = map_lonlat(W)
    L = lab(rec)
    ang = np.degrees(np.arccos(np.clip(np.sin(np.radians(LAT)) * np.sin(np.radians(-42)) + np.cos(np.radians(LAT)) * np.cos(np.radians(-42)) * np.cos(np.radians(LON - 70)), -1, 1)))
    zone = np.clip((LAT - 68) / 6, 0, 1) + np.clip((24 - ang) / 6, 0, 1)
    zone = np.clip(zone, 0, 1)
    ref = np.median(L[(LAT > 40) & (LAT < 60)][::7], 0)
    over = np.clip((L[..., 0] - ref[0]) / 25, 0, 1) * zone
    out = L.copy()
    out[..., 0] = L[..., 0] - over * (L[..., 0] - ref[0]) * 0.8
    out[..., 1] = L[..., 1] + over * (ref[1] - L[..., 1]) * 0.8
    out[..., 2] = L[..., 2] + over * (ref[2] - L[..., 2]) * 0.8
    return rgb(out)


def run(W=4096):
    vk = np.load(WORK / f"viking-warped-{W}.npy").astype(np.float32)
    de = np.load(WORK / f"delit-{W}.npy").astype(np.float32)
    cf = np.load(WORK / f"conf-{W}.npy").astype(np.float32)
    m = cf > 0.9
    rec = match_lab(vk, de, m, m)
    rec = suppress_frost(rec, W)
    np.save(WORK / f"guide-{W}.npy", rec.astype(np.float16))
    c0 = de * cf[..., None] + rec * (1 - cf[..., None])
    np.save(WORK / f"c0-{W}.npy", c0.astype(np.float16))
    cv2.imwrite(str(WORK / "v_c0.jpg"), cv2.cvtColor((cv2.resize(np.clip(c0, 0, 1), (2048, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))


if __name__ == "__main__":
    run()
