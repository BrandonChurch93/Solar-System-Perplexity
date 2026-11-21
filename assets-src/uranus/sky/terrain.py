import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/sky')
sys.path.insert(0, 'assets-src/uranus/terrain')
import geo
import tgeo as T
from deblock import deblock

FULL = (2816, 1584)
STAR = (0.02, 7, 11, 0.05, 0.75)
SPREAD = (0, 6, 16, 40, 100)
MARGIN = 0.125
WORK = 'out/work/u/sky/t/'
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
NT, NR, R0, R1 = 3400, 700, 0.78, 1.04
TH0, TH1 = 2700 / 4096 * 2 * np.pi, 3800 / 4096 * 2 * np.pi


def scene(path, resample, blocks=False):
    img = Image.open(path).convert('RGB')
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], 'F').resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return geo.unfilm(geo.to_linear(a)).astype(np.float32)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def ring_lines(sky):
    fit = json.load(open('assets-src/uranus/terrain/ringfit.json'))
    c = np.array(fit['centre'])
    n = np.array(fit['normal'])
    rad = fit['radius']
    e1 = np.cross(n, [0.0, 0.0, 1.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(n, e1)
    th = TH0 + (np.arange(NT) + 0.5) / NT * (TH1 - TH0)
    rr = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
    p = c + rad * rr[:, None, None] * (np.cos(th)[None, :, None] * e1 + np.sin(th)[None, :, None] * e2)
    ux, uy, ok = T.project(p)
    ux, uy = (ux - 0.5).astype(np.float32), (uy - 0.5).astype(np.float32)
    un = np.stack([cv2.remap(np.ascontiguousarray(sky[..., k]), ux, uy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0) for k in range(3)], -1)
    thin = un - np.stack([ndi.median_filter(un[..., k], size=(41, 1)) for k in range(3)], -1)
    coh = np.maximum(np.stack([ndi.median_filter(thin[..., k], size=(1, 31)) for k in range(3)], -1), 0)
    on = ndi.maximum_filter(ndi.gaussian_filter1d(coh @ LUMA, 20, axis=1), size=(7, 1))
    w = step(on, 0.004, 0.012)[..., None]
    coh = coh * (1 - w) + thin * w
    d = T.rays()
    t = (c @ n) / (d @ n)
    q = d * t[..., None] - c
    r = np.linalg.norm(q, axis=-1) / rad
    ang = np.mod(np.arctan2(q @ e2, q @ e1), 2 * np.pi)
    col = ((ang - TH0) / (TH1 - TH0) * NT - 0.5).astype(np.float32)
    row = ((r - R0) / (R1 - R0) * NR - 0.5).astype(np.float32)
    line = np.stack([cv2.remap(np.ascontiguousarray(coh[..., k]), col, row, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) for k in range(3)], -1)
    line[t <= 0] = 0
    return line


def scatter(lin, floor, clear, shape, inner):
    lum = lin @ LUMA
    top = lum - ndi.grey_opening(lum, size=(9, 9))
    lab, n = ndi.label((top > STAR[0]) & clear)
    half = STAR[1]
    seen = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        cy, cx = (sl[0].start + sl[0].stop) // 2, (sl[1].start + sl[1].stop) // 2
        if max(h, w) > half or max(h, w) > 2.5 * min(h, w) or not (half <= cy < lin.shape[0] - half and half <= cx < lin.shape[1] - half):
            continue
        box = (slice(cy - half, cy + half + 1), slice(cx - half, cx + half + 1))
        own = ndi.gaussian_filter(ndi.binary_dilation(lab[box] == i + 1, iterations=2).astype(np.float32), 0.8)
        seen.append(np.maximum(lin[box] - floor[box], 0) * own[..., None])
    rng = np.random.default_rng(STAR[2])
    count = round(STAR[4] * len(seen) / max(clear.sum(), 1) * (~inner).sum())
    out = np.zeros(shape + (3,), np.float32)
    ys, xs = np.nonzero(~ndi.binary_dilation(inner, iterations=4)[half:-half, half:-half])
    for j, k in zip(rng.integers(0, len(ys), count), rng.integers(0, len(seen), count)):
        y, x = ys[j], xs[j]
        out[y:y + 2 * half + 1, x:x + 2 * half + 1] += seen[k]
    out[inner] = 0
    return out, len(seen), count


def main(close, glow, onesky, out):
    a = scene(close, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    s = scene(onesky, Image.BICUBIC)
    d = T.rays()
    above = T.elevation(d) * T.F
    sky = np.maximum(a - g, 0)
    line = ring_lines(sky)
    clean = np.maximum(sky - line, 0)
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    sx, sy, _ = T.project(T.SUN[None, :] * 10)
    r = np.hypot(xx - sx[0], yy - sy[0])
    near = r < 40
    s = np.where(near[..., None], np.stack([ndi.median_filter(s[..., k], 21) for k in range(3)], -1), s)
    low = np.stack([ndi.gaussian_filter(np.minimum(clean[..., k], ndi.gaussian_filter(clean[..., k], 5)), 14) for k in range(3)], -1)
    ok = above > 60
    bins = np.minimum((r / 4).astype(np.int64), 499)
    prof = np.zeros((500, 3), np.float32)
    for k in range(3):
        t, cnt = T.bin_percentile(bins[ok], low[..., k][ok].astype(np.float64), 500, 0.5)
        have = cnt > 30
        prof[:, k] = np.interp(np.arange(500), np.flatnonzero(have), t[have])
    prof = ndi.gaussian_filter1d(prof, 3, axis=0)
    veil = prof[bins]
    below = s + veil
    m = step(above, 40, 120)[..., None]
    lin = clean * m + below * (1 - m)
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    floor = np.stack([ndi.gaussian_filter(np.minimum(lin[..., k], ndi.gaussian_filter(lin[..., k], 5)), 14) for k in range(3)], -1)
    pad = ((py, py), (px, px), (0, 0))
    base = np.pad(floor, pad, mode='edge')
    inner = np.zeros(base.shape[:2], bool)
    inner[py:py + FULL[1], px:px + FULL[0]] = True
    away = ndi.distance_transform_edt(~inner)
    wide = base.copy()
    for lo, hi in zip(SPREAD[:-1], SPREAD[1:]):
        soft = np.stack([ndi.gaussian_filter(base[..., k], hi) for k in range(3)], -1)
        t = np.clip((away - lo) / (hi - lo), 0, 1)[..., None]
        wide = wide * (1 - t) + soft * t
    stars, kinds, count = scatter(lin, floor, (above > 200) & (line @ LUMA < 1e-4) & (floor @ LUMA < STAR[3]), base.shape[:2], inner)
    wide += stars
    wide[py:py + FULL[1], px:px + FULL[0]] = lin
    img = Image.fromarray((geo.to_srgb(geo.film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/sky-terrain.webp', lossless=True, quality=90, method=6)
    show = lambda v: Image.fromarray((geo.to_srgb(geo.film(v)) * 255 + 0.5).astype(np.uint8))
    show(lin).resize((1408, 792), Image.LANCZOS).save(WORK + 'patch-v.jpg', quality=90)
    show(line * 2).resize((1408, 792), Image.LANCZOS).save(WORK + 'lines-v.jpg', quality=90)
    show(lin).crop((1500, 300, 2500, 1000)).save(WORK + 'patch-crop.png')
    print('margin stars', count, 'from', kinds, 'stamps')
    print('sky level p50 above 200 px', np.percentile((clean @ LUMA)[above > 200], 50), 'one sky p50', np.percentile((s @ LUMA)[above > 200], 50), 'line energy', float(line.sum()))


main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
