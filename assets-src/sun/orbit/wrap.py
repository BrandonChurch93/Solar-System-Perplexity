import sys
import numpy as np
import cv2
from geo import *

MW, MH = 8192, 4096
LIMB = (0.2, 0.42)
CAP = (0.6, 0.8)
CURVE = (0.33, 0.36)
ZONE = (50, 125)
GRID = 0.1
SIGMA = 1.3
TRUST = 0.12
FAR = (100, 122)
GAIN = (0.12, 3)
DETAIL = (0.35, 1.15)
TOP = 1.0
WARM = (0.2, 0.35)


def limb_curve(mu):
    return (CURVE[0] + CURVE[1] * (1 - np.clip(mu, 0, 1))) / CURVE[0]


def rot(axis, ang):
    axis = np.asarray(axis, dtype=np.float64)
    axis /= np.linalg.norm(axis)
    x, y, z = axis
    c, s = np.cos(ang), np.sin(ang)
    return np.array([[c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s], [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s], [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)]])


def caps():
    rng = np.random.default_rng(7)
    t = (1 + 5 ** 0.5) / 2
    v = np.array([[0, 1, t], [0, -1, t], [0, 1, -t], [0, -1, -t], [1, t, 0], [-1, t, 0], [1, -t, 0], [-1, -t, 0], [t, 0, 1], [t, 0, -1], [-t, 0, 1], [-t, 0, -1]], dtype=np.float64)
    v /= np.linalg.norm(v, axis=1, keepdims=True)
    tilt = rot([1, 0.3, 0.1], 0.31)
    v = v @ tilt.T
    front = CAM / np.linalg.norm(CAM)
    out = []
    for i, c in enumerate(v):
        axis = np.cross(front, c)
        ang = np.arccos(np.clip(front @ c, -1, 1))
        if np.linalg.norm(axis) < 1e-6:
            axis = np.array([0, 1, 0])
        m = rot(axis, ang) @ rot(front, rng.uniform(0, 2 * np.pi))
        out.append((m, rng.uniform(0, 100, 3), rng.uniform(0.6, 1.4, (4, 3)) * rng.choice([-1, 1], (4, 3)) * 9))
    return out


def wobble(d, seed, freq):
    n = np.zeros(d.shape[:-1], dtype=np.float32)
    for k in range(4):
        n += np.sin(d @ freq[k] + seed[k % 3] * (k + 1)).astype(np.float32)
    return n / 4


def fill_at(hero, s, cap_list, d, need=None):
    acc = np.zeros(d.shape, dtype=np.float32)
    wsum = np.zeros(d.shape[:-1], dtype=np.float32)
    for m, seed, freq in cap_list:
        dd = d @ m
        qx, qy, qmu = project(dd, s)
        w = step(qmu, CAP[0], CAP[1]).astype(np.float32)
        if need is not None and not (w[need] > 0).any():
            continue
        w = (w * (1 + 0.45 * wobble(d, seed, freq))) ** 8
        src = sample(hero, np.where(w > 0, qx, 0), np.where(w > 0, qy, 0))
        src = scene(np.clip(src, 0, 1)) / limb_curve(qmu)[..., None]
        acc += src.astype(np.float32) * w[..., None]
        wsum += w
    return acc / np.maximum(wsum, 1e-6)[..., None]


def basis():
    front = CAM / np.linalg.norm(CAM)
    e1 = np.cross([0, 1, 0], front)
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(front, e1)
    return front, e1, e2


