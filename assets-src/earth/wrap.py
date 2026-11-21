import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geo
import motion

Image.MAX_IMAGE_PIXELS = None
CACHE = geo.ROOT / "references" / "cache" / "earth"
SPLIT = geo.WORK / "split"
GUIDE = geo.WORK / "guide"
VIEW = geo.WORK / "view"
PUBLIC = geo.ROOT / "public" / "assets" / "earth"
GUIDE.mkdir(parents=True, exist_ok=True)
SCALE = 2
CENTRE = (-77.354, 13.777)
AZ_PX = 12.0
AZ_R = 120.0
AZ_N = int(2 * AZ_R * AZ_PX)
AZ_C = AZ_N / 2
AZ = geo.gnomonic_frame(*CENTRE)
FADE = (0.2, 0.42)
CLOUD = np.array([0.86, 0.88, 0.9], dtype=np.float32)
GOLD = np.array([1.0, 0.72, 0.36], dtype=np.float32)
LUT_N = 32


def az_xy(y):
    n, e, u = AZ
    ang = np.degrees(np.arccos(np.clip(y @ n, -1, 1)))
    ex, uy = y @ e, y @ u
    k = ang * AZ_PX / np.maximum(np.hypot(ex, uy), 1e-9)
    return (AZ_C + ex * k - 0.5).astype(np.float32), (AZ_C - uy * k - 0.5).astype(np.float32)


def az_dirs(px, py):
    n, e, u = AZ
    dx, dy = (px + 0.5 - AZ_C) / AZ_PX, (AZ_C - py - 0.5) / AZ_PX
    r = np.maximum(np.hypot(dx, dy), 1e-9)
    ang = np.radians(r)
    s = np.sin(ang) / r
    return np.cos(ang)[..., None] * n + (dx * s)[..., None] * e + (dy * s)[..., None] * u


