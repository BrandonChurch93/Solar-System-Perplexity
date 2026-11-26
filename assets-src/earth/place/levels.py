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


def footprint_px(size, w, feather):
    i = np.arange(size) + 0.5
    fx = step(0, feather * w.n, np.minimum(i - w.x0, w.x0 + w.n - i))
    fy = step(0, feather * w.n, np.minimum(i - w.y0, w.y0 + w.n - i))
    return fy[:, None] * fx[None, :]


def glint_of(plate, want):
    gl = MEND['glint']
    k = gl['scale']
    small = cv2.resize(plate, (plate.shape[1] // k, plate.shape[0] // k), interpolation=cv2.INTER_AREA)
    b, r = small[..., 0], small[..., 2]
    warm = ((r > gl['red']) & (r - b > gl['warm'][0]) & (r - b < gl['warm'][1]) & (b > gl['blue'])).astype(np.float32)
    n, lab, stats, _ = cv2.connectedComponentsWithStats((cv2.GaussianBlur(warm, (0, 0), gl['blurPx']) > 0.5).astype(np.uint8))
    ys, xs = np.nonzero(lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])))
    cx, cy = float(xs.mean()), float(ys.mean())
    ev, vec = np.linalg.eigh(np.cov(np.vstack([xs - cx, ys - cy])))
    east, north = float(vec[0, 1]), -float(vec[1, 1])
    if east < 0:
        east, north = -east, -north
    per = small.shape[0] / PLATES['levels'][0]['widthDeg']
    got = {'centre': [round((cx + 0.5) * k), round((cy + 0.5) * k)], 'sigmaDeg': [round(float(np.sqrt(ev[1])) / per, 3), round(float(np.sqrt(ev[0])) / per, 3)], 'angleDeg': round(float(np.degrees(np.arctan2(north, east))), 1)}
    turn = np.radians(got['angleDeg'])
    print('glint of the plate: centre px', got['centre'], 'sigma (long, short) degrees', got['sigmaDeg'], 'angle from east to north', got['angleDeg'], flush=True)
    if max(abs(got['centre'][0] - want['centre'][0]), abs(got['centre'][1] - want['centre'][1])) > 8 or max(abs(got['sigmaDeg'][i] - want['sigmaDeg'][i]) for i in (0, 1)) > 0.01 or abs(got['angleDeg'] - want['angleDeg']) > 1:
        raise SystemExit('plates.glint in place.json is not the glint of the plate: write the measured values there')
    calm, own = want['calm'], gl['calm']
    n, w = own['work'], calm['window']
    x0, y0 = want['centre'][0] - w // 2, want['centre'][1] - w // 2
    p = cv2.resize(plate[y0:y0 + w, x0:x0 + w], (n, n), interpolation=cv2.INTER_AREA)
    per = per * k * n / w
    yy, xx = np.mgrid[:n, :n].astype(np.float32)
    edge = np.minimum(np.minimum(xx, n - 1 - xx), np.minimum(yy, n - 1 - yy)) / n
    reach = (step(own['reachDeg'][0], own['reachDeg'][1], np.hypot(xx - n / 2, yy - n / 2) / per) * step(0.0, own['edge'], edge)).astype(np.float32)
    cloud = lambda q: step(calm['cloud'][0], calm['cloud'][1], q.min(axis=2)) * (1 - step(calm['warm'][0], calm['warm'][1], q[..., 2] - q[..., 0]))
    glow = lambda q, b: step(calm['glow'][0], calm['glow'][1], (q[..., 2] - b[..., 2]) / np.maximum(q[..., 1] - b[..., 1], calm['floor']))
    lo, hi = p.min(axis=2), p.max(axis=2)
    sea = ((1 - step(own['white'][0], own['white'][1], lo)) * step(own['blue'][0], own['blue'][1], p[..., 0] - p[..., 2]) * step(own['deep'][0], own['deep'][1], (hi - lo) / np.maximum(hi, 1.0))).astype(np.float32)
    over = lambda img, m, sg: cv2.GaussianBlur(img * m[..., None], (0, 0), sg) / np.maximum(cv2.GaussianBlur(m, (0, 0), sg)[..., None], 1e-3)
    base = over(p, sea, own['seaDeg'] * per)
    lit = ((1 - cloud(p)) * glow(p, base) * step(own['lit'][0], own['lit'][1], p[..., 2] - base[..., 2])).astype(np.float32)
    light = np.maximum(over(p, lit, own['lightDeg'] * per) - base, 0) * (step(own['have'][0], own['have'][1], cv2.GaussianBlur(lit, (0, 0), own['lightDeg'] * per)) * reach)[..., None]
    light = cv2.GaussianBlur(light, (0, 0), own['lightDeg'] * per * 0.5)
    small = [np.clip(cv2.resize(v, (calm['size'], calm['size']), interpolation=cv2.INTER_AREA) + 0.5, 0, 255).astype(np.uint8) for v in (light, base)]
    for s_ in ('full', 'web'):
        for name, v in zip((calm['light'], calm['sea']), small):
            cv2.imwrite(str(PUBLIC / s_ / name), v, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    lg, bg = (cv2.resize(v.astype(np.float32), (n, n), interpolation=cv2.INTER_LINEAR) for v in small)
    out = np.maximum(p - lg * (glow(p, bg) * (1 - cloud(p)))[..., None], np.minimum(p, bg))
    cv2.imwrite(str(WORK / 'glint-calm.jpg'), np.hstack([np.clip(v, 0, 255).astype(np.uint8) for v in (p, out, base, light)]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('calm plate:', calm['light'], calm['sea'], calm['size'], 'px for', w, 'px of the plate; mean change inside 2 sigma', round(float((p - out)[away_of(n, per, turn, got) < 2].mean()), 1), 'largest light at the window edge', int(max(small[0][0].max(), small[0][-1].max(), small[0][:, 0].max(), small[0][:, -1].max())), flush=True)


def away_of(n, per, turn, got):
    yy, xx = np.mgrid[:n, :n].astype(np.float32)
    qx, qy = xx - n / 2, n / 2 - yy
    return np.hypot((qx * np.cos(turn) + qy * np.sin(turn)) / (got['sigmaDeg'][0] * per), (qy * np.cos(turn) - qx * np.sin(turn)) / (got['sigmaDeg'][1] * per))


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


def near_sea(img, w, spec, per):
    from calm import land_of, SPEC as CALM
    lo = img.min(axis=2)
    cloud = step(spec['grey'][0], spec['grey'][1], lo / np.maximum(img.max(axis=2), 1)) * step(spec['bright'][0], spec['bright'][1], lo)
    k = 2 * int(round(spec['growDeg'] * per)) + 1
    cloud = cv2.dilate((cloud > 0.05).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))).astype(np.float32)
    k = 2 * int(round(spec['landDeg'] * per)) + 1
    land = land_of(img, {**CALM, **CALM['plate']}, CALM['dotPx']['12'])
    land = cv2.GaussianBlur(cv2.dilate(land, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))), (0, 0), spec['landDeg'] * per / 2)
    sea = (1 - cloud) * (1 - land)
    s = spec['sigmaDeg'] * per
    tone = cv2.GaussianBlur(img * sea[..., None], (0, 0), s) / np.maximum(cv2.GaussianBlur(sea, (0, 0), s), spec['least'])[..., None]
    print('near sea: share of the plate', round(float(w.mean()), 4), 'of it cloud', round(float((cloud[..., None] * w).sum() / w.sum()), 3), 'land', round(float((land[..., None] * w).sum() / w.sum()), 3), flush=True)
    return img * (1 - w) + (img * land[..., None] + tone * (1 - land[..., None])) * w


