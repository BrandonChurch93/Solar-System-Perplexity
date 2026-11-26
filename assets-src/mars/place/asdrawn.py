"""asdrawn.py: the land plates take the globe's map as it is drawn (MAIL 1370 of /root, decision d344).

A land plate is drawn with its own light (inverseFilmic(texel), no light of the globe); the map under it is drawn with the light of the globe
and of the relief cap. Measures on the files therefore do not say what the film shows. This tool measures on the film's own cameras, as
owngain.py and light.py do, the field  lit / own  on the ground of land-8p5 and multiplies the plates with it, at the scales the map resolves.

measure: three draws of the same reader frames (out/work/place/mystillsk.ts, draft tier):
  A  the tree as it stands, and its depth pictures (diag range) for the place of each frame pixel on the ground
  B  the same without the land plates (levels.json without the rows of land-8p5, land-3p8, land-1p6, land-0p7)
  C  the same as A with the land plates times `gain` in scene values (asdrawn.py dim)
  in scene values of the frames (inverse of the film curve):  lit / own = 1 - (1 - gain) * LP(A - B) / LP(A - C).  The weight of the plate, the
  air and the film curve drop out. LP is a Gaussian of `mapTexels` texels of patch-19 on the ground, so that nothing finer than the map is taken
  and the finer ground of the plates stays.
apply: every land plate is multiplied in scene values with the field at its ground, read from the grid of the measure.

Values: block `asdrawn` of plates.json.
"""
import argparse
import json
import os
import shutil

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

import geom

RADIUS_KM = 3389.5
RANGE_LOW, RANGE_OCTAVES = -20, 32  # src/diagnostics/diag.ts
LAND = ['land-8p5.jpg', 'land-3p8.jpg', 'land-1p6.jpg', 'land-0p7.jpg', 'land-0p3.jpg']


def values():
    with open(geom.PLATES) as f:
        return json.load(f)['asdrawn']


def widths():
    with open('src/stops/mars/levels.json') as f:
        return {l['file']: l['widthDeg'] for l in json.load(f)['levels']}


def soft(x, s):
    return cv2.GaussianBlur(x, (0, 0), s) if s > 0.05 else x


def frame(path):
    return geom.scene_of(cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0)


def dim(args):
    """Stage C of the measure: the land plates times gain in scene values."""
    v = values()
    os.makedirs(args.out, exist_ok=True)
    for name in LAND:
        t = np.asarray(Image.open(os.path.join(args.dir, name)).convert('RGB'), dtype=np.float32) / 255.0
        out = geom.texel_of(geom.scene_of(t) * v['gain'])
        Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, name), 'JPEG', quality=95, subsampling=0)
        print('dimmed', name)


