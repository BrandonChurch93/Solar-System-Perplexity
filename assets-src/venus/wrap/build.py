import os
import sys
sys.path.insert(0, 'assets-src/venus/wrap')
import cv2
import numpy as np
sys.path.insert(0, 'assets-src/venus')
from geo import *

W, H = 8192, 4096
BOLT = dict(lon=15.5, lat=16.5, widthDeg=30.0, size=1024)
far_path = sys.argv[1] if len(sys.argv) > 1 else None


def blur_wrap(a, sx, sy):
    pad = int(sx * 3) + 1
    b = np.concatenate([a[:, -pad:], a, a[:, :pad]], 1)
    b = cv2.GaussianBlur(b, (0, 0), sigmaX=sx, sigmaY=sy)
    return b[:, pad:-pad]


TOP = 24.0


def store(alb):
    peak = alb.max(-1, keepdims=True)
    alb = alb * np.minimum(1, TOP / np.maximum(peak, 1e-6))
    return (to_srgb(np.sqrt(alb / TOP)) * 255 + 0.5).astype(np.uint8)


if far_path:
    from albedo import curve_at
    far = cv2.imread(far_path, cv2.IMREAD_COLOR)
    if far.shape[1] != W:
        far = cv2.resize(far, (W, H), interpolation=cv2.INTER_CUBIC)
    src = cv2.imread(WORK + '/wrap/hero-eq.png', cv2.IMREAD_COLOR)
    old = cv2.imread(WORK + '/wrap/albedo-eq.png', cv2.IMREAD_COLOR)
    wt = cv2.imread(WORK + '/wrap/hero-eq-w.png', cv2.IMREAD_GRAYSCALE)
    wrap = np.zeros((H, W, 3), np.uint8)
    for y0 in range(0, H, 256):
        ys, xs = np.mgrid[y0:y0 + 256, 0:W]
        ndl = world(lonlat_dir((xs + 0.5) / W * 360 - 180, 90 - (ys + 0.5) / H * 180)) @ SUN
        true = scene(src[y0:y0 + 256, :, ::-1].astype(np.float32) / 255) / curve_at(ndl)
        was = scene(old[y0:y0 + 256, :, ::-1].astype(np.float32) / 255)
        t = smoothstep(3.5, 4.5, true.max(-1))[..., None] * (wt[y0:y0 + 256, :, None] / 255.0)
        ratio = np.clip(true / np.maximum(was, 0.05), 1, 40)
        alb = scene(far[y0:y0 + 256, :, ::-1].astype(np.float32) / 255) * (1 + (ratio - 1) * t)
        wrap[y0:y0 + 256] = store(alb)[..., ::-1]
    del far, src, old, wt
else:
    wrap = np.full((H, W, 3), 128, np.uint8)
for key, k in (('full', 1), ('web', 2)):
    out = 'public/assets/venus/' + key
    os.makedirs(out, exist_ok=True)
    img = wrap if k == 1 else cv2.resize(wrap, (W // k, H // k), interpolation=cv2.INTER_AREA)
    cv2.imwrite(out + '/wrap-color.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 96, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
half = cv2.resize(wrap, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
lum = half @ np.array([0.0722, 0.7152, 0.2126], dtype=np.float32)
bp = blur_wrap(lum, 5, 5) - blur_wrap(lum, 44, 44)
bp = blur_wrap(bp, 14, 2.5)
flow = np.clip(0.5 + bp / (4.5 * bp.std()), 0, 1)
print('flow std', float(flow.std()), 'mean', float(flow.mean()))
f8 = (flow * 255 + 0.5).astype(np.uint8)
cv2.imwrite('public/assets/venus/full/wrap-flow.jpg', f8, [cv2.IMWRITE_JPEG_QUALITY, 92])
cv2.imwrite('public/assets/venus/web/wrap-flow.jpg', cv2.resize(f8, (W // 4, H // 4), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 92])

emis = np.load(WORK + '/wrap/hero-emis.npy').astype(np.float32)
eh, ew = emis.shape[:2]
n = BOLT['size']
c = lonlat_dir(BOLT['lon'], BOLT['lat'])
east = np.cross([0.0, 1.0, 0.0], c)
east /= np.linalg.norm(east)
north = np.cross(c, east)
t = 2 * np.tan(np.radians(BOLT['widthDeg']) / 2)
ys, xs = np.mgrid[0:n, 0:n]
qx = ((xs + 0.5) / n - 0.5) * t
qy = (0.5 - (ys + 0.5) / n) * t
d = c[None, None] + qx[..., None] * east + qy[..., None] * north
d /= np.linalg.norm(d, axis=-1, keepdims=True)
px, py = project(world(d), ew, eh)
bolt = cv2.remap(emis, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
edge = np.minimum(np.minimum(xs, n - 1 - xs), np.minimum(ys, n - 1 - ys)) / 40.0
bolt *= np.clip(edge, 0, 1)[..., None]
b8 = (encode(bolt) * 255 + 0.5).astype(np.uint8)[..., ::-1]
cv2.imwrite('public/assets/venus/full/bolt.jpg', b8, [cv2.IMWRITE_JPEG_QUALITY, 92])
cv2.imwrite('public/assets/venus/web/bolt.jpg', cv2.resize(b8, (n // 2, n // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 92])
json.dump({'encoding': 'albedo = top * v * v, v = the linear value of the sRGB texel', 'top': TOP, 'projection': 'equirectangular, u = lon/360 + 0.5, north at top, direction of (lon, lat) = (cos lat sin lon, sin lat, cos lat cos lon)', 'color': {'full': [W, H], 'web': [W // 2, H // 2]}, 'flow': {'full': [W // 2, H // 2], 'web': [W // 4, H // 4]}, 'bolt': {'lon': BOLT['lon'], 'lat': BOLT['lat'], 'widthDeg': BOLT['widthDeg'], 'full': n, 'web': n // 2}}, open('src/stops/venus/wrap.json', 'w'), indent=1)
os.system('ls -la public/assets/venus/full public/assets/venus/web')
