"""The camera of the skim that lays the true world over the approved close image.

Features are read from the approved close at 1920 x 1080: the lit limb of the globe, the edge of night on it and
the two edges of the black core of the dark gap. A pose of the true world (azimuth from the Sun's side, foot
radius, height, yaw of the globe to the right of the view axis, tilt down, roll, field of view, as in skim.json)
is scored by how far, in pixels, each feature lies from where the true world draws it: the ray of a limb point
should graze the globe, the ray of a point on the edge of night should hit the globe where the Sun stands on the
horizon, the ray of a gap edge point should hit the plane at the radius of that edge. Nothing here is shipped.

  python3 pose_fit.py [OUT.jpg] [free=az,foot,height,yaw,tilt,roll,vfov] [w=limb,night,gap]
"""
import json
import os
import sys

import numpy as np
import scipy.ndimage as nd
from PIL import Image, ImageDraw
from scipy.optimize import least_squares

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom

W, H = 1920, 1080
MODEL = json.load(open(os.path.join(geom.STOP, 'ringfield.json')))
SKIM = json.load(open(os.path.join(geom.STOP, 'skim.json')))
GAP = (1.969, 2.047)
SUN_UP = float(geom.SUN_L[1])
NAMES = ['az', 'foot', 'height', 'yaw', 'tilt', 'roll', 'vfov']


def features():
    img = Image.open(geom.CLOSE).convert('RGB').resize((W, H), Image.LANCZOS)
    a = np.asarray(img).astype(float) / 255
    lum = nd.gaussian_filter(a @ np.array([0.2126, 0.7152, 0.0722]), 1.5)
    c0, r0 = np.array([1519.0, 668.0]), 634.0
    limb, night = [], []
    for deg in np.arange(100, 182, 3.0):
        t = np.radians(deg)
        rr = np.arange(r0 - 90, r0 + 90, 0.5)
        pts = c0[None, :] + rr[:, None] * np.array([np.cos(t), -np.sin(t)])[None, :]
        ok = (pts[:, 0] > 2) & (pts[:, 0] < W - 3) & (pts[:, 1] > 2) & (pts[:, 1] < H - 3)
        if ok.sum() < 100:
            continue
        v = nd.map_coordinates(lum, [pts[ok, 1], pts[ok, 0]], order=1)
        i = int(np.argmin(np.gradient(v)))
        if v[:i].max() - v[i:].min() > 0.3:
            limb.append(pts[ok][i])
    for y in range(110, 585, 25):
        xs = np.arange(900, 1900)
        lit = lum[y, xs] > 0.55
        if lit.sum() < 50:
            continue
        x1 = xs[lit][-1]
        seg = lum[y, x1 - 10:x1 + 260]
        k = int(np.argmax(seg < (seg[:30].mean() + seg.min()) / 2))
        night.append([x1 - 10 + k, y])
    yy, xx = np.mgrid[0:H, 0:W]
    core = (lum < 0.115) & (yy > 400) & (xx < 550 + (yy - 380) * 1.3)
    lab, n = nd.label(core)
    big = 1 + int(np.argmax(nd.sum(core, lab, range(1, n + 1))))
    m = nd.binary_closing(lab == big, iterations=3)
    edge = m & ~nd.binary_erosion(m)
    # the side of the core a boundary point lies on: the bright dense ring is on the inner side
    gy, gx = np.gradient(nd.gaussian_filter(m.astype(float), 6))
    ys, xs = np.nonzero(edge)
    keep = (xs > 6) & (xs < W - 7) & (ys > 6) & (ys < H - 7)
    ys, xs = ys[keep][::9], xs[keep][::9]
    inner, outer = [], []
    for x, y in zip(xs, ys):
        nx, ny = -gx[y, x], -gy[y, x]
        k = np.hypot(nx, ny)
        if k < 1e-6:
            continue
        out_lum = lum[int(np.clip(y + 14 * ny / k, 0, H - 1)), int(np.clip(x + 14 * nx / k, 0, W - 1))]
        (inner if out_lum > 0.5 else outer).append([x, y, out_lum])
    return img, np.array(limb), np.array(night, float), np.array(inner, float), np.array(outer, float)


def camera(p):
    az, foot, height, yaw, tilt, roll, vfov = p
    r = np.radians
    n = np.array([0.0, 1.0, 0.0])
    flat = np.array([1.0, 0.0, 0.0])
    sun = np.cos(np.arcsin(SUN_UP)) * flat + SUN_UP * n
    c, s = np.cos(r(az)), np.sin(r(az))
    o = np.cross(n, flat)
    out = o * c + np.cross(n, o) * s
    nc = np.array([-np.sin(r(roll)) * np.cos(r(tilt)), np.cos(r(roll)) * np.cos(r(tilt)), np.sin(r(tilt))])
    fp = np.array([0.0, 0.0, -1.0]) + nc * nc[2]
    fp /= np.linalg.norm(fp)
    left = np.cross(nc, fp)
    to_globe = fp * np.cos(r(yaw)) - left * np.sin(r(yaw))
    cam = np.stack([nc, to_globe, np.cross(nc, to_globe)], 1)
    world = np.stack([n, -out, np.cross(n, -out)], 1)
    rot = world @ cam.T
    return out * foot + n * height, rot, sun, 0.5 * H / np.tan(r(vfov) / 2)


def rays(pts, rot, f):
    d = np.stack([(pts[:, 0] - W / 2) / f, -(pts[:, 1] - H / 2) / f, -np.ones(len(pts))], 1)
    d /= np.linalg.norm(d, axis=1)[:, None]
    return d @ rot.T


