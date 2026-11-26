"""The map's own ground in the frame of the first level, one map texel to a pixel at the spot, for assets-src/shared/globe-levels.py:

  python3 assets-src/mercury/place/maplevel.py OUT.png [MAP.jpg]
  python3 assets-src/shared/globe-levels.py --dir DIR --level map-76.png:76 --level patch-1.jpg:76
"""
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import mosaic as M
import plates as P

wide = P.SPEC['oneBody']['parent']['widthDeg']
src = np.asarray(Image.open(sys.argv[2] if len(sys.argv) > 2 else P.PUBLIC / 'full/wrap-color.jpg').convert('RGB'))
h, w = src.shape[:2]
size = int(round(2 * M.half(wide) / (2 * math.pi / w)))
gx, gy = M.grid((0, 0), wide, size)
d = M.dirs(gx, gy)
u = (np.arctan2(d[..., 0], d[..., 2]) / (2 * math.pi) + 0.5) * w - 0.5
v = (0.5 - np.arcsin(np.clip(d[..., 1], -1, 1)) / math.pi) * h - 0.5
Image.fromarray(cv2.remap(src, u.astype(np.float32), v.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)).save(sys.argv[1])
print(sys.argv[1], size)
