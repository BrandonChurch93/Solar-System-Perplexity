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
import os
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
ap.add_argument('--band', type=float, default=0.0, help='with --picture-only: the margins within this many full set px of the picture count as the picture (a trial of MAIL 1071 point 4, 0 in the recipe of the tree)')
ap.add_argument('--files', default='', help='folder with files of the set that take the place of those in public (colour and distance files of the layers, used by trials; without it the files of public/assets/mars/full are read)')
ap.add_argument('--aprons', action='store_true', help='the aprons of the layers too (relief.json apron: the ground drawn on beyond the boxes for the glide of the surface view), as relief.ts builds them')
ap.add_argument('--apron-step', type=float, default=4.0, help='full set px between the points of an apron grid (its distance file has one sample per 4)')
ap.add_argument('--kinds', action='store_true', help='with --frame: instead of the colour, what each pixel of the frame is: the picture (white), a margin (green), an apron (red)')
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


APR = R.get('apron')


def bil(data, x, y):
    """The engine's own read of a distance grid (relief.ts sample): x and y in grid cells, sample centres at half cells, held at the rim."""
    hgt, wid = data.shape[:2]
    px = np.clip(x - 0.5, 0, wid - 1)
    py = np.clip(y - 0.5, 0, hgt - 1)
    ix = np.minimum(np.floor(px), wid - 2).astype(np.int64)
    iy = np.minimum(np.floor(py), hgt - 2).astype(np.int64)
    tx = (px - ix)[..., None] if data.ndim == 3 else px - ix
    ty = (py - iy)[..., None] if data.ndim == 3 else py - iy
    return (data[iy, ix] * (1 - tx) + data[iy, ix + 1] * tx) * (1 - ty) + (data[iy + 1, ix] * (1 - tx) + data[iy + 1, ix + 1] * tx) * ty


