import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, lum, load_json, pixel_grid, plane_hit, spheroid_hit, normalize  # noqa: E402

SRC = {"full": WORK / "hero-x2.png", "web": ROOT / "references" / "approved" / "saturn-hero.png"}
SAFE = (1.0, 2.2)
EDGE = (2.15, 2.5, 80.0)
LUM = (50.0, 95.0)
OVER_SOFT = 0.006
OVER_OUT = 0.004
OVER_LIT = (62.0, 70.0)
OVER_LUM = (95.0, 130.0)


def inner_edge(y, r, bins, over):
    steps = np.arange(1.0, 1.33, 0.005)
    sel = over & (r >= steps[0]) & (r < steps[-1])
    cell = ((r[sel] - steps[0]) / 0.005).astype(np.int32)
    flat = bins[sel] // 4 * len(steps) + cell
    order = np.argsort(flat)
    flat, vals = flat[order], y[sel][order]
    starts = np.searchsorted(flat, np.arange(180 * len(steps)))
    ends = np.searchsorted(flat, np.arange(180 * len(steps)), side="right")
    edge = np.full(180, np.nan)
    for b in range(180):
        prof = np.array([np.median(vals[starts[b * len(steps) + i]:ends[b * len(steps) + i]]) if ends[b * len(steps) + i] - starts[b * len(steps) + i] > 3 else np.nan for i in range(len(steps))])
        have = ~np.isnan(prof)
        if have.sum() < 12:
            continue
        ring = np.nanmedian(prof[steps > 1.25])
        first = prof[have][:6]
        if np.nanmax(first) > 125 and ring < 125:
            mid = min(ring, 90.0) + 0.25 * (np.nanmax(first) - min(ring, 90.0))
            below = np.nonzero(have & (prof < mid))[0]
            if len(below):
                edge[b] = steps[below[0]]
        elif np.nanmedian(first) < 34 and ring > 48:
            above = np.nonzero(have & (prof > 34) & (steps < 1.25))[0]
            if len(above):
                edge[b] = steps[above[0]]
        elif np.nanmax(first) <= 125 and np.nanmedian(first) >= 34 and steps[have][0] > 1.06:
            edge[b] = 1.0
    idx = np.arange(180)
    good = ~np.isnan(edge)
    full = np.interp(idx, idx[good], edge[good])
    full = np.array([np.median(full[max(i - 2, 0):i + 3]) for i in range(180)])
    full = cv2.GaussianBlur(full.reshape(1, -1).astype(np.float32), (0, 0), 1.2).ravel()
    return full


