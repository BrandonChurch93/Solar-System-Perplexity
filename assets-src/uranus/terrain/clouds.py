import json

import numpy as np
from PIL import Image

TAKE = 'out/work/u/gen4/clouds-take1.png'
PUB = 'public/assets/uranus/'
BLACK = 0.035
WHITE = 0.92
EDGE = 0.5
GUTTER = 64


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    im = np.asarray(Image.open(TAKE).convert('RGB'), np.float32) / 255
    lum = im.mean(-1)
    lum = np.clip((lum - BLACK) / (WHITE - BLACK), 0, 1)
    n = lum.shape[0]
    t = (np.arange(n) + 0.5) / n
    w1 = smooth(0, EDGE, np.minimum(t, 1 - t) * 2)
    out = w1[None, :] * lum + (1 - w1[None, :]) * np.roll(lum, n // 2, 1)
    out = w1[:, None] * out + (1 - w1[:, None]) * np.roll(out, n // 2, 0)
    pad = np.concatenate([out[-GUTTER:], out, out[:GUTTER]], 0)
    full = Image.fromarray((pad * 255 + 0.5).astype(np.uint8))
    full.save(PUB + 'full/deck-cloud.jpg', quality=92)
    full.resize((n // 2, n // 2 + GUTTER), Image.LANCZOS).save(PUB + 'web/deck-cloud.jpg', quality=90)
    json.dump({'gutter': GUTTER / (n + 2 * GUTTER)}, open('src/stops/uranus/deck-cloud.json', 'w'))
    tile = np.tile(out, (2, 2))
    Image.fromarray((tile * 255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS).save('out/work/u/gen4/cloud-tile-v.png')
    print('cover', float((out > 0.15).mean()), 'mean', float(out.mean()))


if __name__ == '__main__':
    main()
