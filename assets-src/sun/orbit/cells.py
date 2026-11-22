import sys
import numpy as np
import cv2
from geo import *

ZOOM = 1.5
COUNT = 40
CAPS = (0.6, 0.8)
CURVE = (0.33, 0.36)
HIGH = 12.0
PLAIN = {'wide': 20.0, 'level': (0.12, 0.90), 'rough': (0.90,), 'grow': 22, 'soft': 4.0, 'shifts': ((163, 41), (-127, 131), (61, -173), (-211, -67), (233, 151), (-89, 263), (307, -113), (-283, 199), (97, 337), (-353, -41))}
REACH = (0.4, 0.62)
LIMIT = 0.7
GAIN = 0.8
CAP = 0.3
DARK = {'wide': 10.0, 'from': -1.3, 'to': -0.8}


def limb_curve(mu):
    return (CURVE[0] + CURVE[1] * (1 - np.clip(mu, 0, 1))) / CURVE[0]


def rot(axis, ang):
    axis = np.asarray(axis, dtype=np.float64)
    axis /= np.linalg.norm(axis)
    x, y, z = axis
    c, s = np.cos(ang), np.sin(ang)
    return np.array([[c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s], [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s], [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)]])


def centres():
    rng = np.random.default_rng(11)
    i = np.arange(COUNT) + 0.5
    polar = np.arccos(1 - 2 * i / COUNT)
    turn = np.pi * (1 + 5 ** 0.5) * i
    v = np.stack([np.sin(polar) * np.cos(turn), np.cos(polar), np.sin(polar) * np.sin(turn)], -1)
    front = CAM / np.linalg.norm(CAM)
    out = []
    for c in v:
        axis = np.cross(front, c)
        ang = np.arccos(np.clip(front @ c, -1, 1))
        if np.linalg.norm(axis) < 1e-6:
            axis = np.array([0, 1, 0])
        m = rot(axis, ang) @ rot(front, rng.uniform(0, 2 * np.pi))
        out.append((c, m, rng.uniform(0, 100, 3), rng.uniform(0.6, 1.4, (4, 3)) * rng.choice([-1, 1], (4, 3)) * 23))
    return out


def source():
    hero = load(HERO)
    yy, xx = np.mgrid[0:hero.shape[0], 0:hero.shape[1]].astype(np.float32)
    rr = np.hypot(xx + 0.5 - CX, yy + 0.5 - CY) / RPX
    mu = np.sqrt(np.clip(1 - rr * rr, 0, 1))
    lin = scene(np.clip(hero, 0, 1)) / limb_curve(mu)[..., None]
    lg = np.log(np.maximum(lin, 1e-3)).astype(np.float32)
    high = lg - cv2.GaussianBlur(lg, (0, 0), HIGH)
    wide = cv2.GaussianBlur(luma(lg), (0, 0), PLAIN['wide'])
    rough = np.sqrt(cv2.GaussianBlur(luma(high) ** 2, (0, 0), PLAIN['wide']))
    cap = mu > CAPS[1]
    q = np.quantile(wide[cap], PLAIN['level'])
    r = np.quantile(rough[cap], PLAIN['rough'])
    odd = (wide < q[0]) | (wide > q[1]) | (rough > r[0]) | (mu < CAPS[0] - 0.05)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * PLAIN['grow'] + 1, 2 * PLAIN['grow'] + 1))
    odd = cv2.dilate(odd.astype(np.uint8), k)
    plain = 1 - cv2.GaussianBlur(odd.astype(np.float32), (0, 0), PLAIN['soft'])
    plain = step(plain, 0.5, 0.95).astype(np.float32)
    high = np.clip(high, -LIMIT, LIMIT)
    acc = high * plain[..., None]
    have = plain.copy()
    for dx, dy in PLAIN['shifts']:
        m = np.float32([[1, 0, dx], [0, 1, dy]])
        other = cv2.warpAffine(high, m, (high.shape[1], high.shape[0]), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT)
        ok = cv2.warpAffine(plain, m, (high.shape[1], high.shape[0]), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT)
        take = (1 - have) * ok
        acc += other * take[..., None]
        have += take
    print('source: plain share in the cap', float(plain[cap].mean()), 'after the fills', float(have[cap].mean()), 'least', float(have[mu > CAPS[0]].min()), 'rms of the fine part', float(np.sqrt((luma(high)[cap] ** 2).mean())), flush=True)
    return (acc / np.maximum(have, 0.5)[..., None]).astype(np.float32), plain


