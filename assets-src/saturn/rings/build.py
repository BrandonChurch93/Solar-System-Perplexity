import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, linear_to_srgb, lum
from extract import align, strip

R0, R1 = 1.20, 2.50
N = 32768
ROW = 8192
INNER, OUTER = 1.2458, 2.3394
axis = R0 + (np.arange(N) + 0.5) / N * (R1 - R0)
per_radius = N / (R1 - R0)


def resample(prof, r0, r1):
    n = prof.shape[0]
    r = r0 + (np.arange(n) + 0.5) / n * (r1 - r0)
    good = np.isfinite(prof[:, 0])
    return np.stack([np.interp(axis, r[good], prof[good, k]) for k in range(3)], -1), np.interp(axis, r, good.astype(float)) > 0.99


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(a, sigma_radii):
    return gaussian_filter1d(a, sigma_radii * per_radius, axis=0, mode="nearest")


def noise(rng, sigma):
    n = gaussian_filter1d(rng.standard_normal(N), sigma, mode="wrap")
    return n / n.std()


def fine(rng, amount):
    out = np.zeros(N)
    for sigma, a in ((14, 1.0), (7, 0.9), (3.5, 0.75), (1.8, 0.55)):
        out += a * noise(rng, sigma)
    out /= out.std()
    gaps = np.ones(N)
    for _ in range(900):
        c = rng.uniform(R0, R1)
        w = rng.uniform(1.2e-4, 7e-4)
        d = rng.uniform(0.15, 0.7)
        gaps *= 1 - d * np.exp(-0.5 * ((axis - c) / w) ** 2)
    lines = np.ones(N)
    for _ in range(500):
        c = rng.uniform(R0, R1)
        w = rng.uniform(1.0e-4, 4e-4)
        d = rng.uniform(0.1, 0.45)
        lines *= 1 + d * np.exp(-0.5 * ((axis - c) / w) ** 2)
    return np.exp(amount * out) * gaps * lines


def pyramid(rgba):
    levels = [rgba]
    while levels[-1].shape[0] > 1:
        a = levels[-1]
        levels.append(0.5 * (a[0::2] + a[1::2]))
    return levels


def pack(profiles):
    rows = []
    layout = []
    for p in profiles:
        starts = []
        for level in pyramid(p):
            starts.append(len(rows))
            n = level.shape[0]
            for i in range(0, n, ROW):
                row = np.zeros((ROW, 4), np.float32)
                chunk = level[i:i + ROW]
                row[:len(chunk)] = chunk
                rows.append(row)
        layout.append(starts)
    return np.stack(rows), layout


