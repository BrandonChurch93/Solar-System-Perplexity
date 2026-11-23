"""The close view of Mars seen from straight above: its own meshes rasterised onto a top down gnomonic plate.

The close view (src/terrain/relief.ts over src/stops/mars/relief.json) is the approved picture on three meshes of
its own distances from the picture's eye. A mesh point is ray(pixel) * distance in the frame of that eye; the frame
of the close view on the globe (geometry.json, dive.terrain: scale, rotation, origin) puts it into the body frame.
Every cell of the distance grids is laid onto the plate, split finely enough to leave no gap, and the highest point
wins (a view from above). Cells across a jump of distance (a ridge against the ground behind it) are sheets the
picture's eye never saw as ground: they are left out and stay holes.

  python3 assets-src/mars/place/heights.py --width-deg 0.7 --size 2048 --out out/work/place/height/h0.7
Written: OUT-height.npy (radii over the unit sphere, nan where the eye saw nothing), OUT-colour.png (the picture's
colour from above), OUT-reach.npy (ground one cell covers along its longest side, degrees per picture pixel of the
full set), OUT-look.jpg (heights as grey, shaded from the Sun's side, with the holes in blue).
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--set', default='full')
ap.add_argument('--relief', default='src/stops/mars/relief.json')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--jump', type=float, default=1.06, help='a cell whose corners differ in distance by more than this ratio is a sheet')
ap.add_argument('--most', type=int, default=512, help='the most a cell is split along one side')
ap.add_argument('--frame', type=int, default=-1, help='instead of the plate: the meshes seen by the film camera of this dive or rise frame (geometry.json), 1920 by 1080; nearest wins')
ap.add_argument('--horizon', type=float, default=0.93, help='cells farther than this share of the horizon distance are haze on the sky, left out')
ap.add_argument('--picture-only', action='store_true', help='leave out the margins round the picture (painted on, drawn out from its border): only ground the approved picture itself shows')
ap.add_argument('--out', required=True)
a = ap.parse_args()

R = json.load(open(a.relief))
GEO = geom.load(a.geometry)
G = GEO['dive']['terrain']
cam = None
if a.frame >= 0:
    pose = next(f for k in ('dive', 'rise') for f in GEO[k]['frames'] if f['frame'] == a.frame)
    cam = geom.Camera(pose, GEO['format']['width'], GEO['format']['height'])
rot = geom.quat_matrix(G['rotation'])
origin = np.array(G['origin'])
scale = G['scale']
W, H = R['imageSize']['full']
th = np.tan(np.radians(R['camera']['vfovDeg']) / 2)
aspect = W / H
N = a.size
NX, NY = (cam.w, cam.h) if cam else (N, N)
t = geom.half_tan(a.width_deg)

zbuf = np.full(NX * NY, -np.inf, np.float32)
reach = np.full(NX * NY, np.inf, np.float32)
col = np.zeros((NX * NY, 3), np.float32)
covers = {}


def corners(v):
    return v[:-1, :-1], v[:-1, 1:], v[1:, :-1], v[1:, 1:]


for name in R['drawOrder']:
    L = R['layers'][name]
    dw, dh = L['distSize'][a.set]
    dist = np.fromfile(L['files'][a.set]['dist'], np.float32).reshape(dh, dw)
    b = L['box']
    # the grid of the distance file: its sample centres, as shares of the layer's box
    fx = (np.arange(dw) + 0.5) / dw
    fy = (np.arange(dh) + 0.5) / dh
    ix = (b['x'] + fx * b['w']) / W
    iy = (b['y'] + fy * b['h']) / H
    d = np.stack(np.broadcast_arrays(((2 * ix - 1) * th * aspect)[None, :], ((1 - 2 * iy) * th)[:, None], -1.0), axis=-1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    p = (d * dist[..., None] * scale) @ rot.T + origin
    r = np.linalg.norm(p, axis=-1)
    e, n, dn = geom.to_patch(p / r[..., None])
    if cam:
        u, v, front = cam.project(p)
        u = u.astype(np.float32)
        v = v.astype(np.float32)
        h = (-np.linalg.norm(p - cam.p, axis=-1)).astype(np.float32)
        dn = np.where(front, dn, 0)
    else:
        u = ((e / t + 1) / 2 * N).astype(np.float32)
        v = ((1 - n / t) / 2 * N).astype(np.float32)
        h = (r - 1).astype(np.float32)
    alpha = cv2.imread(L['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE)
    alpha = cv2.resize(alpha, (dw, dh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    colour = cv2.imread(L['files'][a.set]['color'], cv2.IMREAD_COLOR)
    colour = cv2.resize(colour, (dw, dh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    # the picture itself ends where the layer's box leaves the image: the margins are painted ground, kept
    c = corners(dist)
    lo = np.minimum.reduce(c)
    hi = np.maximum.reduce(c)
    ok = (hi / lo < a.jump) & (np.minimum.reduce(corners(alpha)) > 0.5) & (np.minimum.reduce(corners(dn)) > 0.2)
    ok &= hi < a.horizon * R['camera']['horizonDistance']
    if a.picture_only:
        px = b['x'] + fx * b['w']
        py = b['y'] + fy * b['h']
        inpic = ((px >= 0) & (px <= W))[None, :] & ((py >= 0) & (py <= H))[:, None]
        ok &= np.minimum.reduce(corners(inpic.astype(np.float32))) > 0.5
    # what a nearer layer covers in the picture the eye never saw in this one: its distances there are made up
    for other in R['drawOrder'][R['drawOrder'].index(name) + 1:]:
        if other not in covers:
            O = R['layers'][other]
            oa = cv2.imread(O['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
            covers[other] = (oa, O['box'])
        oa, ob = covers[other]
        mx = ((b['x'] + fx * b['w'] - ob['x']) / ob['w'] * oa.shape[1] - 0.5).astype(np.float32)
        my = ((b['y'] + fy * b['h'] - ob['y']) / ob['h'] * oa.shape[0] - 0.5).astype(np.float32)
        over = cv2.remap(oa, np.broadcast_to(mx[None, :], (dh, dw)).copy(), np.broadcast_to(my[:, None], (dh, dw)).copy(), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        ok &= np.maximum.reduce(corners(over)) < 0.5
    cu = corners(u)
    cv = corners(v)
    inside = (np.maximum.reduce(cu) > 0) & (np.minimum.reduce(cu) < NX) & (np.maximum.reduce(cv) > 0) & (np.minimum.reduce(cv) < NY)
    ok &= inside
    # the sides of the cell on the plate, in texels: along the row (i) and down the column (j)
    li = np.maximum(np.hypot(cu[1] - cu[0], cv[1] - cv[0]), np.hypot(cu[3] - cu[2], cv[3] - cv[2]))
    lj = np.maximum(np.hypot(cu[2] - cu[0], cv[2] - cv[0]), np.hypot(cu[3] - cu[1], cv[3] - cv[1]))
    si = np.clip(2 ** np.ceil(np.log2(np.maximum(li * 1.5, 1))), 1, a.most).astype(np.int32)
    sj = np.clip(2 ** np.ceil(np.log2(np.maximum(lj * 1.5, 1))), 1, a.most).astype(np.int32)
    # ground along the longest side of the cell per picture pixel of the full set (degrees)
    per = np.degrees(np.maximum(li, lj) * 2 * t / N) / (b['w'] / dw)
    ch = corners(h)
    cc = corners(colour)
    kept = 0
    for a_ in np.unique(si[ok]):
        for b_ in np.unique(sj[ok & (si == a_)]):
            sel = np.nonzero(ok & (si == a_) & (sj == b_))
            if not len(sel[0]):
                continue
            kept += len(sel[0])
            q = [[x[sel] for x in cu], [x[sel] for x in cv], [x[sel] for x in ch]]
            qc = [x[sel] for x in cc]
            pr = per[sel]
            for m in range(int(a_)):
                wx = (m + 0.5) / a_
                for k in range(int(b_)):
                    wy = (k + 0.5) / b_
                    w = [(1 - wx) * (1 - wy), wx * (1 - wy), (1 - wx) * wy, wx * wy]
                    uu = sum(w[c_] * q[0][c_] for c_ in range(4))
                    vv = sum(w[c_] * q[1][c_] for c_ in range(4))
                    hh = sum(w[c_] * q[2][c_] for c_ in range(4))
                    xi = np.floor(uu).astype(np.int64)
                    yi = np.floor(vv).astype(np.int64)
                    good = (xi >= 0) & (xi < NX) & (yi >= 0) & (yi < NY)
                    idx = yi[good] * NX + xi[good]
                    hg = hh[good]
                    top = hg > zbuf[idx]
                    # the highest point of this pass per texel
                    order = np.argsort(hg[top])
                    idx = idx[top][order]
                    zbuf[idx] = hg[top][order]
                    reach[idx] = pr[good][top][order]
                    col[idx] = sum(w[c_] * qc[c_][good][top][order] for c_ in range(4))
    print('%s: %d of %d cells laid (sheets and cut cells left out), distance %.2f to %.2f eye heights' % (name, kept, ok.size, dist.min(), dist.max()))

if cam:
    seen = np.isfinite(zbuf).reshape(NY, NX)
    img = np.clip(col.reshape(NY, NX, 3), 0, 1)
    img[~seen] = [0.45, 0.2, 0.1]
    cv2.imwrite(a.out + '.png', np.round(img * 255).astype(np.uint8))
    print('frame %d: the meshes cover %.4f of the frame' % (a.frame, seen.mean()))
    raise SystemExit(0)
seen = np.isfinite(zbuf).reshape(N, N)
height = np.where(seen, zbuf.reshape(N, N), np.nan).astype(np.float32)
np.save(a.out + '-height.npy', height)
np.save(a.out + '-reach.npy', reach.reshape(N, N))
cv2.imwrite(a.out + '-colour.png', np.round(np.clip(col.reshape(N, N, 3), 0, 1) * 255).astype(np.uint8))
hs = height[seen]
print('%g deg %d px: seen from above %.4f of the plate; height %.5f to %.5f radii (%.2f to %.2f km), median %.5f' % (a.width_deg, N, seen.mean(), hs.min(), hs.max(), hs.min() * 3389.5, hs.max() * 3389.5, np.median(hs)))
lo, hi = np.percentile(hs, [1, 99])
grey = np.clip((np.nan_to_num(height, nan=lo) - lo) / max(hi - lo, 1e-9), 0, 1)
look = np.dstack([grey, grey, grey])
look[~seen] = [0.45, 0.2, 0.1]
cv2.imwrite(a.out + '-look.jpg', np.round(look * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
