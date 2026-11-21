import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import (camera_from_fit, load_fit, lonlat_to_local, mat_to_quat,  # noqa: E402
                    local_to_lonlat, normalize, quat_to_mat)

WORK = ROOT / "out" / "work" / "earth"
WORK.mkdir(parents=True, exist_ok=True)
FIT = load_fit("earth")
CAM = camera_from_fit(FIT)
G = quat_to_mat(FIT["globe"]["quaternion"])
SHAPE = np.array(json.loads((ROOT / "src" / "stops" / "earth" / "shape.json").read_text())["matrix"], dtype=np.float64)


SHAPE_INV = np.linalg.inv(SHAPE)


class Shaped:
    def __init__(self, G, S):
        self.G = G
        self.M = S @ G
        self.Minv = np.linalg.inv(self.M)
        self.Sinv = np.linalg.inv(S)

    def intersect(self, origin, dirs):
        o = self.Minv @ np.asarray(origin, dtype=np.float64)
        d = dirs @ self.Minv.T
        a = (d * d).sum(-1)
        bb = d @ o
        disc = bb * bb - a * (o @ o - 1)
        hit = disc >= 0
        t = (-bb - np.sqrt(np.where(hit, disc, 0))) / a
        hit &= t > 0
        y = normalize(o + d * t[..., None])
        v = o - y
        cosv = (y * v).sum(-1) / np.linalg.norm(v, axis=-1)
        return hit, t, y, y @ self.G.T, cosv

    def visible(self, cam, y):
        o = self.Minv @ cam.pos
        v = o - y
        return y @ self.M.T, y @ self.G.T, (y * v).sum(-1) / np.linalg.norm(v, axis=-1)

    def tangent(self, origin, dirs):
        o = self.Sinv @ np.asarray(origin, dtype=np.float64)
        d = normalize(dirs @ self.Sinv.T)
        b = -(d @ o)
        rt = np.sqrt(np.maximum(o @ o - b * b, 0))
        return rt, normalize(o + d * b[..., None])


BODY = Shaped(G, SHAPE)
SUN = normalize(np.asarray(FIT["sunDir"], dtype=np.float64))
SUN_BODY = SUN @ G
NIGHT = (0.04, -0.14)
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
    hit, t, y, n, cosv = BODY.intersect(CAM.pos, d)
    ndl = n @ SUN
    lon, lat = local_to_lonlat(y)
    rt, at = BODY.tangent(CAM.pos, d)
    return dict(hit=hit, lon=lon.astype(np.float32), lat=lat.astype(np.float32), cosv=cosv.astype(np.float32), ndl=ndl.astype(np.float32), y=y.astype(np.float32), d=d.astype(np.float32), rt=rt.astype(np.float32), at=at.astype(np.float32))


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


def fields(scale=1, strip=264):
    w, h = FIT["imageSize"][0] * scale, FIT["imageSize"][1] * scale
    out = dict(hit=np.zeros((h, w), bool), ndl=np.zeros((h, w), np.float32), cosv=np.zeros((h, w), np.float32), n=np.zeros((h, w, 3), np.float32), y=np.zeros((h, w, 3), np.float32))
    xs = (np.arange(w, dtype=np.float64) + 0.5) / scale
    for y0 in range(0, h, strip):
        y1 = min(y0 + strip, h)
        ys = (np.arange(y0, y1, dtype=np.float64) + 0.5) / scale
        px, py = np.meshgrid(xs, ys)
        d = CAM.rays_world(px, py)
        hit, t, y, n, cosv = BODY.intersect(CAM.pos, d)
        out["hit"][y0:y1] = hit
        out["ndl"][y0:y1] = n @ SUN
        out["cosv"][y0:y1] = cosv
        out["n"][y0:y1] = n
        out["y"][y0:y1] = y
    return out


def curve():
    c = json.loads((ROOT / "src" / "stops" / "earth" / "curve.json").read_text())
    return np.array(c["curve"], dtype=np.float32)


def shade(ndl, c=None):
    c = curve() if c is None else c
    k = c.shape[0]
    t = np.clip(ndl * 0.5 + 0.5, 0, 1) * (k - 1)
    return np.stack([np.interp(t, np.arange(k), c[:, i]) for i in range(3)], -1).astype(np.float32)


LIMB = json.loads((Path(__file__).resolve().parent / "limbhaze.json").read_text()) if (Path(__file__).resolve().parent / "limbhaze.json").exists() else None


def limb_haze(mu, ndl, sh):
    p = LIMB
    f = np.exp(-(np.clip(mu, 0, 1) / p["width"]) ** p["power"])[..., None]
    t = np.exp(-np.asarray(p["depth"], dtype=np.float32) * f)
    lit = (sh[..., 1] / 2.0) ** p["gamma"] * smooth(p["dayFrom"], p["dayTo"], ndl)
    return (np.asarray(p["pale"], dtype=np.float32) * p["keep"] * lit[..., None] + np.asarray(p["night"], dtype=np.float32)) * (1 - t), t
