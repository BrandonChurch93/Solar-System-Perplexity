import os
import sys

import jpeglib
import numpy as np
from scipy.ndimage import map_coordinates
from scipy.special import erfinv

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import globe as G
import upward as U

REACH = 6
SHARE = 0.02
LOW = 10


def luma(rgb):
    return (rgb.astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32))


def spread(l, mask):
    gy, gx = np.gradient(l)
    g = np.hypot(gx, gy)
    floor = np.quantile(g[mask], 1 - SHARE)
    ii, jj = np.nonzero(mask & (g >= floor))
    ux, uy = gx[ii, jj] / g[ii, jj], gy[ii, jj] / g[ii, jj]
    steps = np.arange(-REACH, REACH + 1, dtype=np.float32)
    x = (jj[:, None] + ux[:, None] * steps[None]).astype(np.float32)
    y = (ii[:, None] + uy[:, None] * steps[None]).astype(np.float32)
    prof = map_coordinates(l, [y, x], order=1, mode='nearest')
    gp = map_coordinates(g, [y, x], order=1, mode='nearest')
    crest = gp.argmax(1) == REACH
    keep = crest & np.all(np.diff(prof, axis=1) >= 0, axis=1)
    height = prof[keep, -1] - prof[keep, 0]
    q = np.clip(g[ii, jj][keep] / np.maximum(height, 1e-6), 1e-4, 0.4999)
    sigma = 1 / (np.sqrt(2) * erfinv(2 * q))
    return float(np.percentile(sigma, LOW)), float(np.median(sigma)), int(keep.sum()), float(np.median(height))


if __name__ == '__main__':
    src = os.path.join(G.ROOT, 'public', 'assets', 'jupiter', sys.argv[1] if len(sys.argv) > 1 else 'full')
    levels = [('wrap-color.jpg', U.wrap_directions)] + [(l['file'], U.patch_directions(l)) for l in G.PATCHES['levels']]
    for name, directions in levels:
        im = jpeglib.read_spatial(U.before(os.path.join(src, name))).spatial
        h, w = im.shape[:2]
        o, box = directions(h, w)
        X, Y, front, error = U.chart(o)
        texel = U.texel_at(X, Y)
        n = X.shape[0]
        i0, i1, j0, j1 = max(box[0] - 5 * n, 0), min(box[0] + 6 * n, h), max(box[1] - 5 * n, 0), min(box[1] + 6 * n, w)
        l = luma(im[i0:i1, j0:j1])
        mask = np.ones(l.shape, bool)
        mask[:REACH + 1] = mask[-REACH - 1:] = False
        mask[:, :REACH + 1] = mask[:, -REACH - 1:] = False
        low, mid, count, height = spread(l, mask)
        print('%-16s texel %.4f units, window %d x %d texels: point spread %.2f texels = %.3f units (sharpest tenth of %d edges; median %.2f texels, median step %.1f levels)' % (name, texel, j1 - j0, i1 - i0, low, low * texel, count, mid, height))
