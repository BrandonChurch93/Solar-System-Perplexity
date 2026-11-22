# usage: dustpix.py ROWS.json A.png A-none.png B.png B-none.png   checks the motes that dustpix.ts predicts for frames N and N+1 against the pixels
import json, sys
import numpy as np
from PIL import Image

def lum(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float64).mean(2) / 255

d = json.load(open(sys.argv[1]))
A = np.abs(lum(sys.argv[2]) - lum(sys.argv[3]))
B = np.abs(lum(sys.argv[4]) - lum(sys.argv[5]))

def at(im, x, y, r=3):
    x = int(round(x)); y = int(round(y))
    return im[max(y - r, 0):y + r + 1, max(x - r, 0):x + r + 1].max()

floor = max(np.percentile(A, 99.0), 1 / 255)
hit = 0; n = 0; out = 0
for r in d['rows']:
    if abs(r['bx'] - r['ax']) + abs(r['by'] - r['ay']) < 8: continue
    n += 1
    a_here, a_there = at(A, r['ax'], r['ay']), at(A, r['bx'], r['by'])
    b_here, b_there = at(B, r['bx'], r['by']), at(B, r['ax'], r['ay'])
    ok = a_here > floor and b_here > floor and a_here > a_there and b_here > b_there
    hit += ok
    out += r['out'] > 0
    print('mote %5d frame N at %4d,%4d: %.3f (at its N+1 place %.3f); frame N+1 at %4d,%4d: %.3f (at its N place %.3f); moved against the sky by %+.1f,%+.1f px, %+.1f px away from the point of flight %s' % (r['i'], r['ax'], r['ay'], a_here, a_there, r['bx'], r['by'], b_here, b_there, r['par'][0], r['par'][1], r['out'], 'ok' if ok else 'MISS'))
print('frame %d: point of flight at %.0f,%.0f px; %d of %d predicted motes found in both frames at the predicted places; %d of %d move away from the point of flight; dust floor %.4f' % (d['frame'], d['foe']['x'], d['foe']['y'], hit, n, out, n, floor))
