import sys
import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter

f32 = np.float32


def fract(a):
    return (a - np.floor(a)).astype(f32)


def hsh(px, py, s):
    k = f32(s) * f32(0.6180339)
    a = fract(px * f32(0.1031) + k)
    b = fract(py * f32(0.1030) + k)
    c = fract(px * f32(0.0973) + k)
    d = (a * (b + f32(33.33)) + b * (c + f32(33.33)) + c * (a + f32(33.33))).astype(f32)
    a, b, c = a + d, b + d, c + d
    return fract((a + b) * c)


def grain(frame, w, h):
    s = frame % 4096
    x = (np.arange(w, dtype=f32) + f32(0.5))[None, :].repeat(h, 0)
    y = (np.arange(h, dtype=f32) + f32(0.5))[::-1][:, None].repeat(w, 1)
    g = hsh(x, y, s) + hsh(x + f32(17), y + f32(17), s + 3) - 1
    d = hsh(x + f32(61), y + f32(61), s + 7) + hsh(x + f32(113), y + f32(113), s + 11) - 1
    return g * 2.5 + d


def corr(a, b):
    return float(np.corrcoef(a.ravel(), b.ravel())[0, 1])


def measure(frame, path):
    s = np.asarray(Image.open(path).convert('RGB')).astype(float)[..., 1]
    h, w = s.shape
    fine = s - uniform_filter(s, 5)
    g = grain(frame, w, h)
    dark = s < 16
    by, bx = h // 6, w // 8
    blocks = [corr(g[j * by:(j + 1) * by, i * bx:(i + 1) * bx], fine[j * by:(j + 1) * by, i * bx:(i + 1) * bx]) for j in range(6) for i in range(8)]
    blocks = [b for b in blocks if b == b]
    print('frame %s %s: dark sky %+.3f (share %.2f), whole %+.3f, blocks %+.3f to %+.3f' % (frame, path, corr(g[dark], fine[dark]) if dark.sum() > 5000 else float('nan'), dark.mean(), corr(g, fine), min(blocks), max(blocks)))


if len(sys.argv) < 3 or len(sys.argv) % 2 == 0:
    sys.exit('usage: graincorr.py FRAME NOGRAIN.png [FRAME NOGRAIN.png ...]')
for i in range(1, len(sys.argv), 2):
    measure(float(sys.argv[i]), sys.argv[i + 1])