def main():
    rng = np.random.default_rng(1806)
    hero, hero_ok = resample(np.load(WORK / "profile-hero.npy"), 1.10, 2.60)
    close_a, a_ok = resample(np.load(WORK / "profile-close-a.npy"), 1.10, 2.60)
    cp = np.load(WORK / "close-polar-lin.npy")
    cok = np.load(WORK / "close-polar-ok.npy")
    na = cp.shape[1]
    az = lambda d: int((d + 75) / 150 * na)
    prof_c, count_c, _ = align(cp, cok, list(range(az(-45), az(-39), 2)), az(-42) // 2 * 2, 4.0, sigma=2.0)
    np.save(WORK / "profile-close-c.npy", prof_c)
    close_c, c_ok = resample(prof_c, 1.10, 2.60)

    bg_h = np.array([0.008, 0.011, 0.014])
    bg_c = np.array([0.006, 0.008, 0.010])
    hero = np.clip(hero - bg_h, 0, None)
    close_a = np.clip(close_a - bg_c, 0, None)
    close_c = np.clip(close_c - bg_c, 0, None)

    over = (axis > 2.08) & (axis < 2.16) & a_ok & c_ok
    gain = np.median(close_a[over], 0) / np.maximum(np.median(close_c[over], 0), 1e-4)
    print("close c to a gain", gain)
    w = smoothstep(2.10, 2.16, axis)[:, None]
    close = np.where(c_ok[:, None], close_a * (1 - w) + close_c * gain * w, close_a)
    close = np.where(a_ok[:, None] | c_ok[:, None], close, 0)
    last = np.max(np.where(c_ok)[0])
    print("close data ends at r", axis[last])
    tail = hero / np.maximum(blur(lum(hero), 0.02)[:, None], 1e-4) * np.median(close[(axis > 2.24) & (axis < axis[last] - 0.01)], 0) / np.array([1.3, 1.0, 0.8]) * 0.75
    wt = smoothstep(axis[last] - 0.03, axis[last] - 0.005, axis)[:, None]
    close = close * (1 - wt) + tail * wt

    detail_c = lum(close) / np.maximum(blur(lum(close), 0.004), 1e-4)
    detail_c = np.clip(detail_c, 0.4, 2.2)
    keep = smoothstep(0.02, 0.06, blur(lum(hero), 0.004))
    hero_fine = hero * (1 + (detail_c[:, None] - 1) * 0.8 * keep[:, None])

    f1 = fine(rng, 0.13)
    f2 = fine(rng, 0.13)
    hero_fine *= f1[:, None]
    close_fine = close * (0.5 * f1 + 0.5 * f2)[:, None]

    edge_h = smoothstep(INNER - 0.004, INNER + 0.004, axis) * (1 - smoothstep(OUTER - 0.002, OUTER + 0.002, axis))
    edge_c = smoothstep(1.208, 1.214, axis) * (1 - smoothstep(OUTER - 0.002, OUTER + 0.002, axis))
    line = 0.02 * np.exp(-0.5 * ((axis - 2.42) / 0.004) ** 2)
    hero_fine = hero_fine * edge_h[:, None] + line[:, None] * np.array([0.9, 0.85, 0.8])
    close_fine = close_fine * edge_c[:, None] + 0.6 * line[:, None] * np.array([0.9, 0.85, 0.8])

    thin = 1 - 0.5 * (1 - smoothstep(1.47, 1.53, axis))
    alpha_h = (1 - np.exp(-lum(hero_fine) / 0.12)) * thin
    alpha_c = 1 - np.exp(-lum(close_fine) / 0.07)
    out = [np.concatenate([hero_fine, alpha_h[:, None]], -1), np.concatenate([close_fine, alpha_c[:, None]], -1)]

    sets = {}
    for name, step in (("full", 1), ("web", 2)):
        profs = [p.reshape(N // step, step, 4).mean(1) for p in out]
        data, layout = pack(profs)
        dest = ROOT / "public/assets/saturn" / name
        dest.mkdir(parents=True, exist_ok=True)
        data.astype("<f4").tofile(dest / "rings.bin")
        sets[name] = {"n": N // step, "width": ROW, "height": int(data.shape[0]), "hero": layout[0], "close": layout[1]}
        print(name, data.shape, "bytes", data.nbytes)
    meta = {"span": [R0, R1], "inner": INNER, "outer": OUTER, "sets": sets}
    (ROOT / "src/stops/saturn/rings.json").write_text(json.dumps(meta, indent=1) + "\n")

    np.save(WORK / "ring-profile-hero.npy", out[0])
    np.save(WORK / "ring-profile-close.npy", out[1])
    strips = []
    for p in out:
        strip(p[:, :3], WORK / "tmp-strip.jpg")
        strips.append(cv2.imread(str(WORK / "tmp-strip.jpg")))
        a = np.repeat(np.repeat(p[None, :, 3:4], 40, 0), 3, 2)
        strips.append(cv2.resize((a * 255).astype(np.uint8), (2400, 40), interpolation=cv2.INTER_AREA))
    z0, z1 = int((2.10 - R0) / (R1 - R0) * N), int((2.20 - R0) / (R1 - R0) * N)
    for p in out:
        strip(p[z0:z1, :3], WORK / "tmp-strip.jpg")
        strips.append(cv2.imread(str(WORK / "tmp-strip.jpg")))
    cv2.imwrite(str(WORK / "ring-profiles.jpg"), np.vstack(strips), [cv2.IMWRITE_JPEG_QUALITY, 92])
    for nm, lo, hi in (("C", 1.26, 1.45), ("B", 1.55, 1.9), ("Cassini", 1.965, 2.02), ("A", 2.05, 2.3)):
        m = (axis > lo) & (axis < hi)
        print(nm, "hero", np.round(out[0][m].mean(0), 3), "close", np.round(out[1][m].mean(0), 3))


if __name__ == "__main__":
    main()
