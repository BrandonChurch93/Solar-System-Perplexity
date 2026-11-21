import sys
import cv2
import numpy as np

sys.path.insert(0, 'assets-src/neptune')
import geo

HERO = 'references/approved/neptune-hero.png'


def main():
    film = cv2.imread(sys.argv[1])[:, :, ::-1]
    h, w = film.shape[:2]
    hero = cv2.resize(cv2.imread(HERO)[:, :, ::-1], (w, h), interpolation=cv2.INTER_AREA)
    a, b = geo.decode(hero), geo.decode(film)
    d = geo.hero_rays(w, h)
    bb = -(d @ geo.CAM)
    disc = geo.CAM @ geo.CAM - bb * bb
    hit = disc < 1
    t = bb - np.sqrt(np.maximum(1 - disc, 0))
    p = geo.CAM + d * t[..., None]
    ndl = p @ np.array(geo.SUN)
    mu = -(p * d).sum(-1)
    k = max(3, w // 160) | 1
    la = cv2.GaussianBlur(a, (0, 0), k)
    lb = cv2.GaussianBlur(b, (0, 0), k)
    r = np.log2((lb[..., 2] + 0.004) / (la[..., 2] + 0.004))
    vis = np.zeros((h, w, 3), np.uint8)
    vis[..., 0] = np.clip(128 + r * 96, 0, 255)
    vis[..., 2] = np.clip(128 - r * 96, 0, 255)
    vis[..., 1] = 128 - np.clip(np.abs(r) * 96, 0, 128)
    cv2.imwrite(sys.argv[2] if len(sys.argv) > 2 else 'out/work/nep/ratio.jpg', vis[:, :, ::-1])
    edges = [-1, -0.4, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    print('ndl bin        hero R G B              film R G B          ratio B')
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = hit & (mu > 0.45) & (ndl >= lo) & (ndl < hi)
        if m.sum() < 50:
            continue
        ha, fb = np.median(a[m], axis=0), np.median(b[m], axis=0)
        print('%5.2f %5.2f  %6.3f %6.3f %6.3f   %6.3f %6.3f %6.3f   %5.2f' % (lo, hi, *ha, *fb, fb[2] / max(ha[2], 1e-5)))


main()
