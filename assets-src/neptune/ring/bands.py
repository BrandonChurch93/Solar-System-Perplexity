import os
import sys

import cv2
import numpy as np
from scipy import ndimage as ndi

NA, NR = 4096, 512
R0, R1 = 1.28, 1.92
UNIT = 0.16
SEED = 20261121
ARC_UNIT = 1.0
RINGLETS = [
    (1.358, 0.0022, 0.006, 0.40),
    (1.377, 0.0030, 0.010, 0.35),
    (1.402, 0.0120, 0.006, 0.25),
    (1.498, 0.0022, 0.016, 0.30),
    (1.511, 0.0030, 0.040, 0.25),
    (1.524, 0.0022, 0.022, 0.35),
    (1.552, 0.0018, 0.009, 0.45),
    (1.588, 0.0020, 0.012, 0.40),
    (1.604, 0.0026, 0.014, 0.35),
    (1.617, 0.0018, 0.008, 0.45),
    (1.641, 0.0024, 0.016, 0.35),
    (1.655, 0.0020, 0.009, 0.40),
    (1.686, 0.0034, 0.026, 0.30),
    (1.706, 0.0090, 0.006, 0.30),
    (1.774, 0.0026, 0.012, 0.40),
    (1.812, 0.0016, 0.005, 0.50),
]
ARCS = [
    (1.641, 63.0, 1.23, 0.42),
    (1.512, 58.7, 1.67, 0.36),
    (1.511, 46.6, 0.40, 0.07),
    (1.588, 51.75, 0.62, 0.08),
    (1.358, 37.8, 0.75, 0.05),
    (1.686, 71.5, 0.90, 0.05),
    (1.774, 55.0, 0.50, 0.04),
]
BODY_UNIT = 0.05
BODIES = [
    (1.345, 1.425, 0.010, 0.0050),
    (1.488, 1.535, 0.006, 0.0105),
    (1.535, 1.612, 0.012, 0.0060),
    (1.628, 1.662, 0.005, 0.0125),
    (1.690, 1.790, 0.016, 0.0036),
]
BODY_GRAIN = (140, 0.25)
BODY_EDGE = 0.0016
RINGLET = (0.006, 0.02, 0.0009)
GAP = (0.003, 0.007, 0.1, 0.4)
RINGLET_LEVEL = (0.6, 1.45)
BODY_ALONG = 0.16
SHEET = (1.44, 1.76, 0.0045)
GRAIN = (90, 0.7)
SPARKS = (900, 0.05, 0.3)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def wave(rng, n, octaves):
    az = np.arange(n) / n * 2 * np.pi
    out = np.zeros(n)
    for k, a in octaves:
        out += a * np.cos(az * k + rng.uniform(0, 2 * np.pi))
    return out


