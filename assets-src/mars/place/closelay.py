"""The close ground of Mars laid onto the made ground of the place (the land- plates), through the film's own eye.

In the frames where the globe side goes from its own plates to the close view's meshes (close.json: presence), both
grounds are drawn by one camera. A source is such a frame three times: R, the close ground alone; H, the globe's own
ground alone; S, the plates drawn through the same camera without light and air (seecountry.py, with its -depth.npy).
Every texel of a plate is the ground at its true height (country.json); it is projected into the camera of each source
and, where that eye sees it, it takes the value S * R / H: what the plate must hold so that the globe draws there what
the close ground shows. Sources are laid in the order given, the last one on top (give the lowest eye last).

  PYTHONPATH=assets-src/mars/place python3 closelay.py --src 2466 --src 2470 --dir IN --out OUT [--frames FOLDER]
FOLDER holds R<frame>.png, H<frame>.png, s<frame>.png and s<frame>-depth.npy.
"""
import argparse
import json
import os
import cv2
import numpy as np
import geom
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser()
ap.add_argument('--src', action='append', type=int, required=True)
ap.add_argument('--frames', default='out/work/place/cl')
ap.add_argument('--dir', default='public/assets/mars/full')
ap.add_argument('--out', required=True)
ap.add_argument('--set', default='full')
ap.add_argument('--levels', default='src/stops/mars/levels.json')
ap.add_argument('--country', default='src/stops/mars/country.json')
ap.add_argument('--geometry', default='out/work/place/geometry-film.json')
ap.add_argument('--only', default='', help='comma list of widths')
ap.add_argument('--most', type=float, default=4.0, help='the most the ratio R / H may be, and 1 over it the least')
ap.add_argument('--soft', type=float, default=1.5, help='blur (frame px at 1920) of S and H before their ratio is taken')
ap.add_argument('--feather', type=float, default=48.0, help='frame px at 1920 over which a source leaves at its frame border')
ap.add_argument('--tol', type=float, default=0.004)
ap.add_argument('--tone', type=float, default=0.0, help='degrees: where no eye sees the ground, the first ground follows the broad tone of the new about it, measured over this far')
ap.add_argument('--first', default='', help='folder of the plates before any lay (for --tone); default --dir')
ap.add_argument('--s', default='', help='folder of s<frame>.png and its depth, default --frames')
ap.add_argument('--h', default='', help='folder of H<frame>.png, default --frames')
ap.add_argument('--r', default='', help='folder of R<frame>.png, default --frames')
ap.add_argument('--prev-s', default='', help='folder of s<frame>.png of the state before this one: with --prev-h the plate value is found by the secant through both states (the air adds light, so a ratio alone falls short)')
ap.add_argument('--prev-h', default='')
ap.add_argument('--secant', type=float, default=1.5, help='the most the secant may move the value the ratio gives')
ap.add_argument('--stretch', default='6,12', help='texels of the level one frame pixel covers along its longest side: the lay leaves between these two')
ap.add_argument('--gain', default='0.6,1.8', help='least and most of the broad tone gain of --tone')
ap.add_argument('--fan', default='', help='X0,X1,YB: the close ground ends at these lines of the close picture (full set px; relief.json box and apron edges); the lay leaves toward them')
ap.add_argument('--band', type=float, default=400.0, help='picture px over which the lay leaves toward the fan border')
ap.add_argument('--meander', type=float, default=300.0, help='picture px by which the border of the lay wanders (a fixed field on the ground)')
ap.add_argument('--relief', default='src/stops/mars/relief.json')
ap.add_argument('--veil', default='', help='T0,T1: the lay of a source leaves where the far veil of near.json (grazing) lets through less than T1 of the ground, and is gone under T0: there the band sees the veil and not the ground, and the ground stays the first ground')
ap.add_argument('--near', default='src/stops/mars/near.json')
ap.add_argument('--edge', type=float, default=0.0, help='frame px at 1920: a source leaves within this far of a jump of its depth (the rim of a nearer piece of ground: there a frame pixel is two grounds mixed, and laid on the farther one it stands as a line beside the rim for every other eye)')
ap.add_argument('--jump', type=float, default=1.04, help='ratio of the depths of two grounds that counts as a jump')
ap.add_argument('--rest', default='dir', help='dir or first: what the ground no source is laid on starts from')
a = ap.parse_args()

GEO = json.load(open(a.geometry))
C = json.load(open(a.country))
n, east, north = geom.patch_frame()
base = 'public/assets/mars/%s/' % a.set
hs = []
for L in C['levels']:
    N = L['size'][a.set]
    v = np.fromfile(base + L['height'], '<u2').reshape(N, N).astype(np.float32)
    hs.append((L['widthDeg'], L['low'] + v / 65535 * (L['high'] - L['low'])))
