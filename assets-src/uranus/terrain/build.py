import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
sys.path.insert(0, 'assets-src/uranus/terrain')
import geo
import tgeo as T

WORK = 'out/work/u/t/'
PUB = 'public/assets/uranus/'
FAR = {'full': (8192, 4096), 'web': (4096, 2048)}
FAR_BASE = (4096, 2048)
FAR_FINE = 0.003
REACH = (0.02, 0.1)
RAGGED = 0.012
HEIGHT = (1024, 512)
CLOUD_HEIGHT = 0.07
WIDE_SMALL = WORK + 'plate/wide-canvas.png'
WIDE_BIG = WORK + 'plate/wide.png'
A_MAX = 4.0
EPS = 0.005


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def fill(table, weight, sig):
    out = np.zeros_like(table)
    wsum = ndi.gaussian_filter(weight, sig, mode='nearest')
    for k in range(table.shape[-1]):
        out[..., k] = ndi.gaussian_filter(table[..., k] * weight, sig, mode='nearest') / np.maximum(wsum, 1e-9)
    bad = wsum < 0.02
    ext = out.copy()
    empty = []
    n = out.shape[1]
    for r in range(out.shape[0]):
        ok = np.flatnonzero(~bad[r])
        if len(ok) < 8:
            empty.append(r)
            continue
        lo, hi = ok[0], ok[-1]
        vl = out[r, lo:lo + 4].mean(0)
        vr = out[r, hi - 3:hi + 1].mean(0)
        gap = (n - 1 - hi) + lo + 1
        cols = np.concatenate([np.arange(hi + 1, n), np.arange(0, lo)])
        g = smooth(0, 1, (np.arange(len(cols)) + 1) / gap)[:, None]
        ext[r, cols] = vr * (1 - g) + vl * g
    full = np.array([r for r in range(out.shape[0]) if r not in set(empty)])
    for r in empty:
        ext[r] = ext[full[np.argmin(np.abs(full - r))]]
    soft = np.stack([ndi.gaussian_filter(ext[..., k], (3, 4), mode=('nearest', 'wrap')) for k in range(3)], -1)
    wb = ndi.gaussian_filter(bad.astype(np.float64), 2, mode='nearest')[..., None]
    return ext * (1 - wb) + soft * wb, ~bad


def lookup(table, u, v):
    h, w = table.shape[:2]
    return cv2.remap(table.astype(np.float32), (u * (w - 1)).astype(np.float32), (v * (h - 1)).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def light_table(lin, d, mu, hit, clip=None):
    nx, ny = T.LIGHT
    psi = T.psi_of(d)
    u = np.clip((psi / T.PSI_MAX * 0.5 + 0.5) * (nx - 1) + 0.5, 0, nx - 1).astype(np.int64)
    v = np.clip(T.light_row(mu) * (ny - 1) + 0.5, 0, ny - 1).astype(np.int64)
    m = hit & (mu > 0.004)
    idx = (v * nx + u)[m]
    table = np.zeros((ny, nx, 3))
    counts = None
    for k in range(3):
        val = lin[..., k][m]
        if clip is not None:
            ref = clip[..., k][m]
            val = np.clip(val, 0.8 * ref, 1.2 * ref)
        t, c = T.bin_percentile(idx, val, nx * ny, 0.5)
        table[..., k] = t.reshape(ny, nx)
        counts = c.reshape(ny, nx)
    w = np.minimum(counts, 40) / 40.0
    near, _ = fill(table, w, (1.2, 5))
    wide, _ = fill(table, w, (5, 9))
    rows = (np.arange(ny) / (ny - 1))[:, None, None]
    return near + (wide - near) * smooth(0.06, 0.22, rows)


def halo_table(lin, d, hit):
    nx, ny = T.HALO
    eps = T.elevation(d)
    psi = T.psi_of(d)
    away = np.degrees(np.arccos(np.clip(d @ T.SUN, -1, 1)))
    m = (~hit) & (eps > 0) & (eps < T.EPS_MAX) & (away > 9)
    u = np.clip((psi / T.PSI_MAX * 0.5 + 0.5) * (nx - 1) + 0.5, 0, nx - 1).astype(np.int64)
    v = np.clip(np.sqrt(np.clip(eps / T.EPS_MAX, 0, 1)) * (ny - 1) + 0.5, 0, ny - 1).astype(np.int64)
    idx = (v * nx + u)[m]
    table = np.zeros((ny, nx, 3))
    for k in range(3):
        t, c = T.bin_percentile(idx, lin[..., k][m], nx * ny, 0.3)
        table[..., k] = t.reshape(ny, nx)
        counts = c.reshape(ny, nx)
    w = np.minimum(counts, 30) / 30.0
    near, _ = fill(table, w, (0.8, 6))
    wide, _ = fill(table, w, (2.5, 12))
    rows = (np.arange(ny) / (ny - 1))[:, None, None]
    out = near + (wide - near) * smooth(0.1, 0.35, rows)
    deg = np.degrees((np.arange(ny) / (ny - 1)) ** 2 * T.EPS_MAX)
    back = np.median(out[(deg > 6) & (deg < 12)], 0)
    back = np.stack([ndi.gaussian_filter1d(back[:, k], 6, mode='wrap') for k in range(3)], -1)
    return np.maximum(out - back[None], 0) * (1 - smooth(3.0, 7.0, deg))[:, None, None]


def noise_tile(seed, n=1024):
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((n, n)))
    kx = np.fft.fftfreq(n)[None, :] * n
    ky = np.fft.fftfreq(n)[:, None] * n
    k = np.hypot(kx, ky)
    band = np.exp(-((np.log2(np.maximum(k, 0.5)) - 5.0) ** 2) / (2 * 0.6 ** 2))
    t = np.real(np.fft.ifft2(f * band))
    return (t / t.std()).astype(np.float32)