def main(out):
    rng = np.random.default_rng(SEED)
    r = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
    az = (np.arange(NA) + 0.5) / NA * 360
    img = np.zeros((NR, NA))
    lo, hi, level = SHEET
    edge_in = lo + 0.012 * wave(rng, NA, [(2, 1), (5, 0.5)])
    edge_out = hi + 0.016 * wave(rng, NA, [(1, 1), (3, 0.6)])
    body = step(r[:, None], edge_in[None] - 0.035, edge_in[None] + 0.035) * (1 - step(r[:, None], edge_out[None] - 0.05, edge_out[None] + 0.05))
    grain = np.zeros(NR)
    for _ in range(GRAIN[0]):
        c = rng.uniform(lo - 0.03, hi + 0.03)
        s = rng.uniform(0.0012, 0.008)
        grain += rng.uniform(-1, 1) * np.exp(-((r - c) / s) ** 2)
    grain = grain / np.abs(grain).max()
    slope = 0.75 + 0.5 * step(r, lo, hi)
    along = 1 + 0.3 * wave(rng, NA, [(1, 1), (2, 0.7), (5, 0.4)]) / 1.6
    img += level * body * (slope * (1 + GRAIN[1] * grain))[:, None] * along[None]
    for c, sig, gain, vary in RINGLETS:
        m = 1 + vary * wave(rng, NA, [(1, 0.5), (3, 0.6), (7, 0.5), (17, 0.35), (41, 0.2)]) / 1.2
        img += gain * np.exp(-((r[:, None] - c) / sig) ** 2) * np.maximum(m, 0.15)[None]
    arcs = np.zeros((NR, NA))
    for c, centre, fwhm, gain in ARCS:
        d = (az - centre + 180) % 360 - 180
        core = np.exp(-(d / (fwhm / 1.665)) ** 2) + 0.1 * np.exp(-(d / (fwhm * 1.8)) ** 2)
        arcs += gain * np.exp(-((r[:, None] - c) / 0.0034) ** 2) * core[None]
    count, lo_gain, hi_gain = SPARKS
    centres = np.array([q[0] for q in RINGLETS])
    weights = np.array([q[2] for q in RINGLETS])
    pick = rng.choice(len(centres), count, p=weights / weights.sum())
    rr = centres[pick] + rng.normal(0, 0.004, count)
    aa = rng.uniform(0, 360, count)
    gg = rng.uniform(lo_gain, hi_gain, count) * rng.uniform(0, 1, count) ** 2
    yy = np.clip(((rr - R0) / (R1 - R0) * NR).astype(int), 0, NR - 1)
    xx = (aa / 360 * NA).astype(int) % NA
    dots = np.zeros((NR, NA))
    np.add.at(dots, (yy, xx), gg)
    dots = ndi.gaussian_filter(dots, (1.1, 2.6), mode=('nearest', 'wrap')) * 2 * np.pi * 1.1 * 2.6
    arcs += dots
    bodies = np.zeros((NR, NA))
    fine = np.zeros(NR)
    for _ in range(BODY_GRAIN[0]):
        fine += rng.uniform(-1, 1) * np.exp(-((r - rng.uniform(R0, R1)) / rng.uniform(0.0015, 0.006)) ** 2)
    fine = fine / np.abs(fine).max()
    for lo_b, hi_b, soft, gain in BODIES:
        edge = min(soft, BODY_EDGE)
        shape = step(r, lo_b - edge, lo_b + edge) * (1 - step(r, hi_b - edge, hi_b + edge))
        tilt = 0.8 + 0.4 * rng.uniform(0, 1) * (r - lo_b) / (hi_b - lo_b)
        m = 1 + BODY_ALONG * wave(rng, NA, [(1, 0.6), (2, 0.5), (5, 0.5), (11, 0.4)]) / 1.3
        stack = np.zeros(NR)
        at = lo_b
        e = RINGLET[2]
        while at < hi_b:
            w = rng.uniform(RINGLET[0], RINGLET[1])
            stack += rng.uniform(*RINGLET_LEVEL) * step(r, at - e, at + e) * (1 - step(r, at + w - e, at + w + e))
            at += w
            g = rng.uniform(GAP[0], GAP[1])
            stack += rng.uniform(GAP[2], GAP[3]) * step(r, at - e, at + e) * (1 - step(r, at + g - e, at + g + e))
            at += g
        bodies += gain * (shape * tilt * stack * (1 + BODY_GRAIN[1] * fine))[:, None] * np.maximum(m, 0.2)[None]
    taper = (step(r, R0, R0 + 0.04) * (1 - step(r, R1 - 0.04, R1)))[:, None]
    bodies = np.maximum(bodies * taper, 0)
    img = np.maximum(img * taper, 0)
    arcs = np.maximum(arcs * taper, 0)
    print('bands p50 p99 max', np.percentile(img, 50).round(5), np.percentile(img, 99).round(4), img.max().round(4), 'arcs max', arcs.max().round(3))
    png = np.zeros((NR, NA, 3), np.uint8)
    png[..., 2] = (np.clip(np.sqrt(img / UNIT), 0, 1)[::-1] * 255 + 0.5).astype(np.uint8)
    png[..., 1] = (np.clip(np.sqrt(arcs / ARC_UNIT), 0, 1)[::-1] * 255 + 0.5).astype(np.uint8)
    png[..., 0] = (np.clip(np.sqrt(bodies / BODY_UNIT), 0, 1)[::-1] * 255 + 0.5).astype(np.uint8)
    os.makedirs(out + '/full', exist_ok=True)
    os.makedirs(out + '/web', exist_ok=True)
    cv2.imwrite(out + '/full/ring-bands.png', png, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    lin = (png.astype(np.float32) / 255) ** 2
    web = cv2.resize(lin, (NA // 2, NR // 2), interpolation=cv2.INTER_AREA)
    cv2.imwrite(out + '/web/ring-bands.png', (np.sqrt(web) * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    for k in ('full', 'web'):
        print(k, round(os.path.getsize(out + '/' + k + '/ring-bands.png') / 1e6, 3), 'MB')
    view = np.clip((lin[..., 2] * UNIT * 0.5 + lin[..., 1] * ARC_UNIT * 0.15 + lin[..., 0] * BODY_UNIT * 1.6) * 14, 0, 1) ** 0.45
    os.makedirs('out/work/nep/ring', exist_ok=True)
    cv2.imwrite('out/work/nep/ring/bands-view.jpg', (cv2.resize(view[:, :NA // 3], (NA // 3, NR), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8))


main(sys.argv[1] if len(sys.argv) > 1 else 'public/assets/neptune')
