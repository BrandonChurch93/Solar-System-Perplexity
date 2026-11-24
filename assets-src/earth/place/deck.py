import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, centre

SPEC = json.loads((Path(__file__).resolve().parent / 'mend.json').read_text())['field']
P = centre()
LUM = np.array([0.114, 0.587, 0.299], np.float32)


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mblur(v, m, s):
    if v.ndim == 3:
        return cv2.GaussianBlur(v * m[..., None], (0, 0), s) / np.maximum(cv2.GaussianBlur(m, (0, 0), s), 1e-4)[..., None]
    return cv2.GaussianBlur(v * m, (0, 0), s) / np.maximum(cv2.GaussianBlur(m, (0, 0), s), 1e-4)


def sun_image_dir(c):
    sun = g.G.T @ np.array(g.FIT['sunDir'])
    n, e, u = g.frame_at(c)
    d = np.array([-(sun @ e), sun @ u])
    return d / np.linalg.norm(d)


def line_kernel(d, reach, start=0.0, thick=3):
    r = int(np.ceil(reach))
    k = np.zeros((2 * r + 1, 2 * r + 1), np.uint8)
    cv2.line(k, (int(round(r - d[0] * start)), int(round(r - d[1] * start))), (int(round(r - d[0] * reach)), int(round(r - d[1] * reach))), 1, thick)
    return k


def grow(labels, steps, inside):
    lab = labels.astype(np.float32)
    k = np.ones((3, 3), np.uint8)
    for _ in range(steps):
        wide = cv2.dilate(lab, k)
        lab = np.where((lab > 0) | ~inside, lab, wide)
    return lab.astype(np.int32)


def bodies(a, spec):
    solid = (a > spec['body']).astype(np.uint8)
    count, labels = cv2.connectedComponents(cv2.erode(solid, np.ones((3, 3), np.uint8), iterations=spec['erode']))
    labels = grow(labels, spec['erode'] + 2, solid > 0)
    more, small = cv2.connectedComponents(((solid > 0) & (labels == 0)).astype(np.uint8))
    labels = np.where(small > 0, small + count - 1, labels)
    return grow(labels, spec['growPx'], a > 0.01)


def matte(take, glint, spec=SPEC):
    b, r = take[..., 0], take[..., 2]
    lo = take.min(axis=2)
    lum = take @ LUM
    c0 = np.full(lo.shape, spec['cloud'][0], np.float32)
    c1 = np.full(lo.shape, spec['cloud'][1], np.float32)
    z = np.zeros(lo.shape, bool)
    if glint:
        yy, xx = np.mgrid[:lo.shape[0], :lo.shape[1]]
        e = np.sqrt((xx / glint[0]) ** 2 + (yy / glint[1]) ** 2)
        z = e < 1
        t = np.clip((spec['pale'][0] - e) / (spec['pale'][0] - 1), 0, 1).astype(np.float32)
        c0 += t * (spec['pale'][1] - spec['cloud'][0])
        c1 += t * (spec['pale'][2] - spec['cloud'][1])
    k = 2 * spec['rimPx'] + 1
    top = np.maximum(cv2.dilate(lo, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))), c1)
    a = np.clip((lo - c0) / (top - c0), 0, 1)
    sea = ((lo < c0) & ~z).astype(np.float32)
    ref = mblur(lum, sea, spec['shadow']['refPx'])
    lit = sea * (lum > spec['shadow']['lit'] * ref)
    ref = mblur(lum, lit, spec['shadow']['refPx'])
    raw = np.clip(lum / np.maximum(ref, 1) / spec['shadow']['full'], spec['shadow']['floor'], 1)
    near = cv2.GaussianBlur(sea, (0, 0), spec['shadow']['fillPx'])
    fill = np.where(near > 0.05, cv2.GaussianBlur(raw * sea, (0, 0), spec['shadow']['fillPx']) / np.maximum(near, 0.05), 1)
    m = cv2.GaussianBlur(np.where(sea > 0, raw, fill), (0, 0), spec['shadow']['softPx'])
    m[z] = 1
    w = (np.clip(lo, 0, 255) / 255) ** spec['bleed'][1]
    bleed = cv2.GaussianBlur(take * w[..., None], (0, 0), spec['bleed'][0]) / np.maximum(cv2.GaussianBlur(w, (0, 0), spec['bleed'][0]), 1e-6)[..., None]
    colour = np.where((a > 0.98)[..., None], take, bleed)
    labels = bodies(a, spec)
    bad = np.zeros(int(labels.max()) + 1, bool)
    edge = np.zeros_like(labels, bool)
    edge[:3] = edge[-3:] = edge[:, :3] = edge[:, -3:] = True
    bad[np.unique(labels[edge])] = True
    count = np.maximum(np.bincount(labels.ravel()), 1)
    bad |= np.bincount(labels.ravel(), weights=z.ravel().astype(np.float64)) / count > 0.3
    bad[0] = False
    lost = bad[labels]
    a = a * (labels > 0) * ~lost
    labels[lost] = 0
    solid = a > spec['body']
    order = np.lexsort((lo[solid], labels[solid]))
    lab, v = labels[solid][order], lo[solid][order]
    each = np.arange(int(labels.max()) + 1)
    first, end = np.searchsorted(lab, each), np.searchsorted(lab, each, side='right')
    lit = np.zeros(len(each), bool)
    has = end > first
    lit[has] = v[(first + spec['veil']['tenth'] * (end - first - 1)).astype(int)[has]] >= spec['veil']['bright']
    _, blobs, stats, _ = cv2.connectedComponentsWithStats((solid & (lo >= spec['veil']['bright']) & (a >= spec['veil']['alpha'][1])).astype(np.uint8), 8)
    stats[0, cv2.CC_STAT_AREA] = 0
    size = stats[:, cv2.CC_STAT_AREA][blobs]
    away = np.full(lo.shape, np.inf, np.float32)
    k = 4
    while k <= size.max():
        away = np.minimum(away, cv2.distanceTransform((size < k).astype(np.uint8), cv2.DIST_L2, 5) / np.sqrt(k))
        k *= 2
    thin = 1 - step(spec['veil']['alpha'][0], spec['veil']['alpha'][1], cv2.GaussianBlur(a.astype(np.float32), (0, 0), spec['veil']['sigmaPx']))
    hem = 1 - step(spec['veil']['reach'][0], spec['veil']['reach'][1], away) * thin
    return a.astype(np.float32), colour.astype(np.float32), m.astype(np.float32), labels, z, lost, lit, hem.astype(np.float32)


