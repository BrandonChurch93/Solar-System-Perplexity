"""The land matte of the place picture: where the picture ends, it ends along forms of the land.

The engine multiplies the weight of the place picture with this matte (StopSet.placeMatte, one channel, upright as
seen, over the whole field of the picture: the frame and its margins). It has to be 1 inside the frame at T, so the
matte works in the margins only. There the picture's own edge is a straight line on the ground. The matte ends the
picture earlier, on a line that follows the light and dark of the land: the depth into the margin (0 at the frame,
1 at the field's edge) plus the picture's local light and dark (luminance against its blur, in units of its local
spread) is cut at a level. Where the picture shows haze or sky (dehaze.py's t under tFrom) there is no form to
follow and the matte is a slow ramp over the margin.
  python3 assets-src/mars/place/matte.py --kind dive --out public/assets/mars/full/place-matte-dive.png --web public/assets/mars/web/place-matte-dive.png
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--kind', default='dive')
ap.add_argument('--dump', default='out/work/place/dump')
ap.add_argument('--t', default='')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--out', required=True)
ap.add_argument('--web', default='')
ap.add_argument('--view', default='')
a = ap.parse_args()
cfg = json.load(open(a.config))['matte']
lay = geom.load(a.geometry)[a.kind]['layout']
s = lay['scale']
w, h = lay['width'] // s, lay['height'] // s
pic = cv2.imread('%s/%s-image.png' % (a.dump, a.kind)).astype(np.float32) / 255
pic = cv2.resize(pic, (w, h), interpolation=cv2.INTER_AREA)
t = cv2.imread(a.t or 'out/work/place/dehaze/%s-t.png' % a.kind, cv2.IMREAD_UNCHANGED).astype(np.float32)
t = cv2.resize(t[..., 0] if t.ndim == 3 else t, (w, h), interpolation=cv2.INTER_AREA) / (65535 if t.max() > 255 else 255)
ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
left, right, top, bottom = lay['left'], lay['right'], lay['top'], lay['bottom']
d = np.maximum.reduce([(left - xs - 0.5) / left, (xs + 0.5 - (w - right)) / right, (top - ys - 0.5) / top, (ys + 0.5 - (h - bottom)) / bottom, np.zeros_like(xs)])
lum = pic @ np.array([0.0722, 0.7152, 0.2126], np.float32)
sig = cfg['formPx']
low = cv2.GaussianBlur(lum, (0, 0), sig)
spread = np.sqrt(np.maximum(cv2.GaussianBlur((lum - low) ** 2, (0, 0), sig * 2), 1e-6))
form = np.clip(cv2.GaussianBlur(lum - low, (0, 0), cfg['smoothPx']) / spread, -1, 1)
f = d + cfg['formShare'] * form * geom.smoothstep(0.0, cfg['rampIn'], d)
land = 1 - geom.smoothstep(cfg['cut'] - cfg['soft'], cfg['cut'] + cfg['soft'], f)
air = 1 - geom.smoothstep(cfg['airFrom'], cfg['airTo'], d)
k = geom.smoothstep(cfg['tFrom'], cfg['tTo'], cv2.GaussianBlur(t, (0, 0), cfg['formPx']))
m = np.where(d <= 0, 1.0, land * k + air * (1 - k))
m = np.clip(m * (1 - geom.smoothstep(cfg['endFrom'], cfg['endTo'], d)), 0, 1)
out = np.round(m * 255).astype(np.uint8)
cv2.imwrite(a.out, out)
if a.web:
    cv2.imwrite(a.web, cv2.resize(out, (w // 2, h // 2), interpolation=cv2.INTER_AREA))
if a.view:
    v = pic * (0.25 + 0.75 * m[..., None])
    cv2.rectangle(v, (left, top), (w - right - 1, h - bottom - 1), (1, 1, 1), 1)
    cv2.imwrite(a.view, np.round(v * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
print('matte %d x %d, mean %.3f, least inside the frame %.3f' % (w, h, m.mean(), m[top:h - bottom, left:w - right].min()))
