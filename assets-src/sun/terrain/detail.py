import json, sys
import numpy as np
import cv2
from common import WORK, APPROVED, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, read, write, step

DIR = f'{WORK}/detail'
NATIVE = (2816, 1584)
FROM = 860
BAND = ((3, 12), (12, 48))
ZONE = (0.635, 0.705)
SPOT = (0.5237, 0.609, 0.33, 0.185, 0.6)
TONE = (150, 520)
CORNER = ((0.60, 1.0), (0.655, 0.83), (0.74, 0.735), (0.86, 0.69), (1.0, 0.67), (1.0, 1.0))
WIDEN = 90
EDGE = 48
FLOOR = 0.02
PEAK = (40, 1.9, 0.7)
CROP = 640


def band(a, lo, hi):
    g = a.astype(np.float32)
    return cv2.GaussianBlur(g, (0, 0), lo) - cv2.GaussianBlur(g, (0, 0), hi)


def agree(a, b, lo, hi, wide=60):
    x, y = band(a, lo, hi), band(b, lo, hi)
    num = cv2.GaussianBlur(x * y, (0, 0), wide)
    den = np.sqrt(cv2.GaussianBlur(x * x, (0, 0), wide) * cv2.GaussianBlur(y * y, (0, 0), wide)) + 1e-6
    return num / den


