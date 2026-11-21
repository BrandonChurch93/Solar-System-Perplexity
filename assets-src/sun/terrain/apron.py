import json, sys
import numpy as np
import cv2
from common import WORK, APPROVED, TX, TY, read, write, step

A = json.load(open('src/stops/sun/apron.json'))
T = json.load(open('src/stops/sun/terrain.json'))
SIZE = (2816, 1584)
GREY_FROM = 0.4
KEEP_TO = 0.5
BLEND = 0.12


def rotate(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


def weights(size=SIZE):
    w, h = size
    down = np.array(T['down']); down /= np.linalg.norm(down)
    fwd = np.array([0, 0, -1.0]) + down * down[2]; fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, -down); right /= np.linalg.norm(right)
    radius = T['radius']
    centre = down * (radius + 1)
    ty = np.tan(np.radians(A['vfovDeg']) / 2); tx = ty * 16 / 9
    eye = np.array(A['position'])
    u, v = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    d = np.stack([(u - 0.5) * 2 * tx, (0.5 - v) * 2 * ty, -np.ones_like(u)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    d = rotate(A['quaternion'], d)
    oc = eye - centre
    b = d @ oc
    disc = b * b - (oc @ oc - radius * radius)
    hit = (disc > 0) & (-b - np.sqrt(np.maximum(disc, 0)) > 0)
    p = eye + d * (-b - np.sqrt(np.maximum(disc, 0)))[..., None]
    z = np.maximum(-p[..., 2], 0.02)
    ax = p[..., 0] / z / (2 * TX) + 0.5
    ay = 0.5 - p[..., 1] / z / (2 * TY)
    f = A['feather']
    inside = step(ax, 0, f) * step(1 - ax, 0, f) * step(1 - ay, 0, f)
    rel = p - down
    g = np.stack([rel @ right, rel @ fwd], -1)
    n0 = np.array([(eye - down) @ right, (eye - down) @ fwd])
    near = 1 - step(np.linalg.norm(g - n0, axis=-1), A['near'][0], A['near'][1])
    return np.where(hit, (1 - inside) * near, 0).astype(np.float32), hit


def mask():
    base = read(f'{WORK}/apron-base.png')
    base = cv2.resize(base, SIZE, interpolation=cv2.INTER_LANCZOS4)
    w, hit = weights()
    grey = w >= GREY_FROM
    out = base.copy()
    out[grey] = 128
    write(f'{WORK}/apron-input.png', out)
    write(f'{WORK}/apron-weight.png', np.repeat((w * 255).astype(np.uint8)[..., None], 3, -1))
    rows = np.where(w.max(axis=1) > 0)[0]
    print('grey share of the frame', round(float(grey.mean()), 3), 'first row with weight', int(rows[0]), 'of', SIZE[1], '(top', round(rows[0] / SIZE[1], 3), ')')


if __name__ == '__main__':
    if sys.argv[1] == 'mask':
        mask()


TAKE = 'apron-fill-take2'
OUT = (5504, 1548)


def register():
    take = read(f'{WORK}/{TAKE}.png')
    h, w = take.shape[:2]
    base = cv2.resize(read(f'{WORK}/apron-base.png'), (w, h), interpolation=cv2.INTER_AREA)
    wt, hit = weights((w, h))
    keep = ((wt < 0.05) & hit).astype(np.uint8) * 255
    keep = cv2.erode(keep, np.ones((25, 25), np.uint8))
    g0 = cv2.cvtColor(base, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    g1 = cv2.cvtColor(take, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(g0, g1, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), keep, 5)
    moved = cv2.warpAffine(take, warp, (w, h), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    m = keep > 0
    a = base[m].astype(np.float64)
    b = moved[m].astype(np.float64)
    gain = [float(np.polyfit(b[:, c], a[:, c], 1)[0]) for c in range(3)]
    offs = [float(np.polyfit(b[:, c], a[:, c], 1)[1]) for c in range(3)]
    print('cc', round(float(cc), 4), 'matrix', warp.round(5).tolist(), 'kept ground: mean abs difference', round(float(np.abs(a - b).mean()), 2), 'means base', a.mean(0).round(1), 'take', b.mean(0).round(1), 'gain', np.round(gain, 3), 'offset', np.round(offs, 1))
    json.dump({'matrix': warp.tolist(), 'size': [w, h], 'means': [a.mean(0).tolist(), b.mean(0).tolist()]}, open(f'{WORK}/apron-register.json', 'w'))
    write(f'{WORK}/apron-registered.png', moved)
    write(f'{WORK}/apron-crop.png', take[int(h * 0.44):])


def build():
    reg = json.load(open(f'{WORK}/apron-register.json'))
    w, h = reg['size']
    up = read(f'{WORK}/apron-crop-x2.png')
    k = up.shape[1] / w
    row = int(h * 0.44)
    m = np.vstack([np.array(reg['matrix']), [0, 0, 1]])
    grid = np.array([[w / OUT[0], 0, (w / OUT[0] - 1) / 2], [0, h * (1 - A['top']) / OUT[1], h * A['top'] + (h * (1 - A['top']) / OUT[1] - 1) / 2], [0, 0, 1]])
    crop = np.array([[k, 0, (k - 1) / 2], [0, k, -row * k + (k - 1) / 2], [0, 0, 1]])
    full = crop @ m @ grid
    out = cv2.warpAffine(up, full[:2], OUT, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    a, b = np.array(reg['means'][0]), np.array(reg['means'][1])
    o = out.astype(np.float32)
    hot = step(o.max(axis=2), 170, 245)[..., None]
    out = np.clip(o * ((a / b)[None, None, :] * (1 - hot) + hot), 0, 255).astype(np.uint8)
    for name, size, q in (('full', OUT, 92), ('web', (OUT[0] // 2, OUT[1] // 2), 88)):
        write(f'public/assets/sun/{name}/apron.jpg', out if size == OUT else cv2.resize(out, size, interpolation=cv2.INTER_AREA), q)
    print('apron', OUT)


if __name__ == '__main__':
    if sys.argv[1] == 'register':
        register()
    if sys.argv[1] == 'build':
        build()
