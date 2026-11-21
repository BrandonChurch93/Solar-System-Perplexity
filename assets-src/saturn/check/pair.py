import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import ROOT

view, film, out = sys.argv[1], sys.argv[2], sys.argv[3]
width = int(sys.argv[4]) if len(sys.argv) > 4 else 1100
ref = cv2.imread(str(ROOT / "references/approved" / ("saturn-hero.png" if view == "hero" else "saturn-close.jpg")))
img = cv2.imread(film)
fit = lambda a: cv2.resize(a, (width, round(width * 9 / 16)), interpolation=cv2.INTER_AREA)
cv2.imwrite(out, np.vstack([fit(ref), fit(img)]), [cv2.IMWRITE_JPEG_QUALITY, 88])
