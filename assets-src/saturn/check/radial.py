import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, basis, hero_camera, load_json, normalize

film_path = sys.argv[1]
turn = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
out = sys.argv[3] if len(sys.argv) > 3 else None
fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
n = normalize(fit["rings"]["normal"])
e1, e2, _ = basis(n)
hero = cv2.imread(str(ROOT / "references/approved/saturn-hero.png")).astype(np.float32)
film = cv2.imread(film_path).astype(np.float32)
film = cv2.resize(film, (hero.shape[1], hero.shape[0]), interpolation=cv2.INTER_CUBIC)
th = np.linspace(0, 2 * np.pi, 720, endpoint=False)
tip = (np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2) * 2.3
x, y, z = cam.project(tip)
t0 = th[np.argmin(x)] + np.radians(turn)
rr = np.arange(1.10, 2.50, 0.002)
span = np.radians(np.linspace(-2.5, 2.5, 21))
P = (np.cos(t0 + span)[None, :, None] * e1 + np.sin(t0 + span)[None, :, None] * e2) * rr[:, None, None]
x, y, z = cam.project(P)
mx, my = (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32)
a = np.median(cv2.remap(hero, mx, my, cv2.INTER_LINEAR), 1)
b = np.median(cv2.remap(film, mx, my, cv2.INTER_LINEAR), 1)
la, lb = a @ [0.0722, 0.7152, 0.2126], b @ [0.0722, 0.7152, 0.2126]
print("left ansa plus", turn, "deg; px per 0.01 radii", round(float(np.hypot(x[5, 10] - x[0, 10], y[5, 10] - y[0, 10])), 2))
print("radius | hero B G R lum | film B G R lum | film/hero")
for r0 in np.arange(1.12, 2.46, 0.04):
    m = (rr >= r0) & (rr < r0 + 0.04)
    ha, fb = a[m].mean(0), b[m].mean(0)
    print(f"{r0:.2f} | {ha[2]:5.0f} {ha[1]:5.0f} {ha[0]:5.0f} {la[m].mean():5.0f} | {fb[2]:5.0f} {fb[1]:5.0f} {fb[0]:5.0f} {lb[m].mean():5.0f} | {lb[m].mean() / max(la[m].mean(), 1):.2f}")


def edges(l):
    s = cv2.GaussianBlur(l[:, None].astype(np.float32), (0, 0), 2)[:, 0]
    hi = s > 60
    idx = np.flatnonzero(np.diff(hi.astype(int)) != 0)
    return [round(float(rr[i]), 3) for i in idx]


print("crossings of display 60, hero", edges(la))
print("crossings of display 60, film", edges(lb))
if out:
    strip = np.vstack([np.repeat(a[None], 60, 0), np.zeros((6, len(rr), 3), np.float32), np.repeat(b[None], 60, 0)])
    cv2.imwrite(out, np.clip(cv2.resize(strip, (1400, 126), interpolation=cv2.INTER_AREA), 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
