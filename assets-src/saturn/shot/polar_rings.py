import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, load_json, lum  # noqa: E402

SPAN = (1.42, 2.48)
SIZE = {"full": (8192, 1024), "web": (4096, 512)}
POLAR = 0.902
PENUMBRA = 0.93
WEIGHT = 0.98
LIMB = 1.11
TRIM = 24
BLOCKS = 256
KNOTS = np.array([1.90, 1.95, 2.00, 2.05, 2.10, 2.34])
HALF = 0.06
SEARCH = 0.075
EDGE = 24
GRAIN = 8
OVER_END = 1.56
WARP = (512, 64)


def project(m, p):
    c = p @ m[:3] + m[3]
    return c[..., 0] / c[..., 3] * 0.5 + 0.5, c[..., 1] / c[..., 3] * 0.5 + 0.5, c[..., 3]


def unproject(key):
    shots = load_json(WORK / "shots.json")
    m = np.array(shots["hero"]["matrix"], dtype=np.float64).reshape(4, 4)
    cam = np.array(shots["hero"]["camera"])
    shadow = np.array(load_json(ROOT / "src" / "stops" / "saturn" / "shadow.json")["local"])
    base = ROOT / "public" / "assets" / "saturn" / key
    img = cv2.imread(str(base / "hero-rings.jpg"), cv2.IMREAD_COLOR)
    mask = cv2.imread(str(base / "hero-rings-mask.png"), cv2.IMREAD_COLOR)
    w, h = SIZE[key]
    phi = ((np.arange(w) + 0.5) / w - 0.5) * 2 * np.pi
    r = SPAN[0] + (1 - (np.arange(h) + 0.5) / h) * (SPAN[1] - SPAN[0])
    pp, rr = np.meshgrid(phi, r)
    p = np.stack([rr * np.cos(pp), np.zeros_like(rr), rr * np.sin(pp)], axis=-1)
    u, v, cw = project(m, p)
    ih, iw = img.shape[:2]
    mh, mw = mask.shape[:2]
    col = cv2.remap(img, (u * iw - 0.5).astype(np.float32), ((1 - v) * ih - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    mk = cv2.remap(mask, (u * mw - 0.5).astype(np.float32), ((1 - v) * mh - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    alpha = mk[..., 2].astype(np.float32) / 255
    weight = mk[..., 1].astype(np.float32) / 255
    inside = (cw > 0) & (u > 0.004) & (u < 0.996) & (v > 0.004) & (v < 0.996)
    du = np.hypot(np.gradient(u * iw, axis=0), np.gradient((1 - v) * ih, axis=0))
    ss = shadow * np.array([1, 1 / POLAR, 1])
    ss = ss / np.linalg.norm(ss)
    along = p @ ss
    miss = np.linalg.norm(p - along[..., None] * ss, axis=-1)
    lit = (along > 0.03) | (miss > PENUMBRA + 0.16 + 0.05 * np.maximum(-along, 0))
    c = cam * np.array([1, 1 / POLAR, 1])
    d = p * np.array([1, 1 / POLAR, 1]) - c
    qa = (d * d).sum(-1)
    qb = d @ c
    qd = qb * qb - qa * ((c * c).sum() - 1)
    over = (qb < 0) & (qd > 0) & (-qb - np.sqrt(np.maximum(qd, 0)) > qa)
    c = c / LIMB
    d = p * np.array([1, 1 / POLAR, 1]) / LIMB - c
    qa = (d * d).sum(-1)
    qb = d @ c
    behind = (qb < 0) & (qb * qb - qa * ((c * c).sum() - 1) > 0) & (-qb < qa)
    return col, alpha, weight, inside & ~behind, du, lit, over, rr, pp


def register(y, ok, r, key, alpha):
    h, w = y.shape
    rings = load_json(ROOT / "src" / "stops" / "saturn" / "rings.json")
    st = rings["sets"][key]
    prof = np.fromfile(ROOT / "public" / "assets" / "saturn" / key / "rings.bin", dtype=np.float32).reshape(st["height"], st["width"], 4)
    n = st["n"]
    lvl = prof[st["hero"][0]:st["hero"][0] + n // st["width"]].reshape(-1, 4)
    pr = rings["span"][0] + (np.arange(n) + 0.5) / n * (rings["span"][1] - rings["span"][0])
    rows_per = h / (SPAN[1] - SPAN[0])
    ref = gaussian_filter1d(np.interp(r, pr, lum(lvl[:, :3]) * 255, left=0, right=0), 0.0016 * rows_per)
    bw = w // BLOCKS
    blk = np.nanmedian(np.where(ok, y, np.nan).reshape(h, BLOCKS, bw), axis=-1)
    blk[ok.reshape(h, BLOCKS, bw).sum(-1) < bw * 0.6] = np.nan
    smax = int(SEARCH * rows_per)
    D = np.full((BLOCKS, len(KNOTS)), np.nan)
    far = pr > 2.2
    KNOTS[-1] = pr[far][np.flatnonzero(lvl[far, 3] > 0.5)[-1]]
    first = np.argmax((alpha > 0.5) & (r[:, None] > 2.15), axis=0)
    seen = ok[np.minimum(first + 8, h - 1), np.arange(w)] & ok[np.maximum(first - 8, 0), np.arange(w)]
    D[:, -1] = np.nanmedian(np.where(seen, r[first], np.nan).reshape(BLOCKS, bw), axis=1) - KNOTS[-1]
    for k, c in enumerate(KNOTS[:-1]):
        i = int(round((SPAN[1] - c) / (SPAN[1] - SPAN[0]) * h - 0.5))
        half = int(HALF * rows_per)
        lo, hi = i - half, i + half + 1
        a = ref[lo:hi] - ref[lo:hi].mean()
        for b in range(BLOCKS):
            seg = blk[lo - smax:hi + smax, b]
            if np.isnan(seg).any():
                continue
            sc = np.zeros(2 * smax + 1)
            for q in range(2 * smax + 1):
                v = seg[q:q + hi - lo] - seg[q:q + hi - lo].mean()
                den = np.sqrt((a * a).sum() * (v * v).sum())
                sc[q] = (a * v).sum() / den if den > 1e-6 else 0.0
            q = int(np.argmax(sc))
            if sc[q] < 0.6 or q == 0 or q == 2 * smax:
                continue
            den = sc[q - 1] - 2 * sc[q] + sc[q + 1]
            D[b, k] = -(q - smax + (0.5 * (sc[q - 1] - sc[q + 1]) / den if abs(den) > 1e-9 else 0.0)) / rows_per
    out = np.zeros_like(D)
    idx = np.arange(BLOCKS)
    for k in range(len(KNOTS)):
        d = D[:, k]
        wrap = np.concatenate([d[-3:], d, d[:3]])
        med = np.array([np.nanmedian(wrap[i:i + 7]) if np.isfinite(wrap[i:i + 7]).sum() >= 3 else np.nan for i in range(BLOCKS)])
        good = np.isfinite(med)
        full = np.interp(idx, idx[good], med[good], period=BLOCKS)
        out[:, k] = gaussian_filter1d(full, 2.5, mode="wrap")
    print("blocks found per knot", np.isfinite(D).sum(0), "shift range", np.round(out.min(0), 3), np.round(out.max(0), 3))
    return out


def field(D, w, r):
    idx = (np.arange(w) + 0.5) / w * BLOCKS - 0.5
    cols = np.stack([np.interp(idx, np.arange(BLOCKS), D[:, k], period=BLOCKS) for k in range(len(KNOTS))], -1)
    f = np.empty((len(r), w), np.float32)
    for j, rho in enumerate(r):
        t = np.clip(np.searchsorted(KNOTS, rho) - 1, 0, len(KNOTS) - 2)
        u = np.clip((rho - KNOTS[t]) / (KNOTS[t + 1] - KNOTS[t]), 0, 1)
        f[j] = cols[:, t] * (1 - u) + cols[:, t + 1] * u
    return f


def pingpong(d, n):
    m = d % (2 * n)
    return np.where(m < n, m, 2 * n - 1 - m)


def fill(img, ok, edge, sigma):
    img = img.astype(np.float32)
    h, w = ok.shape
    left = img.copy()
    right = img.copy()
    low = img.copy()
    t = np.zeros((h, w), np.float32)
    for j in range(h):
        v = ok[j]
        if v.all() or not v.any():
            continue
        start = int(np.argmax(v))
        vr = np.roll(v, -start)
        bounds = np.concatenate([[0], np.flatnonzero(np.diff(vr.astype(np.int8))) + 1, [w]])
        row = np.roll(img[j], -start, axis=0)
        for s in range(1, len(bounds) - 1, 2):
            a, b = bounds[s], bounds[s + 1]
            lv = a - bounds[s - 1]
            rv = (bounds[s + 2] if s + 2 < len(bounds) else w + bounds[1]) - b
            i = np.arange(a, b)
            dst = (i + start) % w
            left[j, dst] = row[a - 1 - pingpong(i - a, lv)]
            right[j, dst] = row[(b + pingpong(b - 1 - i, rv)) % w]
            u = (i - a + 0.5) / (b - a)
            u = u * u * (3 - 2 * u)
            el = row[a - min(edge, lv):a].mean(0)
            er = row[np.arange(b, b + min(edge, rv)) % w].mean(0)
            low[j, dst] = el * (1 - u[:, None]) + er * u[:, None]
            t[j, dst] = u
    t3 = t[..., None]
    high = ((left - gaussian_filter1d(left, sigma, axis=1, mode="wrap")) * (1 - t3) + (right - gaussian_filter1d(right, sigma, axis=1, mode="wrap")) * t3) / np.sqrt((1 - t3) ** 2 + t3 ** 2)
    return np.where(ok[..., None], img, low + high)


def build(key):
    col, alpha, weight, inside, du, lit, over, rr, pp = unproject(key)
    h, w = alpha.shape
    r = rr[:, 0]
    ok = inside & (weight > WEIGHT) & lit & ~(over & (rr < OVER_END))
    y = lum(col[..., ::-1].astype(np.float32)) * alpha
    D = register(y, ok, r, key, alpha)
    f = field(D, w, r)
    rows = (SPAN[1] - (rr + f)) / (SPAN[1] - SPAN[0]) * h - 0.5
    xs = np.broadcast_to(np.arange(w, dtype=np.float32), (h, w)).copy()
    flat = cv2.remap(col, xs, rows.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    okf = cv2.remap(ok.astype(np.float32), xs, rows.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.999
    okf = cv2.erode(okf.astype(np.uint8), np.ones((3, int(TRIM * w / 4096) | 1), np.uint8)) > 0
    af = cv2.remap(alpha, xs, rows.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    outer = np.argmax((af > 0.5) & (r[:, None] > 2.15), axis=0)
    outer = np.where(okf[np.minimum(outer + 12, h - 1), np.arange(w)], outer, -1)
    top = int(np.median(outer[outer >= 0])) + int(0.006 * h / (SPAN[1] - SPAN[0]))
    okf[:top] = False
    out = fill(flat, okf, int(EDGE * w / 4096), GRAIN * w / 4096)
    out[:top] = gaussian_filter1d(out[top + int(0.004 * h / (SPAN[1] - SPAN[0]))], 12.0 * w / 4096, axis=0, mode="wrap")
    out = np.clip(out, 0, 255).astype(np.uint8)
    print("outer edge row", top, "radius", round(float(r[top]), 4), "spread", np.percentile(outer[outer >= 0], [2, 50, 98]))
    inv = f.copy()
    for _ in range(3):
        back = (SPAN[1] - (rr - inv)) / (SPAN[1] - SPAN[0]) * h - 0.5
        inv = cv2.remap(f, xs, back.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    warp = cv2.resize(inv, WARP, interpolation=cv2.INTER_AREA)[::-1].astype(np.float32)
    dst = ROOT / "public" / "assets" / "saturn" / key
    cv2.imwrite(str(dst / "polar-rings.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 92])
    warp.tofile(dst / "polar-warp.bin")
    view = np.concatenate([flat, np.where(okf[..., None], flat, 0), out], axis=0)
    cv2.imwrite(str(WORK / f"polar-{key}.jpg"), cv2.resize(view, (2048, 1536), interpolation=cv2.INTER_AREA))
    print(key, w, h, "valid share", round(float(okf.mean()), 3), "warp range", round(float(warp.min()), 4), round(float(warp.max()), 4))
    return w, h, float(r[top])


if __name__ == "__main__":
    built = {key: build(key) for key in (sys.argv[1:] or ["full", "web"])}
    sizes = {k: v[:2] for k, v in built.items()}
    meta = {"source": "assets-src/saturn/shot/polar_rings.py, the hero's ring pixels on the ring plane (azimuth by radius), bands straightened and gaps filled", "file": "polar-rings.jpg", "warp": {"file": "polar-warp.bin", "width": WARP[0], "height": WARP[1]}, "span": list(SPAN), "edge": round(min(v[2] for v in built.values()), 4), "sets": {k: list(v) for k, v in sizes.items()}}
    if len(sizes) == 2:
        (ROOT / "src" / "stops" / "saturn" / "polar.json").write_text(json.dumps(meta, indent=1) + "\n")