def residuals(p, feats, weights=(1, 1, 1)):
    _, limb, night, inner, outer = feats
    pos, rot, sun, f = camera(p)
    sq = np.array([1.0, 1.0 / geom.POLAR, 1.0])
    out = []
    # limb: the ray passes the centre of the scaled globe at distance 1
    d = rays(limb, rot, f) * sq
    d /= np.linalg.norm(d, axis=1)[:, None]
    ps = pos * sq
    b = d @ ps
    miss = np.sqrt(np.maximum(ps @ ps - b * b, 0))
    out.append(weights[0] * (miss - 1) * f / np.sqrt(max(ps @ ps - 1, 1e-6)))
    # edge of night: where the ray meets the globe the Sun stands on the horizon
    d = rays(night[:, :2], rot, f) * sq
    d /= np.linalg.norm(d, axis=1)[:, None]
    b = d @ ps
    disc = b * b - (ps @ ps - 1)
    t = -b - np.sqrt(np.maximum(disc, 0))
    hit = ps[None, :] + d * t[:, None]
    nrm = hit * sq
    nrm /= np.linalg.norm(nrm, axis=1)[:, None]
    cosine = nrm @ sun
    px = np.where(disc > 0, cosine * f / np.sqrt(max(ps @ ps - 1, 1e-6)), 60.0 + np.sqrt(np.maximum(-disc, 0)) * f)
    out.append(weights[1] * px)
    # gap edges: the ray meets the plane at the radius of the edge; the step in radius of one pixel by numbers
    for pts, radius in ((inner, GAP[0]), (outer, GAP[1])):
        def radius_at(q):
            d = rays(q, rot, f)
            k = -pos[1] / np.where(d[:, 1] < -1e-6, d[:, 1], -1e-6)
            hit = pos[None, :] + d * k[:, None]
            return np.hypot(hit[:, 0], hit[:, 2])
        r0 = radius_at(pts[:, :2])
        gx = radius_at(pts[:, :2] + np.array([1.0, 0])) - r0
        gy = radius_at(pts[:, :2] + np.array([0, 1.0])) - r0
        out.append(weights[2] * np.clip((r0 - radius) / np.maximum(np.hypot(gx, gy), 1e-6), -400, 400))
    return out


def draw(img, p, path):
    pos, rot, sun, f = camera(p)
    d = ImageDraw.Draw(img)
    sq = np.array([1.0, 1.0 / geom.POLAR, 1.0])
    yy, xx = np.mgrid[0:H:2, 0:W:2]
    pts = np.stack([xx.ravel(), yy.ravel()], 1).astype(float)
    dr = rays(pts, rot, f)
    k = -pos[1] / np.where(dr[:, 1] < -1e-6, dr[:, 1], -1e-6)
    hit = pos[None, :] + dr * k[:, None]
    rad = np.where(dr[:, 1] < -1e-6, np.hypot(hit[:, 0], hit[:, 2]), 99).reshape(yy.shape)
    ds = dr * sq
    ds /= np.linalg.norm(ds, axis=1)[:, None]
    ps = pos * sq
    b = ds @ ps
    disc = b * b - (ps @ ps - 1)
    t = -b - np.sqrt(np.maximum(disc, 0))
    nrm = (ps[None, :] + ds * t[:, None]) * sq
    nrm /= np.linalg.norm(nrm, axis=1)[:, None]
    cosine = np.where(disc > 0, nrm @ sun, 9).reshape(yy.shape)
    globe = (disc > 0).reshape(yy.shape)
    def contour(field, level, colour):
        m = field > level
        e = m ^ nd.binary_erosion(m)
        for y, x in zip(*np.nonzero(e)):
            d.point((x * 2, y * 2), fill=colour)
    contour(globe.astype(float), 0.5, (0, 255, 0))
    contour(np.where(globe, cosine, 9), 0.0, (255, 60, 60))
    for radius, colour in ((GAP[0], (255, 0, 255)), (GAP[1], (0, 255, 255)), (MODEL['outer'], (255, 255, 0)), (1.526, (255, 160, 0))):
        contour(np.where(globe & (t.reshape(yy.shape) < np.where(dr[:, 1] < -1e-6, k, 1e9).reshape(yy.shape)), 0, rad), radius, colour)
    img.save(path, quality=90)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if '=' not in a]
    opts = dict(a.split('=') for a in sys.argv[1:] if '=' in a)
    feats = features()
    pose = SKIM['pose']
    p0 = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
    for name in NAMES:
        if name in opts:
            p0[NAMES.index(name)] = float(opts.pop(name))
    free = [NAMES.index(n) for n in opts.get('free', 'az,foot,height,yaw,tilt,roll').split(',') if n]
    weights = tuple(float(x) for x in opts.get('w', '1,1,1').split(','))
    def cost(x):
        p = p0.copy()
        p[free] = x
        return np.concatenate(residuals(p, feats, weights))
    p = p0.copy()
    if free:
        fit = least_squares(cost, p0[free], loss='soft_l1', f_scale=20.0, x_scale=np.array([5, 0.2, 0.05, 5, 3, 3, 5.0])[free])
        p[free] = fit.x
    print('pose', {n: round(float(v), 4) for n, v in zip(NAMES, p)})
    for label, r in zip(('limb', 'edge of night', 'gap inner edge', 'gap outer edge'), residuals(p, feats)):
        print('%-15s n %3d  mean %7.1f px  rms %6.1f px  p90 %6.1f px' % (label, len(r), r.mean(), np.sqrt((r * r).mean()), np.percentile(np.abs(r), 90)))
    if args:
        draw(feats[0], p, args[0])
