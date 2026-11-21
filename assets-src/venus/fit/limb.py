import json
import sys
import cv2
import numpy as np
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/venus')
from geo import CAM, SUN, DISC, ROOT, WORK, encode, scene

NA, HALF, INSIDE, OUTSIDE = 64, 128, 0.3, 0.6
SUB = 24
HOLD = 0.002
HOLD_FILM = 0.005
SA, SB, VEIL = 1.2, 2.5, 0.8
LUMA = np.array([0.2126, 0.7152, 0.0722])
D = float(np.linalg.norm(CAM))
V = -CAM / D
S = SUN - V * (SUN @ V)
SUN_AZ = float(np.arctan2(S[1], S[0]))


def load(path):
    a = cv2.imread(path, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255
    return scene(a).astype(np.float32)


def edge_points(img):
    k = img.shape[1] / 2816
    cx, cy, r = DISC[0] * k, DISC[1] * k, DISC[2] * k
    lum = (img @ LUMA).astype(np.float32)
    out = []
    for th in np.arange(-180, 180, 2.0):
        t = np.radians(th)
        rr = np.arange(r * 0.97, r * 1.03, 0.1)
        x = cx + rr * np.cos(t)
        y = cy - rr * np.sin(t)
        p = cv2.remap(lum, (x - 0.5).astype(np.float32)[None], (y - 0.5).astype(np.float32)[None], cv2.INTER_CUBIC)[0]
        p = np.convolve(p, np.ones(11) / 11, 'same')
        g = np.diff(p)
        i = int(np.argmin(g[15:-15])) + 15
        out.append((x[i] / k, y[i] / k, -g[i] * 10 * k))
    return np.array(out)


def fit_ellipse(pts, min_step, round_only=False):
    p = pts[pts[:, 2] > min_step]
    keep = np.ones(len(p), bool)
    for _ in range(6):
        x, y = p[keep, 0], p[keep, 1]
        if round_only:
            a = np.stack([2 * x, 2 * y, np.ones_like(x)], 1)
            c = np.linalg.lstsq(a, x * x + y * y, rcond=None)[0]
            cx, cy = c[0], c[1]
            ra = rb = np.sqrt(c[2] + cx * cx + cy * cy)
        else:
            a = np.stack([x * x, y * y, x, y], 1)
            c = np.linalg.lstsq(a, np.ones_like(x), rcond=None)[0]
            cx, cy = -c[2] / (2 * c[0]), -c[3] / (2 * c[1])
            f = 1 + c[0] * cx * cx + c[1] * cy * cy
            ra, rb = np.sqrt(f / c[0]), np.sqrt(f / c[1])
        err = np.hypot((p[:, 0] - cx) / ra, (p[:, 1] - cy) / rb) - 1
        keep = np.abs(err) < max(2.5 * np.std(err[keep]), 0.0012)
    return float(cx), float(cy), float(ra), float(rb), float(np.std(err[keep]) * ra), int(keep.sum())


def rows():
    s = np.arange(HALF) / (HALF - 1)
    return 1 - INSIDE * s * s, 1 + OUTSIDE * s * s


def edge_dev(img, geom):
    cx, cy, ra, rb = geom[:4]
    lum = (img @ LUMA).astype(np.float32)
    n = 720
    dev = np.zeros(n)
    for i in range(n):
        t = -np.pi + 2 * np.pi * i / n
        r0 = 1 / np.hypot(np.cos(t) / ra, np.sin(t) / rb)
        rr = np.arange(r0 * 0.97, r0 * 1.03, 0.1)
        x = cx + rr * np.cos(t)
        y = cy - rr * np.sin(t)
        p = cv2.remap(lum, (x - 0.5).astype(np.float32)[None], (y - 0.5).astype(np.float32)[None], cv2.INTER_CUBIC)[0]
        p = np.convolve(p, np.ones(11) / 11, 'same')
        g = np.diff(p)
        dev[i] = rr[int(np.argmin(g[15:-15])) + 15] - r0
    idx = np.arange(n)
    for size, tol in ((61, 4.0), (15, 1.5)):
        ok = np.abs(dev - ndi.median_filter(dev, size, mode='wrap')) < tol
        dev = np.interp(idx, np.concatenate([idx[ok] - n, idx[ok], idx[ok] + n]), np.tile(dev[ok], 3))
    return ndi.gaussian_filter1d(dev, 5, mode='wrap')


def radius(geom, dev, th):
    cx, cy, ra, rb = geom[:4]
    r0 = 1 / np.hypot(np.cos(th) / ra, np.sin(th) / rb)
    if dev is None:
        return r0
    n = len(dev)
    f = ((th + np.pi) / (2 * np.pi) * n) % n
    i = np.floor(f).astype(int)
    return r0 + dev[i % n] * (1 - (f - i)) + dev[(i + 1) % n] * (f - i)


def polar(img, geom, dev, bs):
    k = img.shape[1] / 2816
    cx, cy = geom[:2]
    phi = -np.pi + 2 * np.pi * (np.arange(NA * SUB) + 0.5 - SUB / 2) / (NA * SUB)
    pp, bb = np.meshgrid(phi, bs)
    rho = bb * np.sqrt((D * D - 1) / (D * D - bb * bb))
    th = SUN_AZ - pp
    th = (th + np.pi) % (2 * np.pi) - np.pi
    r = radius(geom, dev, th) * rho
    x = (cx + r * np.cos(th)) * k
    y = (cy - r * np.sin(th)) * k
    out = cv2.remap(img, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out.reshape(len(bs), NA, SUB, 3)


def smooth(a, sa, sb):
    if a.ndim == 2:
        return ndi.gaussian_filter(a, (sb, sa), mode=('nearest', 'wrap'))
    return np.stack([ndi.gaussian_filter(a[..., c], (sb, sa), mode=('nearest', 'wrap')) for c in range(a.shape[-1])], -1)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def held(a, bs, inside, hold):
    n = int(np.argmax((1 - bs if inside else bs - 1) >= hold))
    a = a.copy()
    a[:n] = a[n]
    return a


def coverage(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)[..., :3].astype(np.float64).max(-1)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    k = 2816 / a.shape[1]
    r = float(np.sqrt(a.sum() / a.max() / np.pi) * k)
    return [float((a * (xx + 0.5)).sum() / a.sum() * k), float((a * (yy + 0.5)).sum() / a.sum() * k), r, r]


def profiles(hero, film, gh, gf, dev, hold_h, hold_f):
    b_in, b_out = rows()
    h_in = held(np.median(polar(hero, gh, dev, b_in), axis=2), b_in, True, hold_h)
    f_in = held(np.median(polar(film, gf, None, b_in), axis=2), b_in, True, hold_f)
    ho = polar(hero, gh, dev, b_out)
    low = np.percentile(ho, 25, axis=2)
    far = smooth(np.median(low[(b_out > 1.42) & (b_out < 1.6)], axis=0, keepdims=True), 3, 0)
    h_out = held(low - far, b_out, False, hold_h)
    f_out = held(np.median(polar(film, gf, None, b_out), axis=2), b_out, False, hold_f)
    return smooth(h_in, SA, SB), smooth(f_in, SA, SB), smooth(h_out, SA, SB), smooth(f_out, SA, SB)


def taper():
    s = np.arange(HALF) / (HALF - 1)
    return np.clip((1 - s) / 0.12, 0, 1)[:, None]


def build(h_in, f_in, h_out, f_out):
    b_in, _ = rows()
    mu = np.sqrt(np.maximum(1 - b_in * b_in, 0))[:, None]
    base = VEIL * (1 - step(mu, 0.08, 0.42)) * np.ones((1, NA))
    need = 1 - np.min(h_in / np.maximum(f_in, 1e-4), axis=-1)
    alpha = smooth(np.clip(np.maximum(base, need), 0, 0.97), SA, SB) * taper()
    rgb_in = np.maximum(h_in - f_in * (1 - alpha[..., None]), 0) * taper()[..., None]
    return rgb_in, alpha, outside(h_out - f_out)


def outside(glow):
    glow = np.maximum(glow, 0)
    lum = glow @ LUMA
    lit = lum[0] > 0.5 * lum[0].max()
    shape = np.percentile(lum[:, lit] / lum[:1, lit], 75, axis=1)
    cap = np.minimum(1, lum[:1] * shape[:, None] * 1.25 / np.maximum(lum, 1e-6))
    return np.minimum.accumulate(glow * cap[..., None], axis=0) * taper()[..., None]


def write(rgb_in, alpha, rgb_out):
    lut = np.zeros((2 * HALF, NA + 1, 4), np.float32)
    lut[:HALF, :NA, :3] = rgb_in[::-1]
    lut[:HALF, :NA, 3] = alpha[::-1]
    lut[HALF:, :NA, :3] = rgb_out
    lut[:, NA] = lut[:, 0]
    for key in ('full', 'web'):
        lut.tofile(ROOT + '/public/assets/venus/' + key + '/limb.bin')
    np.savez(WORK + '/limb-lut.npz', rgb_in=rgb_in, alpha=alpha, rgb_out=rgb_out)
    view = np.concatenate([encode(np.maximum(lut[..., :3], 0)), np.repeat(lut[..., 3:], 3, -1)], 1)
    cv2.imwrite(WORK + '/limb-lut.png', (view[..., ::-1] * 255).astype(np.uint8).repeat(3, 0).repeat(8, 1))
    b_in, b_out = rows()
    for name, col in (('sun', NA // 2), ('+45', NA // 2 + 8), ('+90', NA // 2 + 16), ('-90', NA // 2 - 16), ('anti', 0)):
        print(name, 'in', ' '.join('%.2f/%.2f@%.3f' % (rgb_in[j, col, 1], alpha[j, col], b_in[j]) for j in (2, 14, 20, 30, 45, 60, 80, 100)), '| out', ' '.join('%.3f@%.3f' % (rgb_out[j, col, 1], b_out[j]) for j in (2, 14, 20, 30, 45, 60, 80, 110)))


if __name__ == '__main__':
    mode, film_path = sys.argv[1], sys.argv[2]
    hero = load(ROOT + '/references/approved/venus-hero.png')
    film = load(film_path)
    gh = fit_ellipse(edge_points(hero), 0.3)
    gf = coverage(sys.argv[3]) if mode == 'build' else json.load(open(WORK + '/limb-geom.json'))['film']
    dev = edge_dev(hero, gh)
    print('hero disc', np.round(gh, 3), 'film disc', np.round(gf, 3), 'hero edge past the ellipse, px', dev.min().round(2), dev.max().round(2))
    json.dump({'hero': gh, 'film': gf, 'dev': dev.round(3).tolist()}, open(WORK + '/limb-geom.json', 'w'))
    h_in, f_in, h_out, f_out = profiles(hero, film, gh, gf, dev, HOLD if mode == 'build' else HOLD_FILM, HOLD_FILM)
    if mode == 'build':
        write(*build(h_in, f_in, h_out, f_out))
    else:
        old = np.load(WORK + '/limb-lut.npz')
        gain = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8
        d_in = (h_in - f_in) * taper()[..., None]
        d_out = (h_out - f_out) * taper()[..., None]
        print('residual in rms %.4f out rms %.4f' % (np.sqrt((d_in ** 2).mean()), np.sqrt((d_out ** 2).mean())))
        rgb_in = old['rgb_in'] + d_in * gain
        over = np.maximum(-rgb_in, 0).max(axis=-1) / np.maximum(f_in.max(axis=-1), 1e-3)
        alpha = np.clip(old['alpha'] + smooth(over, SA, SB) * (1 - old['alpha']), 0, 0.97)
        write(np.maximum(rgb_in, 0), alpha, outside(old['rgb_out'] + d_out * gain))
