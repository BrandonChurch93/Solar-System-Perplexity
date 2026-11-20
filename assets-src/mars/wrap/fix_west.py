import cv2
import numpy as np

from compose0 import lab, rgb
from geo import WORK, map_lonlat
from seamless import blur_wrap
from stage1b_build import save
from stage1c import SUB, ang_from, ss


def main(src="stage2-8192.npy", dst="stage3-8192.npy"):
    X = np.load(WORK / src).astype(np.float32)
    H, W = X.shape[:2]
    w4 = 2048
    small = cv2.resize(X, (w4, w4 // 2), interpolation=cv2.INTER_AREA)
    LON, LAT = map_lonlat(w4)
    A = ang_from(LON, LAT, *SUB)
    Z = ss(44, 54, A) * ss(-172, -160, LON) * (1 - ss(-124, -114, LON)) * ss(-34, -22, LAT) * (1 - ss(22, 34, LAT))
    Ls = lab(small)
    cl = np.clip((Ls[..., 0] - 72) / 10, 0, 1) * np.clip((6 - Ls[..., 2] + 10) / 10, 0, 1)
    cl = cv2.GaussianBlur(cl, (0, 0), 4)
    Z = cv2.GaussianBlur(Z * (1 - np.clip(cl * 2, 0, 1)), (0, 0), 6)
    low = blur_wrap(Ls, 8)
    out_w = 1 - Z
    ref = blur_wrap(low * out_w[..., None], 60) / np.maximum(blur_wrap(out_w, 60), 1e-3)[..., None]
    dL = -Z * np.clip(low[..., 0] - ref[..., 0], 0, None) * 0.85
    ch_low = np.hypot(low[..., 1], low[..., 2])
    ch_ref = np.hypot(ref[..., 1], ref[..., 2])
    cg = 1 + Z * np.clip(ch_ref / np.maximum(ch_low, 1) - 1, 0, 0.8)
    up = lambda a: cv2.resize(a.astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    dL, cg, Zb = up(dL), up(cg), up(Z)
    L = lab(X)
    lowB = cv2.resize(cv2.resize(L, (w4, w4 // 2), interpolation=cv2.INTER_AREA), (W, H), interpolation=cv2.INTER_CUBIC)
    lowB = cv2.GaussianBlur(lowB, (0, 0), 6)
    hp = L - lowB
    L2 = lowB + hp * (1 + 0.6 * Zb)[..., None]
    L2[..., 0] += dL
    L2[..., 1] *= cg
    L2[..., 2] *= cg
    out = rgb(L2)
    np.save(WORK / dst, out.astype(np.float16))
    save(WORK / dst.replace(".npy", ".jpg").replace("stage3-8192", "stage3-color-8192"), out)
    save(WORK / "v_stage3.jpg", cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA), 90)
    print("zone max", float(Z.max()), "max L drop", float(-dL.min()))


if __name__ == "__main__":
    main()
