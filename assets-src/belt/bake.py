import json
import os
import sys
import numpy as np
from scipy import ndimage
from multiprocessing import Pool
from PIL import Image

F = np.float32
np.seterr(over='ignore')

ROCKS = [
    dict(id='a', seed=1107, n=832, axes=(1.0, 0.80, 0.68), lumps=0.17, facets=6, craters=72, rmax=0.50, grooves=3, soft=0.12, wobble=0.02, cracks=((4.0, 0.03, 0.007), (9.5, 0.035, 0.0035)), boulders=((5, 0.10), (8, 0.2), (14, 0.25))),
    dict(id='b', seed=2311, n=512, axes=(1.0, 0.70, 0.62), lumps=0.22, facets=5, craters=56, rmax=0.42, grooves=2),
    dict(id='c', seed=3709, n=384, axes=(1.0, 0.86, 0.60), lumps=0.20, facets=7, craters=48, rmax=0.46, grooves=1),
]
TILE = 512


def face_dirs(n, pad):
    m = n + 2 * pad
    c = ((np.arange(m) - pad + 0.5) / n * 2 - 1).astype(F)
    a, b = np.meshgrid(c, c)
    one = np.ones_like(a)
    faces = [(one, -b, -a), (-one, -b, a), (a, one, b), (a, -one, -b), (a, -b, one), (-a, -b, -one)]
    d = np.stack([np.stack(f, -1) for f in faces])
    return (d / np.linalg.norm(d, axis=-1, keepdims=True)).astype(F)


def h32(x):
    x = x.astype(np.uint32)
    x ^= x >> np.uint32(16)
    x *= np.uint32(0x7FEB352D)
    x ^= x >> np.uint32(15)
    x *= np.uint32(0x846CA68B)
    x ^= x >> np.uint32(16)
    return x


def hash3(ix, iy, iz, seed):
    return h32(ix.astype(np.uint32) * np.uint32(0x8DA6B343) ^ iy.astype(np.uint32) * np.uint32(0xD8163841) ^ iz.astype(np.uint32) * np.uint32(0xCB1AB31F) ^ np.uint32(seed & 0xFFFFFFFF))


def u01(h):
    return (h >> np.uint32(8)).astype(F) * F(1 / 16777216)


def gnoise(p, seed):
    i = np.floor(p).astype(np.int32)
    f = (p - i).astype(F)
    w = f * f * f * (f * (f * 6 - 15) + 10)
    out = np.zeros(p.shape[0], F)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                h = hash3(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, seed)
                gx = u01(h) * 2 - 1
                gy = u01(h32(h ^ np.uint32(0x68E31DA4))) * 2 - 1
                gz = u01(h32(h ^ np.uint32(0xB5297A4D))) * 2 - 1
                v = gx * (f[:, 0] - dx) + gy * (f[:, 1] - dy) + gz * (f[:, 2] - dz)
                wt = (w[:, 0] if dx else 1 - w[:, 0]) * (w[:, 1] if dy else 1 - w[:, 1]) * (w[:, 2] if dz else 1 - w[:, 2])
                out += v * wt
    return out * F(1.6)


def fbm(p, seed, octaves, lac=2.03, gain=0.5, ridged=False):
    out = np.zeros(p.shape[0], F)
    amp = 1.0
    freq = 1.0
    for o in range(octaves):
        v = gnoise(p * F(freq) + F(17.3 * o), seed + 101 * o)
        if ridged:
            v = 1 - 2 * np.abs(v)
        out += F(amp) * v
        amp *= gain
        freq *= lac
    return out


def crater(x, depth, rim, deg):
    u = np.clip(1 - x * x, 0, 1)
    bowl = -depth * (1 - 0.45 * deg) * u ** F(1 + 0.8 * deg)
    s = F(0.03 + 0.22 * deg)
    xi = np.sqrt((x - 1) ** 2 + s * s) - s
    lip = rim * (1 - 0.6 * deg) * np.exp(-xi / np.where(x < 1, F(0.14), F(0.36)))
    win = 1 - np.clip((x - 1.6) / 0.6, 0, 1) ** 2
    return (bowl + lip) * win


