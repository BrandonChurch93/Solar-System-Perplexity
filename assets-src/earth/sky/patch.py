import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import geo  # noqa: E402
from deblock import deblock  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
FULL = (2816, 1584)
MARGIN = 0.125
OWN = (1.012, 1.04)
STARS = (1.03, 1.06)
SHARE = (0.6, 0.85)
AURORA = (6.0, 86.0, 1.3)
MOON = (1.35, 1.8)
DISC = (1.06, 1.2)
TINT = 1.25
CALM = 12.0
SHIFT = (0.0, 0.0)
PEAK = 0.08
FINE = 4.0
REACH = 8
JOIN = 4.0
HERO = geo.HERO
FILL = geo.WORK / "sky" / "fill-t1.png"
OUT = Path(os.environ["EARTH_SKY_OUT"]) if "EARTH_SKY_OUT" in os.environ else geo.ROOT / "public" / "assets" / "earth"


def scene(path, resample, blocks=False):
    img = Image.open(path).convert("RGB")
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], "F").resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return geo.decode(a.astype(np.float64)).astype(np.float32)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def luma(a):
    return a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def save(lin, name, calm=0.0):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((py, py), (px, px), (0, 0)), mode="symmetric")
    if calm:
        soft = np.stack([ndi.gaussian_filter(np.minimum(wide[..., i], ndi.gaussian_filter(wide[..., i], calm)), calm) for i in range(3)], -1)
        fine = np.stack([ndi.gaussian_filter(np.minimum(wide[..., i], ndi.gaussian_filter(wide[..., i], FINE)), FINE) for i in range(3)], -1)
        points = np.maximum(wide - fine, 0)
        yy, xx = np.mgrid[-REACH:REACH + 1, -REACH:REACH + 1]
        top = ndi.maximum_filter(points.max(-1), footprint=np.hypot(yy, xx) <= REACH)
        points = points * np.minimum(1, PEAK / np.maximum(top, 1e-6))[..., None]
        ys, xs = np.arange(wide.shape[0]), np.arange(wide.shape[1])
        dx, dy = px + round(px * SHIFT[0]), py + round(py * SHIFT[1])
        sx = np.where(xs < px, xs + dx, np.where(xs >= px + FULL[0], xs - dx, xs))
        sy = np.where(ys < py, ys + dy, np.where(ys >= py + FULL[1], ys - dy, ys))
        edge = lambda v, lo, hi: np.clip(np.maximum(lo - v, v - hi + 1) / JOIN, 0, 1)
        fade = np.maximum(edge(ys, py, py + FULL[1])[:, None], edge(xs, px, px + FULL[0])[None, :])
        soft += points[sy][:, sx] * fade[..., None]
        soft[py:py + FULL[1], px:px + FULL[0]] = lin
        wide = soft
    img = Image.fromarray((np.clip(geo.encode(wide.astype(np.float64)), 0, 1) * 255 + 0.5).astype(np.uint8))
    for key, k in (("full", 1), ("web", 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(OUT / key / name, lossless=True, quality=90, method=6)
    img.resize((img.size[0] // 2, img.size[1] // 2), Image.LANCZOS).save(geo.WORK / "view" / (name.split(".")[0] + ".jpg"), quality=92)


def hold(film=None):
    f = scene(FILL, Image.LANCZOS, True)
    if film is None:
        save(f, "sky-hold.webp")
        return
    a = scene(HERO, Image.LANCZOS, True)
    g = scene(film, Image.BICUBIC)
    geom = geo.hero_geometry(1)
    d = geom["rt"].astype(np.float32)
    c = geo.FIT["circle"]
    yy, xx = np.mgrid[0:FULL[1], 0:FULL[0]].astype(np.float32) + 0.5
    pa = np.degrees(np.arctan2(xx - c["cx"], -(yy - c["cy"]))) % 360
    m = geo.FIT["moons"][0]
    mx, my, mz = geo.CAM.project(np.asarray(m["position"]))
    mr = 58.5
    moon = 1 - step(np.hypot(xx - mx, yy - my) / mr, MOON[0], MOON[1])
    aurora = step(pa, AURORA[0], AURORA[0] + 8) * (1 - step(pa, AURORA[1] - 8, AURORA[1])) * (1 - step(d, AURORA[2], AURORA[2] + 0.08))
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(luma(a), 10)
    lg = ndi.gaussian_filter(luma(g), 10)
    own = step(d, OWN[0], OWN[1]) * (1 - step(lg / np.maximum(la, 1e-5), SHARE[0], SHARE[1])) * (1 - moon) * (1 - aurora)
    own = ndi.gaussian_filter(own, 3)
    ring = (d > 1.1) & (d < 1.6) & (own > 0.98)
    gain = np.array([np.median(sky[..., i][ring]) / max(np.median(f[..., i][ring]), 1e-6) for i in range(3)])
    near = (own > 0.98).astype(np.float32)
    soft = lambda v: ndi.gaussian_filter(v, 48)
    local = np.stack([soft(np.minimum(sky[..., i], 0.2) * near) / np.maximum(soft(np.minimum(f[..., i], 0.2) * near), 1e-6) for i in range(3)], -1)
    reach = step(soft(near), 0.02, 0.3)[..., None] * step(d, 0.72, 1.04)[..., None]
    local = np.stack([soft(np.clip(local[..., i], gain[i] * 0.6, gain[i] * 1.6)) for i in range(3)], -1)
    scale = gain * (1 - reach) + local * reach
    print("fill gain", gain.round(3), "own share", float(own.mean().round(3)), "ring px", int(ring.sum()))
    low = lambda v: np.stack([ndi.gaussian_filter(np.minimum(v[..., i], ndi.gaussian_filter(v[..., i], 4)), 4) for i in range(3)], -1)
    rim = step(d, STARS[0], STARS[1])[..., None]
    f = f * scale
    stars = np.maximum(a - low(a), 0)
    glow = step(lg, 0.02, 0.2)[..., None]
    top = stars.max(-1)
    tint = np.maximum(stars[..., 1] - np.maximum(stars[..., 0], stars[..., 2]) * TINT, stars[..., 0] - np.maximum(stars[..., 1], stars[..., 2]) * TINT)
    curtain = ndi.maximum_filter(step(tint / np.maximum(top, 1e-5), 0.0, 0.15) * (top > 2e-4), 3) * aurora
    disc = 1 - step(np.hypot(xx - mx, yy - my) / mr, DISC[0], DISC[1])
    keep = ((1 - curtain) * (1 - disc))[..., None]
    f = f * (1 - rim) + (low(f) + stars * (1 - glow) * keep) * rim
    lin = sky * own[..., None] + f * (1 - own[..., None])
    save(lin, "sky-hold.webp", CALM)
    Image.fromarray((np.clip(own, 0, 1) * 255).astype(np.uint8)).resize((FULL[0] // 2, FULL[1] // 2)).save(geo.WORK / "view" / "sky-own.jpg", quality=90)


CLOSE = geo.ROOT / "references" / "approved" / "earth-close.jpg"
TERRAIN_MARGIN = 0.5
SUN_AT = (-0.083, 1.251)
HELD = (40.0, 100.0, 70)
GLOW = (120.0, 700.0, 3.0)
TOL = 2.0 / 255
BAND = 32.0
TWICE = 2
POINT = (2.5 / 255, 6.0 / 255)
DARK = (0.3, 0.5)
FAR = (110.0, 220.0)
SEED = 20101
TWIN = (4.0 / 255, 8.0 / 255, 5.0, 37, 8.0, 1.5, 6.0, 1.6 / 255, 2.4 / 255)
RAY = (12, 4.0, 110.0, 170.0, 30.0, 90.0, 64.0, 120.0)
GRAIN = (0.7, 0.92, 0.63, 0.232, 4.0, 130.0)


def deband(lin, above):
    e = geo.encode(lin.astype(np.float64)).astype(np.float32)
    calm = np.stack([ndi.gaussian_filter(np.minimum(e[..., i], ndi.gaussian_filter(e[..., i], 4)), 4) for i in range(3)], -1)
    star = ndi.maximum_filter(step((e - calm).max(-1), POINT[0], POINT[1]), 5)
    free = 1 - star

    def blur(v, sigma):
        norm = np.maximum(ndi.gaussian_filter(free, sigma), 1e-4)
        return np.stack([ndi.gaussian_filter(v[..., i] * free, sigma) / norm for i in range(3)], -1)

    mid = blur(e, 3.0)
    f = blur(mid, BAND)
    for _ in range(TWICE):
        f = f + blur(mid - f, BAND)
    held = float((np.abs(f - mid) > TOL).any(-1).mean())
    move = blur(np.clip(f - mid, -TOL, TOL), 4.0)
    weight = (1 - step(mid.max(-1), DARK[0], DARK[1])) * step(above, FAR[0], FAR[1])
    out = e + weight[..., None] * move
    on = weight > 0.5
    change = np.abs(move)[on] * 255
    print("deband: share of the patch", float(on.mean().round(3)), "stars kept", round(float(star[on].mean()), 4), "held at the bound", round(held, 4), "local mean moved by, code values: mean", float(change.mean().round(2)), "p99", float(np.percentile(change, 99).round(2)), "max", float(change.max().round(2)))
    return geo.decode(out.astype(np.float64)).astype(np.float32), weight


def untwin(wide, sky, px, W):
    half = px // 2
    e = geo.encode(wide.astype(np.float64)).astype(np.float32)
    dog = np.stack([ndi.gaussian_filter(e[..., i], 0.7) - ndi.gaussian_filter(e[..., i], 4.0) for i in range(3)], -1).max(-1)
    star = np.maximum(ndi.maximum_filter(step(dog, TWIN[0], TWIN[1]), 5), ndi.maximum_filter(step(dog, TWIN[0] * TWIN[2], TWIN[1] * TWIN[2]), 11))
    blob = np.stack([ndi.gaussian_filter(e[..., i], TWIN[5]) - ndi.gaussian_filter(e[..., i], TWIN[6]) for i in range(3)], -1).max(-1)
    star = np.maximum(star, ndi.maximum_filter(step(blob, TWIN[7], TWIN[8]), 7))
    star = ndi.gaussian_filter(star, 1.0) * sky
    free = 1 - star
    norm = np.maximum(ndi.gaussian_filter(free, 3.0), 1e-4)
    base = np.stack([ndi.gaussian_filter(e[..., i] * free, 3.0) / norm for i in range(3)], -1)
    grain = np.stack([(e[..., i] - ndi.gaussian_filter(e[..., i], 2.0)) * free for i in range(3)], -1)
    cols = np.arange(wide.shape[1])
    left = cols < px
    side = left | (cols >= px + W)
    src = px + np.where(left, cols - px + half, cols - px - W - half) % W
    gap = np.where(left, px - cols, cols - px - W + 1)
    fade = np.clip((gap - TWIN[4]) / TWIN[4], 0, 1).astype(np.float32)
    moved = star[:, src] * fade[None, :]
    out = e * free[..., None] + (base + np.roll(grain, -TWIN[3], axis=0)) * star[..., None] + ((e - base) * star[..., None])[:, src] * fade[None, :, None]
    change = side[None, :] & ((star > 1e-3) | (moved > 1e-3))
    res = wide.copy()
    res[change] = geo.decode(out[change].astype(np.float64)).astype(np.float32)
    print("margin points: taken out", int((ndi.label(star[:, side] > 0.5)[1])), "pixels changed", int(change.sum()), "of", int(side.sum()) * wide.shape[0])
    return res


def terrain(film):
    import json
    a = scene(CLOSE, Image.LANCZOS, True)
    g = scene(film, Image.BICUBIC)
    W, H = FULL
    r = json.load(open(geo.ROOT / "src" / "stops" / "earth" / "relief.json"))["ground"]
    x = np.arange(W) + 0.5
    hrow = np.polynomial.polynomial.polyval((x - r["horizonSpan"][0]) / r["horizonSpan"][1], np.array(r["horizon"]))
    yy = np.arange(H)[:, None] + 0.5
    above = hrow[None, :] - yy
    d = np.maximum(a - g, 0)
    low = np.stack([ndi.gaussian_filter(d[..., i], 6) for i in range(3)], -1)
    rows = np.clip(np.round(hrow - HELD[2]).astype(int), 0, H - 1)
    held = ndi.gaussian_filter1d(low[rows, np.arange(W)], 16, axis=0, mode="nearest")
    w = step(above, HELD[0], HELD[1])[..., None]
    lin = d * w + held[None] * (1 - w)
    lin, smooth = deband(lin, np.broadcast_to(above, (H, W)))
    px, py = round(W * TERRAIN_MARGIN), round(H * TERRAIN_MARGIN)
    half = px // 2
    twice = lambda v: np.pad(np.pad(v, ((0, 0), (half, half)) + ((0, 0),) * (v.ndim - 2), mode="symmetric"), ((0, 0), (px - half, px - half)) + ((0, 0),) * (v.ndim - 2), mode="symmetric")
    wide = twice(lin)
    smooth = twice(smooth)
    sx, sy = W / 2 * (1 + SUN_AT[0]), H / 2 * (1 - SUN_AT[1])
    xs = np.arange(-px, W + px) + 0.5
    band = wide[0:RAY[0]].mean(0)
    top = np.stack([ndi.gaussian_filter1d(band[:, i], 24, mode="nearest") for i in range(3)], -1)
    fine = np.stack([ndi.gaussian_filter1d(band[:, i], RAY[1], mode="nearest") for i in range(3)], -1)
    wide = untwin(wide, twice(np.broadcast_to(w[..., 0], (H, W))), px, W)
    off = (np.arange(W) + 0.5)[None, :] - sx
    rr = np.hypot(off, (np.arange(0, 140) + 0.5)[:, None] - sy)
    pick = (rr > GLOW[0]) & (rr < GLOW[1]) & (np.abs(off) < 600)
    floor = np.percentile(low[0:140][:, np.abs(off[0]) > 900].reshape(-1, 3), 20, axis=0)
    power = []
    for i in range(3):
        v = np.maximum(low[0:140, :, i][pick] - floor[i], 1e-5)
        k = np.polyfit(np.log(rr[pick]), np.log(v), 1)
        power.append(-k[0])
    power = np.array(power)
    r0 = np.hypot(xs - sx, RAY[0] / 2 - sy)
    ym = (np.arange(-py, 0) + 0.5)[:, None]
    r1 = np.maximum(np.hypot(xs[None, :] - sx, ym - sy), 40.0)
    rise = (r0[None, :] / r1)[..., None] ** power
    cap = GLOW[2]
    ratio = ((fine - floor) / np.maximum(top - floor, 1e-6) - 1) * (1 - step(np.abs(xs - sx), RAY[2], RAY[3]))[:, None]
    below = ym - sy
    at = np.clip(sx + (xs[None, :] - sx) * (-sy / np.maximum(below, 1.0)) - xs[0], 0, len(xs) - 1.001)
    i0 = at.astype(np.int64)
    t = (at - i0).astype(np.float32)[..., None]
    ray = (ratio[i0] * (1 - t) + ratio[i0 + 1] * t) * step(below, RAY[4], RAY[5])[..., None]
    calm = np.stack([ndi.gaussian_filter1d(band[:, i], RAY[6], mode="nearest") for i in range(3)], -1)
    even = step(-ym, 0.0, RAY[7])[..., None]
    margin = np.minimum(floor + np.maximum(top[None] + (calm - top)[None] * even - floor, 0) * rise * (1 + ray), cap)
    wide = np.concatenate([margin.astype(np.float32), wide], 0)
    wide = np.pad(wide, ((0, py), (0, 0), (0, 0)), mode="edge")
    smooth = np.pad(np.concatenate([np.ones((py, smooth.shape[1]), np.float32), smooth], 0), ((0, py), (0, 0)), mode="edge")
    print("glow power", power.round(2), "floor", floor.round(4), "top max", float(top.max().round(3)), "margin max", float(margin.max().round(3)))
    code = np.clip(geo.encode(wide.astype(np.float64)), 0, 1) * 255
    rng = np.random.default_rng(SEED + 1)
    field = []
    for _ in range(4):
        v = ndi.gaussian_filter(rng.standard_normal((py, code.shape[1]), dtype=np.float32), GRAIN[0])
        field.append(v / v.std())
    amp = GRAIN[2] + GRAIN[3] * np.log(np.clip(code[0:py].mean(-1), GRAIN[4], GRAIN[5]))
    for i in range(3):
        code[0:py, :, i] += amp * (np.sqrt(GRAIN[1]) * field[0] + np.sqrt(1 - GRAIN[1]) * field[i + 1])
    noise = (np.random.default_rng(SEED).random(code.shape, dtype=np.float32) - 0.5) * (smooth > 0.5)[..., None] * (code > 1.0)
    img = Image.fromarray(np.clip(np.floor(code + 0.5 + noise), 0, 255).astype(np.uint8))
    for key, k in (("full", 1), ("web", 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(OUT / key / "sky-terrain.webp", lossless=True, quality=90, method=6)
        print(key, im.size, round((OUT / key / "sky-terrain.webp").stat().st_size / 1e6, 2), "MB")
    img.resize((img.size[0] // 3, img.size[1] // 3), Image.LANCZOS).save(geo.WORK / "view" / "sky-terrain.jpg", quality=92)


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "terrain":
        terrain(sys.argv[2])
    else:
        hold(sys.argv[1] if len(sys.argv) > 1 else None)
