import sys
import numpy as np
import cv2
from geo import *

MW, MH = 8192, 4096
LIMB = (0.2, 0.42)
CAP = (0.6, 0.8)
CURVE = (0.33, 0.36)


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


def main():
    hero = cv2.cvtColor(cv2.imread(HERO2), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    s = hero.shape[1] / W
    out = np.zeros((MH, MW, 3), dtype=np.float32)
    cap_list = caps()
    dirs_all = None
    CH = 256
    for y0 in range(0, MH, CH):
        d = map_dirs(MW, MH)[y0:y0 + CH] if False else None
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
        acc = np.zeros_like(own)
        wsum = np.zeros(mu.shape, dtype=np.float32)
        need = wh < 0.999
        if need.any():
            for m, seed, freq in cap_list:
                dd = d @ m
                qx, qy, qmu = project(dd, s)
                w = step(qmu, CAP[0], CAP[1]).astype(np.float32)
                if not (w[need] > 0).any():
                    continue
                w = (w * (1 + 0.45 * wobble(d, seed, freq))) ** 8
                src = sample(hero, np.where(w > 0, qx, 0), np.where(w > 0, qy, 0))
                src = code(scene(np.clip(src, 0, 1)) / limb_curve(qmu)[..., None])
                acc += src * w[..., None]
                wsum += w
            fill = acc / np.maximum(wsum, 1e-6)[..., None]
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
