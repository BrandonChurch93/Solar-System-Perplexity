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


def band_tangent(img, k):
    import cv2
    y = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5 * k)
    gx = cv2.Sobel(y, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(y, cv2.CV_32F, 0, 1, ksize=3)
    jxx, jxy, jyy = (cv2.GaussianBlur(v, (0, 0), 8.0 * k) for v in (gx * gx, gx * gy, gy * gy))
    ang = 0.5 * np.arctan2(2 * jxy, jxx - jyy)
    return -np.sin(ang), np.cos(ang)


def calm(img, where, k=1.0, steps=(1.5, 3, 4.5, 6, 8, 10), knee=(16.0, 34.0), wide=0.75, gain=1.9, room=4.0, grey=0.7, near=5.0):
    import cv2
    h, w = img.shape[:2]
    tx, ty = band_tangent(img, k)
    f = img.astype(np.float32)
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    med = np.median(np.stack([cv2.remap(f, xs + g * s * k * tx, ys + g * s * k * ty, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT) for s in steps for g in (-1, 1)]), axis=0)
    lw = np.array([0.0722, 0.7152, 0.2126], np.float32)
    e = f - med
    el = e @ lw
    ml = med @ lw
    n = int(round(near * k)) * 2 + 1
    cap = np.maximum(cv2.dilate(cv2.GaussianBlur(ml, (0, 0), 0.8 * k), np.ones((n, n), np.uint8)) - ml, 0) + room
    t = np.clip((el - knee[0]) / (knee[1] - knee[0]), 0, 1)
    wgt = t * t * (3 - 2 * t) * where
    e = e * (1 - grey) + el[..., None] * grey
    spread = cv2.GaussianBlur(e * wgt[..., None], (0, 0), wide * k) * gain
    out = f - (f - med) * wgt[..., None] + spread * np.minimum(1.0, cap / np.maximum(spread @ lw, 1e-3))[..., None]
    return np.clip(out, 0, 255), float((wgt > 0.5).sum() / max(float((where > 0.5).sum()), 1.0))
