"""Lay the ground of the approved close view back onto the sphere.

Reads the plate of the close side (the approved image on its wide canvas, loops removed)
and the camera of src/stops/sun/place.json, and writes a top down gnomonic plate centred
on the sunspot: east to the right, north up, as the globe's patch levels are laid.
Also writes the stretch of every texel (plate texels per source texel along the worst
direction), which says where the laid back picture has to be repainted.

usage: python3 assets-src/sun/place/layback.py WIDTH_DEG SIZE OUT_PREFIX
"""
import json
import sys
import numpy as np
import cv2

t = json.load(open('src/stops/sun/terrain.json'))
place = json.load(open('src/stops/sun/place.json'))
TY = np.tan(np.radians(t['vfovDeg']) / 2)
TX = TY * 16 / 9
C = t['canvas']
R = place['stage']['radius']
centre = np.array(place['stage']['centre'], dtype=np.float64)
spot = np.array(place['stage']['spot'], dtype=np.float64)
up = spot - centre
up /= np.linalg.norm(up)
north = np.array([0.0, 0.0, -1.0])
north -= up * (north @ up)
north /= np.linalg.norm(north)
east = np.cross(north, up)


def source(gx, gy):
    """plate pixel coordinates of the gnomonic point (gx east, gy north), and whether the camera sees it"""
    d = up[None, None, :] + gx[..., None] * east + gy[..., None] * north
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    p = centre + R * d
    dist = np.linalg.norm(p, axis=-1)
    mu = -(p * d).sum(-1) / dist
    z = np.maximum(-p[..., 2], 1e-6)
    ax = p[..., 0] / z / (2 * TX) + 0.5
    ay = 0.5 - p[..., 1] / z / (2 * TY)
    kx = (ax - C['left']) / C['span']
    ky = (ay - C['top']) / C['span']
    px = kx * C['width'] - 0.5
    py = ky * C['height'] - C['plateTop'] - 0.5
    return px, py, mu, (p[..., 2] < 0)


def main():
    width_deg = float(sys.argv[1])
    size = int(sys.argv[2])
    prefix = sys.argv[3]
    plate = cv2.imread('public/assets/sun/full/plate.jpg')
    ph, pw = plate.shape[:2]
    half = np.tan(np.radians(width_deg) / 2)
    q = (np.arange(size) + 0.5) / size - 0.5
    gx, gy = np.meshgrid(q * 2 * half, -q * 2 * half)
    px, py, mu, front = source(gx, gy)
    e = 2 * half / size
    pxe, pye, _, _ = source(gx + e, gy)
    pxn, pyn, _, _ = source(gx, gy + e)
    a, b, c, d = pxe - px, pxn - px, pye - py, pyn - py
    s1 = a * a + b * b + c * c + d * d
    s2 = np.sqrt(np.maximum((a * a + b * b - c * c - d * d) ** 2 + 4 * (a * c + b * d) ** 2, 0))
    small = np.sqrt(np.maximum((s1 - s2) / 2, 1e-12))
    stretch = 1 / small
    inside = front & (mu > 0.02) & (px >= 2) & (px <= pw - 3) & (py >= 2) & (py <= ph - 3)
    lod = np.clip(np.log2(np.maximum(np.sqrt(np.maximum((s1 + s2) / 2, 1e-12)), 1)), 0, 6)
    pyr = [plate.astype(np.float32)]
    for _ in range(6):
        pyr.append(cv2.pyrDown(pyr[-1]))
    out = np.zeros((size, size, 3), np.float32)
    for k in range(7):
        w = np.clip(1 - np.abs(lod - k), 0, 1)
        if not (w > 0).any():
            continue
        s = 2.0 ** k
        tap = cv2.remap(pyr[k], ((px + 0.5) / s - 0.5).astype(np.float32), ((py + 0.5) / s - 0.5).astype(np.float32), cv2.INTER_CUBIC if k == 0 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        out += tap * w[..., None]
    out[~inside] = 0
    cv2.imwrite(prefix + '.png', np.clip(out, 0, 255).astype(np.uint8))
    cv2.imwrite(prefix + '-seen.png', (inside * 255).astype(np.uint8))
    np.save(prefix + '-stretch.npy', np.where(inside, stretch, np.inf).astype(np.float32))
    show = np.clip(np.log2(np.maximum(stretch, 1)) / 4, 0, 1)
    heat = cv2.applyColorMap((show * 255).astype(np.uint8), cv2.COLORMAP_TURBO)
    heat[~inside] = 0
    cv2.imwrite(prefix + '-stretch.jpg', heat, [cv2.IMWRITE_JPEG_QUALITY, 88])
    st = stretch[inside]
    deg = width_deg / size
    report = {'widthDeg': width_deg, 'size': size, 'degPerTexel': round(deg, 5), 'seenShare': round(float(inside.mean()), 4),
              'stretchShare': {'under1': round(float((st <= 1).mean()), 4), 'under2': round(float((st <= 2).mean()), 4), 'under4': round(float((st <= 4).mean()), 4), 'under8': round(float((st <= 8).mean()), 4)},
              'stretchAtSpot': round(float(stretch[size // 2, size // 2]), 3)}
    json.dump(report, open(prefix + '.json', 'w'), indent=1)
    print(json.dumps(report))


main()
