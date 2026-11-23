import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from layback import WORK

ROWS = (60, 120, 150, 170, 180, 190, 196, 200, 204, 208, 212, 216, 222, 230, 250, 280)
COLS = (480, 960, 1440)


def profile(path):
    im = cv2.imread(str(path))[..., ::-1].astype(np.float32)
    return np.array([[im[y - 1:y + 2, x - 24:x + 24].reshape(-1, 3).mean(axis=0) for y in ROWS] for x in COLS])


def main():
    frame = sys.argv[1]
    sides = WORK / 'sides'
    close = profile(sides / (frame + '-terrain.png'))
    print('rows', ' '.join(str(r) for r in ROWS))
    for i, x in enumerate(COLS):
        print('close x', x, ' '.join('%d,%d,%d' % tuple(v) for v in close[i]))
    for tag in sys.argv[2:]:
        p = profile(sides / (frame + '-orbit' + ('' if tag == '-' else '-' + tag) + '.png'))
        for i, x in enumerate(COLS):
            print(tag, 'x', x, ' '.join('%d,%d,%d' % tuple(v) for v in p[i]))
        print(tag, 'mean abs difference in code values, sky rows', round(float(np.abs(p - close)[:, :6].mean()), 1), 'rim rows', round(float(np.abs(p - close)[:, 6:12].mean()), 1), 'ground rows', round(float(np.abs(p - close)[:, 12:].mean()), 1))


if __name__ == '__main__':
    main()
