"""The check picture of a handover: the globe side with the place picture off beside the close side, both at T,
and what differs on the ground (mean and 95th percentile of the absolute difference of 255, per channel mean).
  python3 assets-src/mars/place/check.py --globe g-beauty.png --close c-beauty.png --out check.jpg [--kind dive]
"""
import argparse
import cv2
import numpy as np
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--globe', required=True)
ap.add_argument('--close', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--kind', default='dive')
ap.add_argument('--geometry', default='out/work/place/geometry.json')
ap.add_argument('--label', default='')
a = ap.parse_args()
g = geom.load(a.geometry)
W, H = g['format']['width'], g['format']['height']
cam = geom.Camera(g[a.kind]['twin'], W, H)
G = cv2.imread(a.globe, cv2.IMREAD_COLOR)
C = cv2.imread(a.close, cv2.IMREAD_COLOR)
py, px = np.mgrid[0:H, 0:W]
_, hit = cam.hit(cam.rays(px + 0.5, py + 0.5))
d = np.abs(G.astype(np.float32) - C.astype(np.float32))
on = d[hit]
text = 'ground: mean %.1f, 95th percentile %.1f of 255 (b %.1f g %.1f r %.1f)' % (on.mean(), np.percentile(on.mean(axis=1), 95), *on.mean(axis=0))
diff = np.clip(d * 4, 0, 255).astype(np.uint8)
diff[~hit] = 0
small = lambda x: cv2.resize(x, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
bar = np.full((34, W // 2 * 3, 3), 12, np.uint8)
cv2.putText(bar, 'globe side, place picture off   |   close side   |   difference x 4 on the ground.   %s   %s' % (text, a.label), (8, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1, cv2.LINE_AA)
cv2.imwrite(a.out, np.vstack([np.hstack([small(G), small(C), small(diff)]), bar]), [cv2.IMWRITE_JPEG_QUALITY, 93])
print(text)
