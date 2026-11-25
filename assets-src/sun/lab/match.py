"""How far a render of film frame 90 lies from the approved close image: the mean absolute difference of the
three channels in levels of 255, over the whole frame and over the near ground (rows from 0.72 of the height).
usage: python3 assets-src/sun/lab/match.py RENDER.png [RENDER.png ...]"""
import sys
import numpy as np
from PIL import Image

for path in sys.argv[1:]:
    render = Image.open(path).convert('RGB')
    w, h = render.size
    approved = Image.open('references/approved/sun-close.jpg').convert('RGB').resize((w, h), Image.LANCZOS)
    d = np.abs(np.asarray(render).astype(np.float32) - np.asarray(approved).astype(np.float32))
    print(path, 'whole frame', round(float(d.mean()), 3), 'near ground', round(float(d[int(h * 0.72):].mean()), 3))
