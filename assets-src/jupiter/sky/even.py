import sys
import numpy as np
from PIL import Image


def linear(a):
    a = a / 255.0
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def display(a):
    a = np.clip(a, 0, 1)
    return 255.0 * np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def tap(f, factor):
    return np.sinc(f) ** 2 / np.sinc(f / factor) ** 2


def main(source, target, factor, quality):
    lin = linear(np.asarray(Image.open(source).convert('RGB')).astype(np.float64))
    h, w, _ = lin.shape
    gain = tap(np.fft.fftfreq(h)[:, None], factor) * tap(np.fft.rfftfreq(w)[None, :], factor)
    out = []
    for c in range(3):
        even = np.fft.irfft2(np.fft.rfft2(lin[..., c]) * gain, s=(h, w)).astype(np.float32)
        out.append(np.asarray(Image.fromarray(even, 'F').resize((w * factor, h * factor), Image.LANCZOS)))
    Image.fromarray((display(np.stack(out, axis=-1)) + 0.5).astype(np.uint8)).save(target, lossless=quality >= 101, quality=min(quality, 100), method=6)
    print(target, w * factor, h * factor, 'factor', factor, 'quality', quality)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
