import sys
import cv2
import numpy as np

sys.path.insert(0, 'assets-src/neptune')
import geo

HERO = 'references/approved/neptune-hero.png'
EDGES = np.concatenate([np.arange(0.90, 0.99, 0.01), np.arange(0.99, 1.03, 0.002), np.arange(1.03, 1.08, 0.005), np.arange(1.08, 1.2001, 0.02)])


def table(path, thetas, width=5.0):
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
        rows = []
        for i in range(len(EDGES) - 1):
            m = sel & (rt >= EDGES[i]) & (rt < EDGES[i + 1])
            if m.sum() < 12:
                rows.append([np.nan] * 3)
            else:
                rows.append(np.median(scene[m], axis=0))
        out[t] = np.array(rows)
    return out


def main():
    thetas = [float(a) for a in sys.argv[2].split(',')] if len(sys.argv) > 2 else [-15, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195]
    hero = table(HERO, thetas)
    film = table(sys.argv[1], thetas) if len(sys.argv) > 1 and sys.argv[1] != '-' else None
    mid = 0.5 * (EDGES[:-1] + EDGES[1:])
    np.save('out/work/nep/hero-profiles.npy', {'thetas': thetas, 'mid': mid, 'hero': hero}, allow_pickle=True)
    print('rt    ', ' '.join('%6.3f' % m for m in mid))
    for t in thetas:
        print('theta %g  ndl %.2f' % (t, np.cos(np.radians(t)) * 0.716 + np.sin(np.radians(t)) * 0.698))
        for ch, name in enumerate('RGB'):
            print('  hero', name, ' '.join('%6.3f' % v for v in hero[t][:, ch]))
            if film:
                print('  film', name, ' '.join('%6.3f' % v for v in film[t][:, ch]))


main()