def guide(name, width):
    out = GUIDE / f"{name}-{width}.png"
    if not out.exists():
        src = {"bm": "bluemarble-july-21600.jpg", "clouds": "viirs-2020-09-10.jpg", "lights": "blackmarble-13500.jpg"}[name]
        im = cv2.imread(str(CACHE / src), cv2.IMREAD_COLOR)
        im = cv2.resize(im, (width, width // 2), interpolation=cv2.INTER_AREA if im.shape[1] > width else cv2.INTER_CUBIC)
        cv2.imwrite(str(out), im)
    return cv2.imread(str(out), cv2.IMREAD_COLOR)[..., ::-1]


def sample(img, y, inter=cv2.INTER_LINEAR):
    x, yy = geo.map_xy(y, img.shape[1])
    return cv2.remap(img, x, yy, inter, borderMode=cv2.BORDER_WRAP)


def blueness(c):
    return np.clip((c[..., 2] - c[..., 0]) / (c[..., 2] + c[..., 0] + 0.03), -0.3, 0.6)


def nblur(v, w, s):
    return geo.blur(v * w[..., None], s) / np.maximum(geo.blur(w, s), 1e-4)[..., None]


def hero_at(arr, y, inter=cv2.INTER_CUBIC):
    px, py, cosv, ndl = geo.project_dirs(y, SCALE)
    return cv2.remap(arr, px, py, inter, borderMode=cv2.BORDER_CONSTANT, borderValue=0), cosv, ndl


def register(S):
    path = GUIDE / "flow.npy"
    if path.exists():
        return np.load(path)
    py, px = np.mgrid[0:AZ_N, 0:AZ_N].astype(np.float32)
    y = az_dirs(px, py)
    ang = np.hypot(px + 0.5 - AZ_C, py + 0.5 - AZ_C) / AZ_PX
    s, cosv, ndl = hero_at(S, y, cv2.INTER_LINEAR)
    bm = sample(guide("bm", 4096), y).astype(np.float32) / 255
    valid = ((cosv > 0.22) & (ang < 88)).astype(np.float32)
    hb, bb = geo.blur(blueness(s), 1.5), geo.blur(blueness(bm), 1.5)
    hb = hb * valid + bb * (1 - valid)
    to8 = lambda v: np.clip((v + 0.3) / 0.9 * 255, 0, 255).astype(np.uint8)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(1)
    flow = dis.calc(to8(hb), to8(bb), None)
    conf = valid * geo.smooth(0.22, 0.4, cosv)
    c1, c2 = geo.blur(conf, 30.0), geo.blur(conf, 150.0)
    f1, f2 = nblur(flow, conf, 30.0), nblur(flow, conf, 150.0)
    t = geo.smooth(0.1, 0.6, c1)[..., None]
    out = (f1 * t + f2 * (1 - t)) * geo.smooth(0.0, 0.12, c2)[..., None]
    np.save(path, out.astype(np.float32))
    mag = np.hypot(out[..., 0], out[..., 1]) / AZ_PX
    print("registration flow in degrees: median %.2f p95 %.2f max %.2f" % (np.median(mag[valid > 0]), np.percentile(mag[valid > 0], 95), mag.max()))
    return out


def real_dirs(y, flow):
    ax, ay = az_xy(y)
    f = cv2.remap(flow, ax, ay, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return az_dirs(ax + f[..., 0], ay + f[..., 1])


def build_lut(S, alpha, flow):
    path = GUIDE / "lut.npy"
    if path.exists():
        return np.load(path)
    py, px = np.mgrid[0:AZ_N, 0:AZ_N].astype(np.float32)
    y = az_dirs(px, py)
    s, cosv, ndl = hero_at(S, y, cv2.INTER_LINEAR)
    a, _, _ = hero_at(alpha, y, cv2.INTER_LINEAR)
    ang = np.hypot(px + 0.5 - AZ_C, py + 0.5 - AZ_C) / AZ_PX
    bm = sample(guide("bm", 8192), real_dirs(y, flow))
    m = (cosv > 0.3) & (ndl > 0.2) & (ang < 88) & (a < 0.5)
    q = (bm[m].astype(np.int64) * LUT_N) // 256
    idx = (q[:, 0] * LUT_N + q[:, 1]) * LUT_N + q[:, 2]
    cnt = np.bincount(idx, minlength=LUT_N ** 3).astype(np.float64).reshape(LUT_N, LUT_N, LUT_N)
    lut = np.zeros((LUT_N, LUT_N, LUT_N, 3))
    grid = (np.arange(LUT_N) + 0.5) / LUT_N
    ident = np.stack(np.meshgrid(grid, grid, grid, indexing="ij"), -1)
    for c in range(3):
        sm = np.bincount(idx, weights=s[m][:, c].astype(np.float64), minlength=LUT_N ** 3).reshape(LUT_N, LUT_N, LUT_N)
        acc, wacc = np.zeros_like(sm), np.zeros_like(sm)
        for sig, wgt in ((0.7, 1.0), (2.0, 0.02), (5.0, 0.0005)):
            acc += wgt * ndimage.gaussian_filter(sm, sig, mode="nearest")
            wacc += wgt * ndimage.gaussian_filter(cnt, sig, mode="nearest")
        prior = 2e-4
        lut[..., c] = (acc + prior * ident[..., c]) / (wacc + prior)
    np.save(path, lut.astype(np.float32))
    return lut.astype(np.float32)


def apply_lut(lut, rgb8):
    p = rgb8.reshape(-1, 3).astype(np.float32) * (LUT_N / 256.0) - 0.5
    out = np.stack([ndimage.map_coordinates(lut[..., c], p.T, order=1, mode="nearest") for c in range(3)], -1)
    return out.reshape(rgb8.shape).astype(np.float32)


def far_cloud(y_real, bm8):
    v = sample(guide("clouds", 8192), y_real).astype(np.float32) / 255
    b = bm8.astype(np.float32) / 255
    white = v.min(-1)
    ground = b.min(-1)
    lat = np.degrees(np.arcsin(np.clip(y_real[..., 1], -1, 1)))
    a = geo.smooth(0.5, 0.92, white) * (1 - geo.smooth(0.35, 0.6, ground)) * geo.smooth(78, 66, np.abs(lat))
    tone = 0.72 + 0.28 * geo.smooth(0.6, 1.0, white)
    return a.astype(np.float32), (CLOUD * tone[..., None]).astype(np.float32)


def far_lights(y_real):
    v = sample(guide("lights", 8192), y_real).astype(np.float32) / 255
    l = v.max(-1)
    e = np.clip((l - 0.18) / 0.82, 0, 1) ** 1.6
    return (GOLD * (e * 2.2)[..., None]).astype(np.float32)


def save_rgba(path, rgba, quality):
    a = np.clip(rgba * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(a, "RGBA").save(path, "WEBP", quality=quality, exact=True, method=4)


def main(width):
    height = width // 2
    S = np.load(SPLIT / "surface.npy").astype(np.float32)
    A = np.load(SPLIT / "alpha.npy").astype(np.float32)
    Wc = np.load(SPLIT / "cloud.npy").astype(np.float32)
    flow = register(S)
    lut = build_lut(S, A, flow)
    bm = guide("bm", 12288)
    surface = np.zeros((height, width, 3), np.uint8)
    cloud = np.zeros((height, width, 4), np.uint8)
    strip = 256
    for r0 in range(0, height, strip):
        rows = np.arange(r0, min(r0 + strip, height))
        y = geo.map_dirs(width, rows)
        yr = real_dirs(y, flow)
        b8 = sample(bm, yr, cv2.INTER_CUBIC)
        far = apply_lut(lut, b8)
        s, cosv, _ = hero_at(S, y)
        w = geo.smooth(*FADE, cosv)[..., None]
        surface[r0:r0 + len(rows)] = np.clip((s * w + far * (1 - w)) * 255 + 0.5, 0, 255).astype(np.uint8)
        yc = motion.unwarp(y, motion.S_MID)
        a, cosc, _ = hero_at(A, yc)
        wc, _, _ = hero_at(Wc, yc)
        wh = geo.smooth(*FADE, cosc)
        fa, fw = far_cloud(real_dirs(y, flow), b8)
        a = np.clip(a, 0, 1)
        am = wh * a + (1 - wh) * fa
        pre = (wh * a)[..., None] * geo.decode(np.clip(wc, 0, 1)) + ((1 - wh) * fa)[..., None] * fw
        col = np.where(am[..., None] > 0.02, pre / np.maximum(am, 1e-4)[..., None], CLOUD)
        cloud[r0:r0 + len(rows), :, :3] = np.clip(geo.encode(col) * 255 + 0.5, 0, 255).astype(np.uint8)
        cloud[r0:r0 + len(rows), :, 3] = np.clip(am * 255 + 0.5, 0, 255).astype(np.uint8)
    del S, A, Wc, bm
    ew = width // 2
    city = np.load(SPLIT / "city.npy").astype(np.float32)
    aur = np.load(SPLIT / "aurora.npy").astype(np.float32)
    y = geo.map_dirs(ew)
    c, cosv, ndl = hero_at(city, y, cv2.INTER_LINEAR)
    g, _, _ = hero_at(aur, y, cv2.INTER_LINEAR)
    w = geo.smooth(0.1, 0.25, cosv)[..., None]
    nf = np.maximum(geo.smooth(*geo.NIGHT, ndl), 0.2)[..., None]
    lights = far_lights(real_dirs(y, flow))
    e = np.maximum(c, 0) / nf * w + lights * (1 - w)
    af = np.maximum(geo.smooth(*motion.AURORA_GATE, ndl), 0.25)
    am = np.maximum(g, 0).max(-1) / af * w[..., 0]
    emissive = np.concatenate([geo.linear_to_srgb(np.clip(e / motion.EMISSIVE_PEAK, 0, 1)), np.sqrt(np.clip(am / motion.EMISSIVE_PEAK, 0, 1))[..., None]], -1)
    for key, k in (("full", 1), ("web", 2)):
        d = PUBLIC / key
        d.mkdir(parents=True, exist_ok=True)
        sw = width // k
        sm = surface if k == 1 else cv2.resize(surface, (sw, sw // 2), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(d / "wrap-surface.jpg"), sm[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92 if k == 1 else 88, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
        cm = cloud if k == 1 else cv2.resize(cloud, (sw, sw // 2), interpolation=cv2.INTER_AREA)
        Image.fromarray(cm, "RGBA").save(d / "wrap-cloud.webp", "WEBP", quality=90 if k == 1 else 84, exact=True, method=4)
        em = emissive if k == 1 else cv2.resize(emissive, (ew // k, ew // k // 2), interpolation=cv2.INTER_AREA)
        save_rgba(d / "wrap-emissive.webp", em, 92 if k == 1 else 86)
    lon, lat = motion.STORM["lon"], motion.STORM["lat"]
    meta = {"surface": {"full": [width, height], "web": [width // 2, height // 2]}, "cloud": {"full": [width, height], "web": [width // 2, height // 2]}, "emissive": {"full": [ew, ew // 2], "web": [ew // 2, ew // 4]}, "heroCentre": list(CENTRE), "heroFade": list(FADE), "storm": {"lon": lon, "lat": lat}}
    (geo.ROOT / "src" / "stops" / "earth" / "wrap.json").write_text(json.dumps(meta, indent=1) + "\n")
    small = cv2.resize(surface, (2048, 1024), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(VIEW / "wrap-surface-small.jpg"), small[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
    cs = cv2.resize(cloud, (2048, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    comp = small.astype(np.float32) / 255 * (1 - cs[..., 3:]) + cs[..., :3] * cs[..., 3:]
    geo.write(VIEW / "wrap-comp-small.jpg", comp, 90)
    geo.write(VIEW / "wrap-emissive-small.jpg", np.clip(emissive[::2, ::2, :3] + emissive[::2, ::2, 3:] * np.array([0.3, 1.0, 0.45]), 0, 1), 90)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 8192)
