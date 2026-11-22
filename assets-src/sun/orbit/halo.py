import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from geo import *
from polar import *
from infinity import fill_scene, fill_floor

FEET = 1.035
TOP = 1.8
DATA_END = 2.6
DATA_START = 1.3
DETACHED = 1.2
TRUST = 0.3
ENVELOPE = (1.25, 1.42)
SMOOTH = 0.03
CLOSE = 72
POWER_BAND = (1.12, 1.26)
FAR_BLEND = 0.18
RIM = (0.02, 0.006)
THIN = (0.35, 0.004)
THIN_AREA = 40
THIN_PAD = 0.1
THIN_SPAN = 3.0
THIN_OPEN = 31
STREAM = {'seed': 23, 'clear': 0.006, 'soft': 60, 'fade': 0.3, 'vary': 1.5, 'steep': 4.5, 'least': 3.0, 'bend': 0.12, 'ray': (40, 160), 'group': (6, 24), 'lane': (3, 12), 'lean': (4, 16)}


def interp_rows(img, hole):
    out = img.copy()
    n = img.shape[1]
    idx = np.arange(n)
    for y in range(img.shape[0]):
        h = hole[y]
        if not h.any():
            continue
        if h.all():
            continue
        good = np.where(~h)[0]
        xs = np.concatenate([good - n, good, good + n])
        for c in range(img.shape[2]):
            v = img[y, good, c]
            out[y, h, c] = np.interp(idx[h], xs, np.concatenate([v, v, v]))
    return out


def wave(rng, band):
    k = np.arange(band[0], band[1] + 1)
    v = (rng.uniform(0.5, 1, k.size)[:, None] * np.sin(k[:, None] * cols()[None, :] + rng.uniform(0, 2 * np.pi, k.size)[:, None])).sum(0)
    return (v / np.abs(v).max()).astype(np.float32)


