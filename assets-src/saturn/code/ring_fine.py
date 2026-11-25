"""ring_fine.py FILM OUT.json [CAP]: the ringlets' amplitude by radius against the approved close image.

FILM is frame 3720 of the film at the final tier (1920 by 1080), drawn with the table that
src/stops/saturn/skim.json light.grade.radial.fine.gain holds now. The amplitude is its own term of the one law
by radius, apart from the level (the level is light.grade.radial.gain, ring_tone.py): the light of a pixel over
the light of its zone, to the power the table holds (grade.ts iceFine and iceRinglets).

What is measured is the fine contrast as the film's own reader counts it (tools/measure/g17.py, its luma and its
band, the mean of the squared band signal), in the film and in the approved image: over the pixels where the
ring plane is the first thing on the view, from the inner rim outward, and not within EDGE pixels of anything
else (the limb, the sky, the plane inward of the rim), so that no edge of the globe or of the plane is counted
as a ringlet. One free value every EVERY knots of the table (0.02 radii a knot, so 0.06 radii between the
values), straight lines between them; each value reads the pixels of its own span, weighed by the line it is
the knot of.

The next value is the one now times the root of (approved energy over film energy): the energy goes as the
square of the amplitude. It is held from 1 up to CAP (1.6 if not given): where the film has as much fine
contrast as the approved image or more it is left as it is (crisp ringlets are not taken back), and no value
asks for more than CAP. No free value inside the dark gap from 1.92 to 2.10 (as for the tone: its edges lie at
other radii in the approved image than in the model, and where the gap is black there is nothing to amplify),
the knots inward of the inner rim left at 1, the last knot left at 1. One run is one step: draw the frame with
the table of OUT, run again, until the values stay (the script prints the largest change).

ring_fine.py --write TABLE.json: puts the gain of TABLE.json into skim.json, the layout of the file kept
(put_table.py), nothing else touched.
Run it from the repo's root. No pixel of the film is made here: this only measures."""
import sys, json
import numpy as np
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
ARGV = sys.argv[:]
sys.argv = ['x']
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'tools/measure'))
SKIM = ROOT / 'src/stops/saturn/skim.json'
APPROVED = ROOT / 'references/approved/saturn-close.jpg'
W, H = 1920, 1080
GAP = (1.92, 2.10)
RIM = 1.2458
DUST = 1.25  # the last knot inward of the inner rim
EVERY = 3
EDGE = 6
CAP = 1.6


def write(table_file):
    import put_table
    print('written', put_table.put(['light', 'grade', 'radial', 'fine', 'gain'], json.loads(Path(table_file).read_text())['gain']), 'knots')


def main():
    import cv2
    import g17
    import pose_fit as pf
    import geom
    skim = json.loads(SKIM.read_text())
    pose = skim['pose']
    radial = skim['light']['grade']['radial']
    first, step = radial['first'], radial['step']
    old = np.array(radial['fine']['gain'], float)
    count = len(old)
    knots = first + step * np.arange(count)
    cap = float(ARGV[3]) if len(ARGV) > 3 else CAP
    p = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
    pos, rot, sun, f = pf.camera(p)
    yy, xx = np.mgrid[0:H, 0:W]
    pts = np.stack([xx.ravel() + 0.5, yy.ravel() + 0.5], 1).astype(float)
    dr = pf.rays(pts, rot, f)
    dr /= np.linalg.norm(dr, axis=1)[:, None]
    down = dr[:, 1] < -1e-6
    k = -pos[1] / np.where(down, dr[:, 1], -1e-6)
    hit = pos[None, :] + dr * k[:, None]
    rad = np.where(down, np.hypot(hit[:, 0], hit[:, 2]), 99.0)
    sq = np.array([1.0, 1.0 / geom.POLAR, 1.0])
    ds = dr * sq
    ln = np.linalg.norm(ds, axis=1)
    ds /= ln[:, None]
    ps = pos * sq
    b = ds @ ps
    disc = b * b - (ps @ ps - 1)
    reach = (-b - np.sqrt(np.maximum(disc, 0))) / ln
    # the plane is the first thing on the view: no globe at all, or the globe behind the plane's point
    front = down & ((disc <= 0) | (reach <= 0) | (k < reach))
    m = (front & (rad >= RIM) & (rad < knots[-1])).reshape(H, W)
    m = cv2.erode(m.astype(np.uint8), np.ones((2 * EDGE + 1, 2 * EDGE + 1), np.uint8)).astype(bool).ravel()
    fy = g17.luma(ARGV[1])
    ay = g17.luma(str(APPROVED), (W, H))
    fe = (g17.band(fy) ** 2).ravel()[m]
    ae = (g17.band(ay) ** 2).ravel()[m]
    rr = rad[m]
    first_knot = int(np.nonzero(knots > DUST + 1e-9)[0][0])
    free = [i for i in range(first_knot, count - 1, EVERY) if not (GAP[0] < knots[i] < GAP[1])]
    if free[-1] < count - 2:
        free.append(count - 2)
    free = np.array(free)
    # the knots that are held: the last one inward of the rim and the last of the table, both at 1
    held = np.array([first_knot - 1] + list(free) + [count - 1])

    def table(v):
        x = np.ones(count)
        x[first_knot - 1:] = np.interp(np.arange(first_knot - 1, count), held, np.concatenate([[1.0], v, [1.0]]))
        return x

    now = old[free]
    if np.abs(table(now) - old).max() > 1e-4:
        print('the table in skim.json is not one this script laid: its free values are read, the knots between are laid anew')
    nxt = now.copy()
    print('radius  pixels  approved e-5  film e-5  film over approved    now   next')
    for j, i in enumerate(free):
        # the line this value is the knot of: 1 at its own radius, 0 at the free values on both sides
        lo, hi = knots[held[j]], knots[held[j + 2]]
        w = np.where(rr < knots[i], (rr - lo) / (knots[i] - lo), (hi - rr) / (hi - knots[i]))
        w = np.clip(w, 0, 1)
        if w.sum() < 50:
            print('%.2f   too few pixels, left as it is' % knots[i])
            continue
        a, e = (ae * w).sum() / w.sum(), (fe * w).sum() / w.sum()
        nxt[j] = float(np.clip(now[j] * np.sqrt(a / e), 1.0, cap))
        print('%.2f  %7d  %10.2f  %8.2f  %8.3f           %.3f  %.3f' % (knots[i], int(w.sum()), a * 1e5, e * 1e5, e / a, now[j], nxt[j]))
    print('largest change of a value: %.4f' % np.abs(nxt - now).max())
    out = table(np.round(nxt, 4))
    Path(ARGV[2]).write_text(json.dumps({'gain': [round(float(v), 4) for v in out], 'free': [round(float(knots[i]), 2) for i in free], 'cap': cap}))


if len(ARGV) > 2 and ARGV[1] == '--write':
    write(ARGV[2])
else:
    main()
