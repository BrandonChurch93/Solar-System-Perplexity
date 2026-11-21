import json
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import Camera, quat_to_mat  # noqa: E402

HERE = Path(__file__).resolve().parent
WORK = ROOT / "out" / "work" / "saturn"
WORK.mkdir(parents=True, exist_ok=True)
POLAR = 0.902


def load_json(p):
    return json.loads(Path(p).read_text())


def lum(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def srgb_to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(a):
    a = np.clip(a, 0, None)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def normalize(v):
    v = np.asarray(v, dtype=np.float64)
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def basis(n):
    n = normalize(n)
    ref = np.array([0.0, 0.0, 1.0]) if abs(n[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    e1 = normalize(np.cross(ref, n))
    e2 = np.cross(n, e1)
    return e1, e2, n


def plane_hit(origin, dirs, n):
    den = dirs @ n
    with np.errstate(divide="ignore", invalid="ignore"):
        t = -(origin @ n) / den
    return t, origin + dirs * t[..., None]


def spheroid_hit(origin, dirs, n, polar=POLAR):
    k = 1.0 / polar - 1.0
    o = origin + n * (origin @ n) * k
    d = dirs + n * (dirs @ n)[..., None] * k
    a = (d * d).sum(-1)
    b = d @ o if o.ndim == 1 else (d * o).sum(-1)
    c = (o * o).sum(-1) - 1.0
    disc = b * b - a * c
    hit = disc >= 0
    t = (-b - np.sqrt(np.where(hit, disc, 0))) / a
    return hit & (t > 0), t


def spheroid_miss(origin, dirs, n, polar=POLAR):
    k = 1.0 / polar - 1.0
    o = origin + n * (origin @ n)[..., None] * k if origin.ndim > 1 else origin + n * (origin @ n) * k
    d = dirs + n * (dirs @ n)[..., None] * k if dirs.ndim > 1 else dirs + n * (dirs @ n) * k
    a = (d * d).sum(-1)
    b = (d * o).sum(-1)
    c = (o * o).sum(-1) - 1.0
    tc = np.clip(-b / a, 0, None)
    q = o + (d if d.ndim > 1 else d[None]) * tc[..., None]
    return np.sqrt((q * q).sum(-1))


def hero_camera(fit):
    w, h = fit["imageSize"]
    c = fit["camera"]
    return Camera(w, h, fit["vfovDeg"], c["position"], c["quaternion"])


def pixel_grid(w, h, step=1):
    xs = np.arange(step / 2, w, step)
    ys = np.arange(step / 2, h, step)
    return np.meshgrid(xs, ys)
