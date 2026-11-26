#!/usr/bin/env python3
"""Where the sheets of the close set must be cut (MAIL 1104).

A layer of the set is one sheet: a grid over its box whose corners stand at the
distance the picture's eye saw. Where a near crest and the ground behind it lie
in one layer, the cell across the step is stretched as soon as the eye leaves
the picture's eye, and the crest's outline runs along cell sides.

This script finds every such step by measure, not by eye. For each pair of
neighbour texels of a layer's distance field it takes the two points on the
pair's middle ray at the two distances and draws both from every eye of the
film's path (poses in the relief's own frame, written by a scratch reader of
the plan). Their distance on the screen is the parallax of the step. A pair is
a cut where that parallax is larger than one cell of the layer's grid, drawn
at the near distance from the same eye. Pairs are joined into crests when they
lie within one cell of each other.

Not read: whether a nearer layer hides the pair from the present eye (pairs of
a layer that another layer covers from the picture's eye are left out).

  python3 assets-src/mars/place/crests.py --poses out/work/place/poses91.json --out out/work/place/saw
"""
import argparse, json, os
import numpy as np
import cv2
from scipy import ndimage

p = argparse.ArgumentParser()
p.add_argument('--relief', default='src/stops/mars/relief.json')
p.add_argument('--set', default='public/assets/mars/full')
p.add_argument('--poses', required=True)
p.add_argument('--mesh', type=int, default=420)
p.add_argument('--lines', type=int, default=1080)
p.add_argument('--every', type=int, default=2)
p.add_argument('--kinds', default='dive,terrain,rise')
p.add_argument('--least', type=float, default=0.0, help='only eyes at which the share of the set is over this')
p.add_argument('--out', required=True)
a = p.parse_args()
R = json.load(open(a.relief))
W, H = R['imageSize']['full']
th = np.tan(np.radians(R['camera']['vfovDeg']) / 2)
asp = W / H
poses = json.load(open(a.poses))
# only eyes at which the set is there at all (the share of the set by the eye's height, close.json presence, as the reader wrote it)
poses = [q for q in poses if q.get('there', 1) > a.least and q['kind'] in a.kinds.split(',')]
there = {q['frame']: q.get('there', 1) for q in poses}
poses = [q for i, q in enumerate(poses) if i % a.every == 0]
os.makedirs(a.out, exist_ok=True)

def rot(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]], dtype=np.float32)

def rays(px, py):
    d = np.stack([(2 * px / W - 1) * th * asp, (1 - 2 * py / H) * th, -np.ones_like(px)], -1).astype(np.float32)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)

def draw(P, pose):
    v = (P - np.asarray(pose['eye'], np.float32)) @ rot(pose['quat'])
    f = a.lines / 2 / np.tan(np.radians(pose['vfov']) / 2)
    z = np.minimum(v[..., 2], -1e-4)
    return a.lines * 16 / 9 / 2 + f * v[..., 0] / -z, a.lines / 2 - f * v[..., 1] / -z, v[..., 2] < -1e-3

layers = R['layers']
alphas = {}
for k, l in layers.items():
    al = cv2.imread(os.path.join(a.set, os.path.basename(l['files']['full']['alpha'])), cv2.IMREAD_UNCHANGED)
    if al.ndim == 3: al = al[..., -1] if al.shape[2] == 4 else al[..., 0]
    alphas[k] = al
