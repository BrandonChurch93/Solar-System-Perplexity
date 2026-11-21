import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
SPOT = json.loads((HERE / 'spot.json').read_text())['spot']
N = np.array(SPOT['direction'])
E = np.array(SPOT['east'])
U = np.array(SPOT['north'])


def half_tan(width_deg):
    return float(np.tan(np.radians(width_deg) / 2))


def grid(width_deg, size):
    t = half_tan(width_deg)
    a = ((np.arange(size) + 0.5) / size * 2 - 1) * t
    x, y = np.meshgrid(a, -a)
    d = N[None, None, :] + x[..., None] * E[None, None, :] + y[..., None] * U[None, None, :]
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def to_patch(eq, width_deg, size):
    h, w = eq.shape[:2]
    d = grid(width_deg, size)
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    mx = ((lon / (2 * np.pi) + 0.5) * w - 0.5).astype(np.float32)
    my = ((0.5 - lat / np.pi) * h - 0.5).astype(np.float32)
    pad = cv2.copyMakeBorder(eq, 0, 0, 8, 8, cv2.BORDER_WRAP)
    return cv2.remap(pad, mx + 8, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def subpatch(parent, parent_deg, child_deg, size):
    k = half_tan(child_deg) / half_tan(parent_deg)
    n = parent.shape[0]
    a = (((np.arange(size) + 0.5) / size * 2 - 1) * k * 0.5 + 0.5) * n - 0.5
    mx, my = np.meshgrid(a.astype(np.float32), a.astype(np.float32))
    inter = cv2.INTER_LANCZOS4 if k * n <= size else cv2.INTER_AREA
    if k * n > size:
        c0 = int(round((0.5 - k * 0.5) * n))
        c1 = int(round((0.5 + k * 0.5) * n))
        return cv2.resize(parent[c0:c1, c0:c1], (size, size), interpolation=inter)
    return cv2.remap(parent, mx, my, inter, borderMode=cv2.BORDER_REPLICATE)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def nest(parent, parent_deg, child, child_deg, feather=0.12):
    k = half_tan(child_deg) / half_tan(parent_deg)
    n = parent.shape[0]
    a = (((np.arange(n) + 0.5) / n * 2 - 1) / k) * 0.5
    qx, qy = np.meshgrid(a, a)
    w = smooth(0.5, 0.5 - feather, np.maximum(np.abs(qx), np.abs(qy))).astype(np.float32)
    m = child.shape[0]
    mx = ((qx + 0.5) * m - 0.5).astype(np.float32)
    my = ((qy + 0.5) * m - 0.5).astype(np.float32)
    small = cv2.GaussianBlur(child, (0, 0), max(0.5 / (k * n / m) * 0.5, 0.01)) if k * n < m else child
    c = cv2.remap(small, mx, my, cv2.INTER_AREA if k * n < m else cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    return parent * (1 - w[..., None]) + c * w[..., None]


def read(path):
    return cv2.imread(str(path), cv2.IMREAD_COLOR).astype(np.float32) / 255


def write(path, img, quality=94):
    out = np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)
    if str(path).endswith('.jpg'):
        cv2.imwrite(str(path), out, [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    else:
        cv2.imwrite(str(path), out)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'to-patch':
        write(sys.argv[5], to_patch(read(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4])))
    elif cmd == 'subpatch':
        write(sys.argv[6], subpatch(read(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5])))
    elif cmd == 'nest':
        write(sys.argv[6], nest(read(sys.argv[2]), float(sys.argv[3]), read(sys.argv[4]), float(sys.argv[5])))
