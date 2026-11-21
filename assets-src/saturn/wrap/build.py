import sys

import cv2
import numpy as np

from geo import FIT, POLAR, ROOT, WORK, curve_at, filmic, hero_camera, hero_image, ring_frame, scene, sun_local

sys.path.insert(0, str(ROOT / "assets-src" / "saturn"))
from lib import linear_to_srgb  # noqa: E402

W, H = 8192, 4096
PERIODS = int(sys.argv[1]) if len(sys.argv) > 1 else 8
CROP = (928, 200, 2080, 1352)
LW = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def hero_scene_2x():
    native = hero_image()
    x0, y0, x1, y1 = CROP
    crop = native[y0:y1, x0:x1]
    up = cv2.imread(str(WORK / "hero-globe-2x.png"))[..., ::-1].astype(np.float32) / 255
    low = cv2.resize(up, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    fix = cv2.resize(crop - low, (up.shape[1], up.shape[0]), interpolation=cv2.INTER_CUBIC)
    return scene(np.clip(up + fix, 0, 1)).astype(np.float32)


def main():
    cam = hero_camera(FIT)
    M = ring_frame()
    sl = sun_local()
    cam_l = cam.pos @ M
    curve = np.load(WORK / "curve.npy")
    src = hero_scene_2x()
    inner, outer = FIT["rings"]["inner"], FIT["rings"]["outer"]
    albedo = np.zeros((H, W, 3), dtype=np.float32)
    weight = np.zeros((H, W), dtype=np.float32)
    lon = ((np.arange(W) + 0.5) / W - 0.5) * 2 * np.pi
    for r0 in range(0, H, 256):
        rows = np.arange(r0, min(r0 + 256, H))
        lat = (0.5 - (rows + 0.5) / H) * np.pi
        cl, sn = np.cos(lat)[:, None], np.sin(lat)[:, None]
        p = np.stack([cl * np.sin(lon)[None], np.broadcast_to(sn, (len(rows), W)), cl * np.cos(lon)[None]], -1)
        P = p * np.array([1, POLAR, 1])
        nl = p * np.array([1, 1 / POLAR, 1])
        nl /= np.linalg.norm(nl, axis=-1, keepdims=True)
        v = cam_l - P
        dist = np.linalg.norm(v, axis=-1, keepdims=True)
        v /= dist
        mu = (nl * v).sum(-1)
        ndl = nl @ sl
        px, py, _ = cam.project(P @ M.T)
        mx = ((px - CROP[0]) * 2 - 0.5).astype(np.float32)
        my = ((py - CROP[1]) * 2 - 0.5).astype(np.float32)
        seen = cv2.remap(src, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        tc = -P[..., 1] / np.where(np.abs(v[..., 1]) > 1e-6, v[..., 1], 1e-6)
        rc = np.linalg.norm(P[..., [0, 2]] + v[..., [0, 2]] * tc[..., None], axis=-1)
        cover = np.where(tc > 0, smoothstep(inner - 0.05, inner - 0.015, rc) * (1 - smoothstep(outer + 0.015, outer + 0.05, rc)), 0)
        ts = -P[..., 1] / sl[1]
        rs = np.linalg.norm(P[..., [0, 2]] + sl[[0, 2]] * ts[..., None], axis=-1)
        shadow = np.where(ts > 0, smoothstep(inner - 0.06, inner - 0.02, rs) * (1 - smoothstep(outer + 0.02, outer + 0.06, rs)), 0)
        inside = (mx > 2) & (my > 2) & (mx < src.shape[1] - 3) & (my < src.shape[0] - 3)
        w = smoothstep(0.18, 0.4, mu) * smoothstep(0.08, 0.26, ndl) * (1 - cover) * (1 - shadow) * inside
        albedo[rows] = (seen / np.maximum(curve_at(curve, ndl), 1e-3)).astype(np.float32)
        weight[rows] = w.astype(np.float32)
    albedo[weight <= 0] = 0
    np.save(WORK / "wrap-hero-albedo.npy", albedo)
    np.save(WORK / "wrap-hero-weight.npy", weight)

    w2 = weight ** 2
    num = (albedo * w2[..., None]).sum(1)
    den = w2.sum(1)
    zonal = np.full((H, 3), np.nan, dtype=np.float32)
    ok = den > 40
    zonal[ok] = num[ok] / den[ok, None]
    rows_ok = np.where(ok)[0]
    print("zonal rows with data", rows_ok.min(), rows_ok.max(), "lat", 90 - (rows_ok.min() + 0.5) / H * 180, 90 - (rows_ok.max() + 0.5) / H * 180)
    south = rows_ok.max()
    for c in range(3):
        zonal[:, c] = np.interp(np.arange(H), rows_ok, zonal[rows_ok, c])
    lat_deg = 90 - (np.arange(H) + 0.5) / H * 180
    last_lat = lat_deg[south]
    blend = smoothstep(last_lat + 1.0, last_lat + 7.0, lat_deg).astype(np.float32)
    mirror = np.arange(H)[::-1]
    zonal_full = zonal * blend[:, None] + zonal[mirror] * (1 - blend[:, None])

    sigma = W * 5.0 / 360
    low = cv2.GaussianBlur(albedo * w2[..., None], (0, 0), sigmaX=sigma, sigmaY=0.01)
    lw = cv2.GaussianBlur(w2, (0, 0), sigmaX=sigma, sigmaY=0.01)
    detail = np.where(lw[..., None] > 1e-3, albedo / np.maximum(low / np.maximum(lw[..., None], 1e-6), 1e-4), 1).astype(np.float32)
    detail[weight <= 0] = 1
    del low
    period = W / PERIODS
    shift = int(period // 2)
    eps = 0.004
    num = np.zeros((H, W, 3), dtype=np.float32)
    den = np.zeros((H, W), dtype=np.float32)
    den2 = np.zeros((H, W), dtype=np.float32)
    xm, ym = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    for k in range(PERIODS):
        xk = np.mod(xm + np.float32(k * period), W).astype(np.float32)
        dk = cv2.remap(detail, xk, ym, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        wk = cv2.remap(w2, xk, ym, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        num += dk * wk[..., None]
        den += wk
        den2 += wk * wk
    del xm, ym, xk, dk, wk
    fill = (num + eps) / (den[..., None] + eps)
    spread = np.sqrt(den2) / np.maximum(den, 1e-6)
    fill = 1 + (fill - 1) / np.clip(spread, 0.6, 1)[..., None]
    del num, den, den2, spread
    fill_m = np.roll(fill[mirror], shift, axis=1)
    fill = (fill * blend[:, None, None] + fill_m * (1 - blend[:, None, None])) * zonal_full[:, None, :]
    cap = (1 - smoothstep(76, 86, np.abs(lat_deg))).astype(np.float32)
    fill = fill * cap[:, None, None] + zonal_full[:, None, :] * (1 - cap[:, None, None])
    out = albedo * weight[..., None] + fill * (1 - weight[..., None])
    np.save(WORK / "wrap-zonal.npy", zonal_full)
    print("albedo luminance percentiles", np.percentile(out @ LW, [1, 50, 99, 99.9]))

    enc = linear_to_srgb(filmic(out))
    img = np.clip(enc * 255 + 0.5, 0, 255).astype(np.uint8)[..., ::-1]
    full = ROOT / "public/assets/saturn/full/wrap-color.jpg"
    web = ROOT / "public/assets/saturn/web/wrap-color.jpg"
    q = [cv2.IMWRITE_JPEG_QUALITY, 94, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
    cv2.imwrite(str(full), img, q)
    cv2.imwrite(str(web), cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA), q)
    cv2.imwrite(str(WORK / "wrap-preview.jpg"), cv2.resize(img, (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    wv = np.clip(weight * 255, 0, 255).astype(np.uint8)
    cv2.imwrite(str(WORK / "wrap-weight.jpg"), cv2.resize(wv, (2048, 1024), interpolation=cv2.INTER_AREA))


main()
