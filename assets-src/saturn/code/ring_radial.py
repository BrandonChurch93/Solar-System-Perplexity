"""ring_radial.py FILM [write]: the tone of the rings by radius against the approved close image.

FILM is frame 3720 of the film at the final tier without grain (1920 by 1080), drawn with the table that
src/stops/saturn/skim.json light.grade.radial holds now. Per ring of radii of the fitted pose (skim.json pose),
on the lit sheet where no globe lies on the view and where the view meets the plane steeply enough that the
law of the low view (light.grade.low) leaves the light alone, it takes the middle value of the scene light of
the approved image over that of the film and multiplies the table's factors by it, holds them between LOW and
HIGH and evens them over three knots. With write it puts the new table into skim.json; without, it prints it.
Run it from the repo's root. No pixel of the film is made here: this only measures."""
import sys, json
import numpy as np
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
ARGV = sys.argv[:]
sys.argv = ['x']
import pose_fit as pf  # noqa: E402
import geom  # noqa: E402

ROOT = HERE.parents[2]
SKIM = ROOT / 'src/stops/saturn/skim.json'
W, H = 1920, 1080
FIRST, STEP, COUNT = 1.03, 0.02, 70
LOW, HIGH = 0.4, 4.5
FEWEST = 200


def main():
    skim = json.loads(SKIM.read_text())
    pose = skim['pose']
    radial = skim['light']['grade']['radial']
    low = skim['light']['grade']['low']
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
    ds /= np.linalg.norm(ds, axis=1)[:, None]
    ps = pos * sq
    b = ds @ ps
    disc = b * b - (ps @ ps - 1)
    # the globe counts where it lies in front of the plane's point (behind it the dust lies on the view first)
    reach = (-b - np.sqrt(np.maximum(disc, 0))) / np.linalg.norm(dr * sq, axis=1)
    globe = (disc > 0) & (reach < np.where(down, k, 1e9))
    hs = hit * sq
    ss = sun * sq
    ss /= np.linalg.norm(ss)
    bb = hs @ ss
    miss = np.linalg.norm(hs - bb[:, None] * ss[None, :], axis=1)
    shadow = (bb < 0) & (miss < 1.03)
    mu = np.abs(dr[:, 1])
    steep = (mu >= low['cosine']) | (rad >= low['zone'][1])
    ok = (~globe) & (~shadow) & steep & down

    approved = np.asarray(Image.open(ROOT / 'references/approved/saturn-close.jpg').convert('RGB').resize((W, H), Image.LANCZOS))
    film = np.asarray(Image.open(ARGV[1]).convert('RGB'))
    A = geom.scene_of(approved).reshape(-1, 3)
    F = geom.scene_of(film).reshape(-1, 3)

    def old(r):
        x = np.clip((r - radial['first']) / radial['step'], 0, len(radial['gain']) - 1)
        i = int(min(np.floor(x), len(radial['gain']) - 2))
        g = np.array(radial['gain'])
        return g[i] + (g[i + 1] - g[i]) * (x - i)

    knots = FIRST + STEP * np.arange(COUNT)
    gain = np.array([old(r) for r in knots])
    seen = np.zeros(COUNT, bool)
    for i, r in enumerate(knots):
        m = ok & (rad >= r - STEP / 2) & (rad < r + STEP / 2)
        if int(m.sum()) < FEWEST or r > 2.38:
            continue
        ratio = np.median(A[m], axis=0) / np.maximum(np.median(F[m], axis=0), 1e-4)
        gain[i] = np.clip(gain[i] * ratio, LOW, HIGH)
        seen[i] = True
    # a knot nothing was seen at takes the factors of the nearest knot that was seen, inward of the last seen
    idx = np.nonzero(seen)[0]
    for i in range(COUNT):
        if not seen[i] and len(idx) and i < idx[-1]:
            gain[i] = gain[idx[np.argmin(np.abs(idx - i))]]
    even = gain.copy()
    for i in range(1, COUNT - 1):
        even[i] = 0.25 * gain[i - 1] + 0.5 * gain[i] + 0.25 * gain[i + 1]
    even[-1] = 1.0
    table = [[round(float(v), 3) for v in row] for row in even]
    for i in range(0, COUNT, 4):
        print(f'{knots[i]:.2f}', table[i], 'seen' if seen[i] else '')
    if len(ARGV) > 2 and ARGV[2] == 'write':
        radial['first'], radial['step'], radial['gain'] = FIRST, STEP, table
        SKIM.write_text(json.dumps(skim, indent=2) + '\n')
        print('written')


main()
