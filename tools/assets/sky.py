import argparse
import gc
import json
import os
import struct

import cv2
import numpy as np
import pyvips
from PIL import Image

SRC = 'references/cache/sky/milkyway_2020_8k_gal.exr'
CACHE = 'out/work/sky/cache'
STEP = 256
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
# Matches procedural star-band pole in src/space/sky.ts so glow and point stars share one galactic plane.
POLE = (0.45, 0.82, 0.35)
GAMMA_TURN = 0.28

TAKES = {
    'take-01-subtle': dict(
        floor=0.00036, toe=0.0008, dust=1.28, med=0.06, halo=0.045, arm_boost=1.15,
        exposure=4.8, gamma=0.90, shoulder=0.58,
        cool=(0.56, 0.88, 1.34), mid=(0.90, 0.98, 1.10), warm=(1.32, 1.02, 0.72), dusk=(0.66, 0.80, 0.98),
        warm_start=0.050, warm_span=0.22, bg=(0.0018, 0.0028, 0.0044),
    ),
    'take-02-pushed': dict(
        floor=0.00024, toe=0.00035, dust=1.72, med=0.12, halo=0.14, arm_boost=1.55,
        exposure=8.4, gamma=0.84, shoulder=0.88,
        cool=(0.45, 0.86, 1.54), mid=(0.92, 1.00, 1.16), warm=(1.48, 1.04, 0.64), dusk=(0.60, 0.76, 0.98),
        warm_start=0.058, warm_span=0.26, bg=(0.0028, 0.0046, 0.0074),
    ),
    'take-03-warm-heavy': dict(
        floor=0.00034, toe=0.0007, dust=1.46, med=0.08, halo=0.06, arm_boost=1.28,
        exposure=6.4, gamma=0.87, shoulder=0.70,
        cool=(0.78, 0.92, 1.14), mid=(1.08, 1.00, 0.90), warm=(1.44, 1.02, 0.66), dusk=(0.82, 0.80, 0.78),
        warm_start=0.028, warm_span=0.18, bg=(0.0021, 0.0031, 0.0046),
    ),
    'take-04-wide-haze': dict(
        floor=0.00025, toe=0.0002, dust=1.44, med=0.12, halo=0.22, arm_boost=1.18,
        exposure=5.9, gamma=0.85, shoulder=0.66,
        cool=(0.52, 0.88, 1.42), mid=(0.92, 0.99, 1.10), warm=(1.38, 1.03, 0.69), dusk=(0.68, 0.80, 0.96),
        warm_start=0.048, warm_span=0.23, bg=(0.0022, 0.0036, 0.0056),
    ),
    'take-05-sculpted': dict(
        floor=0.00038, toe=0.00085, dust=1.64, med=0.075, halo=0.055, arm_boost=1.46,
        exposure=7.4, gamma=0.87, shoulder=0.75,
        cool=(0.48, 0.87, 1.48), mid=(0.86, 0.98, 1.18), warm=(1.42, 1.03, 0.67), dusk=(0.56, 0.76, 1.02),
        warm_start=0.060, warm_span=0.24, bg=(0.0021, 0.0034, 0.0054),
    ),
}


def luma(a):
    return a @ LUMA


def smooth(x):
    return x * x * (3.0 - 2.0 * x)


