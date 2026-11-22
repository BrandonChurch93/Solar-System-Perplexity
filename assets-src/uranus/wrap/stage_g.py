import cv2
import numpy as np
from scipy import ndimage as ndi

SRC = 'out/work/u/wrap/'
OUT = 'out/work/u/wrap/'
DST = 'public/assets/uranus/'
SIGMA = 57
VALID = (0.35, 0.6)
FAR = (45.0, 80.0)
SOFT = 2.0


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    shade = np.load(SRC + 'shade.npy')
    h, w = shade.shape[:2]
    mu = np.load(SRC + 'map-mu.npy')
    wgt = smooth(0.06, 0.14, mu).astype(np.float32)
    pad = 4 * SIGMA
    den = cv2.GaussianBlur(np.concatenate([wgt[:, -pad:], wgt, wgt[:, :pad]], 1), (0, 0), SIGMA)[:, pad:-pad]
    den = cv2.resize(den, (w, h), interpolation=cv2.INTER_AREA)
    mus = cv2.resize(mu, (w, h), interpolation=cv2.INTER_AREA)
    del mu, wgt
    k = smooth(0.03, 0.55, den)
    v = smooth(VALID[0], VALID[1], den)
    raw = np.log(shade) / np.maximum(k, 0.3)[..., None]
    valid = den >= VALID[1]
    wide = np.concatenate([valid[:, -w // 2:], valid, valid[:, :w // 2]], 1)
    idx = ndi.distance_transform_edt(~wide, return_distances=False, return_indices=True)
    rw = np.concatenate([raw[:, -w // 2:], raw, raw[:, :w // 2]], 1)
    ext = rw[idx[0], idx[1]]
    ext = cv2.GaussianBlur(ext, (0, 0), SOFT)[:, w // 2:w // 2 + w]
    far = 1 - smooth(np.sin(np.radians(FAR[0])), np.sin(np.radians(FAR[1])), -mus)
    out = np.exp(raw * v[..., None] + ext * ((1 - v) * far)[..., None]).astype(np.float32)
    np.save(OUT + 'shade-g.npy', out)
    rgba = np.concatenate([out[::-1], np.ones(out.shape[:2] + (1,), np.float32)], -1)
    for name in ('full', 'web'):
        np.ascontiguousarray(rgba.astype('<f4')).tofile(DST + name + '/shade.bin')
    d = np.abs(out - shade)
    print('changed over 0.01:', int((d.max(-1) > 0.01).sum()), 'of', h * w, 'where den >= 0.6 max change', float(d[den >= 0.6].max()), 'range', out.min(), out.max())


main()