edge = C['edgeShare']


def height_at(x, y):
    out = None
    for width, arr in hs:
        t = geom.half_tan(width)
        N = arr.shape[0]
        mx = ((x / t + 1) / 2 * N - 0.5).astype(np.float32)
        my = ((1 - y / t) / 2 * N - 0.5).astype(np.float32)
        val = cv2.remap(arr, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        m = np.maximum(np.abs(x), np.abs(y)) / t
        w = np.clip((1 - m) / (2 * edge), 0, 1).astype(np.float32)
        out = val if out is None else out * (1 - w) + val * w
    m = np.maximum(np.abs(x), np.abs(y)) / geom.half_tan(hs[0][0])
    return np.where(m < 1, out, 0).astype(np.float32)


def scene_frame(path):
    img = cv2.imread(path)
    if img is None:
        raise SystemExit('no ' + path)
    return geom.inverse_filmic(geom.to_linear(img[..., ::-1].astype(np.float32) / 255))


sources = []
for f in a.src:
    pose = next(p for k in ('dive', 'rise') for p in GEO[k]['frames'] if p['frame'] == f)
    R = scene_frame('%s/R%d.png' % (a.r or a.frames, f))
    H = scene_frame('%s/H%d.png' % (a.h or a.frames, f))
    S = scene_frame('%s/s%d.png' % (a.s or a.frames, f))
    D = np.load('%s/s%d-depth.npy' % (a.s or a.frames, f))
    h, w = D.shape
    if R.shape[:2] != (h, w):
        R = cv2.resize(R, (w, h), interpolation=cv2.INTER_AREA)
        H = cv2.resize(H, (w, h), interpolation=cv2.INTER_AREA)
    k = a.soft * w / 1920
    eps = 0.003
    soft = (lambda x: cv2.GaussianBlur(x, (0, 0), k)) if k > 0 else (lambda x: x)
    Rb, Hb, Sb = soft(R), soft(H), soft(S)
    gain = np.clip((Rb + eps) / (Hb + eps), 1 / a.most, a.most)
    V = (R + eps) / (Rb + eps) * gain * Sb
    if a.prev_s and a.prev_h:
        S0 = soft(scene_frame('%s/s%d.png' % (a.prev_s, f)))
        H0 = scene_frame('%s/H%d.png' % (a.prev_h, f))
        if H0.shape[:2] != (h, w):
            H0 = cv2.resize(H0, (w, h), interpolation=cv2.INTER_AREA)
        H0 = soft(H0)
        dS, dH = Sb - S0, Hb - H0
        ok = (np.abs(dS) > 0.02 * (Sb + S0) + 0.004) & (dH * dS > 0)
        slope = np.where(ok, dH / np.where(ok, dS, 1), 0)
        ok &= (slope > 0.02) & (slope < 50)
        okf = ok.astype(np.float32)
        den = cv2.GaussianBlur(okf, (0, 0), 4 * w / 1920)
        slope = cv2.GaussianBlur(np.where(ok, np.log(np.maximum(slope, 1e-6)), 0).astype(np.float32), (0, 0), 4 * w / 1920) / np.maximum(den, 1e-3)
        slope = np.exp(slope)
        known = den > 0.2
        air = np.clip(Hb - slope * Sb, 0, None)
        Vs = Sb + (R - Hb) / np.maximum(slope, 1e-3)
        Vr = gain * Sb
        Vs = np.clip(Vs, Vr / a.secant, Vr * a.secant)
        V = np.where(known, Vs, V).astype(np.float32)
        print('  secant on %.2f of frame %d: slope median %.2f, air median %.3f' % (float(known.mean()), f, float(np.median(slope[known])) if known.any() else 0, float(np.median(air[known])) if known.any() else 0))
    ground = np.isfinite(D).astype(np.float32)
    ground = cv2.erode(ground, np.ones((3, 3), np.uint8))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    border = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)) / (a.feather * w / 1920)
    border = np.clip(border, 0, 1)
    border = border * border * (3 - 2 * border)
    Dm = cv2.dilate(np.where(np.isfinite(D), D, 0).astype(np.float32), np.ones((3, 3), np.uint8))
    if a.edge > 0:
        ke = max(1, int(round(a.edge * w / 1920)))
        el = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * ke + 1, 2 * ke + 1))
        Df = np.where(np.isfinite(D), D, 1e9).astype(np.float32)
        rim = (cv2.dilate(Df, el) > a.jump * cv2.erode(Df, el)).astype(np.float32)
        border = border * (1 - cv2.GaussianBlur(rim, (0, 0), 0.7))
        print('  rims of nearer ground: %.3f of frame %d left out' % (float(rim.mean()), f))
    pre = np.dstack([V * ground[..., None], ground])
    mips = [pre]
    for _ in range(4):
        mips.append(cv2.pyrDown(mips[-1]))
    sources.append(dict(frame=f, cam=geom.Camera(pose, w, h), mips=mips, Dm=Dm, border=border * ground, w=w, h=h, eye=pose['height']))
    print('source %d: eye %.5f radii, ratio R/H median %.2f, 5..95 percent %.2f %.2f' % (f, pose['height'], np.median(gain[ground > 0]), *np.percentile(gain[ground > 0], [5, 95])))