def wobble(d, seed, freq):
    n = np.zeros(d.shape[:-1], dtype=np.float32)
    for k in range(4):
        n += np.sin(d @ freq[k] + seed[k % 3] * (k + 1)).astype(np.float32)
    return n / 4


def layer(d, src, cs):
    front = CAM / np.linalg.norm(CAM)
    near = np.cos(np.arccos(CAPS[0]) / ZOOM)
    acc = np.zeros(d.shape[:-1] + (3,), dtype=np.float32)
    wsum = np.zeros(d.shape[:-1], dtype=np.float32)
    flat = d.reshape(-1, 3)
    for c, m, seed, freq in cs:
        pick = np.nonzero(flat @ c > near)[0]
        if pick.size == 0:
            continue
        dp = flat[pick]
        dd = dp @ m
        ca = np.clip(dd @ front, -1, 1)
        a = np.arccos(ca)
        t = dd - ca[:, None] * front
        t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
        dz = np.cos(a * ZOOM)[:, None] * front + np.sin(a * ZOOM)[:, None] * t
        qx, qy, qmu = project(dz)
        w = step(qmu, CAPS[0], CAPS[1]).astype(np.float32)
        w = (w * (1 + 0.45 * wobble(dp, seed, freq))) ** 8
        side = 4096
        fill = (-pick.size) % side
        mx = np.concatenate([qx - 0.5, np.zeros(fill)]).astype(np.float32).reshape(-1, side)
        my = np.concatenate([qy - 0.5, np.zeros(fill)]).astype(np.float32).reshape(-1, side)
        got = cv2.remap(src, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).reshape(-1, 3)[:pick.size]
        acc.reshape(-1, 3)[pick] += got * w[:, None]
        wsum.reshape(-1)[pick] += w
    return acc / np.maximum(wsum, 1e-6)[..., None]


def rows(y0, y1, mw, mh):
    v = (np.arange(y0, y1) + 0.5) / mh
    u = (np.arange(mw) + 0.5) / mw
    lon = (u - 0.5) * 2 * np.pi
    lat = (0.5 - v) * np.pi
    cl = np.cos(lat)[:, None]
    return np.stack([cl * np.sin(lon)[None, :], np.repeat(np.sin(lat)[:, None], mw, 1), cl * np.cos(lon)[None, :]], -1)


def build(mw=8192, mh=4096):
    src, _ = source()
    cs = centres()
    out = np.zeros((mh, mw, 3), dtype=np.float16)
    ch = 256
    for y0 in range(0, mh, ch):
        out[y0:y0 + ch] = layer(rows(y0, min(y0 + ch, mh), mw, mh), src, cs)
        print('cells rows', y0, flush=True)
    return out


def apply(out, fine=None):
    mh, mw = out.shape[:2]
    fine = np.minimum((build(mw, mh) if fine is None else fine).astype(np.float32), CAP)
    w = np.zeros((mh, mw), dtype=np.float32)
    ch = 512
    for y0 in range(0, mh, ch):
        w[y0:y0 + ch] = 1 - step(project(rows(y0, min(y0 + ch, mh), mw, mh))[2], REACH[0], REACH[1])
    lin = scene(np.clip(out, 0, 1)).astype(np.float32)
    pad = int(4 * DARK['wide'])
    lum = np.log(np.maximum(luma(lin), 1e-3)).astype(np.float32)
    wide = cv2.GaussianBlur(np.concatenate([lum[:, -pad:], lum, lum[:, :pad]], 1), (0, 0), DARK['wide'])[:, pad:-pad]
    wide = wide - np.median(wide[mh // 4:3 * mh // 4:8, ::8])
    e = (GAIN * w * step(wide, DARK['from'], DARK['to'])).astype(np.float32)
    part = fine[mh // 8:7 * mh // 8:6, ::6].mean(-1).ravel()
    grid = np.linspace(0, GAIN, 17)
    table = np.array([np.log(np.mean(np.exp(x * part))) for x in grid])
    mean = np.interp(e.ravel(), grid, table).reshape(e.shape).astype(np.float32)
    got = code(lin * np.exp(e[..., None] * fine - mean[..., None])).astype(np.float32)
    print('cells: share of the map above half weight', float((e > 0.5 * GAIN).mean()), 'mean change in levels', float(np.abs(got - out).mean() * 255), 'mean correction at full gain', float(table[-1]), flush=True)
    return got


if __name__ == '__main__':
    np.save(sys.argv[1], build())
