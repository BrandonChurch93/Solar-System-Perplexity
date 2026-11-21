import json
import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from geo import *
from polar import *

OPEN = 7
SOFT = 6
ACROSS = 6.0
ALONG = 0.02
LIMITS = (0.3, 1.5)
SIZE = (512, 128)


def floor(path):
    a = np.asarray(Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    low = np.stack([ndi.grey_opening(a[..., c], size=(OPEN, OPEN)) for c in range(3)], -1)
    return scene(cv2.GaussianBlur(low, (0, 0), SOFT)).astype(np.float32)


def soften(a):
    a = ndi.gaussian_filter1d(a, ACROSS / 360 * PW, axis=1, mode='wrap')
    return ndi.gaussian_filter1d(a, ALONG / np.log(B1 / B0) * PH, axis=0, mode='nearest')


def main(render):
    excess = floor(render) - floor(HERO)
    t, b = np.meshgrid(cols(), rows())
    px, py = image_xy(t, b)
    inside = ((px >= 2) & (px < W - 2) & (py >= 2) & (py < H - 2) & (b > 1.004)).astype(np.float32)
    pol = cv2.remap(excess, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    cor = np.load(WORK + '/polar-corona.npy').astype(np.float32)
    seen = soften(inside)
    over = np.stack([soften(pol[..., c] * inside) for c in range(3)], -1) / np.maximum(seen, 1e-3)[..., None]
    light = np.stack([soften(cor[..., c] * inside) for c in range(3)], -1) / np.maximum(seen, 1e-3)[..., None]
    factor = np.clip(1 - over / np.maximum(light, 1e-5), LIMITS[0], LIMITS[1])
    valid = seen > 0.3
    for y in range(1, PH):
        factor[y] = np.where(valid[y][:, None], factor[y], factor[y - 1])
    left = over - light * (1 - factor)
    rr = rows()
    veil = np.zeros((PH, 3), np.float32)
    for y in range(PH):
        m = valid[y]
        if m.sum() > 50:
            veil[y] = np.median(left[y][m], 0)
        elif y:
            veil[y] = veil[y - 1]
    veil = ndi.gaussian_filter1d(veil, 30, axis=0, mode='nearest')
    np.save(ROOT + '/assets-src/sun/orbit/level.npy', cv2.resize(factor, SIZE, interpolation=cv2.INTER_AREA).astype(np.float16))
    pick = np.linspace(0, PH - 1, 64).astype(int)
    json.dump({'radius': [round(float(v), 4) for v in rr[pick]], 'veil': [[round(float(v), 6) for v in veil[y]] for y in pick]}, open(ROOT + '/assets-src/sun/orbit/veil.json', 'w'))
    for lo, hi in ((1.05, 1.2), (1.2, 1.5), (1.5, 1.9), (1.9, 2.4)):
        m = (b > lo) & (b < hi) & (inside > 0)
        print(lo, hi, 'excess', over[m].mean(0).round(5), 'corona', light[m].mean(0).round(5), 'factor', factor[m].mean(0).round(3), 'left', left[m].mean(0).round(5))


main(sys.argv[1])
