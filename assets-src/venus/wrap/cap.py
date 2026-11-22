import sys
from pathlib import Path

import cv2
import numpy as np

BAK = 'out/work/venus/r6/bak'
WORK = 'out/work/venus/cap'
WIDTH_DEG = 90.0
SIZE = 4096
CANVASES = {'w': (-35.0, 55.0), 's': (55.0, 10.0), 't': (-20.0, 0.0)}


def basis(lon_deg, lat_deg):
    lon, lat = np.radians(lon_deg), np.radians(lat_deg)
    n = np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])
    e = np.cross([0.0, 1.0, 0.0], n)
    e /= np.linalg.norm(e)
    return n, e, np.cross(n, e)


def project(eq, name, size=SIZE):
    n, e, u = basis(*CANVASES[name])
    h, w = eq.shape[:2]
    t = np.tan(np.radians(WIDTH_DEG) / 2)
    a = ((np.arange(size) + 0.5) / size * 2 - 1) * t
    x, y = np.meshgrid(a, -a)
    d = n[None, None, :] + x[..., None] * e[None, None, :] + y[..., None] * u[None, None, :]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    mx = ((lon / (2 * np.pi) + 0.5) * w - 0.5).astype(np.float32)
    my = ((0.5 - lat / np.pi) * h - 0.5).astype(np.float32)
    pad = cv2.copyMakeBorder(eq, 0, 0, 8, 8, cv2.BORDER_WRAP)
    return cv2.remap(pad, mx + 8, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


if __name__ == '__main__':
    eq = cv2.imread(BAK + '/wrap-color-full.jpg')
    Path(WORK).mkdir(parents=True, exist_ok=True)
    for name in sys.argv[1:]:
        cv2.imwrite(f'{WORK}/{name}-src-{SIZE}.png', project(eq, name))
