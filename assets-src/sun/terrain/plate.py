import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from common import WORK, LOOPS_BOX, LEFT, TOP, SPAN, CANVAS, PLATE_TOP, TX, TY, read, write, take_to_grid, step, scene, display, fit

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/sun'
LUM = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
FEATHER = 90
FEATHER_SKY = 380
WIDEN = 49
GLOW = (1.6, 4.2)


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


def main():
    a2 = read(f'{WORK}/close-x2.png')
    c2 = take_to_grid('clean', read(f'{WORK}/close-clean-x.png'), (5632, 3168), (-0.25, -0.25), 0.5)
    m = loop_mask(a2, c2)
    cv2.imwrite(f'{WORK}/loops-mask.png', (m * 255).astype(np.uint8))
    da = a2.astype(np.float32) / 255
    dc = c2.astype(np.float32) / 255
    del a2, c2
    a = scene(da)
    c = scene(dc)
    lift = (da - dc) @ LUM
    d = np.maximum(a - c, 0)
    soft = cv2.GaussianBlur(np.maximum(da - dc, 0), (0, 0), 1.5)
    warm = step((soft[..., 0] - soft[..., 2]) / (soft[..., 0] + 0.02), 0.2, 0.5)
    glow = np.maximum(cv2.GaussianBlur(a - c, (0, 0), 14), 0)
    strands = step(cv2.GaussianBlur(lift, (0, 0), 1.2), 0.22, 0.45)
    sky = step(cv2.resize(elevation(2816, 1584), (5632, 3168), interpolation=cv2.INTER_LINEAR), -0.25, 0.25)
    del c, soft, lift
    on_ground = glow + (d - glow) * strands[..., None]
    on_sky = d * warm[..., None]
    loops = np.minimum((on_ground + (on_sky - on_ground) * sky[..., None]) * m[..., None], a * 0.98)
    del on_ground, on_sky, glow, d, warm, strands, sky, a
    wide_m = cv2.dilate((m > 0.02).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (WIDEN, WIDEN)))
    wide_m = np.clip(cv2.GaussianBlur(wide_m, (0, 0), WIDEN / 4) * 1.5 - 0.25, 0, 1)
    ring = (wide_m > 0.05) & (wide_m < 0.6)
    print('clean take against approved in the ring', [round(float(dc[..., k][ring].mean() / da[..., k][ring].mean()), 3) for k in range(3)])
    clean = da + (dc - da) * wide_m[..., None]
    cv2.imwrite(f'{WORK}/loops-mask-wide.png', (wide_m * 255).astype(np.uint8))
    del da, dc, wide_m, ring
    x0, y0, x1, y1 = LOOPS_BOX
    crop = display(loops[round(y0 * 3168):round(y1 * 3168), round(x0 * 5632):round(x1 * 5632)])
    del loops
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

    inside = window(FEATHER)
    inside += (window(FEATHER_SKY) - inside) * skyw
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
    amount = np.clip((s[..., 0] - s[..., 2]) / (1 - kb), 0, None)
    fade = (1 - step(above, GLOW[0], GLOW[1])).astype(np.float32)
    orange = np.minimum(amount[..., None] * np.array([1, kg, kb], dtype=np.float32), s) * fade[..., None]
    del amount
    plate = orange + (s - orange) * ground[..., None]
    del orange
    sky = np.maximum(s - plate, 0)
    del s
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
