import sys
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

HERO = 'references/approved/uranus-hero.png'
MOONS = {'miranda': (671.7, 343.9), 'ariel': (2425.5, 444.2)}
LUMA = np.array([0.2126, 0.7152, 0.0722])


def stats(im, mx, my):
    c = im[int(my) - 60:int(my) + 60, int(mx) - 60:int(mx) + 60]
    y = c @ LUMA
    lit = y > 0.35
    tint = c[lit].mean(0) / max(y[lit].mean(), 1e-6)
    return [int(lit.sum()), round(float(y[lit].mean()), 3)] + [round(float(v), 3) for v in np.percentile(y[lit], [25, 50, 75, 90, 99])] + [round(float(v), 3) for v in tint]


def main():
    hero = np.asarray(Image.open(HERO).convert('RGB')).astype(np.float32) / 255
    film = Image.open(sys.argv[1]).convert('RGB').resize((hero.shape[1], hero.shape[0]), Image.LANCZOS)
    film = geo.undrift(np.asarray(film)).astype(np.float32) / 255
    print('lit px, mean, p25, p50, p75, p90, p99, tint r g b')
    for name, (mx, my) in MOONS.items():
        print(name, 'hero', stats(hero, mx, my))
        print(name, 'film', stats(film, mx, my))


main()
