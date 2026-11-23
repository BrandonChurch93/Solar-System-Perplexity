"""Contrast of the ring plane by scale, film beside approved, as a guide for the ladder of ringlets.

Usage: python3 assets-src/saturn/code/band_energy.py FILM [APPROVED] [hold]

At each patch the direction across the ringlets is found from the picture itself (structure tensor). Profiles are
read across the ringlets and along them, each divided by its own mean, and their spectra are summed into bands of
wavelength in pixels. Printed per patch: the root mean square contrast in percent in each band, across (the
ringlets) and along (grain and sparkle), for luma and for two colour ratios (red over blue, green over the mean
of red and blue). Nothing here is shipped.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

PATCHES = {'A near left': (260, 930), 'A left': (120, 700), 'A far left': (190, 500), 'B near': (1100, 900), 'B far': (640, 470)}
HOLD = {'A left': (285, 505), 'B left': (480, 520), 'B near left': (700, 760), 'B near': (1000, 800), 'A near': (900, 905), 'B right': (1560, 540)}
BANDS = [(2, 4), (4, 8), (8, 16), (16, 32), (32, 64), (64, 128)]
LENGTH = 256
LINES = 24
STEP = 3


def load(path):
    im = np.asarray(Image.open(path).convert('RGB').resize((1920, 1080), Image.LANCZOS), dtype=np.float64) / 255
    return im


def across(luma, x, y):
    gx = ndimage.sobel(ndimage.gaussian_filter(luma, 1.5), axis=1)
    gy = ndimage.sobel(ndimage.gaussian_filter(luma, 1.5), axis=0)
    s = slice(max(y - 80, 0), y + 80), slice(max(x - 80, 0), x + 80)
    jxx, jxy, jyy = (gx[s] ** 2).mean(), (gx[s] * gy[s]).mean(), (gy[s] ** 2).mean()
    w, v = np.linalg.eigh(np.array([[jxx, jxy], [jxy, jyy]]))
    d = v[:, 1]
    return d / np.linalg.norm(d)


def profiles(chan, x, y, d, n):
    t = (np.arange(LENGTH) - LENGTH / 2)
    out = []
    for k in range(LINES):
        o = (k - LINES / 2) * STEP
        px = x + d[0] * t + n[0] * o
        py = y + d[1] * t + n[1] * o
        if px.min() < 1 or py.min() < 1 or px.max() > chan.shape[1] - 2 or py.max() > chan.shape[0] - 2:
            continue
        out.append(ndimage.map_coordinates(chan, [py, px], order=3, mode='nearest'))
    return np.array(out)


def bands(p):
    if len(p) == 0:
        return [float('nan')] * len(BANDS)
    p = p / p.mean(axis=1, keepdims=True) - 1
    win = np.hanning(LENGTH)
    spec = np.abs(np.fft.rfft(p * win, axis=1)) ** 2 / (win ** 2).sum() * 2 / LENGTH
    freq = np.fft.rfftfreq(LENGTH)
    power = spec.mean(axis=0)
    out = []
    for lo, hi in BANDS:
        m = (freq > 1 / hi) & (freq <= 1 / lo)
        out.append(100 * np.sqrt(power[m].sum()))
    return out


def measure(im, at, d):
    x, y = at
    n = np.array([-d[1], d[0]])
    luma = im @ np.array([0.2126, 0.7152, 0.0722])
    rb = (im[..., 0] + 0.02) / (im[..., 2] + 0.02)
    gm = (im[..., 1] + 0.02) / ((im[..., 0] + im[..., 2]) / 2 + 0.02)
    rows = {}
    for name, chan in (('luma', luma), ('red/blue', rb), ('green', gm)):
        rows[name + ' across'] = bands(profiles(chan, x, y, d, n))
    rows['luma along'] = bands(profiles(luma, x, y, n, d))
    mean = im[max(y - 60, 0):y + 60, max(x - 60, 0):x + 60].reshape(-1, 3).mean(axis=0)
    return rows, mean


def main():
    args = [a for a in sys.argv[1:] if a != 'hold']
    film = load(args[0])
    ap = load(args[1]) if len(args) > 1 else None
    print('bands of wavelength in px: ' + ' '.join('%d-%d' % b for b in BANDS))
    for name, at in (HOLD if 'hold' in sys.argv else PATCHES).items():
        d = across(film @ np.array([0.2126, 0.7152, 0.0722]), *at)
        rf, mf = measure(film, at, d)
        print('%s at %s, across (%.2f, %.2f); film mean rgb %s' % (name, at, d[0], d[1], ' '.join('%.3f' % v for v in mf)))
        if ap is not None:
            da = across(ap @ np.array([0.2126, 0.7152, 0.0722]), *at)
            ra, ma = measure(ap, at, da)
            print('    approved mean rgb %s' % ' '.join('%.3f' % v for v in ma))
        for key in rf:
            line = '  %-16s film ' % key + ' '.join('%5.2f' % v for v in rf[key])
            if ap is not None:
                line += '   approved ' + ' '.join('%5.2f' % v for v in ra[key]) + '   ratio ' + ' '.join('%4.2f' % (a / max(b, 1e-6)) for a, b in zip(rf[key], ra[key]))
            print(line)


main()
