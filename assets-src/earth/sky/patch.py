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
HERO = geo.HERO
FILL = geo.WORK / "sky" / "fill-t1.png"
OUT = geo.ROOT / "public" / "assets" / "earth"


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


def save(lin, name):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((py, py), (px, px), (0, 0)), mode="symmetric")
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
    rim = (step(d, STARS[0], STARS[1]) * (1 - moon) * (1 - aurora))[..., None]
    f = f * scale
    stars = np.maximum(a - low(a), 0)
    glow = step(lg, 0.02, 0.2)[..., None]
    f = f * (1 - rim) + (low(f) + stars * (1 - glow)) * rim
    lin = sky * own[..., None] + f * (1 - own[..., None])
    save(lin, "sky-hold.webp")
    Image.fromarray((np.clip(own, 0, 1) * 255).astype(np.uint8)).resize((FULL[0] // 2, FULL[1] // 2)).save(geo.WORK / "view" / "sky-own.jpg", quality=90)


CLOSE = geo.ROOT / "references" / "approved" / "earth-close.jpg"
TERRAIN_MARGIN = 0.5
SUN_AT = (-0.083, 1.251)
HELD = (40.0, 100.0, 70)
GLOW = (120.0, 700.0, 3.0)


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
    px, py = round(W * TERRAIN_MARGIN), round(H * TERRAIN_MARGIN)
    half = px // 2
    wide = np.pad(np.pad(lin, ((0, 0), (half, half), (0, 0)), mode="symmetric"), ((0, 0), (px - half, px - half), (0, 0)), mode="symmetric")
    sx, sy = W / 2 * (1 + SUN_AT[0]), H / 2 * (1 - SUN_AT[1])
    xs = np.arange(-px, W + px) + 0.5
    top = np.stack([ndi.gaussian_filter1d(wide[0:12, :, i].mean(0), 24, mode="nearest") for i in range(3)], -1)
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
    r0 = np.hypot(xs - sx, 0.5 - sy)
    ym = (np.arange(-py, 0) + 0.5)[:, None]
    r1 = np.maximum(np.hypot(xs[None, :] - sx, ym - sy), 40.0)
    rise = (r0[None, :] / r1)[..., None] ** power
    cap = GLOW[2]
    margin = np.minimum(floor + np.maximum(top[None] - floor, 0) * rise, cap)
    wide = np.concatenate([margin.astype(np.float32), wide], 0)
    wide = np.pad(wide, ((0, py), (0, 0), (0, 0)), mode="edge")
    print("glow power", power.round(2), "floor", floor.round(4), "top max", float(top.max().round(3)), "margin max", float(margin.max().round(3)))
    img = Image.fromarray((np.clip(geo.encode(wide.astype(np.float64)), 0, 1) * 255 + 0.5).astype(np.uint8))
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