def sea_tone(img, spec, per, dot):
    from calm import land_of, SPEC as CALM
    lo = img.min(axis=2)
    lit = step(spec['grey'][0], spec['grey'][1], lo / np.maximum(img.max(axis=2), 1)) * step(spec['bright'][0], spec['bright'][1], lo)
    k = 2 * int(round(spec['landDeg'] * per)) + 1
    land = land_of(img, {**CALM, **CALM['plate']}, dot)
    land = cv2.GaussianBlur(cv2.dilate(land, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))), (0, 0), spec['landDeg'] * per / 2)
    return lit, land


def mean_over(img, w, s, least):
    return cv2.GaussianBlur(img * w[..., None], (0, 0), s) / np.maximum(cv2.GaussianBlur(w, (0, 0), s), least)[..., None]


LUM = np.float32([0.114, 0.587, 0.299])


def sums(img, w, s, f=4):
    n = img.shape[0] // f
    a = cv2.GaussianBlur(cv2.resize(img * w[..., None], (n, n), interpolation=cv2.INTER_AREA), (0, 0), s / f)
    c = cv2.GaussianBlur(cv2.resize(w, (n, n), interpolation=cv2.INTER_AREA), (0, 0), s / f)
    size = (img.shape[1], img.shape[0])
    return cv2.resize(a, size, interpolation=cv2.INTER_LINEAR), cv2.resize(c, size, interpolation=cv2.INTER_LINEAR)


def whole(w, lit, dr, spec, per):
    k = 2 * spec['join'] + 1
    count, lab = cv2.connectedComponents(cv2.dilate(((lit > 0.5) & (dr > 0)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))) * (dr > 0).astype(np.uint8), connectivity=8)
    flat = lab.ravel()
    px = np.maximum(np.bincount(flat, minlength=count), 1)
    stays = np.bincount(flat, weights=w.ravel(), minlength=count) / px < 0.5
    k = 2 * spec['meet'] + 1
    met = cv2.dilate(((lit > 0.5) & (dr <= 0)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))) > 0
    at = (lit > 0.5) & (dr > 0) & (dr * per <= spec['touch'])
    touch = np.bincount(lab[at], minlength=count)
    cut = (touch >= spec['least']) & (np.bincount(lab[at & met], minlength=count) < 0.5 * touch)
    cut[0] = False
    print('skirt, clouds of the map at the rim of the canvas:', int((touch[1:] >= spec['least']).sum()), 'of them cut by the rim and so gone whole', int(cut.sum()), 'on', int(np.bincount(lab[lit > 0.5], minlength=count)[cut].sum()), 'px', flush=True)
    stays &= ~cut
    stays[0] = False
    goes = ~stays
    goes[0] = False
    k = 2 * spec['halo'] + 1
    ring = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    kept = cv2.GaussianBlur(cv2.dilate(stays[lab].astype(np.uint8), ring).astype(np.float32), (0, 0), spec['halo'] / 3)
    gone = cv2.GaussianBlur(cv2.dilate(goes[lab].astype(np.uint8), ring).astype(np.float32), (0, 0), spec['halo'] / 3)
    part = (w > 0.02) & (w < 0.98)
    print('skirt, clouds of the map whole:', int(stays.sum()), 'stay,', int(goes.sum()), 'go; of them', len(np.unique(lab[part & goes[lab]])), 'go and', len(np.unique(lab[part & stays[lab]])), 'stay where the field thins out', flush=True)
    return np.maximum(w, gone * (dr > 0)) * (1 - kept), kept


