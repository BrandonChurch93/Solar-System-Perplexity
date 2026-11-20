import cv2
import numpy as np

from compose0 import lab, rgb
from geo import WORK, map_lonlat
from seamless import blur_wrap
from stage1b_build import core, save

W = 4096
SUB = (-73.7, -9.9)


def ang_from(LON, LAT, lo, la):
    a, b = np.radians(LAT), np.radians(la)
    c = np.sin(a) * np.sin(b) + np.cos(a) * np.cos(b) * np.cos(np.radians(LON - lo))
    return np.degrees(np.arccos(np.clip(c, -1, 1)))


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def qmatch(L, src, ref, step=5):
    out = L.copy()
    q = np.linspace(0, 100, 401)
    for c in range(3):
        out[..., c] = np.interp(L[..., c], np.percentile(L[..., c][src][::step], q), np.percentile(L[..., c][ref][::step], q))
    return out


def main():
    S = np.load(WORK / "stage1-4096.npy").astype(np.float32)
    G = np.load(WORK / "guide-4096.npy").astype(np.float32)
    LON, LAT = map_lonlat(W)
    A = ang_from(LON, LAT, *SUB)
    keep = 1 - ss(48, 70, A)
    inner = A < 45
    far = A > 80
    Ls, Lg = lab(S), lab(G)
    Lq = qmatch(Ls, far, inner)
    L1 = Ls * keep[..., None] + Lq * (1 - keep[..., None])
    Lgq = qmatch(Lg, far, inner)
    sig = 22
    low1 = blur_wrap(L1, sig)
    lowg = blur_wrap(Lgq, sig)
    hw = (ss(52, 64, A) * (1 - ss(88, 105, A)))[..., None]
    hel = ang_from(LON, LAT, 70, -42)
    hz = ss(0, 1, (24 - hel) / 8)
    base = np.median(low1[..., 0][far])
    low1[..., 0] -= hz * np.clip(low1[..., 0] - base, 0, None) * 0.7
    for c in (1, 2):
        low1[..., c] += hz * (np.median(low1[..., c][far]) - low1[..., c]) * 0.7
    hp = L1 - blur_wrap(L1, sig)
    low = low1 * (1 - hw) + lowg * hw
    strk = ss(57, 64, A) * ss(-178, -165, LON) * (1 - ss(-112, -102, LON)) * (1 - ss(-10, -2, LAT)) * ss(-62, -52, LAT)
    hp_alt = np.roll(hp, int(W * 50 / 360), axis=1)
    hp = hp * (1 - strk[..., None]) + hp_alt * strk[..., None]
    lp = blur_wrap(hp[..., 0] ** 2, 40) ** 0.5
    tgt = np.median(lp[inner])
    gain = np.clip(tgt / np.maximum(lp, 1e-3), 0.85, 2.0)
    gain = 1 + (gain - 1) * (1 - keep)
    L = low + hp * gain[..., None]
    out = rgb(L)
    np.save(WORK / "stage1c-4096.npy", out.astype(np.float16))
    np.save(WORK / "streak-mask-4096.npy", strk.astype(np.float16))
    save(WORK / "stage1c-color-4096.jpg", out)
    save(WORK / "v_stage1c.jpg", cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA), 90)
    print("contrast target", tgt, "streak px", int((strk > 0.5).sum()))


if __name__ == "__main__":
    main()
