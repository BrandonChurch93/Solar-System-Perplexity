import argparse
from pathlib import Path
import time

import cv2
import numpy as np
from PIL import Image

from common import config, describe, load_rgb


def ssim(a, b):
    def blur(image):
        return cv2.GaussianBlur(image, (11, 11), 1.5)

    scores = []
    for i in range(3):
        x, y = (image[..., i].astype(np.float32) for image in (a, b))
        mx, my = blur(x), blur(y)
        vx, vy = blur(x * x) - mx * mx, blur(y * y) - my * my
        cov = blur(x * y) - mx * my
        c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
        field = ((2 * mx * my + c1) * (2 * cov + c2)) / ((mx * mx + my * my + c1) * (vx + vy + c2))
        scores.append((field[5:-5, 5:-5] if min(field.shape) > 10 else field).mean(dtype=np.float64))
    return float(np.mean(scores))


def main():
    parser = argparse.ArgumentParser(description="Compare an altered image against the original pixel grid.")
    parser.add_argument("--a", type=Path, required=True)
    parser.add_argument("--b", type=Path, required=True)
    parser.add_argument("--max-shift", type=float, default=1.5)
    parser.add_argument("--heatmap", type=Path, help="JPEG path, defaults to RESULT-flow.jpg")
    args = parser.parse_args()
    if not np.isfinite(args.max_shift) or args.max_shift < 0:
        parser.error("--max-shift must be finite and nonnegative")
    if args.heatmap is None:
        args.heatmap = args.b.with_name(f"{args.b.stem}-flow.jpg")
    cv2.setNumThreads(2)
    start = time.perf_counter()
    original, result = load_rgb(args.a), load_rgb(args.b)
    if min(original.size) < 8:
        parser.error("the original must be at least 8 pixels on both axes")
    a = np.asarray(original)
    b = np.asarray(result.resize(original.size, Image.Resampling.LANCZOS))
    difference = a.astype(np.float32) - b
    mse = float(np.mean(np.square(difference, out=difference), dtype=np.float64))
    del difference
    psnr = float(10 * np.log10(255**2 / mse)) if mse > 0 else float("inf")
    structural = ssim(a, b)
    if mse == 0:
        magnitude = np.zeros(a.shape[:2], dtype=np.float32)
    else:
        gray_a, gray_b = (cv2.cvtColor(image, cv2.COLOR_RGB2GRAY) for image in (a, b))
        flow = cv2.calcOpticalFlowFarneback(gray_a, gray_b, None, 0.5, 5, 17, 4, 7, 1.5, 0)
        magnitude = cv2.magnitude(flow[..., 0], flow[..., 1])
    median, p99 = np.percentile(magnitude, [50, 99])
    maximum = float(magnitude.max())
    ceiling = max(args.max_shift, 0.01)
    ramp = np.uint8(np.rint(np.clip(magnitude / ceiling, 0, 1) * 255))
    heat = Image.fromarray(cv2.cvtColor(cv2.applyColorMap(ramp, cv2.COLORMAP_INFERNO), cv2.COLOR_BGR2RGB))
    cap = config()["critics"]["maxImageLongEdgePx"]
    heat.thumbnail((cap, cap), Image.Resampling.LANCZOS)
    args.heatmap.parent.mkdir(parents=True, exist_ok=True)
    heat.save(args.heatmap, format="JPEG", quality=95, subsampling=0)
    print(f"PSNR {psnr:.3f} dB | SSIM {structural:.6f}")
    print(f"Flow median {median:.4f} px | p99 {p99:.4f} px | max {maximum:.4f} px")
    print(f"Heat map {args.heatmap} (dark = no shift, bright = {ceiling:g} px or more)")
    describe(start, *original.size)
    if p99 > args.max_shift:
        print(f"FAIL: p99 exceeds {args.max_shift:g} px")
        return 1
    print(f"PASS: p99 does not exceed {args.max_shift:g} px")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
