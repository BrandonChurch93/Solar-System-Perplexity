"""The web set's dive patch levels, written from the full set's files.

Why this file exists: bake.py wrote the web levels with Image.resize on an RGBA picture. That call
multiplies the colour by the opacity before it averages and divides it out after, so wherever the cirrus
opacity is 0 the deck colour came back as black. The patches hold the deck in RGB and the cirrus in A,
and the deck is read where A is 0, so the web set's globe went close to black under every level.
Here the four channels are averaged as they are (2 by 2 texels, INTER_AREA), the way wrap/assemble.py
and wrap/mend.py write their web files.

Run: python3 assets-src/neptune/patches/web.py
"""
import glob
import os

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
OUT = 'public/assets/neptune'
NAMES = sorted(os.path.basename(p) for p in glob.glob(os.path.join(OUT, 'full', 'patch-*.webp')))

for name in NAMES:
    rgba = np.asarray(Image.open(os.path.join(OUT, 'full', name)).convert('RGBA'))
    h, w = rgba.shape[:2]
    small = cv2.resize(rgba, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    Image.fromarray(small, 'RGBA').save(os.path.join(OUT, 'web', name), quality=88, method=4, exact=True)
    back = np.asarray(Image.open(os.path.join(OUT, 'web', name)).convert('RGBA')).astype(np.float32)
    clear = back[..., 3] == 0
    ref = small.astype(np.float32)
    print('%s %dx%d  deck where opacity is 0: web %s, full halved %s  mean abs diff of all texels: rgb %.2f, a %.2f' % (
        name, w // 2, h // 2, np.round(back[clear][:, :3].mean(0), 1), np.round(ref[clear][:, :3].mean(0), 1),
        np.abs(back[..., :3] - ref[..., :3]).mean(), np.abs(back[..., 3] - ref[..., 3]).mean()))