def build(key):
    fit = load_json(HERE / "fit.json")
    src = SRC[key] if SRC[key].exists() else SRC["web"]
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    k = w / fit["imageSize"][0]
    cam = hero_camera(fit)
    px, py = pixel_grid(w, h)
    dirs = cam.rays_world(px / k, py / k)
    n = normalize(fit["rings"]["normal"])
    t, P = plane_hit(cam.pos, dirs, n)
    r = np.linalg.norm(P, axis=-1)
    hit, ts = spheroid_hit(cam.pos, dirs, n)
    front = hit & (ts < t)
    valid = (t > 0) & (r > 1.0) & (r < 2.5) & ~front
    sun = normalize(fit["sunDir"])
    along = P @ sun
    axis = P - along[..., None] * sun
    axis = axis + n * (axis @ n)[..., None] * (1 / 0.902 - 1)
    shadow = (along < 0) & (np.linalg.norm(axis, axis=-1) < 1.02)

    y = lum(cv2.GaussianBlur(img, (0, 0), 0.8 * k)[..., ::-1].astype(np.float32))
    bright = (y > 30).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(bright, connectivity=8)
    keep = np.zeros(count, bool)
    for i in range(1, count):
        keep[i] = stats[i, cv2.CC_STAT_AREA] > 900 * k * k or max(stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]) > 70 * k
    soft = np.clip((y - LUM[0]) / (LUM[1] - LUM[0]), 0, 1)
    soft = soft * soft * (3 - 2 * soft) * keep[labels]
    body = (r > SAFE[0]) & (r < SAFE[1])
    dark = shadow & (r > fit["rings"]["inner"]) & (r < fit["rings"]["outer"])
    e1, e2, _ = basis(n)
    az = np.degrees(np.arctan2(P @ e2, P @ e1)) % 360
    bins = np.minimum((az * 2).astype(np.int32), 719)
    rim = valid & ~shadow & (r > EDGE[0]) & (r < EDGE[1]) & (y > EDGE[2]) & keep[labels]
    edge = np.full(720, np.nan)
    top = np.zeros(720)
    np.maximum.at(top, bins[rim], r[rim])
    seen = np.bincount(bins[valid & ~shadow & (r > 2.42) & (r < 2.5)], minlength=720) > 4 * k
    edge[(top > 0) & seen] = top[(top > 0) & seen]
    idx = np.arange(720)
    good = ~np.isnan(edge)
    edge = np.interp(idx, idx[good], edge[good], period=720)
    wrap = np.concatenate([edge[-8:], edge, edge[:8]])
    edge = np.array([np.median(wrap[i:i + 17]) for i in range(720)])
    print("outer edge by azimuth", np.round(edge[::60], 3), "bins seen", int(good.sum()))
    limit = edge[bins] + 0.006
    soft = soft * (1 - np.clip((r - limit) / 0.008, 0, 1))
    alpha = np.maximum(soft, cv2.GaussianBlur((body | dark).astype(np.float32), (0, 0), 1.5 * k))
    alpha = alpha * valid
    over = hit & (t > 0) & (t < ts)
    inner = inner_edge(y, r, bins, over)
    print("inner edge over the globe by azimuth", {int(i * 2): round(float(inner[i]), 3) for i in range(20, 56, 2)})
    cut = np.clip((r - np.interp(az, np.arange(180) * 2.0 + 1.0, inner, period=360) - OVER_OUT + OVER_SOFT) / (2 * OVER_SOFT), 0, 1)
    cut = cut * cut * (3 - 2 * cut)
    lit = np.clip((OVER_LIT[1] - az) / (OVER_LIT[1] - OVER_LIT[0]), 0, 1) * np.clip((1.3 - r) / 0.04, 0, 1)
    ringlike = 1 - np.clip((y - OVER_LUM[0]) / (OVER_LUM[1] - OVER_LUM[0]), 0, 1)
    alpha = np.where(over, alpha * np.maximum(cut, ringlike * lit), alpha)

    core = cv2.erode(valid.astype(np.uint8), np.ones((int(7 * k) | 1, int(7 * k) | 1), np.uint8))
    weight = cv2.GaussianBlur(core.astype(np.float32), (0, 0), 3 * k)

    known = (alpha > 0.6).astype(np.float32)
    col = img.astype(np.float32) * known[..., None]
    acc = known.copy()
    for s in (2, 5, 12, 30):
        blur = cv2.GaussianBlur(col, (0, 0), s * k)
        wb = cv2.GaussianBlur(acc, (0, 0), s * k)
        fill = (acc < 0.5) & (wb > 0.02)
        col[fill] = blur[fill] / wb[fill][:, None]
        acc[fill] = 1
    out = np.where((alpha > 0.6)[..., None], img.astype(np.float32), col)
    out = np.clip(out, 0, 255).astype(np.uint8)
    mask = np.zeros((h, w, 3), np.uint8)
    mask[..., 2] = np.clip(alpha * 255 + 0.5, 0, 255)
    mask[..., 1] = np.clip(weight * 255 + 0.5, 0, 255)
    dst = WORK / "shot" / key
    dst.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dst / "hero-rings.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    small = cv2.resize(mask, tuple(fit["imageSize"]), interpolation=cv2.INTER_AREA) if k > 1 else mask
    cv2.imwrite(str(dst / "hero-rings-mask.png"), small, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    view = cv2.resize(np.concatenate([out, mask], axis=1), None, fx=1408 / w, fy=1408 / w, interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(WORK / f"hero-rings-{key}.jpg"), view)
    print(key, src.name, w, h, "ring share", round(float((alpha > 0.5).mean()), 3))
    return w, h


if __name__ == "__main__":
    sizes = {key: build(key) for key in (sys.argv[1:] or ["full", "web"])}
    print(sizes)
