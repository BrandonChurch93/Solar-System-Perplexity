"""First, rough plates (M1): the laid back place picture over the ground the globe has today, no repaint.

For every plate of plates.json: the ground of main (wrap and the old levels, seen straight down) is the base; the
laid back picture of the dive (layback.py) goes over it where the twin sees the ground, with a feathered edge. The
picture's values are turned into the globe's albedo by a correction map in scene values (--ratio, a laid back
ratio of close side over globe side at T, see calibrate.py); without it the picture is used as it is.
  python3 assets-src/mars/place/rough.py --lay out/work/place/lay --out out/work/place/rough [--ratio out/work/place/cal/ratio]
"""
import argparse
import json
import os
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--spec', default='assets-src/mars/place/plates.json')
ap.add_argument('--lay', required=True, help='folder with dive-<width>.png and dive-<width>-stretch.npy')
ap.add_argument('--ratio', default='', help='prefix of laid back ratio maps <prefix>-<width>.npy (scene value factors)')
ap.add_argument('--light', default='', help='prefix of laid back light maps <prefix>-<width>.npy from light.py: plate scene = (picture scene - h) / a')
ap.add_argument('--range', default='0.003,4.9', help='plate scene values are kept inside this range')
ap.add_argument('--assets', default='public/assets/mars/full')
ap.add_argument('--out', required=True)
ap.add_argument('--only', default='')
a = ap.parse_args()
spec = json.load(open(a.spec))
size = spec['size']
os.makedirs(a.out, exist_ok=True)


def read(path):
    return cv2.imread(path, cv2.IMREAD_COLOR).astype(np.float32) / 255


wrap = geom.mips(read(a.assets + '/wrap-color.jpg'))
old = [(geom.mips(read(a.assets + '/' + l['file'])), l['widthDeg']) for l in spec['kept'] + spec['old']]
r = spec['rough']
for plate in spec['plates']:
    w = plate['widthDeg']
    if a.only and ('%g' % w) not in a.only.split(','):
        continue
    base, _ = geom.ground(wrap, old, w, size, flat=True)
    lay = cv2.imread('%s/dive-%g.png' % (a.lay, w), cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535
    stretch = np.load('%s/dive-%g-stretch.npy' % (a.lay, w))
    rgb, alpha = lay[..., :3], lay[..., 3]
    if a.ratio:
        ratio = cv2.resize(np.load('%s-%g.npy' % (a.ratio, w)), (size, size), interpolation=cv2.INTER_LINEAR)
        rgb = geom.texel_of(geom.scene_of(rgb) * ratio)
    if a.light:
        light = cv2.resize(np.load('%s-%g.npy' % (a.light, w)), (size, size), interpolation=cv2.INTER_LINEAR)
        lo, hi = [float(x) for x in a.range.split(',')]
        need = (geom.scene_of(rgb) - light[..., 3:]) / light[..., :3]
        on = alpha > 0.98
        print('  %g deg: share of the seen plate under the range %s, over %s (b g r)' % (w, np.round((need < lo)[on].mean(axis=0), 3), np.round((need > hi)[on].mean(axis=0), 3)))
        rgb = geom.texel_of(np.clip(need, lo, hi))
    seen = ((alpha > 0.98) & (stretch < r['maxStretch'])).astype(np.uint8)
    k = 2 * r['edgeErodePx'] + 1
    seen = cv2.erode(seen, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    dist = cv2.distanceTransform(seen, cv2.DIST_L2, 5)
    m = geom.smoothstep(0, r['edgeFeatherPx'], dist)[..., None]
    out = base * (1 - m) + np.nan_to_num(rgb) * m
    path = '%s/%s' % (a.out, plate['file'])
    cv2.imwrite(path, np.round(np.clip(out, 0, 1) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, spec['jpegQuality'], cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    print('%s: %g deg, picture on %.3f of the plate' % (path, w, float(m.mean())))
