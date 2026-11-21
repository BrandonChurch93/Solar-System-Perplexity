import argparse
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from bake import fast_gaussian, feather_zone_mask
from resample import (
    DEFAULT_CONFIG,
    dirs_to_patch_uv,
    equirect_to_patch,
    extract_subpatch,
    feather_weight,
    load_config,
    load_rgb_float,
    lonlat_to_dir,
    patch_basis,
    prefilter_patch,
    sample_equirect_at_dirs,
    save_image,
)

ROOT = HERE.parents[2]


def quat_to_mat(q):
    x, y, z, w = q
    return np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ],
        dtype=np.float64,
    )


def check_spot(fit_path, lon_deg, lat_deg):
    fit = json.loads(Path(fit_path).read_text())
    w, h = fit["imageSize"]
    vfov = fit["vfovDeg"]
    aspect = w / h
    t = math.tan(math.radians(vfov) * 0.5)
    cam_pos = np.asarray(fit["camera"]["position"], dtype=np.float64)
    cam_R = quat_to_mat(fit["camera"]["quaternion"])
    G = quat_to_mat(fit["globe"]["quaternion"])
    scale = np.asarray(fit["globe"]["scale"], dtype=np.float64)

    n = lonlat_to_dir(lon_deg, lat_deg)
    p_world = G @ (scale * n)
    c = (p_world - cam_pos) @ cam_R
    z = -c[2]
    px = (c[0] / (z * t * aspect) + 1.0) * 0.5 * w
    py = (1.0 - c[1] / (z * t)) * 0.5 * h

    _, east, north = patch_basis(lon_deg, lat_deg)
    sun_world = np.asarray(fit["sunDir"], dtype=np.float64)
    sun_world /= np.linalg.norm(sun_world)
    sun_body = G.T @ sun_world
    sun_enu = [float(sun_body @ east), float(sun_body @ north), float(sun_body @ n)]
    return {
        "lonDeg": lon_deg,
        "latDeg": lat_deg,
        "projectedHeroPx": [round(float(px), 3), round(float(py), 3)],
        "targetHeroPx": [1267.0, 855.0],
        "pixelError": round(math.hypot(px - 1267.0, py - 855.0), 3),
        "sunPatchEastNorthUp": [round(v, 5) for v in sun_enu],
        "sunElevationDeg": round(math.degrees(math.asin(sun_enu[2])), 2),
        "sunAzimuthCwFromNorthDeg": round(math.degrees(math.atan2(sun_enu[0], sun_enu[1])), 2),
    }


def psnr_rgb(a, b):
    mse = float(np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2))
    return float("inf") if mse <= 1e-12 else float(10.0 * math.log10(1.0 / mse))


