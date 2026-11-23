"""Shared geometry of the Mars place tools: the body frame, the gnomonic patch frame, cameras and the place picture.

Body direction of (lon, lat) is (cos lat sin lon, sin lat, cos lat cos lon), as in the wrap map and the patches.
Cameras come from geometry.json (written by geometry.ts) in the body frame.
"""
import json
import numpy as np

SPOT_LON, SPOT_LAT = -81.86, -4.54


def direction(lon_deg, lat_deg):
    lon, lat = np.radians(lon_deg), np.radians(lat_deg)
    return np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])


def patch_frame():
    n = direction(SPOT_LON, SPOT_LAT)
    east = np.cross([0.0, 1.0, 0.0], n)
    east /= np.linalg.norm(east)
    north = np.cross(n, east)
    return n, east, north


def half_tan(width_deg):
    return np.tan(np.radians(width_deg) / 2)


def patch_dirs(width_deg, size):
    """Body directions of the texel centres of a square gnomonic patch, image row 0 at the north edge."""
    n, east, north = patch_frame()
    t = half_tan(width_deg)
    c = (np.arange(size) + 0.5) / size
    x = (2 * c - 1) * t
    y = (1 - 2 * c) * t
    d = n[None, None, :] + x[None, :, None] * east[None, None, :] + y[:, None, None] * north[None, None, :]
    return d / np.linalg.norm(d, axis=2, keepdims=True)


def to_patch(d):
    """Gnomonic plane coordinates (east, north) of body directions, and the cosine to the spot."""
    n, east, north = patch_frame()
    dn = d @ n
    inv = 1.0 / np.maximum(dn, 0.05)
    return (d @ east) * inv, (d @ north) * inv, dn


def quat_rotate(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    v = np.asarray(v, dtype=np.float64)
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


def quat_matrix(q):
    return np.stack([quat_rotate(q, e) for e in np.eye(3)], axis=1)


def load(path='out/work/place/geometry.json'):
    with open(path) as f:
        return json.load(f)


class Camera:
    def __init__(self, pose, width=1920, height=1080):
        self.p = np.array(pose['position'], dtype=np.float64)
        self.R = quat_matrix(pose['quaternion'])
        self.t = np.tan(np.radians(pose['vfov']) / 2)
        self.w, self.h = width, height

    def rays(self, px, py):
        """Unit ray directions in the body frame for pixel coordinates (pixel centres at +0.5)."""
        x = (2 * px / self.w - 1) * self.t * self.w / self.h
        y = (1 - 2 * py / self.h) * self.t
        d = np.stack([x, y, -np.ones_like(x)], axis=-1)
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        return d @ self.R.T

    def hit(self, d):
        """Where rays meet the unit sphere: points (unit vectors) and a mask."""
        b = d @ self.p
        c = self.p @ self.p - 1
        disc = b * b - c
        ok = (disc > 0) & (b < 0)
        t = c / (-b + np.sqrt(np.maximum(disc, 0)))
        pts = self.p + d * t[..., None]
        return pts, ok

    def project(self, pts):
        """Frame pixel coordinates of points, and whether they are in front."""
        v = (pts - self.p) @ self.R
        w = np.maximum(-v[..., 2], 1e-30)
        x = (v[..., 0] / w / (self.t * self.w / self.h) * 0.5 + 0.5) * self.w
        y = (0.5 - v[..., 1] / w / self.t * 0.5) * self.h
        return x, y, -v[..., 2] > 0

    def seen(self, pts):
        """Cosine of the angle between the surface normal at a sphere point and the direction to the camera."""
        to = self.p - pts
        dist = np.linalg.norm(to, axis=-1)
        return np.sum(to * pts, axis=-1) / dist, dist


def picture_xy(layout, fx, fy):
    """Place picture pixel coordinates of frame pixel coordinates (both with centres at +0.5)."""
    s = layout['scale']
    return (fx + layout['left']) * s + layout['shift'], (fy + layout['top']) * s + layout['shift']


def to_linear(v):
    v = np.asarray(v, dtype=np.float32)
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4).astype(np.float32)


def to_srgb(v):
    v = np.clip(np.asarray(v, dtype=np.float32), 0, None)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055).astype(np.float32)


FILMIC = (2.51, 0.03, 2.43, 0.59, 0.14)


def filmic(x):
    a, b, c, d, e = FILMIC
    x = np.clip(np.asarray(x, dtype=np.float32), 0, None)
    return np.clip(x * (a * x + b) / (x * (c * x + d) + e), 0, 1).astype(np.float32)


def inverse_filmic(y):
    """As INVERSE_FILMIC_GLSL in src/post/chain.ts."""
    a, b, c, d, e = FILMIC
    y = np.clip(np.asarray(y, dtype=np.float32), 0, 0.985)
    k = d * y - b
    return ((-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))).astype(np.float32)