def unit(rng):
    v = rng.normal(size=3)
    return (v / np.linalg.norm(v)).astype(F)


def build_params(spec):
    rng = np.random.default_rng(spec['seed'])
    p = dict(spec)
    p['off'] = rng.uniform(-50, 50, size=(8, 3)).astype(F)
    p['planes'] = [(unit(rng), F(rng.uniform(0.62, 0.86))) for _ in range(spec['facets'])]
    cr = []
    for i in range(spec['craters']):
        rho = spec['rmax'] * (i + 1) ** -0.5 * rng.uniform(0.8, 1.2)
        ratio = rng.uniform(0.2, 0.32) * (0.55 if i == 0 else 0.8 if i < 4 else 1.0)
        deg = rng.uniform(0, 1) ** 1.3
        if i in (5, 9, 17):
            deg = 0.0
        cr.append((unit(rng), F(rho), F(rho * ratio), F(rho * ratio * rng.uniform(0.18, 0.34)), F(deg)))
    p['cr'] = cr
    gr = []
    for i in range(spec['grooves']):
        gr.append(dict(axis=unit(rng), centre=unit(rng), reach=rng.uniform(0.7, 1.2), period=rng.uniform(0.045, 0.075), depth=rng.uniform(0.006, 0.011), seed=int(rng.integers(1 << 30))))
    p['gr'] = gr
    p['fresh'] = [cr[i] for i in (5, 9, 17) if i < len(cr)]
    return p


def cells(d, freq, seed, fill, rlo, rhi, sign):
    out = np.zeros(d.shape[0], F)
    pos = d * F(freq)
    base = np.floor(pos).astype(np.int32)
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            for oz in (-1, 0, 1):
                cx = base[:, 0] + ox
                cy = base[:, 1] + oy
                cz = base[:, 2] + oz
                h = hash3(cx, cy, cz, seed)
                h2 = h32(h ^ np.uint32(0x1B873593))
                h3 = h32(h2 ^ np.uint32(0xCC9E2D51))
                h4 = h32(h3 ^ np.uint32(0x85EBCA6B))
                h5 = h32(h4 ^ np.uint32(0xC2B2AE35))
                qx = (cx + u01(h)) / F(freq)
                qy = (cy + u01(h2)) / F(freq)
                qz = (cz + u01(h3)) / F(freq)
                ql = np.sqrt(qx * qx + qy * qy + qz * qz)
                ok = (np.abs(ql - 1) < 0.25 / freq) & (u01(h4) < fill)
                if not ok.any():
                    continue
                k = u01(h5)
                rad = (rlo + (rhi - rlo) * k * k) / freq
                dist = np.sqrt((d[:, 0] - qx / ql) ** 2 + (d[:, 1] - qy / ql) ** 2 + (d[:, 2] - qz / ql) ** 2)
                x = dist / rad
                near = ok & (x < 2.2)
                if not near.any():
                    continue
                deg = u01(h32(h5 ^ np.uint32(0x27D4EB2F)))
                if sign > 0:
                    v = crater(x[near], rad[near] * 0.3, rad[near] * 0.07, deg[near] ** 1.6)
                else:
                    v = rad[near] * 0.55 * np.clip(1 - x[near] * x[near] * 2.2, 0, 1) ** 1.5
                out[near] += v
    return out


