import json

import cv2
import numpy as np
from scipy import ndimage as ndi
from scipy.optimize import minimize

fit = json.load(open('assets-src/jupiter/fit.json'))
IO = (1530.0, 1000.0, 52.0)
K = 2


def scene(a):
    a = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    y = np.clip(a, 0, 0.985)
    kk = 0.59 * y - 0.03
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (2.43 * y - 2.51) * 0.14 * y, 0))) / (2 * (2.43 * y - 2.51))


im = cv2.imread('out/work/jupiter/hero2x.png')[..., ::-1].astype(np.float32) / 255
r = int(IO[2] * K + 8)
cx, cy = int(IO[0] * K), int(IO[1] * K)
c = scene(im[cy - r:cy + r, cx - r:cx + r])
yy, xx = np.mgrid[-r:r, -r:r] / (IO[2] * K)
rr = np.hypot(xx, yy)
nz = np.sqrt(np.maximum(1 - rr * rr, 0))
n = np.stack([xx, -yy, nz], -1)
use = rr < 0.94
seen = ndi.gaussian_filter(c, (5, 5, 0))
top = ndi.gaussian_filter(ndi.maximum_filter(ndi.gaussian_filter(c[..., 1], 2), 31), 8)


def shade(v):
    az, el, wrap, power = v[0], v[1], float(np.clip(v[2], 0, 1.5)), float(np.clip(v[3], 0.7, 6))
    s = np.array([np.cos(np.radians(el)) * np.cos(np.radians(az)), np.cos(np.radians(el)) * np.sin(np.radians(az)), np.sin(np.radians(el))])
    return np.clip((n @ s + wrap) / (1 + wrap), 0, 1) ** power, s


def cost(v):
    lit, _ = shade(v[:4])
    m = v[4] * lit + max(v[5], 0)
    return float((((np.log(m + 0.02) - np.log(top + 0.02)) ** 2) * use).sum() / use.sum())


sun = np.array(fit['sunDir'])
start = [np.degrees(np.arctan2(sun[1], sun[0])), np.degrees(np.arcsin(sun[2])), 0.15, 1.0, 1.2, 0.01]
res = minimize(cost, start, method='Nelder-Mead', options={'maxiter': 6000, 'xatol': 1e-4, 'fatol': 1e-9})
v = res.x
lit, s = shade(v[:4])
print('start', np.round(start, 3), cost(start))
v[2], v[3], v[5] = np.clip(v[2], 0, 1.5), np.clip(v[3], 0.7, 6), max(v[5], 0)
print('az el wrap power gain amb', np.round(v, 4), 'cost', res.fun)
print('io sun', s.round(6).tolist(), 'angle to fit sun', np.degrees(np.arccos(s @ sun / np.linalg.norm(sun))).round(2))
albedo = seen / np.maximum(v[4] * lit + v[5], 1e-3)[..., None]
print('albedo median lit side', np.median(albedo[use & (lit > 0.5)], axis=0).round(3))
out = np.hstack([np.clip(seen / 1.2, 0, 1), np.repeat(np.clip(top / 1.2, 0, 1)[..., None], 3, -1), np.repeat(np.clip((v[4] * lit + v[5]) / 1.2, 0, 1)[..., None], 3, -1) * use[..., None], np.clip(albedo * 0.7, 0, 1) * use[..., None]])
cv2.imwrite('out/work/view/io_lightfit.png', (out[..., ::-1] ** (1 / 2.2) * 255).astype(np.uint8))
