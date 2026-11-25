"""How far a render of the terrain view lies from the approved close image: the mean absolute difference of the
three channels in levels of 255, over the whole frame, over the near ground (rows from 0.72 of the height), and
over four bands of rows (0 to 0.3, 0.3 to 0.5, 0.5 to 0.72, 0.72 to 1), with the bands' weights in the whole.
usage: python3 assets-src/sun/lab/match.py RENDER.png [RENDER.png ...]"""
import sys
import numpy as np
from PIL import Image

BANDS = [0.0, 0.3, 0.5, 0.72, 1.0]
for path in sys.argv[1:]:
    render = Image.open(path).convert('RGB')
    w, h = render.size
    approved = Image.open('references/approved/sun-close.jpg').convert('RGB').resize((w, h), Image.LANCZOS)
    d = np.abs(np.asarray(render).astype(np.float32) - np.asarray(approved).astype(np.float32))
    rows = [int(h * b) for b in BANDS]
    bands = [round(float(d[rows[i]:rows[i + 1]].mean()), 3) for i in range(4)]
    print(path, 'whole frame', round(float(d.mean()), 3), 'near ground', round(float(d[rows[3]:].mean()), 3), 'bands', bands)
