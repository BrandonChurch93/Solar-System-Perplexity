import json
import sys

import numpy as np
from PIL import Image
from scipy.optimize import minimize

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

PLATE = 'assets-src/mercury/sky/lens-ghosts.webp'
HERO = 'references/approved/mercury-hero.png'
OUT = sys.argv[1]
CHECK = sys.argv[2] if len(sys.argv) > 2 else None
W, H = 2816, 1584
BOX = (340, 820, 1240, 1360)
SUN = np.array([2690.65, 175.88])
BOOST = 4.0
BLADES = 6
ROUND = 0.35
EDGE = 1.0
CORE = 0.12
HALF = 0.5
SOFT = (0.03, 0.12)
KEEP_SOFT = ('comet', 'dot')
STREAK = {'size': 0.0114, 'long': 12.8, 'soft': 0.03, 'fringe': 0.0, 'round': ROUND, 'color': [0.0085, 0.0066, 0.003]}
SPOTS = [
    ('streak', 'capsule', (796, 1006), (1026, 898), 20),
    ('green', 'disc', (865, 1035), 62),
    ('pale', 'disc', (945, 1003), 52),
    ('hex', 'disc', (650, 1150), 74),
    ('dot', 'disc', (1125, 905), 30),
    ('band', 'disc', (760, 1068), 56),
    ('red', 'capsule', (630, 1160), (780, 1225), 26),
    ('comet', 'disc', (462, 1252), 120),
]
FORM = {
    'comet': {'soft': 0.1, 'ring': 0.0, 'fringe': 0.03, 'round': ROUND},
    'tail': {'soft': 0.05, 'ring': 0.2, 'fringe': 0.02, 'round': ROUND},
    'haze': {'soft': 0.05, 'ring': 0.3, 'fringe': 0.02, 'round': ROUND},
    'hex': {'soft': 0.04, 'ring': 0.35, 'fringe': 0.03, 'round': ROUND},
    'band': {'soft': 0.05, 'ring': 0.2, 'fringe': 0.02, 'round': ROUND},
    'green': {'soft': 0.05, 'ring': 0.25, 'fringe': 0.02, 'round': ROUND},
    'pale': {'soft': 0.05, 'ring': 0.25, 'fringe': 0.02, 'round': ROUND},
    'streak': {'soft': 0.15, 'ring': 0.0, 'fringe': 0.0, 'round': 1.0},
    'dot': {'soft': 0.08, 'ring': 0.3, 'fringe': 0.05, 'round': ROUND},
}

centre = np.array([W / 2, H / 2])
S = SUN - centre
Sn = S / np.hypot(*S)
Pn = np.array([-Sn[1], Sn[0]])
half = H / 2
img = np.asarray(Image.open(PLATE).convert('RGB')).astype(np.float32) / 255
if img.shape[:2] != (BOX[3] - BOX[1], BOX[2] - BOX[0]):
    raise SystemExit('the plate is not the full one')
lin = geo.unfilm(geo.to_linear(img)) / BOOST
luma = lin @ geo.LUMA
yy, xx = np.mgrid[BOX[1]:BOX[3], BOX[0]:BOX[2]].astype(np.float32)


def spot(s):
    if s[1] == 'disc':
        return np.hypot(xx - s[2][0], yy - s[2][1]) / s[3]
    a = np.array(s[2], np.float32)
    b = np.array(s[3], np.float32)
    ab = b - a
    t = np.clip(((xx - a[0]) * ab[0] + (yy - a[1]) * ab[1]) / (ab @ ab), 0, 1)
    return np.hypot(xx - a[0] - t * ab[0], yy - a[1] - t * ab[1]) / s[4]


