import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import gnomon
import geo

WIDTHS = [96, 64, 40, 26, 16, 10]
SIZE = 4096
TAKES = [(24, 'patch24-t1.png'), (12, 'patch12-t1.png')]
LOW = 1 / 48
MARGIN = 0.04
WHITE = 0.93
DECK = 0.04
EDGE = 0.45
STRETCH = 6.0
FLOOR = 0.8
FEATHER = 0.08


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(img, sigma):
    return cv2.GaussianBlur(img, (0, 0), sigmaX=sigma, sigmaY=sigma, borderType=cv2.BORDER_REFLECT_101)


def separate(take, ref):
    n = take.shape[0]
    guide = gnomon.composite(ref)
    sig = n * LOW
    lin = lambda v: geo.srgb_to_linear(v).astype(np.float32)
    gain = (blur(lin(guide), sig) + 0.02) / (blur(lin(take), sig) + 0.02)
    img = geo.linear_to_srgb(np.clip(lin(take) * gain, 0, 1)).astype(np.float32)
    r0 = blur(ref[..., 0], n / 400)
    raw = np.clip((img[..., 0] - r0 - MARGIN) / (WHITE - r0), 0, 1).astype(np.float32)
    alpha = np.clip(raw + blur(ref[..., 3] - raw, sig), 0, 1)
    alpha = np.where(raw > 0.9, np.maximum(alpha, raw), alpha).astype(np.float32)
    wgt = (1 - smoothstep(0.05, 0.3, alpha)).astype(np.float32)
    deck = np.clip((img - alpha[..., None]) / np.maximum(1 - alpha[..., None], 0.3), 0, 1)
    base = ref[..., :3]
    for c in (0, 1):
        deck[..., c] = np.minimum(deck[..., c], deck[..., 2] * (base[..., c] + 0.01) / (base[..., 2] + 0.01) * 1.3)
    den = np.maximum(blur(wgt, sig), 1e-3)[..., None]
    low = blur(lin(deck) * wgt[..., None], sig) / den
    want = blur(lin(base) * wgt[..., None], sig) / den
    deck = geo.linear_to_srgb(np.clip(lin(deck) * (want + 0.003) / (low + 0.003), 0, 1)).astype(np.float32)
    deck = deck * wgt[..., None] + base * (1 - wgt[..., None])
    return np.dstack([deck, alpha]).astype(np.float32), img


def place(layers, wd, width, size):
    n = layers.shape[0]
    s = (size / gnomon.half(width)) / (n / gnomon.half(wd))
    src = layers
    if s < 1:
        m = int(round(n * s))
        src = cv2.resize(layers, (m, m), interpolation=cv2.INTER_AREA)
        s = n * s / m
        n = m
    M = np.array([[s, 0, s * (0.5 - n / 2) + size / 2 - 0.5], [0, s, s * (0.5 - n / 2) + size / 2 - 0.5]], np.float32)
    out = cv2.warpAffine(src, M, (size, size), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    g = np.abs(((np.arange(size) + 0.5) / size - 0.5) * gnomon.half(width) / gnomon.half(wd))
    r = np.maximum(g[None, :], g[:, None])
    return np.clip(out, 0, 1), smoothstep(0.5, 0.5 - FEATHER, r).astype(np.float32)


def scene(wrap, details, width, size):
    img = gnomon.resample(wrap, width, size)
    masks = []
    for wd, layers in details:
        part, w = place(layers, wd, width, size)
        img = img * (1 - w[..., None]) + part * w[..., None]
        masks.append(w)
    return img, masks


def octave(rng, sigma):
    n = rng.standard_normal((SIZE, SIZE)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), sigmaX=sigma * STRETCH, sigmaY=sigma, borderType=cv2.BORDER_REFLECT_101)
    return n / n.std()


