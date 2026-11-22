import sys
import numpy as np
from PIL import Image
from scale import restore, FILM, HERO

SPOTS = [(3191, 1313, 17), (3219, 1360, 11)]
RING = 7
FEATHER = 4


def fix(a, i):
    cx, cy, r = SPOTS[i]
    span = r + RING
    yy, xx = np.mgrid[-span:span + 1, -span:span + 1]
    dist = np.hypot(xx, yy)
    mask = np.clip((r + FEATHER / 2 - dist) / FEATHER, 0, 1)[..., None]
    ring = (dist > r + FEATHER / 2) & (dist <= span)
    here = a[cy - span:cy + span + 1, cx - span:cx + span + 1]
    best = None
    reach = int(3.5 * r)
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            if np.hypot(dx, dy) < 2 * r + 4:
                continue
            sx, sy = cx + dx, cy + dy
            if sx - span < 0 or sy - span < 0 or sx + span >= a.shape[1] or sy + span >= a.shape[0]:
                continue
            if any(np.hypot(sx - ox, sy - oy) < r + orad + RING for ox, oy, orad in SPOTS):
                continue
            there = a[sy - span:sy + span + 1, sx - span:sx + span + 1]
            cost = float(((here[ring] - there[ring]) ** 2).mean())
            if best is None or cost < best[0]:
                best = (cost, dx, dy)
    cost, dx, dy = best
    there = a[cy + dy - span:cy + dy + span + 1, cx + dx - span:cx + dx + span + 1]
    shift = here[ring].mean(axis=0) - there[ring].mean(axis=0)
    a[cy - span:cy + span + 1, cx - span:cx + span + 1] = here * (1 - mask) + np.clip(there + shift, 0, 255) * mask
    print('spot', (cx, cy, r), 'source offset', (dx, dy), 'ring cost', round(cost, 1), 'level shift', [round(float(v), 1) for v in shift])


def full(img, gain, knee):
    w, h = img.size
    small = img.resize((round(w * FILM / HERO), round(h * FILM / HERO)), Image.LANCZOS)
    return restore(np.asarray(small).astype(np.float64), gain, knee)


def web(img):
    return np.asarray(img.resize((img.size[0] // 2, img.size[1] // 2), Image.LANCZOS)).astype(np.float64)


def place(shipped, before, after, out):
    src = np.asarray(Image.open(shipped).convert('RGB'))
    old = src.astype(np.float64)
    rebuilt = int((np.abs((before + 0.5).astype(np.uint8).astype(int) - src.astype(int)).max(axis=2) > 0).sum())
    new = (np.clip(old + after - before, 0, 255) + 0.5).astype(np.uint8)
    Image.fromarray(new).save(out, lossless=True, quality=90, method=6)
    back = np.asarray(Image.open(out).convert('RGB'))
    changed = np.abs(back.astype(int) - src.astype(int)).max(axis=2) > 0
    ys, xs = np.nonzero(changed)
    print(out, 'pixels where the shipped file is not the rebuilt master', rebuilt, 'changed pixels', int(changed.sum()), 'columns', int(xs.min()), 'to', int(xs.max()), 'rows', int(ys.min()), 'to', int(ys.max()))


def main(master, shipped, out, gain, knee):
    img = Image.open(master).convert('RGB')
    a = np.asarray(img).astype(np.float64).copy()
    for i in range(len(SPOTS)):
        fix(a, i)
    fixed = Image.fromarray((a + 0.5).astype(np.uint8))
    fixed.save(f'{out}/sky-hold-3520-retouch.webp', lossless=True, quality=90, method=6)
    place(f'{shipped}/full/sky-hold.webp', full(img, gain, knee), full(fixed, gain, knee), f'{out}/full/sky-hold.webp')
    place(f'{shipped}/web/sky-hold.webp', web(img), web(fixed), f'{out}/web/sky-hold.webp')


main(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]))
