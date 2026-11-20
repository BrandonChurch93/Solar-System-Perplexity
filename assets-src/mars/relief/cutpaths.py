import json, sys, numpy as np, cv2
from skimage.graph import route_through_array
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H
img = cv2.imread('references/approved/mars-close.jpg').astype(np.float32) / 255
dist = np.load('out/work/dist0.npy')
L = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)[..., 0] / 100
gc = np.hypot(cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 1.0), cv2.CV_32F, 1, 0), cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 1.0), cv2.CV_32F, 0, 1))
ld = np.log(dist)
gd = np.hypot(cv2.Sobel(cv2.GaussianBlur(ld, (0, 0), 2.0), cv2.CV_32F, 1, 0), cv2.Sobel(cv2.GaussianBlur(ld, (0, 0), 2.0), cv2.CV_32F, 0, 1))
gc /= np.percentile(gc, 99); gd /= np.percentile(gd, 99)
gd = cv2.GaussianBlur(gd, (0, 0), 3)
cost = 1.0 / (0.02 + 0.6 * np.clip(gc, 0, 2) * np.clip(gd * 2, 0, 1) + 0.4 * np.clip(gd, 0, 2))
cfg = json.load(open('assets-src/mars/relief/cuts.json'))
paths = {}
for name, pts in cfg['cuts'].items():
    full = []
    for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
        p, _ = route_through_array(cost, (int(y0), int(x0)), (int(y1), int(x1)), fully_connected=True, geometric=True)
        full += p if not full else p[1:]
    paths[name] = [[int(x), int(y)] for y, x in full]
json.dump(paths, open('out/work/cutpaths.json', 'w'))
vis = (img * 255).astype(np.uint8).copy()
for name, p in paths.items():
    cv2.polylines(vis, [np.array(p, np.int32)], False, (0, 255, 0), 1)
    for x, y in cfg['cuts'][name]: cv2.circle(vis, (int(x), int(y)), 4, (255, 0, 255), 1)
cv2.imwrite('out/work/cutvis.png', vis)