def measure(args):
    v = values()
    n = v['grid']
    width = v['widthDeg']
    cell_km = 2 * geom.half_tan(width) * RADIUS_KM / n
    map_km = 19.0 / 4096 * np.pi / 180 * RADIUS_KM
    sides = {}
    # the sun: the lit map is drawn times curve(cosine of the sun at the place), which falls as the body turns (0.432 at 2438,
    # 0.332 at 2708); the plates are drawn times the same curve against its value at the judged surface frame (near.json sun), so
    # that factor is taken out of each frame's ratio and both sides measure one field
    with open(v['sun']['curve']) as f:
        curve = np.array(json.load(f)['curve'], np.float64)

    def lit(mu):
        x = min(max(mu * 0.5 + 0.5, 0.0), 1.0) * 32
        i = min(int(x), 31)
        return curve[i] + (curve[i + 1] - curve[i]) * (x - i)
    for side in ('dive', 'rise'):
        with open(args.poses.replace('SIDE', side)) as f:
            poses = json.load(f)
        num = np.zeros((n, n, 3), np.float64)
        den = np.zeros((n, n), np.float64)
        for k in v['frames'][side]:
            pose = poses[str(k)]
            a, b, c = (frame(os.path.join(d, 'k%d.png' % k)) for d in (args.a, args.b, args.c))
            h, w = a.shape[:2]
            cam = geom.Camera(pose, w, h)
            px_km = 2 * pose['height'] * RADIUS_KM * cam.t / h
            s = np.sqrt(max((v['mapTexels'] * map_km) ** 2 - (0.4 * px_km) ** 2, 0.0)) / px_km
            top = soft(a - b, s)
            low = soft(a - c, s)
            share = low.mean(axis=2) / np.maximum((1 - v['gain']) * soft(a, s).mean(axis=2), 1e-6)
            ratio = 1 - (1 - v['gain']) * top / np.maximum(low, 1e-6)
            ok = (share > v['least']) & (low.min(axis=2) > 1e-5)
            ok = cv2.erode(ok.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
            # since the set draws its own ground times that factor itself (set.ts sunAt, near.json sun), nothing is taken out: sun.drawn
            sun = 0.0 if v['sun'].get('drawn') else np.log(lit(v['sun']['cos'][str(k)]) / lit(v['sun']['refCos']))
            lg = (np.log(np.clip(ratio, v['bounds'][0], v['bounds'][1])) - sun) * ok[..., None]
            wt = (np.clip(share, 0, 1) ** 2 * ok / px_km ** 2).astype(np.float32)
            # the ground of every frame pixel from the frame's own depth picture (diag range), so that the relief of the cap is in the place
            n24 = cv2.imread(os.path.join(args.a, 'k%d-range.png' % k)).astype(np.int64)
            code = (n24[..., 2] << 16) | (n24[..., 1] << 8) | n24[..., 0]
            depth = np.where(code > 0, 2.0 ** (RANGE_LOW + (code - 1) / 16777214 * RANGE_OCTAVES), np.nan)
            py, px = np.mgrid[0:h, 0:w].astype(np.float64) + 0.5
            pts = cam.p + cam.rays(px, py) * depth[..., None]
            high = np.linalg.norm(pts, axis=-1)
            ex, ny, dn = geom.to_patch(pts / high[..., None])
            t = geom.half_tan(width)
            u = (0.5 + ex / (2 * t)) * n - 0.5
            vv = (0.5 - ny / (2 * t)) * n - 0.5
            good = ok & np.isfinite(depth) & (np.abs(high - 1) < 0.01) & (dn > 0.5) & (u > 0) & (u < n - 1) & (vv > 0) & (vv < n - 1)
            u0, v0 = np.floor(u[good]).astype(np.int64), np.floor(vv[good]).astype(np.int64)
            fu, fv = u[good] - u0, vv[good] - v0
            gw = np.zeros(n * n)
            gl = np.zeros((n * n, 3))
            for du, dv, wgt in ((0, 0, (1 - fu) * (1 - fv)), (1, 0, fu * (1 - fv)), (0, 1, (1 - fu) * fv), (1, 1, fu * fv)):
                cell = (v0 + dv) * n + u0 + du
                ww = wgt * wt[good]
                gw += np.bincount(cell, ww, n * n)
                for ch in range(3):
                    gl[:, ch] += np.bincount(cell, ww * lg[good][:, ch], n * n)
            gw = gw.reshape(n, n)
            gl = gl.reshape(n, n, 3)
            num += gl
            den += gw
            print('%s k%d: height %.0f km, frame pixel %.0f m, blur %.2f px, plate share mean %.2f, measured cells %.3f of the grid' % (side, k, pose['height'] * RADIUS_KM, px_km * 1000, s, float(share[ok].mean()) if ok.any() else 0, float((gw > 0).mean())))
        sides[side] = (num, den)
    have = {s: sides[s][1] > v['leastWeight'] * np.median(sides[s][1][sides[s][1] > 0]) for s in sides}
    log = {s: sides[s][0] / np.maximum(sides[s][1], 1e-12)[..., None] for s in sides}
    both = have['dive'] & have['rise']
    any_ = have['dive'] | have['rise']
    field = np.where(both[..., None], 0.5 * (log['dive'] + log['rise']), np.where(have['dive'][..., None], log['dive'], log['rise']))
    apart = np.abs(log['dive'] - log['rise']).mean(axis=2)[both]
    print('measured by the dive %.3f, by the rise %.3f, by both %.3f, by neither %.3f of the grid; dive against rise where both: mean abs %.4f, 99th %.4f (log)' % (have['dive'].mean(), have['rise'].mean(), both.mean(), 1 - any_.mean(), float(apart.mean()) if apart.size else 0, float(np.percentile(apart, 99)) if apart.size else 0))
    # the part all the measured ground within matchDeg of the spot has in common is not the plates' to take: it is the tint of the
    # lit levels near the ground (look.ts descent.tint), printed here to be set there; the plates take what is left
    c = (np.arange(n, dtype=np.float64) + 0.5) / n
    x = np.degrees(np.arctan((2 * c - 1) * geom.half_tan(width)))
    near = any_ & (np.hypot(x[None, :], x[:, None]) < v['matchDeg'])
    match = field[near].mean(axis=0)
    field = field - match
    print('common part within %.2f degrees: plate to map factor %s (log %s); the lit levels take 1 over it: tint times %s' % (v['matchDeg'], np.round(np.exp(match), 4), np.round(match, 4), np.round(np.exp(-match), 4)))
    # ground no camera measures: the field of the measured ground carried outward, ever wider
    fill = field * any_[..., None]
    wsum = any_.astype(np.float32)
    out = fill.astype(np.float32).copy()
    done = any_.copy()
    s = 2.0
    while not done.all() and s < n:
        f = soft(fill.astype(np.float32), s)
        ww = soft(wsum, s)
        new = (~done) & (ww > 0.02)
        out[new] = (f / np.maximum(ww, 1e-6)[..., None])[new]
        done |= new
        s *= 1.6
    out[~done] = 0
    edge = soft(any_.astype(np.float32), v['seamCells'])
    blend = soft(out, v['seamCells'])
    mix = np.clip((edge - 0.5) * 2, 0, 1)[..., None]
    out = out * mix + blend * (1 - mix)
    np.savez_compressed(args.out, field=out.astype(np.float16), measured=any_, dive=have['dive'], rise=have['rise'], match=match)
    g = np.exp(out)
    print('field: mean %s, 1st %s, 99th %s' % (np.round(g[any_].mean(axis=0), 3), np.round(np.percentile(g[any_], 1, axis=0), 3), np.round(np.percentile(g[any_], 99, axis=0), 3)))
    show = np.clip(128 + out * 180, 0, 255).astype(np.uint8)
    show[~any_] = show[~any_] // 2 + 40
    cv2.imwrite(os.path.splitext(args.out)[0] + '.png', cv2.cvtColor(show, cv2.COLOR_RGB2BGR))


def field_at(field, width, plate_width, size):
    """The log field at the texel centres of a plate of plate_width degrees."""
    n = field.shape[0]
    c = (np.arange(size, dtype=np.float32) + 0.5) / size
    u = (0.5 + (2 * c - 1) * geom.half_tan(plate_width) / (2 * geom.half_tan(width))) * n - 0.5
    mx, my = np.meshgrid(u, u)
    return cv2.remap(field, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def apply(args):
    v = values()
    wd = widths()
    z = np.load(args.field)
    field = z['field'].astype(np.float32) * v['share']
    if v['broad']:
        # landunder.py gives the plates the map's forms from one texel of the map up to under.broadTexels of them and leaves each
        # plate its own broad tone: the field carries that broad tone alone, by the same Gaussian, and no form under it
        with open(geom.PLATES) as f:
            texels = json.load(f)['under']['broadTexels']
        cell_km = 2 * geom.half_tan(v['widthDeg']) * RADIUS_KM / field.shape[0]
        map_km = 19.0 / 4096 * np.pi / 180 * RADIUS_KM
        field = cv2.GaussianBlur(field, (0, 0), texels * map_km / cell_km, borderType=cv2.BORDER_REPLICATE)
    os.makedirs(args.out, exist_ok=True)
    for name in LAND:
        f = Image.open(os.path.join(args.dir, name))
        q, sub = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        t = np.asarray(f.convert('RGB'), dtype=np.float32) / 255.0
        size = t.shape[0]
        lf = field_at(field, v['widthDeg'], wd[name], size)
        if v['keepDeg'] is not None:
            c = (np.arange(size, dtype=np.float32) + 0.5) / size
            x = np.degrees(np.arctan((2 * c - 1) * geom.half_tan(wd[name])))
            dist = np.hypot(x[None, :], x[:, None])
            lf = lf * geom.smoothstep(v['keepDeg'], v['fullDeg'], dist)[..., None]
        if float(np.abs(lf).max()) < 1e-6:
            shutil.copyfile(os.path.join(args.dir, name), os.path.join(args.out, name))
            print('%s: the field is 1 on all of it, the file is kept' % name)
            continue
        out = geom.texel_of(geom.scene_of(t) * np.exp(lf))
        Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, name), 'JPEG', qtables=q, subsampling=sub, optimize=True)  # optimize: the same pixels in fewer bytes (entropy tables of the file's own)
        g = np.exp(lf)
        print('%s: %d px, field mean %.3f, least %.3f, most %.3f, bytes %d to %d' % (name, size, g.mean(), g.min(), g.max(), os.path.getsize(os.path.join(args.dir, name)), os.path.getsize(os.path.join(args.out, name))))


