import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
FIT = json.loads((ROOT / "assets-src/mars/fit.json").read_text())
MOON = json.loads((ROOT / "assets-src/mars/phobos/phobos.json").read_text())
HERO = ROOT / "references/approved/mars-hero.png"
W, H = 4096, 2048
FACING = (0.1, 0.3)
EDGE_PX = 2.5
DEPTH_SLACK = 0.004
SOFT_DEG = 2.0
GROW_DEG = 14.0


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def rotate(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


def heights(key):
    w, h = MOON["sets"][key]["heightSize"]
    raw = np.fromfile(ROOT / f"public/assets/mars/{key}/phobos-height.bin", dtype="<u2").reshape(h, w)
    return raw.astype(np.float32) / 65535


def grow(mask, W):
    r = int(round(GROW_DEG / 360 * W))
    wide = np.concatenate([mask, mask, mask], 1)
    core = cv2.dilate((wide > 0.5).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    core = cv2.GaussianBlur(core, (0, 0), r * 0.35)
    return np.maximum(mask, np.clip(core * 1.15, 0, 1)[:, W:2 * W])


def main():
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/assets/mars"
    hero = np.asarray(Image.open(HERO).convert("RGB")).astype(np.float32) / 255
    ih, iw = hero.shape[:2]
    lon = ((np.arange(W) + 0.5) / W - 0.5) * 2 * np.pi
    lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    lon, lat = np.meshgrid(lon, lat)
    d = np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)
    h = cv2.resize(heights("full"), (W, H), interpolation=cv2.INTER_CUBIC)
    r = (MOON["lo"] + (MOON["hi"] - MOON["lo"]) * h) * MOON["radius"]
    local = d * r[..., None]
    east = np.roll(local, -1, 1) - np.roll(local, 1, 1)
    north = np.empty_like(local)
    north[1:-1] = local[:-2] - local[2:]
    north[0] = local[0] - local[1]
    north[-1] = local[-2] - local[-1]
    n = np.cross(east, north)
    n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-12)
    q = np.array(MOON["holdQuaternion"])
    world = rotate(q, local.reshape(-1, 3)).reshape(H, W, 3) + np.array(MOON["center"])
    nw = rotate(q, n.reshape(-1, 3)).reshape(H, W, 3)
    cam = world - np.array(FIT["camera"]["position"])
    f = (ih / 2) / np.tan(np.radians(FIT["vfovDeg"]) / 2)
    depth = -cam[..., 2]
    px = (iw / 2 + cam[..., 0] / depth * f - 0.5).astype(np.float32)
    py = (ih / 2 - cam[..., 1] / depth * f - 0.5).astype(np.float32)
    view = -cam / np.linalg.norm(cam, axis=-1, keepdims=True)
    mu = (nw * view).sum(-1)
    xi = np.clip(np.round(px).astype(int), 0, iw - 1)
    yi = np.clip(np.round(py).astype(int), 0, ih - 1)
    zbuf = np.full((ih, iw), np.inf, np.float32)
    np.minimum.at(zbuf, (yi, xi), depth.astype(np.float32))
    body = np.isfinite(zbuf).astype(np.uint8)
    body = cv2.morphologyEx(body, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    near = cv2.erode(np.where(np.isfinite(zbuf), zbuf, 1e9).astype(np.float32), np.ones((3, 3), np.uint8))
    inside = cv2.distanceTransform(body, cv2.DIST_L2, 5)
    seen = (depth <= near[yi, xi] + DEPTH_SLACK * MOON["radius"] * 10) & (mu > 0)
    edge = cv2.remap(inside, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    weight = smooth(FACING[0], FACING[1], mu) * smooth(EDGE_PX, EDGE_PX + 3, edge) * seen
    color = cv2.remap(hero, px, py, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    color = np.clip(color, 0, 1)
    solid = (weight > 0.05).astype(np.float32)
    acc = color * solid[..., None]
    cov = solid.copy()
    fill = acc.copy()
    filled = cov.copy()
    for s in (2, 4, 8, 16, 32, 64, 128, 256):
        ba = cv2.GaussianBlur(np.concatenate([acc, acc, acc], 1), (0, 0), s)[:, W:2 * W]
        bc = cv2.GaussianBlur(np.concatenate([cov, cov, cov], 1), (0, 0), s)[:, W:2 * W]
        ok = (bc > 1e-3) & (filled < 0.5)
        fill[ok] = ba[ok] / bc[ok][:, None]
        filled[ok] = 1
    lit = color * solid[..., None] + fill * (1 - solid[..., None])
    sigma = SOFT_DEG / 360 * W
    soft = cv2.GaussianBlur(np.concatenate([weight, weight, weight], 1).astype(np.float32), (0, 0), sigma)[:, W:2 * W]
    mask = np.clip(np.minimum(weight, soft * 1.2), 0, 1)
    mask = grow(mask, W)
    for key, size in (("full", (W, H)), ("web", (W // 2, H // 2))):
        target = out_dir / key
        target.mkdir(parents=True, exist_ok=True)
        a = lit if key == "full" else cv2.resize(lit, size, interpolation=cv2.INTER_AREA)
        m = mask if key == "full" else cv2.resize(mask, size, interpolation=cv2.INTER_AREA)
        Image.fromarray(np.round(np.clip(a, 0, 1) * 255).astype(np.uint8)).save(target / "phobos-lit.jpg", quality=95, subsampling=0)
        Image.fromarray(np.round(np.clip(m, 0, 1) * 255).astype(np.uint8)).save(target / "phobos-lit-mask.png", optimize=True)
    print("covered share of the map", round(float((mask > 0.5).mean()), 4))
    work = ROOT / "out/work/phobos"
    work.mkdir(parents=True, exist_ok=True)
    check = (hero * 0.5 + 0.5 * body[..., None]).clip(0, 1)
    Image.fromarray(np.round(check[900:1584, 1100:1900] * 255).astype(np.uint8)).save(work / "lit-check.png")


if __name__ == "__main__":
    main()