def save(rgba, name, preview):
    out = (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    im.save(os.path.join(gnomon.OUT, 'full', name), quality=92, method=4, exact=True)
    im.resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(os.path.join(gnomon.OUT, 'web', name), quality=88, method=4, exact=True)
    comp = (gnomon.composite(np.clip(rgba, 0, 1)) * 255).astype(np.uint8)
    c0 = SIZE // 2 - 256
    row = np.concatenate([cv2.resize(comp, (512, 512), interpolation=cv2.INTER_AREA), comp[c0:c0 + 512, c0:c0 + 512], cv2.resize(out[..., :3], (512, 512), interpolation=cv2.INTER_AREA), np.repeat(cv2.resize(out[..., 3], (512, 512), interpolation=cv2.INTER_AREA)[..., None], 3, 2)], 1)
    Image.fromarray(row).save(os.path.join(gnomon.WORK, preview), quality=88)


os.makedirs(gnomon.WORK, exist_ok=True)
wrap = gnomon.load_wrap()
native = 2 * np.pi / (wrap.shape[1] - 2 * gnomon.PAD)
details = []
for wd, name in TAKES:
    path = os.path.join(gnomon.WORK, name)
    if not os.path.exists(path):
        ref, _ = scene(wrap, details, wd, 2048)
        Image.fromarray((np.clip(gnomon.composite(ref), 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(gnomon.WORK, 'guide-%d.png' % wd))
        print('no take', name, 'guide written')
        continue
    take = np.asarray(Image.open(path).convert('RGB'), np.float32) / 255
    ref, _ = scene(wrap, details, wd, take.shape[0])
    layers, matched = separate(take, ref)
    details.append((wd, layers))
    back = gnomon.composite(layers)
    err = np.abs(back - matched) * 255
    print(name, 'recomposite error mean %.2f p99 %.1f' % (err.mean(), np.percentile(err, 99)), 'alpha mean %.3f ref %.3f' % (layers[..., 3].mean(), ref[..., 3].mean()), flush=True)
    Image.fromarray((np.concatenate([gnomon.composite(ref), matched, back, layers[..., :3]], 1)[::2, ::2] * 255).astype(np.uint8)).save(os.path.join(gnomon.WORK, 'separate-%d.jpg' % wd), quality=88)

rng = np.random.default_rng(7)
octs = []
last = None
levels = []
for width in WIDTHS:
    h = gnomon.half(width)
    texel = 2 * h / SIZE
    img, masks = scene(wrap, details, width, SIZE)
    if last is not None:
        zoom = last / h
        a = int(round(SIZE * (1 - 1 / zoom) / 2))
        octs = [(s * zoom, cv2.resize(o[a:SIZE - a, a:SIZE - a], (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)) for s, o in octs]
    finest = min([s for s, o in octs], default=native / texel / 2)
    while finest / 2 >= FLOOR:
        finest /= 2
        octs.append((finest, octave(rng, finest)))
    last = h
    limits = [native / texel / 2] + [(2 * gnomon.half(wd) / layers.shape[0]) / texel / 2 for wd, layers in details]
    share = [np.ones((SIZE, SIZE), np.float32)]
    for w in masks:
        share = [s * (1 - w) for s in share] + [w]
    grain = np.zeros((SIZE, SIZE), np.float32)
    for s, o in octs:
        wsum = sum(sh for sh, lim in zip(share, limits) if s < lim * 1.01)
        if not np.isscalar(wsum):
            grain += o * wsum
    grain = np.clip(grain, -3, 3)
    lin = geo.srgb_to_linear(img[..., :3]) * (1 + DECK * grain)[..., None]
    al = img[..., 3]
    al = np.clip(al + EDGE * grain * al * (1 - al), 0, 1)
    name = 'patch-%d.webp' % width
    save(np.dstack([geo.linear_to_srgb(np.clip(lin, 0, 1)), al]), name, 'patch-%d.jpg' % width)
    levels.append({'file': name, 'widthDeg': width})
    print(name, 'texel %.6f R' % texel, 'source limits px', [round(float(v), 2) for v in limits], 'octaves', [round(float(s), 2) for s, o in octs], round(os.path.getsize(os.path.join(gnomon.OUT, 'full', name)) / 1e6, 2), 'MB', flush=True)
lon0, lat0 = gnomon.spot()
json.dump({'spot': {'lon': round(float(np.degrees(lon0)), 4), 'lat': round(float(np.degrees(lat0)), 4)}, 'levels': levels, 'feather': 0.12, 'fade': [1.1, 1.6]}, open('src/stops/neptune/patches.json', 'w'), indent=1)
