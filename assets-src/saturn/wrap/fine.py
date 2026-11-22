import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from geo import FIT, POLAR, filmic, hero_camera, hero_geometry, hero_image, light_at, ring_frame, scene, sun_local, term_shift  # noqa: E402
from lib import linear_to_srgb  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / "out/work/saturn"
GEN = WORK / "fine"
W, H = 8192, 4096
TW, TH = 2816, 1584
SCALE = 2
X0 = [0, 2048]
Y0 = (H // SCALE - TH) // 2
LW = np.array([0.0722, 0.7152, 0.2126], dtype=np.float32)
TOP = 0.97
CROP = (928, 200, 2080, 1352)
RING = (0.17, 0.11)
VIEW = (0.18, 0.36)
LIT = (0.02, 0.12)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def base():
    path = WORK / "wrap-base.png"
    if not path.exists():
        cv2.imwrite(str(path), cv2.imread(str(WORK / "keep/wrap-color-full-r3.jpg")))
    return cv2.imread(str(path))


def prep():
    GEN.mkdir(parents=True, exist_ok=True)
    half = cv2.resize(base(), (W // SCALE, H // SCALE), interpolation=cv2.INTER_AREA)
    for k, x0 in enumerate(X0):
        cols = np.arange(x0, x0 + TW) % half.shape[1]
        cv2.imwrite(str(GEN / f"t{k}_in.png"), half[Y0:Y0 + TH][:, cols])
    print("tiles", len(X0), "rows", Y0, Y0 + TH, "lat", 90 - Y0 * SCALE / H * 180, 90 - (Y0 + TH) * SCALE / H * 180)


def hero_scene_2x():
    native = hero_image()
    x0, y0, x1, y1 = CROP
    crop = native[y0:y1, x0:x1]
    up = cv2.imread(str(WORK / "hero-globe-2x.png"))[..., ::-1].astype(np.float32) / 255
    low = cv2.resize(up, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    fix = cv2.resize(crop - low, (up.shape[1], up.shape[0]), interpolation=cv2.INTER_CUBIC)
    return scene(np.clip(up + fix, 0, 1)).astype(np.float32)


def high(logv, m, s):
    wt = np.maximum(cv2.GaussianBlur(m, (0, 0), s), 1e-3)
    return (logv - cv2.GaussianBlur(logv * m[..., None], (0, 0), s) / wt[..., None]) * m[..., None]


def hero(sigma, clip):
    GEN.mkdir(parents=True, exist_ok=True)
    x0, y0, x1, y1 = CROP
    g = hero_geometry(1)
    cut = lambda a: np.ascontiguousarray(a[y0:y1, x0:x1])
    n2 = (x1 - x0) * 2
    up2 = lambda a: cv2.resize(a.astype(np.float32), (n2, n2), interpolation=cv2.INTER_LINEAR)
    src = hero_scene_2x()
    light = up2(cut(light_at(np.load(WORK / "curve.npy"), np.load(WORK / "light-table.npy"), g["ndl"], g["p"][..., 1])))
    inner, outer = FIT["rings"]["inner"], FIT["rings"]["outer"]
    cam = hero_camera(FIT)
    M = ring_frame()
    sl = sun_local()
    cam_l = cam.pos @ M
    P1 = g["p"] * np.array([1, POLAR, 1])
    v1 = cam_l - P1
    v1 /= np.maximum(np.linalg.norm(v1, axis=-1, keepdims=True), 1e-9)
    t1 = -P1[..., 1] / np.where(np.abs(v1[..., 1]) > 1e-6, v1[..., 1], 1e-6)
    r1 = np.linalg.norm(P1[..., [0, 2]] + v1[..., [0, 2]] * t1[..., None], axis=-1)
    under = (t1 > 0) & (r1 > inner - RING[0]) & (r1 < outer + 0.05)
    valid = cut(g["hit"] & ~under & (g["mu"] > 0.08)).astype(np.float32)
    m = cv2.erode((up2(valid) > 0.99).astype(np.uint8), np.ones((13, 13), np.uint8)).astype(np.float32)
    s = sigma * 2816 / 1920 * 2
    log_a = np.log(np.maximum(src / np.maximum(light, 2e-3), 1e-3))
    p = up2(cut(g["p"]))
    p /= np.maximum(np.linalg.norm(p, axis=-1, keepdims=True), 1e-6)
    u = (np.arctan2(p[..., 0], p[..., 2]) / (2 * np.pi) + 0.5) * (W // SCALE) - 0.5
    v = (0.5 - np.arcsin(np.clip(p[..., 1], -1, 1)) / np.pi) * (H // SCALE) - 0.5
    half = scene(cv2.resize(base(), (W // SCALE, H // SCALE), interpolation=cv2.INTER_AREA)[..., ::-1].astype(np.float32) / 255).astype(np.float32)
    seen = cv2.remap(half, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    log_m = np.log(np.maximum(seen, 1e-3))
    lum = cv2.GaussianBlur(src @ LW[::-1], (0, 0), 3)
    conf = m
    d_hero = high(log_a, m, s)
    d_map = high(log_m, m, s)
    d = clip * np.tanh((d_hero - d_map) / clip) * conf[..., None]
    ndl = up2(cut(g["ndl"]))
    for a, b in ((-0.3, -0.1), (-0.1, 0.0), (0.0, 0.1), (0.1, 0.2), (0.2, 0.42), (0.42, 1.0)):
        k = (ndl >= a) & (ndl < b) & (m > 0)
        print("ndl", a, b, "px", int(k.sum()), "hero detail std", round(float(d_hero[k].std()), 4), "map detail std", round(float(d_map[k].std()), 4), "kept std", round(float(d[k].std()), 4), "conf", round(float(conf[k].mean()), 3), "luma", round(float(lum[k].mean()), 4))
    np.save(GEN / "hero-detail-img.npy", d.astype(np.float16))
    np.save(GEN / "hero-zone-img.npy", conf.astype(np.float16))
    show = lambda a: np.clip(a[..., ::-1] * 255 + 127, 0, 255).astype(np.uint8)
    cv2.imwrite(str(GEN / "hero-detail-img.png"), np.concatenate([show(d_hero), show(d_map), show(d)], 1)[::2, ::2])

    hw, hh = W // SCALE, H // SCALE
    out = np.zeros((hh, hw, 3), dtype=np.float32)
    zone = np.zeros((hh, hw), dtype=np.float32)
    lon = ((np.arange(hw) + 0.5) / hw - 0.5) * 2 * np.pi
    for r0 in range(0, hh, 256):
        rows = np.arange(r0, min(r0 + 256, hh))
        lat = (0.5 - (rows + 0.5) / hh) * np.pi
        cl, sn = np.cos(lat)[:, None], np.sin(lat)[:, None]
        q = np.stack([cl * np.sin(lon)[None], np.broadcast_to(sn, (len(rows), hw)), cl * np.cos(lon)[None]], -1)
        P = q * np.array([1, POLAR, 1])
        nl = q * np.array([1, 1 / POLAR, 1])
        nl /= np.linalg.norm(nl, axis=-1, keepdims=True)
        vw = cam_l - P
        vw /= np.linalg.norm(vw, axis=-1, keepdims=True)
        mu = (nl * vw).sum(-1)
        px, py, _ = cam.project(P @ M.T)
        mx = ((px - x0) * 2 - 0.5).astype(np.float32)
        my = ((py - y0) * 2 - 0.5).astype(np.float32)
        tc = -P[..., 1] / np.where(np.abs(vw[..., 1]) > 1e-6, vw[..., 1], 1e-6)
        rc = np.linalg.norm(P[..., [0, 2]] + vw[..., [0, 2]] * tc[..., None], axis=-1)
        cover = np.where(tc > 0, smoothstep(inner - RING[0], inner - RING[1], rc) * (1 - smoothstep(outer + 0.015, outer + 0.05, rc)), 0)
        inside = (mx > 2) & (my > 2) & (mx < n2 - 3) & (my < n2 - 3)
        ndl_m = nl @ sl - term_shift(q[..., 1])
        w = smoothstep(VIEW[0], VIEW[1], mu) * smoothstep(LIT[0], LIT[1], ndl_m) * (1 - cover) * inside * (mu > 0)
        out[rows] = cv2.remap(d, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) * w[..., None]
        zone[rows] = cv2.remap(conf, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) * w
    np.save(GEN / "hero-detail-half.npy", out.astype(np.float16))
    np.save(GEN / "hero-zone-half.npy", zone.astype(np.float16))
    cv2.imwrite(str(GEN / "hero-zone-half.jpg"), (zone * 255).astype(np.uint8))
    print("hero zone share of the map", round(float((zone > 0.5).mean()), 4), "detail std in the zone", round(float(out[zone > 0.5].std()), 4))


def luma(img):
    return np.maximum(scene(np.minimum(img.astype(np.float32) / 255, TOP)) @ LW, 1e-3).astype(np.float32)


def detail(take, src, sigma):
    d = np.log(luma(take)) - np.log(luma(src))
    return d - cv2.GaussianBlur(d, (0, 0), sigma)


def place(takes, sigma_near, sigma_far, gain_near, gain_far, up, down):
    full = base()
    hw = W // SCALE
    half = cv2.resize(full, (hw, H // SCALE), interpolation=cv2.INTER_AREA)
    keep = np.load(GEN / "hero-zone-half.npy").astype(np.float32)
    own = np.load(GEN / "hero-detail-half.npy").astype(np.float32)
    acc = np.zeros((H // SCALE, hw, 2), dtype=np.float32)
    wsum = np.zeros((H // SCALE, hw), dtype=np.float32)
    over = TW - hw // len(X0)
    for k, (x0, name) in enumerate(zip(X0, takes)):
        take = cv2.imread(str(GEN / name))
        if take.shape[1] != TW or take.shape[0] != TH:
            take = cv2.resize(take, (TW, TH), interpolation=cv2.INTER_AREA if take.shape[1] > TW else cv2.INTER_CUBIC)
        cols = np.arange(x0, x0 + TW) % hw
        src = half[Y0:Y0 + TH][:, cols]
        shift = cv2.phaseCorrelate(np.float32(cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)), np.float32(cv2.cvtColor(take, cv2.COLOR_BGR2GRAY)))
        print(name, "shift", np.round(shift[0], 2), "response", round(shift[1], 3))
        x = np.arange(TW, dtype=np.float32)
        wx = smoothstep(0, over, x) * (1 - smoothstep(TW - over, TW, x))
        y = np.arange(TH, dtype=np.float32)
        wy = smoothstep(0, 96, y) * (1 - smoothstep(TH - 96, TH, y))
        w = wy[:, None] * wx[None, :]
        for i, s in enumerate((sigma_near, sigma_far)):
            d = detail(take, src, s)
            print("  sigma", s, "detail std", round(float(d.std()), 4), "p99", round(float(np.percentile(np.abs(d), 99)), 4))
            np.add.at(acc[Y0:Y0 + TH, :, i], (slice(None), cols), d * w)
        np.add.at(wsum[Y0:Y0 + TH], (slice(None), cols), w)
    row = smoothstep(0, 96, np.arange(H // SCALE, dtype=np.float32) - Y0) * (1 - smoothstep(Y0 + TH - 96, Y0 + TH, np.arange(H // SCALE, dtype=np.float32)))
    acc /= np.maximum(wsum, 1e-3)[..., None]
    d = (acc[..., 0] * gain_near * keep + acc[..., 1] * gain_far * (1 - keep)) * row[:, None]
    d = np.where(d > 0, up * np.tanh(d / up), down * np.tanh(d / down))
    d = d[..., None] + own
    np.save(GEN / "detail-half.npy", d.astype(np.float16))
    big = cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC)
    img = full.copy()
    for y in range(0, H, 256):
        rows = slice(y, y + 256)
        on = np.abs(big[rows]).max(-1) > 1e-4
        if not np.any(on):
            continue
        sc = scene(full[rows][..., ::-1].astype(np.float32) / 255) * np.exp(big[rows])
        enc = np.clip(linear_to_srgb(filmic(sc)) * 255 + 0.5, 0, 255).astype(np.uint8)[..., ::-1]
        img[rows] = np.where(on[..., None], enc, full[rows])
    cv2.imwrite(str(WORK / "wrap-fine.png"), img)
    print("detail std in the hero zone", round(float(d[keep > 0.9].std()), 4), "elsewhere", round(float(d[(keep < 0.1) & (row[:, None] > 0.9)].std()), 4))
    return img


def ship():
    img = cv2.imread(str(WORK / "wrap-fine.png"))
    q = [cv2.IMWRITE_JPEG_QUALITY, 94, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
    cv2.imwrite(str(ROOT / "public/assets/saturn/full/wrap-color.jpg"), img, q)
    cv2.imwrite(str(ROOT / "public/assets/saturn/web/wrap-color.jpg"), cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA), q)
    print("shipped")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "prep":
        prep()
    elif cmd == "place":
        n = len(X0)
        place(sys.argv[2:2 + n], *[float(v) for v in sys.argv[2 + n:8 + n]])
    elif cmd == "hero":
        hero(*[float(v) for v in sys.argv[2:4]])
    elif cmd == "ship":
        ship()
