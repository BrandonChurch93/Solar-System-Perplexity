import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

ROOT = Path(__file__).resolve().parents[3]
name, film_path = sys.argv[1], sys.argv[2]
lines = [tuple(int(v) for v in b.split(",")) for b in sys.argv[3:]]
ref = cv2.imread(str(ROOT / "references/approved" / ("saturn-hero.png" if name == "hero" else "saturn-close.jpg")))
film = cv2.imread(film_path)
ref = cv2.resize(ref, (film.shape[1], film.shape[0]), interpolation=cv2.INTER_AREA)


def line(img, x0, y0, x1, y1):
    n = int(np.hypot(x1 - x0, y1 - y0))
    xs = np.linspace(x0, x1, n).astype(np.float32)[None]
    ys = np.linspace(y0, y1, n).astype(np.float32)[None]
    acc = 0
    for k in (-1, 0, 1):
        acc = acc + cv2.remap(img, xs, ys + k, cv2.INTER_LINEAR).reshape(-1, 3).astype(np.float64)
    v = acc / 3 / 255
    return v @ np.array([0.0722, 0.7152, 0.2126]), v[:, ::-1]


def bands(l):
    g = np.log(np.maximum(l, 0.02))
    out = []
    prev = g
    for s in (1, 2, 4, 8, 16):
        b = gaussian_filter1d(g, s)
        out.append(float(np.std(prev - b)))
        prev = b
    return out


s = film.shape[1] / 2816
for x0, y0, x1, y1 in lines:
    a, ac = line(ref, x0 * s, y0 * s, x1 * s, y1 * s)
    b, bc = line(film, x0 * s, y0 * s, x1 * s, y1 * s)
    print(f"line {x0},{y0} to {x1},{y1}: display mean rgb approved {np.round(ac.mean(0), 3)} film {np.round(bc.mean(0), 3)}")
    print("   detail by octave (1,2,4,8,16 px) approved", np.round(bands(a), 3), "film", np.round(bands(b), 3))
