import cv2
import numpy as np

from geo import lonlat_to_local, local_to_lonlat, map_lonlat


def basis(lon, lat, roll=0.0):
    c = lonlat_to_local(np.float64(lon), np.float64(lat))
    up = np.array([0.0, 1.0, 0.0]) if abs(lat) < 80 else lonlat_to_local(np.float64(lon + roll), np.float64(0.0)) * (-np.sign(lat))
    r = np.cross(up, c)
    r = -r / np.linalg.norm(r)
    r = np.cross(c, up)
    r = -r / np.linalg.norm(r)
    u = np.cross(c, r) * -1
    u = u / np.linalg.norm(u)
    if u @ up < 0:
        u = -u
    r = np.cross(u, c)
    return c, r, u


def face_dirs(B, fov, N):
    c, r, u = B
    t = np.tan(np.radians(fov) / 2)
    s = ((np.arange(N) + 0.5) / N * 2 - 1) * t
    X, Y = np.meshgrid(s, -s)
    d = c[None, None] + X[..., None] * r + Y[..., None] * u
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def sample_map(img, lon, lat):
    h, w = img.shape[:2]
    x = ((lon + 180) / 360 * w - 0.5) % w
    y = np.clip((90 - lat) / 180 * h - 0.5, 0, h - 1)
    pad = np.concatenate([img[:, -8:], img, img[:, :8]], 1)
    return cv2.remap(pad, (x + 8).astype(np.float32), y.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def render_face(img, B, fov, N):
    lon, lat = local_to_lonlat(face_dirs(B, fov, N))
    return sample_map(img, lon, lat)


def map_to_face(B, fov, N, W, rows=None):
    LON, LAT = map_lonlat(W)
    if rows is not None:
        LON, LAT = LON[rows], LAT[rows]
    v = lonlat_to_local(LON, LAT)
    c, r, u = B
    z = v @ c
    t = np.tan(np.radians(fov) / 2)
    with np.errstate(divide="ignore", invalid="ignore"):
        x = (v @ r) / z / t
        y = (v @ u) / z / t
    ok = (z > 0.05) & (np.abs(x) < 1) & (np.abs(y) < 1)
    fx = ((x + 1) / 2 * N - 0.5).astype(np.float32)
    fy = ((1 - y) / 2 * N - 0.5).astype(np.float32)
    e = np.maximum(np.abs(x), np.abs(y))
    return fx, fy, ok, e


def splat(acc, wacc, face, B, fov, W, inner=0.75, rows=None, extra=None):
    N = face.shape[0]
    fx, fy, ok, e = map_to_face(B, fov, N, W, rows)
    val = cv2.remap(face, np.where(ok, fx, 0), np.where(ok, fy, 0), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    t = np.clip((1 - e) / (1 - inner), 0, 1)
    w = (t * t * (3 - 2 * t)) * ok
    if extra is not None:
        w = w * extra
    if val.ndim == 3:
        acc += val * w[..., None]
    else:
        acc += val * w
    wacc += w
