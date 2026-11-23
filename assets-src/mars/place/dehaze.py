"""Takes the distance haze out of a place picture (the close side at T) so that it can be laid back as land.

The picture is read as scene values. For every pixel of the ground the distance from the twin on the sphere is known.
The haze layer is the dark envelope of the picture (a low percentile) on a grid of distance and picture column,
smoothed. The land is (picture - k * envelope) / t with t = 1 - k * envelope / far envelope of that column; k is lowered
per pixel so that every channel keeps keepShare of its value (no hue turn in the shadows).
Written: the land as a 16 bit picture in the patch encoding, and t as a grey picture (both in the picture's layout).
  python3 assets-src/mars/place/dehaze.py --kind dive --out out/work/place/dehaze/dive
"""
import argparse
import json
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--kind', default='dive')
ap.add_argument('--dump', default='out/work/place/dump')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--out', required=True)
a = ap.parse_args()
cfg = json.load(open(a.config))['dehaze']
g = geom.load(a.geometry)
k = g[a.kind]
lay = k['layout']
W, H = g['format']['width'], g['format']['height']
cam = geom.Camera(k['twin'], W, H)
pic = cv2.imread('%s/%s-image.png' % (a.dump, a.kind)).astype(np.float32) / 255
S = geom.scene_of(pic)
ph, pw = S.shape[:2]
ys, xs = np.mgrid[0:ph, 0:pw].astype(np.float32)
fx = (xs + 0.5 - lay['shift']) / lay['scale'] - lay['left']
fy = (ys + 0.5 - lay['shift']) / lay['scale'] - lay['top']
pts, ok = cam.hit(cam.rays(fx, fy))
up = cam.p / np.linalg.norm(cam.p)
dist = np.degrees(np.arccos(np.clip(pts @ up, -1, 1))).astype(np.float32)
del pts
far = float(dist[ok].max())
edges = np.geomspace(cfg['nearDeg'], far, cfg['distBins'] + 1)
edges[0] = 0
ncol = cfg['columnBins']
env = np.zeros((cfg['distBins'], ncol, 3), np.float32)
di = np.clip(np.searchsorted(edges, dist) - 1, 0, cfg['distBins'] - 1)
ci = np.clip((xs / pw * ncol).astype(np.int32), 0, ncol - 1)
for i in range(cfg['distBins']):
    for j in range(ncol):
        m = ok & (di == i) & (ci == j)
        env[i, j] = np.percentile(S[m], cfg['percentile'], axis=0) if m.sum() > 200 else np.nan
for j in range(ncol):
    for c in range(3):
        col = env[:, j, c]
        good = ~np.isnan(col)
        env[:, j, c] = np.interp(np.arange(len(col)), np.flatnonzero(good), col[good])
env = cv2.GaussianBlur(env, (0, 0), cfg['smoothBins'], borderType=cv2.BORDER_REPLICATE)
env = np.maximum.accumulate(env, axis=0) if cfg['monotone'] else env
tail = max(1, cfg['distBins'] // 6)
ainf = env[-tail:].mean(axis=0)
mid = np.sqrt(np.maximum(edges[:-1], cfg['nearDeg'] * 0.5) * edges[1:])
u = np.interp(dist, mid, np.arange(len(mid))).astype(np.float32)
v = ((xs + 0.5) / pw * ncol - 0.5).astype(np.float32)
E = cv2.remap(env, v, u, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
A = cv2.remap(np.repeat(ainf[None], 2, axis=0), v, np.zeros_like(u), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
kk = cfg['strength']
t = np.clip(1 - kk * (E / np.maximum(A, 1e-6)).mean(axis=2), 0, 1)
t = np.where(ok, t, 0).astype(np.float32)
keep = cfg['keepShare']
kpix = np.minimum(kk, ((1 - keep) * S / np.maximum(E, 1e-6)).min(axis=2))[..., None]
land = np.clip((S - kpix * E) / np.maximum(t, cfg['leastT'])[..., None], 0, None)
land[~ok] = 0
cv2.imwrite(a.out + '-land.png', np.round(geom.texel_of(land) * 65535).astype(np.uint16))
cv2.imwrite(a.out + '-t.png', np.round(np.dstack([t, t, t]) * 65535).astype(np.uint16))
np.save(a.out + '-env.npy', env)
for d in (0.15, 0.3, 0.5, 0.7, 1.0, 1.5, 2.5):
    row = (ok & (np.abs(dist - d) < 0.02 * d + 0.005))
    print('%s at %.2f deg: t %.3f, haze (r g b) %s' % (a.kind, d, t[row].mean(), np.round(kk * E[row].mean(axis=0)[::-1], 4)))
