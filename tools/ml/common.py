import argparse
import hashlib
import json
from pathlib import Path
import resource
import shutil
import sys
import tempfile
import time
from urllib.request import urlopen

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]


def config():
    return json.loads((ROOT / "config/showcase.json").read_text())


def positive_int(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return number


def load_rgb(path):
    with Image.open(path) as image:
        return ImageOps.exif_transpose(image).convert("RGB")


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def weights(name, url, sha256):
    cache = ROOT / "references/cache/models"
    cache.mkdir(parents=True, exist_ok=True)
    path = cache / name
    if path.exists() and digest(path) == sha256:
        return path
    limits = config()["sandbox"]
    if shutil.disk_usage(cache).free < limits["minFreeDiskGb"] * 10**9:
        raise RuntimeError("Not enough free disk to download model weights")
    limit = limits["maxDownloadGb"] * 10**9
    print(f"Downloading {name}", flush=True)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(dir=cache, delete=False) as temp:
            temp_path = Path(temp.name)
            with urlopen(url, timeout=60) as response:
                while chunk := response.read(1024 * 1024):
                    if temp.tell() + len(chunk) > limit:
                        raise RuntimeError("Model download exceeds the project limit")
                    temp.write(chunk)
        if digest(temp_path) == sha256:
            temp_path.replace(path)
        else:
            raise RuntimeError(f"SHA-256 mismatch: {name}")
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
    return path


def model_session(model_path):
    import onnxruntime as ort

    settings = ort.SessionOptions()
    settings.intra_op_num_threads = 2
    settings.inter_op_num_threads = 1
    settings.enable_mem_pattern = False
    settings.enable_cpu_mem_arena = False
    return ort.InferenceSession(str(model_path), sess_options=settings, providers=["CPUExecutionProvider"])


def starts(length, tile, overlap):
    if length <= tile:
        return [0]
    segments = (length - tile + tile - overlap - 1) // (tile - overlap)
    return [round(i * (length - tile) / segments) for i in range(segments + 1)]


def feather(positions, index, tile, scale=1):
    weights = np.ones(tile * scale, dtype=np.float32)
    center = positions[index]
    if index > 0:
        count = (positions[index - 1] + tile - center) * scale
        weights[:count] *= (np.arange(count, dtype=np.float32) + 0.5) / count
    if index + 1 < len(positions):
        count = (center + tile - positions[index + 1]) * scale
        weights[-count:] *= (np.arange(count, dtype=np.float32)[::-1] + 0.5) / count
    return weights


def describe(start_time, width, height):
    elapsed = time.perf_counter() - start_time
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    mib = rss / (1024 if sys.platform == "linux" else 1024**2)
    print(f"{width}x{height} in {elapsed:.2f} s, {elapsed * 1e6 / (width * height):.2f} s/MP, peak RSS {mib:.1f} MiB")
