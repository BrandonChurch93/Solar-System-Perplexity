import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
import ring
from layback import WORK, centre

Image.MAX_IMAGE_PIXELS = None
PUBLIC = g.ROOT / 'public/assets/earth'
HOLD = WORK / 'hold'
PLATES = g.PLACE['plates']
SPOT = g.G.T @ g.SPOT
P = centre()
SIGMA = PLATES['toneSigmaDeg']
FEATHER = PLATES['feather']
KEPT = PLATES['holdCommit']
MEND = json.loads((Path(__file__).resolve().parent / 'mend.json').read_text())


def hold_level(deg):
    HOLD.mkdir(parents=True, exist_ok=True)
    path = HOLD / ('patch-%d.jpg' % deg)
    if not path.exists():
        path.write_bytes(subprocess.run(['git', 'show', '%s:public/assets/earth/full/patch-%d.jpg' % (KEPT, deg)], cwd=g.ROOT, check=True, capture_output=True).stdout)
    return cv2.imread(str(path)).astype(np.float32)


class Win:
    def __init__(self, c, deg, n, raster=None, offset=(0, 0)):
        self.c, self.deg, self.n = c, deg, int(n)
        self.raster = raster or n
        self.x0 = (self.raster - n) / 2 + offset[0]
        self.y0 = (self.raster - n) / 2 - offset[1]

    def tangent(self):
        half = np.tan(np.radians(self.deg) / 2)
        i = np.arange(self.n) + 0.5
        return ((i + self.x0) / self.raster - 0.5) * 2 * half, ((i + self.y0) / self.raster - 0.5) * 2 * half

    def same(self, other):
        return self.c is other.c and self.deg == other.deg and self.raster == other.raster


def win_of(level, c):
    return Win(c, level['widthDeg'], level['size'], level['raster'], level['offset'])


