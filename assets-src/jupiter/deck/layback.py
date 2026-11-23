import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

ROOT = os.path.join(geom.HERE, '..', '..', '..')


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def filmic(x):
    x = np.maximum(x, 0)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def canvas_display():
    c = geom.DECK['tool']['canvas']
    wide = cv2.imread(os.path.join(ROOT, c['file']), cv2.IMREAD_COLOR).astype(np.float32)
    assert wide.shape[1] == geom.W and wide.shape[0] == geom.H
    img = cv2.imread(os.path.join(ROOT, 'references', 'approved', 'jupiter-close.jpg'), cv2.IMREAD_COLOR).astype(np.float32)
    ys, xs = np.mgrid[0:geom.H0, 0:geom.W0]
    edge = np.minimum(np.minimum(xs, geom.W0 - 1 - xs), np.minimum(ys, geom.H0 - 1 - ys)).astype(np.float32)
    t = np.clip((edge - c['feather'][0]) / (c['feather'][1] - c['feather'][0]), 0, 1)
    w = (t * t * (3 - 2 * t))[..., None]
    part = wide[geom.OY:geom.OY + geom.H0, geom.OX:geom.OX + geom.W0]
    wide[geom.OY:geom.OY + geom.H0, geom.OX:geom.OX + geom.W0] = part * (1 - w) + img * w
    return wide[..., ::-1] / 255


def core_display():
    c = geom.DECK['tool']['canvas']['core']
    k = c['scale']
    core = cv2.imread(os.path.join(ROOT, c['file']), cv2.IMREAD_COLOR).astype(np.float32)[..., ::-1] / 255
    assert core.shape[1] == geom.W0 * k and core.shape[0] == geom.H0 * k
    img = canvas_display()[geom.OY:geom.OY + geom.H0, geom.OX:geom.OX + geom.W0]
    up = cv2.resize(np.ascontiguousarray(img), (geom.W0 * k, geom.H0 * k), interpolation=cv2.INTER_CUBIC)
    core = core + cv2.GaussianBlur(up - core, (0, 0), c['lockPx'])
    return np.clip(core, 0, 1)


def approved_scene():
    return inverse_filmic(srgb_to_linear(canvas_display().astype(np.float64))).astype(np.float32)


def grid(cx, cy, size, n):
    step = size / n
    gx = cx - size / 2 + (np.arange(n) + 0.5) * step
    gy = cy - size / 2 + (np.arange(n) + 0.5) * step
    return np.meshgrid(gx, gy)


def layback(scene, cx, cy, size, n, lift=0.0):
    gx, gy = grid(cx, cy, size, n)
    p = geom.from_chart(gx, gy, lift)
    px, py = geom.project(p)
    toc = p - geom.CENTRE
    up = toc / np.linalg.norm(toc, axis=-1, keepdims=True)
    dist = np.linalg.norm(p, axis=-1)
    graze = np.einsum('...k,...k->...', up, -p) / dist
    seen = (p[..., 2] < 0) & (graze > 0) & (px >= 0) & (px <= geom.W - 1) & (py >= 0) & (py <= geom.H - 1)
    across = dist / geom.F
    along = across / np.maximum(graze, 1e-4)
    out = cv2.remap(scene, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out, seen, along, across, dist


def blur_to(field, weight, sigma_px, levels=(0.0, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0)):
    flat = field.ndim == 2
    if flat:
        field = field[..., None]
    stack = []
    for s in levels:
        num, den = field * weight[..., None], weight
        if s > 0:
            num = cv2.GaussianBlur(num, (0, 0), s).reshape(field.shape)
            den = cv2.GaussianBlur(den, (0, 0), s)
        stack.append((num, den))
    lv = np.array(levels)
    pos = np.interp(np.log2(np.maximum(sigma_px, 0.5)), np.log2(np.maximum(lv, 0.5)), np.arange(len(lv)))
    lo = np.clip(np.floor(pos).astype(int), 0, len(lv) - 2)
    t = pos - lo
    num = np.zeros_like(field)
    den = np.zeros_like(weight)
    for i in range(len(lv) - 1):
        m = lo == i
        if not m.any():
            continue
        a, b = stack[i], stack[i + 1]
        num[m] = a[0][m] * (1 - t[m])[..., None] + b[0][m] * t[m][..., None]
        den[m] = a[1][m] * (1 - t[m]) + b[1][m] * t[m]
    out = num / np.maximum(den, 1e-6)[..., None]
    return (out[..., 0] if flat else out), den


if __name__ == '__main__':
    out_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    scene = approved_scene()
    for name, (cx, cy, size, n) in {'near': (0.0, 2.0, 20.48, 2048), 'far': (0.0, 2.0, 163.84, 2048)}.items():
        rgb, seen, along, across, dist = layback(scene, cx, cy, size, n)
        step = size / n
        soft, den = blur_to(rgb, seen.astype(np.float32), (along / step).astype(np.float32))
        show = (linear_to_srgb(filmic(soft)) * 255).astype(np.uint8)
        show[den < 0.5] = (40, 0, 40)
        cv2.imwrite(os.path.join(out_dir, 'lay-' + name + '.png'), show[::-1, :, ::-1])
        print(name, 'seen share', round(float(seen.mean()), 4), 'along at storm', round(float(along[np.abs(grid(cx, cy, size, n)[0]) + np.abs(grid(cx, cy, size, n)[1]) < step * 2].mean()), 4))
