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


if __name__ == "__main__":
    hold(sys.argv[1] if len(sys.argv) > 1 else None)
