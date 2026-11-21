import sys
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from patch import FULL, MARGIN, film, luma, scene, step, to_linear, to_srgb, unfilm

Image.MAX_IMAGE_PIXELS = None
PX, PY = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
GEN = 'out/work/jupiter/gen'
RELIEF = 'out/work/jupiter/relief'
OUT = 'public/assets/jupiter'
GREY = 128
JOIN = 32
SOFT = 40
SEAM = 240
TILT = 3


def code(lin):
    return (to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8)


def lin_of(img):
    return unfilm(to_linear(np.asarray(img, dtype=np.float32) / 255))


def turn(a, edge):
    if edge == 'left':
        return a
    if edge == 'right':
        return a[:, ::-1]
    if edge == 'top':
        return a.transpose(1, 0, 2)
    return a.transpose(1, 0, 2)[:, ::-1]


def back(a, edge):
    if edge == 'left':
        return a
    if edge == 'right':
        return a[:, ::-1]
    if edge == 'top':
        return a.transpose(1, 0, 2)
    return a[:, ::-1].transpose(1, 0, 2)


def window(known, edge):
    m = PX if edge in ('left', 'right') else PY
    k = turn(known, edge)
    w = np.full(k.shape, GREY, np.uint8)
    w[:, m:] = code(k[:, :k.shape[1] - m])
    return np.ascontiguousarray(back(w, edge))


def bar(known, take, edge):
    m = PX if edge in ('left', 'right') else PY
    k = np.ascontiguousarray(turn(known, edge))
    t = np.ascontiguousarray(turn(scene(take, Image.LANCZOS, True), edge))
    width = k.shape[1]
    kept = k[:, :width - m]
    seen = t[:, m:]
    near = slice(0, 512)
    a = np.ascontiguousarray(luma(kept[:, near]) ** 0.5, dtype=np.float32)
    b = np.ascontiguousarray(luma(seen[:, near]) ** 0.5, dtype=np.float32)
    (dx, dy), score = cv2.phaseCorrelate(b, a)
    print('bar', edge, take, 'shift', round(dx, 2), round(dy, 2), 'score', round(score, 3))
    if abs(dx) > 8 or abs(dy) > 8:
        raise SystemExit('take is not aligned')
    t = np.stack([ndi.shift(t[..., i], (dy, dx), order=1, mode='nearest') for i in range(3)], -1)
    new = t[:, :m].copy()
    here = kept[:, :24]
    there = new[:, -24:]
    gap = ndi.gaussian_filter1d(np.median(here, 1) - np.median(there, 1), 12, axis=0, mode='nearest')
    print('  level step at the border x1000', (gap.mean(0) * 1000).round(2), (gap.min(0) * 1000).round(2), (gap.max(0) * 1000).round(2))
    rows = gap.shape[0]
    spec = np.fft.rfft(np.concatenate([gap, gap[::-1]], 0), axis=0)
    freq = np.fft.rfftfreq(2 * rows)[:, None]
    far = np.arange(m, 0, -1)
    for col in range(m):
        new[:, col] += np.fft.irfft(spec * np.exp(-2 * np.pi * freq * max(float(far[col]), 12.0)), 2 * rows, axis=0)[:rows]
    return np.ascontiguousarray(back(np.maximum(new, 0), edge))


def join(a, b, at, total):
    out = np.zeros((a.shape[0], total, 3), np.float32)
    out[:, :a.shape[1]] = a
    w = step(np.arange(total, dtype=np.float32), at - JOIN / 2, at + JOIN / 2)[None, :, None]
    right = np.zeros_like(out)
    right[:, total - b.shape[1]:] = b
    return out * (1 - w) + right * w


def sides(lin, name):
    left = bar(lin, f'{GEN}/{name}_left_sd5.png', 'left')
    right = bar(lin, f'{GEN}/{name}_right_sd5.png', 'right')
    return np.concatenate([left, lin, right], 1)


def inner(name):
    img = Image.open(f'{OUT}/full/{name}').convert('RGB')
    if img.size != (FULL[0] + 2 * PX, FULL[1] + 2 * PY):
        raise SystemExit('unexpected patch size')
    return np.asarray(img)[PY:PY + FULL[1], PX:PX + FULL[0]].copy()


