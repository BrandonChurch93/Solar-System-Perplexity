import sys
import cv2
import numpy as np

HERO = 'references/approved/neptune-hero.png'
CX, CY, R = 1410.57, 1208.53, 1003.96


def load(path, size):
    img = cv2.imread(path)[:, :, ::-1].astype(np.float32)
    if (img.shape[1], img.shape[0]) != size:
        img = cv2.resize(img, size, interpolation=cv2.INTER_AREA)
    return img


def main():
    film_path = sys.argv[1]
    angles = [float(a) for a in sys.argv[2].split(',')] if len(sys.argv) > 2 else [0, 30, 45, 60, 90, 120, 135, 150, 180, 225, 270, 315]
    film = cv2.imread(film_path)[:, :, ::-1].astype(np.float32)
    size = (film.shape[1], film.shape[0])
    hero = load(HERO, size)
    k = size[0] / 2816
    cx, cy, r = CX * k, CY * k, R * k
    offs = [-80, -50, -30, -20, -12, -8, -5, -3, -1, 1, 3, 5, 8, 12, 20, 30, 45, 70, 100]
    print('offsets in hero px:', offs)
    for a in angles:
        t = np.radians(a)
        rows = []
        for name, img in (('hero', hero), ('film', film)):
            vals = []
            for o in offs:
                rr = r + o * k
                x = cx + rr * np.cos(t)
                y = cy - rr * np.sin(t)
                if x < 1 or y < 1 or x > size[0] - 2 or y > size[1] - 2:
                    vals.append(None)
                    continue
                tx, ty = -np.sin(t), -np.cos(t)
                acc = []
                for s in np.linspace(-14 * k, 14 * k, 9):
                    xi = int(round(x + tx * s))
                    yi = int(round(y + ty * s))
                    if 0 <= xi < size[0] and 0 <= yi < size[1]:
                        acc.append(img[yi, xi])
                vals.append(np.median(np.array(acc), axis=0))
            rows.append((name, vals))
        print('theta', a)
        for name, vals in rows:
            print(' ', name, ' '.join('   --      ' if v is None else '%3d,%3d,%3d' % tuple(int(c) for c in v) for v in vals))


main()