def level(hero, s, cap_list):
    front, e1, e2 = basis()
    na = int(round((ZONE[1] - ZONE[0]) / GRID))
    nt = int(round(360 / GRID))
    alpha = np.radians(ZONE[0] + (np.arange(na) + 0.5) * GRID)[:, None]
    theta = np.radians((np.arange(nt) + 0.5) * GRID)[None, :]
    d = (np.sin(alpha) * np.cos(theta))[..., None] * e1 + (np.sin(alpha) * np.sin(theta))[..., None] * e2 + (np.cos(alpha) * np.ones_like(theta))[..., None] * front
    px, py, mu = project(d, s)
    own = scene(np.clip(sample(hero, px, py), 0, 1)) / limb_curve(mu)[..., None]
    fill = fill_at(hero, s, cap_list, d)
    ok = (mu > TRUST).astype(np.float32)
    sig = SIGMA / GRID

    def low(a, m):
        pad = int(4 * sig)
        a = np.concatenate([a[:, -pad:], a, a[:, :pad]], 1)
        m = np.concatenate([m[:, -pad:], m, m[:, :pad]], 1)
        num = cv2.GaussianBlur(a * m[..., None], (0, 0), sig)
        num = num[..., None] if num.ndim == 2 else num
        den = cv2.GaussianBlur(m, (0, 0), sig)
        return (num / np.maximum(den, 1e-6)[..., None])[:, pad:-pad], den[:, pad:-pad]

    log_own = np.log(np.maximum(own, 1e-3)).astype(np.float32)
    log_fill = np.log(np.maximum(fill, 1e-3)).astype(np.float32)
    one = np.ones_like(ok)
    lo_own, den = low(log_own, ok)
    lo_fill, _ = low(log_fill, one)
    amp_own, _ = low(((log_own - lo_own) ** 2).mean(-1, keepdims=True), ok)
    amp_fill, _ = low(((log_fill - lo_fill) ** 2).mean(-1, keepdims=True), one)
    last = np.argmax(den < 0.5, axis=0)
    last = np.where((den < 0.5).any(0), last, na) - 1
    rows = np.minimum(np.arange(na)[:, None], last[None, :])
    target = np.take_along_axis(lo_own, rows[..., None].repeat(3, 2), 0)
    amp_own = np.take_along_axis(amp_own, rows[..., None], 0)
    gain = np.clip(target - lo_fill, np.log(GAIN[0]), np.log(GAIN[1]))
    k = np.clip(np.sqrt(amp_own / np.maximum(amp_fill, 1e-6)), DETAIL[0], DETAIL[1])
    a_deg = ZONE[0] + (np.arange(na) + 0.5) * GRID
    far = (1 - step(a_deg, FAR[0], FAR[1]))[:, None, None].astype(np.float32)
    print('level gain low', np.exp(np.percentile(gain, 2)), 'high', np.exp(np.percentile(gain, 98)), 'detail median', np.median(k), 'low', np.percentile(k, 2), 'high', np.percentile(k, 98), flush=True)
    return np.concatenate([lo_fill, gain * far, 1 + (k - 1) * far, far * np.ones_like(k)], -1).astype(np.float32)


def level_at(table, d, fill):
    front, e1, e2 = basis()
    alpha = np.degrees(np.arccos(np.clip(d @ front, -1, 1)))
    theta = np.degrees(np.arctan2(d @ e2, d @ e1)) % 360
    y = (alpha - ZONE[0]) / GRID - 0.5
    x = theta / GRID - 0.5
    g = np.concatenate([table[:, -1:], table, table[:, :1]], 1)
    mx = (x + 1).astype(np.float32)
    my = np.clip(y, 0, table.shape[0] - 1).astype(np.float32)
    t = np.stack([cv2.remap(g[..., c], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in range(8)], -1)
    lo, gain, k = t[..., 0:3], t[..., 3:6], t[..., 6:7]
    raw = np.log(np.maximum(fill, 1e-3)) - lo
    dev = np.minimum(raw, TOP)
    dev[..., 1] = np.minimum(dev[..., 1], dev[..., 0] + WARM[0])
    dev[..., 2] = np.minimum(dev[..., 2], dev[..., 0] + WARM[1])
    out = np.exp(lo + gain + k * (raw + (dev - raw) * t[..., 7:8]))
    off = (alpha < ZONE[0]) | (alpha > ZONE[1])
    out[off] = fill[off]
    return out


def main():
    hero = cv2.cvtColor(cv2.imread(HERO2), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    s = hero.shape[1] / W
    out = np.zeros((MH, MW, 3), dtype=np.float32)
    cap_list = caps()
    gain = level(hero, s, cap_list)
    CH = 256
    for y0 in range(0, MH, CH):
        v = (np.arange(y0, min(y0 + CH, MH)) + 0.5) / MH
        u = (np.arange(MW) + 0.5) / MW
        lon = (u - 0.5) * 2 * np.pi
        lat = (0.5 - v) * np.pi
        cl = np.cos(lat)[:, None]
        d = np.stack([cl * np.sin(lon)[None, :], np.repeat(np.sin(lat)[:, None], MW, 1), cl * np.cos(lon)[None, :]], -1)
        px, py, mu = project(d, s)
        wh = step(mu, LIMB[0], LIMB[1]).astype(np.float32)
        own = sample(hero, px, py)
        own = code(scene(np.clip(own, 0, 1)) / limb_curve(mu)[..., None])
        need = wh < 0.999
        if need.any():
            fill = code(level_at(gain, d, fill_at(hero, s, cap_list, d, need)))
            own = own * wh[..., None] + fill * (1 - wh[..., None])
        out[y0:y0 + CH] = own
        print('rows', y0, flush=True)
    full = sys.argv[1]
    web = sys.argv[2]
    cv2.imwrite(full, cv2.cvtColor((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 94, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    small = cv2.resize(out, (MW // 2, MH // 2), interpolation=cv2.INTER_AREA)
    cv2.imwrite(web, cv2.cvtColor((np.clip(small, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 94, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    cv2.imwrite(WORK + '/wrap-preview.jpg', cv2.cvtColor((np.clip(cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA), 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])


main()
