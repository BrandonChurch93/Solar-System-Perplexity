import json, os, sys
import numpy as np
import cv2
from common import WORK, APPROVED, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, TX, TY, read, write, step

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
PEAK = (72, 0.75)
HUE = (48, 1.5)
CROP = 640
APRON_OUT = (5504, 1548)
APRON_CROP = 688
APRON_FIT = (0.36, 0.6, 0.1, 0.9)
APRON_LANES = ('A-6', 6, 0.95, 0.9, (0.85, 1.05, 1.25), 60, 0.6, 40)
APRON_UNEVEN = (20261121, 70, 0.45)
APRON_VEINS = ('A-5', 1.6, 1.1, 0.8)
APRON_CROWN = (-0.3, 0.9)
APRON_FLOOR = 0.03
APRON_MATCH = (110, 0.8, 1.25, 0.1, 0.7, 1.45)
APRON_HOLD = (0.55, 0.9, 0.75)
APRON_BRIGHT = (0.66, 0.84, 0.5, 3)
APRON_SPLIT = (2.2, 0.3, 1.5)
APRON_KEEP = 0.85
APRON_WARM = (0.5, 1.0, 2.2)
APRON_PEAK = (96, 0.75)
APRON_SKY = (0.02, 0.1)
APRON_CANVAS = (1920, 1080)
APRON_NET = (5.5, 9.0, 640, 1.6, 2.0, 2)


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
    back = a[:2]
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
    q = 4
    small = cv2.resize(b, (pw // q, ph // q), interpolation=cv2.INTER_AREA)
    top = cv2.dilate(small, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (PEAK[0] // q, PEAK[0] // q)))
    top = cv2.resize(cv2.GaussianBlur(top, (0, 0), PEAK[0] / q / 3), (pw, ph), interpolation=cv2.INTER_LINEAR)
    out -= np.maximum(out - top, 0) * PEAK[1]
    del top, small
    np.clip(out, 0, 1, out=out)
    ref = b[int(oy + k * NATIVE[1] * 0.5):int(oy + k * NATIVE[1]):3, int(ox):int(ox + k * NATIVE[0]):3].reshape(-1, 3)
    bins = np.linspace(0, 1, HUE[0] + 1)
    mid = (bins[:-1] + bins[1:]) / 2
    idx = np.clip(np.digitize(ref[:, 0], bins) - 1, 0, HUE[0] - 1)
    red = out[..., 0]
    for ch in (1, 2):
        lo_, hi_ = np.zeros(HUE[0]), np.zeros(HUE[0])
        for i in range(HUE[0]):
            sel = ref[idx == i]
            if len(sel) > 200:
                rr = sel[:, ch] / np.maximum(sel[:, 0], 1e-3)
                lo_[i], hi_[i] = np.percentile(rr, HUE[1]), np.percentile(rr, 100 - HUE[1])
            else:
                lo_[i], hi_[i] = np.nan, np.nan
        ok = ~np.isnan(lo_)
        lo_ = np.interp(mid, mid[ok], lo_[ok])
        hi_ = np.interp(mid, mid[ok], hi_[ok])
        before = out[..., ch].copy()
        out[..., ch] = np.clip(out[..., ch], red * np.interp(red, mid, lo_).astype(np.float32), red * np.interp(red, mid, hi_).astype(np.float32))
        print('hue clamp channel', ch, 'share of the changed area moved by more than 2 levels', round(float((np.abs(out[..., ch] - before)[w > 0.5] > 2 / 255).mean()), 4))
        del before
    res = b + (np.clip(out, 0, 1) - b) * w[..., None]
    del out
    write(out_full, res, 92)
    write(out_web, cv2.resize(res, (pw // 2, ph // 2), interpolation=cv2.INTER_AREA), 88)
    r0, r1 = int(oy + k * NATIVE[1] * 0.5), int(oy + k * NATIVE[1])
    c0, c1 = int(ox), int(ox + k * NATIVE[0])
    write(check, np.concatenate([b[r0:r1, c0:c1], res[r0:r1, c0:c1]], 0), 90)
    print('changed share of the plate', round(float((w > 0.01).mean()), 3), 'mean before', (b[w > 0.5].mean(0) * 255).round(2).tolist(), 'after', (res[w > 0.5].mean(0) * 255).round(2).tolist())


def front():
    from field import A, CENTRE, RADIUS, quat
    w, h = APRON_CANVAS
    wide = A.get('wide', 1.0)
    eye = np.array(A['position'], dtype=np.float64)
    q = A['quaternion']
    X, Y = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    d = np.stack([(X - 0.5) * 2 * TX / wide, (0.5 - Y) * 2 * TY / wide, -np.ones_like(X)], -1).reshape(-1, 3)
    u = np.array(q[:3])
    d = d + 2 * np.cross(u, np.cross(u, d) + q[3] * d)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    oc = eye - CENTRE
    b = d @ oc
    disc = b * b - (oc @ oc - RADIUS * RADIUS)
    hit = disc > 0
    t = -b - np.sqrt(np.maximum(disc, 0))
    p = eye + d * t[:, None]
    z = np.maximum(-p[:, 2], 1e-3)
    ax = (p[:, 0] / z / (2 * TX) + 0.5).reshape(h, w)
    ay = (0.5 - p[:, 1] / z / (2 * TY)).reshape(h, w)
    f = A['front']
    line = f['side'] + (f['centre'] - f['side']) * (1 - step(np.abs(ax - f['at']), f['span'][0], f['span'][1]))
    inner = (np.abs(X - 0.5) < 0.5 * wide) & (np.abs(Y - 0.5) < 0.5 * wide)
    return ax.astype(np.float32), ay.astype(np.float32), line.astype(np.float32), hit.reshape(h, w), inner, wide


def apron_grey(base):
    ax, ay, line, hit, inner, wide = front()
    w, h = APRON_CANVAS
    src = read(base)
    k = wide * w / src.shape[1]
    m = np.array([[k, 0, 0.5 * (w - k * src.shape[1]) + 0.5 * k - 0.5], [0, k, 0.5 * (h - k * src.shape[0]) + 0.5 * k - 0.5]])
    img = cv2.warpAffine(src, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    grey = (hit & (ay > line)) | ~inner
    out = img.copy()
    out[grey] = 128
    write(f'{DIR}/apron-base.png', img)
    write(f'{DIR}/apron-input.png', out)
    write(f'{DIR}/apron-grey.png', np.repeat((grey * 255).astype(np.uint8)[..., None], 3, -1))
    ys = np.where((grey & inner).any(1))[0]
    inside = (ax > 0) & (ax < 1) & (ay > 0) & (ay < 1)
    cols = np.where(inside.any(0))[0]
    rows = np.where(inside.any(1))[0]
    print('wide', wide, 'grey share', round(float(grey.mean()), 3), 'first grey row inside the picture', int(ys.min()), 'approved frame in this picture: columns', int(cols.min()), int(cols.max()), 'rows', int(rows.min()), int(rows.max()))


def apron_net(img):
    from skimage.segmentation import watershed, find_boundaries
    from skimage.feature import peak_local_max
    h, w = img.shape[:2]
    lum = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    top, bottom, row, apart, fine, width = APRON_NET
    t = np.clip((np.arange(h) - row) / (h - row), 0, 1)[:, None].astype(np.float32)
    lv = [cv2.GaussianBlur(lum, (0, 0), s) for s in (top, (top + bottom) / 2, bottom)]
    x = np.where(t < 0.5, lv[0] + (lv[1] - lv[0]) * t * 2, lv[1] + (lv[2] - lv[1]) * (t * 2 - 1))
    peaks = peak_local_max(x, min_distance=int(top * apart), exclude_border=False)
    marks = np.zeros((h, w), np.int32)
    marks[peaks[:, 0], peaks[:, 1]] = np.arange(len(peaks)) + 1
    cells = watershed(-(0.5 * x + 0.5 * cv2.GaussianBlur(lum, (0, 0), fine)), marks)
    lines = find_boundaries(cells, mode='inner')
    return cv2.dilate(lines.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (width, width))) > 0, cells


def apron_sketch(base):
    apron_grey(base)
    img = read(f'{DIR}/apron-base.png')
    grey = cv2.cvtColor(read(f'{DIR}/apron-grey.png'), cv2.COLOR_RGB2GRAY) > 0
    lines, cells = apron_net(img)
    out = read(f'{DIR}/apron-input.png')
    out[grey & lines] = 25
    write(f'{DIR}/apron-input.png', out)
    write(f'{DIR}/apron-lines.png', np.repeat(((grey & lines) * 255).astype(np.uint8)[..., None], 3, -1))
    print('cells in the grey area', len(np.unique(cells[grey])), 'across the bottom row', len(np.unique(cells[-3])))


def apron_place(take):
    base = read(f'{DIR}/apron-base.png')
    h, w = base.shape[:2]
    new = cv2.resize(read(take), (w, h), interpolation=cv2.INTER_AREA)
    k = 2
    small = lambda a: cv2.resize(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), (w // k, h // k), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    keep = np.zeros((h // k, w // k), np.uint8)
    keep[int(APRON_FIT[0] * h / k):int(APRON_FIT[1] * h / k), int(APRON_FIT[2] * w / k):int(APRON_FIT[3] * w / k)] = 255
    keep[cv2.resize(cv2.cvtColor(read(f'{DIR}/apron-grey.png'), cv2.COLOR_RGB2GRAY), (w // k, h // k), interpolation=cv2.INTER_AREA) > 0] = 0
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(small(base), small(new), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), keep, 5)
    warp[:, 2] *= k
    moved = cv2.warpAffine(new, warp, (w, h), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT_101)
    a = cv2.cvtColor(base, cv2.COLOR_RGB2GRAY)
    b = cv2.cvtColor(moved, cv2.COLOR_RGB2GRAY)
    r = agree(a, b, 2, 8, 30)
    rows = [(0.5, 0.62), (0.62, 0.8), (0.8, 1.0)]
    out = [[round(float(r[int(v0 * h):int(v1 * h), i * w // 5:(i + 1) * w // 5].mean()), 2) for i in range(5)] for v0, v1 in rows]
    write(f'{DIR}/apron-moved.png', moved)
    json.dump({'take': take, 'matrix': warp.tolist(), 'cc': float(cc), 'agreement': out}, open(f'{DIR}/apron-place.json', 'w'), indent=1)
    a0 = read(take)
    write(f'{DIR}/apron-take-low.png', a0[APRON_CROP:])
    print('cc', round(float(cc), 4), 'matrix', warp.round(5).tolist(), 'band agreement 2 to 8 px, rows', rows, 'in five columns', out)


def apron_layer(tag, shape, sigma):
    h, w = shape
    info = json.load(open(f'{DIR}/apron-place-{tag}.json'))
    up = read(f'{DIR}/apron-take-low-x2-{tag}.png')
    ow, oh = APRON_OUT
    s = ow / w
    a = np.array([[1 / s, 0, 0.5 / s - 0.5], [0, 1 / s, 0.5 / s - 0.5 + h * 0.5], [0, 0, 1]])
    m = np.vstack([np.array(info['matrix'], dtype=np.float64), [0, 0, 1]])
    sx, sy = up.shape[1] / w, (up.shape[0] + 2 * APRON_CROP) / h
    u = np.array([[sx, 0, 0.5 * sx - 0.5], [0, sy, 0.5 * sy - 0.5 - 2 * APRON_CROP], [0, 0, 1]])
    full = (u @ m @ a)[:2]
    take = cv2.warpAffine(up, full, (ow, oh), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT_101).astype(np.float32) / 255
    lt = np.log(take @ np.array([0.299, 0.587, 0.114], np.float32) + APRON_FLOOR)
    return lt - cv2.GaussianBlur(lt, (0, 0), sigma * s), a


def apron_build(out_full, out_web, check):
    h, w = read(f'{DIR}/apron-base.png').shape[:2]
    ow, oh = APRON_OUT
    s = ow / w
    b = read(f'{DIR}/apron-base-low-x.png').astype(np.float32) / 255
    assert b.shape[:2] == (oh, ow)
    key = np.array([0.299, 0.587, 0.114], np.float32)
    tag, sigma, gain, crown, tint, soft, lift, tone = APRON_LANES
    e, a = apron_layer(tag, (h, w), sigma)
    grey = cv2.cvtColor(read(f'{DIR}/apron-grey.png'), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    grey = cv2.warpAffine(grey, a[:2], (ow, oh), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    grey = step(cv2.distanceTransform((grey > 0.5).astype(np.uint8), cv2.DIST_L2, 5), 0, soft * s)

    def low(x, sig):
        q = 4
        small = cv2.resize(x, (ow // q, oh // q), interpolation=cv2.INTER_AREA)
        return cv2.resize(cv2.GaussianBlur(small, (0, 0), sig / q), (ow, oh), interpolation=cv2.INTER_CUBIC)

    lb = b @ key
    band = low(lb, 2.5 * s) - low(lb, 10 * s)
    band /= np.sqrt(low(band * band, 30 * s)) + 1e-4
    rng = np.random.default_rng(APRON_UNEVEN[0])
    vary = cv2.resize(rng.random((oh // int(APRON_UNEVEN[1] * s) + 2, ow // int(APRON_UNEVEN[1] * s) + 2), dtype=np.float32), (ow, oh), interpolation=cv2.INTER_CUBIC)
    vary = APRON_UNEVEN[2] + (1 - APRON_UNEVEN[2]) * step(vary, 0.25, 0.75)
    bright = step(lb, APRON_BRIGHT[0], APRON_BRIGHT[1])
    fine = e - cv2.GaussianBlur(e, (0, 0), APRON_SPLIT[0] * s)
    e = (e - fine) * APRON_SPLIT[1] + fine * APRON_SPLIT[2]
    del fine
    e *= np.where(e < 0, gain * vary * (1 - APRON_BRIGHT[2] * bright) * (1 - crown * step(band, APRON_CROWN[0], APRON_CROWN[1])), lift)
    del vary
    del band, lb
    tag, sigma, gain, up = APRON_VEINS
    v, _ = apron_layer(tag, (h, w), sigma)
    e += v * np.where(v < 0, gain * (1 - APRON_BRIGHT[2] * bright), gain * up)
    del v
    e *= grey
    hue = np.array(tint, np.float32) + (np.array(APRON_WARM, np.float32) - np.array(tint, np.float32)) * bright[..., None]
    del bright
    out = b * np.exp(e[..., None] * np.where(e[..., None] < 0, hue, 1))
    del e, hue
    q = 4
    small = cv2.resize(b, (ow // q, oh // q), interpolation=cv2.INTER_AREA)
    top = cv2.dilate(small, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (APRON_PEAK[0] // q, APRON_PEAK[0] // q)))
    top = cv2.resize(cv2.GaussianBlur(top, (0, 0), APRON_PEAK[0] / q / 3), (ow, oh), interpolation=cv2.INTER_LINEAR)
    out -= np.maximum(out - top, 0) * APRON_PEAK[1]
    del top, small
    for _ in range(APRON_BRIGHT[3]):
        keep = 1 - APRON_KEEP * step(out @ key, APRON_BRIGHT[0], APRON_BRIGHT[1])
        for ch in range(3):
            r = (low(b[..., ch], tone * s) + APRON_FLOOR) / (low(out[..., ch], tone * s) + APRON_FLOOR)
            out[..., ch] *= 1 + (r - 1) * np.where(r > 1, keep, 1)
        del keep
    if os.path.exists(f'{DIR}/apron-tone.npy'):
        t = cv2.resize(np.load(f'{DIR}/apron-tone.npy'), (ow, oh), interpolation=cv2.INTER_CUBIC)
        out *= 1 + (t - 1) * np.where(t > 1, 1 - APRON_HOLD[2] * step(out.max(2), APRON_HOLD[0], APRON_HOLD[1])[..., None], 1)
        del t
    np.clip(out, 0, 1, out=out)
    sky = step(np.arange(oh, dtype=np.float32), APRON_SKY[0] * oh, APRON_SKY[1] * oh)[:, None, None]
    res = b + (out - b) * sky
    write(out_full, res, 92)
    write(out_web, cv2.resize(res, (ow // 2, oh // 2), interpolation=cv2.INTER_AREA), 88)
    write(check, np.concatenate([cv2.resize(b, (w, h // 2), interpolation=cv2.INTER_AREA), cv2.resize(res, (w, h // 2), interpolation=cv2.INTER_AREA)], 0), 92)
    print('mean before', (b[oh // 4:].mean((0, 1)) * 255).round(2).tolist(), 'after', (res[oh // 4:].mean((0, 1)) * 255).round(2).tolist())


def apron_tone(frame):
    ax, ay, line, hit, inner, wide = front()
    w, h = APRON_CANVAS
    film = read(frame).astype(np.float32) / 255
    ref = cv2.resize(read(APPROVED), (film.shape[1], film.shape[0]), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255
    sigma, lo, hi = APRON_MATCH[:3]
    ratio = (cv2.GaussianBlur(ref, (0, 0), sigma) + APRON_FLOOR) / (cv2.GaussianBlur(film, (0, 0), sigma) + APRON_FLOOR)
    ratio = np.clip(ratio, lo, hi)
    mx = np.clip(ax, 0, 1) * film.shape[1] - 0.5
    my = np.clip(ay, 0, 1) * film.shape[0] - 0.5
    t = cv2.remap(ratio, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    away = np.maximum(np.maximum(-ax, ax - 1), np.maximum(-ay, ay - 1))
    t = 1 + (t - 1) * (1 - step(away, 0, APRON_MATCH[3]))[..., None]
    t[~hit] = 1
    t = t[h // 2:]
    path = f'{DIR}/apron-tone.npy'
    if os.path.exists(path):
        t = t * np.load(path)
    t = np.clip(t, APRON_MATCH[4], APRON_MATCH[5])
    np.save(path, t.astype(np.float32))
    zone = (hit & (ay > line) & (ay < 1) & (ax > 0) & (ax < 1))[h // 2:]
    print('tone factor in the front zone, mean r g b', t[zone].mean(0).round(4).tolist(), 'range', round(float(t[zone].min()), 3), round(float(t[zone].max()), 3))


def apron_base(frame):
    src = read(frame)
    ow, oh = APRON_OUT
    low = src[src.shape[0] // 2:]
    write(f'{DIR}/apron-base-low-x.png', cv2.resize(low, (ow, oh), interpolation=cv2.INTER_LANCZOS4))
    print('base', src.shape, 'lower half to', (ow, oh))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'place':
        place(sys.argv[2])
    if cmd == 'crop':
        crop(sys.argv[2])
    if cmd == 'compose':
        compose(*sys.argv[2:5])
    if cmd == 'apron-grey':
        apron_grey(sys.argv[2])
    if cmd == 'apron-sketch':
        apron_sketch(sys.argv[2])
    if cmd == 'apron-place':
        apron_place(sys.argv[2])
    if cmd == 'apron-tone':
        apron_tone(sys.argv[2])
    if cmd == 'apron-base':
        apron_base(sys.argv[2])
    if cmd == 'apron-build':
        apron_build(*sys.argv[2:5])