def rep(src, sw, dw, chunk=512, signed=False):
    f = 1.0
    r = (sw.raster / sw.deg) / (dw.raster / dw.deg)
    if r > 1.5:
        m = int(round(sw.n / r))
        src = cv2.resize(src, (m, m), interpolation=cv2.INTER_AREA)
        f = m / sw.n
    n, e, u = g.frame_at(dw.c)
    tx, ty = dw.tangent()
    out = np.zeros((dw.n, dw.n) + src.shape[2:], np.float32)
    ok = np.zeros((dw.n, dw.n), bool)
    for y0 in range(0, dw.n, chunk):
        y1 = min(y0 + chunk, dw.n)
        d = n + tx[None, :, None] * e - ty[y0:y1, None, None] * u
        x, y = g.plate_xy(sw.c, sw.deg, d)
        px = (x * sw.raster - sw.x0) * f
        py = (y * sw.raster - sw.y0) * f
        out[y0:y1] = cv2.remap(src, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LINEAR if signed else cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        ok[y0:y1] = ((d @ g.unit(sw.c)) > 0) & (px > 0) & (px < sw.n * f) & (py > 0) & (py < sw.n * f)
    return out, ok


def cut(src, sw, dw):
    assert sw.same(dw)
    ax, ay = int(round(dw.x0 - sw.x0)), int(round(dw.y0 - sw.y0))
    assert abs(dw.x0 - sw.x0 - ax) < 1e-6 and abs(dw.y0 - sw.y0 - ay) < 1e-6
    xs = np.arange(dw.n) + ax
    ys = np.arange(dw.n) + ay
    out = src[np.clip(ys, 0, sw.n - 1)][:, np.clip(xs, 0, sw.n - 1)]
    return out, np.outer((ys >= 0) & (ys < sw.n), (xs >= 0) & (xs < sw.n))


def reproject(src, src_c, src_deg, dst_c, dst_deg, size, chunk=512, signed=False):
    return rep(src, Win(src_c, src_deg, src.shape[0]), Win(dst_c, dst_deg, size), chunk, signed)


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def foot(dw, sw, chunk=512):
    n, e, u = g.frame_at(dw.c)
    tx, ty = dw.tangent()
    w = np.zeros((dw.n, dw.n), np.float32)
    for y0 in range(0, dw.n, chunk):
        y1 = min(y0 + chunk, dw.n)
        d = n + tx[None, :, None] * e - ty[y0:y1, None, None] * u
        x, y = g.plate_xy(sw.c, sw.deg, d)
        q = np.maximum(np.abs((x * sw.raster - sw.x0) / sw.n - 0.5), np.abs((y * sw.raster - sw.y0) / sw.n - 0.5))
        w[y0:y1] = step(0.5, 0.5 - FEATHER, q) * ((d @ g.unit(sw.c)) > 0)
    return w


def footprint(dst_c, dst_deg, size, src_c, src_deg, chunk=512):
    return foot(Win(dst_c, dst_deg, size), Win(src_c, src_deg, 1), chunk)


def inward(ok, px):
    return step(0.5, 1.0, cv2.GaussianBlur(ok.astype(np.float32), (0, 0), px))[..., None]


def low(img, per_deg):
    return cv2.GaussianBlur(img, (0, 0), SIGMA * per_deg)


def save(path, img, n=None):
    im = Image.fromarray(cv2.cvtColor(np.clip(img + 0.5, 0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))
    if n and n != im.width:
        im = im.resize((n, n), Image.LANCZOS)
    im.save(PUBLIC / 'full' / path, quality=94, subsampling=0)
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(PUBLIC / 'web' / path, quality=94, subsampling=0)


def fine_lay(dw):
    reach = int(2 * max(abs(dw.x0 - (dw.raster - dw.n) / 2), abs(dw.y0 - (dw.raster - dw.n) / 2)))
    n = dw.n + reach
    deg = float(np.degrees(2 * np.arctan(n / dw.raster * np.tan(np.radians(dw.deg) / 2))))
    name = 'qf-%d-%d' % (dw.raster, n)
    if not (WORK / (name + '-sharp.npy')).exists():
        subprocess.run([sys.executable, str(Path(__file__).resolve().parent / 'plate.py'), repr(deg), str(n), name], cwd=g.ROOT, check=True)
    whole = Win(dw.c, dw.deg, n, dw.raster)
    lay, _ = cut(cv2.imread(str(WORK / (name + '-lay.png'))).astype(np.float32), whole, dw)
    inside, _ = cut(np.load(WORK / (name + '-inside.npy')).astype(np.float32), whole, dw)
    sharp, _ = cut(np.load(WORK / (name + '-sharp.npy')).astype(np.float32), whole, dw)
    return lay, inside, sharp


def cast(comp, deg, spec):
    from farin import CANVAS, reach
    from layback import layback
    n = comp.shape[0]
    lay, _, inside = layback(cv2.imread(str(CANVAS)), 1, deg, n)
    cover = step(0.5, 1.0, cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), spec['edgeDeg'] * n / deg))
    dist = reach(P, deg, n)
    pick = (cover > 0.9) & (dist >= spec['measureDeg'][0]) & (dist < spec['measureDeg'][1])

    def bright(img):
        v = img[pick]
        lum = v.mean(axis=1)
        lo, hi = np.percentile(lum, spec['bright'])
        return v[(lum >= lo) & (lum <= hi)].mean(axis=0)

    lay = lay.astype(np.float32)
    mean = (bright(lay) / bright(comp)).astype(np.float32)
    both = (cover * step(spec['cloud'][0], spec['cloud'][1], lay.min(axis=2)) * step(spec['cloud'][0], spec['cloud'][1], comp.min(axis=2)))[..., None]
    s = spec['wideDeg'] * n / deg
    share = cv2.GaussianBlur(both, (0, 0), s)
    local = cv2.GaussianBlur(lay * both, (0, 0), s) / np.maximum(cv2.GaussianBlur(comp * both, (0, 0), s), 1e-3)
    trust = step(spec['share'][0], spec['share'][1], share)[..., None]
    gain = np.clip(mean * (1 - trust) + local * trust, spec['limit'][0], spec['limit'][1]).astype(np.float32)
    return gain, mean, cover * step(spec['fromDeg'][0], spec['fromDeg'][1], dist)


def graded(hold, gain):
    cloud = np.clip((hold.min(axis=2, keepdims=True) - 150) / 60, 0, 1)
    return hold * gain * (1 - cloud) + hold * cloud


def open_sea(img, spec):
    cloud = np.clip((img.min(axis=2, keepdims=True) - 150) / 60, 0, 1)
    return (1 - cloud) * step(spec['blue'][0], spec['blue'][1], img[..., 0:1] - img[..., 2:3])


def field():
    spec = MEND['field']
    colour = np.load(WORK / 'field-colour.npy').astype(np.float32)
    both = np.dstack([np.load(WORK / 'field-alpha.npy'), np.load(WORK / 'field-shade.npy')]).astype(np.float32) / 255
    return {'colour': colour, 'both': both, 'win': Win(P, spec['widthDeg'], spec['raster'])}


