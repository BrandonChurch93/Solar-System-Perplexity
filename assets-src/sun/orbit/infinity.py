import numpy as np
import cv2
from scipy import ndimage as ndi
from geo import *

FILL = WORK + '/sky-fill-x.png'
FAR = 1.9
BAND = 1.6
MILKY = (0.045, 0.075)
OPEN = 7
SOFT = 5
SPREAD = 160
DENSITY = (0.5, 1.7)
TRIM = 0.8
QUANTILES = np.concatenate([np.linspace(0, 0.99, 100), 1 - np.logspace(-2, -6, 80)])


def split(a):
    low = np.stack([ndi.grey_opening(a[..., c], size=(OPEN, OPEN)) for c in range(3)], -1)
    return low, a - low


def remap(values, source, target):
    return np.interp(values, np.quantile(source, QUANTILES), np.quantile(target, QUANTILES)).astype(np.float32)


def fill_scene():
    hero = load(HERO)
    f = np.clip(cv2.resize(load(FILL), (W, H), interpolation=cv2.INTER_AREA), 0, 1)
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.hypot(xx + 0.5 - CX, yy + 0.5 - CY) / RPX
    far, near = d > FAR, d > BAND
    hero_low, hero_stars = split(hero)
    low, stars = split(f)
    low = np.stack([remap(low[..., c], low[..., c][far], hero_low[..., c][far]) for c in range(3)], -1)
    lum = luma(stars)
    target = luma(hero_stars)
    bright, hero_bright = luma(low), luma(hero_low)
    cut = (MILKY[0] + MILKY[1]) / 2
    dim = remap(lum, lum[far & (bright < cut)], target[far & (hero_bright < cut)])
    band = remap(lum, lum[near & (bright >= cut)], target[near & (hero_bright >= cut)])
    share = step(bright, MILKY[0], MILKY[1])
    gain = (dim * (1 - share) + band * share) / np.maximum(lum, 1e-4)
    stars = stars * gain[..., None]
    mask = near.astype(np.float32)
    have = cv2.GaussianBlur(luma(stars) * mask, (0, 0), SPREAD) / np.maximum(cv2.GaussianBlur(mask, (0, 0), SPREAD), 1e-4)
    want = cv2.GaussianBlur(target * mask, (0, 0), SPREAD) / np.maximum(cv2.GaussianBlur(mask, (0, 0), SPREAD), 1e-4)
    density = np.clip(want / np.maximum(have, 1e-5), DENSITY[0], DENSITY[1])
    print('star density gain', float(density.min().round(3)), float(np.median(density).round(3)), float(density.max().round(3)))
    stars = stars * (density * (TRIM + (1 - TRIM) * share))[..., None]
    out = np.clip(low + stars, 0, 1)
    print('sky floor', low[far].mean(0).round(4), 'against', hero_low[far].mean(0).round(4), 'stars', float(luma(stars)[far].mean().round(4)), 'against', float(luma(hero_stars)[far].mean().round(4)))
    return scene(out).astype(np.float32)


def fill_floor(f):
    low = np.stack([ndi.grey_opening(f[..., c], size=(OPEN + 2, OPEN + 2)) for c in range(3)], -1)
    return cv2.GaussianBlur(low, (0, 0), SOFT)
