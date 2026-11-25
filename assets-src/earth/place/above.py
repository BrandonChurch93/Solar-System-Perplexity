import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import geom as g
import geo

PUBLIC = g.ROOT / 'public/assets/earth'
PLATES = g.PLACE['plates']
ABOVE = PLATES['above']
STAND = PLATES['stand']


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    level = PLATES['levels'][0]
    code = cv2.imread(str(PUBLIC / 'full' / level['file']))[..., ::-1].astype(np.float32) / 255
    lo = code.min(-1)
    gl = PLATES['glint']
    n = code.shape[0]
    per = n / level['widthDeg']
    yy, xx = np.mgrid[:n, :n].astype(np.float32)
    x, y = (xx - (gl['centre'][0] - level['offset'][0])) / per, ((gl['centre'][1] + level['offset'][1]) - yy) / per
    turn = np.radians(gl['angleDeg'])
    away = np.hypot((x * np.cos(turn) + y * np.sin(turn)) / gl['sigmaDeg'][0], (y * np.cos(turn) - x * np.sin(turn)) / gl['sigmaDeg'][1])
    lifted = step(ABOVE['over'][0], ABOVE['over'][1], lo - cv2.GaussianBlur(lo, (0, 0), ABOVE['overDeg'] * per))
    cloud = step(STAND['cloud'][0], STAND['cloud'][1], lo) * (1 - step(STAND['warm'][0], STAND['warm'][1], code[..., 0] - code[..., 2])) * step(ABOVE['streak'][0], ABOVE['streak'][1], away) * lifted * (1 - step(ABOVE['grey'][0], ABOVE['grey'][1], (code.max(-1) - lo) / np.maximum(code.max(-1), 1e-3)))
    del xx, yy, x, y, away
    light = geo.decode(code) * cloud[..., None]
    for key, n in (('full', ABOVE['size']), ('web', ABOVE['size'] // 2)):
        a = cv2.resize(cloud, (n, n), interpolation=cv2.INTER_AREA)
        c = geo.encode(cv2.resize(light.astype(np.float32), (n, n), interpolation=cv2.INTER_AREA))
        out = np.clip(np.round(np.concatenate([c, a[..., None]], -1) * 255), 0, 255).astype(np.uint8)
        Image.fromarray(out, 'RGBA').save(PUBLIC / key / ABOVE['file'], optimize=True)
        print('above', key, n, 'px, km a texel %.2f, cover of the plate %.4f, of the patch %.4f, largest cover of a texel %.3f' % (level['widthDeg'] * 111.19 / n, cloud.mean(), a.mean(), a.max()), flush=True)


if __name__ == '__main__':
    main()
