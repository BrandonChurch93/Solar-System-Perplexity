"""pose_fit2.py: the pose of the close view (src/stops/saturn/skim.json pose) against the approved close image
with more features than pose_fit.py: the lit limb of the globe on the rays from 75 to 165 degrees, the far outer
edge of the rings (the left horizon), the two edges of the dark gap, the edge of night and the foot of the lit
globe. Usage, from the repo's root: python3 assets-src/saturn/code/pose_fit2.py [OUT.jpg] [free=...]
[w=limb,night,gap,horizon,foot] [name=value] [show=1]. It prints the fitted pose and what is left of each
feature in pixels of 1920; it writes nothing into the film."""
import os, sys, json
import numpy as np
import scipy.ndimage as nd
from PIL import Image
from scipy.optimize import least_squares
CODE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CODE)
argv = sys.argv[:]
sys.argv = ['x']
import pose_fit as pf
import geom
W, H = pf.W, pf.H
OUTER = pf.MODEL['outer']
TOPW = 1.0
TOPX = 1400.0


def lum_of(path):
    img = Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)
    a = np.asarray(img).astype(float) / 255
    return img, nd.gaussian_filter(a @ np.array([0.2126, 0.7152, 0.0722]), 1.5)


def limb_points(lum, lo=75, hi=166, step=3.0):
    c0, r0 = np.array([1519.0, 668.0]), 634.0
    out = []
    for deg in np.arange(lo, hi, step):
        t = np.radians(deg)
        rr = np.arange(r0 - 140, r0 + 140, 0.5)
        pts = c0[None, :] + rr[:, None] * np.array([np.cos(t), -np.sin(t)])[None, :]
        ok = (pts[:, 0] > 2) & (pts[:, 0] < W - 3) & (pts[:, 1] > 2) & (pts[:, 1] < H - 3)
        if ok.sum() < 100:
            continue
        v = nd.map_coordinates(lum, [pts[ok, 1], pts[ok, 0]], order=1)
        i = int(np.argmin(np.gradient(v)))
        if v[:i].max() - v[i:].min() > 0.25:
            out.append(pts[ok][i])
    return np.array(out)


def horizon_points(lum, x0=4, x1=900, step=16, level=0.2):
    out = []
    for x in range(x0, x1, step):
        col = lum[250:620, x]
        idx = np.nonzero(col > level)[0]
        if len(idx) == 0:
            continue
        y = idx[0]
        # refine to the half level between the sky above and the ring below
        out.append([x, 250 + y])
    return np.array(out, float)


def foot_points(lum, x0=1040, x1=1500, step=20):
    out = []
    for x in range(x0, x1, step):
        col = lum[:, x]
        top = int(np.argmax(col > 0.5))
        mid = col[top + 60:top + 260].mean() if top + 260 < H else 0.6
        below = np.nonzero(col[top + 100:] < 0.5 * mid)[0]
        if len(below):
            out.append([x, top + 100 + below[0]])
    return np.array(out, float)


def residuals(p, feats, weights):
    limb, night, inner, outer, hor = feats[:5]
    base = pf.residuals(p, (None, limb, night, inner, outer), (weights[0], weights[1], weights[2]))
    base[0] = base[0] * np.where(limb[:, 0] > TOPX, TOPW, 1.0)
    pos, rot, sun, f = pf.camera(p)
    def radius_at(q):
        d = pf.rays(q, rot, f)
        k = -pos[1] / np.where(d[:, 1] < -1e-6, d[:, 1], -1e-6)
        hit = pos[None, :] + d * k[:, None]
        return np.where(d[:, 1] < -1e-6, np.hypot(hit[:, 0], hit[:, 2]), 50.0)
    r0 = radius_at(hor)
    gy = radius_at(hor + np.array([0, 1.0])) - r0
    gx = radius_at(hor + np.array([1.0, 0])) - r0
    base.append(weights[3] * np.clip((r0 - OUTER) / np.maximum(np.hypot(gx, gy), 1e-6), -400, 400))
    if len(feats) > 5 and len(weights) > 4:
        ft = feats[5]
        r0 = radius_at(ft)
        gy = radius_at(ft + np.array([0, 1.0])) - r0
        gx = radius_at(ft + np.array([1.0, 0])) - r0
        base.append(weights[4] * np.clip((r0 - 1.0) / np.maximum(np.hypot(gx, gy), 1e-6), -400, 400))
    return base


if __name__ == '__main__':
    global_top = None
    args = [a for a in argv[1:] if '=' not in a]
    opts = dict(a.split('=') for a in argv[1:] if '=' in a)
    src = opts.pop('img', geom.CLOSE)
    img, lum = lum_of(src)
    geom.CLOSE = src
    f0 = pf.features()
    feats = (limb_points(lum, float(opts.pop("lo", 75)), float(opts.pop("hi", 166))), f0[2], f0[3], f0[4], horizon_points(lum), foot_points(lum))
    pose = pf.SKIM['pose']
    p0 = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
    for name in pf.NAMES:
        if name in opts:
            p0[pf.NAMES.index(name)] = float(opts.pop(name))
    free = [pf.NAMES.index(n) for n in opts.get('free', 'az,foot,height,yaw,tilt,roll').split(',') if n]
    weights = tuple(float(x) for x in opts.get('w', '1,0.3,0.5,1').split(','))
    globals()["TOPW"] = float(opts.pop("topw", 1.0))
    def cost(x):
        p = p0.copy(); p[free] = x
        return np.concatenate(residuals(p, feats, weights))
    p = p0.copy()
    if free:
        fit = least_squares(cost, p0[free], loss='soft_l1', f_scale=20.0, x_scale=np.array([5, 0.2, 0.05, 5, 3, 3, 5.0])[free])
        p[free] = fit.x
    print('pose', {n: round(float(v), 4) for n, v in zip(pf.NAMES, p)})
    for label, r in zip(('limb', 'edge of night', 'gap inner edge', 'gap outer edge', 'horizon', 'foot'), residuals(p, feats, (1, 1, 1, 1, 1))):
        print('%-15s n %3d  mean %7.1f px  rms %6.1f px  p90 %6.1f px' % (label, len(r), r.mean(), np.sqrt((r * r).mean()), np.percentile(np.abs(r), 90)))
    if 'show' in opts:
        r = residuals(p, feats, (1, 1, 1, 1, 1))
        print('foot', np.round(r[5], 0).astype(int).tolist(), feats[5][::4].astype(int).tolist())
        print('limb', np.round(r[0], 0).astype(int).tolist())
        print('horizon', np.round(r[4], 0).astype(int).tolist())
    if args:
        pf.draw(img, p, args[0])
        Image.open(args[0]).resize((1440, 810), Image.LANCZOS).save(args[0], quality=88)
