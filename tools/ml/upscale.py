import argparse
from pathlib import Path
import time

import numpy as np
from PIL import Image

from common import describe, feather, load_rgb, model_session, positive_int, starts, weights

MODEL_URL = "https://huggingface.co/Xenova/swin2SR-lightweight-x2-64/resolve/92a21aca5713f20faf9a87590cdfbdce2e34112c/onnx/model.onnx"
MODEL_SHA256 = "c2abbfe0cc8e685b5e11964970f8ebe3d24072e904fd5545a30ac31ec1e110db"
SCALE = 2
WINDOW = 8


def infer(session, name, image, x, y):
    height, width = image.shape[:2]
    left, top = x % WINDOW, y % WINDOW
    right, bottom = -(left + width) % WINDOW, -(top + height) % WINDOW
    padded = np.pad(image, ((top, bottom), (left, right), (0, 0)), mode="symmetric")
    tensor = np.ascontiguousarray(padded.transpose(2, 0, 1)[None], dtype=np.float32) / 255
    result = session.run(None, {name: tensor})[0][0].transpose(1, 2, 0)
    return result[top * SCALE:(top + height) * SCALE, left * SCALE:(left + width) * SCALE]


def upscale(source, session, tile):
    height, width = source.shape[:2]
    tw, th = min(tile, width), min(tile, height)
    overlap = min(48, tile // 4)
    xs, ys = starts(width, tw, overlap), starts(height, th, overlap)
    x_weights = [feather(xs, i, tw, SCALE) for i in range(len(xs))]
    input_name = session.get_inputs()[0].name
    result = np.empty((height * SCALE, width * SCALE, 3), dtype=np.uint8)
    width_px, band_px = width * SCALE, th * SCALE
    accum = np.zeros((band_px, width_px, 3), dtype=np.float32)
    norm = np.zeros((band_px, width_px), dtype=np.float32)
    for i, y in enumerate(ys):
        wy = feather(ys, i, th, SCALE)
        for j, x in enumerate(xs):
            patch = infer(session, input_name, source[y:y + th, x:x + tw], x, y)
            pixels = slice(x * SCALE, (x + tw) * SCALE)
            mask = wy[:, None] * x_weights[j][None, :]
            accum[:, pixels] += patch * mask[..., None]
            norm[:, pixels] += mask
            print(f"Upscale tile {i * len(xs) + j + 1}/{len(xs) * len(ys)}", flush=True)
        next_y = ys[i + 1] if i + 1 < len(ys) else height
        filled = (next_y - y) * SCALE
        out_band = accum[:filled]
        out_band /= norm[:filled, :, None]
        out_band *= 255
        np.rint(out_band, out=out_band)
        np.clip(out_band, 0, 255, out=out_band)
        result[y * SCALE:next_y * SCALE] = out_band
        remaining = band_px - filled
        accum[:remaining] = accum[filled:]
        norm[:remaining] = norm[filled:]
        accum[remaining:] = 0
        norm[remaining:] = 0
    return Image.fromarray(result)


def main():
    parser = argparse.ArgumentParser(description="Add resolution while preserving the composition.")
    parser.add_argument("--in", dest="source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--width", type=positive_int, required=True)
    parser.add_argument("--tile", type=positive_int, default=448)
    args = parser.parse_args()
    if not 32 <= args.tile <= 512:
        parser.error("--tile must be between 32 and 512 for bounded CPU memory")
    start = time.perf_counter()
    source = load_rgb(args.source)
    session = model_session(weights("swin2sr-lightweight-x2.onnx", MODEL_URL, MODEL_SHA256), reuse_memory=True)
    enhanced = upscale(np.asarray(source), session, args.tile)
    size = args.width, max(1, round(source.height * args.width / source.width))
    if not enhanced.size == size:
        enhanced = enhanced.resize(size, Image.Resampling.LANCZOS)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    options = {"quality": 98, "subsampling": 0} if args.out.suffix.lower() in {".jpg", ".jpeg"} else {}
    enhanced.save(args.out, **options)
    describe(start, *size)


if __name__ == "__main__":
    main()