def streamers(cor, rr, edge, power):
    rng = np.random.default_rng(STREAM['seed'])
    x = np.log(np.maximum(rr[:, None] / (edge[None, :] + STREAM['clear']), 1)).astype(np.float32)
    soft = ndi.gaussian_filter1d(cor, STREAM['soft'], axis=1, mode='wrap')
    length = STREAM['fade'] * np.exp(STREAM['vary'] * (0.6 * wave(rng, STREAM['group']) + 0.4 * wave(rng, STREAM['ray'])))
    steep = np.maximum(STREAM['steep'] * wave(rng, STREAM['lane']), STREAM['least'] - power)
    out = np.maximum(soft * np.exp(-steep[None, :] * x)[..., None] + (cor - soft) * np.exp(-x / length[None, :])[..., None], 0).astype(np.float32)
    lean = STREAM['bend'] * wave(rng, STREAM['lean']) * PW / (2 * np.pi)
    mx = ((np.arange(PW, dtype=np.float32)[None, :] - lean[None, :] * x) % PW).astype(np.float32)
    my = np.repeat(np.arange(cor.shape[0], dtype=np.float32)[:, None], PW, 1)
    bent = cv2.remap(out, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    return np.where((x > 0)[..., None], bent, cor)


def main():
    hero = cv2.cvtColor(cv2.imread(HERO2), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    pol, inside = unwrap(hero)
    del hero
    sc = scene(pol).astype(np.float32)
    b = rows()[:, None]
    lum = luma(sc)
    q = (sc[..., 0] - sc[..., 2]) / (sc[..., 0] + sc[..., 2] + 0.02)
    raw = step(q, 0.42, 0.62) * step(lum, 0.006, 0.02) * inside * step(b, 1.003, 1.01) * (1 - step(b, TOP - 0.1, TOP))
    seed = (raw > 0.5) & (b > FEET)
    grown = ndi.binary_propagation(seed, mask=(raw > 0.15) & (b > FEET), structure=np.ones((3, 3)))
    lab, n = ndi.label(grown, structure=np.ones((3, 3)))
    area = ndi.sum(grown, lab, np.arange(1, n + 1))
    top = ndi.maximum(np.broadcast_to(b, lab.shape), lab, np.arange(1, n + 1))
    low = ndi.minimum(np.broadcast_to(b, lab.shape), lab, np.arange(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = ((area > 1500) & (top > 1.06) & (low < 1.12)) | ((area > 400) & (low >= FEET) & (low < DETACHED) & (top < 1.7))
    tall = keep[lab]
    row_feet = int(np.searchsorted(rows(), FEET))
    band = tall[row_feet:row_feet + 40].any(0)
    band = ndi.binary_dilation(band, iterations=12)
    feet = (b <= FEET) & band[None, :] & (raw > 0.15)
    matte = ndi.binary_dilation(tall | feet, structure=np.ones((3, 3)), iterations=10)
    matte &= (b > 1.003) & inside
    soft = ndi.gaussian_filter(matte.astype(np.float32), 5)
    print('matte share', float(matte.mean()), 'components kept', int(keep.sum()))

    calm = inside & ~ndi.binary_dilation(matte, iterations=30) & (lum > 0.03)
    rr = rows()
    ratio = np.ones((PH, 2), np.float32)
    for y in range(PH):
        m = calm[y]
        if m.sum() > 200:
            ratio[y] = [np.median(sc[y, m, 0] / np.maximum(sc[y, m, 2], 1e-4)), np.median(sc[y, m, 1] / np.maximum(sc[y, m, 2], 1e-4))]
        elif y:
            ratio[y] = ratio[y - 1]
    ratio = ndi.gaussian_filter1d(ratio, 12, axis=0, mode='nearest')
    blue = sc[..., 2]
    small = cv2.resize(blue, (PW // 4, PH // 4), interpolation=cv2.INTER_AREA)
    small = cv2.morphologyEx(small, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLOSE // 4, CLOSE // 4)))
    small = cv2.GaussianBlur(small, (0, 0), 2.5)
    base = np.maximum(cv2.resize(small, (PW, PH), interpolation=cv2.INTER_CUBIC), blue * 0)
    est = np.stack([base * ratio[:, None, 0], base * ratio[:, None, 1], base], -1)
    dip = np.clip(1 - blue / np.maximum(base, 1e-5), 0, 1) * soft
    cap = sc / np.maximum(1 - dip, 0.02)[..., None]
    est = np.minimum(est, cap)
    back = sc * (1 - soft[..., None]) + est * soft[..., None]
    alpha = np.where(soft > 0.002, dip, 0).astype(np.float32)
    prom = np.maximum(sc - (1 - alpha[..., None]) * back, 0) * (soft > 0.002)[..., None]
    bg = back
    print('alpha mean in matte', float(alpha[matte].mean()), 'prom luma mean in matte', float(luma(prom)[matte].mean()))
    del est

    clean = np.stack([ndi.grey_opening(bg[..., c], size=(7, 7)) for c in range(3)], -1)
    keep_raw = (1 - step(b, 1.03, 1.07))[..., None]
    cor = bg * keep_raw + clean * (1 - keep_raw)
    star, _ = unwrap(np.load(WORK + '/hero-starmask.npy').astype(np.float32))
    star = np.clip(ndi.maximum_filter(star, size=3) * 1.5, 0, 1)[..., None]
    fine = np.maximum(bg - clean, 0) * (1 - star) * (1 - keep_raw)
    print('fine detail kept, mean luma', float(luma(fine)[inside].mean().round(5)), 'star share', float((star > 0.5)[inside].mean().round(4)))
    wide = luma(np.stack([ndi.grey_opening(bg[..., c], size=(THIN_OPEN, THIN_OPEN)) for c in range(3)], -1))
    thin = (raw > 0.5) & (star[..., 0] < 0.3) & (luma(bg) - wide > THIN[0] * wide + THIN[1]) & (b > 1.05) & (b < 1.9) & ~matte
    del wide
    lab2, n2 = ndi.label(thin, structure=np.ones((3, 3)))
    size = ndi.sum(thin, lab2, np.arange(1, n2 + 1))
    big = np.zeros(n2 + 1, bool)
    big[1:] = size >= THIN_AREA
    thin = big[lab2]
    strand_top = np.where(thin, b, 0).max(0)
    print('thin strands outside the matte', int(big.sum()), 'columns', int((strand_top > 0).sum()), 'highest', float(strand_top.max().round(3)))
    cv2.imwrite(WORK + '/thin-debug.png', ((cv2.resize(thin.astype(np.float32), (2048, 512), interpolation=cv2.INTER_AREA) > 0.01) * 255).astype(np.uint8)[::-1])
    del clean, star, lab2, thin

    edge = frame_edge()
    sky, _ = unwrap(fill_floor(fill_scene()))
    share = cv2.GaussianBlur(luma(sky), (0, 0), 6) / np.maximum(cv2.GaussianBlur(luma(cor), (0, 0), 6), 1e-5)
    doubt = (share > TRUST) & (b > DATA_START)
    reach = np.where(doubt.any(0), rr[np.argmax(doubt, 0)], DATA_END)
    reach = ndi.minimum_filter1d(reach, 81, mode='wrap')
    reach = ndi.gaussian_filter1d(reach, 60, mode='wrap')
    lift = ndi.maximum_filter1d(np.where(strand_top > 0, strand_top + THIN_PAD, 0), int(PW * THIN_SPAN / 360), mode='wrap')
    reach = ndi.gaussian_filter1d(np.maximum(reach, ndi.maximum_filter1d(lift, 61, mode='wrap')), 20, mode='wrap')
    reach = np.maximum(reach, lift)
    print('trusted reach', float(reach.min().round(3)), float(np.median(reach).round(3)), float(reach.max().round(3)))
    cor = np.maximum(cor - sky, 0)
    del sky, share, doubt

    lo, hi = np.searchsorted(rr, POWER_BAND[0]), np.searchsorted(rr, POWER_BAND[1])
    horiz = edge > 1.7
    la = luma(cor)
    ring = np.array([np.median(la[y][horiz]) for y in range(lo, hi)])
    p = -np.polyfit(np.log(rr[lo:hi]), np.log(np.maximum(ring, 1e-6)), 1)[0]
    print('power', round(float(p), 2))
    p = float(np.clip(p, 4.0, 8.0))

    b_end = np.minimum(reach, edge - 0.03)
    start = b_end - 0.07
    amp = np.zeros((PW, 3), np.float32)
    for x in range(PW):
        y0, y1 = np.searchsorted(rr, start[x]), np.searchsorted(rr, b_end[x])
        seg = cor[y0:y1, x]
        ref = (rr[y0:y1] / b_end[x])[:, None] ** p
        amp[x] = np.median(seg * ref, 0)
    amp = ndi.gaussian_filter1d(amp, 1.5, axis=0, mode='wrap')
    model = amp[None, :, :] * (b / b_end[None, :])[..., None] ** (-p)
    stretch = 0.18 * np.clip((b_end - 1) / 0.24, 0, 1)
    blend_end = np.minimum(edge - 0.012, b_end + stretch)
    t = np.clip((b - b_end[None, :]) / np.maximum(blend_end - b_end, 1e-3)[None, :], 0, 1)
    t = (t * t * (3 - 2 * t))[..., None]
    cor = cor * (1 - t) + model * t
    smooth = ndi.gaussian_filter1d(cor, SMOOTH / np.log(B1 / B0) * PH, axis=0, mode='nearest')
    y0 = int(np.searchsorted(rr, ENVELOPE[0]))
    smooth[y0:] = np.minimum.accumulate(smooth[y0:], axis=0)
    t = step(b, ENVELOPE[0], ENVELOPE[1])[..., None]
    cor = cor * (1 - t) + smooth * t
    del smooth
    cor = streamers(cor, rr, edge, p)
    far = step((b - reach[None, :]) / FAR_BLEND, 0, 1)
    rim = 1 - step(b, edge[None, :] - RIM[0], edge[None, :] - RIM[1])
    cor += fine * ((1 - far) * rim * inside)[..., None]
    del fine
    cor *= (1 - step(b, 2.4, 3.0))[..., None]
    np.save(WORK + '/polar-reach.npy', reach.astype(np.float32))
    np.save(WORK + '/polar-soft.npy', soft.astype(np.float16))
    np.save(WORK + '/polar-prom.npy', np.concatenate([prom, alpha[..., None]], -1).astype(np.float16))
    np.save(WORK + '/polar-corona.npy', cor.astype(np.float16))

    vis = lambda a: cv2.cvtColor((code(a)[::-1] * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
    for k, x0 in enumerate([0, 2048, 4096, 6144]):
        stack = np.concatenate([vis(sc)[:, x0:x0 + 2048][PH - 800:], vis(cor)[:, x0:x0 + 2048][PH - 800:], vis(prom)[:, x0:x0 + 2048][PH - 800:]], 0)
        cv2.imwrite(WORK + f'/halo-q{k}.jpg', stack, [cv2.IMWRITE_JPEG_QUALITY, 88])
    small = cv2.resize(np.concatenate([vis(sc), vis(cor), vis(prom)], 0), (2048, 1536), interpolation=cv2.INTER_AREA)
    cv2.imwrite(WORK + '/halo-split.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 88])


if __name__ == '__main__':
    main()
