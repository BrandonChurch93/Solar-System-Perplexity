import json
import sys

import cv2
import numpy as np

WORK = 'out/work/jupiter/relief'
FG = 'out/work/jupiter/fg'
GEN = 'out/work/jupiter/gen'
OUT = 'public/assets/jupiter'
SPEC = json.load(open('assets-src/jupiter/relief/tiers.json'))
CW, CH = 5632, 3168
OX, OY = 1408, 792
W, H = 2816, 1584
CELL = 8
WX0, WY0, WX1, WY1 = SPEC['window']
BX0, BY0, BX1, BY1 = SPEC['box']
GROW, GAP, UNDER = SPEC['grow'], SPEC['gap'], SPEC['under']
PLATES = {'a1': (1408, 1500, 2), 'a2': (2500, 1500, 2), 'b': (1344, 1584, 1)}


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def picture():
    canvas = np.load(f'{WORK}/canvas-final.npy', mmap_mode='r')
    return np.clip(np.asarray(canvas[WY0:WY1, WX0:WX1]), 0, 255).astype(np.uint8)[..., ::-1].copy()


def trace(img, anchors, free):
    path = []
    for a, b in zip(anchors[:-1], anchors[1:]):
        if a[0] >= free:
            n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])))
            path.append(np.stack([np.linspace(a[0], b[0], n, endpoint=False), np.linspace(a[1], b[1], n, endpoint=False)], 1) - [WX0, WY0])
            continue
        pad = 60
        x0 = max(min(a[0], b[0]) - WX0 - pad, 0)
        y0 = max(min(a[1], b[1]) - WY0 - pad, 0)
        x1 = min(max(a[0], b[0]) - WX0 + pad, img.shape[1])
        y1 = min(max(a[1], b[1]) - WY0 + pad, img.shape[0])
        tool = cv2.segmentation_IntelligentScissorsMB()
        tool.setEdgeFeatureCannyParameters(24, 72)
        tool.setGradientMagnitudeMaxLimit(120)
        tool.applyImage(np.ascontiguousarray(img[y0:y1, x0:x1]))
        tool.buildMap((int(a[0] - WX0 - x0), int(a[1] - WY0 - y0)))
        seg = tool.getContour((int(min(b[0] - WX0, img.shape[1] - 1) - x0), int(min(b[1] - WY0, img.shape[0] - 1) - y0))).reshape(-1, 2)
        path.append(seg + [x0, y0])
    return np.concatenate(path)


def overlay(img, paths, name, x, y, w, h):
    view = np.clip(255 * (img[y - WY0:y - WY0 + h, x - WX0:x - WX0 + w] / 255.0) ** 0.7, 0, 255).astype(np.uint8)
    view = np.ascontiguousarray(view)
    for k, p in enumerate(paths):
        q = (p - [x - WX0, y - WY0]).astype(np.int32)
        cv2.polylines(view, [q.reshape(-1, 1, 2)], False, [(0, 255, 0), (255, 128, 0)][k % 2], 1)
    cv2.imwrite(f'out/work/view/{name}.jpg', view, [cv2.IMWRITE_JPEG_QUALITY, 88])


def signed(name):
    p = np.load(f'{FG}/path-{name}.npy')
    poly = np.concatenate([[[-10, p[0, 1]]], p, [[CW + 10, p[-1, 1]], [CW + 10, CH + 10], [-10, CH + 10]]]).astype(np.int32)
    inside = np.zeros((CH, CW), np.uint8)
    cv2.fillPoly(inside, [poly], 1)
    return cv2.distanceTransform(inside, cv2.DIST_L2, 5) - cv2.distanceTransform(1 - inside, cv2.DIST_L2, 5)


def layers():
    xs = np.arange(CW, dtype=np.float32)[None, :]
    out = []
    for t in SPEC['tiers']:
        sd = signed(t['name'])
        soft = t.get('soft')
        feather = soft[2] + (soft[3] - soft[2]) * smooth(soft[0], soft[1], xs) if soft else 2.0
        taper = 1 - smooth(t['taper'][0], t['taper'][1], xs)
        matte = smooth(0, 1, (sd + GROW + feather) / feather) * smooth(0, 0.08, taper)
        under = np.clip((sd + GROW - GAP) / UNDER, 0, 1) * (1 - smooth(t['band'][0], t['band'][1], sd)) * smooth(0.08, 0.2, taper) * smooth(OX, OX + 32, xs)
        out.append((sd, matte.astype(np.float32), under.astype(np.float32)))
    return out


