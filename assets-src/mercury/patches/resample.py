import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
DEFAULT_CONFIG = HERE / "patches.json"


def load_config(path=DEFAULT_CONFIG):
    return json.loads(Path(path).read_text())


def load_rgb_float(path):
    im = Image.open(path).convert("RGB")
    return np.asarray(im, dtype=np.float32) / 255.0


def save_image(path, rgb_float, quality=94, alpha_float=None):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb_u8 = np.clip(rgb_float * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
    if alpha_float is not None and path.suffix.lower() == ".png":
        a_u8 = np.clip(alpha_float * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
        rgba = np.concatenate([rgb_u8, a_u8[..., None]], axis=-1)
        Image.fromarray(rgba).save(path)
        return
    im = Image.fromarray(rgb_u8)
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        im.save(path, format="JPEG", quality=quality, subsampling=0)
    else:
        im.save(path)


def lonlat_to_dir(lon_deg, lat_deg):
    lon = np.radians(lon_deg)
    lat = np.radians(lat_deg)
    cl = np.cos(lat)
    return np.stack([cl * np.sin(lon), np.sin(lat), cl * np.cos(lon)], axis=-1)


def dir_to_lonlat(d):
    lon = np.degrees(np.arctan2(d[..., 0], d[..., 2]))
    lat = np.degrees(np.arcsin(np.clip(d[..., 1], -1.0, 1.0)))
    return lon, lat


def patch_basis(lon_deg, lat_deg):
    n = lonlat_to_dir(float(lon_deg), float(lat_deg)).astype(np.float64)
    n /= np.linalg.norm(n)
    east = np.cross(np.array([0.0, 1.0, 0.0]), n)
    east /= np.linalg.norm(east)
    north = np.cross(n, east)
    north /= np.linalg.norm(north)
    return n, east, north


def smoothstep01(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def feather_weight(u, v, feather):
    inside = (u >= 0.0) & (u <= 1.0) & (v >= 0.0) & (v <= 1.0)
    if feather <= 0.0:
        return inside.astype(np.float32)
    wx = smoothstep01(np.minimum(u, 1.0 - u) / feather)
    wy = smoothstep01(np.minimum(v, 1.0 - v) / feather)
    return (wx * wy * inside).astype(np.float32)


def patch_uv_to_dirs(u, v, lon_deg, lat_deg, width_deg):
    n, east, north = patch_basis(lon_deg, lat_deg)
    ht = math.tan(math.radians(width_deg) * 0.5)
    x = (u - 0.5) * (2.0 * ht)
    y = (0.5 - v) * (2.0 * ht)
    d = n + x[..., None] * east + y[..., None] * north
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    return d


def dirs_to_patch_uv(d, lon_deg, lat_deg, width_deg):
    n, east, north = patch_basis(lon_deg, lat_deg)
    ht = math.tan(math.radians(width_deg) * 0.5)
    dn = d @ n
    valid = dn > 1e-6
    safe_dn = np.where(valid, dn, 1.0)
    x = (d @ east) / safe_dn
    y = (d @ north) / safe_dn
    u = 0.5 + x / (2.0 * ht)
    v = 0.5 - y / (2.0 * ht)
    return u, v, valid


def sample_equirect_at_dirs(equirect_rgb, dirs, band_rows=512):
    eh, ew = equirect_rgb.shape[:2]
    pad = 8
    eq_pad = np.concatenate([equirect_rgb[:, -pad:], equirect_rgb, equirect_rgb[:, :pad]], axis=1)
    out = np.empty(dirs.shape[:-1] + (equirect_rgb.shape[-1],), dtype=np.float32)
    rows = dirs.shape[0]
    for r0 in range(0, rows, band_rows):
        r1 = min(rows, r0 + band_rows)
        sub = dirs[r0:r1]
        lon, lat = dir_to_lonlat(sub)
        u = lon / 360.0 + 0.5
        v = 0.5 - lat / 180.0
        mx = (u * ew - 0.5 + pad).astype(np.float32)
        my = np.clip(v * eh - 0.5, 0.0, eh - 1.0).astype(np.float32)
        sampled = cv2.remap(eq_pad, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT_101)
        if sampled.ndim == 2:
            sampled = sampled[..., None]
        out[r0:r1] = sampled
    return np.clip(out, 0.0, 1.0)


def equirect_to_patch(equirect_rgb, lon_deg, lat_deg, width_deg, size, band_rows=512):
    n, east, north = patch_basis(lon_deg, lat_deg)
    ht = math.tan(math.radians(width_deg) * 0.5)
    u = (np.arange(size, dtype=np.float64) + 0.5) / size
    eh, ew = equirect_rgb.shape[:2]
    pad = 8
    eq_pad = np.concatenate([equirect_rgb[:, -pad:], equirect_rgb, equirect_rgb[:, :pad]], axis=1)
    out = np.empty((size, size, equirect_rgb.shape[-1]), dtype=np.float32)
    for r0 in range(0, size, band_rows):
        r1 = min(size, r0 + band_rows)
        v = (np.arange(r0, r1, dtype=np.float64) + 0.5) / size
        U, V = np.meshgrid(u, v)
        X = (U - 0.5) * (2.0 * ht)
        Y = (0.5 - V) * (2.0 * ht)
        d = n[None, None, :] + X[..., None] * east[None, None, :] + Y[..., None] * north[None, None, :]
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        lon, lat = dir_to_lonlat(d)
        ue = lon / 360.0 + 0.5
        ve = 0.5 - lat / 180.0
        mx = (ue * ew - 0.5 + pad).astype(np.float32)
        my = np.clip(ve * eh - 0.5, 0.0, eh - 1.0).astype(np.float32)
        sampled = cv2.remap(eq_pad, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT_101)
        if sampled.ndim == 2:
            sampled = sampled[..., None]
        out[r0:r1] = sampled
    return np.clip(out, 0.0, 1.0)


def prefilter_patch(patch_rgb, target_texels_per_deg, patch_width_deg):
    ps = patch_rgb.shape[0]
    patch_tpd = ps / patch_width_deg
    if target_texels_per_deg >= patch_tpd * 0.85:
        return patch_rgb
    target_size = max(16, round(ps * (target_texels_per_deg / patch_tpd)))
    u8 = np.clip(patch_rgb * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
    im = Image.fromarray(u8).resize((target_size, target_size), Image.Resampling.LANCZOS)
    return np.asarray(im, dtype=np.float32) / 255.0


def patch_to_equirect_layer(patch_rgb, equirect_width, lon_deg, lat_deg, width_deg, feather=0.12, band_rows=256):
    ew = int(equirect_width)
    eh = ew // 2
    eq_tpd = ew / 360.0
    src = prefilter_patch(patch_rgb, eq_tpd * 1.15, width_deg)
    ps = src.shape[0]
    rgb_out = np.zeros((eh, ew, 3), dtype=np.float32)
    alpha_out = np.zeros((eh, ew), dtype=np.float32)
    lon = (np.arange(ew, dtype=np.float64) + 0.5) / ew * 360.0 - 180.0
    for r0 in range(0, eh, band_rows):
        r1 = min(eh, r0 + band_rows)
        lat = 90.0 - (np.arange(r0, r1, dtype=np.float64) + 0.5) / eh * 180.0
        LON, LAT = np.meshgrid(lon, lat)
        d = lonlat_to_dir(LON, LAT)
        u, v, valid = dirs_to_patch_uv(d, lon_deg, lat_deg, width_deg)
        inside = valid & (u >= 0.0) & (u <= 1.0) & (v >= 0.0) & (v <= 1.0)
        if not np.any(inside):
            continue
        w = feather_weight(u, v, feather) * valid
        mx = np.clip(u * ps - 0.5, 0.0, ps - 1.0).astype(np.float32)
        my = np.clip(v * ps - 0.5, 0.0, ps - 1.0).astype(np.float32)
        sampled = cv2.remap(src, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        rgb_out[r0:r1] = np.clip(sampled, 0.0, 1.0) * (w > 0.0)[..., None]
        alpha_out[r0:r1] = w
    return rgb_out, alpha_out


def extract_subpatch(parent_rgb, parent_width_deg, child_width_deg, out_size):
    ps = parent_rgb.shape[0]
    scale = math.tan(math.radians(child_width_deg) * 0.5) / math.tan(math.radians(parent_width_deg) * 0.5)
    uc = (np.arange(out_size, dtype=np.float64) + 0.5) / out_size
    up = 0.5 + (uc - 0.5) * scale
    coords = (up * ps - 0.5).astype(np.float32)
    MX, MY = np.meshgrid(coords, coords)
    sampled = cv2.remap(parent_rgb, MX, MY, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    return np.clip(sampled, 0.0, 1.0)


def nest_child_into_parent(parent_rgb, parent_width_deg, child_rgb, child_width_deg, feather=0.12):
    ps = parent_rgb.shape[0]
    scale = math.tan(math.radians(child_width_deg) * 0.5) / math.tan(math.radians(parent_width_deg) * 0.5)
    footprint_px = ps * scale
    src = prefilter_patch(child_rgb, (footprint_px / child_width_deg) * 1.05, child_width_deg)
    cs = src.shape[0]
    up = (np.arange(ps, dtype=np.float64) + 0.5) / ps
    uc = 0.5 + (up - 0.5) / scale
    i0 = max(0, int(math.floor(np.searchsorted(uc, 0.0) - 2)))
    i1 = min(ps, int(math.ceil(np.searchsorted(uc, 1.0) + 2)))
    out = parent_rgb.copy()
    if i1 <= i0:
        return out
    sub_u = uc[i0:i1]
    UC, VC = np.meshgrid(sub_u, sub_u)
    w = feather_weight(UC, VC, feather)[..., None]
    mx = np.clip(UC * cs - 0.5, 0.0, cs - 1.0).astype(np.float32)
    my = np.clip(VC * cs - 0.5, 0.0, cs - 1.0).astype(np.float32)
    sampled = np.clip(cv2.remap(src, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE), 0.0, 1.0)
    out[i0:i1, i0:i1] = parent_rgb[i0:i1, i0:i1] * (1.0 - w) + sampled * w
    return np.clip(out, 0.0, 1.0)


def main():
    parser = argparse.ArgumentParser(description="Resample between equirectangular maps and Mars gnomonic patches.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_to = sub.add_parser("to-patch")
    p_to.add_argument("--map", required=True, type=Path)
    p_to.add_argument("--out", required=True, type=Path)
    p_to.add_argument("--width-deg", required=True, type=float)
    p_to.add_argument("--size", default=4096, type=int)
    p_to.add_argument("--lon", type=float, default=None)
    p_to.add_argument("--lat", type=float, default=None)
    p_to.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    p_to.add_argument("--quality", type=int, default=94)

    p_eq = sub.add_parser("to-equirect")
    p_eq.add_argument("--patch", required=True, type=Path)
    p_eq.add_argument("--out", required=True, type=Path)
    p_eq.add_argument("--equirect-width", default=8192, type=int)
    p_eq.add_argument("--width-deg", default=48.0, type=float)
    p_eq.add_argument("--feather", type=float, default=None)
    p_eq.add_argument("--lon", type=float, default=None)
    p_eq.add_argument("--lat", type=float, default=None)
    p_eq.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    p_eq.add_argument("--quality", type=int, default=94)

    p_sub = sub.add_parser("subpatch")
    p_sub.add_argument("--parent", required=True, type=Path)
    p_sub.add_argument("--parent-deg", required=True, type=float)
    p_sub.add_argument("--child-deg", required=True, type=float)
    p_sub.add_argument("--size", default=4096, type=int)
    p_sub.add_argument("--out", required=True, type=Path)
    p_sub.add_argument("--quality", type=int, default=94)

    p_nest = sub.add_parser("nest")
    p_nest.add_argument("--parent", required=True, type=Path)
    p_nest.add_argument("--parent-deg", required=True, type=float)
    p_nest.add_argument("--child", required=True, type=Path)
    p_nest.add_argument("--child-deg", required=True, type=float)
    p_nest.add_argument("--feather", type=float, default=0.12)
    p_nest.add_argument("--out", required=True, type=Path)
    p_nest.add_argument("--quality", type=int, default=94)

    args = parser.parse_args()
    if args.cmd == "to-patch":
        cfg = load_config(args.config)
        lon = cfg["spot"]["lonDeg"] if args.lon is None else args.lon
        lat = cfg["spot"]["latDeg"] if args.lat is None else args.lat
        eq = load_rgb_float(args.map)
        patch = equirect_to_patch(eq, lon, lat, args.width_deg, args.size)
        save_image(args.out, patch, quality=args.quality)
    elif args.cmd == "to-equirect":
        cfg = load_config(args.config)
        lon = cfg["spot"]["lonDeg"] if args.lon is None else args.lon
        lat = cfg["spot"]["latDeg"] if args.lat is None else args.lat
        feather = cfg["featherFraction"] if args.feather is None else args.feather
        patch = load_rgb_float(args.patch)
        rgb, alpha = patch_to_equirect_layer(patch, args.equirect_width, lon, lat, args.width_deg, feather=feather)
        save_image(args.out, rgb, quality=args.quality, alpha_float=alpha)
    elif args.cmd == "subpatch":
        parent = load_rgb_float(args.parent)
        subpatch = extract_subpatch(parent, args.parent_deg, args.child_deg, args.size)
        save_image(args.out, subpatch, quality=args.quality)
    elif args.cmd == "nest":
        parent = load_rgb_float(args.parent)
        child = load_rgb_float(args.child)
        baked = nest_child_into_parent(parent, args.parent_deg, child, args.child_deg, feather=args.feather)
        save_image(args.out, baked, quality=args.quality)


if __name__ == "__main__":
    main()
