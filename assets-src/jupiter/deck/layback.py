import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

ROOT = os.path.join(geom.HERE, '..', '..', '..')


def layback(x0, x1, y0, y1, step):
    img = cv2.imread(os.path.join(ROOT, 'references', 'approved', 'jupiter-close.jpg'), cv2.IMREAD_COLOR)
    gx, gy = np.meshgrid(np.arange(x0, x1, step) + step / 2, np.arange(y1, y0, -step) - step / 2)
    p = geom.from_chart(gx, gy)
    px, py = geom.project(p)
    front = p[..., 2] < 0
    seen = (p @ (-geom.NADIR)) * 0 + 1
    toc = p - geom.CENTRE
    facing = np.einsum('...k,...k->...', toc / np.linalg.norm(toc, axis=-1, keepdims=True), -p / np.linalg.norm(p, axis=-1, keepdims=True))
    ok = front & (facing > 0) & (px >= 0) & (px < geom.W - 1) & (py >= 0) & (py < geom.H - 1)
    out = cv2.remap(img, px.astype(np.float32), py.astype(np.float32), cv2.INTER_AREA if False else cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    out[~ok] = (40, 0, 40)
    return out, px, py, ok


if __name__ == '__main__':
    out_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    for name, box, step in [('wide', (-30, 30, -6, 34), 0.04), ('near', (-6, 6, -4.5, 5.5), 0.008)]:
        out, px, py, ok = layback(*box, step)
        cv2.imwrite(os.path.join(out_dir, 'layback-' + name + '.png'), out)
        print(name, out.shape)
