import numpy as np
import cv2
from scipy import ndimage as ndi
from geo import *
from polar import *


def build():
    pol = np.load(WORK + '/polar.npy').astype(np.float32)
    inside = np.load(WORK + '/polar-inside.npy')
    sc = scene(pol)
    b = rows()[:, None]
    lum = luma(sc)
    q = (sc[..., 0] - sc[..., 2]) / (sc[..., 0] + sc[..., 2] + 0.02)
    raw = step(q, 0.42, 0.62) * step(lum, 0.025, 0.07) * inside
    raw = raw * step(b, 1.004, 1.012) * (1 - step(b, 1.75, 1.85))
    seed = (raw > 0.5) & (b > 1.035)
    grown = ndi.binary_propagation(seed, mask=raw > 0.15, structure=np.ones((3, 3)))
    lab, n = ndi.label(grown, structure=np.ones((3, 3)))
    if n:
        area = ndi.sum(grown, lab, np.arange(1, n + 1))
        top = ndi.maximum(np.broadcast_to(b, lab.shape), lab, np.arange(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = (area > 400) & (top > 1.05)
        grown = keep[lab]
    wide = ndi.binary_dilation(grown, iterations=3)
    m = np.clip(raw * 1.4, 0, 1) * wide
    m = np.maximum(m, ndi.gaussian_filter(grown.astype(np.float32), 1.2) * step(q, 0.3, 0.5) * step(lum, 0.02, 0.05))
    return pol, sc, inside, m.astype(np.float32)


if __name__ == '__main__':
    pol, sc, inside, m = build()
    np.save(WORK + '/polar-matte.npy', m)
    vis = np.concatenate([pol[::-1][PH - 520:, :], np.repeat(m[::-1][PH - 520:, :, None], 3, 2)], 0)
    for k, x0 in enumerate([0, 2048, 4096, 6144]):
        cv2.imwrite(WORK + f'/matte-q{k}.jpg', cv2.cvtColor((vis[:, x0:x0 + 2048] * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print('matte share', float(m.mean()))
