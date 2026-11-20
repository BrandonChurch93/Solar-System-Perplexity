import cv2
import numpy as np

from compose0 import lab, rgb
from geo import WORK, map_lonlat
from stage1b_build import save
from stage1c import ss


def main(src="stage3-8192.npy", dst="stage4-8192.npy"):
    X = np.load(WORK / src).astype(np.float32)
    H, W = X.shape[:2]
    out = X.copy()
    step = 512
    total = 0
    cyt = 0
    for r0 in range(0, H, step):
        r1 = min(H, r0 + step)
        a0, a1 = max(0, r0 - 8), min(H, r1 + 8)
        blk = X[a0:a1]
        L = lab(blk)
        med = np.stack([cv2.medianBlur(np.ascontiguousarray(L[..., c]).astype(np.float32), 5) for c in range(3)], -1)
        sp = ((med[..., 2] - L[..., 2]) > 10) | ((med[..., 1] - L[..., 1]) > 12)
        lon = (np.arange(W) + 0.5) / W * 360 - 180
        lat = 90 - (np.arange(a0, a1) + 0.5) / H * 180
        LO, LA = np.meshgrid(lon, lat)
        cloud = ss(-145, -138, LO) * (1 - ss(-110, -103, LO)) * ss(-48, -42, LA) * (1 - ss(-6, 0, LA))
        sp &= (cloud < 0.5) & (L[..., 0] < 80)
        sp |= ((L[..., 0] - med[..., 0]) > 14) & (med[..., 0] < 48) & (cloud < 0.5)
        sp = cv2.dilate(sp.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        bb = cv2.GaussianBlur(L[..., 2], (0, 0), 8)
        aa = cv2.GaussianBlur(L[..., 1], (0, 0), 8)
        cy = ((bb - L[..., 2]) + (aa - L[..., 1]) > 16) & (L[..., 0] > 40) & (L[..., 0] < 88) & (cloud < 0.5)
        cy = cv2.dilate(cy.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
        ok = 1 - cy
        Lc = L.copy()
        for c in (1, 2):
            num = cv2.GaussianBlur(L[..., c] * ok, (0, 0), 6)
            den = cv2.GaussianBlur(ok, (0, 0), 6)
            Lc[..., c] = L[..., c] * ok + (num / np.maximum(den, 1e-3)) * cy
        fixed = rgb(med)
        res = np.where(sp[..., None], fixed, rgb(Lc))
        out[r0:r1] = res[r0 - a0:r0 - a0 + (r1 - r0)]
        total += int(sp[r0 - a0:r0 - a0 + (r1 - r0)].sum())
        cyt += int(cy[r0 - a0:r0 - a0 + (r1 - r0)].sum())
    np.save(WORK / dst, out.astype(np.float16))
    save(WORK / "stage4-color-8192.jpg", out)
    print("speck px", total, "cyan px", cyt)


if __name__ == "__main__":
    main()
