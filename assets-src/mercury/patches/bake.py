import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from resample import (
    DEFAULT_CONFIG,
    equirect_to_patch,
    load_config,
    load_rgb_float,
    patch_to_equirect_layer,
    save_image,
)

ROOT = HERE.parents[2]


def fast_gaussian(img, sigma_px):
    if sigma_px <= 0.5:
        return img.copy()
    h, w = img.shape[:2]
    scale = max(1, int(sigma_px / 6.0))
    if scale > 1:
        sw, sh = max(4, w // scale), max(4, h // scale)
        small = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA)
        sx = sigma_px / (w / float(sw))
        sy = sigma_px / (h / float(sh))
        blurred = cv2.GaussianBlur(small, (0, 0), sigmaX=sx, sigmaY=sy, borderType=cv2.BORDER_REFLECT_101)
        return cv2.resize(blurred, (w, h), interpolation=cv2.INTER_CUBIC)
    return cv2.GaussianBlur(img, (0, 0), sigmaX=sigma_px, sigmaY=sigma_px, borderType=cv2.BORDER_REFLECT_101)


def feather_zone_mask(size, feather):
    u = (np.arange(size, dtype=np.float32) + 0.5) / size
    U, V = np.meshgrid(u, u)
    dist = np.minimum(np.minimum(U, 1.0 - U), np.minimum(V, 1.0 - V))
    return (dist > 0.0) & (dist < feather), dist


def match_patch_lowfreq(
    patch_rgb,
    wrap_rgb,
    lon_deg,
    lat_deg,
    width_deg,
    blur_deg=0.40,
    feather=0.12,
    wrap_on_patch=None,
):
    size = patch_rgb.shape[0]
    px_per_deg = size / float(width_deg)
    if wrap_on_patch is None:
        wrap_on_patch = equirect_to_patch(wrap_rgb, lon_deg, lat_deg, width_deg, size)
    sigma_px = max(1.5, float(blur_deg) * px_per_deg)
    delta = fast_gaussian(wrap_on_patch - patch_rgb, sigma_px)
    matched = np.clip(patch_rgb + delta, 0.0, 1.0)

    hp_before = patch_rgb - fast_gaussian(patch_rgb, sigma_px)
    hp_after = matched - fast_gaussian(matched, sigma_px)
    zone_mask, _ = feather_zone_mask(size, feather)
    low_before = fast_gaussian(wrap_on_patch - patch_rgb, sigma_px)
    low_after = fast_gaussian(wrap_on_patch - matched, sigma_px)
    stats = {
        "widthDeg": float(width_deg),
        "blurDeg": float(blur_deg),
        "sigmaPx": round(float(sigma_px), 2),
        "featherRmsBefore": float(np.sqrt(np.mean(low_before[zone_mask] ** 2))),
        "featherRmsAfter": float(np.sqrt(np.mean(low_after[zone_mask] ** 2))),
        "patchLowRmsBefore": float(np.sqrt(np.mean(low_before ** 2))),
        "patchLowRmsAfter": float(np.sqrt(np.mean(low_after ** 2))),
        "detailAboveRadiusRmsDiff255": float(np.sqrt(np.mean((hp_after - hp_before) ** 2)) * 255.0),
    }
    return matched, delta, stats


def composite_patch_into_wrap(wrap_rgb, patch_rgb, lon_deg, lat_deg, width_deg, feather=0.12):
    ew = wrap_rgb.shape[1]
    layer_rgb, alpha = patch_to_equirect_layer(patch_rgb, ew, lon_deg, lat_deg, width_deg, feather=feather)
    w = alpha[..., None]
    return np.clip(wrap_rgb * (1.0 - w) + layer_rgb * w, 0.0, 1.0)


def infer_width_deg(patch_path, cfg, explicit_level=None, explicit_width=None):
    if explicit_width is not None:
        return float(explicit_width)
    if explicit_level is not None:
        for entry in cfg["patches"]:
            if int(entry["level"]) == int(explicit_level):
                return float(entry["widthDeg"])
    stem = patch_path.stem
    for entry in cfg["patches"]:
        if entry["id"] == stem:
            return float(entry["widthDeg"])
    return float(cfg["patches"][0]["widthDeg"])


def resolve_blur_deg(args, wrap_width):
    if args.blur_deg is not None:
        return float(args.blur_deg)
    if args.blur_px is not None:
        return float(args.blur_px) * (360.0 / float(wrap_width))
    return 0.40


def save_full_and_web(rgb, full_path, web_path, web_size, quality):
    save_image(full_path, rgb, quality=quality)
    if web_path is not None:
        web_rgb = cv2.resize(rgb, (web_size, web_size), interpolation=cv2.INTER_AREA)
        save_image(web_path, web_rgb, quality=quality)


