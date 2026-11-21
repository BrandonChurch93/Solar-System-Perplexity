import json
import sys

import cv2
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/neptune')
import geo

HERO = 'references/approved/neptune-hero.png'
NORMAL = np.array([0.1681, 0.9779, 0.1244])
CENTRE = np.array([0.0533, 0.0532, -0.4902])
R0, R1 = 1.28, 1.92
NA, NR = 2048, 512


def frame():
    n = NORMAL / np.linalg.norm(NORMAL)
    z = np.array([0.0, 0.0, 1.0])
    axis = np.cross(z, n)
    s = np.linalg.norm(axis)
    c = z @ n
    k = axis / s
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    m = np.eye(3) + s * K + (1 - c) * K @ K
    return m[:, 0], m[:, 1], n


def unwrap(img):
    u, v, n = frame()
    az = (np.arange(NA) + 0.5) / NA * 2 * np.pi - np.pi
    r = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
    aa, rr = np.meshgrid(az, r)
    w = CENTRE + rr[..., None] * (np.cos(aa)[..., None] * u + np.sin(aa)[..., None] * v)
    h_, w_ = img.shape[:2]
    x, y = geo.world_to_hero(w, w_, h_)
    d = w - geo.CAM
    dist = np.linalg.norm(d, axis=-1)
    dn = d / dist[..., None]
    b = -(dn @ geo.CAM)
    disc = b * b - (geo.CAM @ geo.CAM - 1)
    over = disc > 0
    hidden = over & (dist > b)
    inside = (x > 2) & (x < w_ - 3) & (y > 2) & (y < h_ - 3)
    out = cv2.remap(img.astype(np.float32), x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR)
    miss = np.sqrt(np.maximum(1 - np.maximum(disc, 0) / 1.0, 0))
    rt = np.sqrt(np.maximum(geo.CAM @ geo.CAM - b * b, 0))
    return out, inside & ~hidden, over, rt, w, dn


if __name__ == '__main__':
    hero = geo.decode(cv2.imread(HERO)[:, :, ::-1])
    H, ok, over, rt, w, dn = unwrap(hero)
    np.savez_compressed('out/work/nep/ring/unwrap.npz', H=H.astype(np.float32), ok=ok, over=over, rt=rt.astype(np.float32))
    vis = np.clip(H * 12, 0, 1) ** 0.5
    vis[~ok] = (0.3, 0, 0)
    cv2.imwrite('out/work/nep/ring/unwrap.jpg', (vis[::-1, :, ::-1] * 255).astype(np.uint8))
    print('ok fraction', ok.mean(), 'over disc', (ok & over).mean())
