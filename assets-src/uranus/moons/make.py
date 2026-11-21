import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

DST = 'public/assets/uranus/'
W, H = 1536, 768


def sphere_grid():
    lon = ((np.arange(W) + 0.5) / W - 0.5) * 2 * np.pi
    lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    lo, la = np.meshgrid(lon, lat)
    return geo.direction(lo, la).astype(np.float32)


def noise(p, rng, freq, octaves, gain=0.5):
    n = 64
    lattice = ndi.gaussian_filter(rng.standard_normal((n, n, n)).astype(np.float32), 1.0, mode='wrap')
    lattice /= lattice.std()
    out = np.zeros(p.shape[:2], np.float32)
    amp = 1.0
    for o in range(octaves):
        off = rng.uniform(0, n, 3)
        c = (p * (freq * 2 ** o * 3) + off).transpose(2, 0, 1).reshape(3, -1)
        out += amp * ndi.map_coordinates(lattice, c, order=1, mode='grid-wrap').reshape(p.shape[:2])
        amp *= gain
    return out


def craters(p, rng, count, rmin, rmax, power):
    h = np.zeros(p.shape[:2], np.float32)
    radii = rmin * (1 - rng.uniform(0, 1, count) * (1 - (rmin / rmax) ** power)) ** (-1 / power)
    centers = rng.standard_normal((count, 3))
    centers /= np.linalg.norm(centers, axis=1, keepdims=True)
    order = np.argsort(-radii)
    lat = np.arcsin(np.clip(p[..., 1], -1, 1))
    for i in order:
        c, r = centers[i], radii[i]
        clat = np.arcsin(c[1])
        rows = np.nonzero(np.abs(lat[:, 0] - clat) < r * 1.7)[0]
        if len(rows) == 0:
            continue
        sub = p[rows[0]:rows[-1] + 1]
        dist = np.arccos(np.clip(sub @ c, -1, 1)) / r
        m = dist < 1.7
        if not m.any():
            continue
        depth = 0.22 * r * (1 if r < 0.12 else 0.6)
        bowl = np.where(dist < 1, (dist * dist - 1) * depth, 0)
        rim = 0.3 * depth * np.exp(-((dist - 1) / 0.22) ** 2)
        fade = np.clip((1.7 - dist) / 0.7, 0, 1)
        blk = h[rows[0]:rows[-1] + 1]
        blk[m] = blk[m] * np.clip(dist[m] / 1.0, 0.25, 1) ** 0.5 + (bowl + rim * fade)[m]
    return h


def moon(name, seed, tone, count, grooves):
    rng = np.random.default_rng(seed)
    p = sphere_grid()
    h = craters(p, rng, count, 0.012, 0.42, 1.9)
    h += 0.012 * noise(p, rng, 2.0, 5)
    if grooves:
        q = p + 0.08 * np.stack([noise(p, rng, 1.5, 2) for _ in range(3)], -1)
        band = np.abs(noise(q, rng, 1.2, 1)) < 0.25
        ridges = 0.012 * np.sin(q[..., 0] * 90 + 30 * noise(q, rng, 1.0, 2)) * ndi.gaussian_filter(band.astype(np.float32), 6)
        h += ridges
    lo, hi = float(h.min()), float(h.max())
    hn = (h - lo) / (hi - lo)
    alb = tone * (1 + 0.09 * noise(p, rng, 1.6, 5) + 0.04 * noise(p, rng, 9.0, 4))
    alb *= 0.9 + 0.2 * ndi.gaussian_filter(hn, 2.0)
    alb += 0.035 * np.clip(ndi.gaussian_laplace(hn, 1.2) * -40, -1, 1)
    alb = np.clip(alb, 0.03, 0.95)
    rgb = np.stack([alb * 1.0, alb * 0.95, alb * 0.9], -1)
    img = (np.clip(geo.display(rgb), 0, 1) * 255 + 0.5).astype(np.uint8)
    for setname, width in (('full', W), ('web', W // 2)):
        os.makedirs(DST + setname, exist_ok=True)
        im = Image.fromarray(img)
        hh = hn
        if width != W:
            im = im.resize((width, width // 2), Image.LANCZOS)
            hh = np.asarray(Image.fromarray(hn).resize((width, width // 2), Image.LANCZOS))
        im.save(DST + setname + '/' + name + '-color.jpg', quality=93, subsampling=0)
        (np.clip(hh, 0, 1) * 65535 + 0.5).astype('<u2').tofile(DST + setname + '/' + name + '-height.bin')
    Image.fromarray(img).save('out/work/u/' + name + '-map.jpg', quality=90)
    print(name, 'height range', lo, hi)
    return hi - lo


moon('miranda', 11, 0.42, 520, True)
moon('ariel', 23, 0.5, 700, False)
