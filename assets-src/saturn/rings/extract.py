import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import WORK, linear_to_srgb, lum


def align(pol, ok, cols, start, reach, sigma=1.5, passes=2):
    order = sorted(cols, key=lambda c: abs(c - start))
    nr = pol.shape[0]
    idx = np.arange(nr)
    L = lum(pol)
    ref = L[:, start].copy()
    shifts = {start: 0.0}
    stack = {start: pol[:, start]}
    masks = {start: ok[:, start]}
    for _ in range(passes):
        for c in order:
            near = min(shifts, key=lambda k: abs(k - c) if k != c else 1e9) if len(shifts) > 1 or c != start else start
            base = shifts.get(near, 0.0)
            g_ref = gaussian_filter1d(ref, sigma, order=1)
            col = gaussian_filter1d(L[:, c], sigma, order=1)
            m = ok[:, c]
            best = (-1e9, base)
            for s in np.arange(base - reach, base + reach + 0.25, 0.25):
                w = np.interp(idx + s, idx, col, left=0, right=0)
                mm = np.interp(idx + s, idx, m.astype(float), left=0, right=0) > 0.99
                if mm.sum() < 200:
                    continue
                a, b = w[mm], g_ref[mm]
                score = float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-12))
                if score > best[0]:
                    best = (score, s)
            shifts[c] = best[1]
            stack[c] = np.stack([np.interp(idx + best[1], idx, pol[:, c, k], left=0, right=0) for k in range(3)], -1)
            masks[c] = np.interp(idx + best[1], idx, ok[:, c].astype(float), left=0, right=0) > 0.99
            S = np.stack([stack[k] for k in stack])
            M = np.stack([masks[k] for k in stack])
            Lm = np.where(M, lum(S), np.nan)
            with np.errstate(all="ignore"):
                r = np.nanmedian(Lm, axis=0)
            ref = np.where(np.isnan(r), ref, r)
    S = np.stack([stack[k] for k in sorted(stack)])
    M = np.stack([masks[k] for k in sorted(stack)])
    S = np.where(M[..., None], S, np.nan)
    with np.errstate(all="ignore"):
        prof = np.nanmedian(S, axis=0)
    count = M.sum(0)
    return prof, count, shifts


def strip(prof, path, height=160, width=2400):
    p = np.nan_to_num(prof)
    img = np.clip(linear_to_srgb(p / (1 + p) * 1.6), 0, 1)
    bar = np.repeat(img[None], height, axis=0)
    bar = cv2.resize((bar[..., ::-1] * 255).astype(np.uint8), (width, height), interpolation=cv2.INTER_AREA)
    graph = np.full((height, width, 3), 20, np.uint8)
    l = lum(p)
    xs = np.linspace(0, len(l) - 1, width).astype(int)
    ys = (height - 1 - np.clip(l[xs] / max(l.max(), 1e-6), 0, 1) * (height - 1)).astype(int)
    graph[ys, np.arange(width)] = (255, 255, 255)
    cv2.imwrite(str(path), np.vstack([bar, graph]), [cv2.IMWRITE_JPEG_QUALITY, 92])


if __name__ == "__main__":
    pol = np.load(WORK / "polar-lin.npy")
    ok = np.load(WORK / "polar-ok.npy")
    nt = pol.shape[1]
    c0, c1 = int(26 / 360 * nt), int(46 / 360 * nt)
    prof, count, shifts = align(pol, ok, list(range(c0, c1, 2)), (c0 + c1) // 2 // 2 * 2, 3.0)
    sh = np.array([shifts[k] for k in sorted(shifts)])
    print("hero columns", len(sh), "shift range samples", sh.min(), sh.max(), "usable rows", int((count > len(sh) * 0.5).sum()))
    np.save(WORK / "profile-hero.npy", prof)
    np.save(WORK / "profile-hero-count.npy", count)
    strip(prof, WORK / "profile-hero.jpg")

    cp = np.load(WORK / "close-polar-lin.npy")
    cok = np.load(WORK / "close-polar-ok.npy")
    na = cp.shape[1]
    az = lambda d: int((d + 75) / 150 * na)
    for name, a0, a1 in (("a", -16, -9), ("b", -5, 5)):
        prof, count, shifts = align(cp, cok, list(range(az(a0), az(a1), 2)), az((a0 + a1) / 2) // 2 * 2, 4.0, sigma=2.0)
        sh = np.array([shifts[k] for k in sorted(shifts)])
        print("close", name, "columns", len(sh), "shift range samples", sh.min(), sh.max(), "usable rows", int((count > len(sh) * 0.5).sum()))
        np.save(WORK / f"profile-close-{name}.npy", prof)
        np.save(WORK / f"profile-close-{name}-count.npy", count)
        strip(prof, WORK / f"profile-close-{name}.jpg")
