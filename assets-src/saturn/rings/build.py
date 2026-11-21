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
CR0, CR1 = -1.05, 2.60
ANCH_H = [1.2458, 1.940, 2.063, 2.3394]
ANCH_C = [-1.0, 1.746, 1.858, 2.12]
CLOSE_FINE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.35


def to_world(rh):
    h, c = ANCH_H, ANCH_C
    lo = c[0] + (rh - h[0]) * (c[1] - c[0]) / (h[1] - h[0])
    hi = c[3] + (rh - h[3]) * (c[3] - c[2]) / (h[3] - h[2])
    return np.where(rh < h[0], lo, np.where(rh > h[3], hi, np.interp(rh, h, c)))


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
    for sigma, a in ((30, 1.1), (15, 1.0), (7, 0.85), (3.5, 0.65), (1.8, 0.5)):
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


def filmic(x):
    x = np.clip(x, 0, None)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene_lum(display):
    d = np.clip(lum(display), 0, 0.985)
    lo, hi = np.zeros_like(d), np.full_like(d, 12.0)
    for _ in range(40):
        mid = 0.5 * (lo + hi)
        low = filmic(mid) < d
        lo, hi = np.where(low, mid, lo), np.where(low, hi, mid)
    return 0.5 * (lo + hi)


def unit_mean(m):
    return m / np.maximum(blur(m, 0.003), 1e-4)


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
    lam = np.load(WORK / "profile-close-lam.npy")
    rw = CR0 + (np.arange(lam.shape[0]) + 0.5) / lam.shape[0] * (CR1 - CR0)
    bg_h = np.array([0.008, 0.011, 0.014])
    bg_c = np.array([0.006, 0.008, 0.010])
    hero = np.clip(hero - 0.1 * bg_h, 0, None)
    world = np.clip(np.nan_to_num(lam) - 0.1 * bg_c, 0, None)
    x = to_world(axis)
    close = np.stack([np.interp(x, rw, world[:, k], left=0, right=0) for k in range(3)], -1)

    detail_c = lum(close) / np.maximum(blur(lum(close), 0.004), 1e-4)
    detail_c = np.clip(detail_c, 0.4, 2.2)
    keep = smoothstep(0.02, 0.06, blur(lum(hero), 0.004))
    f1 = fine(rng, 0.2)
    f2 = fine(rng, 0.2)
    hero_fine = filmic(hero) * unit_mean((1 + (detail_c - 1) * 0.5 * keep) * f1)[:, None]
    quiet = smoothstep(0.30, 0.60, x)
    close_fine = filmic(close) * (1 + (unit_mean(0.5 * f1 + 0.5 * f2) - 1) * quiet * CLOSE_FINE)[:, None]

    edge_h = smoothstep(INNER - 0.004, INNER + 0.004, axis) * (1 - smoothstep(OUTER - 0.002, OUTER + 0.002, axis))
    edge_c = smoothstep(INNER - 0.004, INNER + 0.004, axis) * (1 - smoothstep(OUTER - 0.002, OUTER + 0.002, axis))
    line = 0.012 * np.exp(-0.5 * ((axis - 2.42) / 0.004) ** 2)
    hero_fine = np.clip(hero_fine * edge_h[:, None] + line[:, None] * np.array([0.9, 0.85, 0.8]), 0, 0.985)
    close_fine = np.clip(close_fine * edge_c[:, None] + 0.6 * line[:, None] * np.array([0.9, 0.85, 0.8]), 0, 0.985)

    alpha_h = 1 - np.exp(-scene_lum(hero_fine) / 0.04)
    alpha_c = np.maximum(1 - np.exp(-scene_lum(close_fine) / 0.07), 0.95 * edge_c)
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
    meta = {"span": [R0, R1], "inner": INNER, "outer": OUTER, "warpHero": ANCH_H, "warpClose": ANCH_C, "sets": sets}
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
        print(nm, "display values, hero", np.round(out[0][m].mean(0), 3), "close", np.round(out[1][m].mean(0), 3))


if __name__ == "__main__":
    main()
