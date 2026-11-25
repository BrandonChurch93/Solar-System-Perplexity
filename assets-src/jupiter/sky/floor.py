import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'deck'))
import geom
from patch import film, unfilm, to_linear, to_srgb

ROOT = os.path.join(HERE, '..', '..', '..')
MARGIN = json.load(open(os.path.join(ROOT, 'src', 'stops', 'jupiter', 'sky.json')))['terrain']['margin']
FOOT_DEG = 0.9
EDGE_DEG = (0.3, 0.5)
STARS_SHIFT_DEG = 6.0
STARS_FROM_DEG = (0.6, 0.9)
STARS_EDGE_PX = 8.0
SMOOTH_PX = 6.0
STAR_PX = 9
SPREAD = ((0.0, 0.0), (0.3, 12.0), (0.8, 30.0), (1.6, 60.0))


def elevation(w, h):
    kx = geom.W0 * (1 + 2 * MARGIN) / w
    ky = geom.H0 * (1 + 2 * MARGIN) / h
    ys, xs = np.mgrid[0:h, 0:w]
    ix = (xs + 0.5) * kx - 0.5 - geom.W0 * MARGIN
    iy = (ys + 0.5) * ky - 0.5 - geom.H0 * MARGIN
    d = geom.rays(ix + geom.OX, iy + geom.OY)
    up = -geom.NADIR
    dip = np.degrees(np.arccos(geom.R / (geom.R + 1)))
    return np.degrees(np.arcsin(np.clip(d @ up, -1, 1))) + dip


def at(a, y, x):
    return ndi.map_coordinates(a, [y, x], order=1, mode='nearest')


def repaint(path):
    lin = unfilm(to_linear(np.asarray(Image.open(path).convert('RGB')).astype(np.float64) / 255))
    h, w = lin.shape[:2]
    scale = w / 2400
    el = elevation(w, h)
    gy, gx = np.gradient(el)
    g2 = np.maximum(gx * gx + gy * gy, 1e-12)
    above = (el >= EDGE_DEG[1]).astype(np.float64)
    cover = np.maximum(ndi.gaussian_filter(above, SMOOTH_PX * scale), 1e-6)
    size = max(3, int(round(STAR_PX * scale)) | 1)
    smooth = np.stack([ndi.gaussian_filter(ndi.median_filter(lin[..., c], size) * above, SMOOTH_PX * scale) / cover for c in range(3)], -1)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float64)
    under = el < EDGE_DEG[1]
    fy, fx = ys[under], xs[under]
    for _ in range(4):
        e = at(el, fy, fx)
        k = (FOOT_DEG - e) / at(g2, fy, fx)
        fy = np.clip(fy + k * at(gy, fy, fx), 0, h - 1)
        fx = np.clip(fx + k * at(gx, fy, fx), 0, w - 1)
    carried = np.zeros_like(lin)
    for c in range(3):
        carried[..., c][under] = at(smooth[..., c], fy, fx)
    below = under.astype(np.float64)
    levels = []
    for _, px in SPREAD:
        if px <= 0:
            levels.append(carried)
            continue
        share = np.maximum(ndi.gaussian_filter(below, px * scale), 1e-6)
        levels.append(np.stack([ndi.gaussian_filter(carried[..., c], px * scale) / share for c in range(3)], -1))
    depth = EDGE_DEG[1] - el
    out = lin.copy()
    field = levels[-1].copy()
    for i in range(len(SPREAD) - 1):
        d0, d1 = SPREAD[i][0], SPREAD[i + 1][0]
        t = np.clip((depth - d0) / (d1 - d0), 0, 1)[..., None]
        t = t * t * (3 - 2 * t)
        inside = ((depth >= d0) & (depth < d1))[..., None]
        field = np.where(inside, levels[i] * (1 - t) + levels[i + 1] * t, field)
    at_horizon = np.abs(el) < 0.5
    n = np.array([gy[at_horizon].mean(), gx[at_horizon].mean()])
    per_deg = 1 / np.hypot(n[0], n[1])
    n = n * per_deg
    sy, sx = ys + STARS_SHIFT_DEG * per_deg * n[0], xs + STARS_SHIFT_DEG * per_deg * n[1]
    border = np.minimum(np.minimum(sy, h - 1 - sy), np.minimum(sx, w - 1 - sx)) / (STARS_EDGE_PX * scale)
    held = np.clip(border, 0, 1) * np.clip((at(el, sy, sx) - STARS_FROM_DEG[0]) / (STARS_FROM_DEG[1] - STARS_FROM_DEG[0]), 0, 1)
    stars = (lin - smooth) * (el >= STARS_FROM_DEG[0])[..., None]
    field = field + np.stack([at(stars[..., c], sy, sx) for c in range(3)], -1) * held[..., None]
    keep = np.clip((el - EDGE_DEG[0]) / (EDGE_DEG[1] - EDGE_DEG[0]), 0, 1)
    keep = (keep * keep * (3 - 2 * keep))[..., None]
    out[under] = np.maximum(field * (1 - keep) + lin * keep, 0)[under]
    before = np.asarray(Image.open(path).convert('RGB'))
    after = (to_srgb(film(out)) * 255 + 0.5).astype(np.uint8)
    after[~under] = before[~under]
    Image.fromarray(after).save(path, lossless=True, quality=90, method=6)
    lum = lambda a: unfilm(to_linear(a.astype(np.float64) / 255)) @ np.array([0.2126, 0.7152, 0.0722])
    cols = np.linspace(0, w, 7).astype(int)
    for name, a in (('before', before), ('after', after)):
        for lo, hi in ((-5, -4), (-2, -1), (-0.6, -0.1), (0.0, 0.3), (0.3, 0.5), (0.5, 1.0)):
            band = (el >= lo) & (el < hi)
            row = [np.median(lum(a[:, cols[i]:cols[i + 1]])[band[:, cols[i]:cols[i + 1]]]) * 1000 for i in range(6)]
            print(os.path.basename(os.path.dirname(path)), name, 'elevation', lo, 'to', hi, 'median luminance x1000 by sixths:', ' '.join('%.1f' % v for v in row))
    print(path, w, h, 'pixels under the edge', int(under.sum()), 'changed above it', int((after[~under] != before[~under]).sum()))


if __name__ == '__main__':
    for p in sys.argv[1:]:
        repaint(p)
