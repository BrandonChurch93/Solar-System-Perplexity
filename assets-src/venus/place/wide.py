"""The wide ring about the place (level v): the cloud of the close view seen from above, painted about level w out to 45 deg of arc
from the plate centre, where the globe's own cloud map holds at the pixel scale of the judged dive and rise frames.

  python3 assets-src/venus/place/wide.py guide            v/ring-guide.jpg, the input of the outpainting take

Values: assets-src/venus/place/wide.json. Work files live in out/work/venus/place/v/. The steps and the prompts are in
assets-src/venus/RECIPE.md, section "Wide ring".
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'patches'))
import lay  # noqa: E402

WORK = lay.WORK
SPEC = lay.SPEC
WIDE = json.loads((HERE / 'wide.json').read_text())
TAG = WIDE['tag']
OUT = WORK / TAG
CHILD = WIDE['child']
CHILD_DEG = next(l['widthDeg'] for l in SPEC['levels'] if l['tag'] == CHILD)


def read(path, flags=cv2.IMREAD_COLOR):
    img = cv2.imread(str(path), flags)
    if img is None:
        raise SystemExit('missing ' + str(path))
    return img.astype(np.float32) / 255


def write(path, img):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8))


def resize(img, size):
    if img.shape[0] == size:
        return img
    return cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA if size < img.shape[0] else cv2.INTER_LANCZOS4)


def square(size):
    """The square of the child in a plate of this size: its width and its offset in pixels."""
    n = int(round(size * np.tan(np.radians(CHILD_DEG) / 2) / np.tan(np.radians(WIDE['widthDeg']) / 2) / 2)) * 2
    return n, (size - n) // 2


def guide():
    """The child plate in its square on flat grey, its border broken up along a smooth noise and closed at the border of the square."""
    mt = WIDE['matte']
    size = WIDE['guideSize']
    n, o = square(size)
    c = resize(read(WORK / CHILD / 'plate-4096.png'), n)
    rng = np.random.default_rng(mt['seed'])

    def noise(sigma):
        x = cv2.GaussianBlur(rng.standard_normal((n, n)).astype(np.float32), (0, 0), sigma)
        return x / x.std()

    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    rim = np.minimum(np.minimum(xx, n - 1 - xx), np.minimum(yy, n - 1 - yy)) / n
    d = rim.copy()
    for amount, sigma in mt['noise']:
        d = d + amount * noise(sigma)
    m = (lay.smooth(mt['edge'][0], mt['edge'][1], d) * lay.smooth(0.0, mt['close'], rim))[..., None]
    g = np.full((size, size, 3), WIDE['grey'], np.float32)
    g[o:o + n, o:o + n] = g[o:o + n, o:o + n] * (1 - m) + c * m
    OUT.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT / 'ring-guide.jpg'), np.clip(g * 255 + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(TAG, 'ring guide', size, 'child', CHILD, 'square', n, 'offset', o)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'guide':
        guide()
