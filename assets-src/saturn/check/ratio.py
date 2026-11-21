import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "wrap"))
from geo import WORK, hero_geometry, hero_image, scene  # noqa: E402

film_path, out = sys.argv[1], sys.argv[2]
g = hero_geometry()
hero = scene(hero_image())
film = cv2.imread(film_path)[..., ::-1].astype(np.float32) / 255
film = scene(cv2.resize(film, (hero.shape[1], hero.shape[0]), interpolation=cv2.INTER_AREA))
k = (9, 9)
hb = cv2.blur(hero, k)
fb = cv2.blur(film, k)
w = np.array([0.2126, 0.7152, 0.0722])
r = np.log2((fb @ w + 0.003) / (hb @ w + 0.003))
img = np.zeros(hero.shape, np.float32)
img[..., 0] = np.clip(r, 0, 2) / 2
img[..., 2] = np.clip(-r, 0, 2) / 2
img[..., 1] = 0.15 + 0.5 * np.clip(hb @ w, 0, 1) ** 0.4
img[..., 1] *= 1 - np.clip(np.abs(r), 0, 2) / 2
cv2.imwrite(out, (np.clip(img[..., ::-1], 0, 1) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
ok = g["hit"] & ~g["covered"] & ~g["shadowed"]
nb = np.linspace(-1, 1, 21)
mb = np.array([0.0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8, 1.0])
print("log2 film/hero luminance by ndl (rows) and mu (cols)", mb)
for i in range(20):
    row = []
    for j in range(len(mb) - 1):
        m = ok & (g["ndl"] >= nb[i]) & (g["ndl"] < nb[i + 1]) & (g["mu"] >= mb[j]) & (g["mu"] < mb[j + 1])
        row.append("  .  " if m.sum() < 200 else "%+.2f" % np.median(r[m]))
    print("%+.2f" % ((nb[i] + nb[i + 1]) / 2), " ".join(row))