order = R['drawOrder']
rows = []
for k in order:
    l = layers[k]; b = l['box']; dw, dh = l['distSize']['full']
    d = np.fromfile(os.path.join(a.set, os.path.basename(l['files']['full']['dist'])), np.float32).reshape(dh, dw)
    al = cv2.resize(alphas[k], (dw, dh), interpolation=cv2.INTER_AREA) > 127
    rg = R.get('ridge')
    if rg and rg['layer'] == k:
        # the sheet as the engine draws it: inside the ridge's field the distance is the harmonic mean of taps (relief.ts distance())
        gy, gx = np.mgrid[0:dh, 0:dw]
        fx = (gx + 0.5) / dw; fy = (gy + 0.5) / dh
        y = (b['y'] + fy * b['h']) / H - rg['center'][1]; x = (b['x'] + fx * b['w']) / W - rg['center'][0] - rg['slope'] * y
        t = np.clip((np.hypot(x / rg['radius'][0], y / rg['radius'][1]) - rg['core']) / (1 - rg['core']), 0, 1)
        wgt = (1 - t * t * (3 - 2 * t)).astype(np.float32)
        mid = (len(rg['taps']) - 1) / 2; tot = 0.0; acc = np.zeros((dh, dw), np.float32)
        for j, wy in enumerate(rg['taps']):
            for i, wx in enumerate(rg['taps']):
                sx = (fx + (i - mid) * rg['interval'][0] * W / b['w']) * dw - 0.5; sy = (fy + (j - mid) * rg['interval'][1] * H / b['h']) * dh - 0.5
                acc += wx * wy / cv2.remap(d, np.clip(sx, 0, dw - 1).astype(np.float32), np.clip(sy, 0, dh - 1).astype(np.float32), cv2.INTER_LINEAR)
                tot += wx * wy
        d = (d * (1 - wgt) + tot / acc * wgt).astype(np.float32)
        np.save(os.path.join(a.out, 'ridged-%s.npy' % k), d)
    # hidden from the picture's eye by a layer drawn later
    yy, xx = np.mgrid[0:dh, 0:dw]
    px = b['x'] + (xx + 0.5) * b['w'] / dw; py = b['y'] + (yy + 0.5) * b['h'] / dh
    for k2 in order[order.index(k) + 1:]:
        b2 = layers[k2]['box']; a2 = alphas[k2]
        u = ((px - b2['x']) / b2['w'] * a2.shape[1]).astype(np.int32); v = ((py - b2['y']) / b2['h'] * a2.shape[0]).astype(np.int32)
        ok = (u >= 0) & (u < a2.shape[1]) & (v >= 0) & (v < a2.shape[0])
        hid = np.zeros_like(al); hid[ok] = a2[v[ok], u[ok]] > 127
        al &= ~hid
    nx = a.mesh if b['w'] >= b['h'] else round(a.mesh * b['w'] / b['h'])
    ny = round(a.mesh * b['h'] / b['w']) if b['w'] >= b['h'] else a.mesh
    cell = (b['w'] / nx, b['h'] / ny)
    best = np.zeros((dh, dw), np.float32); bestf = np.zeros((dh, dw), np.int32); bestc = np.zeros((dh, dw), np.float32)
    for ax in (0, 1):
        if ax == 0:
            da, db = d[:, :-1], d[:, 1:]; ok = al[:, :-1] & al[:, 1:]
            mx = (px[:, :-1] + px[:, 1:]) / 2; my = py[:, :-1]; ox, oy = cell[0] / 2, 0.0
        else:
            da, db = d[:-1, :], d[1:, :]; ok = al[:-1, :] & al[1:, :]
            mx = px[:-1, :]; my = (py[:-1, :] + py[1:, :]) / 2; ox, oy = 0.0, cell[1] / 2
        near = np.minimum(da, db); far = np.maximum(da, db)
        # a pair can only count where its step is not nothing: leave out pairs under a thousandth (their parallax is under a hundredth px)
        sel = ok & (far - near > 1e-3 * near)
        iy, ix = np.nonzero(sel)
        m = rays(mx[sel], my[sel]); c0 = rays(mx[sel] - ox, my[sel] - oy); c1 = rays(mx[sel] + ox, my[sel] + oy)
        n = near[sel][:, None]; f = far[sel][:, None]
        top = np.zeros(len(iy), np.float32); topf = np.zeros(len(iy), np.int32); topc = np.zeros(len(iy), np.float32)
        for q in poses:
            x0, y0, v0 = draw(m * n, q); x1, y1, v1 = draw(m * f, q)
            par = np.hypot(x1 - x0, y1 - y0)
            u0, w0, _ = draw(c0 * n, q); u1, w1, _ = draw(c1 * n, q)
            cpx = np.hypot(u1 - u0, w1 - w0)
            inside = v0 & v1 & (x0 > 0) & (x0 < a.lines * 16 / 9) & (y0 > 0) & (y0 < a.lines)
            over = np.where(inside & (par > cpx), par, 0)
            up = over > top
            top[up] = over[up]; topf[up] = q['frame']; topc[up] = cpx[up]
        cur = best[iy, ix]; up = top > cur
        best[iy[up], ix[up]] = top[up]; bestf[iy[up], ix[up]] = topf[up]; bestc[iy[up], ix[up]] = topc[up]
    mask = best > 0
    grow = ndimage.binary_dilation(mask, structure=np.ones((3, 3), bool), iterations=max(1, int(round(cell[0] * dw / b['w']))))
    lab, count = ndimage.label(grow)
    lab[~mask] = 0
    np.save(os.path.join(a.out, 'cut-%s.npy' % k), best)
    for i in range(1, count + 1):
        ys, xs = np.nonzero(lab == i)
        if not len(ys): continue
        j = np.argmax(best[ys, xs])
        rows.append({'layer': k, 'pairs': int(len(ys)), 'box': [int(b['x'] + xs.min() * b['w'] / dw), int(b['y'] + ys.min() * b['h'] / dh), int(b['x'] + (xs.max() + 1) * b['w'] / dw), int(b['y'] + (ys.max() + 1) * b['h'] / dh)],
                     'parallaxPx': round(float(best[ys[j], xs[j]]), 1), 'cellPx': round(float(bestc[ys[j], xs[j]]), 1), 'frame': int(bestf[ys[j], xs[j]]), 'there': round(there[int(bestf[ys[j], xs[j]])], 2), 'near': round(float(d[ys[j], xs[j]]), 2)})
    print(k, 'cell', [round(c, 1) for c in cell], 'pairs over one cell', int(mask.sum()), 'crests', sum(1 for r in rows if r['layer'] == k), flush=True)
rows.sort(key=lambda r: -r['parallaxPx'])
json.dump({'lines': a.lines, 'mesh': a.mesh, 'kinds': a.kinds, 'frames': [poses[0]['frame'], poses[-1]['frame']], 'crests': rows}, open(os.path.join(a.out, 'crests.json'), 'w'), indent=0)
for r in rows[:40]: print(r)
print('frames', [q['frame'] for q in poses][:3], '...', [q['frame'] for q in poses][-3:], len(poses))
print('crests', len(rows))
