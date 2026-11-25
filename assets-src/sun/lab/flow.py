# The flow inside the cells of a clip drawn with a still eye (clip.ts --hold K): is the grain seen to run outward
# from a cell's core? Dense optical flow between pictures a few capture frames apart, in the near rows; the cells
# are the bright pieces between the dark lanes, the core of a cell its brightness weighted middle; the flow of a
# cell, less the cell's own mean drift, is projected on the way from the core outward. A cell that only mottles
# gives zero, a cell whose grain runs outward a positive number.
#   python3 assets-src/sun/lab/flow.py FOLDER [first row] [capture frames apart]
import glob, sys
import cv2
import numpy as np
from scipy import ndimage

folder = sys.argv[1]
top = int(sys.argv[2]) if len(sys.argv) > 2 else 700
apart = int(sys.argv[3]) if len(sys.argv) > 3 else 4
files = sorted(glob.glob(folder + '/k*.png'))
out = []
per = []
for k in range(0, len(files) - apart, max((len(files) - apart) // 6, 1)):
    a = cv2.imread(files[k]).max(axis=2)[top:1060].astype(np.float32)
    b = cv2.imread(files[k + apart]).max(axis=2)[top:1060].astype(np.float32)
    fl = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 4, 25, 3, 7, 1.5, 0) / (apart / 2)
    soft = cv2.GaussianBlur(a, (0, 0), 3)
    wide = cv2.GaussianBlur(a, (0, 0), 30)
    body = ndimage.binary_opening(soft > 0.8 * wide, iterations=3)
    lab, n = ndimage.label(body)
    yy, xx = np.mgrid[0 : a.shape[0], 0 : a.shape[1]]
    for i, sl in enumerate(ndimage.find_objects(lab)):
        m = lab[sl] == i + 1
        size = int(m.sum())
        if size < 1200 or size > 60000:
            continue
        wgt = np.where(m, soft[sl] ** 4, 0)
        cy = (wgt * yy[sl]).sum() / wgt.sum()
        cx = (wgt * xx[sl]).sum() / wgt.sum()
        dy = yy[sl][m] - cy
        dx = xx[sl][m] - cx
        r = np.hypot(dx, dy)
        keep = r > 0.25 * np.sqrt(size / np.pi)
        if keep.sum() < 200:
            continue
        fx = fl[sl][..., 0][m]
        fy = fl[sl][..., 1][m]
        fx = fx - fx.mean()
        fy = fy - fy.mean()
        rad = (fx * dx + fy * dy)[keep] / r[keep]
        per.append(float(rad.mean()))
        out.append((float(rad.mean()), size))
per = np.array(per)
print('cells read', len(per), 'pictures', len(files), 'rows from', top, 'capture frames apart', apart)
print('radial flow from the core, px a film frame: mean %.3f, median %.3f, quartiles %.3f %.3f, share of cells outward %.2f' % (per.mean(), np.median(per), np.percentile(per, 25), np.percentile(per, 75), (per > 0).mean()))
print('standard error of the mean %.3f' % (per.std() / np.sqrt(len(per))))
