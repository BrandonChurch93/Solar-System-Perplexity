import json, sys, numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H
cfg = json.load(open('assets-src/mars/relief/cuts.json'))
paths = json.load(open('out/work/cutpaths.json'))
out = {}
for k in ('L1', 'L2'):
    poly = np.array(paths[k] + cfg['joined'][k][1:-1], np.int32)
    reg = np.zeros((H, W), np.uint8); cv2.fillPoly(reg, [poly], 1)
    cut = np.zeros((H, W), np.uint8); cv2.polylines(cut, [np.array(paths[k], np.int32)], False, 1, 1)
    dcut = ndi.distance_transform_edt(1 - cut).astype(np.float32)
    np.save(f'out/work/{k}-region.npy', reg); np.save(f'out/work/{k}-dcut.npy', dcut)
    out[k] = int(reg.sum())
print(out)
img = cv2.imread('references/approved/mars-close.jpg')
paint_in = img.copy()
r1 = np.load('out/work/L1-region.npy'); r2 = np.load('out/work/L2-region.npy'); d2 = np.load('out/work/L2-dcut.npy')
m = (r1 > 0) | ((r2 > 0) & (d2 < 300))
m = cv2.dilate(m.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
np.save('out/work/paint-mask.npy', m)
paint_in[m] = (255, 0, 255)
cv2.imwrite('out/work/paint-input.png', paint_in)
cv2.imwrite('out/work/paint-mask.png', m.astype(np.uint8) * 255)