def entire(keep, alpha, shade, spec):
    n = keep.shape[0] // 2
    body = cv2.resize(np.maximum(alpha, 1 - shade), (n, n), interpolation=cv2.INTER_AREA)
    k = 2 * spec['join'] + 1
    count, lab = cv2.connectedComponents(cv2.dilate((body > spec['alpha']).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))), connectivity=8)
    flat = lab.ravel()
    px = np.maximum(np.bincount(flat, minlength=count), 1)
    share = np.bincount(flat, weights=cv2.resize(keep, (n, n), interpolation=cv2.INTER_AREA).ravel(), minlength=count) / px
    cut = (share > spec['cut'][0]) & (share < spec['cut'][1])
    cut[0] = False
    stays = cut & (share >= 0.5)
    goes = cut & ~stays
    k = 2 * spec['halo'] + 1
    ring = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    size = (keep.shape[1], keep.shape[0])
    up = cv2.resize(cv2.GaussianBlur(cv2.dilate(stays[lab].astype(np.uint8), ring).astype(np.float32), (0, 0), spec['halo'] / 3), size, interpolation=cv2.INTER_LINEAR)
    down = cv2.resize(cv2.GaussianBlur(cv2.dilate(goes[lab].astype(np.uint8), ring).astype(np.float32), (0, 0), spec['halo'] / 3), size, interpolation=cv2.INTER_LINEAR)
    print('far field, bodies that the border of the sown field crosses:', int(cut.sum()), 'of', count - 1, ';', int(stays.sum()), 'stay whole,', int(goes.sum()), 'go whole', flush=True)
    return np.maximum(keep, up) * (1 - down)


def curled(cover, limit):
    count, lab, stats, _ = cv2.connectedComponentsWithStats(cover, connectivity=8)
    deep = cv2.distanceTransform(np.pad(cover, 1), cv2.DIST_L2, 3)[1:-1, 1:-1]
    long = 0
    for i in range(1, count):
        area = int(stats[i, cv2.CC_STAT_AREA])
        if area > limit[1] and area / (np.pi * float(deep[lab == i].max()) ** 2) > limit[0]:
            long += area
    return long / max(int(cover.sum()), 1)


def bodies(g12, inside, lit, spec, per):
    b = spec['bodies']
    e = spec['soft']
    found = []
    s = spec['sigmaDeg'] * per
    pad = int(round(3 * s))
    m = b['marginPx']
    for x0, y0, x1, y1 in b['from']:
        X0, Y0, X1, Y1 = max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, g12.shape[1]), min(y1 + pad, g12.shape[0])
        img = g12[Y0:Y1, X0:X1]
        on = (inside[Y0:Y1, X0:X1] > 0.99).astype(np.float32)
        sea = (1 - lit[Y0:Y1, X0:X1]) * on
        tone = mean_over(img, sea, s, spec['least'])
        a = step(b['cloud'][0], b['cloud'][1], (img - tone) @ LUM)
        tone = mean_over(img, sea * (1 - a), s, spec['least'])
        a = cv2.GaussianBlur(step(b['cloud'][0], b['cloud'][1], (img - tone) @ LUM), (0, 0), b['edgePx'] / 2)
        ratio = np.clip((img + e) / (tone + e), 0, 1)
        dark = (1 - step(b['shade'][0], b['shade'][1], cv2.GaussianBlur(ratio @ LUM, (0, 0), b['smoothPx']))) * (a < 0.05)
        r = 1 - dark[..., None] * (1 - cv2.GaussianBlur(ratio, (0, 0), b['edgePx']))
        known = (a < 0.05).astype(np.float32)
        r = np.where(known[..., None] > 0, r, mean_over(r, known, b['fillPx'], 1e-3))
        solid = step(0.5, 0.9, a)
        c = img * solid[..., None] + mean_over(img, solid, b['fillPx'] / 2, 1e-3) * (1 - solid[..., None])
        seen = (np.maximum(a, dark) > b['least']).astype(np.uint8)
        for join, least in ((b['joinPx'][0], b['areaPx'][0]), (b['joinPx'][1], b['areaPx'][1])):
            k = 2 * join + 1
            joined = cv2.morphologyEx(seen, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
            count, lab, stats, _ = cv2.connectedComponentsWithStats(joined, connectivity=8)
            for i in range(1, count):
                bx, by, bw, bh, area = stats[i]
                if area < least or area > b['areaPx'][2]:
                    continue
                if bx + X0 - m < x0 or by + Y0 - m < y0 or bx + bw + X0 + m > x1 or by + bh + Y0 + m > y1:
                    continue
                sl = (slice(by - m, by + bh + m), slice(bx - m, bx + bw + m))
                mine = ((lab[sl] == i) & (seen[sl] > 0)).astype(np.uint8)
                if not (on[sl] > 0)[mine > 0].all():
                    continue
                w = cv2.GaussianBlur(cv2.dilate(mine, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (m + 1, m + 1))).astype(np.float32), (0, 0), m / 4)
                aa = a[sl] * w
                if float(aa.sum()) < b['cloudPx'] or any(f['at'] == (bx + X0, by + Y0) and f['a'].shape == aa.shape for f in found):
                    continue
                if curled((aa > b['least']).astype(np.uint8), b['curl']) > b['curl'][2]:
                    continue
                found.append({'c': c[sl].astype(np.float32), 'a': aa.astype(np.float32), 'r': (1 - w[..., None] * (1 - r[sl])).astype(np.float32), 'px': float(np.maximum(aa, dark[sl] * w).sum()), 'at': (bx + X0, by + Y0), 'group': area > b['areaPx'][1], 'light': float(((c[sl] @ LUM) * aa).sum() / aa.sum()), 'sea': float(((tone[sl] @ LUM) * aa).sum() / aa.sum())})
    return found