def write(wide, core, name):
    out = code(wide)
    out[PY:PY + FULL[1], PX:PX + FULL[0]] = core
    img = Image.fromarray(out)
    img.save(f'{OUT}/full/{name}', lossless=True, quality=90, method=6)
    img.resize((img.size[0] // 2, img.size[1] // 2), Image.LANCZOS).save(f'{OUT}/web/{name}', lossless=True, quality=90, method=6)
    again = np.asarray(Image.open(f'{OUT}/full/{name}').convert('RGB'))[PY:PY + FULL[1], PX:PX + FULL[0]]
    print(name, 'inside the approved border unchanged:', bool((again == core).all()))
    Image.fromarray(np.clip(out.astype(np.float32) * 2.5, 0, 255).astype(np.uint8)).resize((1760, 990), Image.LANCZOS).save(f'out/work/view/{name[:-5]}-margins.jpg', quality=90)


def hold_prep():
    core = inner('sky-hold.webp')
    wide = sides(lin_of(core), 'skyext')
    np.save(f'{GEN}/skyext_wide1.npy', wide.astype(np.float32))
    for key, x0, edge in (('tl', 0, 'top'), ('tr', 2 * PX, 'top'), ('bl', 0, 'bottom'), ('br', 2 * PX, 'bottom')):
        Image.fromarray(window(wide[:, x0:x0 + FULL[0]], edge)).save(f'{GEN}/skyext_{key}_in.png')
        print('wrote', f'{GEN}/skyext_{key}_in.png')


def borrow(wide, x0, width, dx, dy):
    h = wide.shape[0]
    src = wide[h - PY - dy:h - dy, x0 + dx:x0 + dx + width]
    low = ndi.gaussian_filter(src, (24, 24, 0), mode='nearest')
    level = ndi.gaussian_filter1d(np.median(wide[h - 48:, x0:x0 + width], 0), 24, axis=0, mode='nearest')
    return np.maximum(src - low + level[None], 0)


def hold_place():
    core = inner('sky-hold.webp')
    wide = np.load(f'{GEN}/skyext_wide1.npy')
    total = wide.shape[1]
    la = bar(wide[:, :FULL[0]], f'{GEN}/skyext_tl_sd5.png', 'top')
    lb = bar(wide[:, 2 * PX:], f'{GEN}/skyext_tr_sd5.png', 'top')
    top = join(la, lb, total / 2, total)
    lb = bar(wide[:, 2 * PX:], f'{GEN}/skyext_br_sd5.png', 'bottom')
    bottom = join(borrow(wide, 0, 2 * PX + 2 * JOIN, 250, PY), lb, 2 * PX + JOIN, total)
    write(np.concatenate([top, wide, bottom], 0), core, 'sky-hold.webp')


def fields():
    oy, ox = 792, 1408
    box = (slice(oy - PY, oy + FULL[1] + PY), slice(ox - PX, ox + FULL[0] + PX))
    elev = np.load(f'{RELIEF}/canvas-elev.npy', mmap_mode='r')[box].astype(np.float32)
    phi = np.load(f'{RELIEF}/canvas-phi.npy', mmap_mode='r')[box].astype(np.float32)
    return elev, phi


def haze(lin, elev, phi):
    ins = (slice(PY, PY + FULL[1]), slice(PX, PX + FULL[0]))
    e, p = elev[ins], phi[ins]
    p0 = float(p.min())
    pb = np.round((p - p0) / 0.5).astype(int)
    n = int(pb.max()) + 1
    idx = np.arange(n)

    def table(mask, values):
        acc = np.zeros((n, 3))
        cnt = np.zeros(n)
        np.add.at(acc, pb[mask], values[mask].astype(np.float64))
        np.add.at(cnt, pb[mask], 1)
        have = cnt > 20
        return np.stack([np.interp(idx, idx[have], acc[have, c] / cnt[have]) for c in range(3)], 1).astype(np.float32)

    back = table((e > 0.02) & (e < 0.2), lin)
    grow = lambda v: 0.3 * (1 - np.exp(np.minimum(v, 0) / 1.5)) ** 2.5
    deep = e < -2.5
    far = table(deep, (lin - back[pb]) / np.maximum(grow(e), 1e-4)[..., None])
    again = far[pb] * grow(e)[..., None] + back[pb]
    low = e < 0.2
    print('haze formula against the patch below the horizon, worst and mean difference x1000', float(np.abs(again - lin)[low].max() * 1000), float(np.abs(again - lin)[low].mean() * 1000))
    pc = np.clip(np.round((phi - p0) / 0.5).astype(int), 0, n - 1)
    return far[pc] * grow(elev)[..., None] + back[pc]


def settle(wide, fill, elev):
    w = np.clip((elev - 0.25) / 0.15, 0, 1)[..., None]
    out = wide * w + fill * (1 - w)
    out[PY:PY + FULL[1], PX:PX + FULL[0]] = wide[PY:PY + FULL[1], PX:PX + FULL[0]]
    return out


def glow(elev, phi):
    rim = np.load(f'{RELIEF}/rim-table.npy')
    u = ((phi + 100.0) / 0.1).astype(np.float32)
    v = (elev / 0.025).astype(np.float32)
    return lin_of(cv2.remap(rim, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0))


def canvas_box():
    oy, ox = 792, 1408
    raw = np.load(f'{RELIEF}/canvas.npy', mmap_mode='r')
    box = np.array(raw[oy - PY:oy + FULL[1] + PY, ox - PX:ox + FULL[0] + PX], dtype=np.float32)
    image = np.asarray(Image.open('references/approved/jupiter-close.jpg').convert('RGB'), dtype=np.float32)
    rows = slice(PY, PY + FULL[1])
    box[rows, PX:PX + FULL[0]] = image
    x1 = PX + FULL[0]
    r = (image[:, -12:].mean(1) + 2.0) / (box[rows, x1:x1 + 12].mean(1) + 2.0)
    r = np.clip(ndi.gaussian_filter1d(r, 12, axis=0, mode='nearest'), 0.3, 3.0)
    print('right tile level ratio at the image border, 5 50 95 percent', np.percentile(r, [5, 50, 95]).round(3))
    fall = np.exp(-np.arange(PX) / 320.0)
    box[rows, x1:] *= 1 + (r[:, None, :] - 1) * fall[None, :, None]
    return np.clip(box, 0, 255)


def terrain_prep():
    box = canvas_box()
    np.save(f'{GEN}/skyterr_box.npy', box)
    body = lin_of(box[PY:PY + FULL[1]])
    for key, x0 in (('tl', 0), ('tr', 2 * PX)):
        Image.fromarray(window(body[:, x0:x0 + FULL[0]], 'top')).save(f'{GEN}/skyterr_{key}_in.png')
        print('wrote', f'{GEN}/skyterr_{key}_in.png')


def terrain_place(top='takes'):
    core = inner('sky-terrain.webp')
    box = np.load(f'{GEN}/skyterr_box.npy')
    body = lin_of(box[PY:PY + FULL[1]])
    total = body.shape[1]
    elev, phi = fields()
    wide = np.zeros((FULL[1] + 2 * PY, total, 3), np.float32)
    wide[PY:PY + FULL[1]] = body
    wide[:PY, :FULL[0]] = bar(body[:, :FULL[0]], f'{GEN}/skyterr_tl_sd5.png', 'top')
    other = wide.copy()
    other[:PY, 2 * PX:] = bar(body[:, 2 * PX:], f'{GEN}/skyterr_tr_sd5.png', 'top')
    shine = glow(elev, phi)
    own = np.maximum(wide - shine, 0)
    lin = lin_of(core)
    x1 = PX + FULL[0]
    rows = slice(PY, PY + FULL[1])
    gap = ndi.gaussian_filter1d(np.median(lin[:, -24:], 1) - np.median(own[rows, x1:x1 + 24], 1), 12, axis=0, mode='nearest')
    print('right margin level step x1000', (gap.mean(0) * 1000).round(2), (gap.min(0) * 1000).round(2), (gap.max(0) * 1000).round(2))
    n = gap.shape[0]
    spec = np.fft.rfft(np.concatenate([gap, gap[::-1]], 0), axis=0)
    freq = np.fft.rfftfreq(2 * n)[:, None]
    for col in range(PX):
        own[rows, x1 + col] += np.fft.irfft(spec * np.exp(-2 * np.pi * freq * max(col + 1.0, 12.0)), 2 * n, axis=0)[:n]
    own = np.maximum(own, 0)
    grey = luma(own[rows, x1:])[..., None]
    own[rows, x1:] = grey + (own[rows, x1:] - grey) * 0.35
    own[rows, PX:x1] = lin
    fill = haze(lin, elev, phi)
    seen = lambda a: to_srgb(film(a))
    fine = lambda a: a - ndi.gaussian_filter(a, (SOFT, SOFT, 0), mode='nearest')
    under = seen(settle(own, fill, elev)[PY:PY + 2 * SOFT])
    floor = ndi.gaussian_filter1d(np.median(under[:24], 0), 48, axis=0, mode='nearest')
    reach = np.clip(np.arange(total)[None, :] + TILT * np.arange(PY, 0, -1)[:, None], 0, total - 1).astype(int)
    level = floor[reach]
    grain = float(fine(under)[:, 2 * PX:].std())
    w = step(np.arange(total, dtype=np.float32), 2 * PX, 2 * PX + SEAM)[None, :, None]
    a = fine(seen(own[:PY]))
    b = fine(seen(np.maximum(other - shine, 0)[:PY]))
    print('star grain under the border and in the two takes x1000', round(grain * 1000, 2), round(float(a[:, 2 * PX:FULL[0]].std()) * 1000, 2), round(float(b[:, 2 * PX:].std()) * 1000, 2))
    stars = a * (1 - w) + b * w
    own[:PY] = unfilm(to_linear(np.clip(stars + level, 0, 1)))
    write(settle(own, fill, elev), core, 'sky-terrain.webp')


if __name__ == '__main__':
    {'hold-prep': hold_prep, 'hold-place': hold_place, 'terrain-prep': terrain_prep, 'terrain-place': terrain_place}[sys.argv[1]]()
