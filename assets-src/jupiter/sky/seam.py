import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

MARGIN = 0.125
ROWS = 16
SOFT = 24


def main(master, out, x_end):
    a = np.asarray(Image.open(master).convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    py = round(h * MARGIN / (1 + 2 * MARGIN))
    below = a[py + 1:py + 1 + ROWS].mean(0)
    above = a[py - ROWS:py].mean(0)
    gap = ndi.gaussian_filter1d(below - above, SOFT, axis=0, mode='nearest')
    cols = np.arange(w, dtype=np.float32)
    t = np.clip((x_end - cols) / (0.25 * x_end), 0, 1)
    gap *= (t * t * (3 - 2 * t))[:, None]
    d = np.clip((py - np.arange(py, dtype=np.float32)) / py, 0, 1)
    fall = (1 - d * d * (3 - 2 * d))[:, None, None]
    print('seam row', py, 'step by column, 8 bit', gap[::max(int(x_end) // 8, 1)].mean(1).round(1).tolist())
    a[:py] = np.clip(a[:py] + gap[None] * fall, 0, 255)
    Image.fromarray((a + 0.5).astype(np.uint8)).save(out, lossless=True, quality=90, method=6)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]))