def check_nested(parent_rgb, parent_deg, child_rgb, child_deg, feather=0.12):
    ps = parent_rgb.shape[0]
    scale = math.tan(math.radians(child_deg) * 0.5) / math.tan(math.radians(parent_deg) * 0.5)
    eval_size = max(64, round(ps * scale))
    from_parent = extract_subpatch(parent_rgb, parent_deg, child_deg, eval_size)
    u8 = np.clip(child_rgb * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
    child_down = np.asarray(Image.fromarray(u8).resize((eval_size, eval_size), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0

    u = (np.arange(eval_size, dtype=np.float32) + 0.5) / eval_size
    U, V = np.meshgrid(u, u)
    core = (U >= feather) & (U <= 1.0 - feather) & (V >= feather) & (V <= 1.0 - feather)
    diff_core = np.abs(from_parent[core] - child_down[core])
    diff_all = np.abs(from_parent - child_down)
    return {
        "evalSizePx": eval_size,
        "corePsnrDb": round(psnr_rgb(from_parent[core], child_down[core]), 3),
        "coreRms255": round(float(np.sqrt(np.mean((from_parent[core] - child_down[core]) ** 2)) * 255.0), 3),
        "coreMax255": round(float(diff_core.max() * 255.0), 3),
        "fullPsnrDb": round(psnr_rgb(from_parent, child_down), 3),
        "fullRms255": round(float(np.sqrt(np.mean((from_parent - child_down) ** 2)) * 255.0), 3),
        "fullMax255": round(float(diff_all.max() * 255.0), 3),
    }


def check_lowfreq_feather(patch1_rgb, wrap_rgb, lon_deg, lat_deg, width_deg=48.0, feather=0.12, edge_sigma_deg=0.25):
    size = patch1_rgb.shape[0]
    wrap_on_p1 = equirect_to_patch(wrap_rgb, lon_deg, lat_deg, width_deg, size)
    sigma_ed = max(1.5, edge_sigma_deg * (size / width_deg))
    low_diff = fast_gaussian(wrap_on_p1 - patch1_rgb, sigma_ed)
    zone_mask, _ = feather_zone_mask(size, feather)
    z = low_diff[zone_mask]
    rms = float(np.sqrt(np.mean(z ** 2)))
    p99 = float(np.percentile(np.abs(z), 99))
    mx = float(np.abs(z).max())
    return {
        "sigmaDeg": edge_sigma_deg,
        "sigmaPx": round(sigma_ed, 2),
        "featherRms01": round(rms, 5),
        "featherRms255": round(rms * 255.0, 3),
        "featherP99_255": round(p99 * 255.0, 3),
        "featherMax255": round(mx * 255.0, 3),
    }


def render_topdown_view(wrap_rgb, patches, lon_deg, lat_deg, view_deg, view_size, feather=0.12):
    n, east, north = patch_basis(lon_deg, lat_deg)
    ht = math.tan(math.radians(view_deg) * 0.5)
    uv = (np.arange(view_size, dtype=np.float64) + 0.5) / view_size
    U, V = np.meshgrid(uv, uv)
    X = (U - 0.5) * (2.0 * ht)
    Y = (0.5 - V) * (2.0 * ht)
    d = n[None, None, :] + X[..., None] * east[None, None, :] + Y[..., None] * north[None, None, :]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)

    view_tpd = view_size / float(view_deg)
    ew = wrap_rgb.shape[1]
    wrap_tpd = ew / 360.0
    if view_tpd < wrap_tpd * 0.85:
        tw = max(64, round(ew * (view_tpd / wrap_tpd)))
        u8 = np.clip(wrap_rgb * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
        wrap_src = np.asarray(Image.fromarray(u8).resize((tw, tw // 2), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    else:
        wrap_src = wrap_rgb
    col = sample_equirect_at_dirs(wrap_src, d)

    for p_rgb, p_deg in patches:
        pu, pv, valid = dirs_to_patch_uv(d, lon_deg, lat_deg, p_deg)
        w = feather_weight(pu, pv, feather) * valid
        if not np.any(w > 0.0):
            continue
        src = prefilter_patch(p_rgb, view_tpd * 1.05, p_deg)
        ps = src.shape[0]
        mx = np.clip(pu * ps - 0.5, 0.0, ps - 1.0).astype(np.float32)
        my = np.clip(pv * ps - 0.5, 0.0, ps - 1.0).astype(np.float32)
        sampled = np.clip(cv2.remap(src, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE), 0.0, 1.0)
        col = col * (1.0 - w[..., None]) + sampled * w[..., None]
    return np.clip(col, 0.0, 1.0)


def make_dive_sheet(wrap_rgb, patches, lon_deg, lat_deg, out_path, tile_size=340, feather=0.12):
    widths = [60.0 * ((1.0 / 60.0) ** (i / 7.0)) for i in range(8)]
    cols, rows = 4, 2
    pad = 8
    sheet_w = cols * tile_size + (cols + 1) * pad
    sheet_h = rows * tile_size + (rows + 1) * pad
    sheet = np.full((sheet_h, sheet_w, 3), 0.06, dtype=np.float32)
    for idx, wdeg in enumerate(widths):
        r, c = divmod(idx, cols)
        y0 = pad + r * (tile_size + pad)
        x0 = pad + c * (tile_size + pad)
        tile = render_topdown_view(wrap_rgb, patches, lon_deg, lat_deg, wdeg, tile_size, feather=feather)
        sheet[y0 : y0 + tile_size, x0 : x0 + tile_size] = tile
    save_image(out_path, sheet, quality=95)
    return [round(w, 3) for w in widths]


def make_native_crops(patches_named, out_dir, crop_size=640):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for name, rgb in patches_named:
        s = rgb.shape[0]
        half = crop_size // 2
        c0 = s // 2 - half
        center = rgb[c0 : c0 + crop_size, c0 : c0 + crop_size]
        e0 = round(s * 0.06)
        edge = rgb[c0 : c0 + crop_size, e0 : e0 + crop_size]
        pair = np.full((crop_size + 16, crop_size * 2 + 24, 3), 0.06, dtype=np.float32)
        pair[8 : 8 + crop_size, 8 : 8 + crop_size] = center
        pair[8 : 8 + crop_size, 16 + crop_size : 16 + crop_size * 2] = edge
        p = out_dir / f"{name}-native-center-edge.jpg"
        save_image(p, pair, quality=95)
        paths.append(str(p))
    return paths


def main():
    parser = argparse.ArgumentParser(description="Verify Mars patches, nested consistency, feather match, and dive sheet.")
    parser.add_argument("--wrap", required=True, type=Path)
    parser.add_argument("--patch1", type=Path, default=ROOT / "public" / "assets" / "mars" / "full" / "patch-1.jpg")
    parser.add_argument("--patch2", type=Path, default=ROOT / "public" / "assets" / "mars" / "full" / "patch-2.jpg")
    parser.add_argument("--patch3", type=Path, default=ROOT / "public" / "assets" / "mars" / "full" / "patch-3.jpg")
    parser.add_argument("--fit", type=Path, default=ROOT / "assets-src" / "mars" / "fit.json")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--out-dir", type=Path, default=ROOT / "out" / "work" / "mars-patches-verify")
    args = parser.parse_args()

    cfg = load_config(args.config)
    lon = cfg["spot"]["lonDeg"]
    lat = cfg["spot"]["latDeg"]
    feather = cfg["featherFraction"]

    args.out_dir.mkdir(parents=True, exist_ok=True)
    spot_report = check_spot(args.fit, lon, lat)

    wrap_rgb = load_rgb_float(args.wrap)
    p1 = load_rgb_float(args.patch1)
    p2 = load_rgb_float(args.patch2)
    p3 = load_rgb_float(args.patch3)

    nest_12 = check_nested(p1, 48.0, p2, 12.0, feather=feather)
    nest_23 = check_nested(p2, 12.0, p3, 3.0, feather=feather)
    lowfreq = check_lowfreq_feather(p1, wrap_rgb, lon, lat, width_deg=48.0, feather=feather)

    dive_sheet = args.out_dir / "dive-contact-sheet.jpg"
    widths = make_dive_sheet(wrap_rgb, [(p1, 48.0), (p2, 12.0), (p3, 3.0)], lon, lat, dive_sheet, feather=feather)
    crops = make_native_crops([("patch-1", p1), ("patch-2", p2), ("patch-3", p3)], args.out_dir)

    report = {
        "spotCheck": spot_report,
        "nestedConsistency_patch1_patch2": nest_12,
        "nestedConsistency_patch2_patch3": nest_23,
        "lowFreqFeatherDiff_patch1_vs_wrap": lowfreq,
        "diveWidthsDeg": widths,
        "diveContactSheet": str(dive_sheet),
        "nativeCrops": crops,
    }
    out_json = args.out_dir / "verify-report.json"
    out_json.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