def field_at(fl, dw):
    c, ok = rep(fl['colour'], fl['win'], dw, signed=True)
    b, _ = rep(fl['both'], fl['win'], dw, signed=True)
    ok = ok[..., None]
    return np.clip(c, 0, 255) * ok, np.clip(b[..., 0:1], 0, 1) * ok, 1 - (1 - np.clip(b[..., 1:2], 0, 1)) * ok


def field_on(img, fl, dw, white):
    c, a, s = field_at(fl, dw)
    return img * s * (1 - a) + c * white


def wiped(img, spec):
    near = np.zeros(img.shape[:2], np.uint8)
    f = img.shape[0] / 4096
    for x, y, r in spec['discs']:
        cv2.circle(near, (int(round(x * f)), int(round(y * f))), int(round(r * f * spec['reach'])), 255, -1)
    k = 2 * spec['growPx'] + 1
    m = cv2.dilate(((img.min(axis=2) > spec['bright']) & (near > 0)).astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    fixed = cv2.inpaint(np.clip(img + 0.5, 0, 255).astype(np.uint8), m, 5, cv2.INPAINT_TELEA).astype(np.float32)
    w = cv2.GaussianBlur(cv2.dilate(m, np.ones((5, 5), np.uint8)).astype(np.float32) / 255, (0, 0), spec['softPx'])[..., None]
    return img * (1 - w) + fixed * w


def main():
    from calm import calm
    from farin import reach as from_nadir
    deg = PLATES['levels'][0]['widthDeg']
    g12 = cv2.imread(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else 'q12-g.png'))).astype(np.float32)
    size = PLATES['size']
    if g12.shape[0] != size:
        g12 = cv2.resize(g12, (size, size), interpolation=cv2.INTER_LANCZOS4)
    whole = Win(P, deg, size)
    inside12 = (np.load(WORK / 'q12-inside.npy') > 0.99).astype(np.float32)
    lw = PLATES['low']
    cover = step(0.5, 1.0, cv2.GaussianBlur(inside12, (0, 0), lw['edgeDeg'] * size / deg))[..., None]
    g12 = wiped(g12, MEND['wipe'])
    fw = win_of(PLATES['levels'][1], P)
    edge = MEND['calm']['fineFadeDeg'] * size / deg
    i = (np.arange(size) + 0.5) * fw.raster / size
    bx = step(0, edge, np.minimum(i - fw.x0, fw.x0 + fw.n - i) * size / fw.raster)
    by = step(0, edge, np.minimum(i - fw.y0, fw.y0 + fw.n - i) * size / fw.raster)
    g12, land = calm(g12, deg, {**MEND['calm'], **MEND['calm']['plate']}, keep=1 - cover[..., 0] * by[:, None] * bx[None, :])
    print('plate calmed, land share', round(float((land > 0.5).mean()), 4), flush=True)
    del land
    spec = ring.SPEC
    sheet = np.minimum(cv2.imread(str(WORK / spec['take'])).astype(np.float32) * np.array(spec['tint'], np.float32), 255)
    small = cv2.resize(sheet, (2048, 2048), interpolation=cv2.INTER_AREA)
    del sheet
    under, _ = reproject(hold_level(48), SPOT, 48, P, spec['widthDeg'], 2048)
    reach = ring.mask(small, under)
    cs = MEND['cast']
    k = cs['size']
    m = cv2.resize(reach, (k, k), interpolation=cv2.INTER_AREA)[..., None]
    comp = cv2.resize(under, (k, k), interpolation=cv2.INTER_AREA) * (1 - m) + cv2.resize(small, (k, k), interpolation=cv2.INTER_AREA) * m
    del small, under, reach, m
    inner, _ = reproject(g12, P, deg, P, spec['widthDeg'], k)
    w = footprint(P, spec['widthDeg'], k, P, deg)[..., None]
    comp = comp * (1 - w) + inner * w
    gain, mean, zone = cast(comp, spec['widthDeg'], cs)
    print('cast, gain of the far zone of the plate (BGR): mean', np.round(mean, 3), 'local from', np.round(gain.reshape(-1, 3).min(axis=0), 3), 'to', np.round(gain.reshape(-1, 3).max(axis=0), 3), flush=True)
    own, _ = reproject(zone, P, spec['widthDeg'], P, deg, size, signed=True)
    part, _ = reproject(gain, P, spec['widthDeg'], P, deg, size, signed=True)
    g12 = g12 * (1 + (part - 1) * np.clip(own, 0, 1)[..., None])
    del own, part, comp, inner, gain, zone
    sea = np.array(PLATES['seaGain'], np.float32)
    held = {d: calm(hold_level(d), d)[0] for d in (12, 24, 48)}
    dens = cv2.imread(str(WORK / 'field-density.png'), 0).astype(np.float32) / 255
    wd, ok = rep(dens, Win(P, MEND['field']['widthDeg'], dens.shape[0]), whole, signed=True)
    wd = (np.clip(wd, 0, 1) * ok)[..., None]
    dist = from_nadir(P, deg, size)
    wd = np.maximum(wd, step(MEND['far']['fromDeg'][0], MEND['far']['fromDeg'][1], dist)[..., None])
    back, ok = rep(held[12], Win(SPOT, 12, size), whole)
    far, _ = rep(held[24], Win(SPOT, 24, size), whole)
    r = inward(ok, MEND['strip']['blendPx'])
    g12 = g12 * (1 - wd) + graded(back * r + far * (1 - r), sea) * wd
    print('plate, share that gives way to the hold', round(float(wd.mean()), 4), flush=True)
    del far, back, r, wd, dens
    fl = field()
    lay12 = cv2.imread(str(WORK / 'q12-lay.png')).astype(np.float32)
    fs = MEND['field']
    a = fl['both'][..., 0]
    near = lay12[(cover[..., 0] > 0.9) & (dist < fs['white']['nearDeg']) & (lay12.min(axis=2) > fs['white']['bright'])]
    body = fl['colour'][(a > 0.98) & (fl['colour'].min(axis=2) > fs['white']['bright'])]
    white = np.clip(near.mean(axis=0) / body.mean(axis=0), fs['white']['limit'][0], fs['white']['limit'][1]).astype(np.float32)
    print('field white (BGR): near cloud of the lay back', np.round(near.mean(axis=0), 1), 'of', len(near), 'px, field', np.round(body.mean(axis=0), 1), 'gain', np.round(white, 3), flush=True)
    del near, body, dist, a
    c, a, s = field_at(fl, whole)
    f12 = g12 * s * (1 - a) + c * white
    per = size / deg
    low_ = fs['low']
    detail = (f12 - cv2.GaussianBlur(f12, (0, 0), low_['sigmaDeg'] * per)) * (step(low_['alpha'][0], low_['alpha'][1], cv2.GaussianBlur(a[..., 0], (0, 0), low_['sigmaDeg'] * per)) * step(low_['cloud'][0], low_['cloud'][1], cv2.GaussianBlur(lay12.min(axis=2), (0, 0), low_['sigmaDeg'] * per)))[..., None]
    cover = step(0.5, 1.0, cv2.GaussianBlur(inside12, (0, 0), lw['fadeDeg'] * per))[..., None]
    save(lw['file'], f12 * (1 - cover) + (lay12 + detail) * cover, lw['size'])
    cv2.imwrite(str(WORK / 'f12-look.jpg'), cv2.resize(np.clip(np.hstack([f12, f12 * (1 - cover) + (lay12 + detail) * cover]), 0, 255).astype(np.uint8), (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    cv2.imwrite(str(WORK / 'f12-native.jpg'), np.clip(np.hstack([f12[1850:2350, 2800:3500], f12[2950:3450, 1450:2150], f12[504:1004, 2298:2998]]), 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('low plate done, lay back share', round(float(cover.mean()), 4), 'field cover on the plate', round(float(a.mean()), 4), 'detail rms', round(float(np.sqrt((detail ** 2).mean())), 2), flush=True)
    del cover, detail, c, a, s
    fine = MEND['fine']
    for level in PLATES['levels'][1:]:
        dw = win_of(level, P)
        up, _ = rep(g12, whole, dw)
        base, _ = rep(lay12, whole, dw)
        lay, inside, sharp = fine_lay(dw)
        per = dw.raster / dw.deg
        apart = cv2.GaussianBlur(np.abs(up - base).max(axis=2), (0, 0), fine['sigmaDeg'] * per)
        m = (1 - step(fine['apart'][0], fine['apart'][1], apart)) * step(0.5, 1.0, cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), fine['edgeDeg'] * per)) * step(fine['sharp'][0], fine['sharp'][1], sharp)
        save(level['file'], field_on(up + (lay - base) * m[..., None], fl, dw, white))
        print('fine level', level['file'], dw.n, 'px, share with the detail of the lay back', round(float(m.mean()), 4), 'detail rms', round(float(np.sqrt((((lay - base) * m[..., None]) ** 2).mean())), 2), flush=True)
        del up, base, lay, inside, sharp, apart, m
    del lay12
    strip = MEND['strip']
    raw = cv2.imread(str(WORK / spec['take'])).astype(np.float32)
    ringw = Win(P, spec['widthDeg'], raw.shape[0])
    jobs = [(level, SPOT) for level in PLATES['under'][::-1]] + [(PLATES['levels'][0], P)]

    def kept(d):
        return held[d] if d in held else hold_level(d)

    for level, c in jobs[::-1]:
        dw = win_of(level, c)
        d = level['widthDeg']
        n = dw.n
        if c is P:
            hold, ok = rep(kept(d), Win(SPOT, d, size), dw)
            fill, _ = rep(kept(2 * d), Win(SPOT, 2 * d, size), dw)
        else:
            hold, ok = cut(kept(d), Win(SPOT, d, size), dw)
            fill = None
            if not ok.all():
                per = dw.raster / d
                up, _ = rep(kept(2 * d), Win(SPOT, 2 * d, size), dw)
                fill, reached = rep(raw, ringw, dw)
                fill = fill - cv2.GaussianBlur(fill, (0, 0), strip['lowDeg'] * per) + cv2.GaussianBlur(up, (0, 0), strip['lowDeg'] * per)
                r = inward(reached, strip['blendPx'])
                fill = fill * r + up * (1 - r)
                print('level', level['file'], 'share of the fill from the ring take', round(float(r.mean()), 4), flush=True)
                del up, r
        if fill is not None:
            a = inward(ok, strip['blendPx'])
            hold = hold * a + fill * (1 - a)
            print('level', level['file'], 'share from the level itself', round(float(a.mean()), 4), flush=True)
            del fill, a
        inner = cut(g12, whole, dw)[0] if c is P else rep(g12, whole, dw)[0]
        w = foot(dw, whole)[..., None]
        hold = hold * (1 - w) + inner * w
        if d == 48:
            laid48 = hold
        save(level['file'], field_on(hold, fl, dw, white))
        print('level', level['file'], n, 'px done, footprint share', round(float(w.mean()), 4), flush=True)
        del inner, w
    del raw, fl
    tone = PLATES['tone']
    wide, n = tone['widthDeg'], tone['size']
    h48, ok = reproject(hold_level(48), SPOT, 48, P, wide, n)
    gain = np.array(PLATES['seaGain'], np.float32)
    c48, _ = reproject(laid48, SPOT, 48, P, wide, n)
    d = low(graded(c48, gain) - c48, n / wide)
    own = MEND['tone']
    per = n / wide
    k = int(round(deg * own['perDeg']))
    plate, _ = reproject(cv2.resize(g12, (k, k), interpolation=cv2.INTER_AREA), P, deg, P, wide, n)
    w = footprint(P, wide, n, P, deg)[..., None]
    sea = w * open_sea(plate, own) * open_sea(h48, own)
    share = low(sea, per)[..., None]
    diff = low((plate - h48) * sea, per) / np.maximum(share, 1e-4)
    trust = low(w, per)[..., None] * step(own['share'][0], own['share'][1], share)
    d = d * (1 - trust) + diff * trust
    cv2.imwrite(str(WORK / 'tone-own.jpg'), np.hstack([np.clip(v, 0, 255).astype(np.uint8) for v in (h48, plate * w + h48 * (1 - w), (plate - diff) * w + h48 * (1 - w), np.repeat(trust * 255, 3, axis=2))]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    t = np.abs((np.arange(n) + 0.5) / n - 0.5)
    edge = step(0.5, 0.5 - tone['edge'], np.maximum.outer(t, t))[..., None] * ok[..., None]
    d = d * edge
    rgba = np.concatenate([d[..., ::-1] / 255, edge], axis=2)[::-1].astype(np.float16)
    for s in ('full', 'web'):
        (PUBLIC / s / tone['file']).write_bytes(rgba.tobytes())
    np.save(WORK / 'tone.npy', d)
    look = np.clip(128 + d, 0, 255).astype(np.uint8)
    cv2.imwrite(str(WORK / 'tone-look.png'), look)
    print('tone', wide, 'degrees', n, 'px, range', round(float(d.min()), 1), round(float(d.max()), 1), flush=True)


if __name__ == '__main__':
    main()
