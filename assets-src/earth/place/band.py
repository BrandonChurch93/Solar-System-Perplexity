import sys
import shutil
import numpy as np
import cv2
from PIL import Image
import geom as g

Image.MAX_IMAGE_PIXELS = None
ROOT = g.ROOT
PUB = ROOT / 'public/assets/earth'
WORK = ROOT / 'out/work/earth/place/band'
PLATES = g.PLACE['plates']
HAZE = PLATES['haze']
BAND = HAZE['band']
SHARE = HAZE['share']
TONE = PLATES['tone']
GROUND = g.RELIEF['ground']
PC = g.direction(PLATES['centre']['lon'], PLATES['centre']['lat'])
NADIR = g.direction(g.GLOBE['lon'], g.GLOBE['lat'])
EYE = NADIR * (1 + 1 / g.R)
SPOT = g.G.T @ g.SPOT
LEVELS = [(lv, SPOT) for lv in PLATES['under']] + [(lv, PC) for lv in PLATES['levels']]
PLACE_WIDE = PLATES['levels'][0]['widthDeg']
STAND = PLATES['stand']
RADIUS_KM = 6371.0


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def to_code(c):
    return np.where(c >= 0.0031308, 1.055 * np.maximum(c, 0.0031308) ** (1 / 2.4) - 0.055, 12.92 * c)


def from_code(c):
    return np.where(c >= 0.04045, ((np.maximum(c, 0.04045) + 0.055) / 1.055) ** 2.4, c / 12.92)


LUT = from_code(np.arange(256) / 255).astype(np.float32)
_tex = {}


def tex(name):
    if name not in _tex:
        _tex[name] = LUT[np.asarray(Image.open(PUB / 'full' / name).convert('RGB'))]
    return _tex[name]


def plane(d, c):
    n, e, u = g.frame_at(c)
    k = d @ n
    kk = np.maximum(k, 0.05)
    return (d @ e) / kk, (d @ u) / kk, k


