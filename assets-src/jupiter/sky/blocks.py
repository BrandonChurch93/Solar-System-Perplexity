import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
DARK = 40


def ratio(levels, axis, period):
    lum = levels.max(axis=2)
    low = lum < DARK
    red = levels[..., 0] - levels[..., 1]
    blue = levels[..., 2] - levels[..., 1]
    step = np.abs(np.diff(red, axis=axis)) + np.abs(np.diff(blue, axis=axis))
    if axis == 1:
        dark = low[:, 1:] & low[:, :-1]
        border = np.broadcast_to(np.arange(1, levels.shape[1])[None, :] % period == 0, dark.shape)
    else:
        dark = low[1:, :] & low[:-1, :]
        border = np.broadcast_to(np.arange(1, levels.shape[0])[:, None] % period == 0, dark.shape)
    return float(step[dark & border].mean() / step[dark & ~border].mean())


def main(paths):
    for path in paths:
        levels = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
        kind = open(path, 'rb').read(16)[12:16].decode('ascii', 'replace').strip()
        parts = ['period %d: columns %.3f rows %.3f' % (period, ratio(levels, 1, period), ratio(levels, 0, period)) for period in (8, 16)]
        print(path, kind, '%d x %d' % (levels.shape[1], levels.shape[0]), '; '.join(parts))


if __name__ == '__main__':
    main(sys.argv[1:])
