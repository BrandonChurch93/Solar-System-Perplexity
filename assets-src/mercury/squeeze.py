import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image
import mozjpeg_lossless_optimization as moz

ROOT = Path('public/assets/mercury')


def picture(data):
    return np.asarray(Image.open(io.BytesIO(data)))


saved = 0
for path in sorted(ROOT.glob('*/*.jpg')):
    before = path.read_bytes()
    after = moz.optimize(before)
    if not np.array_equal(picture(before), picture(after)):
        sys.exit(str(path) + ' does not decode to the same picture')
    if len(after) < len(before):
        path.write_bytes(after)
        saved += len(before) - len(after)
    print('%s %.3f MB to %.3f MB' % (path, len(before) / 1e6, len(after) / 1e6))
print('saved %.3f MB' % (saved / 1e6))
