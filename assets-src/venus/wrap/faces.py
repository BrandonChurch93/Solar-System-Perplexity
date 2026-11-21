import sys
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
from geo import lonlat_dir, dir_lonlat

FOV = 110.0
N = 2048
CENTER = (0.0, 40.0)


def bases():
    f = lonlat_dir(*CENTER)
    r = np.cross([0.0, 1.0, 0.0], f)
    r /= np.linalg.norm(r)
    u = np.cross(f, r)
    return {'c': (r, u, f), 'r': (-f, u, r), 'l': (f, u, -r), 'u': (r, -f, u), 'd': (r, f, -u), 'b': (-r, u, -f)}


def face_dirs(basis, fov=FOV, n=N):
    r, u, f = basis
    t = np.tan(np.radians(fov) / 2)
    ys, xs = np.mgrid[0:n, 0:n]
    x = (2 * (xs + 0.5) / n - 1) * t
    y = (1 - 2 * (ys + 0.5) / n) * t
    d = f[None, None] + x[..., None] * r + y[..., None] * u
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def sample_eq(eq, d, interp=cv2.INTER_LINEAR):
    h, w = eq.shape[:2]
    lon, lat = dir_lonlat(d)
    px = ((lon + 180) / 360 * w - 0.5).astype(np.float32)
    py = ((90 - lat) / 180 * h - 0.5).astype(np.float32)
    return cv2.remap(eq, px, py, interp, borderMode=cv2.BORDER_WRAP)


def render_face(eq, basis, fov=FOV, n=N, interp=cv2.INTER_LINEAR):
    return sample_eq(eq, face_dirs(basis, fov, n), interp)


def splat_face(face, basis, w, h, fov=FOV, feather=0.12, band=512):
    r, u, f = basis
    t = np.tan(np.radians(fov) / 2)
    n = face.shape[0]
    out = np.zeros((h, w) + face.shape[2:], np.float32)
    wt = np.zeros((h, w), np.float32)
    for y0 in range(0, h, band):
        ys, xs = np.mgrid[y0:min(y0 + band, h), 0:w]
        d = lonlat_dir((xs + 0.5) / w * 360 - 180, 90 - (ys + 0.5) / h * 180)
        z = d @ f
        ok = z > 0.2
        zz = np.where(ok, z, 1)
        x = (d @ r) / zz / t
        y = (d @ u) / zz / t
        m = np.maximum(np.abs(x), np.abs(y))
        ok &= m < 1
        if not ok.any():
            continue
        px = ((x + 1) / 2 * n - 0.5).astype(np.float32)
        py = ((1 - y) / 2 * n - 0.5).astype(np.float32)
        s = cv2.remap(face, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        k = np.clip((1 - m) / feather, 0, 1)
        k = np.where(ok, k * k * (3 - 2 * k), 0)
        out[y0:y0 + band] = s
        wt[y0:y0 + band] = k
    return out, wt