near = np.stack([spot(s) for s in SPOTS])
own = np.argmin(near, 0)
masks = {s[0]: (own == i) & (near[i] < 1.25) for i, s in enumerate(SPOTS)}
peak = float(np.percentile(luma[masks['comet']], 99.9))
core = masks['comet'] & (luma > CORE * peak)
cw = luma * core
ccx, ccy = (cw * xx).sum() / cw.sum(), (cw * yy).sum() / cw.sum()
inner = ((xx - ccx) * Sn[0] + (yy - ccy) * Sn[1]) > 0
masks['tail'] = masks['comet'] & ~core & inner
masks['haze'] = masks['comet'] & ~core & ~inner
masks['comet'] = core


def opening(qx, qy, turn, rnd):
    a = np.arctan2(qy, qx) + turn
    seg = 2 * np.pi / BLADES
    side = np.cos(np.floor(0.5 + a / seg) * seg - a) / np.cos(seg / 2)
    return np.hypot(qx, qy) * (side * (1 - rnd) + rnd)


def smooth(a, b, x):
    t = np.clip((x - a) / np.maximum(b - a, 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def cover(g, turn, px=1.0 / half):
    cx = centre[0] + S[0] * g['at']
    cy = centre[1] + S[1] * g['at']
    qx = (xx - cx) / half
    qy = -(yy - cy) / half
    ax, ay = Sn[0], -Sn[1]
    along = qx * ax + qy * ay
    qx = qx - ax * along * (1 - 1 / g['long'])
    qy = qy - ay * along * (1 - 1 / g['long'])
    r = opening(qx, qy, turn, g['round']) / g['size']
    w = max(g['soft'], EDGE * px / g['size'])
    out = []
    for k in (1.0, 0.0, -1.0):
        rr = r / (1 + g['fringe'] * k)
        out.append(1 - smooth(1 - w, 1 + w, rr))
    return np.stack(out, -1) * (1 + g['ring'] * smooth(0.7, 1.0, r))[..., None]


def measure(name):
    m = masks[name]
    w = luma * m
    tot = w.sum()
    cx, cy = (w * xx).sum() / tot, (w * yy).sum() / tot
    al = (xx - cx) * Sn[0] + (yy - cy) * Sn[1]
    pe = (xx - cx) * Pn[0] + (yy - cy) * Pn[1]
    sa = float(np.sqrt((w * al * al).sum() / tot))
    sp = float(np.sqrt((w * pe * pe).sum() / tot))
    c = np.array([cx, cy]) - centre
    top = float(np.percentile(luma[m], 98))
    bright = m & (luma > HALF * top)
    return {'at': float(c @ S / (S @ S)), 'off': float(c @ Pn), 'along': sa, 'across': sp, 'light': (lin * m[..., None]).sum((0, 1)), 'radius': float(np.sqrt(bright.sum() / np.pi)), 'bright': lin[bright].mean(0)}


found = []
for name in ('comet', 'tail', 'haze', 'hex', 'band', 'green', 'pale', 'streak', 'dot'):
    m = measure(name)
    long = max(m['along'] / m['across'], 1.0) if name in ('streak', 'comet') else 1.0
    size = (m['radius'] if name == 'dot' else 2 * m['across'] if long > 1 else 2 * np.sqrt(m['along'] * m['across'])) / half
    g = {'name': name, 'at': round(m['at'], 4), 'size': round(float(size), 4), 'long': round(float(long), 3), **FORM[name]}
    found.append((g, m))
    print(f"{name:7s} at {m['at']:+.4f} off {m['off']:+6.1f} px sigma along {m['along']:5.1f} across {m['across']:5.1f} half radius {m['radius']:5.1f} px light {np.round(m['light'], 2)}")

hexm = masks['hex'] & (luma > 0.3 * np.percentile(luma[masks['hex']], 98))
best = (-1.0, 0.0)
for deg in np.arange(0, 360 / BLADES, 1.0):
    g = dict(found[3][0], soft=0.02, ring=0.0, fringe=0.0)
    c = cover(g, np.radians(deg))[..., 1] > 0.5
    score = (c & hexm).sum() / max((c | hexm).sum(), 1)
    if score > best[0]:
        best = (float(score), float(deg))
print('the opening turned by', best[1], 'degrees, overlap with the pale ghost', round(best[0], 3))
turn = np.radians(best[1])

for g, m in found:
    c = cover(g, turn)
    g['color'] = [round(float(v), 5) for v in m['light'] / np.maximum(c.sum((0, 1)), 1e-9)]
ghosts = [dict(g) for g, _ in found]

hero = np.asarray(Image.open(HERO).convert('RGB')).astype(np.float32) / 255
crop = hero[BOX[1]:BOX[3], BOX[0]:BOX[2]]
base = geo.unfilm(geo.to_linear(crop)) - lin
target = crop * 255
N = W * H


def code(a):
    return np.clip(geo.to_srgb(geo.film(np.maximum(a, 0))) * 255, 0, 255)


def layer(q):
    return cover(q, turn) * np.array(q['color'], np.float32)


def cost(total, step=1):
    return float(np.abs(code((base + total)[::step, ::step]) - target[::step, ::step]).sum()) * step * step / 3 / N


def unpack(q, v):
    r = dict(q)
    r['size'] = q['size'] * float(np.exp(np.clip(v[0], -0.7, 0.7)))
    r['long'] = max(1.0, q['long'] * float(np.exp(np.clip(v[1], -0.7, 0.7)))) if q['long'] > 1 else 1.0
    r['soft'] = float(np.clip(q['soft'] * np.exp(v[2]), *SOFT))
    r['color'] = [float(c * np.exp(np.clip(v[3 + i], -1.5, 1.5))) for i, c in enumerate(q['color'])]
    r['ring'] = float(np.clip(q['ring'] + v[6], 0, 0.6))
    return r


layers = [layer(q) for q in ghosts]
print('no ghosts', round(cost(0 * layers[0]), 4), 'measured', round(cost(sum(layers)), 4))
for sweep in range(2):
    for i, q in enumerate(ghosts):
        rest = sum(l for j, l in enumerate(layers) if j != i)
        res = minimize(lambda v: cost(rest + layer(unpack(q, v)), 3), np.zeros(8), method='Nelder-Mead', options={'maxfev': 260, 'xatol': 0.01, 'fatol': 1e-6, 'initial_simplex': np.vstack([np.zeros(8), 0.25 * np.eye(8)])})
        ghosts[i] = unpack(q, res.x)
        layers[i] = layer(ghosts[i])
print('fitted', round(cost(sum(layers)), 4))

for q in ghosts:
    q['size'] = round(q['size'], 4)
    q['long'] = round(q['long'], 4)
    q['color'] = [round(c, 5) for c in q['color']]
    q['ring'] = round(q['ring'], 4)
    if q['name'] not in KEEP_SOFT:
        q['soft'] = SOFT[0]
    if q['name'] == 'streak':
        q.update(STREAK)
    if q['name'] == 'comet':
        m = found[0][1]
        q['size'] = round(q['size'] * float(np.sqrt(np.pi * m['radius'] ** 2 / cover(q, turn)[..., 1].sum())), 4)
        q['color'] = [round(float(c), 5) for c in m['bright']]
total = sum(layer(q) for q in ghosts)
print('as written', round(cost(total), 4))
json.dump({'sun': [round(float(S[0] / half), 6), round(float(-S[1] / half), 6)], 'blades': BLADES, 'turnDeg': best[1], 'round': ROUND, 'edgePx': EDGE,
           'ghosts': [{k: q[k] for k in ('name', 'at', 'size', 'long', 'soft', 'ring', 'fringe', 'round', 'color')} for q in ghosts]}, open(OUT, 'w'), indent=1)
if CHECK:
    new = code(base + total)
    rows = [np.concatenate([np.clip(target * k, 0, 255), np.clip(new * k, 0, 255)], 1) for k in (1, 3)]
    Image.fromarray(np.concatenate(rows, 0).astype(np.uint8)).save(CHECK, quality=92)
