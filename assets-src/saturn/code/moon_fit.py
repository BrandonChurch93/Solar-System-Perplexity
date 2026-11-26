# moon_fit.py HERO.png [LOOK.json [OUT.png]]: the smooth part of the look of the large moon (src/stops/saturn/titan.json)
# as a least squares fit to the moon of the approved picture of the hold (references/approved/saturn-hero.png,
# brought to 1920 by 1080).
# The fragment shader of src/stops/saturn/titan.ts is written out here in numpy, line by line, with the integer
# hash of src/stops/saturn/kept/rings.ts, and drawn at 2 samples a pixel over the crop of the moon; the film's
# exposure and tone curve follow, and a blur of 0.45 px for the samples of a final frame. The fit moves the light
# (terminator, redden, day, limb), the rim, the pale south, the hood, the haze, the shell of the north and the
# place and radius of the moon; belts, mottle and grain are off while it runs (they are set by eye after it).
# With LOOK.json (a file in the form of titan.json) it draws that look beside the approved crop instead, prints
# both along six directions from the middle of the moon and, with a third name, writes the two crops side by side
# at 7 times. Measures and prints only: the film does not run it.
# The Sun and the axis below are those of the film at frame 3465 as the disc of the moon is seen: x to the right,
# y down, z from the moon to the lens (the moon stands 22 degrees off the middle of the frame, so this is not the
# frame of the lens; the plan gives both: light direction, axis, flight and the moon's home in titan.json).
import sys, json
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.optimize import least_squares
BOX = (1626, 122, 1716, 206)
SUN = np.array([-0.8100, -0.5862, -0.0189]); SUN = SUN / np.linalg.norm(SUN)
AXIS = np.array([0.3300, -0.9259, 0.1841]); AXIS = AXIS / np.linalg.norm(AXIS)
SKY = np.array([0.0074, 0.00982, 0.01194])
EXPOSURE, BLUR = 0.80, 0.45
def V(x): return np.array(x, float)
def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def filmic(x):
    x = np.maximum(x, 0); return np.clip((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)
def srgb(c):
    c = np.clip(c, 0, 1); return np.where(c < 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)
def pcg(v):
    v = v.astype(np.uint32)
    s = v * np.uint32(747796405) + np.uint32(2891336453)
    w = ((s >> ((s >> np.uint32(28)) + np.uint32(4))) ^ s) * np.uint32(277803737)
    return (w >> np.uint32(22)) ^ w
def hash3(i):
    u = (i.astype(np.int64) & 0xffffffff).astype(np.uint32)
    with np.errstate(over='ignore'):
        return (pcg(u[..., 0] + pcg(u[..., 1] + pcg(u[..., 2]))) >> np.uint32(8)).astype(float) / 16777216.0
def cloud(p):
    i = np.floor(p); f = p - i; f = f * f * (3 - 2 * f); ii = i.astype(np.int64)
    def c(dx, dy, dz): return hash3(ii + np.array([dx, dy, dz]))
    fx, fy, fz = f[..., 0], f[..., 1], f[..., 2]
    a = (c(0, 0, 0) * (1 - fx) + c(1, 0, 0) * fx) * (1 - fy) + (c(0, 1, 0) * (1 - fx) + c(1, 1, 0) * fx) * fy
    b = (c(0, 0, 1) * (1 - fx) + c(1, 0, 1) * fx) * (1 - fy) + (c(0, 1, 1) * (1 - fx) + c(1, 1, 1) * fx) * fy
    return a * (1 - fz) + b * fz - 0.5
def line(s, seed): return cloud(np.stack([s, np.full_like(s, seed), np.zeros_like(s)], -1))
class Geo:
    def __init__(s, cx, cy, R, ss):
        x0, y0, x1, y1 = BOX; s.ss = ss
        xs = (np.arange((x1 - x0) * ss) + 0.5) / ss + x0; ys = (np.arange((y1 - y0) * ss) + 0.5) / ss + y0
        X, Y = np.meshgrid(xs, ys)
        u, v = (X - cx) / R, (Y - cy) / R
        s.miss = np.hypot(u, v); s.px = 1.0 / R
        s.z = np.sqrt(np.maximum(1 - s.miss ** 2, 0))
        n = np.stack([u, v, s.z], -1); n = n / np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-6)
        edge = np.stack([u, v, np.zeros_like(u)], -1) / np.maximum(s.miss, 1e-6)[..., None]
        s.ndl = n @ SUN; s.sunEdge = edge @ SUN; s.lat = n @ AXIS; s.latEdge = edge @ AXIS
        s.across = n - AXIS * s.lat[..., None]
    def down(s, a):
        h, w = a.shape[0] // s.ss, a.shape[1] // s.ss
        return a.reshape(h, s.ss, w, s.ss, -1).mean((1, 3))
