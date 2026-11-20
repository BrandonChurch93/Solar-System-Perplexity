import cv2
import numpy as np

from compose0 import lab, rgb
from geo import WORK, map_lonlat
from stage1b_build import save
from stage1c import ang_from


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def main(src="stage4-8192.npy", dst="stage5-8192.npy"):
    X = np.load(WORK / src).astype(np.float32)
    W = X.shape[1]
    H = np.load(WORK / "heropx-4096.npy")
    mu = cv2.resize(H[..., 3], (W, W // 2), interpolation=cv2.INTER_LINEAR)
    cv = cv2.resize(H[..., 2], (W, W // 2), interpolation=cv2.INTER_LINEAR)
    x0, x1 = int(W * 10 / 360), int(W * 180 / 360)
    sub = X[:, x0:x1]
    mu, cv = mu[:, x0:x1], cv[:, x0:x1]
    LON, LAT = map_lonlat(W)
    LON, LAT = LON[:, x0:x1], LAT[:, x0:x1]
    w = ss(0.6, 0.32, mu) * ss(-0.12, 0.05, mu) * ss(0.0, 0.08, cv)
    w = cv2.GaussianBlur(w, (0, 0), W / 360 * 2)
    dive = ang_from(LON, LAT, -81.86, -4.54)
    w *= ss(29, 35, dive)
    L = lab(sub)
    s = W / 4096
    day = (mu > 0.45) & (mu < 0.75) & (cv > 0.05) & (LAT > -30) & (LAT < 40)
    ref = np.array([np.median(L[..., c][day]) for c in range(3)])
    refc = float(np.median(np.hypot(L[..., 1], L[..., 2])[day]))
    lo = np.stack([cv2.GaussianBlur(L[..., c], (0, 0), 40 * s) for c in range(3)], -1)
    hp = L - lo
    C = np.hypot(lo[..., 1], lo[..., 2])
    g = np.clip(0.92 * refc / np.maximum(C, 1e-3), 0.55, 1.0)
    hue = np.arctan2(lo[..., 2], lo[..., 1])
    rh = np.arctan2(ref[2], ref[1])
    hue2 = hue + (rh - hue) * 0.5
    C2 = C * g
    lo2 = lo.copy()
    lo2[..., 1] = C2 * np.cos(hue2)
    lo2[..., 2] = C2 * np.sin(hue2)
    lo2[..., 0] = lo[..., 0] - np.clip(lo[..., 0] - ref[0] + 4, 0, None) * 0.35
    hpL = hp[..., 0]
    hp2 = hp.copy()
    hp2[..., 0] = np.where(hpL > 0, hpL * 0.65, hpL * 0.9)
    hp2[..., 1:] *= 0.5
    vein = np.clip((hp[..., 2] - 3) / 8, 0, 1) * np.clip(hpL / 6, 0, 1)
    hp2[..., 0] -= vein * hpL * 0.25
    out = lo2 + hp2
    Lf = L * (1 - w[..., None]) + out * w[..., None]
    res = X.copy()
    res[:, x0:x1] = np.clip(rgb(Lf), 0, 1)
    np.save(WORK / dst, res.astype(np.float16))
    np.save(WORK / "night-weight.npy", w.astype(np.float16))
    save(WORK / "stage5-color-8192.jpg", res)
    np.save(WORK / "final-4096.npy", cv2.resize(res, (W // 2, W // 4), interpolation=cv2.INTER_AREA).astype(np.float16))
    print("ref Lab", ref.round(1), "ref chroma", round(refc, 1), "weight>0.5 px", int((w > 0.5).sum()), "max w in dive 30deg", float(w[dive < 30].max()))


if __name__ == "__main__":
    main()