def radius(d, p):
    a, b, c = p['axes']
    off = p['off']
    r = 1 / np.sqrt((d[:, 0] / a) ** 2 + (d[:, 1] / b) ** 2 + (d[:, 2] / c) ** 2)
    r = r * (1 + p['lumps'] * fbm(d * F(1.15) + off[0], p['seed'] + 1, 3))
    for n, hgt in p['planes']:
        t = hgt / np.maximum(d @ n, 1e-3)
        k = F(p.get('soft', 0.07))
        hh = np.clip(0.5 + 0.5 * (r - t) / k, 0, 1)
        r = r * (1 - hh) + t * hh - k * hh * (1 - hh)
    if p.get('wobble'):
        r = r + p['wobble'] * fbm(d * F(5.3) + off[6], p['seed'] + 21, 2)
    base = r.copy()
    r = r + 0.022 * fbm(d * F(2.7) + off[1], p['seed'] + 2, 3, gain=0.42)
    for cdir, rho, depth, rim, deg in p['cr']:
        cosang = np.clip(d @ cdir, -1, 1)
        sel = cosang > np.cos(min(float(rho) * 2.3, 3.1))
        if not sel.any():
            continue
        ang = np.arccos(cosang[sel])
        wob = 1 + 0.1 * gnoise(d[sel] * F(2.5 / max(float(rho), 0.08)) + off[2], p['seed'] + 3)
        r[sel] += crater(ang / (rho * wob), depth, rim, deg)
    for g in p['gr']:
        phi = d @ g['axis'] + 0.035 * gnoise(d * F(2.6) + off[3], g['seed'])
        q = phi / g['period']
        idx = np.floor(q).astype(np.int32)
        v = np.abs(q - idx - 0.5) * 2
        present = u01(hash3(idx, idx * 0 + 7, idx * 0 + 13, g['seed']))
        amp = np.clip((present - 0.3) / 0.4, 0, 1)
        mask = np.clip((d @ g['centre'] - np.cos(g['reach'])) / 0.35, 0, 1)
        mask = mask * np.clip(0.55 + 0.9 * gnoise(d * F(1.9) + off[4], g['seed'] + 5), 0, 1)
        e1 = np.cross(g['axis'], np.array([0.3, 0.9, 0.2], F))
        e1 = e1 / np.linalg.norm(e1)
        e2 = np.cross(g['axis'], e1)
        along = np.arctan2(d @ e2, d @ e1)
        pits = 0.62 + 0.38 * np.cos(along * F(38.0) + idx * F(2.4))
        prof = np.clip(1 - v / 0.34, 0, 1)
        r -= F(g['depth']) * amp * mask * pits * prof * prof * (3 - 2 * prof)
    for i, (freq, fill) in enumerate(((6, 0.45), (10, 0.55), (17, 0.6), (29, 0.62), (50, 0.62), (82, 0.55))):
        r += cells(d, freq, p['seed'] + 50 + i, fill, 0.13, 0.3, 1)
    r += cells(d, 44, p['seed'] + 90, 0.2, 0.06, 0.16, -1)
    r += cells(d, 90, p['seed'] + 91, 0.25, 0.08, 0.2, -1)
    for i, (freq, fill) in enumerate(p.get('boulders', ())):
        r += cells(d, freq, p['seed'] + 120 + i, fill, 0.06, 0.16, -1)
    for i, (freq, width, depth) in enumerate(p.get('cracks', ())):
        v = gnoise(d * F(freq) + off[7], p['seed'] + 130 + i)
        where = np.clip(0.2 + 1.4 * gnoise(d * F(1.7) + off[i], p['seed'] + 140 + i), 0, 1)
        line = np.clip(1 - np.abs(v) / width, 0, 1)
        r -= F(depth) * where * line * line * (3 - 2 * line)
    r += 0.0016 * fbm(d * F(30) + off[5], p['seed'] + 6, 4)
    return r, base


