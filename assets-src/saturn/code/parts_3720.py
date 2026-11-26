"""parts_3720.py [--masks DIR] [FILM ...]: frame 3720 against the approved close image, read by part.

The frame's number is the mean absolute level against the approved close image (all pixels, red, green and
blue). Two parts of the frame are read apart, because the approved image has the rings cross the globe about
6 degrees higher than a true plane does at this pose, so what it shows there is not what the scene's own
geometry and light put there:

  band:  the globe is the first thing on the view and the place on it lies at 0 to 6 degrees north (the
         latitude as the globe's shader counts it: its sine is the height of the place on the globe made round)
  sheet: the ring plane is the first thing on the view, inward of the inner rim (radius 1 to 1.2458)

The parts come from the pose of the frame (src/stops/saturn/skim.json pose, the lens of frame 3720) and from
nothing in a picture. --masks DIR writes them as two pictures of the frame's size (white: in the part, black:
not) and a third of the rest. For every FILM (frame 3720, 1920 by 1080) it prints what each part adds to the
frame's number, and the reading of the fine contrast (tools/measure/g17.py, its own definition and code) over
all its tiles and with the foot's tiles read apart: the tiles of which the two parts cover a third or more.
Run it from the repo's root. No pixel of the film is made here: this only measures."""
import sys, json
import numpy as np
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
ARGV = sys.argv[1:]
sys.argv = ['x']
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'tools/measure'))
W, H = 1920, 1080
RIM = 1.2458
BAND = (0.0, 6.0)
FOOT_SHARE = 1 / 3
APPROVED = ROOT / 'references/approved/saturn-close.jpg'


def parts():
    import pose_fit as pf
    import geom
    pose = json.loads((ROOT / 'src/stops/saturn/skim.json').read_text())['pose']
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
    t = -b - np.sqrt(np.maximum(disc, 0))
    reach = t / ln
    met = (disc > 0) & (reach > 0)
    front = down & (~met | (k < reach))
    globe = met & ~front
    lat = np.degrees(np.arcsin(np.clip(ps[1] + ds[:, 1] * t, -1, 1)))
    band = globe & (lat >= BAND[0]) & (lat <= BAND[1])
    sheet = front & (rad >= 1.0) & (rad <= RIM)
    return band.reshape(H, W), sheet.reshape(H, W)


def fine(film, foot):
    import g17
    fy = g17.luma(film)
    ay = g17.luma(str(APPROVED), (W, H))
    gx, gy = g17.DEFINITION['grid']
    ft = g17.tiles(fy, g17.band(fy), gx, gy)
    at = g17.tiles(ay, g17.band(ay), gx, gy)
    floor = max(2e-5, 0.05 * float(np.percentile(np.array([a[3] for a in at]), 90)))
    kept = {(a[0], a[1]): f[3] / a[3] for f, a in zip(ft, at) if a[2] > g17.DEFINITION['tileMeanLumaFloor'] and a[3] > floor}
    every = np.array(list(kept.values()))
    rest = np.array([v for key, v in kept.items() if key not in foot])
    return every, rest, {key: kept[key] for key in foot if key in kept}


def main():
    band, sheet = parts()
    rest = ~(band | sheet)
    gx, gy = 12, 8
    two = band | sheet
    foot = [(i, j) for j in range(gy) for i in range(gx) if two[j * H // gy:(j + 1) * H // gy, i * W // gx:(i + 1) * W // gx].mean() >= FOOT_SHARE]
    print('share of the frame: band %.4f, sheet %.4f, the rest %.4f' % (band.mean(), sheet.mean(), rest.mean()))
    print('the foot tiles (column, row of the 12 by 8 grid, from 0):', ' '.join('[%d,%d]' % key for key in foot))
    args = ARGV[:]
    if args and args[0] == '--masks':
        out = Path(args[1])
        out.mkdir(parents=True, exist_ok=True)
        for name, m in (('band', band), ('sheet', sheet), ('rest', rest)):
            Image.fromarray((m * 255).astype(np.uint8)).save(out / ('parts_3720_%s.png' % name))
        print('masks written to', out)
        args = args[2:]
    ref = np.asarray(Image.open(APPROVED).convert('RGB').resize((W, H), Image.LANCZOS)).astype(float)
    for film in args:
        a = np.asarray(Image.open(film).convert('RGB')).astype(float)
        d = np.abs(a - ref).mean(2)
        every, apart, at_foot = fine(film, foot)
        print(film)
        print('  level: whole %.4f = band %.4f + sheet %.4f + the rest %.4f' % (d.mean(), d[band].sum() / d.size, d[sheet].sum() / d.size, d[rest].sum() / d.size))
        print('  fine contrast: all %d tiles median %.4f, 25th percentile %.4f; apart from the foot %d tiles median %.4f, 25th percentile %.4f'
              % (len(every), np.median(every), np.percentile(every, 25), len(apart), np.median(apart), np.percentile(apart, 25)))
        print('  the foot tiles: ' + ' '.join('[%d,%d] %.4f' % (key[0], key[1], v) for key, v in at_foot.items()))


main()
