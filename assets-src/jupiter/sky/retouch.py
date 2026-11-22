import sys
import numpy as np
from PIL import Image
from scale import restore, FILM, HERO

SETS = {
    'holes': [(3191, 1313, 17, 17), (3219, 1360, 11, 11)],
    'seam': [(3171, 1268, 6, 34)],
}
RING = 7
FEATHER = 4


def edge(xx, yy, rx, ry):
    c = min(rx, ry)
    qx = np.abs(xx) - rx + c
    qy = np.abs(yy) - ry + c
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - c


def fix(a, spots, i):
    cx, cy, rx, ry = spots[i]
    sx, sy = rx + RING, ry + RING
    yy, xx = np.mgrid[-sy:sy + 1, -sx:sx + 1]
    dist = edge(xx, yy, rx, ry)
    mask = np.clip((FEATHER / 2 - dist) / FEATHER, 0, 1)[..., None]
    ring = (dist > FEATHER / 2) & (dist <= RING)
    here = a[cy - sy:cy + sy + 1, cx - sx:cx + sx + 1]
    best = None
    reach = int(3.5 * min(rx, ry))
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            if rx == ry and np.hypot(dx, dy) < 2 * rx + 4:
                continue
            if rx != ry and abs(dx) < 2 * rx + 4 and abs(dy) < 2 * ry + 4:
                continue
            px, py = cx + dx, cy + dy
            if px - sx < 0 or py - sy < 0 or px + sx >= a.shape[1] or py + sy >= a.shape[0]:
                continue
            if any(np.hypot(px - ox, py - oy) < rx + orx + RING for ox, oy, orx, _ in spots):
                continue
            there = a[py - sy:py + sy + 1, px - sx:px + sx + 1]
            cost = float(((here[ring] - there[ring]) ** 2).mean())
            if best is None or cost < best[0]:
                best = (cost, dx, dy)
    cost, dx, dy = best
    there = a[cy + dy - sy:cy + dy + sy + 1, cx + dx - sx:cx + dx + sx + 1]
    shift = here[ring].mean(axis=0) - there[ring].mean(axis=0)
    a[cy - sy:cy + sy + 1, cx - sx:cx + sx + 1] = here * (1 - mask) + np.clip(there + shift, 0, 255) * mask
    print('spot', (cx, cy, rx, ry), 'source offset', (dx, dy), 'ring cost', round(cost, 1), 'level shift', [round(float(v), 1) for v in shift])


def full(img, gain, knee):
    w, h = img.size
    small = img.resize((round(w * FILM / HERO), round(h * FILM / HERO)), Image.LANCZOS)
    return restore(np.asarray(small).astype(np.float64), gain, knee)


def web(img):
    return np.asarray(img.resize((img.size[0] // 2, img.size[1] // 2), Image.LANCZOS)).astype(np.float64)


def place(shipped, before, after, out, kept):
    src = np.asarray(Image.open(shipped).convert('RGB'))
    old = src.astype(np.float64)
    rebuilt = int((np.abs((before + 0.5).astype(np.uint8).astype(int) - src.astype(int)).max(axis=2) > 0).sum())
    delta = after - before
    delta[:, :int(np.ceil(kept * src.shape[1] - 1e-9))] = 0
    new = (np.clip(old + delta, 0, 255) + 0.5).astype(np.uint8)
    Image.fromarray(new).save(out, lossless=True, quality=90, method=6)
    back = np.asarray(Image.open(out).convert('RGB'))
    changed = np.abs(back.astype(int) - src.astype(int)).max(axis=2) > 0
    ys, xs = np.nonzero(changed)
    print(out, 'pixels where the shipped file is not the rebuilt master', rebuilt, 'changed pixels', int(changed.sum()), 'columns', int(xs.min()), 'to', int(xs.max()), 'rows', int(ys.min()), 'to', int(ys.max()))


def main(name, master, shipped, out, gain, knee, first):
    spots = SETS[name]
    img = Image.open(master).convert('RGB')
    a = np.asarray(img).astype(np.float64).copy()
    for i in range(len(spots)):
        fix(a, spots, i)
    fixed = Image.fromarray((a + 0.5).astype(np.uint8))
    fixed.save(f'{out}/sky-hold-3520-{name}.webp', lossless=True, quality=90, method=6)
    kept = first / Image.open(f'{shipped}/full/sky-hold.webp').size[0]
    place(f'{shipped}/full/sky-hold.webp', full(img, gain, knee), full(fixed, gain, knee), f'{out}/full/sky-hold.webp', kept)
    place(f'{shipped}/web/sky-hold.webp', web(img), web(fixed), f'{out}/web/sky-hold.webp', kept)


main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]), float(sys.argv[6]), int(sys.argv[7]) if len(sys.argv) > 7 else 0)
