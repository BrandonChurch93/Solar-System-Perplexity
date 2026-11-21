import numpy as np
import cv2
from geo import *

PW, PH = 8192, 2048
B0, B1 = 1.0, 3.0


def rows(n=PH):
    return B0 * np.exp((np.arange(n) + 0.5) / n * np.log(B1 / B0))


def cols(n=PW):
    return (np.arange(n) + 0.5) / n * 2 * np.pi


def rays(theta, b):
    a = -CAM / DIST
    e1 = np.array([1.0, 0, 0]) - a[0] * a
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(e1, a)
    al = np.arcsin(np.clip(b / DIST, 0, 1))
    return np.cos(al)[..., None] * a + np.sin(al)[..., None] * (np.cos(theta)[..., None] * e1 + np.sin(theta)[..., None] * e2)


def image_xy(theta, b, scale=1.0):
    d = rays(theta, b)
    z = -d[..., 2]
    return (d[..., 0] / z * FOCAL + W / 2) * scale, (-d[..., 1] / z * FOCAL + H / 2) * scale


def polar_of(p):
    rel = p - CAM
    d = rel / np.linalg.norm(rel, axis=-1, keepdims=True)
    t = -(CAM * d).sum(-1)
    near = CAM + d * t[..., None]
    b = np.linalg.norm(near, axis=-1)
    return np.arctan2(near[..., 1], near[..., 0]) % (2 * np.pi), b


def unwrap(img):
    s = img.shape[1] / W
    t, b = np.meshgrid(cols(), rows())
    px, py = image_xy(t, b, s)
    inside = (px >= 2) & (px < img.shape[1] - 2) & (py >= 2) & (py < img.shape[0] - 2)
    out = cv2.remap(img, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return np.clip(out, 0, 1), inside


def frame_edge():
    t = cols()
    lo = np.full(PW, B0)
    hi = np.full(PW, 6.0)
    for _ in range(40):
        mid = (lo + hi) / 2
        px, py = image_xy(t, mid)
        ok = (px >= 1) & (px < W - 1) & (py >= 1) & (py < H - 1)
        lo = np.where(ok, mid, lo)
        hi = np.where(ok, hi, mid)
    return lo


def sample_polar(pol, theta, b, interp=cv2.INTER_LINEAR):
    n = pol.shape[0]
    x = theta / (2 * np.pi) * pol.shape[1] - 0.5
    y = np.log(np.maximum(b, 1e-6) / B0) / np.log(B1 / B0) * n - 0.5
    wide = np.concatenate([pol[:, -4:], pol, pol[:, :4]], 1)
    return cv2.remap(wide, (x + 4).astype(np.float32), y.astype(np.float32), interp, borderMode=cv2.BORDER_REPLICATE)
