import sys
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

HERO = 'references/approved/uranus-hero.png'
BOXES = {
    'ul': (600, 60, 1400, 760, 1, 1.0),
    'top': (1100, 40, 1900, 340, 1, 1.0),
    'right': (1800, 200, 2600, 900, 1, 1.0),
    'll': (500, 700, 1300, 1400, 1, 1.0),
    'lr': (1500, 900, 2300, 1560, 1, 1.0),
    'limb-ul': (1000, 380, 1300, 680, 3, 1.0),
    'limb-top': (1480, 290, 1780, 440, 4, 1.0),
    'limb-night': (1750, 1000, 2050, 1300, 3, 1.0),
    'limb-night3': (1750, 1000, 2050, 1300, 3, 3.0),
    'disc': (1150, 500, 1750, 1100, 1, 1.0),
    'miranda': (611, 283, 731, 403, 4, 1.0),
    'ariel': (2365, 384, 2485, 504, 4, 1.0),
}

def main():
    film_path = sys.argv[1]
    out = sys.argv[2]
    names = sys.argv[3:] or list(BOXES)
    hero = Image.open(HERO).convert('RGB')
    film = Image.open(film_path).convert('RGB').resize(hero.size, Image.LANCZOS)
    film = Image.fromarray(geo.undrift(np.asarray(film)))
    for name in names:
        x0, y0, x1, y1, z, g = BOXES[name]
        a = hero.crop((x0, y0, x1, y1))
        b = film.crop((x0, y0, x1, y1))
        if z != 1:
            a = a.resize((a.width * z, a.height * z), Image.LANCZOS)
            b = b.resize((b.width * z, b.height * z), Image.LANCZOS)
        w = np.concatenate([np.asarray(a), np.zeros((a.height, 8, 3), np.uint8) + 128, np.asarray(b)], axis=1).astype(np.float32) * g
        Image.fromarray(w.clip(0, 255).astype(np.uint8)).save(f'{out}/cmp-{name}.jpg', quality=92)

main()
