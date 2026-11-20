import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CONFIG = json.loads((ROOT / "config" / "showcase.json").read_text())
HINTS = json.loads((Path(__file__).resolve().parent / "hints.json").read_text())


def stop_cfg(stop_id):
    for s in CONFIG["stops"]:
        if s["id"] == stop_id:
            return s
    raise SystemExit(f"unknown stop {stop_id}")


def stop_ids():
    return [s["id"] for s in CONFIG["stops"]]


def load_hero(stop_id):
    im = Image.open(ROOT / stop_cfg(stop_id)["hero"]).convert("RGB")
    return np.asarray(im).astype(np.float32) / 255.0


def fit_path(stop_id):
    return ROOT / "assets-src" / stop_id / "fit.json"


def work_dir(stop_id):
    d = ROOT / "out" / "work" / "assets" / stop_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_fit(stop_id):
    return json.loads(fit_path(stop_id).read_text())


def normalize(v):
    v = np.asarray(v, dtype=np.float64)
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def mat_to_quat(m):
    m = np.asarray(m, dtype=np.float64)
    t = np.trace(m)
    if t > 0:
        s = math.sqrt(t + 1.0) * 2
        w = 0.25 * s
        x = (m[2, 1] - m[1, 2]) / s
        y = (m[0, 2] - m[2, 0]) / s
        z = (m[1, 0] - m[0, 1]) / s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = math.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2]) * 2
        w = (m[2, 1] - m[1, 2]) / s
        x = 0.25 * s
        y = (m[0, 1] + m[1, 0]) / s
        z = (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = math.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2]) * 2
        w = (m[0, 2] - m[2, 0]) / s
        x = (m[0, 1] + m[1, 0]) / s
        y = 0.25 * s
        z = (m[1, 2] + m[2, 1]) / s
    else:
        s = math.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1]) * 2
        w = (m[1, 0] - m[0, 1]) / s
        x = (m[0, 2] + m[2, 0]) / s
        y = (m[1, 2] + m[2, 1]) / s
        z = 0.25 * s
    q = np.array([x, y, z, w])
    q /= np.linalg.norm(q)
    if q[3] < 0:
        q = -q
    return q


def quat_to_mat(q):
    x, y, z, w = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


def rot_y(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


# Local frame of the brief: lon 0 lat 0 is +Z. three.js SphereGeometry puts u=0.5 at +X,
# so a SphereGeometry mesh needs this extra rotation on the right.
THREE_SPHERE_TO_LOCAL = rot_y(-90.0)


def lonlat_to_local(lon_deg, lat_deg):
    lon = np.radians(lon_deg)
    lat = np.radians(lat_deg)
    cl = np.cos(lat)
    return np.stack([cl * np.sin(lon), np.sin(lat), cl * np.cos(lon)], axis=-1)


def local_to_lonlat(v):
    lon = np.degrees(np.arctan2(v[..., 0], v[..., 2]))
    lat = np.degrees(np.arcsin(np.clip(v[..., 1], -1, 1)))
    return lon, lat


class Camera:
    def __init__(self, width, height, vfov_deg, position, quaternion=(0, 0, 0, 1)):
        self.w = width
        self.h = height
        self.vfov = vfov_deg
        self.t = math.tan(math.radians(vfov_deg) / 2)
        self.aspect = width / height
        self.f = (height / 2) / self.t
        self.pos = np.asarray(position, dtype=np.float64)
        self.R = quat_to_mat(quaternion)

    def rays_cam(self, px, py):
        x = (np.asarray(px) / self.w) * 2 - 1
        y = 1 - (np.asarray(py) / self.h) * 2
        d = np.stack([x * self.t * self.aspect, y * self.t, -np.ones_like(x, dtype=np.float64)], axis=-1)
        return d / np.linalg.norm(d, axis=-1, keepdims=True)

    def rays_world(self, px, py):
        return self.rays_cam(px, py) @ self.R.T

    def project(self, p):
        c = (np.asarray(p, dtype=np.float64) - self.pos) @ self.R
        z = -c[..., 2]
        x = c[..., 0] / (z * self.t * self.aspect)
        y = c[..., 1] / (z * self.t)
        return (x + 1) / 2 * self.w, (1 - y) / 2 * self.h, z


def camera_from_fit(fit):
    w, h = fit["imageSize"]
    c = fit["camera"]
    return Camera(w, h, fit["vfovDeg"], c["position"], c["quaternion"])


def ray_sphere(origin, dirs, center=(0, 0, 0), radius=1.0):
    oc = np.asarray(origin, dtype=np.float64) - np.asarray(center, dtype=np.float64)
    b = dirs @ oc
    c = oc @ oc - radius * radius
    disc = b * b - c
    hit = disc >= 0
    t = -b - np.sqrt(np.where(hit, disc, 0))
    hit &= t > 0
    return hit, t


def ray_plane(origin, dirs, normal):
    n = np.asarray(normal, dtype=np.float64)
    den = dirs @ n
    with np.errstate(divide="ignore", invalid="ignore"):
        t = -(np.asarray(origin) @ n) / den
    return t


def save_rgb(path, arr, quality=90):
    im = Image.fromarray(np.clip(arr * 255 + 0.5, 0, 255).astype(np.uint8))
    im.save(path, quality=quality) if str(path).endswith(".jpg") else im.save(path)


def downsize(arr, long_edge):
    h, w = arr.shape[:2]
    s = long_edge / max(h, w)
    im = Image.fromarray(np.clip(arr * 255 + 0.5, 0, 255).astype(np.uint8))
    return np.asarray(im.resize((round(w * s), round(h * s)), Image.LANCZOS)).astype(np.float32) / 255


class Body:
    def __init__(self, G=None, polar=1.0):
        self.G = np.eye(3) if G is None else np.asarray(G, dtype=np.float64)
        self.b = float(polar)
        self.M = self.G @ np.diag([1.0, self.b, 1.0])
        self.Minv = np.linalg.inv(self.M)

    def intersect(self, origin, dirs):
        o = self.Minv @ np.asarray(origin, dtype=np.float64)
        d = dirs @ self.Minv.T
        a = (d * d).sum(-1)
        bb = d @ o
        c = o @ o - 1
        disc = bb * bb - a * c
        hit = disc >= 0
        t = (-bb - np.sqrt(np.where(hit, disc, 0))) / a
        hit &= t > 0
        y = o + d * t[..., None]
        y = y / np.linalg.norm(y, axis=-1, keepdims=True)
        n = normalize(y @ self.Minv)
        return hit, t, y, n

    def visible(self, cam, y):
        p = y @ self.M.T
        n = normalize(y @ self.Minv)
        v = cam.pos - p
        cosv = (n * v).sum(-1) / np.linalg.norm(v, axis=-1)
        return p, n, cosv


def body_from_fit(fit):
    g = fit["globe"]
    return Body(quat_to_mat(g["quaternion"]), g.get("scale", [1, 1, 1])[1])
