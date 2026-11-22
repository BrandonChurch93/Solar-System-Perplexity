import sys

import cv2
import numpy as np


def rotation(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def undo(im, q, vfov=30.0):
    h, w = im.shape[:2]
    f = 0.5 * h / np.tan(np.radians(vfov) / 2)
    a = np.array([[1 / f, 0, -0.5 * w / f], [0, -1 / f, 0.5 * h / f], [0, 0, -1]])
    m = np.linalg.inv(a) @ rotation(q).T @ a
    return cv2.warpPerspective(im, m, (w, h), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


def main():
    src, out, q = sys.argv[1], sys.argv[2], [float(v) for v in sys.argv[3].split(',')]
    vfov = float(sys.argv[4]) if len(sys.argv) > 4 else 30.0
    cv2.imwrite(out, undo(cv2.imread(src, cv2.IMREAD_UNCHANGED), q, vfov))
    print(out)


if __name__ == '__main__':
    main()
