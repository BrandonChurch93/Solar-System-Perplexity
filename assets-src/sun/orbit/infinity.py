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


STARS_FROM = (1.04, 1.12)
OWN = (1.0, 1.12)
FAR_BLEND = 0.18
LEVEL = ROOT + '/assets-src/sun/orbit/level.npy'


def card_scene():
    import os
    from polar import PW, PH, polar_of, sample_polar
    g = fill_scene()
    floor = fill_floor(g)
    hero = scene(load(HERO)).astype(np.float32)
    stars = np.load(WORK + '/hero-stars.npy').astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    ray = np.stack([(xx + 0.5 - W / 2) / FOCAL, -(yy + 0.5 - H / 2) / FOCAL, -np.ones((H, W))], -1)
    theta, b = polar_of(CAM + ray)
    reach = np.load(WORK + '/polar-reach.npy')
    at = theta / (2 * np.pi) * PW - 0.5
    far = step((b - np.interp(at, np.arange(PW), reach, period=PW)) / FAR_BLEND, 0, 1).astype(np.float32)[..., None]
    cor = np.load(WORK + '/polar-corona.npy').astype(np.float32)
    if os.path.exists(LEVEL):
        cor *= cv2.resize(np.load(LEVEL).astype(np.float32), (PW, PH), interpolation=cv2.INTER_LINEAR)
    halo = sample_polar(cor, theta, b)
    del cor
    prom = sample_polar(np.load(WORK + '/polar-soft.npy').astype(np.float32), theta, b)
    prom = cv2.GaussianBlur(cv2.dilate(prom, np.ones((9, 9), np.uint8)), (0, 0), 2)
    points = (step(b, *STARS_FROM) * (1 - step(prom, 0.02, 0.2))).astype(np.float32)[..., None]
    own = (1 - step(b, *OWN)).astype(np.float32)[..., None]
    near = floor + (g - floor) * own + stars * points
    out = near * (1 - far) + np.maximum(hero - halo, 0) * far
    print('card: far share', float(far.mean().round(3)), 'hero star light', float(luma(stars * points).mean().round(5)), 'own star share', float(own.mean().round(3)))
    return out.astype(np.float32)