LIT = ['patch-19.jpg', 'patch-42.jpg', 'patch-wide.jpg']


def maps(args):
    """The other half of apply (MAIL 1425, MAIL 1056): where a plate keeps its own picture (inside keepDeg, and by the same weight out
    to fullDeg) the lit levels above the land take the plate's picture as drawn: the map is divided by the field there, in scene
    values, by the weight 1 - smoothstep(keepDeg, fullDeg). Plate and map then draw one ground at every scale the field resolves,
    inside as outside. A level coarser than the field's cell takes the field filtered to its own texel."""
    v = values()
    wd = widths()
    field = np.load(args.field)['field'].astype(np.float32) * v['share']
    n = field.shape[0]
    os.makedirs(args.out, exist_ok=True)
    for name in LIT:
        f = Image.open(os.path.join(args.dir, name))
        q, sub = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        src = np.asarray(f.convert('RGB'))
        size = src.shape[0]
        per = size / (2 * geom.half_tan(wd[name]))
        half = int(np.ceil(np.tan(np.radians(v['fullDeg'])) * per)) + 2
        lo, hi = size // 2 - half, size // 2 + half
        c = (np.arange(lo, hi, dtype=np.float32) + 0.5 - size / 2) / per
        dist = np.degrees(np.arctan(np.hypot(c[None, :], c[:, None])))
        texel_cells = (1 / per) / (2 * geom.half_tan(v['widthDeg']) / n)
        fl = cv2.GaussianBlur(field, (0, 0), 0.5 * texel_cells, borderType=cv2.BORDER_REPLICATE) if texel_cells > 1 else field
        u = (0.5 + c / (2 * geom.half_tan(v['widthDeg']))) * n - 0.5
        mx, my = np.meshgrid(u, u)
        lf = cv2.remap(fl, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        lf = -lf * (1 - geom.smoothstep(v['keepDeg'], v['fullDeg'], dist))[..., None]
        t = src[lo:hi, lo:hi].astype(np.float32) / 255.0
        out = np.clip(geom.texel_of(geom.scene_of(t) * np.exp(lf)) * 255 + 0.5, 0, 255).astype(np.uint8)
        o8 = src.copy()
        o8[lo:hi, lo:hi] = out
        Image.fromarray(o8).save(os.path.join(args.out, name), 'JPEG', qtables=q, subsampling=sub, optimize=True)
        g = np.exp(lf)
        inside = dist < v['fullDeg']
        lum = out.astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        print('%s: %d of %d px across, texel %.2f cells of the field, factor mean %.3f, least %.3f, most %.3f; inside %.2f degrees luminance %.0f to %.0f, texels with a channel at 255: %d; bytes %d to %d' % (
            name, hi - lo, size, texel_cells, g[inside].mean(), g.min(), g.max(), v['fullDeg'], lum[inside].min(), lum[inside].max(), int((out.max(2) >= 255)[inside].sum()),
            os.path.getsize(os.path.join(args.dir, name)), os.path.getsize(os.path.join(args.out, name))))


def main():
    p = argparse.ArgumentParser()
    p.add_argument('step', choices=['dim', 'measure', 'apply', 'maps'])
    p.add_argument('--dir')
    p.add_argument('--out')
    p.add_argument('--poses')
    p.add_argument('--a')
    p.add_argument('--b')
    p.add_argument('--c')
    p.add_argument('--field')
    args = p.parse_args()
    {'dim': dim, 'measure': measure, 'apply': apply, 'maps': maps}[args.step](args)


if __name__ == '__main__':
    main()
