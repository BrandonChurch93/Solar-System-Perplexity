import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "wrap"))
from lib import ROOT, WORK, plane_hit, spheroid_hit  # noqa: E402
from patch import FULL, LW, MARGIN, film, layers, step, to_linear, to_srgb, unfilm  # noqa: E402

K = 4


def small(v):
    return v.reshape(v.shape[0] // K, K, v.shape[1] // K, K, -1).mean((1, 3))


def grow(v, shape):
    out = np.stack([ndi.zoom(v[..., i], K, order=1, mode="nearest", grid_mode=True) for i in range(v.shape[-1])], -1)
    return out[:shape[0], :shape[1]]


def blur(v, sigma):
    return np.stack([ndi.gaussian_filter(v[..., i], sigma) for i in range(v.shape[-1])], -1)


def heal(low, hole, sigma):
    keep = small((~hole).astype(np.float32)[..., None])
    num = blur(small(low * (~hole)[..., None]), sigma / K)
    den = blur(keep, sigma / K)
    est = grow(num / np.maximum(den, 1e-4), low.shape)
    w = ndi.gaussian_filter(hole.astype(np.float32), 6)[..., None]
    return low * (1 - w) + est * w


def margin(low, stars, px, py):
    h, w = low.shape[:2]
    pad = ((py, py), (px, px), (0, 0))
    base = np.pad(low, pad, mode="reflect")
    lo = small(base)
    soft = [base, grow(blur(lo, 40 / K), base.shape), grow(blur(lo, 140 / K), base.shape)]
    inside = np.zeros(base.shape[:2], bool)
    inside[py:py + h, px:px + w] = True
    far = ndi.distance_transform_edt(~inside)
    a = step(far, 0, 50)[..., None]
    b = step(far, 40, 170)[..., None]
    wide = (soft[0] * (1 - a) + soft[1] * a) * (1 - b) + soft[2] * b
    crowd = ndi.gaussian_filter(((stars @ LW) > 0).astype(np.float32), 30)
    sparse = stars * (1 - step(crowd, 1.3 * float(np.median(crowd)), 2.2 * float(np.median(crowd))))[..., None]
    wide += np.pad(np.roll(sparse, (h // 2, w // 2), axis=(0, 1)), pad, mode="wrap")
    wide[py:py + h, px:px + w] = low + stars
    return wide.astype(np.float32)


def save(wide, name):
    img = Image.fromarray((to_srgb(film(wide)) * 255 + 0.5).astype(np.uint8))
    for key, k in (("full", 1), ("web", 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(ROOT / "public/assets/saturn" / key / name, lossless=True, quality=90, method=6)
    img.resize((1760, 990), Image.LANCZOS).convert("RGB").save(WORK / (name.replace(".webp", "") + "-preview.jpg"), quality=90)


def split(name, source):
    img = np.asarray(Image.open(source).convert("RGB")).astype(np.float32) / 255
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    lin = unfilm(to_linear(img[py:py + FULL[1], px:px + FULL[0]])).astype(np.float32)
    low, stars, noise = layers(lin)
    stars = stars * step(stars @ LW, 2.5 * noise, 5 * noise)[..., None]
    print(name, "noise", round(noise, 6), "star share", float(((stars @ LW) > 0).mean().round(4)))
    return low, stars, px, py


def hold(source):
    from geo import FIT, hero_camera, ring_frame
    low, stars, px, py = split("sky-hold.webp", source)
    cam = hero_camera(FIT)
    xs, ys = np.meshgrid(np.arange(cam.w) + 0.5, np.arange(cam.h) + 0.5)
    d = cam.rays_world(xs, ys)
    n = ring_frame()[:, 1]
    hit, _ = spheroid_hit(cam.pos, d, n)
    tr, pr = plane_hit(cam.pos, d, n)
    rr = np.linalg.norm(pr, axis=-1)
    body = hit | ((tr > 0) & (rr < 2.45))
    out = ndi.distance_transform_edt(~body)
    into = ndi.distance_transform_edt(body)
    rim = (out < 90) & (into < 14)
    moon = np.array(FIT["moons"][0]["position"])
    mx, my, _ = cam.project(moon)
    mr = FIT["moons"][0]["radius"] / np.linalg.norm(moon - cam.pos) / np.tan(np.radians(cam.vfov) / 2) * cam.h / 2
    disc = np.hypot(xs - mx, ys - my) < mr * 1.5 + 60
    s = cam.h / 1080
    streak = (xs > 1480 * s) & (np.abs(ys - 917 * s) < 30 * s) | (xs > 1700 * s) & (np.abs(ys - 964 * s) < 24 * s)
    hole = rim | disc | (streak & ~body)
    low = heal(low, hole, 70)
    gap = ndi.gaussian_filter((ndi.binary_dilation((tr > 0) & (rr < 1.62) | hit, iterations=60)).astype(np.float32), 12)[..., None]
    stars = stars * (1 - 0.62 * gap)
    stars = stars * (1 - 0.8 * ndi.gaussian_filter((streak & ~body).astype(np.float32), 4)[..., None] * (stars @ LW < 0.02)[..., None])
    print("healed share", float(hole.mean().round(4)), "moon", round(float(mx), 1), round(float(my), 1), round(float(mr), 1))
    save(margin(low, stars, px, py), "sky-hold.webp")


def terrain(source):
    low, stars, px, py = split("sky-terrain.webp", source)
    save(margin(low, stars, px, py), "sky-terrain.webp")


if __name__ == "__main__":
    if sys.argv[1] == "hold":
        hold(sys.argv[2])
    else:
        terrain(sys.argv[2])
    print("DONE")
