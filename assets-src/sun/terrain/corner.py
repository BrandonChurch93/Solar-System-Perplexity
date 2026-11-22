import json, sys
import numpy as np
import cv2
from common import APPROVED, read, write
import detail as D

TAG = 'W-1'
TAKE = f'{D.DIR}/plate-take-{TAG}.png'
BOX = (1400, 880)
FEATHER = 48
OUT = (5504, 1792)
ABOX = (1470, 840, 2752, 1490)


def place():
    src = read(APPROVED)
    new = cv2.resize(read(TAKE), D.NATIVE, interpolation=cv2.INTER_LANCZOS4)
    w, h = D.NATIVE
    k = 4
    small = lambda a: cv2.resize(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), (w // k, h // k), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    keep = np.zeros((h // k, w // k), np.uint8)
    keep[int(0.12 * h / k):int(0.72 * h / k)] = 255
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(small(src), small(new), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), keep, 5)
    warp[:, 2] *= k
    moved = cv2.warpAffine(new, warp, D.NATIVE, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT_101)
    a = cv2.cvtColor(src, cv2.COLOR_RGB2GRAY)
    b = cv2.cvtColor(moved, cv2.COLOR_RGB2GRAY)
    out = {}
    for lo, hi in D.BAND:
        r = D.agree(a, b, lo, hi)
        rows = slice(int(0.7 * h), h)
        out[f'{lo}-{hi}'] = [round(float(r[rows, i * w // 4:(i + 1) * w // 4].mean()), 3) for i in range(4)]
    json.dump({'take': TAKE, 'matrix': warp.tolist(), 'cc': float(cc), 'agreement in the bottom 0.3, four columns': out}, open(f'{D.DIR}/place-{TAG}.json', 'w'), indent=1)
    print('cc', round(float(cc), 4), 'matrix', warp.round(5).tolist(), 'agreement, bottom 0.3 of the frame in four columns', out)


def crop():
    a = read(TAKE)
    write(f'{D.DIR}/take-corner-{TAG}.png', a[BOX[1]:, BOX[0]:])
    print('corner part of the take', a[BOX[1]:, BOX[0]:].shape)


def paste():
    a = read(TAKE)[D.CROP:]
    full = cv2.resize(a, OUT, interpolation=cv2.INTER_CUBIC).astype(np.float32)
    up = read(f'{D.DIR}/take-corner-x2-{TAG}.png').astype(np.float32)
    y0, x0 = 2 * (BOX[1] - D.CROP), 2 * BOX[0]
    assert up.shape[0] == OUT[1] - y0 and up.shape[1] == OUT[0] - x0, up.shape
    yy = np.minimum(np.arange(up.shape[0], dtype=np.float32) / FEATHER, 1)[:, None]
    xx = np.minimum(np.arange(up.shape[1], dtype=np.float32) / FEATHER, 1)[None, :]
    m = (yy * xx)[..., None]
    full[y0:, x0:] = full[y0:, x0:] * (1 - m) + up * m
    write(f'{D.DIR}/take-low-x2-{TAG}.png', np.clip(full + 0.5, 0, 255).astype(np.uint8))
    print('wrote', f'{D.DIR}/take-low-x2-{TAG}.png', full.shape)


def apron_crop(tag):
    a = read(f'{D.DIR}/apron-take-{tag}.png')
    x0, y0, x1, y1 = ABOX
    write(f'{D.DIR}/apron-take-corner-{tag}.png', a[y0:y1, x0:x1])
    print('corner part of the take', a.shape, a[y0:y1, x0:x1].shape)


def apron_paste(tag):
    a = read(f'{D.DIR}/apron-take-{tag}.png')[D.APRON_CROP:]
    full = cv2.resize(a, (2 * a.shape[1], 2 * a.shape[0]), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    up = read(f'{D.DIR}/apron-take-corner-x2-{tag}.png').astype(np.float32)
    x0, y0, x1, y1 = ABOX
    assert up.shape[:2] == (2 * (y1 - y0), 2 * (x1 - x0)), up.shape
    ramp = lambda n, lo, hi: np.minimum(np.minimum(np.arange(n, dtype=np.float32) / FEATHER if lo else 1, (n - 1 - np.arange(n, dtype=np.float32)) / FEATHER if hi else 1), 1)
    m = (ramp(up.shape[0], True, y1 < a.shape[0] + D.APRON_CROP)[:, None] * ramp(up.shape[1], True, x1 < a.shape[1])[None, :])[..., None]
    ys, xs = slice(2 * (y0 - D.APRON_CROP), 2 * (y1 - D.APRON_CROP)), slice(2 * x0, 2 * x1)
    full[ys, xs] = full[ys, xs] * (1 - m) + up * m
    write(f'{D.DIR}/apron-take-low-x2-{tag}.png', np.clip(full + 0.5, 0, 255).astype(np.uint8))
    print('wrote', f'{D.DIR}/apron-take-low-x2-{tag}.png', full.shape)


def hybrid(old, new, base, out):
    a, b, n = (cv2.imread(p, cv2.IMREAD_UNCHANGED) for p in (old, new, base))
    m = (a[..., :3] != b[..., :3]).any(2)
    n = n.copy()
    n[m] = b[m]
    cv2.imwrite(out, n)
    print('px taken from the new render', int(m.sum()))


def sketch(old, new, base, tag):
    a, b, n = (cv2.imread(p, cv2.IMREAD_UNCHANGED)[..., :3] for p in (old, new, base))
    m = (a != b).any(2)
    n = n.copy()
    n[m] = b[m]
    w, h = D.APRON_CANVAS
    small = cv2.cvtColor(cv2.resize(n, (w, h), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    img = read(f'{D.DIR}/apron-base.png')
    part = cv2.resize(m.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA) > 0
    img[part] = small[part]
    grey = cv2.cvtColor(read(f'{D.DIR}/apron-grey.png'), cv2.COLOR_RGB2GRAY) > 0
    lines, cells = D.apron_net(img)
    out = img.copy()
    out[grey] = 128
    out[grey & lines] = 25
    write(f'{D.DIR}/apron-base-{tag}.png', img)
    write(f'{D.DIR}/apron-input-{tag}.png', out)
    before = cv2.cvtColor(read(f'{D.DIR}/apron-lines-A-5.png'), cv2.COLOR_RGB2GRAY) > 0
    ys, xs = np.nonzero(before != (grey & lines))
    print('px of the picture taken from the new plate', int(part.sum()), 'cells in the grey area', len(np.unique(cells[grey])), 'lines changed in rows', int(ys.min()), int(ys.max()), 'columns', int(xs.min()), int(xs.max()))


if __name__ == '__main__':
    {'place': place, 'crop': crop, 'paste': paste, 'hybrid': hybrid, 'sketch': sketch, 'apron-crop': apron_crop, 'apron-paste': apron_paste}[sys.argv[1]](*sys.argv[2:])
