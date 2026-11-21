import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import minimize

Image.MAX_IMAGE_PIXELS = None
W, H = 2816, 1584
fit = json.load(open('assets-src/jupiter/fit.json'))


def lin(path):
    a = np.asarray(Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4) @ np.array([0.2126, 0.7152, 0.0722])


x0, y0, x1, y1 = 1440, 900, 1900, 1160
hero = lin('out/work/jupiter/hero2x.png')[y0:y1, x0:x1]
bare = lin('out/work/jupiter/hero2x-nomoon.png')[y0:y1, x0:x1]
seen = np.clip(1 - ndi.gaussian_filter(hero, 1.5) / np.maximum(ndi.gaussian_filter(bare, 1.5), 1e-4), 0, 1)
cam = np.array(fit['camera']['position'] if 'camera' in fit and 'position' in fit['camera'] else fit['cameraPosition'])
sun = np.array(fit['sunDir'])
sun = sun / np.linalg.norm(sun)
moon = fit['moons'][0]
f = H / 2 / np.tan(np.radians(fit.get('vfovDeg', 30) / 2))
IO = (1530.0, 1000.0, 52.0)
ray = np.array([(IO[0] - W / 2) / f, -(IO[1] - H / 2) / f, -1.0])
home = cam + ray * (cam[2] - moon['position'][2])
rad = IO[2] / f * (cam[2] - moon['position'][2])
yy, xx = np.mgrid[y0:y1, x0:x1]
d = np.stack([(xx - W / 2) / f, -(yy - H / 2) / f, -np.ones_like(xx, dtype=np.float64)], -1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
b = d @ cam
disc = b * b - (cam @ cam - 1)
p = cam + d * (-b - np.sqrt(np.maximum(disc, 0)))[..., None]
ndl = p @ sun
io = np.hypot(xx - IO[0], yy - IO[1]) < IO[2] + 5
use = (disc > 0) & ~io & (bare > 0.004)


def model(v):
    depth, floor, mid, width, strength, tilt = v
    inner, outer = mid - width / 2, mid + width / 2
    c, s = np.cos(np.radians(tilt)), np.sin(np.radians(tilt))
    l = np.array([sun[0] * c - sun[1] * s, sun[0] * s + sun[1] * c, sun[2]])
    m = cam + (home - cam) * depth - p
    t = m @ l
    w = m - t[..., None] * l
    e = p - (p @ l)[..., None] * l
    e /= np.maximum(np.linalg.norm(e, axis=-1, keepdims=True), 1e-6)
    nl = p @ l
    g = np.maximum(nl, floor) / np.maximum(nl, 1e-3)
    we = (w * e).sum(-1)
    w = w + ((g - 1) * we)[..., None] * e
    off = np.linalg.norm(w, axis=-1) / (rad * depth)
    k = np.clip((off - inner) / max(outer - inner, 1e-3), 0, 1)
    return np.where(t > 0, (1 - k * k * (3 - 2 * k)) * strength, 0)


def cost(v):
    return float((((model(v) - seen) ** 2) * use).sum() / use.sum())


start = [1.0, 0.0, 1.0, 0.3, 0.985, -8.0]
free = [i for i in range(6) if len(sys.argv) < 2 or str(i) in sys.argv[1]]


def run(q):
    v = list(start)
    for i, k in enumerate(free):
        v[k] = q[i]
    return cost(v)


print('start cost', cost(start), 'old', cost([1.0, 0.0, 1.21, 0.58, 0.985, 0.0]))
r = minimize(run, [start[k] for k in free], method='Nelder-Mead', options={'xatol': 1e-4, 'fatol': 1e-8, 'maxiter': 3000})
v = list(start)
for i, k in enumerate(free):
    v[k] = float(r.x[i])
print('depth floor mid width strength tilt', np.round(v, 4), 'cost', r.fun)
out = np.hstack([seen, model(v), np.abs(model(v) - seen)])
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save('out/work/view/shadowfit.png')
c, sn = np.cos(np.radians(v[5])), np.sin(np.radians(v[5]))
print('moon', (cam + (home - cam) * v[0]).round(6).tolist(), 'radius', round(rad * v[0], 6), 'shadowSun', np.round([sun[0] * c - sun[1] * sn, sun[0] * sn + sun[1] * c, sun[2]], 6).tolist(), 'shadow', [round(v[2] - v[3] / 2, 3), round(v[2] + v[3] / 2, 3), v[4]])
