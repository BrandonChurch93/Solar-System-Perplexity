import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

Image.MAX_IMAGE_PIXELS = None
OUT = 'out/work/u/wrap/'
AXIS = np.array([0.3735, 0.8084, -0.4549])
SUN = np.array([-0.54361, 0.79538, 0.26806])
LUMA = np.array([0.2126, 0.7152, 0.0722])
NORM = 0.45
BINS = 512
KNOTS = 513


def body_rotation():
    y = AXIS / np.linalg.norm(AXIS)
    z = geo.CAM - (geo.CAM @ y) * y
    z /= np.linalg.norm(z)
    x = np.cross(y, z)
    return np.stack([x, y, z], 1)


def main():
    im8 = np.asarray(Image.open('out/work/u/hero-2x.png').convert('RGB'))
    im = im8.astype(np.float32) / 255
    h, w = im.shape[:2]
    lin = geo.scene(im).astype(np.float32)
    d = geo.rays(w, h)
    p, hit, b = geo.sphere(d)
    mu = -(p * d).sum(-1)
    sun = SUN / np.linalg.norm(SUN)
    ndl = p @ sun
    rot = body_rotation()
    x0, x1, y0, y1 = 1820, 4040, 620, 2820
    crop = im8[y0:y1, x0:x1]
    hitc = hit[y0:y1, x0:x1]
    muc = mu[y0:y1, x0:x1]
    red = crop[..., 0]
    med = cv2.medianBlur(red, 201)
    white = 250.0
    alpha0 = np.clip((red.astype(np.float32) - med) / np.maximum(white - med, 20), 0, 1)
    seed = hitc & (alpha0 > 0.16) & (muc > 0.3) & (crop[..., 1] > 120)
    seed = ndi.binary_opening(seed, iterations=1)
    lab, n = ndi.label(seed)
    sizes = ndi.sum(seed, lab, range(1, n + 1))
    seed = np.isin(lab, 1 + np.flatnonzero(sizes >= 24))
    cloud = ndi.binary_dilation(seed, iterations=7)
    lumac = crop.astype(np.float32) @ LUMA
    medl = cv2.medianBlur(np.clip(lumac, 0, 255).astype(np.uint8), 201).astype(np.float32)
    near = ndi.binary_dilation(seed, iterations=44)
    dark = near & ~cloud & hitc & (lumac < medl * 0.9 - 2) & (muc > 0.3)
    dark = ndi.binary_opening(dark, iterations=2)
    dark = ndi.binary_dilation(dark, iterations=6) & ~cloud
    mask = (cloud | dark).astype(np.uint8) * 255
    base8 = cv2.inpaint(crop, mask, 9, cv2.INPAINT_TELEA)
    soft = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 2.5)
    base_c = geo.scene(base8.astype(np.float32) / 255).astype(np.float32)
    lin_c = lin[y0:y1, x0:x1]
    base_c = lin_c + (base_c - lin_c) * np.clip(soft * 1.6, 0, 1)[..., None]
    wl = geo.scene(np.array([white / 255] * 3))[0]
    a = np.clip((lin_c[..., 0] - base_c[..., 0]) / np.maximum(wl - base_c[..., 0], 0.05), 0, 1)
    a = np.where(cloud, a, 0) * np.clip(soft * 1.6, 0, 1)
    bl = base_c @ LUMA
    s = np.clip(1 - (lin_c @ LUMA) / np.maximum(bl, 1e-4), 0, 1)
    s = np.where(dark, s, 0)
    tint = []
    sm = s > 0.15
    for c in range(3):
        tint.append(float(np.median(1 - lin_c[..., c][sm] / np.maximum(base_c[..., c][sm], 1e-4)) / np.median(s[sm])))
    base = lin.copy()
    base[y0:y1, x0:x1] = base_c
    alpha = np.zeros((h, w), np.float32)
    alpha[y0:y1, x0:x1] = a
    shadow = np.zeros((h, w), np.float32)
    shadow[y0:y1, x0:x1] = s
    ok = hit & (mu > 0.35)
    edges = np.linspace(-1, 1, BINS + 1)
    centers = 0.5 * (edges[1:] + edges[:-1])
    idx = np.clip(np.digitize(ndl, edges) - 1, 0, BINS - 1)
    curve = np.full((BINS, 3), np.nan)
    order = np.argsort(idx[ok], kind='stable')
    vals = base[ok][order]
    counts = np.bincount(idx[ok], minlength=BINS)
    starts = np.concatenate([[0], np.cumsum(counts)])
    for i in range(BINS):
        if counts[i] > 800:
            curve[i] = np.median(vals[starts[i]:starts[i + 1]], 0)
    have = ~np.isnan(curve[:, 0])
    first, last = np.flatnonzero(have)[[0, -1]]
    for c in range(3):
        curve[:, c] = np.interp(centers, centers[have], curve[have, c])
    curve = np.exp(ndi.gaussian_filter1d(np.log(np.maximum(curve, 1e-4)), 1.5, axis=0, mode='nearest'))
    knots = np.linspace(-1, 1, KNOTS)
    out = np.stack([np.interp(knots, centers, curve[:, c]) for c in range(3)], 1) / NORM
    json.dump({'knots': KNOTS, 'norm': NORM, 'range': [float(centers[first]), float(centers[last])], 'white': float(wl), 'shadowTint': tint, 'sun': sun.tolist(), 'axis': (AXIS / np.linalg.norm(AXIS)).tolist(), 'quaternion': [float(v) for v in geo.matrix_quat(rot)], 'curve': out.round(5).tolist()}, open(OUT + 'curve.json', 'w'), indent=1)
    np.save(OUT + 'base.npy', base)
    np.save(OUT + 'alpha.npy', alpha)
    np.save(OUT + 'shadow.npy', shadow)
    np.save(OUT + 'rot.npy', rot)
    light = np.stack([np.interp(ndl, knots, out[:, c]) for c in range(3)], -1).astype(np.float32)
    ratio = geo.display(np.clip((base + 0.004 * NORM) / (light + 0.004), 0, 4))
    ratio[~hit] = 0
    Image.fromarray((ratio * 255).astype(np.uint8)).crop((1820, 620, 4040, 2820)).resize((1110, 1100), Image.LANCZOS).save(OUT + 'albedo.jpg', quality=92)
    view = np.concatenate([crop, (geo.display(base_c) * 255).astype(np.uint8), np.stack([(a * 255).astype(np.uint8), (s * 255).astype(np.uint8), np.zeros_like(red)], -1)], 1)
    Image.fromarray(view).resize((view.shape[1] // 3, view.shape[0] // 3), Image.LANCZOS).save(OUT + 'separate.jpg', quality=90)
    print('clouds', int((sizes >= 24).sum()), 'cloud px', int(cloud.sum()), 'shadow px', int(dark.sum()), 'tint', np.round(tint, 3), 'white', wl)
    print('curve range', centers[first], centers[last])
    for k in range(0, KNOTS, KNOTS // 16):
        print(round(knots[k], 3), out[k].round(4))


main()
