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


def margin(lin, px, py):
    h, w = lin.shape[:2]
    low, stars, noise = layers(lin)
    stars = stars * step(stars @ LW, 8 * noise, 16 * noise)[..., None]
    crowd = ndi.gaussian_filter(((stars @ LW) > 0).astype(np.float32), 30)
    stars = stars * (1 - step(crowd, 1.3 * float(np.median(crowd)), 2.2 * float(np.median(crowd))))[..., None]
    pad = ((py, py), (px, px), (0, 0))
    base = np.pad(low, pad, mode="edge")
    soft = np.stack([ndi.gaussian_filter(base[..., i], 70) for i in range(3)], -1)
    inside = np.zeros(base.shape[:2], bool)
    inside[py:py + h, px:px + w] = True
    k = step(ndi.distance_transform_edt(~inside), 0, 110)[..., None]
    far = np.pad(np.roll(stars, (h // 2, w // 2), axis=(0, 1)), pad, mode="wrap")
    wide = base * (1 - k) + soft * k + far
    wide[py:py + h, px:px + w] = lin
    return wide.astype(np.float32)


def save(lin, name):
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    wide = margin(lin, px, py)
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (("full", 1), ("web", 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(ROOT / "public/assets/saturn" / key / name, lossless=True, quality=90, method=6)
    img.resize((1760, 990), Image.LANCZOS).convert("RGB").save(WORK / (name.replace(".webp", "") + "-preview.jpg"), quality=90)


def layers(x, mask=None):
    low = np.stack([ndi.gaussian_filter(ndi.grey_opening(x[..., i], size=(9, 9)), 5) for i in range(3)], -1)
    res = x - low
    lum = res @ LW
    pick = lum if mask is None else lum[mask]
    noise = 1.4826 * float(np.median(np.abs(pick - np.median(pick))))
    keep = step(lum, 2.5 * noise, 5 * noise)
    return low, np.maximum(res, 0) * keep[..., None], noise


def compose(a, f, g, body, name):
    sky = np.maximum(a - g, 0)
    la = ndi.gaussian_filter(a @ LW, 10)
    lg = ndi.gaussian_filter(g @ LW, 10)
    far = ndi.distance_transform_edt(~body)
    own = step(far, 5, 14) * (1 - step(lg / np.maximum(la, 1e-5), 0.6, 0.85))
    own = ndi.gaussian_filter(own, 3)
    near = (own > 0.98).astype(np.float32)
    pick = near > 0
    low_s, star_s, noise_s = layers(sky, pick)
    low_f, star_f, noise_f = layers(f, pick)
    gain = np.array([np.median(low_s[..., i][pick]) / max(np.median(low_f[..., i][pick]), 1e-6) for i in range(3)])
    k = 8
    small = lambda v: v.reshape(v.shape[0] // k, k, v.shape[1] // k, k).mean((1, 3))
    grow = lambda v: ndi.zoom(v, k, order=1, mode="nearest", grid_mode=True)
    near_s = small(near)
    low_small = [small(low_s[..., i] * near) for i in range(3)]
    wide = None
    for sigma in (600, 200, 70):
        soft = lambda v: ndi.gaussian_filter(v, sigma / k)
        support = soft(near_s)
        est = np.stack([grow(soft(c) / np.maximum(support, 1e-6)) for c in low_small], -1)
        known = np.clip(grow(support) / 0.25, 0, 1)[..., None]
        wide = est if wide is None else wide * (1 - known) + est * known
    lum_f = low_f @ LW
    mod = np.clip(lum_f / np.maximum(grow(ndi.gaussian_filter(small(lum_f), 70 / k)), 1e-6), 0.6, 1.8)
    mod = 1 + 0.5 * (ndi.gaussian_filter(mod, 6) - 1)
    inner = (1 - own) > 0.98
    top = lambda v: float(np.percentile((v @ LW)[pick], 99.9))
    count = lambda v, t: float(((v @ LW)[pick] > t).mean())
    level = top(star_s)
    sgain = float(np.clip(level / max(top(star_f), 1e-6), 0.3, 3.0))
    for _ in range(12):
        ratio = count(star_s, 0.25 * level) / max(count(star_f * sgain, 0.25 * level), 1e-9)
        sgain = float(np.clip(sgain * np.clip(ratio, 0.5, 2.0) ** 0.5, 0.2, 4.0))
    print(name, "background gain", gain.round(3), "star gain", round(sgain, 3), "noise sky fill", round(noise_s, 5), round(noise_f, 5), "own share", float(own.mean().round(3)))
    tint = lambda v, m: np.array([float(v[..., i][m & ((v @ LW) > 0.25 * level)].mean()) for i in range(3)])
    ts, tf = tint(star_s, pick), tint(star_f * sgain, inner)
    hue = (ts / (ts @ LW)) / (tf / (tf @ LW))
    grey = (star_f @ LW)[..., None]
    stars = (grey + 0.5 * (star_f - grey)) * hue * sgain
    print(name, "star tint sky", (ts / (ts @ LW)).round(3), "fill", (tf / (tf @ LW)).round(3), "share sky", round(count(star_s, 0.25 * level), 5), "fill", round(float(((stars @ LW)[inner] > 0.25 * level).mean()), 5))
    fill = wide * mod[..., None] + stars
    lin = sky * own[..., None] + fill * (1 - own[..., None])
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
    body = hit | ((tr > 0) & (rr < 2.45))
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
    calm = ndi.gaussian_filter(ndi.grey_opening(a @ LW, size=(9, 9)), 8)
    far = ndi.distance_transform_edt(~body)
    base = float(np.median(calm[far > 250]))
    halo = (calm > 1.5 * base) & (far < 160)
    print("halo share", float(halo.mean().round(4)), "base", round(base, 5))
    body |= ndi.binary_dilation(halo, iterations=8)
    Image.fromarray((body * 255).astype(np.uint8)).resize((1408, 792)).save(WORK / "sky-terrain-mask.png")
    g = scene(glow, Image.BICUBIC) if glow else np.zeros_like(a)
    f = scene(fill, Image.LANCZOS, True)
    compose(a, f, g, body, "sky-terrain.webp")


def again(name):
    img = np.asarray(Image.open(ROOT / "public/assets/saturn/full" / name).convert("RGB")).astype(np.float32) / 255
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    save(unfilm(to_linear(img[py:py + FULL[1], px:px + FULL[0]])).astype(np.float32), name)


if __name__ == "__main__":
    kind = sys.argv[1]
    if kind == "margin":
        again(sys.argv[2])
        sys.exit(0)
    args = [None if v == "none" else v for v in sys.argv[2:]]
    if kind == "hold":
        hold(*args)
    else:
        terrain(*args)
