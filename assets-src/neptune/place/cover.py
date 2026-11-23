"""Where the dive looks and how dense the ground must be there.

python3 assets-src/neptune/place/cover.py out/work/nep/s2/poses-dive.json 4700,4712,...
For each frame: the share of the ground in frame that the close canvas never saw (so the plates must carry it), and for
that ground the box (degrees east and north of the eye) and the texels per degree a plate needs to give one texel per
pixel there, in the globe shader's own measure (the larger of the two screen steps) and in the stricter one (the smaller).
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import layback  # noqa: E402
from layback import PLACE, QB, cgeo, flow, gnomon  # noqa: E402


def quat(q):
    return layback.matrix(q)


def ground(pose, w=192, h=108):
    """Deck points seen by a frame: unit normals in the close frame, per pixel of a w by h grid."""
    ty = np.tan(np.radians(pose['vfovDeg']) / 2)
    tx = ty * 16 / 9
    x = ((np.arange(w) + 0.5) / w * 2 - 1) * tx
    y = (1 - (np.arange(h) + 0.5) / h * 2) * ty
    xx, yy = np.meshgrid(x, y)
    d = np.stack([xx, yy, -np.ones_like(xx)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    d = d @ quat(pose['quaternion']).T
    o = np.array(pose['position']) - cgeo.CENTRE
    b = d @ o
    disc = b * b - (o @ o - cgeo.RADIUS ** 2)
    hit = (disc > 0) & (b < 0)
    t = -b - np.sqrt(np.maximum(disc, 0))
    p = o + d * t[..., None]
    return p / cgeo.RADIUS, hit


def texture_dir(n, state):
    """Close frame normal to the direction the globe's texture is read at (the inverse of flow.deck_shown)."""
    b = n @ QB.T
    axis, a = flow.storm_turn(b, state)
    return flow.turn_about(b, axis, a)


def plate_xy(n, state):
    d = texture_dir(n, state)
    lon0, lat0 = gnomon.spot()
    nn, e, u = gnomon.basis(lon0, lat0)
    dn = d @ nn
    return np.degrees(np.arctan((d @ e) / dn)), np.degrees(np.arctan((d @ u) / dn)), (d @ e) / dn, (d @ u) / dn


def state_of(pose):
    s = dict(PLACE['rest'])
    s['stormTurnDeg'] = pose['stormTurnDeg']
    s['streamDeg'] = pose['streamDeg']
    return s


if __name__ == '__main__':
    poses = json.load(open(sys.argv[1]))
    frames = sys.argv[2].split(',')
    edge = float(sys.argv[3]) if len(sys.argv) > 3 else 0.4
    print('frame height unseen%  box east, north (deg) of unseen ground  need p50 p95 max (shader measure) | p95 max (strict) texels per deg')
    for f in frames:
        pose = poses[f]
        n, hit = ground(pose)
        ex, ny, gx, gy = plate_xy(n, state_of(pose))
        tx, ty, seen, _ = layback.tangent(n.astype(np.float32))
        p = cgeo.CENTRE[None, None, :] + cgeo.RADIUS * n
        dist = np.minimum(np.minimum((p[..., 0] + cgeo.LEFT * p[..., 2]) / np.hypot(1, cgeo.LEFT), (-cgeo.RIGHT * p[..., 2] - p[..., 0]) / np.hypot(1, cgeo.RIGHT)), (p[..., 1] + cgeo.BOTTOM * p[..., 2]) / np.hypot(1, cgeo.BOTTOM))
        inside = seen & (dist > edge)
        scale = 1920 / n.shape[1]
        ax = np.hypot(np.gradient(gx, axis=1), np.gradient(gy, axis=1)) / scale
        ay = np.hypot(np.gradient(gx, axis=0), np.gradient(gy, axis=0)) / scale
        big = np.degrees(np.maximum(ax, ay))
        small = np.degrees(np.minimum(ax, ay))
        out = hit & ~inside
        if out.sum() == 0:
            print(f, '%.4f' % pose['height'], '0.0')
            continue
        need = 1 / big[out]
        strict = 1 / small[out]
        print(f, '%.4f' % pose['height'], '%5.1f' % (100 * out.sum() / max(hit.sum(), 1)), ' E %.1f to %.1f, N %.1f to %.1f ' % (ex[out].min(), ex[out].max(), ny[out].min(), ny[out].max()), ' %.0f %.0f %.0f | %.0f %.0f' % (np.percentile(need, 50), np.percentile(need, 95), need.max(), np.percentile(strict, 95), strict.max()))
        for lim in (256, 410, 683, 1170):
            m = out & (1 / big > lim)
            if m.sum():
                print('      over %4d: %4.1f%% of frame, E %.2f to %.2f, N %.2f to %.2f' % (lim, 100 * m.mean(), ex[m].min(), ex[m].max(), ny[m].min(), ny[m].max()))
