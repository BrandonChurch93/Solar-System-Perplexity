import json

import numpy as np

W, H = 2816, 1584
VFOV = 60.0
F = (H / 2) / np.tan(np.radians(VFOV) / 2)

FIT = json.load(open('assets-src/uranus/terrain/fit.json'))
NADIR = np.array(FIT['centre'])
ALPHA = FIT['alpha']
R = 1.0 / FIT['altitude']
CENTRE = (R + 1.0) * NADIR
UP = -NADIR
F0 = np.array([0.0, 0.0, -1.0])
F0 = F0 - UP * (F0 @ UP)
F0 = F0 / np.linalg.norm(F0)
R0 = np.cross(F0, UP)
SUN = np.array(FIT['sun'])

PSI_MAX = np.radians(120.0)
S0, S1 = 0.2, 40.0
EPS_MAX = np.radians(30.0)
LIGHT = (256, 256)
HALO = (256, 128)


def rays(w=W, h=H):
    x, y = np.meshgrid(np.arange(w) + 0.5, np.arange(h) + 0.5)
    k = W / w
    d = np.stack([(x * k - W / 2) / F, (H / 2 - y * k) / F, -np.ones_like(x)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def ground(d):
    b = d @ CENTRE
    disc = b * b - (CENTRE @ CENTRE - R * R)
    hit = (disc > 0) & (b > 0)
    t = b - np.sqrt(np.maximum(disc, 0))
    p = d * t[..., None]
    n = (p - CENTRE) / R
    mu = -np.sum(n * d, -1)
    return p, n, mu, hit


def psi_of(d):
    return np.arctan2(d @ R0, d @ F0)


def light_row(mu):
    b = np.sqrt(np.maximum(1 - np.clip(mu, 0, 1) ** 2, 0))
    return np.sqrt(np.maximum(1 - b, 0))


def elevation(d):
    return np.arccos(np.clip(d @ NADIR, -1, 1)) - ALPHA


def surface(psi, s):
    g = s / R
    n = UP * np.cos(g)[..., None] + (F0 * np.cos(psi)[..., None] + R0 * np.sin(psi)[..., None]) * np.sin(g)[..., None]
    return CENTRE + R * n, n


def project(p):
    z = -p[..., 2]
    ok = z > 1e-6
    zz = np.where(ok, z, 1.0)
    return W / 2 + F * p[..., 0] / zz, H / 2 - F * p[..., 1] / zz, ok


def bin_percentile(idx, values, nbins, q):
    order = np.lexsort((values, idx))
    si = idx[order]
    sv = values[order]
    counts = np.bincount(si, minlength=nbins)
    starts = np.concatenate([[0], np.cumsum(counts)[:-1]])
    pick = starts + np.minimum((counts * q).astype(np.int64), np.maximum(counts - 1, 0))
    out = np.zeros(nbins)
    has = counts > 0
    out[has] = sv[pick[has]]
    return out, counts