def streaks(x, z, angle, seed, finest=0.012):
    ca, sa = np.cos(angle), np.sin(angle)
    along = x * ca + z * sa
    across = -x * sa + z * ca
    out = np.zeros_like(x, dtype=np.float32)
    lam = 12.0
    amp = 1.0
    total = 0.0
    k = 0
    while lam > finest:
        tile = noise_tile(seed + k)
        n = tile.shape[0]
        warp = 0.35 * lam * np.sin(along / (lam * 9.0) + 1.7 * k)
        u = (along / (lam * 7.0) * 32.0 + 37.0 * k) % n
        v = ((across + warp) / lam * 32.0 + 91.0 * k) % n
        out += amp * cv2.remap(tile, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        total += amp * amp
        amp *= 0.72
        lam *= 0.5
        k += 1
    return out / np.sqrt(total)


def main():
    im = np.asarray(Image.open(WIDE_SMALL).convert('RGB')).astype(np.float32) / 255
    AH, AW = im.shape[:2]
    lin = geo.scene(im).astype(np.float64)
    d = T.rays_wide(AW, AH)
    p, n, mu, hit = T.ground(d)
    med = np.stack([ndi.median_filter(lin[..., k], 9) for k in range(3)], -1)
    light = light_table(med, d, mu, hit)
    psi = T.psi_of(d)
    lu = (psi / T.PSI_MAX * 0.5 + 0.5).astype(np.float32)
    lv = T.light_row(mu).astype(np.float32)
    for _ in range(2):
        ref = lookup(light, lu, lv)
        light = light_table(med, d, mu, hit, clip=ref)
    ref = lookup(light, lu, lv)
    a_img = (lin + EPS) / (ref + EPS)
    a_img[~hit] = 1.0
    halo = halo_table(lin, d, hit)

    rgba = np.concatenate([light, np.ones(light.shape[:2] + (1,))], -1).astype(np.float32)
    hrgba = np.concatenate([halo, np.ones(halo.shape[:2] + (1,))], -1).astype(np.float32)
    for key in ('full', 'web'):
        os.makedirs(PUB + key, exist_ok=True)
        rgba.tofile(PUB + key + '/deck-light.bin')
        hrgba.tofile(PUB + key + '/deck-halo.bin')
    Image.fromarray((geo.to_srgb(geo.film(light)) * 255).astype(np.uint8)[::-1]).save(WORK + 'light-table.png')
    Image.fromarray((geo.to_srgb(geo.film(halo * 2)) * 255).astype(np.uint8)[::-1]).save(WORK + 'halo-table.png')
    lum = a_img.mean(-1)
    print('A stats on ground: median', np.median(lum[hit]), 'p1', np.percentile(lum[hit], 1), 'p99', np.percentile(lum[hit], 99), 'max', lum[hit].max())
    Image.fromarray((np.clip(a_img / 2.5, 0, 1) ** 0.5 * 255).astype(np.uint8)).save(WORK + 'albedo.png')

    big = Image.open(WIDE_BIG).convert('RGB')
    sky_fill = np.asarray(big).copy()
    k = sky_fill.shape[1] / AW
    solid_small = ndi.binary_erosion(hit, iterations=4)
    idx = ndi.distance_transform_edt(~solid_small, return_distances=False, return_indices=True)
    need = cv2.resize((~solid_small).astype(np.uint8), (sky_fill.shape[1], sky_fill.shape[0]), interpolation=cv2.INTER_NEAREST) > 0
    sy = cv2.resize(idx[0].astype(np.float32), (sky_fill.shape[1], sky_fill.shape[0]), interpolation=cv2.INTER_LINEAR)
    sx = cv2.resize(idx[1].astype(np.float32), (sky_fill.shape[1], sky_fill.shape[0]), interpolation=cv2.INTER_LINEAR)
    moved = cv2.remap(sky_fill, (sx + 0.5) * k - 0.5, (sy + 0.5) * k - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    sky_fill[need] = moved[need]
    full = Image.fromarray(sky_fill)
    full.save(PUB + 'full/deck-color.jpg', quality=93, subsampling=0)
    full.resize((sky_fill.shape[1] // 2, sky_fill.shape[0] // 2), Image.LANCZOS).save(PUB + 'web/deck-color.jpg', quality=91, subsampling=0)
    full.resize((1408, 792), Image.LANCZOS).save(WORK + 'deck-color-v.jpg', quality=88)

    fw, fh = FAR_BASE
    jj, ii = np.meshgrid((np.arange(fw) + 0.5) / fw, (np.arange(fh) + 0.5) / fh)
    spsi = (jj * 2 - 1) * T.PSI_MAX
    s = T.S0 * np.exp(ii * np.log(T.S1 / T.S0))
    sp, sn = T.surface(spsi, s)
    dist = np.linalg.norm(sp, axis=-1)
    sd = sp / dist[..., None]
    smu = -np.sum(sn * sd, -1)
    px, py, front = T.project_wide(sp, AW, AH)
    inside = front & (px > 6) & (px < AW - 6) & (py > 6) & (py < AH - 6) & (smu > 0.03)
    real = cv2.remap(a_img.astype(np.float32), (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    x = s * np.sin(spsi)
    z = s * np.cos(spsi)

    rl = np.log(np.maximum(real.mean(-1), 1e-3))
    gx = ndi.sobel(ndi.gaussian_filter(rl, 3), axis=1)
    gy = ndi.sobel(ndi.gaussian_filter(rl, 3), axis=0)
    sel = inside & (s > 2) & (s < 9)
    gpsi = gx[sel] * fw / (2 * T.PSI_MAX) / s[sel]
    gs = gy[sel] * fh / np.log(T.S1 / T.S0) / s[sel]
    ex = gpsi * np.cos(spsi[sel]) + gs * np.sin(spsi[sel])
    ez = -gpsi * np.sin(spsi[sel]) + gs * np.cos(spsi[sel])
    jxx, jzz, jxz = (ex * ex).mean(), (ez * ez).mean(), (ex * ez).mean()
    grad_angle = 0.5 * np.arctan2(2 * jxz, jxx - jzz)
    angle = grad_angle + np.pi / 2
    coh = np.hypot(jxx - jzz, 2 * jxz) / (jxx + jzz)
    print('streak direction deg from x toward z', np.degrees(angle), 'coherence', coh)

    hp = rl - ndi.gaussian_filter(rl, 40)
    target = float(np.std(hp[sel & (np.abs(hp) < 0.5)]))
    syn = streaks(x, z, angle, 11)
    tone = streaks(x, z, angle, 301)
    amount = target * 1.6
    core = ndi.binary_erosion(inside, iterations=70)
    rlum = np.maximum(real.mean(-1), 1e-3)
    lit = core & (lookup(light, (spsi / T.PSI_MAX * 0.5 + 0.5).astype(np.float32), T.light_row(smu).astype(np.float32)).mean(-1) > 0.06)
    ll = np.log(rlum[lit])
    line = [np.polyfit(ll, np.log(np.maximum(real[..., c][lit], 1e-3)), 1) for c in range(3)]
    low = ndi.gaussian_filter(np.where(core, np.log(rlum), 0), 40) / np.maximum(ndi.gaussian_filter(core.astype(np.float32), 40), 1e-3)
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    dist = ndi.distance_transform_edt(~core)
    base = ndi.gaussian_filter(low[idx[0], idx[1]], 50)
    glob = float(np.median(ll))
    base = base + (glob - base) * smooth(60, 700, dist)
    lsyn = base + amount * syn
    syn_rgb = np.stack([np.exp(line[c][1] + line[c][0] * lsyn) * (1 + (0.03, 0.01, -0.01)[c] * tone) for c in range(3)], -1)
    reach = np.minimum(np.minimum(px / AW, 1 - px / AW), 1 - py / AH) + RAGGED * tone
    w = smooth(0.05, 0.95, ndi.gaussian_filter(ndi.binary_erosion(inside, iterations=10).astype(np.float32), 6)) * smooth(REACH[0], REACH[1], reach)
    w = w[..., None]
    print('albedo colour line slope per channel', [round(float(l[0]), 3) for l in line], 'median', float(np.exp(glob)))
    far = real * w + syn_rgb * (1 - w)
    print('synth amount', amount, 'real fraction', float(inside.mean()))

    gw, gh = FAR['full']
    enc = np.zeros((gh, gw, 3), np.uint8)
    rows = 256
    for r0 in range(0, gh, rows):
        r1 = min(r0 + rows, gh)
        jf, kf = np.meshgrid((np.arange(gw) + 0.5) / gw, (np.arange(r0, r1) + 0.5) / gh)
        psf = (jf * 2 - 1) * T.PSI_MAX
        sf = T.S0 * np.exp(kf * np.log(T.S1 / T.S0))
        spf = T.surface(psf, sf)[0]
        pxf, pyf, _ = T.project_wide(spf, AW, AH)
        realf = cv2.remap(a_img.astype(np.float32), (pxf - 0.5).astype(np.float32), (pyf - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        xf, zf = sf * np.sin(psf), sf * np.cos(psf)
        mu = (jf * fw - 0.5).astype(np.float32)
        mv = (kf * fh - 0.5).astype(np.float32)
        up = lambda v: cv2.remap(np.ascontiguousarray(v.astype(np.float32)), mu, mv, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        lf = up(base) + amount * streaks(xf, zf, angle, 11, FAR_FINE)
        tf = streaks(xf, zf, angle, 301, FAR_FINE)
        synf = np.stack([np.exp(line[c][1] + line[c][0] * lf) * (1 + (0.03, 0.01, -0.01)[c] * tf) for c in range(3)], -1)
        wf = np.clip(up(w[..., 0]), 0, 1)[..., None]
        fine = realf * wf + synf * (1 - wf)
        enc[r0:r1] = (np.sqrt(np.clip(fine / A_MAX, 0, 1)) * 255 + 0.5).astype(np.uint8)
    img = Image.fromarray(enc[::-1])
    img.save(PUB + 'full/deck-far.jpg', quality=93, subsampling=0)
    img.resize(FAR['web'], Image.LANCZOS).save(PUB + 'web/deck-far.jpg', quality=92, subsampling=0)
    img.resize((2048, 1024), Image.LANCZOS).save(WORK + 'deck-far-view.jpg', quality=88)

    fl = far.mean(-1)
    base = ndi.gaussian_filter(np.minimum(fl, 1.6), 30)
    wisp = np.clip((fl / np.maximum(base, 0.2) - 1.12) / 1.3, 0, 1) * w[..., 0]
    wisp = ndi.gaussian_filter(wisp, 3)
    hmap = cv2.resize(wisp.astype(np.float32), HEIGHT, interpolation=cv2.INTER_AREA) * CLOUD_HEIGHT
    hmap = ndi.gaussian_filter(hmap, 1.0).astype(np.float32)
    for key in ('full', 'web'):
        hmap.tofile(PUB + key + '/deck-height.bin')
    print('height max', float(hmap.max()), 'mean', float(hmap.mean()))
    Image.fromarray((np.clip(hmap / CLOUD_HEIGHT, 0, 1) * 255).astype(np.uint8)[::-1]).save(WORK + 'deck-height.png')

    json.dump({
        'centre': T.CENTRE.tolist(), 'radius': T.R, 'up': T.UP.tolist(), 'f0': T.F0.tolist(), 'r0': T.R0.tolist(), 'sun': T.SUN.tolist(),
        'psiMax': T.PSI_MAX, 's0': T.S0, 's1': T.S1, 'epsMax': T.EPS_MAX, 'lightSize': list(T.LIGHT), 'haloSize': list(T.HALO),
        'heightSize': list(HEIGHT), 'farSize': {k: list(v) for k, v in FAR.items()}, 'aMax': A_MAX, 'eps': EPS, 'flowAngle': float(angle),
        'imageSize': {'full': [sky_fill.shape[1], sky_fill.shape[0]], 'web': [sky_fill.shape[1] // 2, sky_fill.shape[0] // 2]}, 'vfovDeg': T.VFOV, 'window': list(T.WIDE),
    }, open('src/stops/uranus/deck.json', 'w'), indent=1)


main()
