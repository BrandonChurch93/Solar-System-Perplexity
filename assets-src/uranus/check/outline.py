import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import least_squares

sys.path.insert(0, 'assets-src/uranus')
import geo

CX, CY, R = 1460.3, 858.74, 528.64


def edge_points(path, shift=False):
    im = Image.open(path).convert('RGB')
    if im.size != (2816, 1584):
        im = im.resize((2816, 1584), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    if shift:
        a = geo.undrift(a)
    lum = np.log(geo.scene(a) @ np.array([0.2126, 0.7152, 0.0722]) + 0.003)
    rs = np.linspace(0.95, 1.03, 321)
    out = []
    for ang in np.arange(0, 360, 2.5):
        th = np.deg2rad(np.linspace(ang - 1.5, ang + 1.5, 41))
        prof = np.array([np.median(ndi.map_coordinates(lum, [CY - R * rr * np.sin(th), CX + R * rr * np.cos(th)], order=1)) for rr in rs])
        g = np.gradient(ndi.gaussian_filter1d(prof, 3))
        k = int(np.argmin(g))
        out.append((ang, rs[k], g[k] * 1000))
    return np.array(out)


def fit(pts):
    w = pts[:, 2] < -12
    a = np.deg2rad(pts[w, 0])
    x = CX + pts[w, 1] * R * np.cos(a)
    y = CY - pts[w, 1] * R * np.sin(a)

    def res(q):
        cx, cy, sa, sb, th = q
        c, s = np.cos(th), np.sin(th)
        u = ((x - cx) * c - (y - cy) * s) / sa
        v = ((x - cx) * s + (y - cy) * c) / sb
        return (np.hypot(u, v) - 1) * 0.5 * (sa + sb)

    sol = least_squares(res, [CX, CY, R, R, 0.0], loss='soft_l1', f_scale=1.0)
    r = res(sol.x)
    return sol.x, float(np.sqrt(np.mean(r * r))), int(w.sum())


def main():
    pts = edge_points(sys.argv[1], len(sys.argv) > 2)
    q, rms, n = fit(pts)
    cx, cy, sa, sb, th = q
    print('centre %.2f %.2f  semi-axes %.2f %.2f (%.4f %.4f of R)  angle of first axis %.2f deg (image, y up)  rms %.2f px  n %d' % (cx, cy, sa, sb, sa / R, sb / R, np.degrees(th), rms, n))
    json.dump({'centre': [cx, cy], 'axes': [sa, sb], 'angleDeg': float(np.degrees(th)), 'rms': rms}, open('out/work/u/outline.json', 'w'))


main()