def mattes():
    lay = layers()
    m1, u1 = lay[0][1], lay[0][2]
    m2, u2 = lay[1][1], lay[1][2]
    both = np.minimum(u1, u2).max()
    print('overlap of the two plate bands', float(both))
    print('plate where a matte is not full', float((u1 * (m1 < 0.999)).max()), float((u2 * (m2 < 0.999)).max()))
    rgb = np.stack([m1, m2, np.maximum(u1, u2)], 2)[BY0:BY1, BX0:BX1]
    cv2.imwrite(f'{FG}/deck-tiers.png', np.round(rgb[..., ::-1] * 255).astype(np.uint8))
    np.save(f'{FG}/sd.npy', np.stack([lay[0][0], lay[1][0]]).astype(np.float32))
    full = np.pad(rgb, ((BY0, CH - BY1), (BX0, CW - BX1), (0, 0)), mode='edge')
    gw, gh = CW // CELL + 1, CH // CELL + 1
    flags = np.zeros((gh, gw), np.uint8)
    for k in range(2):
        on = (full[..., k] > 0).astype(np.uint8)
        on = cv2.dilate(on, np.ones((2 * 48 + 1, 2 * 48 + 1), np.uint8))
        grid = np.zeros((gh, gw), np.uint8)
        grid[:CH // CELL, :CW // CELL] = cv2.resize(on, (CW // CELL, CH // CELL), interpolation=cv2.INTER_AREA) > 0
        grid[-1] = grid[-2]
        grid[:, -1] = grid[:, -2]
        flags |= (cv2.dilate(grid, np.ones((3, 3), np.uint8)) << k).astype(np.uint8)
    flags.tofile(f'{FG}/deck-tiers.bin')
    print('grid vertices in tier 1', int((flags & 1).sum()), 'in tier 2', int((flags >> 1).sum()), 'of', gw * gh)
    view = np.clip(np.asarray(np.load(f'{WORK}/canvas-final.npy', mmap_mode='r')[BY0:BY1, BX0:BX1]), 0, 255)[..., ::-1] / 255.0
    view = view ** 0.6
    view[..., 1] = np.maximum(view[..., 1], rgb[..., 0] * 0.35)
    view[..., 2] = np.maximum(view[..., 2], rgb[..., 1] * 0.45)
    view[..., 0] = np.maximum(view[..., 0], rgb[..., 2] * 0.8)
    cv2.imwrite('out/work/view/tiers_mattes.jpg', cv2.resize((view * 255).astype(np.uint8), (1408, 640), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])


def source(name):
    x, y, k = PLATES[name]
    if k == 2:
        core = np.load(f'{WORK}/core-final.npy', mmap_mode='r')
        cx, cy = (x - OX) * 2, (y - OY) * 2
        return np.asarray(core[cy:cy + H, cx:cx + W]).astype(np.float32)
    canvas = np.load(f'{WORK}/canvas-final.npy', mmap_mode='r')
    return np.asarray(canvas[y:y + H, x:x + W]).astype(np.float32)


def hidden(name):
    x, y, k = PLATES[name]
    sd = np.load(f'{FG}/sd.npy', mmap_mode='r')[0 if name != 'b' else 1]
    part = np.asarray(sd[y:y + H // k, x:x + W // k])
    if k == 2:
        part = cv2.resize(part, (W, H), interpolation=cv2.INTER_LINEAR)
    return part > -(GROW + 2)


def prep(name):
    tile = source(name)
    tile[hidden(name)] = 128
    cv2.imwrite(f'{GEN}/under_{name}_in.png', np.round(np.clip(tile, 0, 255)[..., ::-1]).astype(np.uint8))
    cv2.imwrite(f'out/work/view/under_{name}_in.jpg', cv2.resize(np.clip(tile, 0, 255)[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])


def fitted(name, path):
    old = source(name)
    gen = cv2.imread(path)[..., ::-1].astype(np.float32)
    if gen.shape[:2] != (H, W):
        gen = cv2.resize(gen, (W, H), interpolation=cv2.INTER_LANCZOS4)
    hide = hidden(name)
    hard = (~hide).astype(np.float32)
    grey = lambda a: a.mean(2)
    win = cv2.createHanningWindow((W, H), cv2.CV_32F)
    shift, peak = cv2.phaseCorrelate(grey(old) * hard, grey(gen) * hard, win)
    diff = np.abs(gen - old).mean(2)[hard > 0]
    print(name, 'shift', np.round(shift, 2), 'phase correlation', round(float(peak), 3), 'mean abs difference on the kept part', round(float(diff.mean()), 2), 'p95', round(float(np.percentile(diff, 95)), 2))
    sel = hard > 0
    for c in range(3):
        a, b = np.polyfit(gen[..., c][sel][::7], old[..., c][sel][::7], 1)
        gen[..., c] = gen[..., c] * a + b
    near = np.clip(1 - cv2.distanceTransform((hard > 0.5).astype(np.uint8), cv2.DIST_L2, 5) / 160, 0, 1) * hard
    wsum = blur(near, 50)
    ratio = blur(old * near[..., None], 50) / np.maximum(blur(gen * near[..., None], 50), 1e-3)
    ratio = np.clip(ratio, 0.5, 2.0)
    w = np.clip(wsum / 0.1, 0, 1)[..., None]
    gen = np.clip(gen * (ratio * w + (1 - w)), 0, 255)
    inner = cv2.distanceTransform((hard > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    take = np.where(hard > 0.5, 1 - smooth(0, 16, inner), 1.0)[..., None].astype(np.float32)
    return gen * take + old * (1 - take)


def place(name, path):
    np.save(f'{FG}/under-{name}.npy', fitted(name, path))


def under():
    bw, bh = (BX1 - BX0) * 2, (BY1 - BY0) * 2
    canvas = np.load(f'{WORK}/canvas-final.npy', mmap_mode='r')
    plate = cv2.resize(np.asarray(canvas[BY0:BY1, BX0:BX1]).astype(np.float32), (bw, bh), interpolation=cv2.INTER_CUBIC)
    core = np.load(f'{WORK}/core-final.npy', mmap_mode='r')
    x0, y0 = (OX - BX0) * 2, (BY0 - OY) * 2
    rows = min(bh, core.shape[0] - y0)
    plate[:rows, x0:] = np.asarray(core[y0:y0 + rows, :bw - x0])
    weight = np.zeros((bh, bw), np.float32)
    total = np.zeros((bh, bw, 3), np.float32)
    ramp = np.minimum(np.arange(W) + 1, W - np.arange(W)).astype(np.float32)
    wgt = np.clip(ramp / 300, 0.001, 1)[None, :]
    for name in ('a1', 'a2'):
        x, y, k = PLATES[name]
        px, skip = (x - BX0) * 2, (BY0 - y) * 2
        tile = np.load(f'{FG}/under-{name}.npy')[skip:]
        total[:tile.shape[0], px:px + W] += tile * wgt[..., None]
        weight[:tile.shape[0], px:px + W] += wgt
    on = weight > 0
    plate[on] = total[on] / weight[on][:, None]
    x, y, k = PLATES['b']
    low = cv2.resize(np.load(f'{FG}/under-b.npy'), (W * 2, H * 2), interpolation=cv2.INTER_CUBIC)
    px, top = (x - BX0) * 2, (SPEC['seam'] - y) * 2
    first = (SPEC['seam'] - BY0) * 2
    plate[first:, px:] = low[top:top + bh - first, :bw - px]
    plate = np.clip(plate, 0, 255)
    np.save(f'{FG}/under.npy', plate)
    cv2.imwrite('out/work/view/under_plate.jpg', cv2.resize(plate[..., ::-1], (1408, 640), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    t = cv2.imread(f'{FG}/deck-tiers.png')[..., 0].astype(np.float32) / 255
    t = cv2.resize(t, (bw, bh), interpolation=cv2.INTER_LINEAR)[..., None]
    base = cv2.resize(np.asarray(canvas[BY0:BY1, BX0:BX1]).astype(np.float32), (bw, bh), interpolation=cv2.INTER_CUBIC)
    base[:rows, x0:] = np.asarray(core[y0:y0 + rows, :bw - x0])
    shown = base * (1 - t) + plate * t
    lift = lambda a: np.clip(255 * (np.clip(a, 0, 255) / 255.0) ** 0.6, 0, 255)
    cv2.imwrite('out/work/view/under_shown.jpg', cv2.resize(lift(shown)[..., ::-1], (1408, 640), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    np.save(f'{FG}/under-shown.npy', shown.astype(np.float32))


def jpeg(path, img, q):
    cv2.imwrite(path, np.round(np.clip(img, 0, 255))[..., ::-1].astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, q])


def ship():
    json.dump({'box': SPEC['box'], 'rise': SPEC['rise'], 'layers': [{'lift': t['lift'], 'taper': t['taper']} for t in SPEC['tiers']]}, open('src/stops/jupiter/tiers.json', 'w'), indent=1)
    if len(sys.argv) > 2:
        return
    plate = np.load(f'{FG}/under.npy')
    jpeg(f'{OUT}/full/deck-under.jpg', plate, 95)
    jpeg(f'{OUT}/web/deck-under.jpg', cv2.resize(plate, (plate.shape[1] // 2, plate.shape[0] // 2), interpolation=cv2.INTER_AREA), 88)
    for s in ('full', 'web'):
        cv2.imwrite(f'{OUT}/{s}/deck-tiers.png', cv2.imread(f'{FG}/deck-tiers.png'))
        open(f'{OUT}/{s}/deck-tiers.bin', 'wb').write(open(f'{FG}/deck-tiers.bin', 'rb').read())


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'trace':
        img = picture()
        paths = []
        for t in SPEC['tiers']:
            p = trace(img, t['anchors'], t.get('free', 1e9))
            np.save(f"{FG}/path-{t['name']}.npy", p + [WX0, WY0])
            paths.append(p)
            print(t['name'], len(p), 'points')
        overlay(img, paths, 'tiers_a', 1100, 1650, 1400, 700)
        overlay(img, paths, 'tiers_b', 2400, 1650, 1400, 700)
        overlay(img, paths, 'tiers_c', 1100, 2300, 1400, 700)
        overlay(img, paths, 'tiers_d', 2400, 2300, 1400, 700)
    elif cmd == 'mattes':
        mattes()
    elif cmd == 'prep':
        for n in sys.argv[2:]:
            prep(n)
    elif cmd == 'place':
        place(sys.argv[2], sys.argv[3])
    elif cmd == 'under':
        under()
    elif cmd == 'ship':
        ship()