def bake_rock(spec, out):
    p = build_params(spec)
    n = spec['n']
    pad = n // 8
    m = n + 2 * pad
    dirs = face_dirs(n, pad)
    rr = np.zeros((6, m, m), F)
    bb = np.zeros((6, m, m), F)
    with Pool(3) as pool:
        res = pool.starmap(radius, [(dirs[f].reshape(-1, 3), p) for f in range(6)])
    for f in range(6):
        rr[f] = res[f][0].reshape(m, m)
        bb[f] = res[f][1].reshape(m, m)
    print(spec['id'], 'radius done', flush=True)
    top = float(rr.max())
    rr /= top
    bb /= top
    nrm = np.zeros((6, n, n, 3), F)
    alb = np.zeros((6, n, n), F)
    ao = np.zeros((6, n, n), F)
    crop = slice(pad, pad + n)
    for f in range(6):
        d = dirs[f]
        pos = rr[f][..., None] * d
        tu = np.gradient(pos, axis=1)
        tv = np.gradient(pos, axis=0)
        nn = np.cross(tu, tv)
        nn /= np.linalg.norm(nn, axis=-1, keepdims=True)
        if (nn * d).sum(-1).mean() < 0:
            nn = -nn
        sm = np.stack([ndimage.gaussian_filter(pos[..., k], n / 40) for k in range(3)], -1)
        su = np.gradient(sm, axis=1)
        sv = np.gradient(sm, axis=0)
        ns = np.cross(su, sv)
        ns /= np.linalg.norm(ns, axis=-1, keepdims=True)
        if (ns * d).sum(-1).mean() < 0:
            ns = -ns
        slope = 1 - (nn * ns).sum(-1)
        cav_s = ndimage.gaussian_filter(rr[f], n / 140) - rr[f]
        cav_m = ndimage.gaussian_filter(rr[f], n / 56) - rr[f]
        cav_l = ndimage.gaussian_filter(rr[f], n / 24) - rr[f]
        a = 1 - 16 * np.clip(cav_l, 0, None) - 26 * np.clip(cav_m, 0, None) - 34 * np.clip(cav_s, 0, None) + 10 * np.clip(-cav_m, 0, 0.01)
        flat = d.reshape(-1, 3)
        axis = p['gr'][0]['axis']
        e1 = np.cross(axis, np.array([0.3, 0.9, 0.2], F))
        e1 = e1 / np.linalg.norm(e1)
        e2 = np.cross(axis, e1)
        band = np.stack([(flat @ axis) * 34, (flat @ e1) * 2.2, (flat @ e2) * 2.2], -1).astype(F)
        streak = (gnoise(band + p['off'][5], p['seed'] + 12) + 0.5 * gnoise(band * F(2.3) + p['off'][4], p['seed'] + 13)).reshape(m, m)
        patch = np.clip(0.5 + 1.2 * gnoise(flat * F(1.3) + p['off'][3], p['seed'] + 14).reshape(m, m), 0, 1)
        tone = 0.44 + 0.2 * fbm(flat * F(1.6) + p['off'][6], p['seed'] + 7, 3).reshape(m, m) + 0.1 * fbm(flat * F(8.5) + p['off'][7], p['seed'] + 8, 3).reshape(m, m)
        tone += 0.13 * streak * patch
        tone += 0.42 * np.clip((slope - 0.012) / 0.16, 0, 1)
        tone -= 7.0 * np.clip(cav_m, 0, 0.03)
        tone -= 5.0 * np.clip(cav_s, 0, 0.02)
        tone += 4.0 * np.clip(-cav_s, 0, 0.02)
        for cdir, rho, depth, rim, deg in p['fresh']:
            ang = np.arccos(np.clip(flat @ cdir, -1, 1)).reshape(m, m) / rho
            rays = 0.6 + 0.4 * gnoise(flat * F(9.0 / float(rho) * 0.2) + p['off'][2], p['seed'] + 9).reshape(m, m)
            tone += 0.16 * np.exp(-np.clip(ang - 0.9, 0, None) / 0.8) * rays * (ang < 4)
        nrm[f] = nn[crop, crop]
        alb[f] = np.clip(tone, 0.12, 1)[crop, crop]
        ao[f] = np.clip(a, 0.2, 1)[crop, crop]
    core = rr[:, crop, crop]
    lo = float(core.min())
    hi = float(core.max())
    h = n // 2
    low = core.reshape(6, h, 2, h, 2).mean((2, 4))
    aol = ao.reshape(6, h, 2, h, 2).mean((2, 4))
    rgba = np.concatenate([np.clip(nrm * 0.5 + 0.5, 0, 1), alb[..., None]], -1)
    rgba = np.round(rgba * 255).astype(np.uint8)
    h16 = np.round((low - lo) / (hi - lo) * 65535).astype('<u2')
    a8 = np.round(aol * 255).astype(np.uint8)
    os.makedirs(out, exist_ok=True)
    rgba.tofile(os.path.join(out, 'rock-' + spec['id'] + '.map.bin'))
    with open(os.path.join(out, 'rock-' + spec['id'] + '.aux.bin'), 'wb') as fh:
        fh.write(h16.tobytes())
        fh.write(a8.tobytes())
    light = np.array([-0.62, 0.5, 0.6], F)
    light /= np.linalg.norm(light)
    lit = np.clip((nrm * light).sum(-1), 0, 1) * alb * 1.5 + 0.04 * ao * alb
    sheet = np.concatenate([np.concatenate(list(lit[:3]), 1), np.concatenate(list(lit[3:]), 1)], 0)
    Image.fromarray(np.round(np.clip(sheet, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)).resize((3 * 384, 2 * 384), Image.LANCZOS).save(os.path.join(out, 'preview-' + spec['id'] + '.png'))
    print(spec['id'], 'radius', lo, hi, 'albedo mean', float(alb.mean()), 'ao mean', float(ao.mean()), flush=True)
    return dict(id=spec['id'], size=n, aux=h, lo=lo, hi=hi, seed=spec['seed'])


def bake_tile(out, seed=977):
    t = TILE
    rng = np.random.default_rng(seed)
    fx = np.fft.fftfreq(t)[:, None]
    fy = np.fft.fftfreq(t)[None, :]
    k = np.sqrt(fx * fx + fy * fy)
    k[0, 0] = 1
    spec = np.fft.fft2(rng.normal(size=(t, t))) * k ** -1.25 * (k > 3.5 / t)
    hgt = np.real(np.fft.ifft2(spec))
    hgt = hgt / hgt.std() * 0.9
    yy, xx = np.mgrid[0:t, 0:t].astype(F)
    for i in range(520):
        rad = 2.2 * (1 + i) ** -0.42 * 9 * rng.uniform(0.7, 1.3) + 1.6
        cx, cy = rng.uniform(0, t, 2)
        dx = (xx - cx + t / 2) % t - t / 2
        dy = (yy - cy + t / 2) % t - t / 2
        x = np.sqrt(dx * dx + dy * dy) / rad
        hgt += crater(x.astype(F), F(rad * 0.33), F(rad * 0.08), F(rng.uniform(0, 1) ** 1.2)) * 0.5
    for i in range(700):
        rad = rng.uniform(1.2, 3.6)
        cx, cy = rng.uniform(0, t, 2)
        dx = (xx - cx + t / 2) % t - t / 2
        dy = (yy - cy + t / 2) % t - t / 2
        x2 = (dx * dx + dy * dy) / (rad * rad)
        hgt += rad * 0.5 * np.clip(1 - x2, 0, 1) ** 1.5
    gx = (np.roll(hgt, -1, 1) - np.roll(hgt, 1, 1)) * 0.5
    gy = (np.roll(hgt, -1, 0) - np.roll(hgt, 1, 0)) * 0.5
    sc = 0.5 / max(float(np.percentile(np.abs(np.stack([gx, gy])), 99.5)), 1e-6)
    cav = ndimage.gaussian_filter(hgt, 5, mode='wrap') - hgt
    cav = np.clip(0.5 - cav / (4 * cav.std()), 0, 1)
    spk = np.real(np.fft.ifft2(np.fft.fft2(rng.normal(size=(t, t))) * k ** -0.7 * (k > 6 / t)))
    spk = np.clip(0.5 + spk / (5 * spk.std()), 0, 1)
    rgba = np.stack([np.clip(0.5 + gx * sc, 0, 1), np.clip(0.5 + gy * sc, 0, 1), cav, spk], -1)
    np.round(rgba * 255).astype(np.uint8).tofile(os.path.join(out, 'detail.bin'))
    Image.fromarray(np.round(rgba[..., :3] * 255).astype(np.uint8)).save(os.path.join(out, 'preview-detail.png'))
    return dict(size=t, slope=float(0.5 / sc))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'out/work/belt/bake/take1'
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, 'manifest.json')
    man = json.load(open(path)) if os.path.exists(path) else dict(rocks={}, detail=None)
    if only is None or 'tile' in only:
        man['detail'] = bake_tile(out)
    for spec in ROCKS:
        if only is None or spec['id'] in only:
            man['rocks'][spec['id']] = bake_rock(spec, out)
    json.dump(man, open(path, 'w'), indent=1)


if __name__ == '__main__':
    main()
