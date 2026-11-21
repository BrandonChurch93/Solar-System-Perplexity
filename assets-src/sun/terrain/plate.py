import os
import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from scipy.optimize import curve_fit
import json
from common import WORK, LOOPS_BOX, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, TX, TY, FEET, LIT, read, write, take_to_grid, step, scene, display, to_linear, to_srgb, fit

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/sun'
LUM = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
FEATHER = 90
FEATHER_SKY = 900
EDGE = 10
SOFT_SKY = 36
WIDEN = 49
GLOW = (1.6, 4.2)
RISE = 0.25
FAN = (380, 560)
RIM = (-1.4, -0.4)
STARS = (7, 1.0, 2.0)
HOLES = 13
FILL = 27
MEND = 8
WHITE = (0.2, 0.5, 0.1, 0.4)
BASE = 'assets-src/sun/terrain/base90.jpg'
NATIVE = 'references/approved/sun-close.jpg'
PEAK = 5
UNDER = 0.88
CUT = (5.0, 7.0)
NEAR = (0.9, 1.8)


def elevation(w, h):
    f = fit()
    down = np.array(f['down'])
    xs = ((np.arange(w) + 0.5) / w - 0.5) * 2 * TX
    ys = (0.5 - (np.arange(h) + 0.5) / h) * 2 * TY
    gx, gy = np.meshgrid(xs, ys)
    cosang = (gx * down[0] + gy * down[1] - down[2]) / np.sqrt(gx * gx + gy * gy + 1)
    return (np.degrees(np.arccos(np.clip(cosang, -1, 1))) - f['alphaDeg']).astype(np.float32)


def loop_mask(a2, c2):
    a = cv2.resize(a2, (2816, 1584), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    c = cv2.resize(c2, (2816, 1584), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    d = a @ LUM - c @ LUM
    h, w = d.shape
    above = elevation(w, h)
    sky = step(above, -0.6, 0.3)
    fine = cv2.GaussianBlur(np.maximum(d, 0), (0, 0), 5) > 0.03
    broad = cv2.GaussianBlur(d, (0, 0), 14) > 0.035
    core = np.where(sky > 0.5, fine, broad).astype(np.uint8)
    core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(core)
    keep = np.zeros_like(core)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 1500:
            keep[lab == i] = 1
    box = np.zeros_like(d)
    x0, y0, x1, y1 = LOOPS_BOX
    box[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1
    box = cv2.GaussianBlur(box, (0, 0), 12)
    keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))).astype(np.float32)
    m = np.clip(cv2.GaussianBlur(keep, (0, 0), 6) * 1.6 - 0.3, 0, 1) * np.clip(box * 2 - 1, 0, 1)
    return cv2.resize(m, (a2.shape[1], a2.shape[0]), interpolation=cv2.INTER_LINEAR)


