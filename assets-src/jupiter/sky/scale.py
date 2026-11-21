import sys
import numpy as np
from PIL import Image

FILM = 1920
HERO = 2816


def linear(a):
    a = a / 255.0
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def display(a):
    a = np.clip(a, 0, 1)
    return 255.0 * np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def restore(a, gain, knee):
    if gain <= 0:
        return a
    h, w, _ = a.shape
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.rfftfreq(w)[None, :]
    f = np.minimum(np.hypot(fx, fy), 0.5)
    g = 1 + gain * np.clip((f - knee) / (0.5 - knee), 0, 1) ** 1.5
    lin = linear(a)
    out = np.stack([np.fft.irfft2(np.fft.rfft2(lin[..., c]) * g, s=(h, w)) for c in range(3)], axis=-1)
    return display(out)


def main(master, name, out, gain, knee):
    img = Image.open(master).convert('RGB')
    w, h = img.size
    size = (round(w * FILM / HERO), round(h * FILM / HERO))
    small = img.resize(size, Image.LANCZOS)
    a = restore(np.asarray(small).astype(np.float64), gain, knee)
    Image.fromarray((a + 0.5).astype(np.uint8)).save(f'{out}/full/{name}', lossless=True, quality=90, method=6)
    print(name, 'full', size, 'gain', gain, 'knee', knee)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.0, float(sys.argv[5]) if len(sys.argv) > 5 else 0.2)
