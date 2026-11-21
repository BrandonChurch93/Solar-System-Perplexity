import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/uranus')
import geo

W, H = 2816, 1584
VFOV = 60.0
F = (H / 2) / np.tan(np.radians(VFOV) / 2)
OUT = 'out/work/u/t/'


def ray(x, y):
    d = np.stack([(x - W / 2) / F, (H / 2 - y) / F, -np.ones_like(x)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def main():
    im = np.asarray(Image.open('references/approved/uranus-close.jpg').convert('RGB')).astype(np.float32) / 255
    lin = geo.scene(im)
    lum = ndi.gaussian_filter(lin @ np.array([0.2126, 0.7152, 0.0722]), 3.0)
    gy = ndi.sobel(np.log(lum + 0.01), axis=0)
    xs = np.arange(20, W - 20, 8)
    pts = []
    for x in xs:
        if 1850 < x < 2150:
            continue
        col = lum[:, x - 3:x + 4].mean(1)
        peak = 200 + int(np.argmax(col[200:1400]))
        lo = max(peak - 60, 5)
        g = gy[lo:peak + 1, x - 3:x + 4].mean(1)
        k = int(np.argmax(g))
        if 1 < k < len(g) - 2:
            den = g[k - 1] - 2 * g[k] + g[k + 1]
            off = 0.5 * (g[k - 1] - g[k + 1]) / den if den != 0 else 0
            pts.append((x, lo + k + off, g[k]))
    pts = np.array(pts)
    d = ray(pts[:, 0], pts[:, 1])

    def res(p):
        c = np.array([np.sin(p[0]) * np.cos(p[1]), -np.cos(p[0]) * np.cos(p[1]), -np.sin(p[1])])
        return np.degrees(np.arccos(np.clip(d @ c, -1, 1)) - p[2])

    best = None
    for a0 in (-0.6, -0.3, 0.0):
        for b0 in (0.2, 0.5, 0.9):
            for al in (0.8, 1.1, 1.4):
                r = least_squares(res, [a0, b0, al], loss='soft_l1', f_scale=0.05)
                if best is None or r.cost < best.cost:
                    best = r
    p = best.x
    c = np.array([np.sin(p[0]) * np.cos(p[1]), -np.cos(p[0]) * np.cos(p[1]), -np.sin(p[1])])
    e = res(p)
    keep = np.abs(e) < 0.15
    print('residual deg by x', ' '.join('%d:%+.2f' % (x, v) for x, v in zip(pts[::16, 0], e[::16])))
    print('horizon points', len(pts), 'kept', int(keep.sum()), 'rms deg', float(e[keep].std()), 'px', float(e[keep].std() * np.pi / 180 * F))
    alpha = p[2]
    h = 1 / np.sin(alpha) - 1
    print('centre direction', c.round(5).tolist(), 'angular radius deg', np.degrees(alpha), 'altitude', h)
    sun_px = None
    lum = lin.sum(-1)
    sm = ndi.gaussian_filter(lum, 6)
    sy, sx = np.unravel_index(np.argmax(sm[:, 1700:2400]), sm[:, 1700:2400].shape)
    sx += 1700
    sun = ray(np.float64(sx), np.float64(sy))
    print('sun px', sx, sy, 'dir', sun.round(5).tolist(), 'angle to centre', np.degrees(np.arccos(sun @ c)), 'above limb deg', np.degrees(np.arccos(sun @ c)) - np.degrees(alpha))
    json.dump({'vfov': VFOV, 'centre': c.tolist(), 'alpha': float(alpha), 'altitude': float(h), 'sun': sun.tolist(), 'sunPx': [int(sx), int(sy)]}, open('assets-src/uranus/terrain/fit.json', 'w'), indent=1)
    np.save(OUT + 'horizon.npy', pts)
    ov = (im * 255).astype(np.uint8).copy()
    for x, y, _ in pts:
        ov[int(y) - 14:int(y) - 8, int(x)] = (255, 255, 0)
    th = np.linspace(0, 2 * np.pi, 20000)
    a = np.cross(c, [0, 0, 1.0])
    a /= np.linalg.norm(a)
    b = np.cross(c, a)
    cone = np.cos(alpha) * c + np.sin(alpha) * (np.cos(th)[:, None] * a + np.sin(th)[:, None] * b)
    ok = cone[:, 2] < -0.05
    px = W / 2 + cone[ok, 0] / -cone[ok, 2] * F
    py = H / 2 - cone[ok, 1] / -cone[ok, 2] * F
    inside = (px >= 0) & (px < W - 1) & (py >= 0) & (py < H - 1)
    ov[py[inside].astype(int), px[inside].astype(int)] = (255, 0, 0)
    Image.fromarray(ov).resize((1408, 792), Image.LANCZOS).save(OUT + 'fit-horizon.jpg', quality=90)


main()