class Skirt:
    """The apron of a layer (relief.json apron: the ground drawn on beyond the layer's box to the left, the right and below, for the
    glide of the surface view): its distances, alpha and colour, read as relief.ts reads them. px, py: full set px from the box's corner."""

    def __init__(self, name):
        L = R['layers'][name]
        self.box = L['box']
        e = next((x for x in APR['layers'] if x['layer'] == name), None) if APR else None
        self.left, self.right, self.bottom = e['edges'] if e else (0, 0, 0)
        self.pad = APR['padding'] if APR else 0
        self.has = bool(e)
        if not e:
            return
        base = 'public/assets/mars/%s/' % a.set
        def alt(name):
            other = os.path.join(a.files, name) if a.files else ''
            return other if other and os.path.exists(other) else base + name
        atlas = cv2.imread(alt(e['atlas']), cv2.IMREAD_UNCHANGED)
        ah, aw = atlas.shape[0] // 2, atlas.shape[1] // 2
        self.dist = np.fromfile(alt(e['depth']), np.float32).reshape(ah, aw)
        small = cv2.resize(atlas, (aw, ah), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        self.colour, self.alpha = small[..., :3], small[..., 3]
        # cells of the distance grid per full set px
        self.s = aw / (max(self.box['w'] + self.left + self.right if self.bottom else 0, self.box['h'] + min(self.bottom, self.pad)))

    def where(self, px, py):
        """Grid cell of the apron for a point outside the box (relief.ts distance)."""
        bw, bh = self.box['w'], self.box['h']
        side = self.bottom + self.pad if self.bottom else 0
        start = side + (self.left + self.pad if self.left else 0)
        texel = 2.0
        below = py > bh
        lefts = ~below & (px < 0)
        x = np.where(below, np.clip(px + self.left, texel, bw + self.left + self.right - texel), py)
        y = np.where(below, np.minimum(py - bh + self.pad, side - texel), np.where(lefts, side + np.maximum(px + self.left, texel), start + np.minimum(px - bw + self.pad, self.right + self.pad - texel)))
        return x * self.s, y * self.s

    def within(self, px, py):
        bw, bh = self.box['w'], self.box['h']
        if not self.has:
            return np.zeros(np.broadcast(px, py).shape, bool)
        out = (px < 0) | (px > bw) | (py > bh)
        ok = out & (py >= 0) & (py <= bh + self.bottom) & (px >= -self.left) & (px <= bw + self.right)
        ok &= np.where(py > bh, self.bottom > 0, np.where(px < 0, self.left > 0, self.right > 0))
        return ok


skirts = {}


def skirt(name):
    if name not in skirts:
        skirts[name] = Skirt(name)
    return skirts[name]


def lay(name, X, Y, dist, alpha, colour, step, apron):
    """One grid of a layer onto the plate: X, Y full set px of the picture (1D), dist, alpha, colour on that grid; step: full set px a cell."""
    ix = X / W
    iy = Y / H
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
    # the picture itself ends where the layer's box leaves the image: the margins are painted ground, kept
    c = corners(dist)
    lo = np.minimum.reduce(c)
    hi = np.maximum.reduce(c)
    ok = (hi / lo < a.jump) & (np.minimum.reduce(corners(alpha)) > 0.5) & (np.minimum.reduce(corners(dn)) > 0.2)
    ok &= hi < a.horizon * R['camera']['horizonDistance']
    if a.picture_only:
        inpic = ((X >= -a.band) & (X <= W + a.band))[None, :] & ((Y >= 0) & (Y <= H + a.band))[:, None]
        ok &= np.minimum.reduce(corners(inpic.astype(np.float32))) > 0.5
    # what a nearer layer covers in the picture the eye never saw in this one: its distances there are made up
    for other in R['drawOrder'][R['drawOrder'].index(name) + 1:]:
        if other not in covers:
            O = R['layers'][other]
            oa = cv2.imread(O['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
            covers[other] = (oa, O['box'])
        oa, ob = covers[other]
        mx = ((X - ob['x']) / ob['w'] * oa.shape[1] - 0.5).astype(np.float32)
        my = ((Y - ob['y']) / ob['h'] * oa.shape[0] - 0.5).astype(np.float32)
        over = cv2.remap(oa, np.broadcast_to(mx[None, :], dist.shape).copy(), np.broadcast_to(my[:, None], dist.shape).copy(), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        if apron:
            # a nearer layer's own apron covers it as well
            K = skirt(other)
            qx, qy = np.meshgrid(X - ob['x'], Y - ob['y'])
            inn = K.within(qx, qy)
            if inn.any():
                gx, gy = K.where(qx, qy)
                over = np.where(inn, bil(K.alpha, gx, gy), over)
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
    per = np.degrees(np.maximum(li, lj) * 2 * t / N) / step
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
    return kept, ok.size


for name in R['drawOrder']:
    L = R['layers'][name]
    dw, dh = L['distSize'][a.set]
    def own(path):
        other = os.path.join(a.files, os.path.basename(path)) if a.files else ''
        return other if other and os.path.exists(other) else path
    dist = np.fromfile(own(L['files'][a.set]['dist']), np.float32).reshape(dh, dw)
    b = L['box']
    # the grid of the distance file: its sample centres, as shares of the layer's box
    fx = (np.arange(dw) + 0.5) / dw
    fy = (np.arange(dh) + 0.5) / dh
    alpha = cv2.imread(L['files'][a.set]['alpha'], cv2.IMREAD_GRAYSCALE)
    alpha = cv2.resize(alpha, (dw, dh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    colour = cv2.imread(own(L['files'][a.set]['color']), cv2.IMREAD_COLOR)
    colour = cv2.resize(colour, (dw, dh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    if a.kinds:
        gx_, gy_ = b['x'] + fx * b['w'], b['y'] + fy * b['h']
        inp = ((gx_ >= 0) & (gx_ <= W))[None, :] & ((gy_ >= 0) & (gy_ <= H))[:, None]
        colour = np.where(inp[..., None], np.array([1, 1, 1], np.float32), np.array([0, 1, 0], np.float32)).astype(np.float32)
    kept, cells = lay(name, b['x'] + fx * b['w'], b['y'] + fy * b['h'], dist, alpha, colour, b['w'] / dw, False)
    print('%s: %d of %d cells laid (sheets and cut cells left out), distance %.2f to %.2f eye heights' % (name, kept, cells, dist.min(), dist.max()))
    K = skirt(name) if a.aprons and not a.picture_only else None
    if K is None or not K.has:
        continue
    # the apron: three grids beyond the box (below it over the whole width, left and right of it), each starting on the box's last
    # sample centres so that no gap is left; a point on or inside the box takes the layer's own distance as relief.ts gives it
    g = a.apron_step
    first, last = b['w'] / dw / 2, b['w'] - b['w'] / dw / 2
    low = b['h'] - b['h'] / dh / 2
    grids = []
    if K.bottom:
        grids.append(('below', np.concatenate([np.arange(-K.left, first, g), [first], np.arange(first + g, last, g), [last], np.arange(b['w'] + g, b['w'] + K.right + 1, g)]) if (K.left or K.right) else np.concatenate([[first], np.arange(first + g, last, g), [last]]), np.concatenate([[low, b['h']], np.arange(b['h'] + g, b['h'] + K.bottom + 1, g)])))
    if K.left:
        grids.append(('left', np.concatenate([np.arange(-K.left, 0, g), [0, first]]), np.concatenate([np.arange(b['h'] / dh / 2, low, g), [low]])))
    if K.right:
        grids.append(('right', np.concatenate([[last, b['w']], np.arange(b['w'] + g, b['w'] + K.right + 1, g)]), np.concatenate([np.arange(b['h'] / dh / 2, low, g), [low]])))
    for side, gx, gy in grids:
        qx, qy = np.meshgrid(gx.astype(np.float64), gy.astype(np.float64))
        inn = (qx >= 0) & (qx <= b['w']) & (qy <= b['h'])
        ax, ay = K.where(qx, qy)
        bx, by = qx / b['w'] * dw, qy / b['h'] * dh
        d2 = np.where(inn, bil(dist, bx, by), bil(K.dist, ax, ay)).astype(np.float32)
        a2 = np.where(inn, bil(alpha, bx, by), bil(K.alpha, ax, ay)).astype(np.float32)
        c2 = np.where(inn[..., None], bil(colour, bx, by), bil(K.colour, ax, ay)).astype(np.float32)
        if a.kinds:
            c2 = np.where(inn[..., None], bil(colour, bx, by), np.array([0, 0, 1], np.float32)).astype(np.float32)
        kept, cells = lay(name, b['x'] + gx, b['y'] + gy, d2, a2, c2, g, True)
        print('%s apron %s: %d of %d cells laid, distance %.2f to %.2f eye heights' % (name, side, kept, cells, d2.min(), d2.max()))

if cam:
    seen = np.isfinite(zbuf).reshape(NY, NX)
    img = np.clip(col.reshape(NY, NX, 3), 0, 1)
    if a.kinds:
        img[~seen] = 0
        pic = img.min(-1) > 0.5
        mar = ~pic & (img[..., 1] > 0.5)
        apr = ~pic & (img[..., 2] > 0.5)
        print('frame %d kinds: picture %.4f, margin %.4f, apron %.4f of the frame' % (a.frame, pic.mean(), mar.mean(), apr.mean()))
    else:
        img[~seen] = [0.45, 0.2, 0.1]
    cv2.imwrite(a.out + '.png', np.round(img * 255).astype(np.uint8))
    np.save(a.out + '-depth.npy', np.where(seen, -zbuf.reshape(NY, NX), np.inf).astype(np.float32))
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
