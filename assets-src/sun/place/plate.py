"""Compose one top down plate of the place from the laid back close view.

usage: python3 assets-src/sun/place/plate.py WIDTH_DEG SIZE NAME
Reads out/work/sun/pl/layW.png and its stretch (made by layback.py), keeps the laid back
picture where the close view saw the ground steeply enough, and lays the close side's
granulation field (public/assets/sun/full/field.jpg, at the scale the close side draws it)
everywhere else. Writes public/assets/sun/full/NAME.jpg and the web copy at half size.
Values in src/stops/sun/place.json under "plates".
"""
import json
import sys
import numpy as np
import cv2

place = json.load(open('src/stops/sun/place.json'))
t = json.load(open('src/stops/sun/terrain.json'))
field_size = json.load(open('src/stops/sun/field.json'))['size']
cfg = place['plates']
R = place['stage']['radius']
centre = np.array(place['stage']['centre'], dtype=np.float64)
spot = np.array(place['stage']['spot'], dtype=np.float64)
up = spot - centre
up /= np.linalg.norm(up)
north = np.array([0.0, 0.0, -1.0])
north -= up * (north @ up)
north /= np.linalg.norm(north)
east = np.cross(north, up)
down = centre / np.linalg.norm(centre)
fwd = np.array([0.0, 0.0, -1.0]) + down * down[2]
fwd /= np.linalg.norm(fwd)
right = np.cross(fwd, -down)
right /= np.linalg.norm(right)


def smooth(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1)
    return k * k * (3 - 2 * k)


def main():
    width_deg = float(sys.argv[1])
    size = int(sys.argv[2])
    name = sys.argv[3]
    prefix = 'out/work/sun/pl/lay%g' % width_deg
    lay = cv2.imread(prefix + '.png').astype(np.float32)
    stretch = np.load(prefix + '-stretch.npy')
    if lay.shape[0] != size:
        raise SystemExit('lay back first at this size')
    half = np.tan(np.radians(width_deg) / 2)
    q = (np.arange(size) + 0.5) / size - 0.5
    gx, gy = np.meshgrid(q * 2 * half, -q * 2 * half)
    d = up + gx[..., None] * east + gy[..., None] * north
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    ang = np.arccos(np.clip(-(d @ down), -1, 1))
    lat = d + down * (d @ down)[..., None]
    ln = np.maximum(np.linalg.norm(lat, axis=-1), 1e-9)
    ax = (lat @ right) / ln * ang * R
    ay = (lat @ fwd) / ln * ang * R
    field = cv2.imread('public/assets/sun/full/field.jpg').astype(np.float32)
    fw = field.shape[1]
    fx = ((ax / field_size + 0.5) % 1.0) * fw - 0.5
    fy = ((0.5 - ay / field_size) % 1.0) * fw - 0.5
    scale = (field_size / fw) / (R * np.radians(width_deg) / size)
    k = max(int(np.floor(np.log2(max(1 / scale, 1)))), 0)
    src = field
    for _ in range(k):
        src = cv2.pyrDown(src)
    fill = cv2.remap(src, ((fx + 0.5) / 2 ** k - 0.5).astype(np.float32), ((fy + 0.5) / 2 ** k - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)
    keep = 1 - smooth(np.log2(cfg['keepStretch'][0]), np.log2(cfg['keepStretch'][1]), np.log2(np.maximum(stretch, 1e-3)))
    keep[~np.isfinite(stretch)] = 0
    soft = max(cfg['featherDeg'] / width_deg * size, 1.0)
    keep = cv2.GaussianBlur(cv2.erode(keep.astype(np.float32), np.ones((int(soft) | 1, int(soft) | 1), np.uint8)), (0, 0), soft / 2)
    seen = (keep > 0.5).astype(np.float32)
    level = (lay[seen > 0.5].reshape(-1, 3).mean(0)) / np.maximum(fill.reshape(-1, 3).mean(0), 1)
    out = fill * level * (1 - keep[..., None]) + lay * keep[..., None]
    out = np.clip(out, 0, 255).astype(np.uint8)
    cv2.imwrite('public/assets/sun/full/' + name + '.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    cv2.imwrite('public/assets/sun/web/' + name + '.jpg', cv2.resize(out, (size // 2, size // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    cv2.imwrite(prefix + '-keep.png', (keep * 255).astype(np.uint8))
    print(json.dumps({'name': name, 'keptShare': round(float(keep.mean()), 4), 'fieldEnlarged': round(float(scale), 3), 'fieldLevel': [round(float(v), 3) for v in level[::-1]]}))


main()