def the_map(d):
    out = None
    for lv, c in LEVELS:
        hx, hy, k = plane(d, c)
        wide = 1 / (2 * np.tan(np.radians(lv['widthDeg']) / 2))
        scale = wide * lv['raster'] / lv['size']
        qx = (hx - lv['offset'][0] / (lv['raster'] * wide)) * scale
        qy = (hy - lv['offset'][1] / (lv['raster'] * wide)) * scale
        t = tex(lv['file'])
        s = t.shape[0]
        px = cv2.remap(t, ((qx + 0.5) * s - 0.5).astype(np.float32), ((0.5 - qy) * s - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        w = ((k >= 0.3) * step(0.5, 0.5 - PLATES['feather'], np.maximum(np.abs(qx), np.abs(qy))))[..., None].astype(np.float32)
        out = px if out is None else out * (1 - w) + px * w
    return to_code(out)


def arc_of(d):
    return np.degrees(np.arccos(np.clip(d @ NADIR, -1, 1)))


def cover_of(d):
    to = EYE - d
    mu = np.maximum((d * to).sum(-1) / np.linalg.norm(to, axis=-1), 0)
    m = np.minimum(1 / (mu + 0.025 * np.exp(-11 * mu)), SHARE['cap'])
    arc = arc_of(d)
    return (1 - np.exp(-BAND['air'] * (m - 1))) * step(BAND['coverDeg'][0], BAND['coverDeg'][1], arc) * (1 - step(BAND['backDeg'][0], BAND['backDeg'][1], arc))


def grid(c, half, n):
    nn, e, u = g.frame_at(c)
    q = ((np.arange(n) + 0.5) / n - 0.5) * 2 * half
    gx, gy = np.meshgrid(q, -q)
    return g.unit(nn + gx[..., None] * e + gy[..., None] * u)


def read(t, u, v):
    n = t.shape[0]
    return cv2.remap(t, (u * n - 0.5).astype(np.float32), ((1 - v) * n - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def polar(d):
    n, e, u = g.frame_at(NADIR)
    return arc_of(d), np.degrees(np.arctan2(d @ e, d @ u))


def air_colour(approved, d):
    spec = BAND['colour']
    arcs = np.arange(spec['fromDeg'], spec['toDeg'], spec['ringDeg']) + spec['ringDeg'] / 2
    turns = np.arange(-180, 180, spec['turnDeg']) + spec['turnDeg'] / 2
    n, e, u = g.frame_at(NADIR)
    a, t = np.radians(arcs)[:, None], np.radians(turns)[None, :]
    at = np.cos(a)[..., None] * n + np.sin(a)[..., None] * (np.sin(t)[..., None] * e + np.cos(t)[..., None] * u)
    x, y, seen = g.image_of(at)
    th, tw = approved.shape[:2]
    box = GROUND['box']
    cx, cy = (x - box[0]) * tw / box[2] - 0.5, (y - box[1]) * th / box[3] - 0.5
    line = np.polyval(GROUND['horizon'][8::-1], (x - GROUND['horizonSpan'][0]) / GROUND['horizonSpan'][1])
    ok = (seen & (cx >= 0) & (cx <= tw - 1) & (cy <= th - 1) & (y > line + spec['clearPx'])).astype(np.float32)
    got = cv2.remap(approved, cx.astype(np.float32), cy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) * ok[..., None]
    sa, st = spec['sigmaDeg'][0] / spec['ringDeg'], spec['sigmaDeg'][1] / spec['turnDeg']
    blur = lambda v: cv2.GaussianBlur(v, (0, 0), sigmaX=st, sigmaY=sa, borderType=cv2.BORDER_REPLICATE)
    near = blur(ok)
    mean = got.sum(axis=1) / np.maximum(ok.sum(axis=1), 1e-6)[:, None]
    last = np.nonzero(ok.sum(axis=1) >= spec['leastTurns'])[0].max()
    mean[last:] = mean[last]
    field = blur(got) / np.maximum(near, 1e-6)[..., None]
    share = step(spec['trust'][0], spec['trust'][1], near)[..., None]
    field = field * share + mean[:, None, :] * (1 - share)
    field[last:] = field[last]
    print('air colour of the approved band by degrees (mean of the turns):', ', '.join('%g %s' % (arcs[i], np.round(mean[i], 2).tolist()) for i in range(0, len(arcs), max(len(arcs) // 12, 1))), 'held from', arcs[last], flush=True)
    r, turn = polar(d)
    px = ((turn + 180) / spec['turnDeg'] - 0.5).astype(np.float32)
    py = ((r - spec['fromDeg']) / spec['ringDeg'] - 0.5).astype(np.float32)
    return cv2.remap(field, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def stand_field():
    n, times = STAND['size'], STAND['times']
    half = times * np.tan(np.radians(PLACE_WIDE) / 2)
    d = grid(PC, half, n)
    code = np.concatenate([the_map(d[r:r + 256]) for r in range(0, n, 256)]).astype(np.float32)
    lo = code.min(-1)
    cloud = step(STAND['cloud'][0], STAND['cloud'][1], lo) * (1 - step(STAND['warm'][0], STAND['warm'][1], code[..., 0] - code[..., 2]))
    km = 2 * half * RADIUS_KM / n
    dist = cv2.distanceTransform((cloud > 0.5).astype(np.uint8), cv2.DIST_L2, 5) * km
    rng = np.random.default_rng(STAND['seed'])
    lumps, total, weight = 0, 0, 1
    for cell in STAND['lumpKm']:
        m = max(int(round(n * km / cell)), 2)
        lumps = lumps + weight * cv2.resize(rng.random((m, m)).astype(np.float32), (n, n), interpolation=cv2.INTER_CUBIC)
        total += weight
        weight *= STAND['lumpGain']
    lumps = lumps / total
    bright = np.clip((lo - STAND['cloud'][0]) / (1 - STAND['cloud'][0]), 0, 1)
    h = np.clip(dist / STAND['reachKm'], 0, 1) ** STAND['power'] * np.clip(STAND['lump'][0] + STAND['lump'][1] * (2 * lumps - 1) + STAND['bright'] * (bright - 0.5), 0.05, 2)
    h = np.minimum(h, 1) * step(STAND['fromDeg'][0], STAND['fromDeg'][1], arc_of(d))
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), STAND['blurPx'])
    rim = STAND['rimPx']
    h[:rim] = h[-rim:] = 0
    h[:, :rim] = h[:, -rim:] = 0
    out = np.clip(np.round(h * 255), 0, 255).astype(np.uint8)
    Image.fromarray(out).save(PUB / 'full' / STAND['file'], optimize=True)
    Image.fromarray(cv2.resize(out, (n // 2, n // 2), interpolation=cv2.INTER_AREA)).save(PUB / 'web' / STAND['file'], optimize=True)
    print('stand: cloud share of the raster %.4f, km a texel %.3f, mean height over cloud %.2f km, share of the raster that stands %.4f' % ((cloud > 0.5).mean(), km, (h[cloud > 0.5]).mean() * STAND['km'], (out > 0).mean()), flush=True)
    return out.astype(np.float32) / 255


def stand_at(field, p):
    hx, hy, k = plane(p, PC)
    scale = 1 / (2 * np.tan(np.radians(PLACE_WIDE) / 2) * STAND['times'])
    u, v = hx * scale + 0.5, hy * scale + 0.5
    inside = (k >= 0.3) & (np.abs(u - 0.5) < 0.5) & (np.abs(v - 0.5) < 0.5)
    return read(field, u, v) * inside * (STAND['km'] / RADIUS_KM)


def stood(field, d, eye, amount=1.0):
    to = eye - d
    v = to / np.linalg.norm(to, axis=-1, keepdims=True)
    up = (d * v).sum(-1)
    t = (v - d * up[..., None]) / np.maximum(up, STAND['graze'])[..., None]
    top = amount * STAND['km'] / RADIUS_KM
    n = STAND['steps']
    z = np.zeros(d.shape[:-1], np.float64)
    done = np.zeros(d.shape[:-1], bool)
    prev = np.full(d.shape[:-1], -1.0)
    for i in range(n + 1):
        zi = top * (1 - i / n)
        fi = amount * stand_at(field, d + t * zi) - zi
        now = ~done & (fi >= 0)
        z = np.where(now, zi + (top / n) * fi / np.maximum(fi - prev, 1e-9), z)
        done |= now
        prev = fi
    return d + t * z[..., None], z


def shaded(field, at, z, code, sun, amount=1.0):
    up = g.unit(at)
    sd = up @ sun
    flat = g.unit(sun - up * sd[..., None])
    rise = np.maximum(sd, STAND['sunFloor']) / np.sqrt(np.maximum(1 - sd * sd, 1e-6))
    e = STAND['slopeKm'] / RADIUS_KM
    slope = amount * (stand_at(field, up + flat * e) - stand_at(field, up - flat * e)) / (2 * e)
    body = np.clip(amount * stand_at(field, up) / (STAND['bodyKm'] / RADIUS_KM), 0, 1)
    face = np.clip(STAND['slope'] * np.maximum(slope, 0), 0, 1)
    top = amount * STAND['km'] / RADIUS_KM
    shadow = np.zeros_like(z)
    m = STAND['shadowSteps']
    for j in range(1, m + 1):
        reach = (j / m) * top / rise
        shadow = np.maximum(shadow, np.clip((amount * stand_at(field, up + flat * reach[..., None]) - (z + reach * rise)) / (STAND['softKm'] / RADIUS_KM), 0, 1))
    tone = 1 - np.array(STAND['shade'])
    return code * (1 - (body * face)[..., None] * tone) * (1 - STAND['shadow'] * shadow[..., None] * tone)


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    if 'stand' in sys.argv[1:]:
        stand_field()
        return
    src_veil, src_ground, src_web = WORK / 'veil-src.bin', WORK / 'ground-full.webp', WORK / 'ground-web.webp'
    if '--fresh' in sys.argv or not src_veil.exists():
        shutil.copyfile(PUB / 'full' / HAZE['file'], src_veil)
    if '--fresh' in sys.argv or not src_ground.exists():
        shutil.copyfile(PUB / 'full' / GROUND['file'], src_ground)
    if '--fresh' in sys.argv or not src_web.exists():
        shutil.copyfile(PUB / 'web' / GROUND['file'], src_web)

    n, times = HAZE['size'], HAZE['times']
    half = times * np.tan(np.radians(PLACE_WIDE) / 2)
    old = np.frombuffer(src_veil.read_bytes(), np.float16).reshape(n, n, 4)[::-1].astype(np.float32)
    approved = np.asarray(Image.open(src_ground).convert('RGB')).astype(np.float32) / 255
    k = cover_of(grid(PC, half, n)).astype(np.float32)
    air = air_colour(approved, grid(PC, half, n))
    veil = np.concatenate([old[..., :3] * (1 - k[..., None]) + air * k[..., None], k[..., None]], axis=2).astype(np.float16)
    for s in ('full', 'web'):
        (PUB / s / HAZE['file']).write_bytes(veil[::-1].tobytes())
    veil = veil.astype(np.float32)
    ring = arc_of(grid(PC, half, n))
    print('veil with the cover of the air, by degrees from the point under the close camera (cover, colour):', ', '.join('%g %.2f %s' % (a, k[(ring >= a) & (ring < a + 0.5)].mean(), np.round(veil[(ring >= a) & (ring < a + 0.5)][:, :3].mean(0), 2).tolist()) for a in (4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 18)), flush=True)

    field = stand_field()
    sun = g.unit(np.array(STAND['sun']) @ g.TO_BODY.T)
    tone = np.frombuffer((PUB / 'full' / TONE['file']).read_bytes(), np.float16).reshape(TONE['size'], TONE['size'], 4)[::-1].astype(np.float32)
    full = np.clip(np.round(approved * 255), 0, 255).astype(np.uint8)
    del approved
    th, tw = full.shape[:2]
    box = GROUND['box']
    sx, sy = tw / box[2], th / box[3]
    xs = box[0] + (np.arange(tw) + 0.5) / sx
    coarse = arc_of(g.local_to_body(g.sea(g.ray(*np.meshgrid(xs[::32], box[1] + (np.arange(0, th, 8) + 0.5) / sy)))[0]))
    hit = g.sea(g.ray(*np.meshgrid(xs[::32], box[1] + (np.arange(0, th, 8) + 0.5) / sy)))[1]
    rows = np.nonzero((hit & (coarse >= BAND['texelDeg'][0]) & (coarse <= BAND['backDeg'][1])).any(axis=1))[0]
    top, bottom = max(int(rows.min()) * 8 - 16, 0), min(int(rows.max()) * 8 + 24, th)
    lines = BAND['lines']
    place = 1 / (2 * np.tan(np.radians(PLACE_WIDE) / 2))
    tone_wide = 1 / (2 * np.tan(np.radians(TONE['widthDeg']) / 2))
    hx = (xs - GROUND['horizonSpan'][0]) / GROUND['horizonSpan'][1]
    horizon = np.polyval(GROUND['horizon'][8::-1], hx)
    changed = 0
    for r0 in range(top, bottom, 16):
        r1 = min(r0 + 16, bottom)
        ys = box[1] + (np.repeat(np.arange(r0, r1), lines) + np.tile((np.arange(lines) + 0.5) / lines, r1 - r0)) / sy
        gx, gy = np.meshgrid(xs, ys)
        p, ok = g.sea(g.ray(gx, gy))
        d = g.unit(g.local_to_body(p))
        arc = arc_of(d)
        w = ok * (gy > horizon[None, :] + 2) * step(BAND['texelDeg'][0], BAND['texelDeg'][1], arc) * (1 - step(BAND['backDeg'][0], BAND['backDeg'][1], arc))
        if not w.any():
            continue
        hx_, hy_, kk = plane(d, PC)
        v = read(veil, hx_ * place / times + 0.5, hy_ * place / times + 0.5)
        at, z = stood(field, d, EYE)
        code = np.clip(shaded(field, at, z, the_map(g.unit(at)), sun) * (1 - v[..., 3:4]) + v[..., :3], 0, 1)
        tn = read(tone, hx_ * tone_wide + 0.5, hy_ * tone_wide + 0.5)
        inside = step(0.5, 0.5 - PLATES['feather'], np.maximum(np.abs(hx_ * place), np.abs(hy_ * place)))
        hi, lo = code.max(-1), code.min(-1)
        sea = (1 - step(TONE['cloud'][0], TONE['cloud'][1], lo)) * step(TONE['grey'][0], TONE['grey'][1], (hi - lo) / np.maximum(hi, 1e-3))
        code = np.clip(code + ((1 - inside) * sea)[..., None] * tn[..., :3], 0, 1)
        was = np.repeat(full[r0:r1].astype(np.float32) / 255, lines, axis=0)
        now = (was * (1 - w[..., None]) + code * w[..., None]).reshape(r1 - r0, lines, tw, 3).mean(axis=1)
        out = np.clip(np.round(now * 255), 0, 255).astype(np.uint8)
        changed += int((out != full[r0:r1]).any(axis=2).sum())
        full[r0:r1] = out
    print('sea layer: texel rows', top, 'to', bottom, 'of', th, 'changed texels', changed, flush=True)
    Image.fromarray(full).save(PUB / 'full' / GROUND['file'], lossless=True, quality=70, method=4)
    web_was = np.asarray(Image.open(src_web).convert('RGB')).copy()
    wh, ww = web_was.shape[:2]
    f = th // wh
    a, b = top // f, -(-bottom // f)
    web_was[a:b] = cv2.resize(full[a * f:b * f], (ww, b - a), interpolation=cv2.INTER_AREA)
    Image.fromarray(web_was).save(PUB / 'web' / GROUND['file'], quality=93, method=6)
    cv2.imwrite(str(WORK / 'band-look.jpg'), cv2.resize(full[top:bottom, :, ::-1], (2048, (bottom - top) // 4), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('done', flush=True)


if __name__ == '__main__':
    main()
