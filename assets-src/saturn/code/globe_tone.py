"""globe_tone.py FILM: the globe of the approved close image against frame 3720 of the film.

FILM is frame 3720 of the film at 1920 by 1080 (final tier without grain is best). On the fitted pose of
src/stops/saturn/skim.json every pixel of the globe gets its latitude, the cosine of the Sun's angle and
the cosine of the view against the surface. It prints, per bin of the Sun's cosine and per bin of latitude,
the middle display colour of the approved image and of the film and the middle scene light of both, so the
tone of the globe can be set by angle and by latitude the way the tone of the rings is set by radius
(ring_radial.py). Run it from the repo's root. No pixel of the film is made here: this only measures."""
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
FEWEST = 300
LUMA = np.array([0.2126, 0.7152, 0.0722])


def fields():
    """Per pixel of the frame: on the globe or not, latitude in degrees, cosine of the Sun, cosine of the view."""
    pose = json.loads(SKIM.read_text())['pose']
    p = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
    pos, rot, sun, f = pf.camera(p)
    yy, xx = np.mgrid[0:H, 0:W]
    pts = np.stack([xx.ravel() + 0.5, yy.ravel() + 0.5], 1).astype(float)
    dr = pf.rays(pts, rot, f)
    dr /= np.linalg.norm(dr, axis=1)[:, None]
    sq = np.array([1.0, 1.0 / geom.POLAR, 1.0])
    ds = dr * sq
    ds /= np.linalg.norm(ds, axis=1)[:, None]
    ps = pos * sq
    b = ds @ ps
    disc = b * b - (ps @ ps - 1)
    t = -b - np.sqrt(np.maximum(disc, 0))
    globe = (disc > 0) & (t > 0)
    hs = ps[None, :] + ds * t[:, None]
    n = hs * sq
    n /= np.linalg.norm(n, axis=1)[:, None]
    ndl = n @ (sun / np.linalg.norm(sun))
    lat = np.degrees(np.arcsin(np.clip(hs[:, 1], -1, 1)))
    mu = -(n * dr).sum(1)
    return globe, lat, ndl, mu


def main():
    globe, lat, ndl, mu = fields()
    approved = np.asarray(Image.open(ROOT / 'references/approved/saturn-close.jpg').convert('RGB').resize((W, H), Image.LANCZOS))
    film = np.asarray(Image.open(ARGV[1]).convert('RGB'))
    a8 = approved.reshape(-1, 3).astype(float)
    f8 = film.reshape(-1, 3).astype(float)
    a = geom.scene_of(approved).reshape(-1, 3)
    f = geom.scene_of(film).reshape(-1, 3)
    print('globe pixels', int(globe.sum()), 'latitudes %.1f to %.1f' % (lat[globe].min(), lat[globe].max()))
    print('by the cosine of the Sun (latitude 12 to 55, view cosine over 0.25): display approved | film, scene light approved | film')
    for c in np.arange(-0.30, 0.95, 0.05):
        m = globe & (ndl >= c) & (ndl < c + 0.05) & (lat > 12) & (lat < 55) & (mu > 0.25)
        if int(m.sum()) < FEWEST:
            continue
        pa, pm = np.median(a8[m], 0), np.median(f8[m], 0)
        print('%5.2f  %3d,%3d,%3d | %3d,%3d,%3d   %.3f | %.3f   n %d' % (c, *pa, *pm, np.median(a[m] @ LUMA), np.median(f[m] @ LUMA), int(m.sum())))
    print('by latitude (cosine of the Sun over 0.45, view cosine over 0.2): display approved | film, saturation approved | film')
    for c in np.arange(-6, 80, 3):
        m = globe & (lat >= c) & (lat < c + 3) & (ndl > 0.45) & (mu > 0.2)
        if int(m.sum()) < FEWEST:
            continue
        pa, pm = np.median(a8[m], 0), np.median(f8[m], 0)
        sa = (pa.max() - pa.min()) / max(pa.max(), 1)
        sm = (pm.max() - pm.min()) / max(pm.max(), 1)
        print('%5.0f  %3d,%3d,%3d | %3d,%3d,%3d   %.2f | %.2f   n %d' % (c, *pa, *pm, sa, sm, int(m.sum())))


if __name__ == '__main__':
    main()
