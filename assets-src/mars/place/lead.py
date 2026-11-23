"""Builds the lead picture of a plate for the repaint: the old land as the globe shows it near the ground, moved
toward the place picture's colours near the place, with the laid back place picture (haze taken out, dehaze.py)
over it where the twin saw the land clearly.

All pictures are top down gnomonic about the spot, north at the top, in the patch encoding of look values:
what the globe shows near the ground before haze (scene_of(old texel) x light for the old land, the picture's
own scene values for the lay back).
  python3 assets-src/mars/place/lead.py --width-deg 3.25 --out out/work/place/lead/p3
Options: --inner FILE,WIDTH nests a finished plate (look values) into the middle before the lay back goes on.
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--width-deg', type=float, required=True)
ap.add_argument('--size', type=int, default=0)
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--assets', default='public/assets/mars/full')
ap.add_argument('--land', default='', help='lay back of the land (layback.py of dehaze-land), RGBA 16 bit')
ap.add_argument('--t', default='', help='lay back of t (layback.py of dehaze-t)')
ap.add_argument('--inner', default='')
ap.add_argument('--kind', default='dive')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--out', required=True)
a = ap.parse_args()
cfg = json.load(open(a.config))
lead = cfg['lead']
size = a.size or lead['size']
read = lambda p: cv2.imread(p).astype(np.float32) / 255
wrap = geom.mips(read(a.assets + '/wrap-color.jpg'))
old = [(geom.mips(read(a.assets + '/' + l['file'])), l['widthDeg']) for l in cfg['oldLadder']]
base, _ = geom.ground(wrap, old, a.width_deg, size, flat=True)
light = np.array(lead['light'][::-1], np.float32)
O = geom.scene_of(base) * light
d = geom.patch_dirs(a.width_deg, size)
n, _, _ = geom.patch_frame()
r = np.degrees(np.arccos(np.clip(d @ n, -1, 1))).astype(np.float32)
del d
w = (1 - geom.smoothstep(lead['paletteCoreDeg'], lead['paletteEndDeg'], r))[..., None]
hue = np.array(lead['paletteHue'][::-1], np.float32)
lum = lambda v: v @ np.array([0.0722, 0.7152, 0.2126], np.float32)
toned = lum(O)[..., None] * (hue / lum(hue)) * lead['paletteLum']
P = O + (toned - O) * (w * lead['paletteMix'])
cv2.imwrite(a.out + '-old.png', np.round(geom.texel_of(O) * 255).astype(np.uint8))
cv2.imwrite(a.out + '-base.png', np.round(geom.texel_of(P) * 65535).astype(np.uint16))
out = P
if a.inner:
    path, width = a.inner.split(',')
    inner = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    inner = geom.scene_of(inner[..., :3].astype(np.float32) / (65535 if inner.dtype == np.uint16 else 255))
    share = geom.half_tan(float(width)) / geom.half_tan(a.width_deg)
    px = max(2, int(round(size * share)))
    small = cv2.resize(inner, (px, px), interpolation=cv2.INTER_AREA)
    c = (np.arange(px) + 0.5) / px
    e = np.minimum(c, 1 - c)
    f = geom.smoothstep(0, cfg['feather'], np.minimum(e[None, :], e[:, None]))[..., None]
    o = (size - px) // 2
    out = out.copy()
    out[o:o + px, o:o + px] = out[o:o + px, o:o + px] * (1 - f) + small * f
if a.land:
    lay = cv2.imread(a.land, cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535
    t = cv2.imread(a.t, cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535
    if lay.shape[0] != size:
        raise SystemExit('the lay back is %d px, the lead %d' % (lay.shape[0], size))
    L = geom.scene_of(lay[..., :3])
    g = geom.load(a.geometry)
    k = g[a.kind]
    cam = geom.Camera(k['twin'], g['format']['width'], g['format']['height'])
    m = (geom.picture_edge(cam, k['layout'], a.width_deg, size, lead['edgeShare']) * geom.smoothstep(lead['tFrom'], lead['tTo'], t[..., 0]))[..., None]
    np.save(a.out + '-mask.npy', m.astype(np.float32))
    sel = m[..., 0] > 0.9
    if sel.sum() > 100:
        print('%g deg: where the lay back leads, land median (r g b) %s, old land %s, base %s' % (a.width_deg, np.round(np.median(L[sel], axis=0)[::-1], 4), np.round(np.median(O[sel], axis=0)[::-1], 4), np.round(np.median(P[sel], axis=0)[::-1], 4)))
    out = out * (1 - m) + L * m
cv2.imwrite(a.out + '.png', np.round(geom.texel_of(out) * 255).astype(np.uint8))
