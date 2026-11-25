"""The cells of the near field read from a picture alone, the same way on the approved image and on a render:
the brightness across a cell (0 at its middle, 1 at its border), the width of the lanes, the count and the sizes.
usage: python3 assets-src/sun/lab/cells.py PICTURE|approved [--box X Y W H] [--out OVERLAY.jpg] [--json FILE]
The picture is brought to 1920 by 1080. Brightness is the largest of the three channels, 0 to 1.
A lane is a dark line: the largest eigenvalue of the Hessian of the brightness (over its mean of 25 px) at widths
of 3 and 5 px, over 0.3, grown down to 0.15, pieces under 120 px dropped. A cell is the ground that climbs to one
top of the distance from the lanes; two tops are one cell where the neck between them is wider than 0.75 of the
smaller top. Cells whose top is under 6 px from a lane are counted and sized but not in the curve. No hand is in
it; a lane with a gap parts two cells where the gap is a neck."""
import sys
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

args = sys.argv[1:]
name = args[0]
box = (100, 800, 1720, 280)
out = None
dump = None
i = 1
while i < len(args):
    if args[i] == '--box':
        box = tuple(int(v) for v in args[i + 1:i + 5])
        i += 5
    elif args[i] == '--out':
        out = args[i + 1]
        i += 2
    elif args[i] == '--json':
        dump = args[i + 1]
        i += 2
    else:
        i += 1
path = 'references/approved/sun-close.jpg' if name == 'approved' else name
im = Image.open(path).convert('RGB')
if im.size != (1920, 1080):
    im = im.resize((1920, 1080), Image.LANCZOS)
rgb = np.asarray(im).astype(np.float32) / 255
bx, by, bw, bh = box
pad = 40
x0, y0, x1, y1 = max(bx - pad, 0), max(by - pad, 0), min(bx + bw + pad, 1920), min(by + bh + pad, 1080)
lum = rgb[y0:y1, x0:x1].max(axis=2)
h, w = lum.shape


def lines(a, s):
    xx = ndi.gaussian_filter(a, s, order=(0, 2))
    yy = ndi.gaussian_filter(a, s, order=(2, 0))
    xy = ndi.gaussian_filter(a, s, order=(1, 1))
    root = np.sqrt(((xx - yy) / 2) ** 2 + xy ** 2)
    big = (xx + yy) / 2 + root
    ang = 0.5 * np.arctan2(2 * xy, xx - yy)
    return np.maximum(big, 0) * s * s, ang


