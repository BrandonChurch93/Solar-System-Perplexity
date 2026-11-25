import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import flow

ROOT = os.path.join(HERE, '..', '..', '..')
STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
FULL = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'full')
WEB = os.path.join(ROOT, 'public', 'assets', 'jupiter', 'web')


def follow(fl, cfg, cols, rows, ages):
    reach = cfg['reachUnits']
    r0 = reach * ((np.arange(rows) + 0.5) / rows) ** 2
    a0 = -np.pi + (np.arange(cols) + 0.5) * 2 * np.pi / cols
    rr, aa = np.meshgrid(r0, a0, indexing='ij')
    x = fl.centre[0] + rr * np.cos(aa)
    y = fl.centre[1] + rr * np.sin(aa)
    turned = np.zeros_like(rr)
    out = []
    done = 0.0
    for age in ages:
        n = max(int(round((age - done) / cfg['stepSeconds'])), 1)
        h = (age - done) / n
        for _ in range(n):
            px, py = x - fl.centre[0], y - fl.centre[1]
            x, y = fl.back(x, y, h, h)
            qx, qy = x - fl.centre[0], y - fl.centre[1]
            turned += np.arctan2(px * qy - py * qx, px * qx + py * qy)
        done = age
        out.append((np.hypot(x - fl.centre[0], y - fl.centre[1]) - rr, turned.copy(), x.copy(), y.copy()))
    return rr, aa, out


def main():
    deck, place = flow.load()
    fl = flow.Flow(deck, place)
    cfg = deck['life']['flow']['wound']
    ages = [np.radians(t) / fl.peak for t in cfg['turnDeg']]
    ranges = None
    for folder, key in ((FULL, 'full'), (WEB, 'web')):
        cols, rows = cfg['pixels'][key]
        rr, aa, out = follow(fl, cfg, cols, rows, ages)
        if ranges is None:
            ranges = []
            for dr, da, _, _ in out:
                pad = 0.01
                ranges.append([float(dr.min() - pad), float(dr.max() + pad), float(da.min() - pad), float(da.max() + pad)])
        blocks = []
        for (dr, da, x, y), rg, age in zip(out, ranges, ages):
            blocks.append(np.round(np.clip((dr - rg[0]) / (rg[1] - rg[0]), 0, 1) * 65535).astype(np.uint16))
            blocks.append(np.round(np.clip((da - rg[2]) / (rg[3] - rg[2]), 0, 1) * 65535).astype(np.uint16))
            if key == 'full':
                x0 = fl.centre[0] + rr * np.cos(aa)
                y0 = fl.centre[1] + rr * np.sin(aa)
                eta = (x0 - fl.centre[0]) * fl.north[0] + (y0 - fl.centre[1]) * fl.north[1]
                cx = x0 - age * fl.jets(eta) * fl.east[0]
                cy = y0 - age * fl.jets(eta) * fl.east[1]
                band = (rr >= cfg['closedUnits'][0]) & (rr <= cfg['closedUnits'][1])
                print('age', round(age, 1), 's: change of distance', round(rg[0], 3), 'to', round(rg[1], 3), 'units, turn', round(float(np.degrees(rg[2])), 1), 'to', round(float(np.degrees(rg[3])), 1), 'degrees; off the closed form between closedUnits at most', float(np.hypot(x - cx, y - cy)[band].max()))
        np.concatenate(blocks, 0).tofile(os.path.join(folder, 'deck-wound.bin'))
    json.dump({'note': 'Written by assets-src/jupiter/deck/wound.py. ranges: per age of deck.json life.flow.wound.turnDeg, the least and greatest change of distance in units and of the angle in radians that the 16 bit codes of deck-wound.bin span.', 'ranges': ranges}, open(os.path.join(STOP, 'wound.json'), 'w'), indent=2)
    open(os.path.join(STOP, 'wound.json'), 'a').write('\n')


main()
