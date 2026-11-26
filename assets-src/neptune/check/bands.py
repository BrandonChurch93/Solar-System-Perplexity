"""bands.py FILM APPROVED [ROW0 ROW1]: the detail measure G17 by scale. G17 itself (tools/measure/g17.py) reads one band, a difference of
Gaussians of 0.6 and 2.0 px, as the energy per tile of a 12 by 8 grid, film over approved, over the tiles the approved keeps. This
reads the same ratio in octave bands (0.6/1.2, 1.2/2.4, 2.4/4.8, 4.8/9.6, 9.6/19.2, 19.2/38.4 px), over the very tiles G17 keeps,
so one sees which sizes of structure the film lacks against the approved. ROW0 ROW1: only the tile rows ROW0 to ROW1 (0 is the top).
A measure only: it draws nothing and changes nothing G17 reads."""
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools', 'measure'))
import g17  # noqa: E402

BANDS = [(0.6, 2.0), (0.6, 1.2), (1.2, 2.4), (2.4, 4.8), (4.8, 9.6), (9.6, 19.2), (19.2, 38.4)]


def read(film, approved, row0=0, row1=7):
    fy = g17.luma(film)
    h, w = fy.shape
    ay = g17.luma(approved, (w, h))
    gx, gy = g17.DEFINITION['grid']
    at = g17.tiles(ay, g17.band(ay), gx, gy)
    en = np.array([t[3] for t in at])
    floor = max(2e-5, 0.05 * float(np.percentile(en, 90)))
    keep = [k for k, a in enumerate(at) if a[2] > g17.DEFINITION['tileMeanLumaFloor'] and a[3] > floor and row0 <= a[1] <= row1]
    out = []
    for lo, hi in BANDS:
        fb = cv2.GaussianBlur(fy, (0, 0), lo) - cv2.GaussianBlur(fy, (0, 0), hi)
        ab = cv2.GaussianBlur(ay, (0, 0), lo) - cv2.GaussianBlur(ay, (0, 0), hi)
        ft = g17.tiles(fy, fb, gx, gy)
        tt = g17.tiles(ay, ab, gx, gy)
        r = np.array([ft[k][3] / max(tt[k][3], 1e-12) for k in keep])
        fa = float(np.mean([np.sqrt(ft[k][3]) for k in keep])) * 255
        aa = float(np.mean([np.sqrt(tt[k][3]) for k in keep])) * 255
        out.append((lo, hi, float(np.median(r)), float(np.percentile(r, 25)), fa, aa))
    return len(keep), out


if __name__ == '__main__':
    film, approved = sys.argv[1], sys.argv[2]
    row0 = int(sys.argv[3]) if len(sys.argv) > 4 else 0
    row1 = int(sys.argv[4]) if len(sys.argv) > 4 else 7
    n, rows = read(film, approved, row0, row1)
    print('%s against %s, tile rows %d to %d, %d tiles kept' % (film, os.path.basename(approved), row0, row1, n))
    for lo, hi, med, p25, fa, aa in rows:
        tag = ' (the band of G17)' if (lo, hi) == (0.6, 2.0) else ''
        print('  %5.1f to %5.1f px: energy film over approved median %.3f, p25 %.3f | rms of the band in levels: film %.2f, approved %.2f%s' % (lo, hi, med, p25, fa, aa, tag))