def shadow_dir(a, m):
    k = 4
    n = a.shape[0] // k
    x = cv2.resize(a, (n, n), interpolation=cv2.INTER_AREA)
    y = cv2.resize(1 - m, (n, n), interpolation=cv2.INTER_AREA)
    c = np.fft.irfft2(np.conj(np.fft.rfft2(x - x.mean())) * np.fft.rfft2(y - y.mean()), s=(n, n))
    c = np.fft.fftshift(c)
    yy, xx = np.mgrid[:n, :n] - n // 2
    near = np.hypot(xx, yy) < 60
    w = np.clip(c - 0.6 * c[near].max(), 0, None) * near
    d = np.array([(w * xx).sum(), (w * yy).sum()]) / w.sum()
    return d * k


def variants(scale, spec=SPEC):
    want = sun_image_dir(P)
    out = []
    for name, glint in zip(spec['takes'], spec['glint']):
        take = cv2.imread(str(WORK / name)).astype(np.float32)
        a, colour, m, labels, z, lost, lit, hem = matte(take, glint, spec)
        d = shadow_dir(a, m)
        turn = np.degrees(np.arctan2(-want[1], want[0]) - np.arctan2(-d[1], d[0]))
        turn = (turn + 180) % 360 - 180
        n = take.shape[0]
        size = int(np.ceil(n * np.sqrt(2) * scale / 2)) * 2
        print(name, 'scale', scale, 'cover', round(float(a.mean()), 3), 'bodies', len(np.unique(labels)) - 1, 'of them lit', int(lit.sum()), 'glint share', round(float(z.mean()), 3), 'shadow offset px', np.round(d, 1), 'turn', round(float(turn), 1), flush=True)
        soft = 0.5 / scale
        pre = cv2.GaussianBlur(a, (0, 0), soft) if scale < 0.8 else a
        prec = cv2.GaussianBlur(colour * a[..., None], (0, 0), soft) if scale < 0.8 else colour * a[..., None]
        prem = cv2.GaussianBlur(m, (0, 0), soft) if scale < 0.5 else m
        for mirror in (False, True):
            rot = cv2.getRotationMatrix2D((n / 2, n / 2), turn, scale)
            rot[:, 2] += size / 2 - n / 2
            if mirror:
                ref = np.array([[2 * want[0] * want[0] - 1, 2 * want[0] * want[1]], [2 * want[0] * want[1], 2 * want[1] * want[1] - 1]])
                c = np.array([size / 2, size / 2])
                rot = np.hstack([ref @ rot[:, :2], (ref @ (rot[:, 2] - c) + c)[:, None]])
            wa = cv2.warpAffine(pre, rot, (size, size), flags=cv2.INTER_LINEAR)
            wc = cv2.warpAffine(prec, rot, (size, size), flags=cv2.INTER_LINEAR)
            wm = cv2.warpAffine(prem, rot, (size, size), flags=cv2.INTER_LINEAR, borderValue=1)
            wl = cv2.warpAffine(labels.astype(np.float32), rot, (size, size), flags=cv2.INTER_NEAREST).astype(np.int32)
            wb = cv2.warpAffine(lost.astype(np.float32), rot, (size, size), flags=cv2.INTER_NEAREST) > 0.5
            wh = cv2.warpAffine(hem, rot, (size, size), flags=cv2.INTER_LINEAR, borderValue=1)
            out.append((wa, wc, wm, wl, int(labels.max()) + 1, float(np.hypot(d[0], d[1])) * scale, wb, lit, wh))
    return out, want


