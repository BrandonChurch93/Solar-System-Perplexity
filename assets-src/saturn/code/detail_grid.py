"""Fine detail of a film still beside the approved image, tile by tile, as the sharpness gate counts it.

Prints three 12 by 8 grids: the approved band energy as contrast (root of energy over mean luma, in percent),
the film's, and the ratio of the energies. Usage: detail_grid.py FILM.png [APPROVED]
"""
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'measure'))
import g17  # noqa: E402


def main():
    film = sys.argv[1]
    approved = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'references', 'approved', 'saturn-close.jpg')
    fy = g17.luma(film)
    h, w = fy.shape
    ay = g17.luma(approved, (w, h))
    gx, gy = g17.DEFINITION['grid']
    ft = g17.tiles(fy, g17.band(fy), gx, gy)
    at = g17.tiles(ay, g17.band(ay), gx, gy)
    floor = max(2e-5, 0.05 * float(np.percentile([t[3] for t in at], 90)))
    print('energy floor %.2e' % floor)
    for name, rows in (('approved contrast percent (luma)', at), ('film contrast percent (luma)', ft)):
        print(name)
        for j in range(gy):
            print(' '.join('%5.1f(%2.0f)' % (100 * np.sqrt(rows[j * gx + i][3]) / max(rows[j * gx + i][2], 1e-3), 100 * rows[j * gx + i][2]) for i in range(gx)))
    print('ratio of energies (dot: tile not used)')
    ratios = []
    for j in range(gy):
        line = []
        for i in range(gx):
            a = at[j * gx + i]
            f = ft[j * gx + i]
            if a[2] > 0.04 and a[3] > floor:
                ratios.append(f[3] / a[3])
                line.append('%6.2f' % (f[3] / a[3]))
            else:
                line.append('     .')
        print(' '.join(line))
    print('median %.3f p25 %.3f over %d tiles' % (np.median(ratios), np.percentile(ratios, 25), len(ratios)))


main()
