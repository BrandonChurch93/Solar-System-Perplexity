"""Lay the ground of the close image back onto the sphere as top down gnomonic plates.

The camera is the twin of src/stops/venus/place.json (body fixed frame). Every plate pixel is a point
on the unit sphere; it is projected into that camera and takes the pixel of the close image it lands on.
A plate is a tangent plane picture about the plate centre: x east, y north, north at the top row,
the same convention as the patch pyramid (assets-src/venus/patches/patch.py).

python3 assets-src/venus/place/lay.py [export]   writes out/work/venus/place/laid-<tag>.png, mask-<tag>.png, stretch-<tag>.png;
with export also public/assets/venus/{full,web}/place-<tag>.jpg and place-mask.png (red, green, blue = the cover of a, b, c)
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


def lay(img, tag, width_deg, size):
    h, w = img.shape[:2]
    n, e, u = frame(centre_dir())
    d = grid(n, e, u, width_deg, size)
    fx, fy, front, seen = project(d)
    mx = (fx * w - 0.5).astype(np.float32)
    my = (fy * h - 0.5).astype(np.float32)
    out = cv2.remap(img, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    m = SPEC['mask']
    edge = np.minimum(np.minimum(fx, 1 - fx), np.minimum(fy, 1 - fy))
    grazing = seen / np.maximum(np.linalg.norm(d - np.array(PLACE['twin']['body']['position']), axis=-1), 1e-9)
    mask = smooth(0.0, m['edge'], edge) * smooth(m['graze'][0], m['graze'][1], grazing) * (front & (seen > 0))
    gx = np.gradient(fx * w, axis=1)
    gy = np.gradient(fy * h, axis=0)
    hx = np.gradient(fx * w, axis=0)
    hy = np.gradient(fy * h, axis=1)
    stretch = 1 / np.maximum(np.sqrt(np.abs(gx * gy - hx * hy)), 1e-6)
    return out, mask.astype(np.float32), stretch.astype(np.float32)


if __name__ == '__main__':
    src = ROOT / SPEC['source']
    if not src.exists():
        src = ROOT / SPEC['fallback']
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    WORK.mkdir(parents=True, exist_ok=True)
    only = [a for a in sys.argv[1:] if a != 'export'] or [l['tag'] for l in SPEC['levels']]
    export = 'export' in sys.argv[1:]
    masks = []
    for level in SPEC['levels']:
        if level['tag'] not in only:
            continue
        out, mask, stretch = lay(img, level['tag'], level['widthDeg'], SPEC['size'])
        cv2.imwrite(str(WORK / f"laid-{level['tag']}.png"), out)
        cv2.imwrite(str(WORK / f"mask-{level['tag']}.png"), np.clip(mask * 255 + 0.5, 0, 255).astype(np.uint8))
        cv2.imwrite(str(WORK / f"stretch-{level['tag']}.png"), np.clip(np.log2(np.maximum(stretch, 1)) * 32, 0, 255).astype(np.uint8))
        seen = mask > 0.5
        if export:
            public = ROOT / 'public/assets/venus'
            q = [cv2.IMWRITE_JPEG_QUALITY, 92, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
            cv2.imwrite(str(public / 'full' / level['file']), out, q)
            cv2.imwrite(str(public / 'web' / level['file']), cv2.resize(out, (SPEC['size'] // 2, SPEC['size'] // 2), interpolation=cv2.INTER_AREA), q)
            masks.append(cv2.resize(mask, (SPEC['maskSize'], SPEC['maskSize']), interpolation=cv2.INTER_AREA))
        print(level['tag'], level['widthDeg'], 'covered share', float(seen.mean()), 'median stretch in cover', float(np.median(stretch[seen])) if seen.any() else None, 'least', float(stretch[seen].min()) if seen.any() else None)
    if export and len(masks) == 3:
        m = np.clip(np.stack(masks[::-1], axis=-1) * 255 + 0.5, 0, 255).astype(np.uint8)
        for kind in ('full', 'web'):
            cv2.imwrite(str(ROOT / 'public/assets/venus' / kind / SPEC['maskFile']), m)
