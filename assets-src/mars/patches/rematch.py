import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from bake import fast_gaussian
from resample import DEFAULT_CONFIG, equirect_to_patch, load_config, load_rgb_float, save_image

A, B, C, D, E = 2.51, 0.03, 2.43, 0.59, 0.14
LIFT_KNEE = 1.35
LIFT_MAX = 1.9


def filmic(x):
    x = np.maximum(x, 0.0)
    return np.clip((x * (A * x + B)) / (x * (C * x + D) + E), 0.0, 1.0)


def inverse_filmic(y):
    y = np.clip(y, 0.0, 0.985)
    k = D * y - B
    return (-k - np.sqrt(np.maximum(k * k - 4.0 * (C * y - A) * E * y, 0.0))) / (2.0 * (C * y - A))


def rematch(patch, wrap_on_patch, sigma_px, ceiling):
    lin = inverse_filmic(patch)
    target = inverse_filmic(wrap_on_patch)
    low = fast_gaussian(lin, sigma_px)
    low_target = fast_gaussian(target, sigma_px)
    luma = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=lin.dtype)
    low_luma = np.maximum(low @ np.array([0.2126, 0.7152, 0.0722], dtype=lin.dtype), 1e-3)
    lift = luma / low_luma
    over_lift = np.maximum(lift - LIFT_KNEE, 0.0)
    span = LIFT_MAX - LIFT_KNEE
    tamed = np.where(lift > LIFT_KNEE, LIFT_KNEE + span * (1.0 - np.exp(-over_lift / span)), lift)
    lin = lin * (tamed / np.maximum(lift, 1e-6))[..., None]
    ratio = low_target / np.maximum(low, 1e-3)
    out = lin * ratio
    peak = out.max(axis=2, keepdims=True)
    knee = ceiling * 0.6
    over = np.maximum(peak - knee, 0.0)
    room = ceiling - knee
    squeezed = knee + room * (1.0 - np.exp(-over / room))
    out = out * np.where(peak > knee, squeezed / np.maximum(peak, 1e-6), 1.0)
    return filmic(out)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--wrap", required=True, type=Path)
    p.add_argument("--src-dir", required=True, type=Path)
    p.add_argument("--full-dir", required=True, type=Path)
    p.add_argument("--web-dir", required=True, type=Path)
    p.add_argument("--blur-deg", type=float, default=0.35)
    p.add_argument("--ceiling", type=float, default=3.2)
    p.add_argument("--quality", type=int, default=94)
    args = p.parse_args()
    cfg = load_config(DEFAULT_CONFIG)
    lon = float(cfg["spot"]["lonDeg"])
    lat = float(cfg["spot"]["latDeg"])
    wrap = load_rgb_float(args.wrap)
    for entry in cfg["patches"]:
        name = entry["id"] + ".jpg"
        width = float(entry["widthDeg"])
        patch = load_rgb_float(args.src_dir / name)
        size = patch.shape[0]
        on_patch = equirect_to_patch(wrap, lon, lat, width, size)
        sigma = max(1.5, args.blur_deg * size / width)
        out = rematch(patch, on_patch, sigma, args.ceiling)
        save_image(args.full_dir / name, out, quality=args.quality)
        web = int(entry["sizes"]["web"][0])
        save_image(args.web_dir / name, cv2.resize(out, (web, web), interpolation=cv2.INTER_AREA), quality=args.quality)
        print(name, "mean", out.mean(axis=(0, 1)).round(3), "p99", np.percentile(out.reshape(-1, 3), 99, axis=0).round(3), "max", out.max(axis=(0, 1)).round(3))


if __name__ == "__main__":
    main()
