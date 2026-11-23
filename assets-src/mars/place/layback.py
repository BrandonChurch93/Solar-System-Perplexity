"""Lays the place picture of a Mars handover back onto the unit sphere as a top down gnomonic plate about the spot.

The picture is the close side drawn at T (dump.sh, join.py). Every plate texel is a point on the sphere in the body
frame; it is projected into the twin camera of T and the picture is read there, through a mip pyramid where the plate
is coarser than the picture. Written: the plate as RGBA (picture values, alpha = seen from the twin and on the
picture's ground) and a float map of the stretch (plate texels per picture pixel in the worst direction).
  python3 assets-src/mars/place/layback.py --kind dive --width-deg 3 --size 4096 --out out/work/place/lay/dive-3
"""
import argparse
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--kind', default='dive')
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--size', type=int, default=4096)
ap.add_argument('--dump', default='out/work/place/dump')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--out', required=True)
ap.add_argument('--bias', type=float, default=-0.5)
ap.add_argument('--image', default='', help='another picture to lay back instead of the dump (same layout unless --frame-space)')
ap.add_argument('--cover', default='')
ap.add_argument('--frame-space', action='store_true', help='the picture is a film frame (1 px per frame px, no margins)')
ap.add_argument('--frame', type=int, default=-1, help='lay back from the film camera of this frame instead of the twin')
a = ap.parse_args()

g = geom.load(a.geometry)
k = g[a.kind]
layout = k['layout']
W, H = g['format']['width'], g['format']['height']
pose = k['twin']
if a.frame >= 0:
    pose = next(f for f in k['frames'] if f['frame'] == a.frame and f['side'] == 'orbit')
cam = geom.Camera(pose, W, H)
if a.frame_space:
    layout = {'scale': 1, 'left': 0, 'top': 0, 'shift': 0, 'width': W, 'height': H}
image = cv2.imread(a.image or '%s/%s-image.png' % (a.dump, a.kind), cv2.IMREAD_UNCHANGED)
image = image[..., :3].astype(np.float32) / (65535 if image.dtype == np.uint16 else 255)
if a.cover or not a.image:
    cover = cv2.imread(a.cover or '%s/%s-alpha.png' % (a.dump, a.kind), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
else:
    cover = np.ones(image.shape[:2], np.float32)
if image.shape[1] != layout['width'] or image.shape[0] != layout['height']:
    raise SystemExit('the dump is %s, the layout says %d x %d' % (image.shape, layout['width'], layout['height']))
pre = np.dstack([image * cover[..., None], cover])
pyramid = [pre]
while min(pyramid[-1].shape[:2]) > 8:
    pyramid.append(cv2.pyrDown(pyramid[-1]))

size = a.size
out = np.zeros((size, size, 4), np.float32)
stretch = np.full((size, size), np.inf, np.float32)
lod_map = np.zeros((size, size), np.float32)
d = geom.patch_dirs(a.width_deg, size)
fx, fy, front = cam.project(d)
cosv, _ = cam.seen(d)
px, py = geom.picture_xy(layout, fx, fy)
del d
ok = front & (cosv > 0)
dxu = np.gradient(px, axis=1)
dxv = np.gradient(px, axis=0)
dyu = np.gradient(py, axis=1)
dyv = np.gradient(py, axis=0)
s1 = dxu * dxu + dxv * dxv + dyu * dyu + dyv * dyv
det = np.abs(dxu * dyv - dxv * dyu)
root = np.sqrt(np.maximum(s1 * s1 - 4 * det * det, 0))
smax = np.sqrt(np.maximum(0.5 * (s1 + root), 1e-20))
smin = np.sqrt(np.maximum(0.5 * (s1 - root), 1e-20))
stretch = np.where(ok, 1 / smin, np.inf).astype(np.float32)
lod = np.clip(np.log2(np.maximum(smax, 1e-6)) + a.bias, 0, len(pyramid) - 1.001)
lod = np.where(ok, lod, 0)
lo = np.floor(lod).astype(np.int32)
frac = (lod - lo).astype(np.float32)
for level in range(len(pyramid)):
    use = ok & ((lo == level) | (lo == level - 1))
    if not use.any():
        continue
    s = 2.0 ** level
    mx = (px / s - 0.5).astype(np.float32)
    my = (py / s - 0.5).astype(np.float32)
    tex = cv2.remap(pyramid[level], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    w = np.where(lo == level, 1 - frac, 0) + np.where(lo == level - 1, frac, 0)
    out += tex * (w * use)[..., None]
alpha = out[..., 3]
rgb = out[..., :3] / np.maximum(alpha[..., None], 1e-6)
inside = (px >= 0.5) & (px <= layout['width'] - 0.5) & (py >= 0.5) & (py <= layout['height'] - 0.5)
alpha = alpha * ok * inside
rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
cv2.imwrite(a.out + '.png', np.round(rgba * 65535).astype(np.uint16))
np.save(a.out + '-stretch.npy', stretch)
seen = alpha > 0.5
print('%s %g deg %d px: seen %.4f of the plate, stretch under 2 on %.4f, under 4 on %.4f' % (a.kind, a.width_deg, size, seen.mean(), (seen & (stretch < 2)).mean(), (seen & (stretch < 4)).mean()))
