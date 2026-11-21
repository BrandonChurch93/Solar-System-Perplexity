import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import geo  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
ROOT = geo.ROOT
FULL = ROOT / "public" / "assets" / "earth" / "full"
OUT = geo.WORK / "patches"
LON, LAT = -77.4757, 18.1499
MOTION = json.loads((ROOT / "src" / "stops" / "earth" / "motion.json").read_text())
SPIN = 1.1
HOLD_MID = 58.5
BAKE_TIME = 67.0


def lonlat_dirs(d):
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    return lon, lat


def sample(img, d, interp=cv2.INTER_LANCZOS4):
    h, w = img.shape[:2]
    pad = 16
    lon, lat = lonlat_dirs(d)
    x = ((lon / (2 * np.pi) + 0.5) * w - 0.5 + pad).astype(np.float32)
    y = np.clip((0.5 - lat / np.pi) * h - 0.5, 0, h - 1).astype(np.float32)
    wide = np.concatenate([img[:, -pad:], img, img[:, :pad]], 1)
    return cv2.remap(wide, x, y, interp, borderMode=cv2.BORDER_REPLICATE)


_MAPS = None


def maps():
    global _MAPS
    if _MAPS is None:
        s = np.asarray(Image.open(FULL / "wrap-surface.jpg").convert("RGB"), dtype=np.float32) / 255
        c = np.asarray(Image.open(FULL / "wrap-cloud.webp").convert("RGBA"), dtype=np.float32) / 255
        s = geo.srgb_to_linear(s).astype(np.float32)
        rgb = geo.srgb_to_linear(c[..., :3]).astype(np.float32)
        a = np.ascontiguousarray(c[..., 3])
        soft = cv2.GaussianBlur(a, (0, 0), 0.5 * 2 ** MOTION["shadow"]["lod"] / 1.6)
        _MAPS = (s, rgb, a, soft)
    return _MAPS


def sun_map(time=BAKE_TIME):
    return geo.spin_y(geo.SUN_BODY, np.radians(SPIN) * (time - HOLD_MID))


def composite(width_deg, size, time=BAKE_TIME):
    s, rgb, a, soft = maps()
    d = geo.gnomonic_dirs(LON, LAT, width_deg, size)
    S = geo.inverse_filmic(np.clip(sample(s, d), 0, 1))
    W = geo.inverse_filmic(np.clip(sample(rgb, d), 0, 1))
    A = np.clip(sample(a, d), 0, 1)
    sun = sun_map(time)
    ndl = d @ sun
    sh = MOTION["shadow"]
    p = d + (sun[None, None] - d * ndl[..., None]) * (sh["height"] / np.maximum(ndl, sh["floor"]))[..., None]
    p /= np.linalg.norm(p, axis=-1, keepdims=True)
    thrown = np.clip(sample(soft, p, cv2.INTER_LINEAR), 0, 1)
    shadow = 1 - sh["strength"] * thrown * geo.smooth(-0.05, 0.1, ndl)
    lin = S * (shadow * (1 - A))[..., None] + W
    return np.clip(geo.linear_to_srgb(geo.filmic(lin)), 0, 1).astype(np.float32)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    width = float(sys.argv[1])
    size = int(sys.argv[2])
    out = Path(sys.argv[3])
    img = composite(width, size)
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(out, quality=96, subsampling=0)
    n, e, u = geo.gnomonic_frame(LON, LAT)
    sun = sun_map()
    print(out, img.shape, "sun east %.3f north %.3f up %.3f" % (sun @ e, sun @ u, sun @ n))