def shade(G, L, texture=True, foot=1.0):
    fpx = G.px * foot; d = 1 - G.miss
    cover = smooth(-1, 1, d / (L['edgePx'] * fpx))
    lit = smooth(L['terminator'][0], L['terminator'][1], G.ndl)
    M, B, Gr, R, Hz, S = L['mottle'], L['belts'], L['grain'], L['rim'], L['haze'], L['shell']
    tint = np.ones(G.miss.shape + (3,))
    if texture:
        flow = np.stack([G.across[..., 0], G.across[..., 2], G.lat * M['stretch']], -1)
        fine = cloud(flow * M['scale']) + 0.5 * cloud(flow * M['scale'] * M['ratio'] + M['shift'])
        s = G.lat * B['scale'] + B['warp'] * fine
        belt = line(s, B['seed']) + B['second'] * line(s * B['ratio'] + B['shift'], B['seed'])
        grain = cloud(np.stack([G.across[..., 0], G.across[..., 2], G.lat * Gr['stretch']], -1) * Gr['scale'] + Gr['shift'])
        tint = (V(B['deep']) + (V(B['pale']) - V(B['deep'])) * np.clip(0.5 + belt * B['amount'], 0, 1)[..., None]) * (1 + M['amount'] * fine + Gr['amount'] * grain)[..., None]
    tint = tint * (1 + (V(L['south']['colour']) - 1) * smooth(L['south']['from'], L['south']['to'], -G.lat)[..., None])
    hood = 1 + (V(L['hood']['colour']) - 1) * smooth(L['hood']['from'], L['hood']['to'], G.lat)[..., None]
    day = V(L['day']) * tint * hood * (V(L['redden']) + (1 - V(L['redden'])) * lit[..., None])
    limb = 1 + L['limb']['amount'] * (np.maximum(G.z, 0) ** L['limb']['power'] - 1)
    rim_at = (d - np.maximum(R['depth'], R['depthPx'] * fpx)) / np.maximum(R['width'], R['widthPx'] * fpx)
    body = day * (lit * limb)[..., None] + V(R['colour']) * tint * (smooth(R['sun'][0], R['sun'][1], G.sunEdge) * np.exp(-rim_at ** 2))[..., None] + V(L['night'])
    high = np.maximum(-d, 0)
    haze = V(Hz['colour']) * (np.exp(-high / np.maximum(Hz['height'], Hz['heightPx'] * fpx)) * smooth(Hz['sun'][0], Hz['sun'][1], G.sunEdge))[..., None]
    amount = smooth(S['lat'][0], S['lat'][1], G.latEdge) * (1 - smooth(S['day'][0], S['day'][1], G.sunEdge)) * smooth(S['night'][0], S['night'][1], G.sunEdge)
    top = S['height'] * amount; soft = S['edgePx'] * fpx
    shell = smooth(-1, 1, (top + d) / np.maximum(S['edge'], soft)) * smooth(0.0, soft, top)
    turn = smooth(S['turn'][0], S['turn'][1], np.clip(high / np.maximum(top, 1e-4), 0, 1))
    shell_col = (V(S['inner']) + (V(S['outer']) - V(S['inner'])) * turn[..., None]) * smooth(S['lit'][0], S['lit'][1], G.sunEdge)[..., None]
    air = haze + (shell_col - haze) * shell[..., None]
    col = air + (body - air) * cover[..., None]
    return col, cover + (1 - cover) * shell * S['solid']
