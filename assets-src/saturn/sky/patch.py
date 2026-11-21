import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "wrap"))
from deblock import deblock  # noqa: E402
from lib import ROOT, WORK, plane_hit, spheroid_hit  # noqa: E402

FULL = (2816, 1584)
MARGIN = 0.125
LW = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    ca, cb, cc, cd, ce = 2.51, 0.03, 2.43, 0.59, 0.14
    kk = cd * y - cb
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (cc * y - ca) * ce * y, 0))) / (2 * (cc * y - ca))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene(path, resample, blocks=False):
    img = Image.open(path).convert("RGB")
    a = np.asarray(img).astype(np.float32) / 255
    if blocks:
        a = np.clip(deblock(a), 0, 1)
    if img.size != FULL:
        a = np.clip(np.stack([np.asarray(Image.fromarray(a[..., i], "F").resize(FULL, resample)) for i in range(3)], -1), 0, 1)
    return unfilm(to_linear(a)).astype(np.float32)


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def save(lin, name):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = np.pad(lin, ((py, py), (px, px), (0, 0)), mode="symmetric")
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (("full", 1), ("web", 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(ROOT / "public/assets/saturn" / key / name, lossless=True, quality=90, method=6)
    img.resize((1760, 990), Image.LANCZOS).convert("RGB").save(WORK / (name.replace(".webp", "") + "-preview.jpg"), quality=90)


def compose(a, f, g, body, name):
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(a @ LW, 10)
    lg = ndi.gaussian_filter(g @ LW, 10)
    far = ndi.distance_transform_edt(~body)
    own = step(far, 5, 14) * (1 - step(lg / np.maximum(la, 1e-5), 0.6, 0.85))
    own = ndi.gaussian_filter(own, 3)
    near = (own > 0.98).astype(np.float32)
    gain = np.array([np.median(sky[..., i][near > 0]) / max(np.median(f[..., i][near > 0]), 1e-6) for i in range(3)])
    soft = lambda v: ndi.gaussian_filter(v, 70)
    local = np.stack([soft(np.minimum(sky[..., i], 0.2) * near) / np.maximum(soft(np.minimum(f[..., i], 0.2) * near), 1e-6) for i in range(3)], -1)
    known = np.clip(soft(near) / 0.25, 0, 1)[..., None]
    scale = gain * (1 - known) + np.clip(local, gain * 0.35, gain * 2.5) * known
    print(name, "fill gain", gain.round(3), "own share", float(own.mean().round(3)))
    lin = sky * own[..., None] + f * scale * (1 - own[..., None])
    save(lin, name)


def hold(hero, fill, glow):
    from geo import FIT, hero_camera, ring_frame
    cam = hero_camera(FIT)
    xs, ys = np.meshgrid(np.arange(cam.w) + 0.5, np.arange(cam.h) + 0.5)
    d = cam.rays_world(xs, ys)
    n = ring_frame()[:, 1]
    hit, _ = spheroid_hit(cam.pos, d, n)
    tr, pr = plane_hit(cam.pos, d, n)
    rr = np.linalg.norm(pr, axis=-1)
    body = hit | ((tr > 0) & (rr > FIT["rings"]["inner"] - 0.01) & (rr < 2.45))
    moon = np.array(FIT["moons"][0]["position"])
    mx, my, _ = cam.project(moon)
    mr = FIT["moons"][0]["radius"] / np.linalg.norm(moon - cam.pos) / np.tan(np.radians(cam.vfov) / 2) * cam.h / 2
    body |= np.hypot(xs - mx, ys - my) < mr * 1.5 + 14
    a = scene(hero, Image.LANCZOS, True)
    g = scene(glow, Image.BICUBIC) if glow else np.zeros_like(a)
    f = scene(fill, Image.LANCZOS, True)
    compose(a, f, g, body, "sky-hold.webp")


def terrain(close, fill, glow):
    import json
    fit = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
    rings = json.loads((ROOT / "src/stops/saturn/rings.json").read_text())
    w, h = FULL
    t = np.tan(np.radians(fit["vfov"]) / 2)
    xs, ys = np.meshgrid((np.arange(w) + 0.5) / w * 2 - 1, 1 - (np.arange(h) + 0.5) / h * 2)
    d = np.stack([xs * t * w / h, ys * t, -np.ones_like(xs)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    tilt, roll = np.radians(fit["tiltDeg"]), np.radians(fit["rollDeg"])
    n = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
    origin = -np.array(fit["centre"])
    hit, _ = spheroid_hit(origin, d, n)
    tr, pr = plane_hit(origin, d, n)
    rr = np.linalg.norm(pr, axis=-1)
    body = hit | ((tr > 0) & (rr < rings["warpClose"][3] + 0.03))
    a = scene(close, Image.LANCZOS, True)
    body |= ndi.gaussian_filter(a @ LW, 6) > 0.05
    body = ndi.binary_dilation(body, iterations=10)
    Image.fromarray((body * 255).astype(np.uint8)).resize((1408, 792)).save(WORK / "sky-terrain-mask.png")
    g = scene(glow, Image.BICUBIC) if glow else np.zeros_like(a)
    f = scene(fill, Image.LANCZOS, True)
    compose(a, f, g, body, "sky-terrain.webp")


if __name__ == "__main__":
    kind = sys.argv[1]
    args = [None if v == "none" else v for v in sys.argv[2:]]
    if kind == "hold":
        hold(*args)
    else:
        terrain(*args)
