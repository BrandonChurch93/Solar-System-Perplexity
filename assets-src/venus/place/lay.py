"""Lay the ground of the close image back onto the sphere as top down gnomonic plates.

The camera is the twin of src/stops/venus/place.json (body fixed frame). Every plate pixel is a point
on the unit sphere; it is projected into that camera and takes the pixel of the close image it lands on.
A plate is a tangent plane picture about the plate centre: x east, y north, north at the top row,
the same convention as the patch pyramid (assets-src/venus/patches/patch.py).

python3 assets-src/venus/place/lay.py [TAG ...]   writes out/work/venus/place/laid-<tag>.png (the close image on the ground),
cover-<tag>.png (where the source canvas has picture), trust-<tag>.png (where that picture is kept in place) and
fine-<tag>.png (where it has pixels enough to stay as it is; elsewhere the tiles of build.py give it its detail), see trust in plates.json.
The full plates are made from these by assets-src/venus/place/build.py.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PLACE = json.loads((ROOT / 'src/stops/venus/place.json').read_text())
SPEC = json.loads((ROOT / 'src/stops/venus/plates.json').read_text())
WORK = ROOT / 'out/work/venus/place'


def unit(v):
    v = np.asarray(v, dtype=np.float64)
    return v / np.linalg.norm(v)


def frame(centre):
    n = unit(centre)
    e = unit(np.cross([0.0, 1.0, 0.0], n))
    return n, e, np.cross(n, e)


def centre_dir():
    under = np.array(PLACE['place']['under']['direction'])
    head = np.array(PLACE['place']['heading'])
    a = np.radians(SPEC['aheadDeg'])
    return unit(under * np.cos(a) + head * np.sin(a))


def grid(n, e, u, width_deg, size):
    t = np.tan(np.radians(width_deg) / 2)
    a = ((np.arange(size) + 0.5) / size * 2 - 1) * t
    x, y = np.meshgrid(a, -a)
    d = n[None, None, :] + x[..., None] * e[None, None, :] + y[..., None] * u[None, None, :]
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


LUMA = np.array([0.0722, 0.7152, 0.2126], np.float32)  # blue, green, red


def to_light(v):
    """Display value (0 to 1, sRGB curve) to light."""
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4).astype(np.float32)


def to_value(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055).astype(np.float32)


def under(parent, share):
    """The light of the plate that gives the colour, at the ground points of the texels of a plate that covers the central
    `share` of its width (both square, the same size), read as the film reads it (bilinear)."""
    size = parent.shape[0]
    at = ((((np.arange(size) + 0.5) / size - 0.5) * share + 0.5) * size - 0.5).astype(np.float32)
    k = to_light(parent.astype(np.float32) / 255)
    return cv2.remap(k, np.repeat(at[None, :], size, 0), np.repeat(at[:, None], size, 1), cv2.INTER_LINEAR) + 1e-4


def light_only(img, parent, share, most):
    """A plate (8 bit, blue green red) as one channel (plates.json, lightNote): its light over the light of the plate that gives
    its colour at the same ground point, not a display value, `most` at 255. So the film gets the plate back as the colour plate
    times this channel, and both are filtered in light."""
    y = to_light(img.astype(np.float32) / 255) @ LUMA
    return np.clip(y / (under(parent, share) @ LUMA) / most * 255 + 0.5, 0, 255).astype(np.uint8)


def put_together(light, parent, share, most):
    """What the film shows of a level that holds its light alone: the colour plate times the channel (light, 0 to 1)."""
    return under(parent, share) * (light.astype(np.float32) / 255 * most)[..., None]


def write_plate(path, img, colour=None):
    """A plate file of the film: with its colour (JPEG quality 92, 4:4:4) or, with colour = (the plate that gives its colour as
    the film reads it, the share of that plate's width it covers, most), its light alone (one channel, quality 98)."""
    if colour:
        cv2.imwrite(str(path), light_only(img, *colour), [cv2.IMWRITE_JPEG_QUALITY, 98])
    else:
        cv2.imwrite(str(path), img, [cv2.IMWRITE_JPEG_QUALITY, 92, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])


def colour_share(levels, tag):
    """The share of the width of its colour plate that the plate of this level covers (both are gnomonic about one centre)."""
    by = {l['tag']: l for l in levels}
    return float(np.tan(np.radians(by[tag]['widthDeg']) / 2) / np.tan(np.radians(by[by[tag]['colour']]['widthDeg']) / 2))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def project(d):
    cam = PLACE['twin']['body']
    pos = np.array(cam['position'])
    rel = d - pos
    cx = rel @ np.array(cam['x'])
    cy = rel @ np.array(cam['y'])
    cz = rel @ np.array(cam['z'])
    th = np.tan(np.radians(PLACE['twin']['vfovDeg']) / 2)
    aspect = 16 / 9
    depth = np.maximum(-cz, 1e-9)
    fx = 0.5 + cx / depth / (2 * th * aspect)
    fy = 0.5 - cy / depth / (2 * th)
    seen = (d @ pos) - 1.0
    return fx, fy, cz < 0, seen


def lay(img, width_deg, size):
    """The source is a canvas that holds the approved frame at SPEC['canvas']['at'] with size SPEC['canvas']['frame'];
    below SPEC['canvas']['fullFromY'] the canvas has picture over its whole width (the margins of the relief)."""
    h, w = img.shape[:2]
    c = SPEC['canvas']
    ax, ay = c['at']
    aw, ah = c['frame']
    n, e, u = frame(centre_dir())
    d = grid(n, e, u, width_deg, size)
    fx, fy, front, seen = project(d)
    px = ax + fx * aw
    py = ay + fy * ah
    out = cv2.remap(img, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    t = SPEC['trust']
    feather = t['edge'] * ah
    inside = np.minimum(np.minimum(px - ax, ax + aw - px), np.minimum(py - ay, ay + ah - py))
    wide = np.minimum(np.minimum(px, w - px), np.minimum(py - c['fullFromY'], h - py))
    edge = np.maximum(inside, wide)
    elevation = seen / np.maximum(np.linalg.norm(d - np.array(PLACE['twin']['body']['position']), axis=-1), 1e-9)
    cover = smooth(0.0, feather, edge) * smooth(0.0, 0.02, elevation) * (front & (seen > 0))
    trust = smooth(0.0, feather, edge) * smooth(t['sinElevation'][0], t['sinElevation'][1], elevation) * (front & (seen > 0))
    # The border of the part used as it is is drawn in and softened on the plate, so no line of the frame is seen on the ground.
    trust = smooth(0.5, 0.95, cv2.GaussianBlur(trust.astype(np.float32), (0, 0), t['soft'] * size))
    # How fine the laid back picture is: source pixels for one plate pixel along the direction it is stretched most
    # (the smaller singular value of the map from plate to source).
    ax_, bx_ = np.gradient(px, axis=1), np.gradient(px, axis=0)
    ay_, by_ = np.gradient(py, axis=1), np.gradient(py, axis=0)
    q = ax_ * ax_ + bx_ * bx_ + ay_ * ay_ + by_ * by_
    det = np.abs(ax_ * by_ - bx_ * ay_)
    least = np.sqrt(np.maximum(q - np.sqrt(np.maximum(q * q - 4 * det * det, 0)), 0) / 2)
    f = t['fine']
    fine = smooth(f[0], f[1], least)
    fine = cv2.GaussianBlur(fine.astype(np.float32), (0, 0), t['soft'] * size)
    return out, cover.astype(np.float32), trust.astype(np.float32), fine.astype(np.float32)


if __name__ == '__main__':
    src = ROOT / SPEC['source']
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    WORK.mkdir(parents=True, exist_ok=True)
    only = sys.argv[1:] or [l['tag'] for l in SPEC['levels']]
    for level in SPEC['levels']:
        if level['tag'] not in only:
            continue
        out, cover, trust, fine = lay(img, level['widthDeg'], SPEC['size'])
        cv2.imwrite(str(WORK / f"fine-{level['tag']}.png"), np.clip(fine * 255 + 0.5, 0, 255).astype(np.uint8))
        cv2.imwrite(str(WORK / f"laid-{level['tag']}.png"), out)
        cv2.imwrite(str(WORK / f"cover-{level['tag']}.png"), np.clip(cover * 255 + 0.5, 0, 255).astype(np.uint8))
        cv2.imwrite(str(WORK / f"trust-{level['tag']}.png"), np.clip(trust * 255 + 0.5, 0, 255).astype(np.uint8))
        print(level['tag'], level['widthDeg'], 'share with picture', round(float((cover > 0.5).mean()), 4), 'share kept in place', round(float((trust > 0.5).mean()), 4), 'share fine enough to stay as it is', round(float((trust * fine > 0.5).mean()), 4))
