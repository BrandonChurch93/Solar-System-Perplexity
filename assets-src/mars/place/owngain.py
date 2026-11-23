"""Measures on rendered stills how the first level with its own light sits against the lit level round it.

For each still (a frame of the dive or the rise, beauty view) the frame's camera from geometry.json gives the
gnomonic patch coordinates of every ground pixel. Two bands along the rim of the plate of --width-deg are compared:
inside (the plate at full weight, where the bake matched it to the old land) and outside (the lit level). Printed:
the mean colour of both bands in linear values and the ratio outside over inside per channel, the factor by which
the gain of the own levels (src/stops/mars/near.json ownGain) of that height has to be multiplied.
  python3 assets-src/mars/place/owngain.py --kind dive --width-deg 8.5 --stills out/work/place/view/c0-%d.png --frames 2412,2415
With --lit the measure is a pair: --stills rendered with one plate of --width-deg as the deepest level with its own
light, --lit the same frames with the same land as a lit level (texel_of(scene_of(look) / light)). The ratio lit
over own inside the plate (r under --within) is the gain that makes the own plate sit as the lit land would.
"""
import argparse
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--kind', default='dive')
ap.add_argument('--width-deg', type=float, default=8.5)
ap.add_argument('--stills', required=True)
ap.add_argument('--frames', required=True)
ap.add_argument('--inside', default='0.66,0.84')
ap.add_argument('--outside', default='1.04,1.22')
ap.add_argument('--lit', default='')
ap.add_argument('--within', type=float, default=0.8)
ap.add_argument('--geometry', default='out/work/place/geometry.json')
a = ap.parse_args()
g = geom.load(a.geometry)
frames = {f['frame']: f for f in g[a.kind]['frames']}
i0, i1 = [float(v) for v in a.inside.split(',')]
o0, o1 = [float(v) for v in a.outside.split(',')]
ht = geom.half_tan(a.width_deg)
for frame in [int(v) for v in a.frames.split(',')]:
    img = cv2.imread(a.stills % frame, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255
    H, W = img.shape[:2]
    f = frames[frame]
    cam = geom.Camera(f, W, H)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    pts, ok = cam.hit(cam.rays(xs + 0.5, ys + 0.5))
    ge, gn, dn = geom.to_patch(pts)
    r = np.maximum(np.abs(ge), np.abs(gn)) / ht
    lin = geom.to_linear(img)
    ok = ok & (dn > 0.3)
    if a.lit:
        other = geom.to_linear(cv2.imread(a.lit % frame, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255)
        use = ok & (r < a.within)
        if use.sum() < 500:
            print('%d height %.4f: too few pixels' % (frame, f['height']))
            continue
        mo, ml = lin[use].mean(axis=0), other[use].mean(axis=0)
        print('%d height %.5f: own %s lit %s ratio %s (pixels %d)' % (frame, f['height'], np.round(mo, 4), np.round(ml, 4), np.round(ml / mo, 3), use.sum()))
        continue
    ins = ok & (r > i0) & (r < i1)
    out = ok & (r > o0) & (r < o1)
    if ins.sum() < 500 or out.sum() < 500:
        print('%d height %.4f: too few pixels (inside %d, outside %d)' % (frame, f['height'], ins.sum(), out.sum()))
        continue
    mi, mo = lin[ins].mean(axis=0), lin[out].mean(axis=0)
    print('%d height %.4f: inside %s outside %s ratio %s (pixels %d, %d)' % (frame, f['height'], np.round(mi, 4), np.round(mo, 4), np.round(mo / mi, 3), ins.sum(), out.sum()))
