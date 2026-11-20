import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from bake import fast_gaussian, match_patch_lowfreq
from resample import equirect_to_patch, load_config, load_rgb_float, save_image, smoothstep01

TILE_SPAN = 2240
FULL_SIZE = 4096
STARTS = [0, FULL_SIZE - TILE_SPAN]
NAMES = [("tl", 0, 0), ("tr", 0, 1), ("bl", 1, 0), ("br", 1, 1)]


def ramp_1d(length, left_overlap, right_overlap):
    w = np.ones(length, dtype=np.float32)
    if left_overlap > 0:
        t = (np.arange(left_overlap, dtype=np.float32) + 0.5) / left_overlap
        w[:left_overlap] = smoothstep01(t)
    if right_overlap > 0:
        t = (np.arange(right_overlap, dtype=np.float32) + 0.5) / right_overlap
        w[-right_overlap:] = smoothstep01(t[::-1])
    return w


def split_global(global_path, out_dir, input_size=1120):
    rgb = load_rgb_float(global_path)
    u8 = np.clip(rgb * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
    up4k = np.asarray(Image.fromarray(u8).resize((FULL_SIZE, FULL_SIZE), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    save_image(out_dir / "global-up-4096.png", up4k)
    for tag, iy, ix in NAMES:
        y0, x0 = STARTS[iy], STARTS[ix]
        crop = up4k[y0 : y0 + TILE_SPAN, x0 : x0 + TILE_SPAN]
        cu8 = np.clip(crop * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
        small = np.asarray(Image.fromarray(cu8).resize((input_size, input_size), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
        save_image(out_dir / f"in-{tag}.png", small)


def assemble_tiles(global_path, tile_paths, out_path, lock_sigma_px=28.0, quality=95):
    g_rgb = load_rgb_float(global_path)
    gu8 = np.clip(g_rgb * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
    up4k = np.asarray(Image.fromarray(gu8).resize((FULL_SIZE, FULL_SIZE), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0

    overlap = 2 * TILE_SPAN - FULL_SIZE
    accum = np.zeros((FULL_SIZE, FULL_SIZE, 3), dtype=np.float32)
    wsum = np.zeros((FULL_SIZE, FULL_SIZE, 1), dtype=np.float32)

    for (tag, iy, ix), tpath in zip(NAMES, tile_paths):
        y0, x0 = STARTS[iy], STARTS[ix]
        trgb = load_rgb_float(tpath)
        tu8 = np.clip(trgb * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
        t_span = np.asarray(Image.fromarray(tu8).resize((TILE_SPAN, TILE_SPAN), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
        ref = up4k[y0 : y0 + TILE_SPAN, x0 : x0 + TILE_SPAN]
        if lock_sigma_px > 0:
            delta = fast_gaussian(ref - t_span, lock_sigma_px)
            t_span = np.clip(t_span + delta, 0.0, 1.0)
        wy = ramp_1d(TILE_SPAN, overlap if iy == 1 else 0, overlap if iy == 0 else 0)
        wx = ramp_1d(TILE_SPAN, overlap if ix == 1 else 0, overlap if ix == 0 else 0)
        w = (wy[:, None] * wx[None, :])[..., None]
        accum[y0 : y0 + TILE_SPAN, x0 : x0 + TILE_SPAN] += t_span * w
        wsum[y0 : y0 + TILE_SPAN, x0 : x0 + TILE_SPAN] += w

    merged = np.clip(accum / np.maximum(wsum, 1e-6), 0.0, 1.0)
    save_image(out_path, merged, quality=quality)


def match_to_parent(child_path, parent_subpatch_path, out_path, feather=0.12, sigma_in_px=96.0, sigma_edge_px=24.0, quality=95):
    child = load_rgb_float(child_path)
    ref = load_rgb_float(parent_subpatch_path)
    size = child.shape[0]
    if ref.shape[0] != size:
        ru8 = np.clip(ref * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
        ref = np.asarray(Image.fromarray(ru8).resize((size, size), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    diff = ref - child
    diff_in = fast_gaussian(diff, sigma_in_px)
    diff_ed = fast_gaussian(diff, sigma_edge_px)
    u = (np.arange(size, dtype=np.float32) + 0.5) / size
    U, V = np.meshgrid(u, u)
    dist = np.minimum(np.minimum(U, 1.0 - U), np.minimum(V, 1.0 - V))
    interior_w = smoothstep01((dist - feather) / max(feather, 1e-4))[..., None]
    delta = (1.0 - interior_w) * diff_ed + interior_w * diff_in
    matched = np.clip(child + delta, 0.0, 1.0)
    save_image(out_path, matched, quality=quality)


def main():
    parser = argparse.ArgumentParser(description="Split, assemble, and parent-match 4096 patches from 2x2 tiles.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_sp = sub.add_parser("split")
    p_sp.add_argument("--global-img", required=True, type=Path)
    p_sp.add_argument("--out-dir", required=True, type=Path)
    p_sp.add_argument("--input-size", default=1120, type=int)

    p_as = sub.add_parser("assemble")
    p_as.add_argument("--global-img", required=True, type=Path)
    p_as.add_argument("--tl", required=True, type=Path)
    p_as.add_argument("--tr", required=True, type=Path)
    p_as.add_argument("--bl", required=True, type=Path)
    p_as.add_argument("--br", required=True, type=Path)
    p_as.add_argument("--out", required=True, type=Path)
    p_as.add_argument("--lock-sigma-px", default=28.0, type=float)
    p_as.add_argument("--quality", default=95, type=int)

    p_mp = sub.add_parser("match-parent")
    p_mp.add_argument("--child", required=True, type=Path)
    p_mp.add_argument("--parent-subpatch", required=True, type=Path)
    p_mp.add_argument("--out", required=True, type=Path)
    p_mp.add_argument("--feather", default=0.12, type=float)
    p_mp.add_argument("--sigma-in-px", default=96.0, type=float)
    p_mp.add_argument("--sigma-edge-px", default=24.0, type=float)
    p_mp.add_argument("--quality", default=95, type=int)

    args = parser.parse_args()
    if args.cmd == "split":
        split_global(args.global_img, args.out_dir, input_size=args.input_size)
    elif args.cmd == "assemble":
        assemble_tiles(
            args.global_img,
            [args.tl, args.tr, args.bl, args.br],
            args.out,
            lock_sigma_px=args.lock_sigma_px,
            quality=args.quality,
        )
    elif args.cmd == "match-parent":
        match_to_parent(
            args.child,
            args.parent_subpatch,
            args.out,
            feather=args.feather,
            sigma_in_px=args.sigma_in_px,
            sigma_edge_px=args.sigma_edge_px,
            quality=args.quality,
        )


if __name__ == "__main__":
    main()