def place(take):
    src = read(APPROVED)
    new = cv2.resize(read(take), NATIVE, interpolation=cv2.INTER_LANCZOS4)
    w, h = NATIVE
    k = 4
    small = lambda a: cv2.resize(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), (w // k, h // k), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    keep = np.zeros((h // k, w // k), np.uint8)
    keep[int(0.12 * h / k):int(0.72 * h / k)] = 255
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(small(src), small(new), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), keep, 5)
    warp[:, 2] *= k
    moved = cv2.warpAffine(new, warp, NATIVE, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT_101)
    a = cv2.cvtColor(src, cv2.COLOR_RGB2GRAY)
    b = cv2.cvtColor(moved, cv2.COLOR_RGB2GRAY)
    out = {}
    for lo, hi in BAND:
        r = agree(a, b, lo, hi)
        np.save(f'{DIR}/agree-{lo}.npy', r.astype(np.float16))
        rows = slice(int(0.7 * h), h)
        out[f'{lo}-{hi}'] = [round(float(r[rows, i * w // 4:(i + 1) * w // 4].mean()), 3) for i in range(4)]
    write(f'{DIR}/moved.png', moved)
    json.dump({'take': take, 'matrix': warp.tolist(), 'cc': float(cc), 'agreement in the bottom 0.3, four columns': out}, open(f'{DIR}/place.json', 'w'), indent=1)
    print('cc', round(float(cc), 4), 'matrix', warp.round(5).tolist(), 'agreement, bottom 0.3 of the frame in four columns', out)


def weight():
    w, h = NATIVE
    v = (np.arange(h, dtype=np.float32) + 0.5) / h
    u = (np.arange(w, dtype=np.float32) + 0.5) / w
    rows = step(v, ZONE[0], ZONE[1])[:, None] * np.ones((1, w), np.float32)
    d = np.sqrt(((u[None, :] - SPOT[0]) / SPOT[2]) ** 2 + (np.maximum(v[:, None] - SPOT[1], 0) / SPOT[3]) ** 2)
    return (rows * step(d, SPOT[4], 1.0)).astype(np.float32)


def crop(take):
    a = read(take)
    write(f'{DIR}/take-low.png', a[CROP:])


def corner(w, h):
    m = np.zeros((h, w), np.uint8)
    cv2.fillPoly(m, [np.round(np.array(CORNER) * [w, h]).astype(np.int32)], 255)
    return m.astype(np.float32) / 255


def compose(out_full, out_web, check):
    base = read(f'{DIR}/plate-base.png')
    pw, ph = base.shape[1], base.shape[0]
    up = read(f'{DIR}/take-low-x2.png')
    info = json.load(open(f'{DIR}/place.json'))
    tw, th = cv2.imread(info['take']).shape[1::-1]
    m = np.vstack([np.array(info['matrix'], dtype=np.float64), [0, 0, 1]])
    k = CANVAS[0] / (SPAN * NATIVE[0])
    ox, oy = -LEFT / SPAN * CANVAS[0], -TOP / SPAN * CANVAS[1] - PLATE_TOP
    a = np.array([[1 / k, 0, (0.5 - ox) / k - 0.5], [0, 1 / k, (0.5 - oy) / k - 0.5], [0, 0, 1]])
    sx, sy = up.shape[1] / NATIVE[0], (up.shape[0] + 2 * CROP) / NATIVE[1]
    u = np.array([[sx, 0, 0.5 * sx - 0.5], [0, sy, 0.5 * sy - 0.5 - 2 * CROP], [0, 0, 1]])
    full = (u @ m @ a)[:2]
    print('plate px a take px', round(float(1 / full[0, 0]), 4), round(float(1 / full[1, 1]), 4), 'take size', tw, th)
    take = cv2.warpAffine(up, full, (pw, ph), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT_101).astype(np.float32) / 255
    del up
    b = base.astype(np.float32) / 255
    del base
    back = np.linalg.inv(a)[:2]
    wn = weight()
    w = cv2.warpAffine(wn, back, (pw, ph), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    cn = cv2.GaussianBlur(cv2.dilate(corner(*NATIVE), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (WIDEN, WIDEN))), (0, 0), WIDEN / 3)
    c = cv2.warpAffine(cn, back, (pw, ph), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    X = np.arange(pw, dtype=np.float32) + 0.5
    Y = np.arange(ph, dtype=np.float32) + 0.5
    edge = step(X, ox, ox + EDGE) * (1 - step(X, ox + k * NATIVE[0] - EDGE, ox + k * NATIVE[0]))
    w = w * edge[None, :] * (1 - step(Y, oy + k * NATIVE[1] - EDGE, oy + k * NATIVE[1]))[:, None]

    def low(x, s):
        q = 8
        small = cv2.resize(x, (pw // q, ph // q), interpolation=cv2.INTER_AREA)
        return cv2.resize(cv2.GaussianBlur(small, (0, 0), s / q), (pw, ph), interpolation=cv2.INTER_CUBIC)

    out = np.empty_like(b)
    for s, part in ((TONE[0], 1 - c), (TONE[1], c)):
        ratio = (low(b, s) + FLOOR) / (low(take, s) + FLOOR)
        if s == TONE[0]:
            out[:] = take * ratio * part[..., None]
        else:
            out += take * ratio * part[..., None]
        del ratio
    del take
    top = cv2.dilate(low(b, PEAK[0]), np.ones((3, 3), np.uint8)) * PEAK[1]
    over = np.maximum(out - top, 0)
    out -= over * PEAK[2]
    del over, top
    res = b + (np.clip(out, 0, 1) - b) * w[..., None]
    del out
    write(out_full, res, 92)
    write(out_web, cv2.resize(res, (pw // 2, ph // 2), interpolation=cv2.INTER_AREA), 88)
    r0, r1 = int(oy + k * NATIVE[1] * 0.5), int(oy + k * NATIVE[1])
    c0, c1 = int(ox), int(ox + k * NATIVE[0])
    write(check, np.concatenate([b[r0:r1, c0:c1], res[r0:r1, c0:c1]], 0), 90)
    print('changed share of the plate', round(float((w > 0.01).mean()), 3), 'mean before', (b[w > 0.5].mean(0) * 255).round(2).tolist(), 'after', (res[w > 0.5].mean(0) * 255).round(2).tolist())


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'place':
        place(sys.argv[2])
    if cmd == 'crop':
        crop(sys.argv[2])
    if cmd == 'compose':
        compose(*sys.argv[2:5])
