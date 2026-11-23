import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import noise

LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def image_direction(rgb, trust, step, scale):
    lum = np.log(np.maximum(rgb @ LUMA, 1e-3)).astype(np.float32)
    lum = cv2.GaussianBlur(lum, (0, 0), 1.2)
    gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3)
    s = scale / step
    w = trust
    jxx = cv2.GaussianBlur(gx * gx * w, (0, 0), s)
    jyy = cv2.GaussianBlur(gy * gy * w, (0, 0), s)
    jxy = cv2.GaussianBlur(gx * gy * w, (0, 0), s)
    den = cv2.GaussianBlur(w, (0, 0), s)
    c2 = -(jxx - jyy)
    s2 = -2 * jxy
    mag = np.sqrt(c2 * c2 + s2 * s2)
    coherence = mag / np.maximum(jxx + jyy, 1e-9)
    return c2 / np.maximum(mag, 1e-9), s2 / np.maximum(mag, 1e-9), coherence * np.clip(den * 1.5 - 0.5, 0, 1)


def stream(gx, gy, cfg):
    v = cfg['vortex']
    t = np.radians(v['tiltDeg'])
    qx = ((gx - v['centre'][0]) * np.cos(t) + (gy - v['centre'][1]) * np.sin(t)) / v['axes'][0]
    qy = (-(gx - v['centre'][0]) * np.sin(t) + (gy - v['centre'][1]) * np.cos(t)) / v['axes'][1]
    rho2 = qx * qx + qy * qy
    psi = v['strength'] * 0.5 * np.log(1 + rho2 / (v['core'] ** 2))
    z = np.radians(cfg['zonalDeg'])
    across = -gx * np.sin(z) + gy * np.cos(z)
    for jet in cfg['jets']:
        psi = psi + jet['strength'] * jet['width'] * np.log(np.cosh((across - jet['at']) / jet['width']))
    for k, e in enumerate(cfg['eddies']):
        psi = psi + e['strength'] * e['wave'] * (noise.fbm(gx, gy, e['wave'], 2, seed=101 + 13 * k) - 0.5)
    return psi.astype(np.float32)


def model_direction(psi):
    dx = cv2.Sobel(psi, cv2.CV_32F, 1, 0, ksize=3)
    dy = cv2.Sobel(psi, cv2.CV_32F, 0, 1, ksize=3)
    vx, vy = dy, -dx
    n = np.maximum(np.sqrt(vx * vx + vy * vy), 1e-9)
    vx, vy = vx / n, vy / n
    return vx * vx - vy * vy, 2 * vx * vy


def direction(c2, s2):
    a = 0.5 * np.arctan2(s2, c2)
    return np.cos(a).astype(np.float32), np.sin(a).astype(np.float32)


def lic(field, dx, dy, length_px, taps):
    n = field.shape[0]
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    total = field.copy()
    weight = 1.0
    ds = length_px / taps
    for sign in (1.0, -1.0):
        px, py = xs.copy(), ys.copy()
        lx, ly = dx * sign, dy * sign
        for k in range(taps):
            px += lx * ds
            py += ly * ds
            nx = cv2.remap(dx, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            ny = cv2.remap(dy, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            flip = np.where(nx * lx + ny * ly < 0, -1.0, 1.0).astype(np.float32)
            lx, ly = nx * flip, ny * flip
            wk = 0.5 + 0.5 * np.cos(np.pi * (k + 1) / (taps + 1))
            total += wk * cv2.remap(field, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            weight += wk
    return total / weight


def streaks(gx, gy, dx, dy, step, waves, stretch, seed):
    out = np.zeros(gx.shape, np.float32)
    total = 0.0
    for k, wave in enumerate(waves):
        if wave < 2.5 * step:
            continue
        base = noise.value(gx / wave + 31.7 * k, gy / wave - 11.3 * k, seed + k) - 0.5
        taps = int(np.clip(stretch * wave / step / 2.0, 4, 40))
        s = lic(base, dx, dy, stretch * wave / step, taps)
        s /= max(float(s.std()), 1e-6)
        amp = wave ** 0.6
        out += amp * s
        total += amp * amp
    return out / max(np.sqrt(total), 1e-6)


def cumulus(gx, gy, step, wave, octaves, seed):
    out = np.zeros(gx.shape, np.float32)
    amp = 1.0
    total = 0.0
    c, s = np.cos(0.9), np.sin(0.9)
    x, y = gx, gy
    for k in range(octaves):
        if wave < 3 * step:
            break
        f1, f2 = noise.cells(x / wave + 5.2 * k, y / wave + 1.7 * k, seed + k)
        puff = np.sqrt(np.clip(1 - (f1 / 0.75) ** 2, 0, 1))
        out += amp * puff * (0.4 + 0.6 * out / max(total, 1e-6) if k else 1.0)
        total += amp
        amp *= 0.55
        wave *= 0.5
        x, y = c * x - s * y, s * x + c * y
    return out / total
