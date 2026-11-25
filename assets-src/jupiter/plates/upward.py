import os
import subprocess
import sys
import tempfile

import cv2
import jpeglib
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import globe as G
import prep
from globe import ROOT
from layback import filmic, inverse_filmic, linear_to_srgb, srgb_to_linear
from prep import CFG, PL, PLACE, axes, grade

SETS = ('full', 'web')
UP = PL['upward']
VORTEX = PLACE['vortex']
LOCAL = PLACE['solved']['local']
TO_SURFACE = np.array(PLACE['solved']['toSurface'])


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def field(folder, name, gx, gy):
    cfg = CFG[name]
    n = cfg['pixels']
    raw = np.fromfile(os.path.join(folder, 'deck-' + name + '.bin'), dtype=np.uint16).reshape(3, n, n).astype(np.float32) / 65535 * cfg['scale']
    half = 0.5 / CFG['tone']['pixels']
    u = np.clip((gx - cfg['centre'][0]) / cfg['size'] + 0.5, half, 1 - half)
    v = np.clip((cfg['centre'][1] - gy) / cfg['size'] + 0.5, half, 1 - half)
    x = (u * n - 0.5).astype(np.float32)
    y = (v * n - 0.5).astype(np.float32)
    return np.stack([cv2.remap(raw[c], x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in range(3)], -1)


def storm(folder):
    m = PL['mid']
    n = cv2.imread(os.path.join(folder, 'plate-mid.png'), cv2.IMREAD_UNCHANGED).shape[0]
    grid = {**m, 'pixels': [n, n]}
    step = m['size'][0] / n
    gx, gy = axes(grid)
    X, Y = np.meshgrid(gx, gy)
    join = CFG['look']['join']
    total = np.zeros((n, n, 4), np.float32)
    left = np.ones((n, n), np.float32)
    for name in ('fore', 'near', 'mid'):
        pl = PL[name]
        plate = cv2.imread(os.path.join(folder, 'plate-' + name + '.png'), cv2.IMREAD_UNCHANGED)[::-1]
        coded = np.concatenate([srgb_to_linear(plate[..., 2::-1].astype(np.float64) / 255), plate[..., 3:].astype(np.float64) / 255], -1).astype(np.float32)
        own = {**pl, 'pixels': [plate.shape[1], plate.shape[0]]}
        if step > pl['size'][0] / plate.shape[1]:
            own = {**pl, 'pixels': [int(round(pl['size'][0] / step)), int(round(pl['size'][1] / step))]}
            coded = cv2.resize(coded, tuple(own['pixels']), interpolation=cv2.INTER_AREA)
        reach = np.maximum(np.abs(X - pl['centre'][0]) * 2 / pl['size'][0], np.abs(Y - pl['centre'][1]) * 2 / pl['size'][1])
        w = left * (1 - smooth(join[0], join[1], reach)).astype(np.float32) if name != 'mid' else left
        total += at(coded, own, X, Y) * w[..., None]
        left = left - w
    coded = total[..., :3]
    seen = inverse_filmic(coded.astype(np.float64)) / grade() * field(folder, 'tone', X, Y) * field(folder, 'calm', X, Y)
    return coded, filmic(seen).astype(np.float32), total[..., 3] * 255


def reduced(picture, texel):
    m = PL['mid']
    n = max(int(round(m['size'][0] / texel)), 8)
    if n >= picture.shape[0]:
        return picture, {**m, 'pixels': [picture.shape[1], picture.shape[0]]}
    return cv2.resize(picture, (n, n), interpolation=cv2.INTER_AREA), {**m, 'pixels': [n, n]}


def at(picture, grid, X, Y):
    gx, gy = axes(grid)
    x = ((X - gx[0]) / (gx[1] - gx[0])).astype(np.float32)
    y = ((Y - gy[0]) / (gy[1] - gy[0])).astype(np.float32)
    return cv2.remap(picture, x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def border(X, Y):
    return 1 - smooth(UP['border'][0], UP['border'][1], np.hypot(X - VORTEX[0], Y - VORTEX[1]))


def rest(o):
    n, e, u = G.frame(G.direction(G.SPOT['lon'], G.SPOT['lat']))
    ax = np.sin(np.radians(G.SPOT['axes']))
    q = np.stack([o @ e, o @ u], -1) / ax
    r = np.linalg.norm(q, axis=-1)
    turn = (1 - G.smoothstep(G.SPOT['core'], G.SPOT['reach'], r)) * (0.55 + 0.45 * G.smoothstep(0, G.SPOT['core'], r))
    a = -turn * np.radians(G.FLOW['swirl']) * LOCAL
    c, s = np.cos(a), np.sin(a)
    q0 = np.stack([c * q[..., 0] - s * q[..., 1], s * q[..., 0] + c * q[..., 1]], -1) * ax
    back = n * np.sqrt(np.maximum(1 - np.sum(q0 * q0, -1), 0))[..., None] + e * q0[..., :1] + u * q0[..., 1:]
    back /= np.linalg.norm(back, axis=-1, keepdims=True)
    lat = np.arcsin(np.clip(back[..., 1], -1, 1))
    jet = np.interp(np.clip(lat / np.pi + 0.5, 0, 1) * (len(G.JET) - 1), np.arange(len(G.JET)), G.JET)
    d = back
    for i in range(40):
        p = np.stack([d @ e, d @ u], -1)
        inside = (d @ n >= 0) * (1 - G.smoothstep(G.SPOT['reach'] * 0.75, G.SPOT['reach'] * 1.4, np.linalg.norm(p / ax, axis=-1)))
        d = G.spin_y(back, -jet * (1 - inside) * np.radians(G.FLOW['band']) * LOCAL)
    return d


def chart(o):
    d = rest(o)
    error = np.abs(G.flowed(d, LOCAL) - o).max()
    p = d @ TO_SURFACE
    q = G.geom.CENTRE + G.geom.R * p - G.geom.S
    return q @ G.geom.EX, q @ G.geom.EY, p @ G.geom.EN > 0.5, error


def window(X, Y, front):
    w = border(X, Y) * front
    rows = np.nonzero(w.max(1) > 0)[0]
    cols = np.nonzero(w.max(0) > 0)[0]
    return w, (rows[0] // 8 * 8, rows[-1] // 8 * 8 + 8, cols[0] // 8 * 8, cols[-1] // 8 * 8 + 8)


def blocks(a):
    h, w = a.shape
    return a.reshape(h // 8, 8, w // 8, 8).transpose(0, 2, 1, 3)


def dct(a):
    out = np.empty_like(a)
    for i in range(a.shape[0]):
        for j in range(a.shape[1]):
            out[i, j] = cv2.dct(a[i, j])
    return out


def texel_at(X, Y):
    i, j = np.unravel_index(np.argmin(np.hypot(X - VORTEX[0], Y - VORTEX[1])), X.shape)
    i, j = min(max(i, 1), X.shape[0] - 2), min(max(j, 1), X.shape[1] - 2)
    a, b = (X[i, j + 1] - X[i, j - 1]) / 2, (X[i + 1, j] - X[i - 1, j]) / 2
    c, d = (Y[i, j + 1] - Y[i, j - 1]) / 2, (Y[i + 1, j] - Y[i - 1, j]) / 2
    return float(np.sqrt(abs(a * d - b * c)))


def write_jpeg(src, dst, directions, seen):
    im = jpeglib.read_dct(src)
    h, w = im.Y.shape[0] * 8, im.Y.shape[1] * 8
    o, box = directions(h, w)
    X, Y, front, error = chart(o)
    texel = texel_at(X, Y)
    wgt, (r0, r1, c0, c1) = window(X, Y, front)
    sl = (slice(r0, r1), slice(c0, c1))
    r0, r1, c0, c1 = r0 + box[0], r1 + box[0], c0 + box[1], c1 + box[1]
    old = jpeglib.read_spatial(src).spatial[r0:r1, c0:c1].astype(np.float64)
    small, grid = reduced(seen, texel)
    small = cv2.GaussianBlur(small, (0, 0), UP['spread'][os.path.basename(dst)] * grid['pixels'][0] / PL['mid']['size'][0])
    k = wgt[sl][..., None]
    mixed = srgb_to_linear(old / 255) * (1 - k) + at(small, grid, X[sl], Y[sl]) * k
    rgb = np.clip(linear_to_srgb(mixed), 0, 1) * 255
    ycc = np.stack([0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2], -0.168736 * rgb[..., 0] - 0.331264 * rgb[..., 1] + 0.5 * rgb[..., 2] + 128, 0.5 * rgb[..., 0] - 0.418688 * rgb[..., 1] - 0.081312 * rgb[..., 2] + 128], -1)
    touched = blocks(wgt[sl]).max((2, 3)) > 0
    for c, name in enumerate(('Y', 'Cb', 'Cr')):
        plane = getattr(im, name)
        q = im.qt[im.quant_tbl_no[c]].astype(np.float64)
        coded = np.round(dct(blocks(ycc[..., c] - 128).astype(np.float64)) / q).astype(plane.dtype)
        part = plane[r0 // 8:r1 // 8, c0 // 8:c1 // 8]
        part[touched] = coded[touched]
    im.write_dct(dst)
    return dict(file=os.path.basename(dst), box=[int(r0), int(r1), int(c0), int(c1)], blocks=int(touched.sum()), texel=round(texel, 4), spreadTexels=round(UP['spread'][os.path.basename(dst)] * grid['pixels'][0] / PL['mid']['size'][0], 3), flowError=float(error))


def wrap_directions(h, w):
    o0 = G.flowed(prep.P.surface(np.array(VORTEX[0]), np.array(VORTEX[1]), PLACE), LOCAL)
    lon0, lat0 = G.lonlat(o0)
    reach = np.degrees(UP['border'][1] / G.geom.R) + UP['marginDeg']
    j0, j1 = int((lon0 - reach + 180) / 360 * w) // 8 * 8, int((lon0 + reach + 180) / 360 * w) // 8 * 8 + 8
    i0, i1 = int((90 - lat0 - reach) / 180 * h) // 8 * 8, int((90 - lat0 + reach) / 180 * h) // 8 * 8 + 8
    lon = (np.arange(j0, j1) + 0.5) / w * 360 - 180
    lat = 90 - (np.arange(i0, i1) + 0.5) / h * 180
    LON, LAT = np.meshgrid(lon, lat)
    return G.direction(LON, LAT), (i0, j0)


def patch_directions(level):
    def directions(h, w):
        n, e, u = G.frame(G.direction(G.PATCHES['centre']['lon'], G.PATCHES['centre']['lat']))
        span = 2 * np.tan(np.radians(level['widthDeg']) / 2)
        o0 = G.flowed(prep.P.surface(np.array(VORTEX[0]), np.array(VORTEX[1]), PLACE), LOCAL)
        reach = UP['border'][1] / G.geom.R + np.radians(UP['marginDeg'])
        off = np.arccos(np.clip(o0 @ n, -1, 1))
        half = reach / np.cos(min(off + reach, 1.4)) ** 2 / span
        q0 = np.array([o0 @ e, o0 @ u]) / (o0 @ n) / span
        j0, j1 = int(np.clip((q0[0] - half + 0.5) * w, 0, w)) // 8 * 8, min(int(np.clip((q0[0] + half + 0.5) * w, 0, w)) // 8 * 8 + 8, w)
        i0, i1 = int(np.clip((0.5 - q0[1] - half) * h, 0, h)) // 8 * 8, min(int(np.clip((0.5 - q0[1] + half) * h, 0, h)) // 8 * 8 + 8, h)
        qx = ((np.arange(j0, j1) + 0.5) / w - 0.5) * span
        qy = (0.5 - (np.arange(i0, i1) + 0.5) / h) * span
        QX, QY = np.meshgrid(qx, qy)
        o = n + QX[..., None] * e + QY[..., None] * u
        return o / np.linalg.norm(o, axis=-1, keepdims=True), (i0, j0)
    return directions


def before(path):
    if 'from' not in UP:
        return path
    rel = os.path.relpath(path, ROOT)
    raw = subprocess.run(['git', 'show', UP['from'] + ':' + rel], cwd=ROOT, check=True, capture_output=True).stdout
    kept = os.path.join(tempfile.gettempdir(), 'upward-' + rel.replace(os.sep, '-'))
    with open(kept, 'wb') as f:
        f.write(raw)
    return kept


def write_far(src, dst, coded, alpha):
    plate = cv2.imread(os.path.join(src, 'plate-far.png'), cv2.IMREAD_UNCHANGED)[::-1].copy()
    f = {**PL['far'], 'pixels': [plate.shape[1], plate.shape[0]]}
    gx, gy = axes(f)
    X, Y = np.meshgrid(gx, gy)
    w, (r0, r1, c0, c1) = window(X, Y, np.ones(X.shape))
    sl = (slice(r0, r1), slice(c0, c1))
    texel = f['size'][0] / f['pixels'][0]
    small, grid = reduced(coded, texel)
    k = w[sl][..., None]
    mixed = srgb_to_linear(plate[sl][..., 2::-1].astype(np.float64) / 255) * (1 - k) + at(small, grid, X[sl], Y[sl]) * k
    plate[sl][..., 2::-1] = np.round(np.clip(linear_to_srgb(mixed), 0, 1) * 255).astype(np.uint8)
    small, grid = reduced(alpha, texel)
    plate[sl][..., 3] = np.round(plate[sl][..., 3] * (1 - k[..., 0]) + at(small, grid, X[sl], Y[sl]) * k[..., 0]).astype(np.uint8)
    cv2.imwrite(os.path.join(dst, 'plate-far.png'), plate[::-1])
    return dict(file='plate-far.png', box=[int(r0), int(r1), int(c0), int(c1)])


if __name__ == '__main__':
    source = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'public', 'assets', 'jupiter')
    target = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'public', 'assets', 'jupiter')
    for name in SETS:
        src = os.path.join(source, name)
        dst = os.path.join(target, name)
        os.makedirs(dst, exist_ok=True)
        coded, seen, alpha = storm(src)
        rows = []
        if 'far' in UP['levels']:
            rows.append(write_far(src, dst, coded, alpha))
        if 'wrap' in UP['levels']:
            rows.append(write_jpeg(before(os.path.join(src, 'wrap-color.jpg')), os.path.join(dst, 'wrap-color.jpg'), wrap_directions, seen))
        if 'patches' in UP['levels']:
            for level in G.PATCHES['levels']:
                rows.append(write_jpeg(before(os.path.join(src, level['file'])), os.path.join(dst, level['file']), patch_directions(level), seen))
        for row in rows:
            print(name, row)
