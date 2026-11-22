import sys
import numpy as np
import cv2
from geo import *

ZOOM = 2.0
COUNT = 64
CAPS = (0.6, 0.8)
CURVE = (0.33, 0.36)
HIGH = 12.0
PLAIN = {'wide': 20.0, 'level': (0.10, 0.22, 0.80, 0.93), 'rough': (0.80, 0.95)}
REACH = (0.5, 0.78)
LIMIT = 0.7


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
    lum = luma(lg)
    wide = cv2.GaussianBlur(lum, (0, 0), PLAIN['wide'])
    rough = np.sqrt(cv2.GaussianBlur(luma(high) ** 2, (0, 0), PLAIN['wide']))
    cap = mu > CAPS[1]
    q = np.quantile(wide[cap], PLAIN['level'])
    r = np.quantile(rough[cap], PLAIN['rough'])
    plain = step(wide, q[0], q[1]) * (1 - step(wide, q[2], q[3])) * (1 - step(rough, r[0], r[1]))
    high = np.clip(high, -LIMIT, LIMIT)
    print('source: plain share in the cap', float(plain[cap].mean()), 'rms of the fine part', float(np.sqrt((luma(high)[cap] ** 2).mean())), flush=True)
    return np.concatenate([high * plain[..., None], plain[..., None]], -1).astype(np.float32)


def wobble(d, seed, freq):
    n = np.zeros(d.shape[:-1], dtype=np.float32)
    for k in range(4):
        n += np.sin(d @ freq[k] + seed[k % 3] * (k + 1)).astype(np.float32)
    return n / 4


def layer(d, src, cs):
    front = CAM / np.linalg.norm(CAM)
    near = np.cos(np.radians(40.0) / ZOOM * 1.02)
    acc = np.zeros(d.shape[:-1] + (4,), dtype=np.float32)
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
        got = cv2.remap(src, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).reshape(-1, 4)[:pick.size]
        acc.reshape(-1, 4)[pick] += got * w[:, None]
        wsum.reshape(-1)[pick] += w
    out = acc / np.maximum(wsum, 1e-6)[..., None]
    return out[..., :3] / np.maximum(out[..., 3:4], 0.35) * step(out[..., 3:4], 0.05, 0.35)


def reach(mu):
    return (1 - step(mu, REACH[0], REACH[1])).astype(np.float32)


def build(path, mw=8192, mh=4096):
    src = source()
    cs = centres()
    out = np.zeros((mh, mw, 3), dtype=np.float16)
    ch = 256
    for y0 in range(0, mh, ch):
        v = (np.arange(y0, min(y0 + ch, mh)) + 0.5) / mh
        u = (np.arange(mw) + 0.5) / mw
        lon = (u - 0.5) * 2 * np.pi
        lat = (0.5 - v) * np.pi
        cl = np.cos(lat)[:, None]
        d = np.stack([cl * np.sin(lon)[None, :], np.repeat(np.sin(lat)[:, None], mw, 1), cl * np.cos(lon)[None, :]], -1)
        out[y0:y0 + ch] = layer(d, src, cs)
        print('rows', y0, flush=True)
    np.save(path, out)


if __name__ == '__main__':
    build(sys.argv[1])