def density(spec=SPEC):
    from calm import land_of, SPEC as CALM
    from farin import CANVAS, reach as from_nadir
    from layback import layback
    from levels import hold_level, reproject, footprint, SPOT, PLATES
    ds = spec['density']
    n, deg = ds['size'], spec['widthDeg']
    per = n / deg
    rng = np.random.default_rng(ds['seed'])

    def noise(sigma_deg):
        f = cv2.GaussianBlur(rng.standard_normal((n, n)).astype(np.float32), (0, 0), sigma_deg * per)
        return f / f.std()

    def fbm(grain):
        f = sum(w * noise(s) for s, w in grain)
        return f / f.std()

    under, _ = reproject(hold_level(48), SPOT, 48, P, deg, n)
    land = cv2.GaussianBlur(land_of(under, CALM, CALM['dotPx']['48']), (0, 0), ds['landDeg'] * per)
    lay, _, inside = layback(cv2.imread(str(CANVAS)), 1, deg, n)
    cover = step(0.5, 1.0, cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), ds['edgeDeg'] * per))
    cloud = step(ds['cloud'][0], ds['cloud'][1], cv2.GaussianBlur(lay.astype(np.float32).min(axis=2), (0, 0), ds['cloudDeg'] * per))
    seen = (inside > 0.99).astype(np.float32)
    cloud = cloud * cover + mblur(cloud * seen, seen, ds['spreadDeg'] * per) * (1 - cover)
    dist = from_nadir(P, deg, n)
    far = step(ds['far'][0], ds['far'][1], dist - ds['farVary'][1] * np.abs(noise(ds['farVary'][0])))
    core = cover * step(ds['far'][0], ds['far'][1], dist)
    out = cv2.distanceTransform((core < 0.5).astype(np.uint8), cv2.DIST_L2, 5) / per
    vary = np.exp(ds['vary'][1] * noise(ds['vary'][0]))
    env = 1 - step(0, 1, out / (ds['reachDeg'] * vary))
    lift = ds['lift'][0] + (ds['lift'][1] - ds['lift'][0]) * env ** ds['gamma'] + ds['land'][0] * land * env ** ds['land'][1]
    groups = step(ds['cut'][0], ds['cut'][1], fbm(ds['grain']) + lift)
    system = groups * (1 - (1 - ds['open']) * (1 - np.maximum(cloud, land)))
    wd = ds['wide']
    i = np.arange(n, dtype=np.float32)
    rim = np.minimum.outer(np.minimum(i, n - 1 - i), np.minimum(i, n - 1 - i)) / per
    wide = wd['top'] * step(wd['cut'][0], wd['cut'][1], fbm(wd['grain']) + wd['land'] * land)
    clear = 1 - step(ds['base']['cloud'][0], ds['base']['cloud'][1], cv2.GaussianBlur(under.astype(np.float32).min(axis=2), (0, 0), ds['base']['deg'] * per)) * (1 - cover)
    rg = ds['ring']
    share = mblur((lay.astype(np.float32).min(axis=2) > rg['cloud']).astype(np.float32) * seen, seen, rg['shareDeg'] * per)
    near = (1 - far) * (1 - cover)
    out = cv2.distanceTransform((np.maximum(cover, 1 - far) < 0.5).astype(np.uint8), cv2.DIST_L2, 5) / per
    calm = (np.maximum(near, (1 - step(0, 1, out / (rg['calmDeg'] * vary))) * (1 - cover)) * step(rg['plate'][0], rg['plate'][1], footprint(P, deg, n, P, PLATES['levels'][0]['widthDeg']))).astype(np.float32)
    clear = clear + (1 - clear) * step(rg['wipe'][1], 1, calm)
    ring = np.clip(share / rg['top'], 0, 1) ** (1 / rg['power']) * near
    dens = np.clip((np.maximum(system, wide) * far + ring) * clear * step(wd['edgeDeg'][0], wd['edgeDeg'][1], rim + wd['edgeVary'] * noise(1.5) * step(0, wd['edgeDeg'][1], rim)), 0, 1).astype(np.float32)
    print('ring: share of the raster', round(float(near.mean()), 4), 'mean chance where its weight is over 0.9', round(float(dens[near > 0.9].mean()), 3), 'cloud share of the lay back carried there', round(float(share[near > 0.9].mean()), 3), 'calm sea: share of the raster', round(float(calm.mean()), 4), flush=True)
    print('density: mean', round(float(dens.mean()), 4), 'over land inside the cover', round(float(dens[(core > 0.9) & (land > 0.5)].mean()), 3), 'over sea inside the cover', round(float(dens[(core > 0.9) & (land < 0.1)].mean()), 3), 'wide part alone', round(float(wide.mean()), 4), flush=True)
    look = under * (1 - 0.85 * dens[..., None]) + 255 * 0.85 * dens[..., None]
    cv2.imwrite(str(WORK / 'field-density-look.jpg'), cv2.resize(np.clip(look, 0, 255).astype(np.uint8), (1024, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    return dens, calm


def lay(tiles, want, dens, share, alpha, colour, shade, rng, spec, scale):
    n = alpha.shape[0]
    k = n / dens.shape[0]
    size = tiles[0][0].shape[0]
    pitch = spec['step'] * scale * 2048
    ys, xs = np.nonzero(dens > 0.01)
    x0, x1, y0, y1 = xs.min() * k, xs.max() * k, ys.min() * k, ys.max() * k
    spots = []
    row = 0
    y = y0 - pitch / 2
    while y < y1 + pitch / 2:
        x = x0 - pitch / 2 + (pitch / 2 if row % 2 else 0)
        while x < x1 + pitch / 2:
            spots.append((x + rng.uniform(-0.3, 0.3) * pitch, y + rng.uniform(-0.3, 0.3) * pitch))
            x += pitch
        y += pitch * 0.87
        row += 1
    order = rng.permutation(len(spots))
    last = -1
    reach = max(int(round(spec['shadow']['reachPx'] * scale / spec['scale'])) // 4, 2)
    kernel = line_kernel(want, reach)
    used = 0
    for i in order:
        cx, cy = spots[i]
        ox, oy = int(round(cx - size / 2)), int(round(cy - size / 2))
        ax0, ay0, ax1, ay1 = max(ox, 0), max(oy, 0), min(ox + size, n), min(oy + size, n)
        if ax1 - ax0 < 8 or ay1 - ay0 < 8:
            continue
        d = cv2.remap(dens, ((np.arange(ax0, ax1, dtype=np.float32) + 0.5) / k - 0.5)[None, :].repeat(ay1 - ay0, 0), ((np.arange(ay0, ay1, dtype=np.float32) + 0.5) / k - 0.5)[:, None].repeat(ax1 - ax0, 1), cv2.INTER_LINEAR)
        if d.max() < 0.02:
            continue
        raw = d
        d = d * (share[0] + (share[1] - share[0]) * step(share[2], share[3], d))
        v = int(rng.integers(len(tiles)))
        if v == last:
            v = (v + 1) % len(tiles)
        last = v
        wa, wc, wm, wl, count, far, wb, lit, wh = tiles[v]
        sl = (slice(ay0 - oy, ay1 - oy), slice(ax0 - ox, ax1 - ox))
        lab = wl[sl]
        chance = rng.uniform(0, 1, count) ** (1 / spec['density']['power'])
        sums = np.bincount(lab.ravel(), weights=d.ravel(), minlength=count)
        counts = np.maximum(np.bincount(lab.ravel(), minlength=count), 1)
        keep = (sums / counts) > chance
        keep &= lit | (np.bincount(lab.ravel(), weights=raw.ravel(), minlength=count) / counts > spec['veil']['dense'])
        keep[0] = False
        if oy < 0:
            keep[lab[0, :]] = False
        if oy + size > n:
            keep[lab[-1, :]] = False
        if ox < 0:
            keep[lab[:, 0]] = False
        if ox + size > n:
            keep[lab[:, -1]] = False
        on = (keep[lab] * wh[sl]).astype(np.float32)
        a = wa[sl] * on
        if a.max() <= 0:
            continue
        small = (on.shape[1] // 4, on.shape[0] // 4)
        q = (cv2.resize((on > 0.5).astype(np.float32), small, interpolation=cv2.INTER_AREA) > 0.02).astype(np.float32)
        gone = (cv2.resize((((lab > 0) & (on <= 0.5)) | wb[sl]).astype(np.float32), small, interpolation=cv2.INTER_AREA) > 0.02).astype(np.float32)
        span = line_kernel(want, spec['shadow']['span'][1] * far / 4, spec['shadow']['span'][0] * far / 4, 1).astype(np.float32)
        ours = cv2.filter2D(q, -1, span, borderType=cv2.BORDER_CONSTANT)
        theirs = cv2.filter2D(gone, -1, span, borderType=cv2.BORDER_CONSTANT)
        zone = cv2.resize(cv2.GaussianBlur(cv2.dilate(q, kernel) * (1 - theirs / (ours + theirs + 1e-3)), (0, 0), 2), (on.shape[1], on.shape[0]), interpolation=cv2.INTER_LINEAR)
        m = 1 - (1 - wm[sl]) * zone
        w = (slice(ay0, ay1), slice(ax0, ax1))
        dark = spec['shadow']['onCloud']
        colour[w] = colour[w] * ((1 - a) * (1 - dark * (1 - m)))[..., None] + wc[sl] * (on * (1 - dark * (1 - shade[w])))[..., None]
        alpha[w] = alpha[w] * (1 - a) + a
        shade[w] *= m
        used += 1
    print('scale', scale, 'placed', used, 'of', len(spots), 'cover so far', round(float(alpha.mean()), 4), flush=True)


def main():
    spec = SPEC
    n = spec['raster']
    dens, calm = density(spec)
    cv2.imwrite(str(WORK / 'field-density.png'), (dens * 255).astype(np.uint8))
    cv2.imwrite(str(WORK / 'field-near.png'), (calm * 255 + 0.5).astype(np.uint8))
    rng = np.random.default_rng(spec['seed'])
    alpha = np.zeros((n, n), np.float32)
    colour = np.zeros((n, n, 3), np.float32)
    shade = np.ones((n, n), np.float32)
    for scale, share in spec['sizes']:
        tiles, want = variants(scale, spec)
        lay(tiles, want, dens, share, alpha, colour, shade, rng, spec, scale)
        del tiles
    big = cv2.resize(dens, (n, n))
    print('cover where the density is over 0.9:', round(float(alpha[big > 0.9].mean()), 3), 'between 0.3 and 0.6:', round(float(alpha[(big > 0.3) & (big < 0.6)].mean()), 3), 'under 0.05:', round(float(alpha[big < 0.05].mean()), 4), flush=True)
    del big
    np.save(WORK / 'field-alpha.npy', (alpha * 255 + 0.5).astype(np.uint8))
    np.save(WORK / 'field-colour.npy', np.clip(colour + 0.5, 0, 255).astype(np.uint8))
    np.save(WORK / 'field-shade.npy', (shade * 255 + 0.5).astype(np.uint8))
    look = (30 + np.zeros((n, n, 3), np.float32) + np.array([70, 40, 10], np.float32)) * shade[..., None] * (1 - alpha[..., None]) + colour
    cv2.imwrite(str(WORK / 'field-look.jpg'), cv2.resize(np.clip(look, 0, 255).astype(np.uint8), (2048, 2048), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    ys, xs = np.nonzero(alpha > 0.5)
    cy, cx = int(np.median(ys)), int(np.median(xs))
    cv2.imwrite(str(WORK / 'field-look-native.jpg'), np.clip(look[cy - 600:cy + 600, cx - 900:cx + 900], 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])


if __name__ == '__main__':
    main()
