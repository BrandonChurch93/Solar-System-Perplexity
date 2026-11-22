import sys
import json
import numpy as np
import cv2
from scipy import ndimage as ndi
from common import WORK, LEFT, TOP, SPAN, TY, TX, PLATE_TOP, read, write, scene, display, step, fit

LINE = (2.1, 4.6)
NEAR = (1.7, 4.5)
ARCH = 0.25
SOFT = 24
SHIFT = 160
STARS = 0.4
DEEP = 240
HAZE = (2.5, 5.5)
BACK = (5.0, 6.0, 110, 80)
SIZE = (4096, 256)
AZ = 64.0
EL = 8.0
GAIN = 4.0
SEED = 20261122
TOWARD = {'from': (0.03, 0.1), 'to': (1.2, 2.2), 'window': 2.0, 'share': 50, 'az': 0.3, 'el': (0.05, 0.25), 'grow': (0.3, 0.9), 'hold': 6.0}
PLATE = 'public/assets/sun/full/plate.jpg'
UNDER = {'amount': 0.02, 'over': (0.15, 0.5)}

where = [v for v in sys.argv[1:] if not v.startswith('--')]
OUT = where[0] if where else 'public/assets/sun'
NOTE = 'src/stops/sun/haze.json' if not where else f'{OUT}/haze.json'
sky = np.load(f'{WORK}/sky-scene.npy')
ground = np.load(f'{WORK}/sky-ground.npy')
above = np.load(f'{WORK}/sky-above.npy')
edge = np.load(f'{WORK}/canvas-edge.npy')
h, w = ground.shape
edge = cv2.resize(edge[None, :], (w, 1), interpolation=cv2.INTER_AREA)[0] / 2
rows = np.arange(h, dtype=np.float32)[:, None]
cols = (np.arange(w, dtype=np.float32) + 0.5) / w * SPAN + LEFT
centre = step(cols, -0.02, 0.1) * (1 - step(cols, 0.9, 1.02))
line = edge - (LINE[1] + (LINE[0] - LINE[1]) * centre) * h / (2 * np.degrees(np.arctan(TY * SPAN)))
mirror = 2 * line[None, :] - rows
below = rows > line[None, :]
src_y = np.where(below, np.clip(mirror, 0, h - 1), rows).astype(np.float32)
src_x = np.repeat(np.arange(w, dtype=np.float32)[None, :], h, 0)
low = cv2.GaussianBlur(sky, (0, 0), SOFT)
moved = np.roll(sky - low, SHIFT, axis=1)
far_y = np.where(below, np.clip(np.roll(line, SHIFT)[None, :] - (rows - line[None, :]), 0, h - 1), rows).astype(np.float32)
fill = cv2.remap(low, src_x, src_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) + cv2.remap(moved, src_x, far_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
out = np.where(below[..., None], np.maximum(fill, 0) * step(mirror, 0, DEEP)[..., None], sky)
mask = cv2.imread(f'{WORK}/loops-mask-wide.png', 0).astype(np.float32) / 255
k = SPAN * mask.shape[1] / w
inv = np.array([[k, 0, LEFT * mask.shape[1] + 0.5 * k - 0.5], [0, k, TOP * mask.shape[0] + 0.5 * k - 0.5]])
mask = np.clip(cv2.GaussianBlur(cv2.warpAffine(mask, inv, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP), (0, 0), 20) * 2 - 1, 0, 1)
arch = (1 - ARCH * mask)[..., None]
floor = cv2.GaussianBlur(out, (0, 0), SOFT)

free = (1 - ground)[..., None]
plain = cv2.GaussianBlur(sky, (0, 0), SOFT)
true = cv2.GaussianBlur(sky * free, (0, 0), SOFT) / np.maximum(cv2.GaussianBlur(free, (0, 0), SOFT), 1e-3)[..., None]
Q = 8


def small(m):
    return cv2.resize(m, (w // Q, h // Q), interpolation=cv2.INTER_AREA)


def large(m):
    return cv2.GaussianBlur(cv2.resize(m, (w, h), interpolation=cv2.INTER_CUBIC), (0, 0), Q)


far = small((step(above, BACK[0], BACK[1]) * (1 - ground)).astype(np.float32))[..., None]
true_s = small(true)
num = np.zeros_like(true_s)
got = np.zeros_like(far)
for sigma in (BACK[2], BACK[2] * 3, BACK[2] * 9):
    a = cv2.GaussianBlur(true_s * far, (0, 0), sigma / Q, borderType=cv2.BORDER_REPLICATE)
    b = cv2.GaussianBlur(far, (0, 0), sigma / Q, borderType=cv2.BORDER_REPLICATE)[..., None]
    take = step(b, 0.02, 0.2) * (1 - got)
    num += a / np.maximum(b, 1e-4) * take
    got += take
back = cv2.GaussianBlur(num / np.maximum(got, 1e-4), (0, 0), BACK[2] / 2 / Q, borderType=cv2.BORDER_REPLICATE)
free_s = small(free[..., 0])[..., None]
wide = cv2.GaussianBlur(true_s * free_s, (0, 0), BACK[3] / Q, borderType=cv2.BORDER_REPLICATE) / np.maximum(cv2.GaussianBlur(free_s, (0, 0), BACK[3] / Q, borderType=cv2.BORDER_REPLICATE)[..., None], 1e-3)
seen_s = step(cv2.GaussianBlur(free_s, (0, 0), BACK[3] / Q, borderType=cv2.BORDER_REPLICATE), 0.05, 0.5)[..., None]
dark = np.minimum((wide @ np.array([0.2126, 0.7152, 0.0722], np.float32)) / np.maximum(back @ np.array([0.2126, 0.7152, 0.0722], np.float32), 1e-5), 1)[..., None]
back = large(back * (1 + (dark - 1) * seen_s))

weight = (1 - step(above, HAZE[0], HAZE[1]))[..., None]
stars = (STARS + (1 - STARS) * step(above, NEAR[0], NEAR[1]))[..., None]
card = np.maximum(back + (1 - weight) * (floor - back) + (out - floor) * stars, 0) * arch
rest = weight * (plain - back) * arch

f = fit()
down = np.array(f['down'], np.float64)
down /= np.linalg.norm(down)
ref = np.array([0.0, 0.0, -1.0])
e1 = ref - down * ref.dot(down)
e1 /= np.linalg.norm(e1)
e2 = np.cross(down, e1)
g = json.load(open('assets-src/sun/terrain/glow.json'))
az = (np.arange(SIZE[0]) + 0.5) / SIZE[0] * 2 * AZ - AZ
el = (np.arange(SIZE[1]) + 0.5) / SIZE[1] * EL
A, E = np.meshgrid(np.radians(az), np.radians(el))
theta = np.radians(f['alphaDeg']) + E
d = down[None, None, :] * np.cos(theta)[..., None] + np.sin(theta)[..., None] * (e1[None, None, :] * np.cos(A)[..., None] + e2[None, None, :] * np.sin(A)[..., None])
ax = 0.5 + d[..., 0] / np.maximum(-d[..., 2], 1e-6) / (2 * TX)
ay = 0.5 - d[..., 1] / np.maximum(-d[..., 2], 1e-6) / (2 * TY)
px = ((ax - LEFT) / SPAN * w - 0.5).astype(np.float32)
py = ((ay - TOP) / SPAN * h - 0.5).astype(np.float32)
seen = (d[..., 2] < -0.05) & (px > 2) & (px < w - 3) & (py > 2) & (py < h - 3)
last = np.where(seen.any(0))[0]
keep = np.clip(np.arange(SIZE[0]), last.min() + 8, last.max() - 8)
res = cv2.remap(rest, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[:, keep]
ed = np.degrees(E)
veil = (g['a'][0] * np.exp(-ed / g['s'][0]) + g['a'][1] * np.exp(-ed / g['s'][1])) * step(ed, 0, g['riseDeg']) * (1 - step(ed, g['cutDeg'][0], g['cutDeg'][1]))
level = veil[..., None] * np.array(g['colour'], np.float32) + res


def toward(level):
    want = np.load(f'{WORK}/clean-half.npy')
    pl = scene(read(PLATE).astype(np.float32) / 255)
    want[PLATE_TOP // 2:] -= cv2.resize(pl, (w, h - PLATE_TOP // 2), interpolation=cv2.INTER_AREA)
    del pl
    n = int(TOWARD['to'][1] / EL * SIZE[1]) + 1
    need = cv2.remap(want - (card + rest) / arch, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[:n] - veil[:n, :, None] * np.array(g['colour'], np.float32)
    ok = seen[:n]
    per = SIZE[0] / (2 * AZ)
    cols = np.arange(SIZE[0], dtype=np.float32)
    for r in range(n):
        at = np.where(ok[r])[0]
        a, b = at.min(), at.max()
        mid = np.median(need[r, a:b + 1], axis=0)
        lo = need[r, a:a + int(3 * per)].mean(0)
        hi = need[r, b - int(3 * per):b + 1].mean(0)
        need[r, :a] = mid + (lo - mid) * np.exp(-(a - cols[:a]) / (TOWARD['hold'] * per))[:, None]
        need[r, b + 1:] = mid + (hi - mid) * np.exp(-(cols[b + 1:] - b) / (TOWARD['hold'] * per))[:, None]
    first = int(np.ceil(TOWARD['from'][1] / EL * SIZE[1] - 0.5))
    need[:first] = need[first]
    q = 4
    small = cv2.resize(need, (SIZE[0] // q, n), interpolation=cv2.INTER_AREA)
    small = ndi.percentile_filter(small, TOWARD['share'], size=(1, int(TOWARD['window'] * per / q) | 1, 1), mode='nearest')
    even = cv2.resize(small, (SIZE[0], n), interpolation=cv2.INTER_CUBIC)
    fine = cv2.GaussianBlur(even, (0, 0), sigmaX=TOWARD['az'] * per, sigmaY=TOWARD['el'][0] * SIZE[1] / EL, borderType=cv2.BORDER_REPLICATE)
    wide = cv2.GaussianBlur(even, (0, 0), sigmaX=TOWARD['az'] * per, sigmaY=TOWARD['el'][1] * SIZE[1] / EL, borderType=cv2.BORDER_REPLICATE)
    e = el[:n, None, None]
    move = (fine + (wide - fine) * step(e, *TOWARD['grow'])) * step(e, *TOWARD['from']) * (1 - step(e, *TOWARD['to']))
    lum = np.array([0.2126, 0.7152, 0.0722], np.float32)
    for deg in (0.08, 0.14, 0.2, 0.27, 0.36, 0.5, 0.75, 1.0, 1.5, 2.0):
        r = int(deg / EL * SIZE[1])
        v = ok[r]
        print('  toward the clean canvas, el', deg, 'veil', round(float(level[r][v].mean(0) @ lum), 5), 'short before, median', round(float(np.median(need[r][v] @ lum)), 5), 'p10', round(float(np.percentile(need[r][v] @ lum, 10)), 5), 'p90', round(float(np.percentile(need[r][v] @ lum, 90)), 5), 'move mean', round(float(move[r][v].mean(0) @ lum), 5), 'short after, median', round(float(np.median((need[r] - move[r])[v] @ lum)), 5))
    out = level.copy()
    out[:n] += move
    return out


level = toward(level) + (UNDER['amount'] * (1 - step(el, *UNDER['over'])))[:, None, None]
haze = np.maximum(level, 0).astype(np.float32)
lost = np.minimum(level, 0)
print('seen share', float(seen.mean()), 'az seen', float(az[seen.any(0)].min()), float(az[seen.any(0)].max()), 'clipped below zero, mean', float(lost.mean()), 'worst', float(lost.min()))
prof = (res @ np.array([0.2126, 0.7152, 0.0722], np.float32))
for e in (0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7):
    r = int(e / EL * SIZE[1])
    row = prof[r][np.abs(az) < 40]
    print('  el', e, 'veil', round(float(veil[r, 0]), 5), 'rest mean', round(float(row.mean()), 5), 'p10', round(float(np.percentile(row, 10)), 5), 'p90', round(float(np.percentile(row, 90)), 5))
np.save(f'{WORK}/haze/haze-scene.npy', haze)
np.save(f'{WORK}/haze/rest.npy', rest)
np.save(f'{WORK}/haze/back.npy', back)
np.save(f'{WORK}/haze/card-scene.npy', card)
rng = np.random.RandomState(SEED)
img = display(haze * GAIN)
tex = np.where(img * 255 < 0.25, 0, np.clip(np.floor(img * 255 + rng.rand(*img.shape) + rng.rand(*img.shape) - 0.5), 0, 255)).astype(np.uint8)[::-1]
write(f'{OUT}/full/haze.png', tex)
half = cv2.resize(img, (SIZE[0] // 2, SIZE[1] // 2), interpolation=cv2.INTER_AREA)
write(f'{OUT}/web/haze.png', np.where(half * 255 < 0.25, 0, np.clip(np.floor(half * 255 + rng.rand(*half.shape) + rng.rand(*half.shape) - 0.5), 0, 255)).astype(np.uint8)[::-1])
json.dump({'azDeg': AZ, 'elDeg': EL, 'gain': GAIN, 'size': list(SIZE), 'riseDeg': g['riseDeg'], 'under': UNDER['amount'], 'underDeg': list(UNDER['over'])}, open(NOTE, 'w'), indent=2)
cimg = display(card)
bl = display(back)
for e in (-2, -1, -0.5, 0, 0.5, 1, 2, 3, 5):
    sel = (np.abs(above - e) < 0.1) & (np.abs(cols[None, :] - 0.5) < 0.5)
    print('  back at el', e, 'display levels', (bl[sel].mean(0) * 255).round(1), 'old card', (display(np.maximum(floor * (0.9 * step(above, 0.5, 1.7) + 0.1 * step(above, 1.7, 4.5))[..., None], 0))[sel].mean(0) * 255).round(1), 'new low', (display(np.maximum(back + (1 - weight) * (floor - back), 0))[sel].mean(0) * 255).round(1))
print('card max', float(cimg.max()), 'mean', float(cimg.mean()), 'haze coded max', float(img.max()), 'rest min', float(rest.min()), 'max', float(rest.max()))
write(f'{OUT}/full/sky-terrain.webp', cimg, 95)
write(f'{OUT}/web/sky-terrain.webp', cv2.resize(cimg, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 92)
write(f'{WORK}/sky-terrain-check.jpg', cv2.resize(cimg, (w // 2, h // 2), interpolation=cv2.INTER_AREA), 88)