rel = lum / np.maximum(ndi.gaussian_filter(lum, 25), 1e-3)
ra, aa = lines(rel, 3.0)
rb, ab = lines(rel, 5.0)
line = np.maximum(ra, rb)
ang = np.where(ra >= rb, aa, ab)
LINE = 0.3
grown, n = ndi.label(line > LINE * 0.5, structure=np.ones((3, 3)))
keep = np.unique(grown[line > LINE])
lane = np.isin(grown, keep[keep > 0])
grown, n = ndi.label(lane, structure=np.ones((3, 3)))
lane = np.isin(grown, np.nonzero(ndi.sum(lane, grown, np.arange(1, n + 1)) >= 120)[0] + 1)
far = ndi.gaussian_filter(ndi.distance_transform_edt(~lane), 2.0)
far = far + 1e-4 * ndi.gaussian_filter(lum, 3.0)
padded = np.pad(far, 1, constant_values=-1.0)
best = far.copy()
goal = np.arange(h * w).reshape(h, w)
for dy in (-1, 0, 1):
    for dx in (-1, 0, 1):
        if dy == 0 and dx == 0:
            continue
        near = padded[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
        take = near > best
        best = np.where(take, near, best)
        goal = np.where(take, (ys_ := np.arange(h)[:, None] + dy) * w + (np.arange(w)[None, :] + dx), goal)
goal = goal.ravel()
for _ in range(14):
    goal = goal[goal]
uniq, lab = np.unique(goal, return_inverse=True)
lab = lab.reshape(h, w) + 1
count = int(uniq.size)
NECK = 0.75
parent = np.arange(count + 1)


def find(k):
    while parent[k] != k:
        parent[k] = parent[parent[k]]
        k = parent[k]
    return k


peak = ndi.maximum(far, lab, np.arange(count + 1))
a = np.concatenate([lab[:, :-1].ravel(), lab[:-1, :].ravel()])
b = np.concatenate([lab[:, 1:].ravel(), lab[1:, :].ravel()])
v = np.concatenate([np.minimum(far[:, :-1], far[:, 1:]).ravel(), np.minimum(far[:-1, :], far[1:, :]).ravel()])
keep = a != b
a, b, v = a[keep], b[keep], v[keep]
key = np.minimum(a, b).astype(np.int64) * (count + 1) + np.maximum(a, b)
order = np.argsort(key, kind='stable')
key, v = key[order], v[order]
uniq, start = np.unique(key, return_index=True)
neck = np.maximum.reduceat(v, start)
for j in np.argsort(-neck):
    a, b = find(int(uniq[j] // (count + 1))), find(int(uniq[j] % (count + 1)))
    if a == b:
        continue
    if neck[j] > NECK * min(peak[a], peak[b]):
        parent[b] = a
        peak[a] = max(peak[a], peak[b])
lab = np.array([find(k) for k in range(count + 1)])[lab]

edge = np.zeros((h, w), bool)
edge[:, :-1] |= lab[:, :-1] != lab[:, 1:]
edge[:, 1:] |= lab[:, :-1] != lab[:, 1:]
edge[:-1, :] |= lab[:-1, :] != lab[1:, :]
edge[1:, :] |= lab[:-1, :] != lab[1:, :]
deep = ndi.distance_transform_edt(~edge)
ids = np.unique(lab)
rim = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])).tolist())
ys, xs = np.mgrid[0:h, 0:w]
area = ndi.sum(np.ones_like(lab), lab, ids)
cy = ndi.mean(ys, lab, ids) + y0
cx = ndi.mean(xs, lab, ids) + x0
most = ndi.maximum(deep, lab, ids)
cells = []
for k, a, yy, xx, m in zip(ids, area, cy, cx, most):
    if k in rim or a < 30:
        continue
    if not (bx <= xx < bx + bw and by <= yy < by + bh):
        continue
    cells.append((int(k), float(a), float(m)))
sizes = np.array([2 * np.sqrt(a / np.pi) for _, a, _ in cells])
med = float(np.median(sizes))
small = float(np.mean(sizes < med / 2))
sides = []
curve = []
spread = []
late = 0
used = 0
for k, a, m in cells:
    if m < 6:
        continue
    sel = lab == k
    t = 1 - deep[sel] / m
    v = lum[sel]
    px, py = xs[sel].astype(np.float64), ys[sel].astype(np.float64)
    px -= px.mean()
    py -= py.mean()
    inner = t < 0.7
    if inner.sum() > 20:
        fit = np.linalg.lstsq(np.stack([np.ones(inner.sum()), px[inner], py[inner]], axis=1), v[inner], rcond=None)[0]
        reach = np.sqrt(a / np.pi)
        sides.append((fit[1] * reach / max(fit[0], 1e-3), fit[2] * reach / max(fit[0], 1e-3)))
    row = []
    wide = []
    for j in range(11):
        pick = np.abs(t - j / 10) <= 0.05
        row.append(v[pick].mean() if pick.any() else np.nan)
        wide.append(v[pick].std() if pick.any() else np.nan)
    curve.append(row)
    spread.append(wide)
    late += int(np.nanargmax(row) >= 5)
    used += 1
curve = np.nanmean(np.array(curve), axis=0)
spread = np.nanmean(np.array(spread), axis=0)
sides = np.array(sides)
lean = np.hypot(sides[:, 0], sides[:, 1])
covered = float(sum(a for _, a, _ in cells)) / (bw * bh)

