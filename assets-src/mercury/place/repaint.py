import json
import re
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'wrap'))
sys.path.insert(0, 'tools/assets')
import flowcheck
import lightcurve as lc
import mosaic as M
import plates as P

SPEC = json.loads((HERE / 'plates.json').read_text())
R = SPEC['repaint']
WORK = M.WORK / 'repaint'
SIZE = SPEC['size']
TILE = R['tile']
IN = R['input']
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
WIDTH = {l['n']: l['widthDeg'] for l in SPEC['levels']}


def origins(level):
    c = R['centre'].get(str(level), [0.5, 0.5])
    far = SIZE - TILE
    cx = int(min(max(c[0] * SIZE - TILE / 2, 0), far))
    cy = int(min(max(c[1] * SIZE - TILE / 2, 0), far))
    return {'tl': (0, 0), 'tr': (far, 0), 'bl': (0, far), 'br': (far, far), 'c': (cx, cy)}


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def ln(a):
    return np.log(np.maximum(a, 2e-3))


def shown(lin):
    return (M.srgb(P.filmic(lin * R['gain'])) * 255 + 0.5).astype(np.uint8)


def taken(img8):
    return (P.unfilmic(M.linear(img8)) / R['gain']).astype(np.float32)


def look_value(name):
    return float(re.search(name + r': ([-\d.]+)', (M.ROOT / 'src/stops/mercury/look.ts').read_text()).group(1))


def light(level, kind='dive', size=None):
    cams = json.loads((M.WORK / 'tiles/cameras.json').read_text())[kind]
    curve = np.array(json.loads((M.ROOT / 'src/stops/mercury/curve.json').read_text())['curve'])
    gx, gy = M.grid((0, 0), WIDTH[level], 256)
    ndl = M.dirs(gx, gy) @ np.array(cams['sun'])
    night = curve[0]
    gain = np.maximum(lc.curve_at(curve, ndl) - night, 0) + night * look_value('nightDetail')
    size = size or SIZE
    return cv2.resize(gain.astype(np.float32), (size, size), interpolation=cv2.INTER_CUBIC), (night * look_value('nightFlat') * (1 - look_value('nightDetail'))).astype(np.float32)


def carry():
    line = re.search(r'export const carry = \{(.*)\}', (M.ROOT / 'src/stops/mercury/look.ts').read_text()).group(1)
    one = lambda name: float(re.search(name + r': ([-\d.]+)', line).group(1))
    return one('lift'), one('knee'), one('grey'), np.array([float(v) for v in re.search(r'tint: \[([^\]]*)\]', line).group(1).split(',')], np.float32)


def grade(col):
    lift, knee, grey, tint = carry()
    c = col * (1 - grey) + (col @ LUMA)[..., None] * tint * grey
    return c * lift / (1 + c.max(-1, keepdims=True) * (lift - 1) * knee)


def ungrade(col, chroma):
    lift, knee, grey, tint = carry()
    c = col / (lift - col.max(-1, keepdims=True) * (lift - 1) * knee)
    return (c @ LUMA / (1 - grey + grey * float(tint @ LUMA)))[..., None] * chroma / np.maximum(chroma @ LUMA, 1e-5)[..., None]


