import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT, WORK, lum

lay = json.loads((ROOT / "src/stops/saturn/layout.json").read_text())
close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
field = np.load(WORK / "layout.npy")
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg")).astype(np.float32) / 255
H, W = img.shape[:2]
k = (lay["height"] / 2) / np.tan(np.radians(lay["vfovDeg"]) / 2) / ((H / 2) / np.tan(np.radians(close["vfov"]) / 2))
xs, ys = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
lam = cv2.remap(field, ((xs - W / 2) * k + lay["width"] / 2 - 0.5).astype(np.float32), ((ys - H / 2) * k + lay["height"] / 2 - 0.5).astype(np.float32), cv2.INTER_CUBIC)
np.save(WORK / "layout-approved.npy", lam.astype(np.float32))
STEP = 0.004
b = np.floor((lam + 1.2) / STEP).astype(int)
nb = int(3.6 / STEP)
ok = (b >= 0) & (b < nb)
prof = np.zeros((nb, 3), np.float32)
order = np.argsort(b[ok])
vals = img[ok][order]
bs = b[ok][order]
starts = np.searchsorted(bs, np.arange(nb))
ends = np.searchsorted(bs, np.arange(nb), side="right")
for i in range(nb):
    if ends[i] - starts[i] > 20:
        prof[i] = np.percentile(vals[starts[i]:ends[i]], 60, axis=0)
rec = np.zeros_like(img)
rec[ok] = prof[b[ok]]
both = np.vstack([cv2.resize(img, (1100, 619), interpolation=cv2.INTER_AREA), cv2.resize(rec, (1100, 619), interpolation=cv2.INTER_AREA)])
cv2.imwrite(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else "layout-check.jpg")), (both * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
lp = lum(prof[:, ::-1])
print(" ".join(f"{-1.2 + i * STEP:.2f}:{lp[i]:.2f}" for i in range(0, nb, 12)))
