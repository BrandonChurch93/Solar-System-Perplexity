import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import (body_from_fit, camera_from_fit, load_fit, lonlat_to_local,  # noqa: E402
                    local_to_lonlat, normalize, quat_to_mat)

WORK = ROOT / "out" / "work" / "earth"
WORK.mkdir(parents=True, exist_ok=True)
FIT = load_fit("earth")
CAM = camera_from_fit(FIT)
BODY = body_from_fit(FIT)
G = quat_to_mat(FIT["globe"]["quaternion"])
SUN = normalize(np.asarray(FIT["sunDir"], dtype=np.float64))
SUN_BODY = SUN @ G
HERO = ROOT / "references" / "approved" / "earth-hero.png"
HOLD = json.loads((Path(__file__).resolve().parent / "hold.json").read_text()) if (Path(__file__).resolve().parent / "hold.json").exists() else {}


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.maximum(c, 1e-9) ** (1 / 2.4) - 0.055)


def filmic(x):
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def inverse_filmic(y):
    y = np.clip(y, 0, 0.985)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return (-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))


def decode(img):
    return inverse_filmic(srgb_to_linear(img))


def encode(lin):
    return linear_to_srgb(filmic(np.maximum(lin, 0)))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def read(path):
    im = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if im is None:
        raise SystemExit(f"cannot read {path}")
    if im.ndim == 3:
        im = im[..., [2, 1, 0, 3]] if im.shape[2] == 4 else im[..., ::-1]
    k = 65535.0 if im.dtype == np.uint16 else 255.0
    return im.astype(np.float32) / k


def write(path, img, quality=95):
    a = np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)
    if a.ndim == 3:
        a = a[..., [2, 1, 0, 3]] if a.shape[2] == 4 else a[..., ::-1]
    p = str(path)
    if p.endswith(".jpg"):
        cv2.imwrite(p, a, [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    elif p.endswith(".webp"):
        cv2.imwrite(p, a, [cv2.IMWRITE_WEBP_QUALITY, quality])
    else:
        cv2.imwrite(p, a)


def hero(scale=1):
    if scale == 1:
        return read(HERO)
    return read(WORK / "up" / "hero-x2.png")


def hero_geometry(scale=1):
    w, h = FIT["imageSize"][0] * scale, FIT["imageSize"][1] * scale
    py, px = np.mgrid[0:h, 0:w].astype(np.float64) + 0.5
    d = CAM.rays_world(px / scale, py / scale)
    hit, t, y, n = BODY.intersect(CAM.pos, d)
    cosv = -(n * d).sum(-1)
    ndl = n @ SUN
    lon, lat = local_to_lonlat(y)
    b = -(d @ CAM.pos)
    rt = np.sqrt(np.maximum(CAM.pos @ CAM.pos - b * b, 0))
    return dict(hit=hit, lon=lon.astype(np.float32), lat=lat.astype(np.float32), cosv=cosv.astype(np.float32), ndl=ndl.astype(np.float32), y=y.astype(np.float32), d=d.astype(np.float32), rt=rt.astype(np.float32))


def map_dirs(W, rows=None):
    H = W // 2
    rows = np.arange(H) if rows is None else rows
    lon = (np.arange(W) + 0.5) / W * 360 - 180
    lat = 90 - (rows + 0.5) / H * 180
    lo, la = np.meshgrid(lon, lat)
    return lonlat_to_local(lo, la)


def project_dirs(y, scale=1):
    p, n, cosv = BODY.visible(CAM, y)
    px, py, z = CAM.project(p)
    return (px * scale - 0.5).astype(np.float32), (py * scale - 0.5).astype(np.float32), cosv.astype(np.float32), (n @ SUN).astype(np.float32)


def map_xy(y, W):
    lon, lat = local_to_lonlat(y)
    return ((lon / 360 + 0.5) * W - 0.5).astype(np.float32), ((0.5 - lat / 180) * (W // 2) - 0.5).astype(np.float32)


def sample_map(img, y):
    x, yy = map_xy(y, img.shape[1])
    return cv2.remap(img, x, yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def turn_about(d, axis, ang):
    c, s = np.cos(ang)[..., None], np.sin(ang)[..., None]
    return d * c + np.cross(axis, d) * s + axis * (d @ axis)[..., None] * (1 - c)


def spin_y(d, a):
    c, s = np.cos(a), np.sin(a)
    return np.stack([c * d[..., 0] - s * d[..., 2], d[..., 1], s * d[..., 0] + c * d[..., 2]], -1)


def gnomonic_frame(lon, lat):
    n = lonlat_to_local(lon, lat)
    e = normalize(np.cross([0, 1, 0], n))
    u = np.cross(n, e)
    return n, e, u


def gnomonic_dirs(lon, lat, width_deg, size):
    n, e, u = gnomonic_frame(lon, lat)
    t = np.tan(np.radians(width_deg) / 2)
    xs = ((np.arange(size) + 0.5) / size * 2 - 1) * t
    gx, gy = np.meshgrid(xs, -xs)
    return normalize(n + gx[..., None] * e + gy[..., None] * u)


def gnomonic_xy(y, lon, lat, width_deg, size):
    n, e, u = gnomonic_frame(lon, lat)
    t = np.tan(np.radians(width_deg) / 2)
    dn = y @ n
    inv = 1 / np.maximum(dn, 1e-6)
    x = (y @ e) * inv / t
    v = (y @ u) * inv / t
    return ((x + 1) / 2 * size - 0.5).astype(np.float32), ((1 - v) / 2 * size - 0.5).astype(np.float32), dn
