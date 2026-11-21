import sys
import numpy as np
from scipy import ndimage as ndi

ROOT = '.'
NA, HALF, INSIDE = 64, 128, 0.3
LUMA = np.array([0.2126, 0.7152, 0.0722])
MEDIAN, SIGMA = 9, 2.0
NIGHT = (0.12, 0.5)
REF_PX = 543.0
SHAPE = (0.3, 6.0, 0.7, 45.0)
VEIL = 0.5


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def along(a):
    r = np.sqrt(np.maximum(a, 0))
    r = ndi.median_filter(r, size=(1, MEDIAN, 1), mode='wrap')
    return ndi.gaussian_filter1d(r, SIGMA, axis=1, mode='wrap') ** 2


def build(hold):
    t = hold[:, :NA].astype(np.float64)
    rgb = along(t[..., :3])
    alpha = t[..., 3].copy()
    edge = rgb[HALF - 1]
    night = 1 - step(edge @ LUMA, *NIGHT)
    s = (HALF - 1) - np.arange(HALF)
    px = (np.maximum(s, 0) / (HALF - 1)) ** 2 * INSIDE * REF_PX
    fall = SHAPE[0] * np.exp(-px / SHAPE[1]) + SHAPE[2] * np.exp(-px / SHAPE[3])
    inside = rgb[:HALF]
    model = rgb[HALF][None] * fall[:, None, None]
    inside = inside + (model - inside) * night[None, :, None]
    lum = inside @ LUMA
    low = np.minimum.accumulate(lum[::-1], axis=0)[::-1]
    inside = inside * (low / np.maximum(lum, 1e-9))[..., None]
    out = rgb[HALF:]
    lum = out @ LUMA
    low = np.minimum.accumulate(lum, axis=0)
    out = out * (low / np.maximum(lum, 1e-9))[..., None]
    far = np.zeros((2 * HALF, NA + 1, 4), np.float32)
    far[:HALF, :NA, :3] = inside
    far[HALF:, :NA, :3] = out
    far[:HALF, :NA, 3] = alpha[:HALF] * (1 + (VEIL - 1) * night[None])
    far[:, NA] = far[:, 0]
    return far


if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else 'out/work/venus/r3/bak/limb-hold.bin'
    hold = np.fromfile(src, np.float32).reshape(-1, NA + 1, 4)[:2 * HALF]
    far = build(hold)
    both = np.concatenate([hold, far], 0)
    for key in ('full', 'web'):
        both.tofile(ROOT + '/public/assets/venus/' + key + '/limb.bin')
    lum = far[..., :3] @ LUMA
    print('rows', both.shape, 'edge luma far', np.round(lum[HALF - 1, ::4], 3))
    for az in (0, 4, 12, 32, 56):
        print('az', az, 'in', np.round(lum[[127, 118, 112, 104, 96, 88, 76, 60], az], 3), 'alpha', np.round(far[[127, 112, 96, 76], az, 3], 2), 'out', np.round(lum[[128, 133, 143, 160, 200], az], 3))