def zone(level, place):
    deg = np.radians(1) / (2 * M.half(WIDTH[level]) / SIZE)
    away = cv2.distanceTransform((place < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    return (1 - P.step(R['zoneDeg'][0] * deg, R['zoneDeg'][1] * deg, away)).astype(np.float32)


def lit_ground(level, kind='dive'):
    gain, floor = light(level, kind)
    return P.old_ground(level) * gain + floor


def toned(level, rgb, sharp):
    deg = np.radians(1) / (2 * M.half(WIDTH[level]) / SIZE)
    old = np.maximum(P.old_ground(level) @ LUMA, 1e-4)
    flat = np.exp(np.log(old) - blur(np.log(old), R['zoneFlatDeg'] * deg))
    inside = sharp > 0.9
    want = rgb[inside]
    q = np.linspace(0, 1, 2049)
    luma = np.interp(flat, np.quantile(flat[::4, ::4], q), np.quantile(want @ LUMA, q)).astype(np.float32)
    tint = want.mean(0) / float(want.mean(0) @ LUMA)
    return luma[..., None] * tint.astype(np.float32)


def plain(level, rgb, place, sharp, field, tone):
    b = grade(lit_ground(level)) * np.exp(field)
    z = zone(level, place)[..., None]
    return np.exp(z * (ln(toned(level, rgb, sharp)) + tone) + (1 - z) * ln(b))


def spread(value, weight):
    stack = [(value * weight[..., None], weight)]
    while min(stack[-1][1].shape) > 4:
        v, w = stack[-1]
        n = (max(v.shape[1] // 2, 1), max(v.shape[0] // 2, 1))
        stack.append((cv2.resize(v, n, interpolation=cv2.INTER_AREA), cv2.resize(w, n, interpolation=cv2.INTER_AREA)))
    v, w = stack[-1]
    out = v / np.maximum(w, 1e-6)[..., None]
    for v, w in reversed(stack[:-1]):
        up = cv2.resize(out, (v.shape[1], v.shape[0]), interpolation=cv2.INTER_CUBIC)
        k = np.clip(w, 0, 1)[..., None]
        out = np.where(w[..., None] > 1e-4, v / np.maximum(w, 1e-6)[..., None], 0) * k + up * (1 - k)
    return out


def match(rgb, place, ground, level):
    texel = 2 * M.half(WIDTH[level]) / SIZE
    deg = np.radians(1) / texel
    w = (place > 0.5).astype(np.float32)
    s = R['matchLowDeg'] * deg
    near = blur(w, s)
    diff = ln(blur(rgb * w[..., None], s) / np.maximum(near, 1e-4)[..., None]) - ln(blur(ground * w[..., None], s) / np.maximum(near, 1e-4)[..., None])
    small = 512
    field = spread(cv2.resize(diff, (small, small), interpolation=cv2.INTER_AREA), cv2.resize(w * (near > 0.6), (small, small), interpolation=cv2.INTER_AREA))
    field = blur(cv2.resize(field, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC), R['matchSoftDeg'] * deg)
    away = cv2.distanceTransform((w < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    return field * (1 - P.step(R['matchReachDeg'][0] * deg, R['matchReachDeg'][1] * deg, away))[..., None]


def soften(rgb, weight, sigma):
    steps = [0.0] + [2.0 ** k for k in range(0, 7)]
    stack = [rgb] + [blur(rgb * weight[..., None], s) / np.maximum(blur(weight, s), 1e-4)[..., None] for s in steps[1:]]
    x = np.clip(np.log2(np.maximum(sigma, 0.5)) + 1, 0, len(steps) - 1 - 1e-4)
    i = np.floor(x).astype(np.int32)
    f = (x - i)[..., None]
    out = np.zeros_like(rgb)
    for k in range(len(steps)):
        out += stack[k] * ((i == k)[..., None] * (1 - f) + (i + 1 == k)[..., None] * f)
    return out


def ground(level):
    f = WORK / ('ground-%d.npy' % level)
    if not f.exists():
        WORK.mkdir(parents=True, exist_ok=True)
        gx, gy = M.grid((0, 0), WIDTH[level], SIZE)
        np.save(f, M.valid(M.dirs(gx, gy)).astype(np.float16))
    return np.load(f).astype(np.float32)


def laid(level, kind='dive'):
    lay = np.load(P.OUT / kind / ('lay-%d.npy' % level)).astype(np.float32)
    rgb, w, elong, gsd = lay[..., :3], lay[..., 3], lay[..., 4], lay[..., 5]
    texel = 2 * M.half(WIDTH[level]) / SIZE
    low = blur(rgb @ LUMA, R['glareBlurDeg'] * np.radians(1) / texel)
    inner = cv2.distanceTransform((ground(level) > R['seen']).astype(np.uint8), cv2.DIST_L2, 5)
    place = P.step(0, R['edgeDeg'] * np.radians(1) / texel, inner) * (1 - P.step(R['elong'][0], R['elong'][1], elong)) * (1 - P.step(R['glare'][0], R['glare'][1], low))
    own = R.get('layWeight', {}).get(kind)
    if own:
        place = place * P.step(own[0], own[1], w)
    place = blur(place.astype(np.float32), 1.5)
    sharp = place * (1 - P.step(R['sharp'][0], R['sharp'][1], elong))
    sigma = np.where(elong > R['sharp'][0], R['stretch'] * gsd * elong / texel, 0)
    return rgb, place, sharp, sigma


def child(parent, level):
    k = M.half(WIDTH[level]) / M.half(WIDTH[level - 1])
    u = (np.arange(SIZE, dtype=np.float32) + 0.5) / SIZE
    x = ((u - 0.5) * k + 0.5) * SIZE - 0.5
    xx, yy = np.meshgrid(x, x)
    return np.exp(cv2.remap(ln(parent), xx, yy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE))


def base(level):
    if level == min(WIDTH):
        return grade(lit_ground(level))
    return child(np.load(WORK / ('L%d.npy' % (level - 1))).astype(np.float32), level)


def lead(level):
    WORK.mkdir(parents=True, exist_ok=True)
    rgb, place, sharp, sigma = laid(level)
    b = base(level)
    if level == min(WIDTH):
        field = np.clip(match(rgb, place, b, level), np.log(R['matchClamp'][0]), np.log(R['matchClamp'][1]))
        np.save(WORK / 'match.npy', field.astype(np.float16))
        inside = place > 0.9
        print('place over the old ground in the light and grade of the handover, inside the place, mean per channel', np.round(rgb[inside].mean(0) / b[inside].mean(0), 3), 'match field there, 1 50 99 percentile', np.round(np.exp(np.percentile(field[inside].mean(-1), [1, 50, 99])), 3), flush=True)
        tone = np.clip(match(rgb, place, toned(level, rgb, sharp), level), np.log(R['toneClamp'][0]), np.log(R['toneClamp'][1]))
        np.save(WORK / 'tone.npy', tone.astype(np.float16))
        b = blur(plain(level, rgb, place, sharp, field, tone), R['oldBlur'])
    soft = soften(rgb, (place > 1e-3).astype(np.float32), sigma)
    out = np.exp(place[..., None] * ln(soft) + (1 - place[..., None]) * ln(b))
    np.save(WORK / ('L%d-lead.npy' % level), out.astype(np.float16))
    img = Image.fromarray(shown(out))
    img.resize((1024, 1024), Image.LANCZOS).save(WORK / ('L%d-lead-view.jpg' % level), quality=90)
    for key, (x, y) in origins(level).items():
        img.crop((x, y, x + TILE, y + TILE)).resize((IN, IN), Image.LANCZOS).save(WORK / ('L%d-in-%s.jpg' % (level, key)), quality=95, subsampling=0)
    print('lead', level, origins(level), flush=True)


def style():
    WORK.mkdir(parents=True, exist_ok=True)
    rgb, place, sharp, sigma = laid(max(WIDTH))
    n = R['styleSize']
    s = cv2.integral(sharp.astype(np.float64))
    win = s[n:, n:] - s[:-n, n:] - s[n:, :-n] + s[:-n, :-n]
    y, x = np.unravel_index(np.argmax(win), win.shape)
    Image.fromarray(shown(rgb[y:y + n, x:x + n])).resize((IN, IN), Image.LANCZOS).save(WORK / 'style.jpg', quality=95, subsampling=0)
    print('style at', x, y, 'size', n, 'sharp share', round(float(win[y, x] / n / n), 4))


def register(take, ref_path, take_path):
    f, _, st = flowcheck.flow_stats(ref_path, take_path, 1024)
    n = take.shape[0]
    f = cv2.GaussianBlur(f, (0, 0), 24)
    f = cv2.resize(f, (n, n), interpolation=cv2.INTER_CUBIC) * (n / 1024)
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    return cv2.remap(take, xx + f[..., 0], yy + f[..., 1], cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT), st


def ramp(n, lo, hi):
    t = np.clip((np.arange(n) - lo) / max(hi - lo, 1), 0, 1)
    return t * t * (3 - 2 * t)


def build(level, takes):
    ref = np.load(WORK / ('L%d-lead.npy' % level)).astype(np.float32)
    acc = np.zeros((SIZE, SIZE, 3), np.float32)
    wacc = np.zeros((SIZE, SIZE), np.float32)
    mid = SIZE // 2
    up = ramp(SIZE, mid - R['seam'] // 2, mid + R['seam'] // 2)
    centre = None
    for key, (x, y) in origins(level).items():
        take = takes.get(key)
        if not take:
            continue
        path = WORK / ('L%d-%s-%s.png' % (level, take, key))
        t = np.asarray(Image.open(path).convert('RGB').resize((TILE, TILE), Image.LANCZOS))
        t, st = register(t, WORK / ('L%d-in-%s.jpg' % (level, key)), path)
        print('  %s %s: flow before registration median %.2f p90 %.2f p99 %.2f px at 1024' % (key, take, st[0], st[1], st[2]), flush=True)
        t = taken(t)
        lt, lr = ln(t), ln(ref[y:y + TILE, x:x + TILE])
        t = np.exp(lt - blur(lt, R['lock']) + blur(lr, R['lock']))
        if key == 'c':
            e = ramp(TILE, 0, R['edge']) * ramp(TILE, 0, R['edge'])[::-1]
            wt = np.outer(e, e).astype(np.float32)
            reach = R.get('centreReachDeg', {}).get(str(level))
            if reach:
                deg = np.radians(1) / (2 * M.half(WIDTH[level]) / SIZE)
                away = cv2.distanceTransform((laid(level)[1] < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
                wt = wt * (1 - P.step(reach[0] * deg, reach[1] * deg, away))[y:y + TILE, x:x + TILE]
            centre = (t, wt.astype(np.float32), x, y)
            continue
        wx = (1 - up) if x == 0 else up
        wy = (1 - up) if y == 0 else up
        wt = np.outer(wy[y:y + TILE], wx[x:x + TILE]).astype(np.float32)
        acc[y:y + TILE, x:x + TILE] += t * wt[..., None]
        wacc[y:y + TILE, x:x + TILE] += wt
    res = np.where(wacc[..., None] > 1e-4, acc / np.maximum(wacc, 1e-4)[..., None], ref)
    if centre is not None:
        t, wt, x, y = centre
        res[y:y + TILE, x:x + TILE] = res[y:y + TILE, x:x + TILE] * (1 - wt[..., None]) + t * wt[..., None]
    np.save(WORK / ('L%d-painted.npy' % level), res.astype(np.float16))
    rgb, place, sharp, sigma = laid(level)
    flat = plain(level, rgb, place, sharp, np.load(WORK / 'match.npy').astype(np.float32), np.load(WORK / 'tone.npy').astype(np.float32)) if level == min(WIDTH) else ref
    texel = 2 * M.half(WIDTH[level]) / SIZE
    day = np.maximum(P.step(R['night'][0], R['night'][1], blur(ref @ LUMA, R['nightBlurDeg'] * np.radians(1) / texel)), place)[..., None]
    res = np.exp(day * ln(res) + (1 - day) * ln(flat))
    res = np.exp(sharp[..., None] * ln(rgb) + (1 - sharp[..., None]) * ln(res))
    np.save(WORK / ('L%d.npy' % level), res.astype(np.float16))
    Image.fromarray(shown(res)).resize((1024, 1024), Image.LANCZOS).save(WORK / ('L%d-view.jpg' % level), quality=90)
    print('built', level, takes)


def flow(level, take):
    for key in origins(level):
        f = WORK / ('L%d-%s-%s.png' % (level, take, key))
        if f.exists():
            _, _, s = flowcheck.flow_stats(WORK / ('L%d-in-%s.jpg' % (level, key)), f, 1024)
            print('L%d %s %s: flow median %.2f p90 %.2f p99 %.2f px at 1024' % (level, take, key, s[0], s[1], s[2]))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'lead':
        lead(int(sys.argv[2]))
    elif cmd == 'style':
        style()
    elif cmd == 'flow':
        flow(int(sys.argv[2]), sys.argv[3])
    elif cmd == 'build':
        build(int(sys.argv[2]), json.loads(sys.argv[3]))
