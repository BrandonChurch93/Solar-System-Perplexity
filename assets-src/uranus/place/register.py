import json
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)


def shift(a, b):
    fa = np.fft.rfft2(a - a.mean())
    fb = np.fft.rfft2(b - b.mean())
    r = fa * np.conj(fb)
    c = np.fft.irfft2(r / np.maximum(np.abs(r), 1e-6), a.shape)
    y, x = np.unravel_index(np.argmax(c), c.shape)
    h, w = a.shape
    return (x if x < w / 2 else x - w), (y if y < h / 2 else y - h), float(c.max())


def main(globe, close, mask_g, mask_c):
    a = load(globe)
    b = load(close)
    m = (load(mask_g).sum(-1) > 30) & (load(mask_c).sum(-1) > 30)
    d = np.abs(a - b)
    h, w, _ = a.shape
    inner = m.copy()
    inner[:-12] &= m[12:] & np.roll(m, 12, 0)[:-12]
    lum = lambda x: gaussian_filter(x @ np.array([0.2126, 0.7152, 0.0722], np.float32), 1.0) - gaussian_filter(x @ np.array([0.2126, 0.7152, 0.0722], np.float32), 12.0)
    la, lb = lum(a), lum(b)
    tiles = []
    for ty in range(0, h - 255, 128):
        for tx in range(0, w - 255, 128):
            if inner[ty:ty + 256, tx:tx + 256].mean() > 0.98 and la[ty:ty + 256, tx:tx + 256].std() > 1.0:
                dx, dy, peak = shift(lb[ty:ty + 256, tx:tx + 256], la[ty:ty + 256, tx:tx + 256])
                tiles.append({'x': tx + 128, 'y': ty + 128, 'dx': int(dx), 'dy': int(dy), 'peak': round(peak, 3)})
    good = [t for t in tiles if t['peak'] > 0.08]
    out = {
        'groundPixels': int(inner.sum()),
        'meanAbs': float(d[inner].mean()), 'p99Abs': float(np.percentile(d[inner].max(-1), 99)),
        'meanGlobe': a[inner].mean(0).round(1).tolist(), 'meanClose': b[inner].mean(0).round(1).tolist(),
        'tiles': len(tiles), 'matched': len(good),
        'shiftPx': {'meanDx': float(np.mean([t['dx'] for t in good])) if good else None, 'meanDy': float(np.mean([t['dy'] for t in good])) if good else None, 'largest': float(max([np.hypot(t['dx'], t['dy']) for t in good])) if good else None},
        'detail': {'globe': float(la[inner].std()), 'close': float(lb[inner].std())},
    }
    print(json.dumps(out))
    if len(sys.argv) > 5:
        json.dump({**out, 'each': tiles}, open(sys.argv[5], 'w'), indent=1)


main(*sys.argv[1:5])
