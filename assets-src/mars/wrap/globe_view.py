import sys

import cv2
import numpy as np

from faces import basis, sample_map
from geo import WORK, local_to_lonlat


def ortho(m, lon, lat, N=1024, H=None, sun=None, k=6.0):
    c, r, u = basis(lon, lat)
    s = (np.arange(N) + 0.5) / N * 2 - 1
    X, Y = np.meshgrid(s, -s)
    R2 = X ** 2 + Y ** 2
    ok = R2 < 1
    Z = np.sqrt(np.clip(1 - R2, 0, 1))
    d = X[..., None] * r + Y[..., None] * u + Z[..., None] * c
    lo, la = local_to_lonlat(d)
    img = sample_map(m, lo, la)
    if sun is not None:
        n = d
        if H is not None:
            h = sample_map(H[..., None].repeat(3, -1), lo, la)[..., 0]
            gy, gx = np.gradient(h)
            n = d - k * (gx[..., None] * r + gy[..., None] * -u)
            n = n / np.linalg.norm(n, axis=-1, keepdims=True)
        sd = np.asarray(sun, np.float64)
        sd = sd / np.linalg.norm(sd)
        sh = np.clip((n @ sd), 0, 1)
        img = img * (0.08 + 0.92 * sh[..., None])
    return np.where(ok[..., None], np.clip(img, 0, 1), 0)


if __name__ == "__main__":
    src, lon, lat, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
    m = np.load(WORK / src).astype(np.float32)
    if m.shape[1] > 4096:
        m = cv2.resize(m, (4096, 2048), interpolation=cv2.INTER_AREA)
    v = ortho(m, lon, lat)
    cv2.imwrite(str(WORK / out), cv2.cvtColor((v * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
