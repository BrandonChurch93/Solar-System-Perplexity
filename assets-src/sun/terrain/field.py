import json
import sys
import numpy as np
import cv2
from common import WORK, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, TX, TY, FEET, read, write, step, scene, display

OUT = 'public/assets/sun'
DIR = f'{WORK}/field'
SCALE = 320
SUPER = 3
BOX = (-4.6, 4.6, -3.2, 3.8)
TILE = 2048
BLOCK = 224
LAP = 56
TRIES = 260
SPOT_CLEAR = 1.35
FOOT_CLEAR = 0.7
RING = (0.75, 3.15)
PHI = 0.78
SEED = 20261121

T = json.load(open('src/stops/sun/terrain.json'))
A = json.load(open('src/stops/sun/apron.json'))
DOWN = np.array(T['down'], dtype=np.float64)
DOWN /= np.linalg.norm(DOWN)
RADIUS = T['radius']
CENTRE = DOWN * (RADIUS + 1)
FWD = np.array([0, 0, -1.0]) + DOWN * DOWN[2]
FWD /= np.linalg.norm(FWD)
RIGHT = np.cross(FWD, -DOWN)
RIGHT /= np.linalg.norm(RIGHT)


def limb(mu):
    m = np.maximum(mu, 0.1) - 0.1
    return 0.15 + 0.12 * np.exp(-m / 0.35) + 0.25 * np.exp(-m / 0.05)


def quat(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


def ground(gx, gy):
    y = np.sqrt(np.maximum(RADIUS * RADIUS - gx * gx - gy * gy, 0)) - RADIUS
    return DOWN[None, None, :] * (1 - y)[..., None] + RIGHT[None, None, :] * gx[..., None] + FWD[None, None, :] * gy[..., None]


def on_image(ax, ay):
    d = np.array([(ax - 0.5) * 2 * TX, (0.5 - ay) * 2 * TY, -1.0])
    d /= np.linalg.norm(d)
    b = d @ CENTRE
    t = b - np.sqrt(b * b - (CENTRE @ CENTRE - RADIUS * RADIUS))
    p = d * t - DOWN
    return np.array([p @ RIGHT, p @ FWD])


def grade_row(row):
    g = cv2.imread(f'{OUT}/full/grade.png', cv2.IMREAD_UNCHANGED)
    g = cv2.cvtColor(g, cv2.COLOR_BGRA2RGBA if g.shape[2] == 4 else cv2.COLOR_BGR2RGB)
    return g[row, :, :3].astype(np.float32) / 255


def graded(img, table):
    out = np.empty(img.shape, dtype=np.float32)
    for c in range(3):
        out[..., c] = table[:, c][img[..., c]]
    return out


def ortho():
    plate = read(f'{OUT}/full/plate.jpg')
    apron = read(f'{OUT}/full/apron.jpg')
    table = grade_row(0)
    s = SCALE * SUPER
    w = int(round((BOX[1] - BOX[0]) * s))
    h = int(round((BOX[3] - BOX[2]) * s))
    spot = on_image(*T['spot'])
    feet = [on_image(*f) for f in T['feet']]
    eye = np.array(A['position'], dtype=np.float64)
    q = A['quaternion']
    right = quat(q, np.array([1.0, 0, 0]))
    up = quat(q, np.array([0, 1.0, 0]))
    back = quat(q, np.array([0, 0, 1.0]))
    rel = eye - DOWN
    nadir = np.array([rel @ RIGHT, rel @ FWD])
    outs = {k: np.zeros((h // SUPER, w // SUPER, 3), np.float32) for k in ('plate', 'apron')}
    masks = {k: np.zeros((h // SUPER, w // SUPER), np.float32) for k in ('plate', 'apron')}
    band = 64 * SUPER
    for y0 in range(0, h, band):
        y1 = min(y0 + band, h)
        gx, gy = np.meshgrid(BOX[0] + (np.arange(w) + 0.5) / s, BOX[3] - (np.arange(y0, y1) + 0.5) / s)
        p = ground(gx, gy)
        normal = (p - CENTRE) / RADIUS
        clear = (np.hypot(gx - spot[0], gy - spot[1]) > SPOT_CLEAR)
        for f in feet:
            clear &= np.hypot(gx - f[0], gy - f[1]) > FOOT_CLEAR
        dist = np.linalg.norm(p, axis=-1)
        ax = p[..., 0] / np.maximum(-p[..., 2], 0.02) / (2 * TX) + 0.5
        ay = 0.5 - p[..., 1] / np.maximum(-p[..., 2], 0.02) / (2 * TY)
        px = (ax - LEFT) / SPAN * CANVAS[0] - 0.5
        py = (ay - TOP) / SPAN * CANVAS[1] - PLATE_TOP - 0.5
        graze = np.clip(-(normal * p).sum(-1) / dist, 0, 1)
        col = scene(graded(cv2.remap(plate, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT), table))
        col *= (limb(1.0) / limb(graze))[..., None]
        ring = np.hypot(gx, gy)
        phi = np.arctan2(gx - 0.0234, gy + 0.3764)
        ok = clear & (ring > RING[0]) & (ring < RING[1]) & (np.abs(phi) < PHI) & (-p[..., 2] > 0.3) & (ax > 0.02) & (ax < 0.98) & (ay < 0.98)
        outs['plate'][y0 // SUPER:y1 // SUPER] = cv2.resize(col, (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
        masks['plate'][y0 // SUPER:y1 // SUPER] = cv2.resize(ok.astype(np.float32), (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
        r = p - eye
        z = np.maximum(-(r @ back), 0.02)
        bx = (r @ right) / z / (2 * TX) + 0.5
        by = 0.5 - (r @ up) / z / (2 * TY)
        qx = bx * apron.shape[1] - 0.5
        qy = (by - A['top']) / (1 - A['top']) * apron.shape[0] - 0.5
        away = np.linalg.norm(r, axis=-1)
        seen = np.clip(-(normal * r).sum(-1) / away, 0, 1)
        col = scene(graded(cv2.remap(apron, qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT), table))
        col *= (limb(1.0) / limb(seen))[..., None]
        near = np.hypot(gx - nadir[0], gy - nadir[1])
        ok = clear & (bx > 0.03) & (bx < 0.97) & (by > A['top'] + 0.03) & (by < 0.97) & (near < A['near'][0]) & (-(r @ back) > 0.3)
        outs['apron'][y0 // SUPER:y1 // SUPER] = cv2.resize(col, (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
        masks['apron'][y0 // SUPER:y1 // SUPER] = cv2.resize(ok.astype(np.float32), (w // SUPER, (y1 - y0) // SUPER), interpolation=cv2.INTER_AREA)
    for k in outs:
        np.save(f'{DIR}/ortho-{k}.npy', outs[k])
        np.save(f'{DIR}/mask-{k}.npy', masks[k])
        show = display(outs[k]) * (0.35 + 0.65 * masks[k][..., None])
        write(f'{DIR}/ortho-{k}.jpg', show, 90)
    print('ortho', outs['plate'].shape, 'valid plate', float(masks['plate'].mean()), 'apron', float(masks['apron'].mean()))


if __name__ == '__main__':
    {'ortho': ortho}[sys.argv[1]]()