def boxed(shape):
    h, w = shape
    box = np.zeros((h, w), dtype=np.float32)
    x0, y0, x1, y1 = LOOPS_BOX
    box[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1
    return np.clip(cv2.GaussianBlur(box, (0, 0), 24) * 2 - 1, 0, 1)


def main():
    a2 = read(f'{WORK}/close-x2.png')
    c2 = take_to_grid('clean', read(f'{WORK}/close-clean-x.png'), (5632, 3168), (-0.25, -0.25), 0.5)
    m = loop_mask(a2, c2)
    cv2.imwrite(f'{WORK}/loops-mask.png', (m * 255).astype(np.uint8))
    native = cv2.resize(read(NATIVE), (5632, 3168), interpolation=cv2.INTER_CUBIC)
    limit = cv2.dilate(native, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (PEAK, PEAK)))
    print('highlights above the approved image', round(float((a2.astype(np.int16) > limit.astype(np.int16) + 2).any(2).mean()), 4))
    a2 = np.minimum(a2, limit)
    del native, limit
    da = a2.astype(np.float32) / 255
    dc = c2.astype(np.float32) / 255
    del a2, c2
    a = scene(da)
    c = scene(dc)
    sky = step(cv2.resize(elevation(2816, 1584), (5632, 3168), interpolation=cv2.INTER_LINEAR), -0.25, 0.25)
    el = cv2.resize(elevation(2816, 1584), (5632, 3168), interpolation=cv2.INTER_LINEAR)
    X2 = np.arange(5632, dtype=np.float32)
    Y2 = np.arange(3168, dtype=np.float32)
    fans = np.zeros((3168, 5632), dtype=np.float32)
    for fx, fy in FEET:
        fan = step(fy * 3168 - Y2, -16, 40)[:, None] * (1 - step(np.abs(X2 - fx * 5632), FAN[0], FAN[1]))[None, :]
        fans = np.maximum(fans, fan.astype(np.float32))
    lit = np.clip(cv2.GaussianBlur(a, (0, 0), LIT[0]) / (cv2.GaussianBlur(c, (0, 0), LIT[0]) + 0.02), 1, LIT[1]) - 1
    lit = cv2.GaussianBlur(lit * ((1 - step(el, LIT[2], LIT[3])) * (1 - fans) * m)[..., None], (0, 0), 10)
    lit = to_linear(np.round(to_srgb(lit / LIT[1]) * 255) / 255).astype(np.float32) * LIT[1]
    c *= 1 + lit
    if os.path.exists(BASE):
        base = read(BASE)
        drawn = scene(cv2.resize(base, (5632, 3168), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255)
        opened = cv2.morphologyEx(base, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (STARS[0], STARS[0])))
        spark = cv2.GaussianBlur(np.maximum(base.astype(np.float32) - opened, 0) / 255, (0, 0), 1)
        white = 1 - step((spark[..., 0] - spark[..., 2]) / (spark[..., 0] + 0.02), WHITE[0], WHITE[1])
        white = cv2.resize(white.astype(np.float32), (5632, 3168), interpolation=cv2.INTER_LINEAR) * step(el, WHITE[2], WHITE[3])
        drawn += (scene(cv2.resize(opened, (5632, 3168), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255) - drawn) * np.maximum(step(el, STARS[1], STARS[2]), white)[..., None]
        del opened, spark, white
        c += (drawn - c) * sky[..., None]
        del drawn, base
    dce = display(c)
    lift = (da - dce) @ LUM
    d = np.maximum(a - c, 0)
    soft = cv2.GaussianBlur(np.maximum(da - dce, 0), (0, 0), 1.5)
    warm = step((soft[..., 0] - soft[..., 2]) / (soft[..., 0] + 0.02), 0.2, 0.5)
    warm = np.maximum(warm, step(cv2.GaussianBlur(np.maximum(lift, 0), (0, 0), 6), 0.12, 0.3))
    strands = np.maximum(np.maximum(step(cv2.GaussianBlur(lift, (0, 0), 1.2), 0.22, 0.45), fans), step(el, RIM[0], RIM[1]))
    del dce
    del c, soft, lift, el, fans
    on_ground = d * strands[..., None]
    under = cv2.GaussianBlur(cv2.morphologyEx(d, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (HOLES, HOLES))), (0, 0), 2)
    cover = cv2.GaussianBlur(warm, (0, 0), MEND)
    under = np.maximum(under, cv2.GaussianBlur(d * warm[..., None], (0, 0), MEND) / (cover + 0.1)[..., None] * step(cover, 0.2, 0.5)[..., None])
    del cover
    on_sky = under + (d - under) * warm[..., None]
    del under
    wide_m = cv2.dilate((m > 0.02).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (WIDEN, WIDEN)))
    wide_m = np.clip(cv2.GaussianBlur(wide_m, (0, 0), WIDEN / 4) * 1.5 - 0.25, 0, 1) * boxed(wide_m.shape)
    loops = np.minimum(on_ground * (m * (1 - sky))[..., None] + on_sky * (np.maximum(m, wide_m) * sky)[..., None], a * 0.98)
    baked = lit
    del on_ground, on_sky, d, warm, strands, sky, a
    ring = (wide_m > 0.05) & (wide_m < 0.6)
    print('clean take against approved in the ring', [round(float(dc[..., k][ring].mean() / da[..., k][ring].mean()), 3) for k in range(3)])
    clean = da + (dc - da) * wide_m[..., None]
    cv2.imwrite(f'{WORK}/loops-mask-wide.png', (wide_m * 255).astype(np.uint8))
    del da, dc, wide_m, ring
    x0, y0, x1, y1 = LOOPS_BOX
    crop = display(loops[round(y0 * 3168):round(y1 * 3168), round(x0 * 5632):round(x1 * 5632)])
    spill = to_srgb(baked[round(y0 * 3168):round(y1 * 3168), round(x0 * 5632):round(x1 * 5632)] / LIT[1]).astype(np.float32)
    del loops, baked
    write(f'{OUT}/full/loops-glow.png', cv2.resize(spill, (spill.shape[1] // 4, spill.shape[0] // 4), interpolation=cv2.INTER_AREA))
    write(f'{OUT}/web/loops-glow.png', cv2.resize(spill, (spill.shape[1] // 8, spill.shape[0] // 8), interpolation=cv2.INTER_AREA))
    del spill
    print('loops crop', crop.shape)
    write(f'{OUT}/full/loops.webp', crop, 92)
    write(f'{OUT}/web/loops.webp', cv2.resize(crop, (crop.shape[1] // 2, crop.shape[0] // 2), interpolation=cv2.INTER_AREA), 90)
    write(f'{WORK}/clean-centre.jpg', cv2.resize(clean, (2816, 1584), interpolation=cv2.INTER_AREA), 92)

    w, h = CANVAS
    k = SPAN * 2816 / w
    wide = take_to_grid('wide', read(f'{WORK}/close-wide-x.png'), CANVAS, (LEFT * 2816 + 0.5 * k - 0.5, TOP * 1584 + 0.5 * k - 0.5), k).astype(np.float32) / 255
    k2 = SPAN * 5632 / w
    inv = np.array([[k2, 0, LEFT * 5632 + 0.5 * k2 - 0.5], [0, k2, TOP * 3168 + 0.5 * k2 - 0.5]])
    centre = cv2.warpAffine(clean, inv, CANVAS, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    del clean
    fx0, fx1 = -LEFT / SPAN * w, (1 - LEFT) / SPAN * w
    fy0, fy1 = -TOP / SPAN * h, (1 - TOP) / SPAN * h
    X = np.arange(w, dtype=np.float32) + 0.5
    Y = np.arange(h, dtype=np.float32) + 0.5
    f = fit()
    down = np.array(f['down'], dtype=np.float32)
    gx = ((LEFT + X / w * SPAN) - 0.5) * 2 * TX
    gy = (0.5 - (TOP + Y / h * SPAN)) * 2 * TY
    cosang = (gx[None, :] * down[0] + gy[:, None] * down[1] - down[2]) / np.sqrt(gx[None, :] ** 2 + gy[:, None] ** 2 + 1)
    above = (np.degrees(np.arccos(np.clip(cosang, -1, 1))) - f['alphaDeg']).astype(np.float32)
    del cosang
    skyw = step(above, 0.8, 3.5).astype(np.float32)

    def window(feather):
        wx = step(X, fx0, fx0 + feather) * (1 - step(X, fx1 - feather, fx1))
        wy = step(Y, fy0, fy0 + feather) * (1 - step(Y, fy1 - feather, fy1))
        return (wy[:, None] * wx[None, :]).astype(np.float32)

    def beyond(feather):
        wx = step(X, fx0 - feather, fx0) * (1 - step(X, fx1, fx1 + feather))
        wy = step(Y, fy0 - feather, fy0) * (1 - step(Y, fy1, fy1 + feather))
        return (wy[:, None] * wx[None, :]).astype(np.float32)

    inside = window(FEATHER)
    inside += (beyond(EDGE) - inside) * skyw
    box = (slice(int(fy0) + 8, int(fy1) - 8, 3), slice(int(fx0) + 8, int(fx1) - 8, 3))
    free = cv2.warpAffine(m, inv, CANVAS, flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)[box] < 0.01
    levels = np.linspace(0, 1, 1024)
    part = above[box]
    for c in range(3):
        out = np.zeros((h, w), dtype=np.float32)
        for sel, weight in ((free & (part < 0.5), 1 - skyw), (free & (part > 2.5), skyw)):
            src = np.sort(wide[..., c][box][sel])
            dst = np.sort(centre[..., c][box][sel])
            q = np.linspace(0, len(src) - 1, 4096).astype(int)
            lut = np.interp(levels, src[q], dst[q])
            lut = ndi.gaussian_filter1d(lut, 6, mode='nearest')
            out += np.interp(wide[..., c], levels, lut).astype(np.float32) * weight
        wide[..., c] = out
    del out, part
    wide += (cv2.GaussianBlur(centre, (0, 0), SOFT_SKY) - cv2.GaussianBlur(wide, (0, 0), SOFT_SKY)) * (beyond(FEATHER_SKY) * skyw)[..., None]
    np.maximum(wide, 0, out=wide)
    ring = (inside > 0.02) & (inside < 0.98)
    for c in range(3):
        print('seam ratio ground', c, float(centre[..., c][ring & (skyw < 0.01)].mean() / wide[..., c][ring & (skyw < 0.01)].mean()), 'sky', float(centre[..., c][ring & (skyw > 0.99)].mean() / wide[..., c][ring & (skyw > 0.99)].mean()))
    canvas = wide + (centre - wide) * inside[..., None]
    del wide, centre, ring, skyw
    write(f'{WORK}/canvas-check.jpg', cv2.resize(canvas, (w // 4, h // 4), interpolation=cv2.INTER_AREA), 88)

    lum = cv2.GaussianBlur(canvas @ LUM, (0, 0), 4)
    body = ndi.uniform_filter1d(lum, 120, axis=0, origin=-59)
    hit = (lum > 0.2) & (body > 0.24) & (above < 1.5)
    edge = hit.argmax(0).astype(np.float32)
    edge = ndi.median_filter(edge, 41, mode='nearest')
    edge = ndi.gaussian_filter1d(edge, 12, mode='nearest')
    ground = step(Y[:, None] - edge[None, :], -14, 4).astype(np.float32)
    np.save(f'{WORK}/canvas-edge.npy', edge)
    s = scene(canvas)
    del canvas, lum, body, hit
    band = (above > 0.8) & (above < 2.0) & (ground < 0.01)
    r, g, b = s[..., 0][band], s[..., 1][band], s[..., 2][band]
    sel = r > np.percentile(r, 60)
    kg = float(np.median(g[sel] / r[sel]))
    kb = float(np.median(b[sel] / r[sel]))
    print('glow colour', 1, round(kg, 3), round(kb, 3))
    colour = np.array([1, kg, kb], dtype=np.float32)
    amount = np.clip((s[..., 0] - s[..., 2]) / (1 - kb), 0, None)
    mask_c = cv2.warpAffine(m, inv, CANVAS, flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
    sel = (inside > 0.98) & (mask_c < 0.01) & (ground < 0.01) & (above > 0.05) & (above < 7)
    del mask_c
    el = above[sel][::5]
    am = amount[sel][::5]
    del sel
    bins = np.arange(0.05, 7.0, 0.1)
    idx = np.digitize(el, bins)
    mid = (bins[:-1] + bins[1:]) / 2
    prof = np.array([np.percentile(am[idx == i], 10) if (idx == i).sum() > 50 else np.nan for i in range(1, len(bins))])
    ok = ~np.isnan(prof)

    def two(e, a1, s1, a2, s2):
        return a1 * np.exp(-e / s1) + a2 * np.exp(-e / s2)

    par, _ = curve_fit(two, mid[ok], prof[ok], p0=(0.05, 0.4, 0.04, 1.6), sigma=prof[ok] * 0.1 + 0.0005, maxfev=20000)
    print('glow profile', [round(float(v), 5) for v in par], 'rms', float(np.sqrt(np.mean((two(mid[ok], *par) - prof[ok]) ** 2))))
    for e in (0.1, 0.5, 1, 2, 3, 4, 5):
        print('  el', e, 'p10', round(float(np.interp(e, mid[ok], prof[ok])), 4), 'fit', round(float(two(e, *par)), 4))
    par = par * np.array([UNDER, 1, UNDER, 1])
    json.dump({'colour': [1, round(kg, 4), round(kb, 4)], 'a': [round(float(par[0]), 5), round(float(par[2]), 5)], 's': [round(float(par[1]), 4), round(float(par[3]), 4)], 'riseDeg': RISE, 'cutDeg': list(CUT), 'nearDeg': list(NEAR)}, open('assets-src/sun/terrain/glow.json', 'w'), indent=2)
    del el, am, idx
    veil = (two(np.maximum(above, 0), *par) * step(above, 0, RISE) * (1 - step(above, CUT[0], CUT[1]))).astype(np.float32)
    rem = s - np.minimum(veil[..., None] * colour, s)
    del s, veil, amount
    amount = np.clip((rem[..., 0] - rem[..., 2]) / (1 - kb), 0, None)
    orange = np.minimum(amount[..., None] * colour, rem)
    del amount
    rows = int(edge.max()) + 40
    part = orange[:rows]
    opened = cv2.morphologyEx(part, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    part += (opened - part) * step(above[:rows], 0.3, 0.7)[..., None]
    del opened
    closed = cv2.morphologyEx(part, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (FILL, FILL)))
    part[:] = np.minimum(closed, rem[:rows])
    del closed, part
    near = (1 - step(above, NEAR[0], NEAR[1])).astype(np.float32)
    fade = (1 - step(above, GLOW[0], GLOW[1])).astype(np.float32)
    flames = orange * near[..., None]
    sky = rem - flames
    sky += (np.minimum(orange * (near - fade)[..., None], 0)) * (1 - inside)[..., None]
    del orange, near, fade
    sky = np.maximum(sky, 0) * (1 - ground)[..., None]
    plate = flames + (rem - flames) * ground[..., None]
    del flames, rem
    top = PLATE_TOP
    print('fringe energy above plate top', float(plate[:top].max()))
    img = display(plate[top:])
    del plate
    write(f'{OUT}/full/plate.jpg', img, 92)
    write(f'{OUT}/web/plate.jpg', cv2.resize(img, (w // 2, (h - top) // 2), interpolation=cv2.INTER_AREA), 88)
    write(f'{WORK}/plate-check.jpg', cv2.resize(img, (w // 4, (h - top) // 4), interpolation=cv2.INTER_AREA), 88)
    del img
    np.save(f'{WORK}/sky-scene.npy', cv2.resize(sky, (w // 2, h // 2), interpolation=cv2.INTER_AREA))
    np.save(f'{WORK}/sky-above.npy', cv2.resize(above, (w // 2, h // 2), interpolation=cv2.INTER_AREA))
    np.save(f'{WORK}/sky-ground.npy', cv2.resize(ground, (w // 2, h // 2), interpolation=cv2.INTER_AREA))
    write(f'{WORK}/sky-check.jpg', cv2.resize(display(sky), (w // 4, h // 4), interpolation=cv2.INTER_AREA), 88)


main()