ey, ex = np.nonzero(edge & (deep < 1.5))
inside = (ex + x0 >= bx) & (ex + x0 < bx + bw) & (ey + y0 >= by) & (ey + y0 < by + bh)
ey, ex = ey[inside][::3], ex[inside][::3]
steps = np.arange(-14, 14.01, 0.5)
ca, sa = np.cos(ang[ey, ex]), np.sin(ang[ey, ex])
px = ex[:, None] + ca[:, None] * steps[None, :]
py = ey[:, None] + sa[:, None] * steps[None, :]
prof = ndi.map_coordinates(lum, [py, px], order=1, mode='nearest')
mid = len(steps) // 2
widths = []
depths = []
lined = []
for p in prof:
    c = mid - 6 + int(np.argmin(p[mid - 6:mid + 7]))
    if c < 16 or c > len(p) - 17:
        continue
    left, right = p[c - 16:c + 1][::-1], p[c:c + 17]
    dep = min(left.max(), right.max()) - p[c]
    if dep < 0.08:
        continue
    half = p[c] + dep / 2
    wide = 0.0
    ok = True
    for side in (left, right):
        over = np.nonzero(side >= half)[0]
        if over.size == 0:
            ok = False
            break
        j = int(over[0])
        frac = (half - side[j - 1]) / max(side[j] - side[j - 1], 1e-6) if j > 0 else 0.0
        wide += (j - 1 + frac) * 0.5 if j > 0 else 0.0
    if not ok:
        continue
    widths.append(wide)
    depths.append(dep)
    lined.append(p[c - 16:c + 17])
widths = np.array(widths)
res = {
    'picture': name,
    'box': list(box),
    'cells': len(cells),
    'share of the box in counted cells': round(covered, 3),
    'cells in a box wholly counted': round(len(cells) / max(covered, 1e-6), 1),
    'cells in the curve': used,
    'median width px': round(med, 1),
    'share under half the median': round(small, 3),
    'share under 30 px': round(float(np.mean(sizes < 30)), 3),
    'sizes px 10 25 50 75 90': [round(float(v), 1) for v in np.percentile(sizes, [10, 25, 50, 75, 90])],
    'curve middle to border': [round(float(v), 3) for v in curve],
    'spread inside a ring, middle to border': [round(float(v), 3) for v in spread],
    'share of cells lightest in their outer half': round(late / max(used, 1), 3),
    'side to side over a cell (slope times its half width over its mean), median': round(float(np.median(lean)), 3),
    'one direction for all cells (0 none, 1 all), and the mean direction x y': [round(float(np.hypot(*sides.mean(axis=0)) / lean.mean()), 3), round(float(sides[:, 0].mean()), 3), round(float(sides[:, 1].mean()), 3)],
    'lane width px median': round(float(np.median(widths)), 2),
    'lane width px 25 75': [round(float(v), 2) for v in np.percentile(widths, [25, 75])],
    'lane depth median': round(float(np.median(depths)), 3),
    'lane crossings': int(widths.size),
    'lane profile': [round(float(v), 3) for v in np.mean(np.array(lined), axis=0)[::2]],
    'mean': round(float(lum[by - y0:by - y0 + bh, bx - x0:bx - x0 + bw].mean()), 3),
}
for k, v in res.items():
    print(k + ':', v)
if dump:
    json.dump(res, open(dump, 'w'))
if out:
    show = (rgb[y0:y1, x0:x1] * 255).astype(np.uint8).copy()
    show[lane] = (255, 0, 255)
    show[edge] = (0, 255, 255)
    keep = set(k for k, _, _ in cells)
    off = ~np.isin(lab, list(keep))
    show[off & ~edge] = (show[off & ~edge] * 0.45).astype(np.uint8)
    both = Image.new('RGB', (w, h * 2))
    both.paste(Image.fromarray((rgb[y0:y1, x0:x1] * 255).astype(np.uint8)), (0, 0))
    both.paste(Image.fromarray(show), (0, h))
    ImageDraw.Draw(both).text((6, 4), name, fill=(255, 255, 255))
    both.save(out, quality=90)