def main():
    parser = argparse.ArgumentParser(
        description="Match Mars patch-1, patch-2, and patch-3 low frequencies to a wrap map while leaving finer detail untouched, and optionally composite patch-1 into the wrap map."
    )
    parser.add_argument("--wrap", required=True, type=Path, help="Input equirectangular wrap map of any width.")
    parser.add_argument(
        "--blur-deg",
        "--sigma-deg",
        dest="blur_deg",
        type=float,
        default=None,
        help="Gaussian blur radius in degrees on Mars (default 0.40 when --blur-px is not set).",
    )
    parser.add_argument(
        "--blur-px",
        "--blur-radius",
        dest="blur_px",
        type=float,
        default=None,
        help="Gaussian blur radius in wrap-map pixels (converted to degrees using wrap width).",
    )
    parser.add_argument(
        "--patch",
        type=Path,
        default=None,
        help="Optional single patch image to match. When omitted, all three patches in patches.json are matched.",
    )
    parser.add_argument("--level", type=int, choices=[1, 2, 3], default=None, help="Patch level when --patch has a custom filename.")
    parser.add_argument("--width-deg", type=float, default=None, help="Explicit angular width in degrees for --patch.")
    parser.add_argument("--out-patch", type=Path, default=None, help="Output path for single-patch mode (defaults to updating --patch in place).")
    parser.add_argument(
        "--full-dir",
        type=Path,
        default=ROOT / "public" / "assets" / "mars" / "full",
        help="Directory holding full-resolution patch-1.jpg, patch-2.jpg, patch-3.jpg.",
    )
    parser.add_argument(
        "--web-dir",
        type=Path,
        default=ROOT / "public" / "assets" / "mars" / "web",
        help="Directory holding half-size web patch-1.jpg, patch-2.jpg, patch-3.jpg.",
    )
    parser.add_argument("--no-web", action="store_true", help="Skip updating half-size web patches.")
    parser.add_argument("--no-write-patches", action="store_true", help="Do not write matched patch files to disk.")
    parser.add_argument("--no-match", action="store_true", help="Skip low-frequency matching before wrap compositing.")
    parser.add_argument("--out", type=Path, default=None, help="Optional output path for wrap map with patch-1 composited.")
    parser.add_argument("--in-place", action="store_true", help="Write composited wrap map back to --wrap.")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--feather", type=float, default=None)
    parser.add_argument("--quality", type=int, default=94)
    args = parser.parse_args()

    cfg = load_config(args.config)
    lon = float(cfg["spot"]["lonDeg"])
    lat = float(cfg["spot"]["latDeg"])
    feather = float(cfg["featherFraction"] if args.feather is None else args.feather)

    wrap_rgb = load_rgb_float(args.wrap)
    blur_deg = resolve_blur_deg(args, wrap_rgb.shape[1])

    patch1_for_bake = None

    if args.patch is not None:
        wdeg = infer_width_deg(args.patch, cfg, args.level, args.width_deg)
        patch_rgb = load_rgb_float(args.patch)
        if args.no_match:
            matched = patch_rgb
        else:
            matched, _, stats = match_patch_lowfreq(patch_rgb, wrap_rgb, lon, lat, wdeg, blur_deg=blur_deg, feather=feather)
            print(
                f"{args.patch.name} ({wdeg:g} deg, sigma={stats['sigmaPx']} px): "
                f"low-freq RMS {stats['patchLowRmsBefore']:.5f} -> {stats['patchLowRmsAfter']:.5f} | "
                f"detail-above-radius diff {stats['detailAboveRadiusRmsDiff255']:.4f}/255"
            )
        if not args.no_write_patches:
            target_full = args.out_patch if args.out_patch is not None else args.patch
            target_web = None
            if not args.no_web and args.out_patch is None and args.patch.parent.resolve() == args.full_dir.resolve():
                target_web = args.web_dir / args.patch.name
            save_full_and_web(matched, target_full, target_web, matched.shape[0] // 2, args.quality)
            print(f"Wrote {target_full}" + (f" and {target_web}" if target_web else ""))
        if abs(wdeg - float(cfg["patches"][0]["widthDeg"])) < 1e-3:
            patch1_for_bake = matched
    else:
        for entry in cfg["patches"]:
            fname = f"{entry['id']}.jpg"
            wdeg = float(entry["widthDeg"])
            web_size = int(entry["sizes"]["web"][0])
            full_path = args.full_dir / fname
            web_path = None if args.no_web else (args.web_dir / fname)
            patch_rgb = load_rgb_float(full_path)
            if args.no_match:
                matched = patch_rgb
            else:
                matched, _, stats = match_patch_lowfreq(patch_rgb, wrap_rgb, lon, lat, wdeg, blur_deg=blur_deg, feather=feather)
                print(
                    f"{fname} ({wdeg:g} deg, sigma={stats['sigmaPx']} px): "
                    f"low-freq RMS {stats['patchLowRmsBefore']:.5f} -> {stats['patchLowRmsAfter']:.5f} | "
                    f"detail-above-radius diff {stats['detailAboveRadiusRmsDiff255']:.4f}/255"
                )
            if not args.no_write_patches and not args.no_match:
                save_full_and_web(matched, full_path, web_path, web_size, args.quality)
                print(f"Wrote {full_path}" + (f" and {web_path}" if web_path else ""))
            if int(entry["level"]) == 1:
                patch1_for_bake = matched

    target_wrap = args.wrap if args.in_place else args.out
    if target_wrap is not None:
        if patch1_for_bake is None:
            p1_path = args.full_dir / f"{cfg['patches'][0]['id']}.jpg"
            p1_raw = load_rgb_float(p1_path)
            wdeg1 = float(cfg["patches"][0]["widthDeg"])
            patch1_for_bake = p1_raw if args.no_match else match_patch_lowfreq(p1_raw, wrap_rgb, lon, lat, wdeg1, blur_deg=blur_deg, feather=feather)[0]
        composited = composite_patch_into_wrap(wrap_rgb, patch1_for_bake, lon, lat, float(cfg["patches"][0]["widthDeg"]), feather=feather)
        save_image(target_wrap, composited, quality=args.quality)
        print(f"Wrote composited wrap {target_wrap} ({composited.shape[1]}x{composited.shape[0]})")


if __name__ == "__main__":
    main()
