import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from deblock import deblock

Image.MAX_IMAGE_PIXELS = None
FULL = (2816, 1584)
MARGIN = 0.125
OWN = (1.28, 1.46)
RING = (1.5, 2.0)
HIDE = (0.55, 0.8, 1.2, 1.5)
REACH = 1.62


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    ca, cb, cc, cd, ce = 2.51, 0.03, 2.43, 0.59, 0.14
    kk = cd * y - cb
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (cc * y - ca) * ce * y, 0))) / (2 * (cc * y - ca))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(path, resample, blocks=False):
    img = Image.open(path).convert('RGB')
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], 'F').resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return unfilm(to_linear(a))


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def save(lin, name, out):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((py, py), (px, px), (0, 0)), mode='symmetric')
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (('full', 1), ('web', 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(f'{out}/{key}/{name}', lossless=True, quality=90, method=6)


def blank(out):
    save(np.zeros((FULL[1], FULL[0], 3), np.float32), 'sky-hold.webp', out)


def hold(hero, fill, glow, out):
    fit = json.load(open('assets-src/sun/fit.json'))
    c = fit['circle']
    k = FULL[0] / fit['imageSize'][0]
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]]
    d = np.hypot(xx - c['cx'] * k, yy - c['cy'] * k) / (c['r'] * k)
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC)
    f = scene(fill, Image.LANCZOS, True)
    sky = np.maximum(a - g, 0)
    own = ndi.gaussian_filter(step(d, OWN[0], OWN[1]), 3)
    lum = sky @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    red = ((sky[..., 0] - sky[..., 2]) / (sky[..., 0] + sky[..., 2] + 0.004) > 0.4) & (lum > 0.005) & (d < REACH) & (d > 1.0)
    lab, n = ndi.label(ndi.binary_dilation(red, iterations=1))
    big = np.zeros(n + 1, bool)
    big[1:] = ndi.sum(red, lab, np.arange(1, n + 1)) > 25
    stray = ndi.gaussian_filter(ndi.binary_dilation(big[lab], iterations=5).astype(np.float32), 2)
    print('stray share', float(stray.mean().round(5)))
    own = own * (1 - stray)
    ring = (d > RING[0]) & (d < RING[1])
    gain = np.array([np.median(sky[..., i][ring]) / max(np.median(f[..., i][ring]), 1e-6) for i in range(3)])
    print('fill gain', gain.round(3), 'own share', float(own.mean().round(3)))
    f = f * gain
    low = np.stack([ndi.gaussian_filter(np.minimum(f[..., i], ndi.gaussian_filter(f[..., i], 4)), 4) for i in range(3)], -1)
    seen = (1 - step(d, HIDE[0], HIDE[1]) + step(d, HIDE[2], HIDE[3]))[..., None]
    f = low + np.maximum(f - low, 0) * seen
    lin = sky * own[..., None] + f * (1 - own[..., None])
    save(lin, 'sky-hold.webp', out)
    Image.fromarray((to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8)).save('out/work/sun/sky-preview.jpg', quality=90)


if __name__ == '__main__':
    if sys.argv[1] == 'blank':
        blank(sys.argv[2])
    else:
        hold(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
