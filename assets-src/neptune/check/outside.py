import sys
import cv2
import numpy as np

sys.path.insert(0, 'assets-src/neptune')
import geo

HERO = 'references/approved/neptune-hero.png'
EDGES = [0.95, 0.97, 0.985, 0.992, 0.996, 1.0, 1.004, 1.008, 1.012, 1.018, 1.026, 1.036, 1.05, 1.07, 1.1, 1.14]


def table(path, thetas, width=6.0):
    img = cv2.imread(path)[:, :, ::-1]
    h, w = img.shape[:2]
    scene = geo.decode(img)
    d = geo.hero_rays(w, h)
    b = -(d @ geo.CAM)
    rt = np.sqrt(np.maximum(geo.CAM @ geo.CAM - b * b, 0))
    foot = geo.CAM + d * b[..., None]
    c = geo.CAM / np.linalg.norm(geo.CAM)
    up = np.array([0, 1.0, 0]) - c[1] * c
    up /= np.linalg.norm(up)
    right = np.cross(up, c)
    ang = np.degrees(np.arctan2(foot @ up, foot @ right))
    out = {}
    for t in thetas:
        sel = np.abs(((ang - t + 180) % 360) - 180) < width / 2
        out[t] = [np.percentile(scene[sel & (rt >= lo) & (rt < hi)][:, 2], 40) if (sel & (rt >= lo) & (rt < hi)).sum() > 12 else np.nan for lo, hi in zip(EDGES[:-1], EDGES[1:])]
    return out


thetas = [float(a) for a in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(-15, 181, 15))
hero = table(HERO, thetas)
film = table(sys.argv[1], thetas)
print('rt         ', ' '.join('%6.3f' % (0.5 * (a + b)) for a, b in zip(EDGES[:-1], EDGES[1:])))
for t in thetas:
    print('%4d hero B ' % t, ' '.join('%6.3f' % v for v in hero[t]))
    print('     film B ', ' '.join('%6.3f' % v for v in film[t]))
