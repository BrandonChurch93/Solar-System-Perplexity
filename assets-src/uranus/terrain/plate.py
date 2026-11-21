import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/terrain')
import geo
import tgeo as T

WORK = 'out/work/u/t/plate/'
CW, CH = 2816, 1584
X0, Y0, FW, FH = 626, 0, 1564, 880
OUT = (8192, 4608)
FLOOR = 0.012


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def limb_shift(take):
    h, w = take.shape[:2]
    d = T.rays_wide(w, h)
    el = T.elevation(d)
    model = np.array([np.interp(0, -el[:, c], np.arange(h)) for c in range(w)])
    lum = ndi.gaussian_filter(geo.scene(take).mean(-1), (1.0, 4.0))
    dev = np.zeros(w)
    for c in range(w):
        r = int(model[c])
        lo, hi = max(r - 90, 1), min(r + 90, h)
        col = lum[lo:hi, c]
        sky = np.median(col[:20])
        peak = col.max()
        if peak < sky * 2:
            continue
        thr = sky + 0.35 * (peak - sky)
        k = np.flatnonzero(col > thr)[0]
        dev[c] = lo + k - model[c]
    dev = ndi.median_filter(dev, 41, mode='nearest')
    left = np.median(dev[X0 + 10:X0 + 110])
    right = np.median(dev[X0 + FW - 110:X0 + FW - 10])
    x = np.arange(w)
    shift = np.where(x < X0, dev - left, np.where(x >= X0 + FW, dev - right, 0.0))
    shift = ndi.gaussian_filter1d(shift, 30, mode='nearest')
    shift *= np.maximum(smooth(0, 120, X0 - x), smooth(0, 120, x - (X0 + FW)))
    return model, shift


def main():
    take = np.asarray(Image.open(WORK + 'plate-take3.png').convert('RGB')).astype(np.float32) / 255
    big = np.asarray(Image.open(WORK + 'plate-take3-2x.png').convert('RGB')).astype(np.float32) / 255
    orig = np.asarray(Image.open('references/approved/uranus-close.jpg').convert('RGB')).astype(np.float32) / 255
    orig2 = np.asarray(Image.open('out/work/u/t/close-2x.png').convert('RGB')).astype(np.float32) / 255
    small = cv2.resize(orig, (FW, FH), interpolation=cv2.INTER_AREA)

    inside = np.zeros((CH, CW), bool)
    inside[Y0:Y0 + FH, X0:X0 + FW] = True
    ref = take.copy()
    ref[Y0:Y0 + FH, X0:X0 + FW] = small
    sig = 10
    ratio = (cv2.GaussianBlur(ref, (0, 0), sig) + 0.01) / (cv2.GaussianBlur(take, (0, 0), sig) + 0.01)
    core = ndi.binary_erosion(inside, iterations=24)
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    dist = ndi.distance_transform_edt(~core)
    near = ratio[idx[0], idx[1]]
    near = cv2.GaussianBlur(near, (0, 0), 20)
    glob = np.median(ratio[core].reshape(-1, 3), 0)
    fade = smooth(0, 320, dist)[..., None]
    gain = np.where(core[..., None], ratio, near * (1 - fade) + glob * fade)
    gain = np.clip(gain, 0.6, 1.6)
    print('take to original gain median', glob, 'p5', np.percentile(ratio[core], 5), 'p95', np.percentile(ratio[core], 95))

    model, shift = limb_shift(take)
    print('limb shift canvas px at x = 0, 200, 400, 600:', [round(float(shift[c]), 1) for c in (0, 200, 400, 600)], 'at 2250, 2450, 2650, 2815:', [round(float(shift[c]), 1) for c in (2250, 2450, 2650, 2815)])

    k = big.shape[1] / CW
    gain_big = cv2.resize(gain, (big.shape[1], big.shape[0]), interpolation=cv2.INTER_CUBIC)
    big = np.clip(big * gain_big, 0, 1)
    xx, yy = np.meshgrid(np.arange(big.shape[1], dtype=np.float32), np.arange(big.shape[0], dtype=np.float32))
    cx = np.clip((xx + 0.5) / k - 0.5, 0, CW - 1)
    m = np.interp(cx, np.arange(CW), model).astype(np.float32) * k
    s = np.interp(cx, np.arange(CW), shift).astype(np.float32) * k
    fall = 1 - smooth(60 * k, 420 * k, yy - m)
    big = cv2.remap(big, xx, yy + s * fall, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    ow, oh = OUT
    plate = cv2.resize(big, (ow, oh), interpolation=cv2.INTER_LANCZOS4)
    sc = ow / CW
    fx0, fy0, fw, fh = X0 * sc, Y0 * sc, FW * sc, FH * sc
    a = fw / orig2.shape[1]
    mat = np.array([[a, 0, fx0 + 0.5 * a - 0.5], [0, a, fy0 + 0.5 * a - 0.5]], np.float32)
    soft = cv2.GaussianBlur(orig2, (0, 0), 0.45)
    centre = cv2.warpAffine(soft, mat, (ow, oh), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    gx, gy = np.meshgrid(np.arange(ow, dtype=np.float32) + 0.5, np.arange(oh, dtype=np.float32) + 0.5)
    edge = np.minimum(np.minimum(gx - fx0, fx0 + fw - gx), fy0 + fh - gy)
    wgt = smooth(6 * sc, 40 * sc, edge)[..., None]
    out = np.clip(centre * wgt + plate * (1 - wgt), 0, 1)
    del centre, plate, big, soft, wgt, gx, gy, edge, xx, yy
    low = cv2.GaussianBlur(cv2.resize(out, (CW, CH), interpolation=cv2.INTER_AREA), (0, 0), 8)
    sel = inside & (low[..., 1] > 0.05) & (low[..., 1] < 0.12) & (T.elevation(T.rays_wide(CW, CH)) < -0.03)
    teal = np.median(low[sel] / low[sel][:, 1:2], 0)
    print('dark teal ratio', teal, 'pixels', int(sel.sum()))
    dark = 1 - smooth(0.07, 0.2, low[..., 1])
    deep = 1 - smooth(0.03, 0.09, low[..., 1])
    chroma = low / np.maximum(low[..., 1:2], 1e-3)
    chroma = chroma * (1 - deep[..., None]) + teal * deep[..., None]
    dark = cv2.resize(dark, (ow, oh), interpolation=cv2.INTER_LINEAR)
    g = out[..., 1]
    g += FLOOR * np.exp(-g / FLOOR) * cv2.resize(deep, (ow, oh), interpolation=cv2.INTER_LINEAR)
    for c in (0, 2):
        ratio = cv2.resize(chroma[..., c], (ow, oh), interpolation=cv2.INTER_LINEAR)
        out[..., c] = np.clip(out[..., c] * (1 - dark) + g * ratio * dark, 0, 1)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(WORK + 'wide.png')
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).resize((CW, CH), Image.LANCZOS).save(WORK + 'wide-canvas.png')
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).resize((1408, 792), Image.LANCZOS).save(WORK + 'wide-v.jpg', quality=90)


main()