def scene_of(texel):
    """Scene value a texture value (file value 0..1, sRGB) stands for on the globe before light: inverseFilmic(linear)."""
    return inverse_filmic(to_linear(texel))


def texel_of(scene):
    return to_srgb(filmic(scene))


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def mips(img, least=64):
    out = [img]
    while out[-1].shape[0] > least:
        out.append(cv2_area(out[-1]))
    return out


def cv2_area(img):
    import cv2
    return cv2.resize(img, (img.shape[1] // 2, img.shape[0] // 2), interpolation=cv2.INTER_AREA)


def read_mip(pyr, u, v, texels_per_px):
    """Trilinear read of a mip pyramid at uv in 0..1, texels_per_px of the base level per output pixel."""
    import cv2
    lod = float(np.clip(np.log2(max(texels_per_px, 1e-6)), 0, len(pyr) - 1))
    lo = int(np.floor(lod))
    hi = min(lo + 1, len(pyr) - 1)
    f = lod - lo
    res = None
    for lv, w in ((lo, 1 - f), (hi, f)):
        if w <= 0:
            continue
        img = pyr[lv]
        mx = (u * img.shape[1] - 0.5).astype(np.float32)
        my = (v * img.shape[0] - 0.5).astype(np.float32)
        s = cv2.remap(img, mx, my, cv2.INTER_CUBIC if texels_per_px < 1 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        res = s * w if res is None else res + s * w
    return res


def ground(wrap, levels, width_deg, size, feather=0.12, fade=(1.02, 1.5), centre=(0.0, 0.0), flat=False):
    """The globe's ground (file values) on a square gnomonic view about the spot, seen straight down: the wrap map
    with the patch levels over it as the planet shader blends them. wrap: mip pyramid of the equirect map;
    levels: [(mip pyramid, width_deg)] from the widest. centre: plane offset (east, north) in tangent units.
    flat: every level at full weight inside its feather (no density fade), for building a level from those above.
    Returns the picture and the name of the deepest level used with its texels per pixel."""
    n, east, north = patch_frame()
    t = half_tan(width_deg)
    c = (np.arange(size) + 0.5) / size
    x = centre[0] + (2 * c - 1) * t
    y = centre[1] + (1 - 2 * c) * t
    d = n[None, None, :] + x[None, :, None] * east[None, None, :] + y[:, None, None] * north[None, None, :]
    d /= np.linalg.norm(d, axis=2, keepdims=True)
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    del d
    px = 2 * t / size
    wrap_tpp = px * wrap[0].shape[1] / (2 * np.pi)
    col = read_mip(wrap, lon / (2 * np.pi) + 0.5, 0.5 - lat / np.pi, wrap_tpp)
    parent = wrap_tpp
    deepest = ('wrap', wrap_tpp)
    for pyr, pw in levels:
        scale = 1 / (2 * half_tan(pw))
        u = np.broadcast_to(x[None, :] * scale + 0.5, (size, size))
        v = np.broadcast_to(0.5 - y[:, None] * scale, (size, size))
        edge = np.minimum(np.minimum(u, 1 - u), np.minimum(v, 1 - v))
        w = smoothstep(0, feather, edge) * (1.0 if flat else 1 - smoothstep(fade[0], fade[1], parent))
        tpp = px * scale * pyr[0].shape[0]
        if np.max(w) > 0:
            s = read_mip(pyr, np.clip(u, 0, 1), np.clip(v, 0, 1), tpp)
            col = col * (1 - w[..., None]) + s * w[..., None]
            deepest = ('%g' % pw, tpp)
        parent = tpp
    return np.clip(col, 0, 1), deepest


def picture_edge(cam, layout, width_deg, size, share, rows=512):
    """For every texel of a plate: 0 at the left, right and bottom border of the twin's picture, 1 from share of
    the picture's width inside it; 0 where the twin does not see the texel."""
    n, east, north = patch_frame()
    t = half_tan(width_deg)
    c = (np.arange(size) + 0.5) / size
    x = (2 * c - 1) * t
    y = (1 - 2 * c) * t
    out = np.zeros((size, size), np.float32)
    for r0 in range(0, size, rows):
        d = n[None, None, :] + x[None, :, None] * east[None, None, :] + y[r0:r0 + rows, None, None] * north[None, None, :]
        d /= np.linalg.norm(d, axis=2, keepdims=True)
        fx, fy, front = cam.project(d)
        cosv, _ = cam.seen(d)
        px, py = picture_xy(layout, fx, fy)
        near = np.minimum(np.minimum(px, layout['width'] - px), layout['height'] - py) / layout['width']
        out[r0:r0 + rows] = np.where(front & (cosv > 0), smoothstep(0, share, near), 0)
    return out
