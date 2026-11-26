"""pose_fit3.py: the pose of the close view against the approved close image, weighing what was named first:
the contact line (where the lit globe ends over the ring) and the ring's place across the globe (the inner edge
of the B ring's bright lanes, the two edges of the dark gap), then the lit limb, the far horizon last. The
contact line and the B ring's edge are read by hand (close_lines.json), the rest as pose_fit2.py finds it.
Usage, from the repo's root: python3 assets-src/saturn/code/pose_fit3.py [OUT.jpg] [free=az,foot,...]
[w=contact,bInner,limb,night,gap,horizon] [lo.NAME=value] [hi.NAME=value] [NAME=value]. The ring stays rigid
and flat: the seven numbers of the pose are all that moves. It prints the pose and what is left of each
feature in pixels of 1920; it writes nothing into the film."""
import os, sys, json
import numpy as np
from PIL import Image
from scipy.optimize import least_squares
CODE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CODE)
argv = sys.argv[:]
sys.argv = ['x']
import pose_fit as pf
import pose_fit2 as p2
import geom
W, H = pf.W, pf.H
LINES = json.load(open(os.path.join(CODE, 'close_lines.json')))
LABELS = ('contact', 'B inner edge', 'limb', 'edge of night', 'gap inner edge', 'gap outer edge', 'horizon')


def radius_px(q, pos, rot, f, radius):
    """Signed distance in pixels of the points q from the circle of that radius in the ring plane, to first
    order (good near the circle: the far horizon)."""
    def radius_at(q):
        d = pf.rays(q, rot, f)
        k = -pos[1] / np.where(d[:, 1] < -1e-6, d[:, 1], -1e-6)
        hit = pos[None, :] + d * k[:, None]
        return np.where(d[:, 1] < -1e-6, np.hypot(hit[:, 0], hit[:, 2]), 50.0)
    r0 = radius_at(q)
    gy = radius_at(q + np.array([0, 1.0])) - r0
    gx = radius_at(q + np.array([1.0, 0])) - r0
    return np.clip((r0 - radius) / np.maximum(np.hypot(gx, gy), 1e-6), -400, 400)


TURN = np.radians(np.arange(0, 360.0001, 0.05))


def arc_rows(q, pos, rot, f, radius, far=False):
    """Rows by which the nearer arc (far: the farther arc) of that circle of the ring plane lies under the
    points q, each in its own column (plus: the model's line lies lower in the picture). Exact, not to first
    order. Where the arc does not reach a point's column, the rows to the arc's nearest end plus the columns
    it falls short, so that the measure has no cliff."""
    P = np.stack([radius * np.cos(TURN), 0 * TURN, radius * np.sin(TURN)], 1)
    c = (P - pos[None, :]) @ rot
    z = -c[:, 2]
    ok = z > 1e-4
    zz = np.where(ok, z, 1.0)
    px = W / 2 + f * c[:, 0] / zz
    py = H / 2 - f * c[:, 1] / zz
    dist = np.linalg.norm(P - pos[None, :], axis=1)
    key = -dist if far else dist
    out = np.full(len(q), 400.0)
    both = ok[:-1] & ok[1:]
    for n, (x, y) in enumerate(q):
        s = (px[:-1] - x) * (px[1:] - x)
        i = np.nonzero(both & (s <= 0))[0]
        if len(i) == 0:
            j = np.nonzero(ok)[0]
            if len(j):
                k = j[np.argmin(np.abs(px[j] - x))]
                out[n] = np.clip((py[k] - y) + abs(px[k] - x), -400, 400)
            continue
        den = px[i + 1] - px[i]
        t = np.where(np.abs(den) > 1e-12, (x - px[i]) / np.where(np.abs(den) > 1e-12, den, 1.0), 0.0)
        yy = py[i] + t * (py[i + 1] - py[i])
        kk = key[i] + t * (key[i + 1] - key[i])
        out[n] = np.clip(yy[np.argmin(kk)] - y, -400, 400)
    return out


def residuals(p, feats, w):
    limb, night, inner, outer, hor, lit, bin_ = feats
    base = pf.residuals(p, (None, limb, night, inner, outer), (w[2], w[3], w[4]))
    pos, rot, sun, f = pf.camera(p)
    out = [w[0] * arc_rows(lit, pos, rot, f, LINES['contactRadius']), w[1] * arc_rows(bin_, pos, rot, f, LINES['bInnerRadius'])]
    out += list(base)
    out.append(w[5] * arc_rows(hor, pos, rot, f, p2.OUTER, far=True))
    return out


if __name__ == '__main__':
    args = [a for a in argv[1:] if '=' not in a]
    opts = dict(a.split('=') for a in argv[1:] if '=' in a)
    # contact=R and bInner=R try another radius of the ring model for the two hand read lines
    if 'contact' in opts:
        LINES['contactRadius'] = float(opts.pop('contact'))
    if 'bInner' in opts:
        LINES['bInnerRadius'] = float(opts.pop('bInner'))
    img, lum = p2.lum_of(geom.CLOSE)
    f0 = pf.features()
    feats = (p2.limb_points(lum), f0[2], f0[3], f0[4], p2.horizon_points(lum), np.array(LINES['litEnd'], float), np.array(LINES['bInner'], float))
    pose = pf.SKIM['pose']
    p0 = np.array([pose['azimuthDeg'], pose['foot'], pose['height'], pose['yawDeg'], pose['tiltDeg'], pose['rollDeg'], pose['vfov']], float)
    lo = np.array([-60, 1.3, 0.02, -60, -30, -40, 20.0])
    hi = np.array([60, 4.0, 1.0, 60, 40, 40, 75.0])
    for n in pf.NAMES:
        i = pf.NAMES.index(n)
        if n in opts:
            p0[i] = float(opts.pop(n))
        if 'lo.' + n in opts:
            lo[i] = float(opts.pop('lo.' + n))
        if 'hi.' + n in opts:
            hi[i] = float(opts.pop('hi.' + n))
    free = [pf.NAMES.index(n) for n in opts.get('free', 'az,foot,height,yaw,tilt,roll,vfov').split(',') if n]
    w = tuple(float(x) for x in opts.get('w', '2,1,1,0.3,0.5,0.25').split(','))
    def cost(x):
        p = p0.copy(); p[free] = x
        return np.concatenate(residuals(p, feats, w))
    p = p0.copy()
    if free:
        x0 = np.clip(p0[free], lo[free] + 1e-6, hi[free] - 1e-6)
        fit = least_squares(cost, x0, bounds=(lo[free], hi[free]), loss='soft_l1', f_scale=20.0, x_scale=np.array([5, 0.2, 0.05, 5, 3, 3, 5.0])[free])
        p[free] = fit.x
    pos, rot, sun, f = pf.camera(p)
    d = float(np.linalg.norm(pos))
    print('pose', {n: round(float(v), 4) for n, v in zip(pf.NAMES, p)})
    print('eye: distance %.4f radii, %.2f degrees over the plane from the centre, focal length %.0f px' % (d, np.degrees(np.arcsin(pos[1] / d)), f))
    for label, r in zip(LABELS, residuals(p, feats, (1, 1, 1, 1, 1, 1))):
        print('%-15s n %3d  mean %7.1f px  rms %6.1f px  worst %6.1f px' % (label, len(r), r.mean(), np.sqrt((r * r).mean()), np.abs(r).max()))
    if args:
        pf.draw(img, p, args[0])
        Image.open(args[0]).resize((1440, 810), Image.LANCZOS).save(args[0], quality=88)
