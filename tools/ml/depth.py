import argparse
import json
from pathlib import Path
import time

import cv2
import numpy as np
from PIL import Image

from common import config, describe, feather, load_rgb, model_session, positive_int, starts, weights

MODEL_URL = "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/4472b7362082ad9968fee890ca0f1e5aca36b93d/onnx/model.onnx"
MODEL_SHA256 = "afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c"
MEAN = np.asarray([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.asarray([0.229, 0.224, 0.225], dtype=np.float32)
PATCH = 14
TILE = 616
OVERLAP = 168


def infer(session, name, image, long_edge):
    height, width = image.shape[:2]
    ratio = long_edge / max(height, width)
    model_size = tuple(max(PATCH, PATCH * round(i * ratio / PATCH)) for i in (width, height))
    resized = cv2.resize(image, model_size, interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
    tensor = np.ascontiguousarray(((resized - MEAN) / STD).transpose(2, 0, 1)[None])
    depth = session.run(None, {name: tensor})[0][0].reshape(model_size[::-1])
    if not np.isfinite(depth).all():
        raise RuntimeError("Model returned non-finite values")
    return cv2.resize(depth, (width, height), interpolation=cv2.INTER_LINEAR)


def align(tile, reference):
    height, width = tile.shape
    by, bx = height // 8, width // 8
    sl = np.s_[by:height - by:4, bx:width - bx:4]
    a, b = (image[sl].ravel().astype(np.float64) for image in (tile, reference))
    am, bm = a.mean(), b.mean()
    a -= am
    b -= bm
    covariance = np.dot(a, b)
    a_energy, b_energy = np.dot(a, a), np.dot(b, b)
    if a_energy <= 1e-10 or b_energy <= 1e-10 or covariance <= 0:
        return reference
    correlation = min(1, covariance / np.sqrt(a_energy * b_energy))
    scale = covariance / a_energy
    shift = bm - scale * am
    return reference + (tile * scale + shift - reference) * (0.85 * correlation)


def estimate(source, session):
    height, width = source.shape[:2]
    name = session.get_inputs()[0].name
    print("Depth global pass", flush=True)
    base = infer(session, name, source, 518)
    if max(width, height) <= 518:
        return base
    tw, th = min(TILE, width), min(TILE, height)
    xs, ys = starts(width, tw, OVERLAP), starts(height, th, OVERLAP)
    x_weights = [feather(xs, i, tw) for i in range(len(xs))]
    depth = np.zeros_like(base)
    norm = np.zeros_like(base)
    for i, y in enumerate(ys):
        wy = feather(ys, i, th)
        for j, x in enumerate(xs):
            area = np.s_[y:y + th, x:x + tw]
            local = infer(session, name, source[area], 392)
            blend = wy[:, None] * x_weights[j][None, :]
            depth[area] += blend * align(local, base[area])
            norm[area] += blend
            print(f"Depth tile {i * len(xs) + j + 1}/{len(xs) * len(ys)}", flush=True)
    return np.divide(depth, norm, out=depth)


def main():
    parser = argparse.ArgumentParser(description="Estimate tiled relative inverse depth.")
    parser.add_argument("--in", dest="source", required=True, type=Path)
    parser.add_argument("--out-prefix", required=True, type=Path)
    parser.add_argument("--width", type=positive_int, help="Output width, defaults to source width")
    args = parser.parse_args()
    cv2.setNumThreads(2)
    start = time.perf_counter()
    source = load_rgb(args.source)
    width = args.width or source.width
    height = max(1, round(source.height * width / source.width))
    size = (width, height)
    if width < source.width:
        source = source.resize(size, Image.Resampling.LANCZOS)
    session = model_session(weights("depth-anything-v2-small.onnx", MODEL_URL, MODEL_SHA256))
    depth = estimate(np.asarray(source), session)
    if not depth.shape[::-1] == size:
        depth = cv2.resize(depth, size, interpolation=cv2.INTER_LINEAR)
    low, high = float(depth.min()), float(depth.max())
    depth -= low
    if high > low:
        depth /= high - low
    np.clip(depth, 0, 1, out=depth)
    args.out_prefix.parent.mkdir(parents=True, exist_ok=True)
    depth.astype("<f4", copy=False).tofile(f"{args.out_prefix}.raw")
    metadata = {
        "width": width,
        "height": height,
        "min": float(depth.min()),
        "max": float(depth.max()),
        "dtype": "float32",
        "byteOrder": "little-endian",
        "order": "row-major",
        "near": 1,
    }
    Path(f"{args.out_prefix}.json").write_text(json.dumps(metadata, indent=2) + "\n")
    Image.fromarray(np.uint16(np.rint(depth * 65535))).save(f"{args.out_prefix}.png")
    preview = Image.fromarray(np.uint8(np.rint(depth * 255)))
    cap = config()["critics"]["maxImageLongEdgePx"]
    preview.thumbnail((cap, cap), Image.Resampling.LANCZOS)
    preview.save(f"{args.out_prefix}.jpg", quality=96)
    describe(start, width, height)


if __name__ == "__main__":
    main()