def show(G, col, hide, blur=BLUR):
    scene = G.down(col) * EXPOSURE + (1 - G.down(hide[..., None])) * SKY
    if blur > 0: scene = np.stack([gaussian_filter(scene[..., c], blur) for c in range(3)], -1)
    return srgb(filmic(scene)) * 255
SPEC = [
 ('terminator', 0, -0.09, -0.4, 0.2), ('terminator', 1, 1.0, 0.4, 1.6), ('redden', 1, 1.0, 0.6, 1.4), ('redden', 2, 1.1, 0.5, 1.8),
 ('day', 0, 1.05, 0.7, 1.6), ('day', 1, 0.41, 0.25, 0.6), ('day', 2, 0.10, 0.04, 0.2),
 ('limb.amount', None, 0.5, 0.0, 0.95), ('limb.power', None, 0.6, 0.2, 1.5),
 ('rim.colour', 0, 0.9, 0, 4), ('rim.colour', 1, 0.6, 0, 3), ('rim.colour', 2, 0.4, 0, 2), ('rim.width', None, 0.03, 0.012, 0.12), ('rim.depth', None, 0.04, 0.0, 0.12),
 ('rim.sun', 0, 0.2, -0.3, 0.6), ('rim.sun', 1, 0.9, 0.65, 1.5),
 ('south.colour', 0, 1.15, 0.8, 2), ('south.colour', 1, 1.6, 0.8, 3), ('south.colour', 2, 2.0, 0.8, 4), ('south.from', None, -0.2, -0.6, 0.3), ('south.to', None, 0.45, 0.35, 1.2),
 ('hood.colour', 0, 0.75, 0.4, 1.3), ('hood.colour', 1, 0.68, 0.4, 1.3), ('hood.colour', 2, 0.69, 0.4, 1.6),
 ('haze.colour', 0, 0.05, 0, 0.4), ('haze.colour', 1, 0.014, 0, 0.2), ('haze.colour', 2, 0.006, 0, 0.1), ('haze.height', None, 0.05, 0.01, 0.2),
 ('shell.height', None, 0.11, 0.02, 0.2), ('shell.inner', 0, 0.16, 0, 1.2), ('shell.inner', 1, 0.075, 0, 0.8), ('shell.inner', 2, 0.04, 0, 0.6),
 ('shell.outer', 0, 0.05, 0, 0.6), ('shell.outer', 1, 0.045, 0, 0.6), ('shell.outer', 2, 0.07, 0, 0.6),
 ('shell.day', 0, 0.45, 0.1, 0.6), ('shell.day', 1, 0.9, 0.65, 1.2), ('shell.lat', 0, 0.3, -0.2, 0.6), ('shell.lat', 1, 0.8, 0.65, 1.0), ('shell.turn', 0, 0.3, 0.0, 0.6),
]
START = dict(day=[1.05, 0.41, 0.10], night=[0.0, 0.0, 0.0], terminator=[-0.09, 1.0], edgePx=0.75, redden=[1, 1.0, 1.1], limb=dict(amount=0.5, power=0.6),
  rim=dict(colour=[0.9, 0.6, 0.4], width=0.03, widthPx=0.0, depth=0.04, depthPx=0.0, sun=[0.2, 0.9]),
  belts=dict(scale=3.0, warp=1.2, seed=3.0, second=0.5, ratio=2.3, shift=5.0, amount=1.0, deep=[1, 1, 1], pale=[1, 1, 1]),
  south=dict(colour=[1.15, 1.6, 2.0], **{'from': -0.2, 'to': 0.45}), mottle=dict(amount=0.0, scale=3.2, ratio=2.3, shift=7.0, stretch=2.6),
  grain=dict(amount=0.0, scale=14.0, stretch=1.6, shift=11.0), hood=dict(colour=[0.75, 0.68, 0.69], **{'from': 0.35, 'to': 0.8}),
  haze=dict(colour=[0.05, 0.014, 0.006], height=0.05, heightPx=0.0, sun=[-0.35, 0.5]),
  shell=dict(height=0.11, lat=[0.3, 0.8], day=[0.45, 0.9], night=[-0.25, 0.0], edge=0.02, edgePx=0.75, inner=[0.16, 0.075, 0.04], outer=[0.05, 0.045, 0.07], turn=[0.3, 1.0], lit=[-0.1, 0.3], solid=1.0))