def placed(body, scale, mirror, axis):
    h, w = body['a'].shape
    m = np.eye(2) * scale
    if mirror:
        ux, uy = axis
        m = m @ np.array([[2 * ux * ux - 1, 2 * ux * uy], [2 * ux * uy, 2 * uy * uy - 1]])
    ext = np.abs(m) @ np.array([w, h])
    W, H = int(np.ceil(ext[0])) + 2, int(np.ceil(ext[1])) + 2
    t = np.array([(W - 1) / 2, (H - 1) / 2]) - m @ np.array([(w - 1) / 2, (h - 1) / 2])
    M = np.hstack([m, t[:, None]]).astype(np.float64)
    blur = 0.5 * np.sqrt(max(1 / scale ** 2 - 1, 0))

    def warp(x, border):
        if blur > 0.05:
            x = cv2.GaussianBlur(x, (0, 0), blur)
        return cv2.warpAffine(x, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=border)

    return warp(body['c'], (0, 0, 0)), warp(body['a'], 0), warp(body['r'], (1, 1, 1))


def sown(out, found, axis, allowed, density, rim, tone, law, spec, per):
    b = spec['bodies']
    rng = np.random.default_rng(b['seed'])
    n = out.shape[0]
    grain = cv2.GaussianBlur(rng.standard_normal((n // 8, n // 8)).astype(np.float32), (0, 0), b['clumpDeg'] * per / 8)
    grain = cv2.resize(grain / grain.std(), (n, n), interpolation=cv2.INTER_CUBIC)
    want = (density * step(b['clump'][0], b['clump'][1], grain) + rim) * allowed
    del grain
    cdf = np.cumsum(cv2.resize(want, (n // 4, n // 4), interpolation=cv2.INTER_AREA).ravel().astype(np.float64))
    goal = b['cover'] * float(want.sum())
    del want
    shade = np.ones_like(out)
    colour = np.zeros_like(out)
    alpha = np.zeros((n, n), np.float32)
    taken = np.zeros((n, n), np.uint8)
    used = [[] for _ in found]
    groups = np.array([i for i, f in enumerate(found) if f['group']], np.int64)
    singles = np.array([i for i, f in enumerate(found) if not f['group']], np.int64)
    home = np.array([f['sea'] for f in found], np.float64)
    k = 2 * b['apartPx'] + 1
    laid = 0.0
    for _ in range(b['tries']):
        if laid >= goal:
            break
        i = int(np.searchsorted(cdf, rng.uniform(0, cdf[-1])))
        y, x = (i // (n // 4)) * 4 + int(rng.integers(0, 4)), (i % (n // 4)) * 4 + int(rng.integers(0, 4))
        kind = groups if len(groups) and rng.uniform() < b['groups'] else singles
        near = np.exp(-((home[kind] - tone[y, x]) / b['kindTone']) ** 2)
        near[near < b['kindLeast']] = 0
        some = int(np.count_nonzero(near))
        if some == 0:
            continue
        pick = rng.choice(kind, size=min(b['choose'], some), replace=False, p=near / near.sum())
        j = int(min(pick, key=lambda p: (len(used[p]), p)))
        if any(np.hypot(x - ux, y - uy) < b['twinDeg'] * per for ux, uy in used[j]) or (found[j]['group'] and len(used[j]) >= b['again']):
            continue
        c, a, r = placed(found[j], float(np.exp(rng.uniform(np.log(b['scale'][0]), np.log(b['scale'][1])))), bool(rng.integers(0, 2)), axis)
        c = c * np.clip((law[1] + law[0] * tone[y, x]) / (law[1] + law[0] * found[j]['sea']), b['gain'][0], b['gain'][1])
        h, w = a.shape
        x0, y0 = x - w // 2, y - h // 2
        if x0 < 0 or y0 < 0 or x0 + w > n or y0 + h > n:
            continue
        sl = (slice(y0, y0 + h), slice(x0, x0 + w))
        body = np.maximum(a, 1 - r.min(axis=2))
        hit = body > b['least']
        if not hit.any() or float(allowed[sl][body > 0.002].min()) < 0.999 or taken[sl][hit].any():
            continue
        a = a * allowed[sl]
        r = 1 - (1 - r) * allowed[sl][..., None]
        shade[sl] = np.minimum(shade[sl], r)
        colour[sl] = colour[sl] * (1 - a[..., None]) + c * a[..., None]
        alpha[sl] = 1 - (1 - alpha[sl]) * (1 - a)
        taken[sl] |= cv2.dilate(hit.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
        used[j].append((x, y))
        laid += float(body.sum())
    print('skirt field:', len(found), 'bodies of the canvas (', len(groups), 'groups ), laid', sum(len(u) for u in used), 'times, most', max(len(u) for u in used), 'for one body, cover laid', round(laid), 'of', round(goal), 'wanted', flush=True)
    return out * shade * (1 - alpha[..., None]) + colour


def skirt(g12, under, inside, dist, spec, per):
    from calm import SPEC as CALM
    n = g12.shape[0]
    b = spec['bodies']
    dr, lab = cv2.distanceTransformWithLabels((inside < 0.99).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    dr = dr / per
    s = spec['sigmaDeg'] * per
    dot = CALM['dotPx']['12']
    lit, land = sea_tone(g12, spec, per, dot)
    sea = (1 - lit) * (1 - land)
    del land
    own = mean_over(g12, sea * (dr > 0), s, spec['least'])
    k = 2 * int(round(spec['landDeg'] * per)) + 1
    green = cv2.dilate(((g12[..., 1] > g12[..., 2] + spec['green']) & (g12[..., 1] > g12[..., 0] + spec['green'])).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))).astype(np.float32)
    calmed = (1 - lit) * (1 - green) * (dr == 0)
    a, c = sums(g12, calmed, s)
    tone = a / np.maximum(c, spec['least'])[..., None]
    cloud = step(b['cloud'][0], b['cloud'][1], (g12 - tone) @ LUM)
    calmed = calmed * (1 - cloud)
    del tone
    k = b['rim']['coverDeg'] * per
    cloud = cv2.GaussianBlur(cloud * (dr == 0), (0, 0), k) / np.maximum(cv2.GaussianBlur((dr == 0).astype(np.float32), (0, 0), k), 1e-3)
    a, c = sums(g12, calmed, s)
    rim = (cv2.GaussianBlur(g12 * calmed[..., None], (0, 0), spec['rimDeg'] * per) + spec['fill'] * a) / (cv2.GaussianBlur(calmed, (0, 0), spec['rimDeg'] * per) + spec['fill'] * c + 1e-6)[..., None]
    del a, c, calmed
    land = cv2.GaussianBlur(green, (0, 0), spec['landDeg'] * per / 2)
    zy, zx = np.nonzero(dr == 0)
    at = np.zeros(lab.max() + 1, np.int64)
    at[lab[zy, zx]] = zy * n + zx
    at = at[lab]
    del lab, zy, zx, green
    outside = (dr > 0).astype(np.float32)
    rim = mean_over(rim.reshape(-1, 3)[at].reshape(n, n, 3), outside, spec['carryDeg'] * per, 1e-3)
    cloud = cv2.GaussianBlur(cloud.reshape(-1)[at].reshape(n, n) * outside, (0, 0), spec['carryDeg'] * per) / np.maximum(cv2.GaussianBlur(outside, (0, 0), spec['carryDeg'] * per), 1e-3)
    del at, outside
    cu, lu = sea_tone(under, spec, per, dot)
    far = mean_over(under, (1 - cu) * (1 - lu), s, spec['least'])
    del cu, lu
    u = step(0, spec['toneDeg'], dr)[..., None]
    want = rim * (1 - u) + far * u
    del rim, far, u
    tone = want @ LUM
    e = spec['soft']
    zone = (step(0, spec['enterDeg'], dr) * sea)[..., None]
    out = g12 * (1 - zone) + np.maximum((g12 + e) * (want + e) / (own + e) - e, 0) * zone
    del own
    w = step(0, spec['calmDeg'], dr) * (1 - step(spec['fieldDeg'][0], spec['fieldDeg'][1], dr)) * (1 - step(MEND['far']['fromDeg'][0], MEND['far']['fromDeg'][1], dist)) * (1 - land)
    w, kept = whole(w, lit, dr, spec['whole'], per)
    out = out * (1 - kept[..., None]) + g12 * kept[..., None]
    out = out * (1 - w[..., None]) + want * w[..., None]
    del want
    found = bodies(g12, inside, lit, spec, per)
    law = np.polyfit([f['sea'] for f in found], [f['light'] for f in found], 1)
    north, east, up = g.frame_at(P)
    sun = g.unit(np.array(PLATES['stand']['sun']) @ g.TO_BODY.T)
    axis = g.unit(np.array([-(sun @ east), sun @ up]))
    allowed = ((dr > b['fromDeg']) & (land < 0.02) & (kept < 0.02)).astype(np.float32)
    del kept
    density = (1 - step(spec['fieldDeg'][0], spec['fieldDeg'][1], dr)) * (1 - step(MEND['far']['fromDeg'][0], MEND['far']['fromDeg'][1], dist))
    over = step(0, b['rim']['overDeg'], dr)
    share = sum(f['px'] for f in found) / sum(float(f['a'].sum()) for f in found)
    rim = np.minimum(cloud * share / b['cover'], b['rim']['most']) * (1 - over) * density
    density *= over
    del cloud, over
    print('skirt: body px for one px of cloud', round(share, 2), '; a cloud of the canvas over sea of tone s has the light', round(float(law[1]), 1), '+', round(float(law[0]), 3), 's', flush=True)
    res = sown(out, found, axis, allowed, density, rim, tone, law, spec, per)
    px = (dr > 0) & (dr < spec['toneDeg'])
    print('skirt: shadows fall along', np.round(axis, 3), 'of the plate (x east, y south); share of the plate that gives way to the field', round(float(w.mean()), 4), 'with the tone law', round(float(zone.mean()), 4), 'sea outside the canvas to toneDeg, mean before (BGR)', np.round(g12[px & (sea > 0.5)].mean(axis=0), 1), 'after', np.round(res[px & (sea > 0.5)].mean(axis=0), 1), 'largest change inside the canvas', round(float(np.abs(res - g12)[dr == 0].max()), 3), flush=True)
    cv2.imwrite(str(WORK / 'skirt-look.jpg'), cv2.resize(np.clip(np.hstack([g12, res]), 0, 255).astype(np.uint8), (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    return res, w


def to_rim(g12, lay, inside, spec, per, seen):
    k = 2 * int(round(spec['sigmaDeg'] * per)) + 1
    apart = cv2.blur(np.abs(g12 - lay).max(axis=2) * inside, (k, k)) / np.maximum(cv2.blur(inside, (k, k)), 1e-3)
    held = ((apart < spec['apart']) & (inside > 0)).astype(np.uint8)
    count, lab, stats, _ = cv2.connectedComponentsWithStats(held, connectivity=8)
    held = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    r = int(round(spec['reachDeg'] * per))
    near = cv2.dilate(held, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    deep = cv2.distanceTransform((inside > 0).astype(np.uint8), cv2.DIST_L2, 5)
    both = np.maximum(held, ((inside > 0) & (deep < r) & (near > 0)).astype(np.uint8)).astype(np.float32)
    e = spec['edgeDeg'] * per
    shown = np.clip(cv2.GaussianBlur(both, (0, 0), e) / np.maximum(cv2.GaussianBlur(inside, (0, 0), e), 1e-3), 0, 1) * inside
    from calm import land_of, SPEC as CALM
    ld = spec['land']
    land = (land_of(seen, {**CALM, **CALM['plate']}, CALM['dotPx']['12']) > 0.5).astype(np.uint8)
    count, lab, stats, _ = cv2.connectedComponentsWithStats(land, connectivity=8)
    crossing = (np.bincount(lab[inside <= 0], minlength=count) >= ld['least']) & (np.bincount(lab[(inside > 0) & (held == 0)], minlength=count) >= ld['least'])
    crossing[0] = False
    k = 2 * int(round(ld['reachDeg'] * per)) + 1
    over = cv2.GaussianBlur(cv2.dilate(crossing[lab].astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))).astype(np.float32), (0, 0), ld['reachDeg'] * per / 2)
    print('lay back to the rim: land of the plate that the rim crosses:', int(crossing.sum()), 'bodies,', int(((over > 0.5) & (shown > 0.5)).sum()), 'px of the canvas left to them', flush=True)
    shown = shown * (1 - over)
    del land, lab, over
    w = shown * (1 - held)
    print('lay back to the rim: the plate holds the canvas on', int(held.sum()), 'px, the canvas goes on to its rim on', int((w > 0.5).sum()), 'px more, mean change there (BGR)', np.round((lay - g12)[w > 0.5].mean(axis=0), 1), flush=True)
    return g12 * (1 - w[..., None]) + lay * w[..., None], np.maximum(w, held.astype(np.float32)), shown


def rim_line(rg):
    a, b = 0.5 - FEATHER, 0.5
    for _ in range(48):
        q = (a + b) / 2
        if float(step(rg['wipe'][0], rg['wipe'][1], step(rg['plate'][0], rg['plate'][1], step(0.5, 0.5 - FEATHER, q)))) > 0.5:
            a = q
        else:
            b = q
    return (a + b) / 2


def rim(w, img, spec, per, line):
    n = w.shape[0]
    c = (n - 1) / 2
    i = np.arange(n, dtype=np.float32)
    j = np.clip(i, c - line + spec['carryDeg'] * per, c + line - spec['carryDeg'] * per)
    grid = np.meshgrid(j, j)
    out = cv2.remap(w, grid[0], grid[1], cv2.INTER_LINEAR)
    del grid
    lo = img.min(axis=2)
    cloud = step(spec['grey'][0], spec['grey'][1], lo / np.maximum(img.max(axis=2), 1)) * step(spec['bright'][0], spec['bright'][1], lo)
    k = 2 * int(round(spec['growDeg'] * per)) + 1
    near = cv2.GaussianBlur(cv2.dilate((cloud > 0.05).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))), (0, 0), spec['nearDeg'] * per)
    cloud *= lo / 255
    del lo
    cloud = cv2.GaussianBlur(cloud, (0, 0), spec['lumpDeg'][0] * per) - cv2.GaussianBlur(cloud, (0, 0), spec['lumpDeg'][1] * per)
    t = (np.maximum.outer(np.abs(i - c), np.abs(i - c)) - line) / per
    out *= (1 - step(-spec['softDeg'], spec['softDeg'], t)) * (1 - near) + (1 - step(-spec['edgeDeg'], spec['edgeDeg'], t + spec['push'] * cloud)) * near
    print('rim of the near sea: line', round(float(line), 1), 'px from the centre of the raster, share of the raster where the weight changes by more than 0.01', round(float((np.abs(out - w) > 0.01).mean()), 4), 'largest change further than softDeg from the line', round(float(np.abs(out - w)[np.abs(t) > spec['softDeg']].max()), 4), flush=True)
    return out


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


def veil(hz, cover, base, vl, md, deg, from_nadir):
    n, t = vl['size'], vl['times']
    k = n // t
    o = (n - k) // 2
    pf = md['profile']
    m = pf['size']
    hs = cv2.resize(hz, (m, m), interpolation=cv2.INTER_AREA).astype(np.float64)
    cs = cv2.resize(cover, (m, m), interpolation=cv2.INTER_AREA).astype(np.float64)
    r = from_nadir(P, deg, m).astype(np.float64)
    at, mean = [], []
    for a in np.arange(0, float(r.max()) + pf['ringDeg'], pf['ringDeg']):
        band = (r >= a) & (r < a + pf['ringDeg'])
        got = cs[band].sum()
        if got >= pf['minPx']:
            at.append(a + pf['ringDeg'] / 2)
            mean.append(hs[band].sum(axis=0) / got)
    at, mean = np.array(at), np.array(mean)
    far = r >= pf['holdFromDeg']
    held = hs[far].sum(axis=0) / cs[far].sum()
    hold = step(pf['holdFromDeg'] - pf['blendDeg'], pf['holdFromDeg'], at)[:, None]
    mean = mean * (1 - hold) + held * hold
    print('veil, haze of the lay back by degrees from the point under the close camera (BGR):', ', '.join('%g %s' % (a, np.round(v).astype(int).tolist()) for a, v in list(zip(at, mean))[::4]), 'held from', pf['holdFromDeg'], 'degrees at', np.round(held, 1), flush=True)
    num = np.zeros((n, n, 3))
    cv = np.zeros((n, n))
    num[o:o + k, o:o + k] = cv2.resize(hz, (k, k), interpolation=cv2.INTER_AREA)
    cv[o:o + k, o:o + k] = cv2.resize(cover, (k, k), interpolation=cv2.INTER_AREA)
    rw = from_nadir(P, float(np.degrees(2 * np.arctan(t * np.tan(np.radians(deg) / 2)))), n).astype(np.float64)
    e = np.stack([np.interp(rw, at, mean[:, c]) for c in range(3)], axis=-1)
    per = k / deg
    near = cv2.GaussianBlur(cv, (0, 0), md['spreadDeg'] * per)
    carried = cv2.GaussianBlur(num - e * cv[..., None], (0, 0), md['spreadDeg'] * per) / np.maximum(near, 1e-6)[..., None] * step(0, 0.5, near)[..., None]
    out = cv2.GaussianBlur(num + (e + carried) * (1 - cv[..., None]), (0, 0), vl['sigmaDeg'] * per)
    broad = cv2.GaussianBlur(cv2.copyMakeBorder(cv2.resize(base, (k, k), interpolation=cv2.INTER_AREA), o, o, o, o, cv2.BORDER_REPLICATE).astype(np.float64), (0, 0), vl['sigmaDeg'] * per) + out
    return out.astype(np.float32), cv2.copyMakeBorder(cv[o:o + k, o:o + k], o, o, o, o, cv2.BORDER_REPLICATE).astype(np.float32), broad.astype(np.float32)


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
    lay12 = cv2.imread(str(WORK / 'q12-lay.png')).astype(np.float32)
    lw = PLATES['haze']['layBack']
    cover = step(0.5, 1.0, cv2.GaussianBlur(inside12, (0, 0), lw['edgeDeg'] * size / deg))[..., None]
    g12 = wiped(g12, MEND['wipe'])
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
    under12 = graded(back * r + far * (1 - r), sea)
    del back, far, r, dens
    g12, canvas, shown = to_rim(g12, lay12, inside12, MEND['toRim'], size / deg, g12 * (1 - wd) + under12 * wd)
    fw = win_of(PLATES['levels'][1], P)
    edge = MEND['calm']['fineFadeDeg'] * size / deg
    i = (np.arange(size) + 0.5) * fw.raster / size
    bx = step(0, edge, np.minimum(i - fw.x0, fw.x0 + fw.n - i) * size / fw.raster)
    by = step(0, edge, np.minimum(i - fw.y0, fw.y0 + fw.n - i) * size / fw.raster)
    g12, land = calm(g12, deg, {**MEND['calm'], **MEND['calm']['plate']}, keep=1 - np.maximum(cover[..., 0] * by[:, None] * bx[None, :], canvas))
    print('plate calmed, land share', round(float((land > 0.5).mean()), 4), flush=True)
    del land, canvas
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
    wd = wd * (1 - shown[..., None])
    g12 = g12 * (1 - wd) + under12 * wd
    print('plate, share that gives way to the hold', round(float(wd.mean()), 4), flush=True)
    del wd
    nr = cv2.imread(str(WORK / 'field-near.png'), 0).astype(np.float32) / 255
    nr, ok = rep(nr, Win(P, MEND['field']['widthDeg'], nr.shape[0]), whole, signed=True)
    rg = MEND['field']['density']['ring']
    zone = rim(step(rg['wipe'][0], rg['wipe'][1], np.clip(nr, 0, 1) * ok), g12, {**MEND['nearSea'], **MEND['nearSea']['rim']}, size / deg, rim_line(rg) * size)
    g12 = near_sea(g12, (zone * (1 - shown))[..., None], MEND['nearSea'], size / deg)
    del nr, ok, zone, shown
    g12, laid = skirt(g12, under12, inside12, dist, {**MEND['nearSea'], **MEND['skirt']}, size / deg)
    del under12
    fl = field()
    keep, ok = rep(1 - laid, whole, fl['win'], signed=True)
    keep = entire(np.where(ok, np.clip(keep, 0, 1), 1).astype(np.float32), fl['both'][..., 0], fl['both'][..., 1], MEND['field']['entire'])
    fl['colour'] *= keep[..., None]
    fl['both'][..., 0] *= keep
    fl['both'][..., 1] = 1 - (1 - fl['both'][..., 1]) * keep
    del keep, laid, ok
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
    glint_of(f12, PLATES['glint'])
    low_ = fs['low']
    detail = (f12 - cv2.GaussianBlur(f12, (0, 0), low_['sigmaDeg'] * per)) * (step(low_['alpha'][0], low_['alpha'][1], cv2.GaussianBlur(a[..., 0], (0, 0), low_['sigmaDeg'] * per)) * step(low_['cloud'][0], low_['cloud'][1], cv2.GaussianBlur(lay12.min(axis=2), (0, 0), low_['sigmaDeg'] * per)))[..., None]
    cover = step(0.5, 1.0, cv2.GaussianBlur(inside12, (0, 0), lw['fadeDeg'] * per))[..., None]
    lwin = win_of({**lw['window'], 'widthDeg': deg}, P)
    if lwin.raster != size or min(lwin.x0, lwin.y0) < 0 or max(lwin.x0, lwin.y0) + lwin.n > size:
        raise SystemExit('the window of the low plate must lie on the plate raster')
    if float((cover[..., 0] * footprint_px(size, whole, FEATHER) * (1 - footprint_px(size, lwin, lw['feather']))).max()) > 0.02:
        raise SystemExit('the lay back reaches past the window of the low plate')
    cv2.imwrite(str(WORK / lw['file']), np.clip(cv2.resize((f12 * (1 - cover) + (lay12 + detail) * cover)[int(lwin.y0):int(lwin.y0) + lwin.n, int(lwin.x0):int(lwin.x0) + lwin.n], (lw['size'], lw['size']), interpolation=cv2.INTER_AREA) + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 94])
    vl = PLATES['haze']
    haze, share, broad = veil((lay12 + detail - f12) * cover, cover[..., 0], f12, vl, MEND['veil'], deg, from_nadir)
    for s in ('full', 'web'):
        (PUBLIC / s / vl['file']).write_bytes(np.concatenate([haze[..., ::-1] / 255, share[..., None]], axis=2)[::-1].astype(np.float16).tobytes())
        (PUBLIC / s / vl['broad']).write_bytes(np.concatenate([broad[..., ::-1] / 255, np.ones_like(share)[..., None]], axis=2)[::-1].astype(np.float16).tobytes())
    print('broad lay back of the low plate (the plate smoothed as the veil is, plus the veil), from', round(float(broad.min()), 1), 'to', round(float(broad.max()), 1), 'mean (BGR)', np.round(broad.reshape(-1, 3).mean(axis=0), 1), flush=True)
    cv2.imwrite(str(WORK / 'veil-look.png'), np.clip(128 + haze / 2, 0, 255).astype(np.uint8))
    print('veil of the low plate', vl['size'], 'px,', vl['times'], 'plates wide, sigma', vl['sigmaDeg'], 'degrees, from', round(float(haze.min()), 1), 'to', round(float(haze.max()), 1), 'mean (BGR)', np.round(haze.reshape(-1, 3).mean(axis=0), 1), 'at the corners', np.round(haze[[0, 0, -1, -1], [0, -1, 0, -1]].mean(axis=1), 1), flush=True)
    del haze, share, broad
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
