import sys

import cv2
import numpy as np
from PIL import Image

P = 8
CAP = 6.0
REACH = 4
CALM = 3.0


def one(a):
    h, w = a.shape[:2]
    out = a.copy()
    edges = np.arange(1, w // P) * P
    step = a[:, edges] - a[:, edges - 1] - 0.5 * ((a[:, edges - 1] - a[:, edges - 2]) + (a[:, edges + 1] - a[:, edges]))
    d = np.abs(np.diff(a.mean(2), axis=1))
    d[:, edges - 1] = 0.5 * (d[:, edges - 2] + d[:, edges])
    act = cv2.blur(np.pad(d, ((0, 0), (0, 1)), mode='edge'), (2 * P, P))
    calm = 1 / (1 + (act[:, edges] / CALM) ** 2)
    s = np.clip(step, -CAP, CAP) * calm[..., None]
    for j in range(REACH):
        k = 0.5 * (1 - (j + 0.5) / REACH)
        out[:, edges + j] -= s * k
        out[:, edges - 1 - j] += s * k
    return out


def deblock(a):
    a = one(a.astype(np.float32))
    return one(a.transpose(1, 0, 2)).transpose(1, 0, 2)


def ratio(a, box):
    x0, x1, y0, y1 = box
    reg = a[y0:y1, x0:x1].mean(2)
    out = []
    for ax in (1, 0):
        d = np.abs(np.diff(reg, axis=ax))
        idx = np.arange(d.shape[ax])
        off = (x0 if ax == 1 else y0) % P
        m = ((idx + 1 + off) % P) == 0
        out.append(float(np.take(d, np.flatnonzero(m), axis=ax).mean() / np.take(d, np.flatnonzero(~m), axis=ax).mean()))
    return out


if __name__ == '__main__':
    src, dst = sys.argv[1:3]
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    b = deblock(a)
    close = (('crater shadow', (1560, 1900, 800, 960)), ('sky', (1500, 2700, 20, 120)), ('lit plain', (300, 900, 900, 1300)))
    hero = (('disc lit', (1100, 1500, 500, 900)), ('disc night', (500, 800, 900, 1200)), ('sky', (100, 400, 100, 400)), ('terminator', (900, 1200, 700, 1000)))
    for name, box in (hero if 'hero' in src else close):
        print(name, 'before %.2f %.2f' % tuple(ratio(a, box)), 'after %.2f %.2f' % tuple(ratio(b, box)))
    print('mean abs change %.3f, p99 %.2f codes' % (float(np.abs(b - a).mean()), float(np.percentile(np.abs(b - a), 99))))
    Image.fromarray(np.clip(b + 0.5, 0, 255).astype(np.uint8)).save(dst)
