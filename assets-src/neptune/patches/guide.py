import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import gnomon

width = float(sys.argv[1]) if len(sys.argv) > 1 else 24
size = 2048
os.makedirs(gnomon.WORK, exist_ok=True)
img = gnomon.composite(gnomon.resample(gnomon.load_wrap(), width, size))
Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(gnomon.WORK, 'guide-%g.png' % width))
print('guide-%g.png' % width)