def build(p):
    L = json.loads(json.dumps(START))
    for (path, i, _, _, _), v in zip(SPEC, p):
        o = L; keys = path.split('.')
        for k in keys[:-1]: o = o[k]
        if i is None: o[keys[-1]] = float(v)
        else: o[keys[-1]][i] = float(v)
    return L
def rows(im, cx, cy, R):
    out = []
    rs = np.array([-20, -14, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], float)
    for a0, a1 in ((140, 160), (175, 195), (205, 225), (240, 260), (262, 282), (285, 305)):
        angs = np.radians(np.linspace(a0, a1, 41)); A, Rr = np.meshgrid(angs, R + rs, indexing='ij')
        x = cx + np.cos(A) * Rr - BOX[0] - 0.5; y = cy + np.sin(A) * Rr - BOX[1] - 0.5
        p = np.array([map_coordinates(im[:, :, c], [y, x], order=1, mode='nearest').mean(0) for c in range(3)]).T
        out.append('%3d to %3d  ' % (a0, a1) + ' '.join('%3d,%3d,%3d' % tuple(q.round().astype(int)) for q in p))
    return out
if __name__ == '__main__':
    picture = Image.open(sys.argv[1]).convert('RGB')
    if picture.size[0] > 1920: picture = picture.resize((1920, 1080), Image.LANCZOS)
    hero = np.asarray(picture).astype(float)[BOX[1]:BOX[3], BOX[0]:BOX[2]]
    X, Y = np.meshgrid(np.arange(BOX[0], BOX[2]) + 0.5, np.arange(BOX[1], BOX[3]) + 0.5)
    if len(sys.argv) > 2:
        L = json.load(open(sys.argv[2])); g = (1682.7, 171.83, 30.6)
        G = Geo(g[0], g[1], g[2], 4); col, hide = shade(G, L); out = show(G, col, hide)
        print('rms %.2f display values over the crop' % np.sqrt(((out - hero) ** 2).mean()))
        for a, b in zip(rows(hero, *g), rows(out, *g)): print('approved ' + a); print('look     ' + b)
        if len(sys.argv) > 3:
            both = np.concatenate([hero, np.full((hero.shape[0], 2, 3), 128.0), out], 1)
            Image.fromarray(np.clip(both, 0, 255).astype(np.uint8)).resize((both.shape[1] * 7, both.shape[0] * 7), Image.NEAREST).save(sys.argv[3])
        sys.exit(0)
    p0 = np.array([s[2] for s in SPEC] + [1682.0, 171.2, 30.8])
    lo = np.array([s[3] for s in SPEC] + [1681, 170.2, 30.0]); hi = np.array([s[4] for s in SPEC] + [1683, 172.2, 31.6])
    def out_of(p):
        G = Geo(p[-3], p[-2], p[-1], 2); col, hide = shade(G, build(p[:-3]), texture=False); return show(G, col, hide)
    r = np.hypot(X - p0[-3], Y - p0[-2])
    stars = (r > p0[-1] + 5.5) & ((hero.max(-1) - out_of(p0).max(-1)) > 10)
    sel = (r < p0[-1] + 8) & ~stars
    resid = lambda p: (out_of(p) - hero)[sel].ravel()
    print('start rms %.2f' % np.sqrt((resid(p0) ** 2).mean()))
    res = least_squares(resid, p0, bounds=(lo, hi), loss='soft_l1', f_scale=8.0, diff_step=1e-2, max_nfev=80)
    print('end rms %.2f, moon at %.2f, %.2f radius %.2f px' % (np.sqrt((resid(res.x) ** 2).mean()), res.x[-3], res.x[-2], res.x[-1]))
    print(json.dumps(build(res.x[:-3]), indent=1))