levels = [l for l in json.load(open(a.levels))['levels'] if l.get('own')]
only = [float(x) for x in a.only.split(',')] if a.only else None
os.makedirs(a.out, exist_ok=True)
for L in levels:
    if only and L['widthDeg'] not in only:
        continue
    f = Image.open(os.path.join(a.dir, L['file']))
    keep = (dict(f.quantization), JpegImagePlugin.get_sampling(f))
    old = np.asarray(f.convert('RGB')).astype(np.float32) / 255
    N = old.shape[0]
    plate = geom.scene_of(old)
    first = geom.scene_of(np.asarray(Image.open(os.path.join(a.first, L['file'])).convert('RGB')).astype(np.float32) / 255) if a.first else plate.copy()
    if a.rest == 'first':
        plate = first.copy()
    t = geom.half_tan(L['widthDeg'])
    c = (np.arange(N, dtype=np.float32) + 0.5) / N
    x = np.broadcast_to(((2 * c - 1) * t)[None, :], (N, N))
    y = np.broadcast_to(((1 - 2 * c) * t)[:, None], (N, N))
    hgt = height_at(x, y)
    d = n[None, None, :] + x[..., None] * east[None, None, :] + y[..., None] * north[None, None, :]
    d = d / np.linalg.norm(d, axis=2, keepdims=True) * (1 + hgt.astype(np.float64))[..., None]
    total = np.zeros((N, N), np.float32)
    fan = np.ones((N, N), np.float32)
    if a.fan:
        X0, X1, YB = [float(v) for v in a.fan.split(',')]
        RJ = json.load(open(a.relief))
        T = GEO['dive']['terrain']
        rot = geom.quat_matrix(T['rotation'])
        loc = (d - np.array(T['origin'])) @ rot / T['scale']
        PW, PH = RJ['imageSize']['full']
        th = np.tan(np.radians(RJ['camera']['vfovDeg']) / 2)
        z = np.maximum(-loc[..., 2], 1e-9)
        ix = (loc[..., 0] / z / (th * PW / PH) + 1) / 2 * PW
        iy = (1 - loc[..., 1] / z / th) / 2 * PH
        e = np.minimum(np.minimum(ix - X0, X1 - ix), YB - iy)
        e = np.where(loc[..., 2] < 0, e, -1e6)
        # a fixed field on the ground: the same for every level
        rng = np.random.default_rng(238)
        field = np.zeros((N, N), np.float32)
        tw = geom.half_tan(8.5)
        for cells, amp in ((24, 0.5), (64, 0.3), (192, 0.2)):
            g = rng.standard_normal((cells, cells)).astype(np.float32)
            g = cv2.GaussianBlur(g, (0, 0), 1.0)
            g /= np.abs(g).max()
            mx = ((x / tw + 1) / 2 * cells - 0.5).astype(np.float32)
            my = ((1 - y / tw) / 2 * cells - 0.5).astype(np.float32)
            field += amp * cv2.remap(g, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        fan = np.clip((e + a.meander * field) / a.band, 0, 1).astype(np.float32)
        fan = fan * fan * (3 - 2 * fan)
        del loc, ix, iy, e, z
    for s in sources:
        cam = s['cam']
        u, v, front = cam.project(d)
        dist = np.linalg.norm(d - cam.p, axis=2).astype(np.float32)
        u = np.clip(np.where(front, u, -1e5), -1e5, 1e5).astype(np.float32)
        v = np.clip(np.where(front, v, -1e5), -1e5, 1e5).astype(np.float32)
        inside = front & (u > 0) & (u < s['w']) & (v > 0) & (v < s['h'])
        depth = cv2.remap(s['Dm'], u - 0.5, v - 0.5, cv2.INTER_NEAREST, borderValue=0)
        seen = inside & (dist <= depth * (1 + a.tol))
        # texels per frame pixel, the larger of the two directions: over 1 the frame is read through its mips
        ux, uy = np.gradient(u.astype(np.float64), axis=1), np.gradient(u.astype(np.float64), axis=0)
        vx, vy = np.gradient(v.astype(np.float64), axis=1), np.gradient(v.astype(np.float64), axis=0)
        du, dv = np.hypot(ux, vx), np.hypot(uy, vy)
        lod = np.clip(np.log2(np.maximum(np.maximum(du, dv), 1e-6)), 0, 3.999)
        # the smaller singular value of the map from texels to frame px: 1 over it is the texels one frame px covers along its longest side
        q = ux * ux + uy * uy + vx * vx + vy * vy
        det = np.abs(ux * vy - uy * vx)
        small = np.sqrt(np.maximum((q - np.sqrt(np.maximum(q * q - 4 * det * det, 0))) / 2, 1e-12))
        s0, s1 = [float(z) for z in a.stretch.split(',')]
        near = np.clip((s1 - 1 / small) / (s1 - s0), 0, 1).astype(np.float32)
        near = np.nan_to_num(near * near * (3 - 2 * near)).astype(np.float32)
        del ux, uy, vx, vy, q, det, small
        val = np.zeros((N, N, 4), np.float32)
        for i in range(4):
            wgt = np.clip(1 - np.abs(lod - i), 0, 1)
            if not (wgt > 0).any():
                continue
            sc = 0.5 ** i
            val += cv2.remap(s['mips'][i], u * sc - 0.5, v * sc - 0.5, cv2.INTER_LINEAR, borderValue=0) * wgt[..., None]
        bw = cv2.remap(s['border'], u - 0.5, v - 0.5, cv2.INTER_LINEAR, borderValue=0)
        wt = np.where(seen & (val[..., 3] > 0.5), bw, 0).astype(np.float32)
        wt = cv2.GaussianBlur(wt, (0, 0), 1.0)
        wt = np.minimum(wt, np.where(seen, 1, 0)) * fan * near
        if a.veil:
            # the planet's veil at a grazing sight line as set.ts hands it over (near.json grazing), for this source's eye
            NJ = json.load(open(a.near))
            G = NJ['grazing']
            hw = (np.log(max(s['eye'], 1e-5)) - np.log(NJ['low'])) / (np.log(NJ['high']) - np.log(NJ['low']))
            hw = min(max(hw, 0.0), 1.0)
            nearw = 1 - hw * hw * (3 - 2 * hw)
            up = d / np.linalg.norm(d, axis=2, keepdims=True)
            mu = np.clip(((cam.p[None, None, :] - d) * up).sum(axis=2) / np.maximum(dist, 1e-12), 0, 1)
            through = np.exp(-G['depth'] * nearw * np.exp(-np.power(mu / G['width'], G['power'])))
            t0, t1 = [float(z) for z in a.veil.split(',')]
            k = np.clip((through - t0) / (t1 - t0), 0, 1).astype(np.float32)
            wt = wt * k * k * (3 - 2 * k)
            del up, mu, through, k
        new = val[..., :3] / np.maximum(val[..., 3:4], 1e-4)
        plate = plate * (1 - wt[..., None]) + new * wt[..., None]
        total = 1 - (1 - total) * (1 - wt)
        print('  %s from %d: %.3f of the plate, texels per frame px median %.2f where laid' % (L['file'], s['frame'], float(wt.mean()), float(np.median(1 / np.maximum(du, dv)[wt > 0.5])) if (wt > 0.5).any() else 0))
    if a.tone > 0 and total.max() > 0:
        k = a.tone / L['widthDeg'] * N
        sm = max(1, int(round(k / 24)))
        small = lambda m: cv2.resize(m, (N // sm, N // sm), interpolation=cv2.INTER_AREA)
        lum = lambda p: np.log(np.maximum(p, 1e-4))
        num = cv2.GaussianBlur(small((lum(plate) - lum(first)) * total[..., None]), (0, 0), k / sm)
        den = cv2.GaussianBlur(small(total), (0, 0), k / sm)
        g0, g1 = [float(z) for z in a.gain.split(',')]
        g = cv2.resize(np.clip(np.exp(num / np.maximum(den, 1e-3)[..., None]), g0, g1), (N, N), interpolation=cv2.INTER_LINEAR)
        reach = cv2.resize(np.clip(den * 4, 0, 1), (N, N), interpolation=cv2.INTER_LINEAR)[..., None]
        hidden = first * (1 - reach) + first * g * reach
        plate = plate * total[..., None] + hidden * (1 - total[..., None])
    out = np.clip(geom.texel_of(plate) * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(os.path.join(a.out, L['file']), 'JPEG', qtables=keep[0], subsampling=keep[1])
    cv2.imwrite(os.path.join(a.out, L['file'].replace('.jpg', '-laid.png')), np.round(total * 255).astype(np.uint8))
    print(L['file'], 'laid on %.3f of it' % float((total > 0.5).mean()), os.path.getsize(os.path.join(a.out, L['file'])))