def strip(img, y0, y1, pad):
    h, w = img.shape[:2]
    idx = np.arange(y0 - pad, y1 + pad)
    flip = (idx < 0) | (idx >= h)
    rows = img[np.where(idx < 0, -idx - 1, np.where(idx >= h, 2 * h - 1 - idx, idx))].copy()
    if flip.any():
        rows[flip] = np.roll(rows[flip], w // 2, axis=1)
    return np.concatenate([rows[:, -pad:], rows, rows[:, :pad]], axis=1)


def wrap_x(a, p):
    return np.concatenate([a[:, -p:], a, a[:, :p]], axis=1)


def load_source():
    v = pyvips.Image.new_from_file(SRC)
    buf = v.write_to_memory()
    a = np.ndarray(buffer=buf, dtype=np.float32, shape=[v.height, v.width, v.bands])
    rgb = np.array(a[:, :, :3], dtype=np.float32, copy=True)
    del a, buf, v
    gc.collect()
    return rgb


def clean_stage():
    rgb = load_source()
    H, W, _ = rgb.shape
    out = np.empty_like(rgb)
    for y0 in range(0, H, STEP):
        y1 = min(H, y0 + STEP)
        p = strip(rgb, y0, y1, 4)
        m3 = cv2.medianBlur(p, 3)[4:-4, 4:-4]
        m5 = cv2.medianBlur(p, 5)[4:-4, 4:-4]
        o = p[4:-4, 4:-4]
        l0, l3, l5 = luma(o), luma(m3), luma(m5)
        w5 = np.clip((l0 / (l5 + 2.5e-5) - 1.16) / 0.22, 0, 1)[..., None]
        s = o * (1 - w5) + m5 * w5
        w3 = np.clip((l0 / (l3 + 2.0e-5) - 1.08) / 0.18, 0, 1)[..., None]
        s = s * (1 - w3) + m3 * w3
        out[y0:y1] = 0.5 * s + 0.5 * m3
    del rgb
    gc.collect()
    clean = out

    for scale, sig, thresh, span in ((2, 3.5, 1.58, 0.40), (4, 4.5, 1.65, 0.45)):
        sm = cv2.resize(clean, (W // scale, H // scale), interpolation=cv2.INTER_AREA)
        bg = cv2.GaussianBlur(cv2.medianBlur(wrap_x(sm, 24), 5), (0, 0), sig)[:, 24:-24]
        bg = cv2.resize(bg, (W, H), interpolation=cv2.INTER_CUBIC)
        for y0 in range(0, H, STEP):
            y1 = min(H, y0 + STEP)
            c, b = clean[y0:y1], bg[y0:y1]
            ew = smooth(np.clip((luma(c) / (np.maximum(luma(b), 1e-6) + 4e-5) - thresh) / span, 0, 1))[..., None]
            clean[y0:y1] = c * (1 - ew) + b * ew
        del sm, bg
        gc.collect()

    lat = (0.5 - (np.arange(H, dtype=np.float32) + 0.5) / H) * 180.0
    absb = np.abs(lat)

    s8 = cv2.resize(clean, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    zonal8 = np.percentile(s8, 45, axis=1, keepdims=True).astype(np.float32)
    s8_c = np.minimum(s8, zonal8 * 1.15 + 6e-5)
    f4 = cv2.resize(cv2.GaussianBlur(wrap_x(s8_c, 32), (45, 45), 10.5)[:, 32:-32], (W, H), interpolation=cv2.INTER_CUBIC)
    del s8, s8_c

    s4 = cv2.resize(clean, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    zonal4 = np.percentile(s4, 70, axis=1, keepdims=True).astype(np.float32)
    ab4 = np.abs((0.5 - (np.arange(H // 4, dtype=np.float32) + 0.5) / (H // 4)) * 180.0)[:, None, None]
    clamp_w = smooth(np.clip((ab4 - 10.5) / 7.5, 0, 1))
    s4_c = s4 * (1 - clamp_w) + np.minimum(s4, zonal4 * 1.20 + 7e-5) * clamp_w
    f3 = cv2.resize(cv2.GaussianBlur(wrap_x(s4_c, 32), (33, 33), 5.0)[:, 32:-32], (W, H), interpolation=cv2.INTER_CUBIC)

    g4 = cv2.morphologyEx(wrap_x(s4_c, 32), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (27, 27)))
    g4 = cv2.GaussianBlur(g4, (49, 49), 12.0)[:, 32:-32]
    guide = cv2.resize(luma(g4), (W, H), interpolation=cv2.INTER_CUBIC)
    del s4, s4_c, g4
    gc.collect()

    gal = np.empty_like(clean)
    medl = np.empty((H, W), np.float32)
    for y0 in range(0, H, STEP):
        y1 = min(H, y0 + STEP)
        p = strip(clean, y0, y1, 22)
        f1 = cv2.GaussianBlur(p, (13, 13), 1.65)[22:-22, 22:-22]
        f2 = cv2.GaussianBlur(p, (35, 35), 5.40)[22:-22, 22:-22]
        le = np.log10(np.maximum(guide[y0:y1], 1e-6))
        ab = absb[y0:y1, None]
        w3 = smooth(np.clip((le + 3.45) / 0.55, 0, 1) * np.clip((30.0 - ab) / 11.0, 0, 1))[..., None]
        w2 = smooth(np.clip((le + 2.90) / 0.48, 0, 1) * np.clip((16.5 - ab) / 6.0, 0, 1))[..., None]
        w1 = smooth(np.clip((le + 2.35) / 0.42, 0, 1) * np.clip((11.0 - ab) / 4.5, 0, 1))[..., None]
        g = f4[y0:y1] * (1 - w3) + f3[y0:y1] * w3
        g = g * (1 - w2) + f2 * w2
        gal[y0:y1] = g * (1 - w1) + f1 * w1
        medl[y0:y1] = luma(f2 * w2 + f3[y0:y1] * (1 - w2))
    del clean, f3, guide
    gc.collect()

    wp = smooth(np.clip((absb - 80.0) / 10.0, 0, 1))[:, None, None]
    north = gal[:16].mean(axis=(0, 1), keepdims=True)
    south = gal[-16:].mean(axis=(0, 1), keepdims=True)
    for y0 in range(0, H, STEP):
        y1 = min(H, y0 + STEP)
        pole_val = np.where(lat[y0:y1, None, None] >= 0, north, south)
        gal[y0:y1] = gal[y0:y1] * (1 - wp[y0:y1]) + pole_val * wp[y0:y1]

    # Envelope must come from gal itself so clamped high-latitude clouds do not invert dust transmission.
    gal4 = cv2.resize(gal, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    e4 = cv2.morphologyEx(wrap_x(gal4, 32), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (27, 27)))
    e4 = cv2.GaussianBlur(e4, (49, 49), 12.0)[:, 32:-32]
    env = np.maximum(cv2.resize(luma(e4), (W, H), interpolation=cv2.INTER_CUBIC), luma(gal))
    del gal4, e4

    aux = np.stack([env, medl, luma(f4)], axis=-1).astype(np.float32)
    del f4, env, medl
    os.makedirs(CACHE, exist_ok=True)
    np.save(f'{CACHE}/gal.npy', gal.astype(np.float32))
    np.save(f'{CACHE}/aux.npy', aux)
    del gal, aux
    gc.collect()


def frame():
    n = np.array(POLE, dtype=np.float64)
    n /= np.linalg.norm(n)
    r = np.cross([0.0, 1.0, 0.0], n)
    r /= np.linalg.norm(r)
    u = np.cross(n, r)
    x = np.cos(GAMMA_TURN) * -r + np.sin(GAMMA_TURN) * -u
    return x, np.cross(n, x), n


def pad_sphere(a, p):
    w = a.shape[1]
    top = np.roll(a[:p][::-1], w // 2, axis=1)
    bot = np.roll(a[-p:][::-1], w // 2, axis=1)
    return wrap_x(np.concatenate([top, a, bot], axis=0), p)


def rotate_stage():
    gal = np.load(f'{CACHE}/gal.npy')
    aux = np.load(f'{CACHE}/aux.npy')
    H, W = gal.shape[:2]
    gp = pad_sphere(gal, 8)
    del gal
    ap = pad_sphere(aux, 8)
    del aux
    gc.collect()
    X, Y, N = frame()
    rot = np.lib.format.open_memmap(f'{CACHE}/rot.npy', mode='w+', dtype=np.float32, shape=(H, W, 3))
    raux = np.lib.format.open_memmap(f'{CACHE}/raux.npy', mode='w+', dtype=np.float32, shape=(H, W, 4))
    lon = ((np.arange(W) + 0.5) / W - 0.5) * 2 * np.pi
    sl, cl = np.sin(lon)[None], np.cos(lon)[None]
    for y0 in range(0, H, STEP):
        y1 = min(H, y0 + STEP)
        la = (0.5 - (np.arange(y0, y1) + 0.5) / H) * np.pi
        c, s = np.cos(la)[:, None], np.sin(la)[:, None]
        dx, dy, dz = c * sl, np.broadcast_to(s, (y1 - y0, W)), c * cl
        gx = dx * X[0] + dy * X[1] + dz * X[2]
        gy = dx * Y[0] + dy * Y[1] + dz * Y[2]
        gz = np.clip(dx * N[0] + dy * N[1] + dz * N[2], -1, 1)
        b, l = np.arcsin(gz), np.arctan2(gy, gx)
        mx = (np.mod(0.5 - l / (2 * np.pi), 1.0) * W - 0.5 + 8).astype(np.float32)
        my = ((0.5 - b / np.pi) * H - 0.5 + 8).astype(np.float32)
        rot[y0:y1] = cv2.remap(gp, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        raux[y0:y1, :, :3] = cv2.remap(ap, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        raux[y0:y1, :, 3] = (np.clip((gx - 0.15) / 0.85, 0, 1) ** 1.4 * np.exp(-((b / 0.30) ** 2))).astype(np.float32)
    rot.flush()
    raux.flush()
    del gp, ap, rot, raux
    gc.collect()


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def grade(raw, aux, p):
    raw = np.maximum(raw, 0)
    env = np.maximum(aux[..., 0], 1e-6)
    medl = np.maximum(aux[..., 1], 0)
    halo = np.maximum(aux[..., 2], 0)
    bulge = aux[..., 3]
    lum = np.maximum(luma(raw), 1e-7)
    fl = p['floor']
    ln = np.maximum(lum - fl, 0)
    en = np.maximum(env - fl, 1e-5)
    T = np.clip((ln + 1.0e-4) / (en + 1.0e-4), 0.025, 1.05)
    band = smooth(np.clip((np.log10(env + 1e-6) + 2.95) / 0.85, 0, 1))
    Ts = np.power(T, 1 + band * (p['dust'] - 1))
    arm_lift = 1.0 + (p['arm_boost'] - 1.0) * (1.0 - bulge) * smooth(np.clip((np.log10(env + 1e-6) + 2.95) / 0.65, 0, 1))
    sig = (en * Ts * arm_lift
           + p['med'] * np.maximum(medl - fl, 0) * (0.35 + 0.65 * np.clip(Ts, 0, 1))
           + p['halo'] * np.maximum(halo - fl * 0.85, 0))
    toe = p['toe']
    sig = sig * (sig / (sig + toe))
    g = np.power(np.maximum(sig * p['exposure'], 0), p['gamma'])
    tm = g / (1 + g / p['shoulder'])
    ch = raw / lum[..., None]
    nat = np.stack([1 + (ch[..., 0] - 1) * 0.78,
                    1 + (ch[..., 1] - 1) * 0.58 + np.maximum(ch[..., 0] - 1, 0) * 0.16,
                    1 + (ch[..., 2] - 1) * 0.90], axis=-1)
    wb = smooth(np.clip((tm - p['warm_start']) / p['warm_span'], 0, 1))
    ww = np.clip(wb * 0.65 + bulge * smooth(np.clip(tm * 3.0, 0, 1)) * 0.60, 0, 1)[..., None]
    wm = smooth(np.clip((tm - 0.015) / 0.095, 0, 1))[..., None]
    tint = np.array(p['cool'], np.float32) * (1 - wm) + np.array(p['mid'], np.float32) * wm
    tint = tint * (1 - ww) + np.array(p['warm'], np.float32) * ww
    wd = (np.clip((0.60 - Ts) / 0.45, 0, 1) * band)[..., None] * 0.42
    tint = tint * (1 - wd) + np.array(p['dusk'], np.float32) * wd
    lin = np.array(p['bg'], np.float32) + tm[..., None] * tint * (0.52 + 0.48 * nat)
    return to_srgb(lin).astype(np.float32)


def dither8(s, rng):
    d = (rng.random(s.shape, dtype=np.float32) + rng.random(s.shape, dtype=np.float32) - 1) / 255
    return np.clip(np.rint(np.clip(s + d, 0, 1) * 255), 0, 255).astype(np.uint8)


def grade_stage(take, out_full, out_web, seed, full_w, web_w):
    p = TAKES[take]
    rot = np.load(f'{CACHE}/rot.npy', mmap_mode='r')
    raux = np.load(f'{CACHE}/raux.npy', mmap_mode='r')
    H, W = rot.shape[:2]
    assert W == full_w and H == full_w // 2
    full = np.empty((H, W, 3), np.float16)
    for y0 in range(0, H, STEP):
        y1 = min(H, y0 + STEP)
        full[y0:y1] = grade(np.array(rot[y0:y1]), np.array(raux[y0:y1]), p)
    rng = np.random.default_rng(seed)
    u8 = np.empty((H, W, 3), np.uint8)
    for y0 in range(0, H, STEP):
        y1 = min(H, y0 + STEP)
        u8[y0:y1] = dither8(full[y0:y1].astype(np.float32), rng)
    os.makedirs(os.path.dirname(out_full), exist_ok=True)
    Image.fromarray(u8).save(out_full, quality=95, subsampling=0, optimize=True)
    del u8
    gc.collect()
    if out_web:
        f32 = full.astype(np.float32)
        del full
        gc.collect()
        wpad = 8 * (W // web_w)
        small = cv2.resize(wrap_x(f32, wpad), (web_w + 16, web_w // 2), interpolation=cv2.INTER_AREA)[:, 8:-8]
        del f32
        rng = np.random.default_rng(seed + 1)
        os.makedirs(os.path.dirname(out_web), exist_ok=True)
        Image.fromarray(dither8(small, rng)).save(out_web, quality=95, subsampling=0, optimize=True)


def jpeg_subsampling(path):
    data = open(path, 'rb').read()
    i = 2
    while i < len(data):
        while data[i] == 0xFF:
            i += 1
        marker = data[i]
        i += 1
        if marker in (0xD8, 0xD9) or (0xD0 <= marker <= 0xD7):
            continue
        length = struct.unpack('>H', data[i:i + 2])[0]
        if marker in (0xC0, 0xC1, 0xC2):
            _, h, w, ncomp = struct.unpack('>BHHB', data[i + 2:i + 8])
            return w, h, [f"{data[i + 8 + 3 * k + 1] >> 4}x{data[i + 8 + 3 * k + 1] & 0xF}" for k in range(ncomp)]
        i += length
    return None


def sample_equirect(img_f, dx, dy, dz):
    H, W = img_f.shape[:2]
    u = np.mod(np.arctan2(dx, dz) / (2.0 * np.pi) + 0.5, 1.0)
    v = np.arcsin(np.clip(dy, -1.0, 1.0)) / np.pi + 0.5
    padded = wrap_x(img_f, 4)
    mx = (u * W - 0.5 + 4).astype(np.float32)
    my = np.clip((1.0 - v) * H - 0.5, 0.0, H - 1.0).astype(np.float32)
    return cv2.remap(padded, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def render_checks(full_path, web_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    assert jpeg_subsampling(full_path)[2] == ['1x1', '1x1', '1x1']
    assert jpeg_subsampling(web_path)[2] == ['1x1', '1x1', '1x1']
    im = np.array(Image.open(full_path))
    H, W, _ = im.shape
    Image.fromarray(cv2.resize(im, (1400, 700), interpolation=cv2.INTER_AREA)).save(
        f'{out_dir}/overview-1400.jpg', quality=94, subsampling=0)
    rolled = np.roll(im, W // 2, axis=1)
    Image.fromarray(cv2.resize(rolled, (1400, 700), interpolation=cv2.INTER_AREA)).save(
        f'{out_dir}/seam-rolled-overview.jpg', quality=94, subsampling=0)
    yc = int(np.clip(int(np.argmax(rolled[:, W // 2 - 4:W // 2 + 4].mean(axis=(1, 2)))) - 400, 0, H - 800))
    Image.fromarray(rolled[yc:yc + 800, W // 2 - 700:W // 2 + 700]).save(
        f'{out_dir}/seam-check.jpg', quality=94, subsampling=0)
    del rolled

    im_f = im.astype(np.float32)
    g = np.linspace(-1.0, 1.0, 1000, dtype=np.float32)
    gx, gz = np.meshgrid(g, g)
    theta = np.sqrt(gx * gx + gz * gz) * (np.pi / 3.0)
    phi = np.arctan2(gx, gz)
    for sign, name in ((1.0, 'pole-north.jpg'), (-1.0, 'pole-south.jpg')):
        cap = sample_equirect(im_f, np.sin(theta) * np.sin(phi), sign * np.cos(theta), np.sin(theta) * np.cos(phi))
        Image.fromarray(np.clip(np.rint(cap), 0, 255).astype(np.uint8)).save(f'{out_dir}/{name}', quality=94, subsampling=0)

    X, Y, N = frame()
    spots = {
        'crop-band-core.jpg': X,
        'crop-dust-lane.jpg': np.cos(np.deg2rad(42.0)) * X + np.sin(np.deg2rad(42.0)) * Y,
        'crop-dark-region.jpg': N,
    }
    for fname, vec in spots.items():
        cx = int((np.arctan2(vec[0], vec[2]) / (2 * np.pi) + 0.5) % 1.0 * W)
        cy = int((0.5 - np.arcsin(vec[1]) / np.pi) * H)
        x0, y0 = int(np.clip(cx - 700, 0, W - 1400)), int(np.clip(cy - 400, 0, H - 800))
        Image.fromarray(im[y0:y0 + 800, x0:x0 + 1400]).save(f'{out_dir}/{fname}', quality=95, subsampling=0)

    dirs = {
        'dir1-core': X + 0.08 * Y,
        'dir2-dust-arm': np.cos(np.deg2rad(52.0)) * X + np.sin(np.deg2rad(52.0)) * Y,
        'dir3-band-edge': np.cos(np.deg2rad(-35.0)) * X + np.sin(np.deg2rad(-35.0)) * Y + 0.28 * N,
    }
    for dname, dvec in dirs.items():
        fwd = np.array(dvec, dtype=np.float64)
        fwd /= np.linalg.norm(fwd)
        right = np.cross(fwd, [0.0, 1.0, 0.0] if abs(fwd[1]) < 0.95 else [0.0, 0.0, 1.0])
        right /= np.linalg.norm(right)
        up = np.cross(right, fwd)
        for fov in (20, 60):
            th = np.tan(np.deg2rad(fov) * 0.5)
            sx = ((np.arange(1920, dtype=np.float32) + 0.5) / 1920 * 2.0 - 1.0) * (1920 / 1080) * th
            sy = (1.0 - (np.arange(1080, dtype=np.float32) + 0.5) / 1080 * 2.0) * th
            SX, SY = np.meshgrid(sx, sy)
            rx = fwd[0] + SX * right[0] + SY * up[0]
            ry = fwd[1] + SX * right[1] + SY * up[1]
            rz = fwd[2] + SX * right[2] + SY * up[2]
            inv = 1.0 / np.sqrt(rx * rx + ry * ry + rz * rz)
            view = sample_equirect(im_f, rx * inv, ry * inv, rz * inv)
            Image.fromarray(np.clip(np.rint(view), 0, 255).astype(np.uint8)).save(
                f'{out_dir}/sim-{dname}-fov{fov}.jpg', quality=94, subsampling=0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--take', default='take-05-sculpted', choices=sorted(TAKES))
    ap.add_argument('--stage', default='all', choices=['all', 'clean', 'rotate', 'grade'])
    ap.add_argument('--out-full', default='public/assets/shared/full/sky.jpg')
    ap.add_argument('--out-web', default='public/assets/shared/web/sky.jpg')
    ap.add_argument('--checks', default='')
    a = ap.parse_args()
    cfg = json.load(open('config/showcase.json'))
    if not os.path.exists(SRC):
        raise SystemExit('missing ' + SRC + ', see ASSETS.md for source URL')
    if a.stage in ('all', 'clean'):
        clean_stage()
    if a.stage in ('all', 'rotate'):
        rotate_stage()
    if a.stage in ('all', 'grade'):
        grade_stage(a.take, a.out_full, a.out_web or None, cfg['seed'], cfg['assetSets']['full']['skyWidth'], cfg['assetSets']['web']['skyWidth'])
    if a.checks:
        render_checks(a.out_full, a.out_web, a.checks)


if __name__ == '__main__':
    main()
